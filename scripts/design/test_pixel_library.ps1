param([int]$DebugPort=9332,[string]$BaseUrl='http://127.0.0.1:8817',[string]$OutputDirectory='outputs/ux')
$ErrorActionPreference='Stop'
. "$PSScriptRoot/cdp_helpers.ps1"
$outputPath=[IO.Path]::GetFullPath((Join-Path (Get-Location) $OutputDirectory))
[void][IO.Directory]::CreateDirectory($outputPath)
$checks=New-Object Collections.Generic.List[object]
function Check([string]$Name,[string]$Expression) {
    $passed=Invoke-BrowserJs "Boolean($Expression)"
    $checks.Add([PSCustomObject]@{name=$Name;passed=[bool]$passed})
    if(!$passed){ throw "FAIL: $Name" }
    Write-Output "PASS $Name"
}
function Js([string]$Expression){Invoke-BrowserJs ('(async()=>{'+$Expression+'})()') | Out-Null}
function Navigate([string]$Path) {
    Send-Cdp 'Page.navigate' @{url="$BaseUrl/$Path"} | Out-Null
    Start-Sleep -Milliseconds 400
    Js 'new Promise(resolve => document.readyState === "complete" ? resolve(true) : window.addEventListener("load", () => resolve(true), {once:true}))'
}
function Screen([string]$Name,[int]$Width=1440,[int]$Height=1000) {
    Send-Cdp 'Emulation.setDeviceMetricsOverride' @{width=$Width;height=$Height;deviceScaleFactor=1;mobile=$false} | Out-Null
    Js 'window.scrollTo(0,0)'
    Start-Sleep -Milliseconds 100
    Save-BrowserScreenshot (Join-Path $outputPath ($Name+'.png'))
}
Connect-Cdp -Port $DebugPort
try {
    Send-Cdp 'Page.enable' @{} | Out-Null
    Send-Cdp 'Page.addScriptToEvaluateOnNewDocument' @{source='window.__qaErrors=[];window.addEventListener("error",e=>__qaErrors.push(e.message));window.addEventListener("unhandledrejection",e=>__qaErrors.push(String(e.reason)));'} | Out-Null
    foreach($variant in @('a','b')) {
        Send-Cdp 'Emulation.setDeviceMetricsOverride' @{width=1440;height=1000;deviceScaleFactor=1;mobile=$false} | Out-Null
        Navigate "$variant.html"
        Check "$variant initial render and RTL" 'document.documentElement.dir === "rtl" && document.querySelector("main h1") !== null'
        Check "$variant no primary dropdowns" 'document.querySelectorAll("select").length === 0'
        Screen "$variant-home-desktop"
        Js 'document.querySelector("[data-route=library]").click()'
        Check "$variant library has 3 books" 'document.querySelectorAll(".book-card").length === 3'
        Js 'const q=document.querySelector("#book-search");q.value="צרפתית";q.dispatchEvent(new Event("input",{bubbles:true}))'
        Check "$variant book search" 'document.querySelectorAll(".book-card").length===1 && document.querySelector(".book-card h3").textContent.includes("גן")'
        Js 'const q=document.querySelector("#book-search");q.value="ZZZZZZ";q.dispatchEvent(new Event("input",{bubbles:true}))'
        Check "$variant empty search recovery" 'document.querySelector("[data-action=clear-search]") !== null'
        Js 'document.querySelector("[data-action=clear-search]").click();document.querySelector("[data-filter=progress]").click()'
        Check "$variant status filter" 'document.querySelectorAll(".book-card").length===1 && document.querySelector(".book-card h3").textContent.includes("מסעות")'
        Js 'document.querySelector("[data-route=new]").click()'
        Check "$variant file required" 'document.querySelector("#next-button").disabled'
        # Construct an in-memory File and fire the real file-input change event; no disk file is uploaded.
        Js 'const dt=new DataTransfer();dt.items.add(new File(["invalid"],"example.txt"));const input=document.querySelector("#document-file");input.files=dt.files;input.dispatchEvent(new Event("change",{bubbles:true}))'
        Check "$variant rejects invalid file type" '!document.querySelector("#file-error").hidden && document.querySelector("#next-button").disabled'
        Js 'const dt=new DataTransfer();dt.items.add(new File(["%PDF-demo"],"local-demo.pdf"));const input=document.querySelector("#document-file");input.files=dt.files;input.dispatchEvent(new Event("change",{bubbles:true}))'
        Check "$variant accepts file metadata" 'document.querySelector(".file-name").textContent.includes("local-demo.pdf") && !document.querySelector("#next-button").disabled'
        Js 'document.querySelector("[data-action=sample]").click()'
        if($variant -eq 'b') {Js 'document.querySelector("[data-action=next-step]").click()'}
        Js 'document.querySelector("[name=profile][value=literary]").click();document.querySelector("#quality").focus()'
        Send-Cdp 'Input.dispatchKeyEvent' @{type='keyDown';key='End';code='End';windowsVirtualKeyCode=35} | Out-Null
        Send-Cdp 'Input.dispatchKeyEvent' @{type='keyUp';key='End';code='End';windowsVirtualKeyCode=35} | Out-Null
        Check "$variant native slider keyboard" 'document.querySelector("#quality").value==="2"'
        Js 'document.querySelectorAll("[data-quality]")[2].click()'
        Check "$variant visible profile and review choices" 'document.querySelector("#sum-profile").textContent.includes("ספרותי") && document.querySelector("#sum-quality").textContent==="מעמיק"'
        Js 'const n=document.querySelector("#budget-number");n.value="0";n.dispatchEvent(new Event("input",{bubbles:true}));document.querySelector("#next-button").click()'
        Check "$variant rejects invalid budget" '!document.querySelector("#budget-error").hidden && document.activeElement.id === "budget-number"'
        Js 'const n=document.querySelector("#budget-number");n.value="7.25";n.dispatchEvent(new Event("input",{bubbles:true}))'
        Check "$variant exact budget input" 'document.querySelector("#sum-budget").textContent==="$7.25"'
        Js 'document.querySelector(".advanced").open=true;const terms=document.querySelector("#terms");terms.value="memory = זיכרון";terms.dispatchEvent(new Event("input",{bubbles:true}));document.querySelector("[data-action=save-terms]").click()'
        Check "$variant terms local feedback" '!document.querySelector("#toast").hidden'
        Screen "$variant-config-desktop"
        Screen "$variant-config-mobile" 390 844
        Check "$variant mobile configuration no overflow" 'document.documentElement.scrollWidth <= innerWidth+1'
        if($variant -eq 'b') {Js 'document.querySelector("[data-action=next-step]").click()'}
        Js 'document.querySelector("[data-action=confirm-job]").focus();document.querySelector("[data-action=confirm-job]").click()'
        Check "$variant confirmation explicit demo" 'document.querySelector("#modal").open && document.querySelector("#modal").textContent.includes("לא יתבצע תרגום אמיתי")'
        for($tabIndex=0;$tabIndex -lt 5;$tabIndex++) {
            Send-Cdp 'Input.dispatchKeyEvent' @{type='keyDown';key='Tab';code='Tab';windowsVirtualKeyCode=9} | Out-Null
            Send-Cdp 'Input.dispatchKeyEvent' @{type='keyUp';key='Tab';code='Tab';windowsVirtualKeyCode=9} | Out-Null
        }
        Check "$variant modal keyboard focus containment" 'document.querySelector("#modal").contains(document.activeElement)'
        Send-Cdp 'Input.dispatchKeyEvent' @{type='keyDown';key='Escape';code='Escape';windowsVirtualKeyCode=27} | Out-Null
        Send-Cdp 'Input.dispatchKeyEvent' @{type='keyUp';key='Escape';code='Escape';windowsVirtualKeyCode=27} | Out-Null
        Check "$variant Escape dismisses and restores focus" '!document.querySelector("#modal").open && document.activeElement.dataset.action === "confirm-job"'
        Js 'document.querySelector("[data-action=confirm-job]").click();document.querySelector("[data-action=start-job]").click()'
        Check "$variant simulation started" 'document.querySelector("#job-progress")!==null && document.querySelector("#job-pill").textContent.includes("פועלת")'
        Js 'document.querySelector("#pause-job").click();window.__pausedProgress=document.querySelector("#job-progress").value'
        Start-Sleep -Milliseconds 750
        Check "$variant pause holds progress" 'document.querySelector("#job-progress").value===window.__pausedProgress && document.querySelector("#pause-job").textContent.includes("להמשיך")'
        Js 'document.querySelector("#pause-job").click()'
        Start-Sleep -Milliseconds 750
        Check "$variant resume advances" 'document.querySelector("#job-progress").value > window.__pausedProgress'
        Screen "$variant-progress-mobile" 390 844
        Js 'document.querySelector("[data-action=finish-demo]").click()'
        Check "$variant result remains draft" 'document.querySelector("#review-target")!==null && document.querySelector(".result-layout .pill").textContent.includes("לא אושרה")'
        Js 'document.querySelector("#review-target").value="עריכת בדיקה <script>unsafe</script> & נוסח";document.querySelector("[data-action=save-edit]").click();document.querySelector("[data-action=next-segment]").click();document.querySelector("[data-action=prev-segment]").click()'
        Check "$variant edit preserved across segments" 'document.querySelector("#review-target").value.includes("עריכת בדיקה <script>")'
        Check "$variant no markup injection" 'document.querySelector("script:not([src])")===null && !window.unsafe'
        Js 'document.querySelector("[data-action=export]").click()'
        Check "$variant sample export dialog" 'document.querySelector("#modal").textContent.includes("אינו תרגום של קובץ") && document.querySelector("[data-action=download-sample]")!==null'
        # Browser captures downloaded data URLs through a temporary click interceptor without writing to user Downloads.
        Js 'window.__download=null;window.__anchorClick=HTMLAnchorElement.prototype.click;HTMLAnchorElement.prototype.click=function(){window.__download={name:this.download,href:this.href}};document.querySelector("[data-action=download-sample]").click();HTMLAnchorElement.prototype.click=window.__anchorClick'
        Check "$variant sample download generated" 'window.__download?.name==="library-prototype-sample.html" && window.__download.href.startsWith("blob:")'
        Js 'window.__exportHtml=await (await fetch(window.__download.href)).text()'
        Check "$variant exported text escaped and unapproved" 'window.__exportHtml.includes("&lt;script&gt;unsafe&lt;/script&gt;") && window.__exportHtml.includes("טיוטה לא מאושרת")'
        Screen "$variant-review-desktop"
        Screen "$variant-review-mobile" 390 844
        Check "$variant mobile review no overflow" 'document.documentElement.scrollWidth<=innerWidth+1'
        Js 'document.querySelector("[data-route=learning]").click();document.querySelector(".learning-controls").open=true;document.querySelector("[name=learning-language][value=ar]").click()'
        Check "$variant Arabic selection" 'document.querySelector(".gloss-word").lang==="ar" && document.querySelector(".gloss-word").textContent==="حديقة"'
        Js 'const e=document.querySelector("#effort");e.value="2";e.dispatchEvent(new Event("input",{bubbles:true}))'
        Check "$variant effort slider updates readable label" 'document.querySelector("#effort-help").textContent.includes("30%") && document.querySelector("#effort").getAttribute("aria-valuetext")==="אתגר"'
        Js 'document.querySelector("[data-action=next-chapter]").click();document.querySelector(".gloss-word").click()'
        Check "$variant chapter and gloss" 'document.querySelector("#chapter-number").value==="2" && !document.querySelector("#gloss-box").hidden'
        Js 'document.querySelector("[data-action=close-gloss]").click();document.querySelector("[data-action=complete-chapter]").click()'
        Check "$variant chapter completion" 'document.querySelector("[data-action=complete-chapter]").disabled && document.querySelector(".learning-progress .pill").textContent.includes("1")'
        Js 'document.querySelector("#gloss-enabled").click();document.querySelector("[data-action=next-chapter]").click()'
        Check "$variant gloss preference persists" '!document.querySelector("#gloss-enabled").checked'
        Screen "$variant-learning-desktop"
        Screen "$variant-learning-mobile" 390 844
        Check "$variant mobile learning no overflow" 'document.documentElement.scrollWidth<=innerWidth+1'
        Js 'document.querySelector("[data-route=settings]").click();document.querySelector("#art-enabled").click()'
        Check "$variant quiet art preference" 'document.body.classList.contains("no-art")'
        Js 'document.querySelector("[data-action=connection]").click()'
        Check "$variant no credential collection" 'document.querySelector("#modal").textContent.includes("אין להזין מפתחות") && document.querySelectorAll("input[type=password]").length===0'
        Js 'document.querySelector("[data-action=close-modal]").click();document.querySelector("[data-route=library]").click()'
        Screen "$variant-library-320" 320 800
        Check "$variant library at 320px no overflow" 'document.documentElement.scrollWidth<=innerWidth+1'
        Check "$variant no script errors" 'window.__qaErrors.length===0'
        Check "$variant no external page resources" 'performance.getEntriesByType("resource").every(r=>r.name.startsWith(location.origin)||r.name.startsWith("blob:"))'
        Navigate "$variant.html"
        Js 'document.querySelector("[data-route=new]").click();document.querySelector("[data-action=sample]").click()'
        if($variant -eq 'b'){Js 'document.querySelector("[data-action=next-step]").click()'}
        Js 'document.querySelector("[name=target][value=en]").click()'
        if($variant -eq 'b'){Js 'document.querySelector("[data-action=next-step]").click()'}
        Js 'document.querySelector("[data-action=confirm-job]").click();document.querySelector("[data-action=start-job]").click();document.querySelector("[data-action=finish-demo]").click()'
        Check "$variant English target and direction" 'document.querySelector("#review-target").dir==="ltr" && document.querySelector("#review-target").value.startsWith("Memory") && document.querySelector(".review-columns section").lang==="he"'
    }
    Navigate 'index.html'
    Check 'comparison links both prototypes' 'document.querySelector("a[href=\"a.html\"]")!==null && document.querySelector("a[href=\"b.html\"]")!==null'
    Screen 'comparison-desktop'
    Screen 'comparison-mobile' 390 844
    Check 'comparison mobile no overflow' 'document.documentElement.scrollWidth<=innerWidth+1'
} finally {
    $script:CdpSocket.Dispose()
    $report=[PSCustomObject]@{time_utc=[DateTime]::UtcNow.ToString('o');checks=$checks.Count;passed=@($checks | Where-Object passed).Count;results=$checks}
    [IO.File]::WriteAllText((Join-Path $outputPath 'verification.json'),($report | ConvertTo-Json -Depth 8),[Text.UTF8Encoding]::new($false))
}
Write-Output "All $($checks.Count) browser checks passed."
