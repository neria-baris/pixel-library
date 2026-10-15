param([int]$Port = 8817)
$ErrorActionPreference = 'Stop'
$root = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../../design/pixel-library'))
$listener = [Net.Sockets.TcpListener]::new([Net.IPAddress]::Loopback, $Port)
$listener.Start()
Write-Host "Pixel library prototypes: http://127.0.0.1:$Port/ (Ctrl+C to stop)"
try {
    while ($true) {
        $client = $listener.AcceptTcpClient()
        $stream = $client.GetStream()
        $stream.ReadTimeout = 3000
        $status = 200
        $type = 'text/plain; charset=utf-8'
        try {
            $request = New-Object Text.StringBuilder
            while ($request.Length -lt 16384 -and !$request.ToString().Contains("`r`n`r`n")) {
                $value = $stream.ReadByte()
                if ($value -lt 0) { break }
                [void]$request.Append([char]$value)
            }
            $firstLine = $request.ToString().Split("`r`n")[0].Split(' ')
            $method = $firstLine[0]
            $relative = [Uri]::UnescapeDataString(($firstLine[1] -split '\?')[0]).TrimStart('/')
            if (!$relative) { $relative = 'index.html' }
            $path = [IO.Path]::GetFullPath((Join-Path $root $relative))
            if (!$path.StartsWith($root + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase) -or !(Test-Path -LiteralPath $path -PathType Leaf)) {
                $status = 404
                $bytes = [Text.Encoding]::UTF8.GetBytes('Not found')
            } elseif ($method -ne 'GET' -and $method -ne 'HEAD') {
                $status = 405
                $bytes = [Text.Encoding]::UTF8.GetBytes('Read-only preview')
            } else {
                $types = @{'.html'='text/html; charset=utf-8';'.css'='text/css; charset=utf-8';'.js'='text/javascript; charset=utf-8';'.svg'='image/svg+xml';'.png'='image/png';'.md'='text/plain; charset=utf-8'}
                $ext = [IO.Path]::GetExtension($path).ToLowerInvariant()
                $type = $types[$ext]
                if (!$type) { $type = 'application/octet-stream' }
                $bytes = [IO.File]::ReadAllBytes($path)
            }
            $header = [Text.Encoding]::ASCII.GetBytes("HTTP/1.1 $status Response`r`nContent-Type: $type`r`nContent-Length: $($bytes.Length)`r`nConnection: close`r`nCache-Control: no-store`r`nX-Content-Type-Options: nosniff`r`n`r`n")
            $stream.Write($header, 0, $header.Length)
            if ($method -ne 'HEAD') { $stream.Write($bytes, 0, $bytes.Length) }
        } catch { Write-Warning $_.Exception.Message }
        finally { $stream.Dispose(); $client.Close() }
    }
} finally { $listener.Stop() }
