# Local headless-browser verification helpers. No dependency installation required.
$script:CdpId = 0
function Connect-Cdp([int]$Port = 9331) {
    $tabs = Invoke-RestMethod "http://127.0.0.1:$Port/json/list"
    $target = $tabs | Where-Object type -eq 'page' | Select-Object -First 1
    if (!$target) { throw 'No headless Chrome test page found' }
    $script:CdpSocket = New-Object Net.WebSockets.ClientWebSocket
    $script:CdpSocket.Options.Proxy = $null
    $connectTimeout = New-Object Threading.CancellationTokenSource 10000
    try { [void]$script:CdpSocket.ConnectAsync([Uri]$target.webSocketDebuggerUrl, $connectTimeout.Token).GetAwaiter().GetResult() }
    finally { $connectTimeout.Dispose() }
}
function Send-Cdp([string]$Method, [hashtable]$Params = @{}) {
    $script:CdpId++
    $id = $script:CdpId
    $message = @{id=$id; method=$Method; params=$Params} | ConvertTo-Json -Depth 30 -Compress
    $bytes = [Text.Encoding]::UTF8.GetBytes($message)
    [void]$script:CdpSocket.SendAsync([ArraySegment[byte]]::new($bytes), [Net.WebSockets.WebSocketMessageType]::Text, $true, [Threading.CancellationToken]::None).GetAwaiter().GetResult()
    while ($true) {
        $stream = New-Object IO.MemoryStream
        do {
            $buffer = New-Object byte[] 65536
            $cts = New-Object Threading.CancellationTokenSource 15000
            try { $result = $script:CdpSocket.ReceiveAsync([ArraySegment[byte]]::new($buffer), $cts.Token).GetAwaiter().GetResult() }
            finally { $cts.Dispose() }
            $stream.Write($buffer, 0, $result.Count)
        } while (!$result.EndOfMessage)
        $reply = [Text.Encoding]::UTF8.GetString($stream.ToArray()) | ConvertFrom-Json
        $stream.Dispose()
        if ($reply.id -eq $id) {
            if ($reply.error) { throw ($reply.error | ConvertTo-Json -Compress) }
            return $reply.result
        }
    }
}
function Invoke-BrowserJs([string]$Expression) {
    $reply = Send-Cdp 'Runtime.evaluate' @{expression=$Expression;returnByValue=$true;awaitPromise=$true;userGesture=$true}
    if ($reply.exceptionDetails) { throw ($reply.exceptionDetails | ConvertTo-Json -Depth 8 -Compress) }
    return $reply.result.value
}
function Save-BrowserScreenshot([string]$Path) {
    $reply = Send-Cdp 'Page.captureScreenshot' @{format='png';captureBeyondViewport=$false}
    [IO.File]::WriteAllBytes($Path, [Convert]::FromBase64String($reply.data))
}
