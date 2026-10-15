param([int]$DebugPort=9332,[string]$BaseUrl='http://127.0.0.1:8817')
$ErrorActionPreference='Stop'
. "$PSScriptRoot/cdp_helpers.ps1"
$evidence=[IO.Path]::GetFullPath((Join-Path (Get-Location) 'docs/design/pixel-library/library-character'))
[void][IO.Directory]::CreateDirectory($evidence)
$results=New-Object Collections.Generic.List[object]
function Js([string]$Code){Invoke-BrowserJs ('(async()=>{'+$Code+'})()')|Out-Null}
function Check([string]$Name,[string]$Expression){
 $passed=[bool](Invoke-BrowserJs "Boolean($Expression)")
 $results.Add([PSCustomObject]@{name=$Name;passed=$passed})
 if(!$passed){throw "FAIL $Name"}; Write-Output "PASS $Name"
}
function Width([int]$Value,[int]$Height=1000){Send-Cdp 'Emulation.setDeviceMetricsOverride' @{width=$Value;height=$Height;deviceScaleFactor=1;mobile=$false}|Out-Null}
function Key([string]$Value,[int]$Virtual){
 Send-Cdp 'Input.dispatchKeyEvent' @{type='keyDown';key=$Value;code=$Value;windowsVirtualKeyCode=$Virtual}|Out-Null
 Send-Cdp 'Input.dispatchKeyEvent' @{type='keyUp';key=$Value;code=$Value;windowsVirtualKeyCode=$Virtual}|Out-Null
}
function Capture([string]$Name){Js 'document.querySelector("#toast").hidden=true;document.activeElement?.blur()'; Save-BrowserScreenshot (Join-Path $evidence ($Name+'.png'))}
function Navigate([string]$Page){Send-Cdp 'Page.navigate' @{url="$BaseUrl/$Page"}|Out-Null; Start-Sleep -Milliseconds 350}
Connect-Cdp -Port $DebugPort
try {
 Send-Cdp 'Page.enable' @{}|Out-Null
 Send-Cdp 'Page.addScriptToEvaluateOnNewDocument' @{source='window.__characterErrors=[];window.addEventListener("error",e=>__characterErrors.push(e.message));window.addEventListener("unhandledrejection",e=>__characterErrors.push(String(e.reason)));'}|Out-Null
 Width 1440 1280
 Navigate 'a.html'
 Check 'Browser instrumentation initialized' 'Array.isArray(window.__characterErrors)'
 Check 'Header always exposes key and model' 'document.querySelector(".topline [data-workbench-key]")!==null && document.querySelector(".topline [data-workbench-model]")!==null'
 Check 'Missing key is explicit and not only a color' 'document.querySelector("[data-workbench-key]").dataset.keyState==="missing" && document.querySelector("[data-workbench-key]").textContent.includes("אין מפתח")'
 Check 'Book illustration wraps data instead of duplicating title above' 'document.querySelectorAll(".tome-card").length===3 && document.querySelectorAll(".book-card .book-art").length===0 && [...document.querySelectorAll(".tome-card")].every(c=>c.contains(c.querySelector("h3")) && c.querySelector(".tome-edition"))'
 Check 'Every framed book retains delete and primary action' '[...document.querySelectorAll(".tome-card")].every(c=>c.querySelector("[data-room-delete]") && c.querySelector("[data-book]"))'
 Check 'Original mascot and humor are present' 'document.querySelector(".library-cat")!==null && document.querySelector(".hero-copy").textContent.includes("החתול") && document.querySelectorAll(".tome-aside").length===3'
 Capture 'library-desktop'
 Js 'document.querySelector("[data-workbench-key]").click()'
 Check 'Key dialog explains saved is not verified connection' 'document.querySelector("#modal").open && document.querySelector("#modal").textContent.includes("אינו אישור שהחיבור תקין")'
 Check 'No secret entry fields or persistent storage' 'document.querySelectorAll("input[type=password]").length===0 && localStorage.length===0 && sessionStorage.length===0'
 Js 'document.querySelector("[data-key-provider=openai][data-key-value=available]").click()'
 Check 'Available key differs from saved key' 'document.querySelector(".topline [data-workbench-key]").dataset.keyState==="available" && document.querySelector(".topline [data-workbench-key]").textContent.includes("זמין להרצה")'
 Js 'document.querySelector("[data-key-provider=openai][data-key-value=saved]").click()'
 Check 'Saved key has both name and visual badge' 'document.querySelector(".topline [data-workbench-key]").dataset.keyState==="saved" && getComputedStyle(document.querySelector(".topline [data-workbench-key] i")).display!=="none"'
 Capture 'keys-desktop'
 Width 320
 Check 'Key status dialog at320 fits and remains readable' 'document.querySelector("#modal").scrollWidth<=document.querySelector("#modal").clientWidth+1 && [...document.querySelectorAll("[data-key-provider]")].every(b=>b.getBoundingClientRect().height>=44)'
 Capture 'keys-320'
 Width 1440 1280
 Js 'document.querySelector("#modal [data-action=close-modal]").click()'
 Check 'Closing keys restores header focus' 'document.activeElement.matches(".topline [data-workbench-key]")'
 Js 'document.querySelector("[data-workbench-model]").click();document.querySelector("[data-model-filter=openai]").click()'
 Check 'Provider filtering shows direct native model choices' 'document.querySelectorAll("[name=workbench-model]").length===2 && document.querySelector("#modal select")===null'
 Js 'document.querySelector("[name=workbench-model][value=\"gpt-6-luna\"]").focus()'
 Key 'ArrowDown' 40
 Check 'Model radios preserve native keyboard navigation' 'document.activeElement.value==="gpt-6.1-sol" && document.activeElement.checked && document.querySelector(".model-current").textContent.includes("GPT-6.1 Sol")'
 Js 'document.querySelector("[name=workbench-model][value=\"gpt-6.1-sol\"]").click();document.querySelector("#modal [data-action=close-modal]").click()'
 Check 'Cancel discards draft model' 'document.querySelector(".topline [data-workbench-model]").textContent.includes("Auto")'
 Js 'document.querySelector("[data-workbench-model]").click();document.querySelector("[name=workbench-model][value=\"gpt-6-luna\"]").click()'
 Key 'Escape' 27
 Check 'Escape discards draft and restores model trigger' 'document.querySelector(".topline [data-workbench-model]").textContent.includes("Auto") && document.activeElement.matches(".topline [data-workbench-model]")'
 Js 'document.querySelector("[data-workbench-model]").click();document.querySelector("[data-model-filter=openai]").click();document.querySelector("[name=workbench-model][value=\"gpt-6.1-sol\"]").click();document.querySelector("[data-model-apply]").click()'
 Check 'Apply updates visible header choice and matching-provider key label' 'document.querySelector(".topline [data-workbench-model]").textContent.includes("GPT-6.1 Sol") && document.querySelector(".topline [data-workbench-model]").title.includes("שמור במחשב")'
 Js 'document.querySelector("[data-workbench-model]").click();document.querySelector("[data-model-role=reviewer]").click();document.querySelector("[data-model-filter=anthropic]").click();document.querySelector("[name=workbench-model][value=\"claude-sonnet-5-5\"]").click();document.querySelector("[data-model-role=chapter]").click()'
 Check 'Chapter reviewer can inherit translator independently' 'document.querySelector("[name=workbench-model][value=follow]").checked && document.querySelector(".model-current").textContent.includes("GPT-6.1 Sol")'
 Js 'document.querySelector("[data-model-apply]").click();document.querySelector("[data-workbench-model]").click();document.querySelector("[data-model-role=reviewer]").click()'
 Check 'Independent reviewer retained after reopening' 'document.querySelector("[name=workbench-model][value=\"claude-sonnet-5-5\"]").checked'
 Js 'document.querySelector("[data-model-role=translator]").click();document.querySelector("[data-model-filter=demo]").click()'
 Check 'Filtering never implicitly changes chosen model' 'document.querySelector(".model-current").textContent.includes("GPT-6.1 Sol")'
 Js 'document.querySelector("[data-model-filter=all]").click()'
 Capture 'models-desktop'
 Js 'document.querySelector("[data-model-filter=openai]").click()'
 Width 390
 Check 'Model chooser at390 fits width' 'document.documentElement.scrollWidth<=innerWidth+1 && document.querySelector("#modal").scrollWidth<=document.querySelector("#modal").clientWidth+1'
 Capture 'models-390'
 Width 320
 Check 'Model chooser at320 fits width' 'document.querySelector("#modal").scrollWidth<=document.querySelector("#modal").clientWidth+1'
 Capture 'models-320'
 Js 'document.querySelector("#modal [data-action=close-modal]").click();document.querySelector("[data-route=new]").click();document.querySelector("[data-action=sample]").click()'
 Check 'Selected translator appears in pretranslation summary' 'document.querySelector("[data-workbench-summary]").textContent.includes("GPT-6.1 Sol")'
 Js 'document.querySelector("[data-action=confirm-job]").click()'
 Check 'Confirmation exposes translator and independent reviewers' 'document.querySelector(".workbench-confirm-model").textContent.includes("GPT-6.1 Sol") && document.querySelector(".workbench-confirm-model").textContent.includes("Claude Sonnet 5.5")'
 Js 'document.querySelector("#modal [data-action=close-modal]").click();document.querySelector("[data-route=library]").click()'
 foreach($size in @(390,320)){
  Width $size
  Js 'window.scrollTo(0,0)'
  Check "Header and library at$size no horizontal overflow" 'document.documentElement.scrollWidth<=innerWidth+1 && document.querySelector(".topline [data-workbench-key]").getBoundingClientRect().height>=44'
  Capture "library-$size"
  Js 'document.querySelector(".tome-card").scrollIntoView({block:"center"})'
  Capture "book-$size"
 }
 Js 'window.__originalTitle=books[0].title;books[0].title="מסה ארוכה מאוד על הזמן, הזיכרון והספרים ששכחנו להחזיר למדף: עשרים ושבע הערות בשולי הדברים";renderBooks()'
 Check 'Long title is fully visible with no clamp' 'document.querySelector(".tome-card h3").textContent===books[0].title && getComputedStyle(document.querySelector(".tome-card h3")).overflow!=="hidden" && document.querySelector(".tome-card h3").scrollWidth<=document.querySelector(".tome-card h3").clientWidth+1'
 Js 'document.querySelector(".tome-card").scrollIntoView({block:"center"})'
 Capture 'long-title-320'
 Width 1440 1280
 Check 'Long title atdesktop remains within book frame' 'document.documentElement.scrollWidth<=innerWidth+1 && document.querySelector(".tome-card h3").scrollWidth<=document.querySelector(".tome-card h3").clientWidth+1'
 Js 'books[0].title="A".repeat(180);renderBooks()'
 Check 'Unbroken title cannot force horizontal overflow' 'document.documentElement.scrollWidth<=innerWidth+1 && document.querySelector(".tome-card h3").scrollWidth<=document.querySelector(".tome-card h3").clientWidth+1'
 Js 'books[0].title=window.__originalTitle;renderBooks();document.querySelector("[data-room-delete=memory]").click();document.querySelector("[data-room-confirm-delete]").click();document.querySelector("[data-room-undo]").click()'
 Check 'Framed cards preserve delete undo and focus' 'document.querySelectorAll(".tome-card").length===3 && document.activeElement.dataset.roomDelete==="memory"'
 Js 'const q=document.querySelector("#book-search");q.value="צרפתית";q.dispatchEvent(new Event("input",{bubbles:true}));q.value="";q.dispatchEvent(new Event("input",{bubbles:true}))'
 Check 'Search rerenders do not duplicate mascot controls or frame decoration' 'document.querySelectorAll(".workbench-header").length===1 && document.querySelectorAll(".library-cat").length===1 && document.querySelectorAll(".tome-edition").length===3 && document.querySelectorAll("[data-room-delete]").length===3'
 Js 'document.querySelector("[data-route=settings]").click();document.querySelector("#art-enabled").click();document.querySelector("[data-route=library]").click()'
 Check 'Quiet mode keeps book information and key status' 'getComputedStyle(document.querySelector(".cat-corner")).display==="none" && document.querySelectorAll(".tome-card h3").length===3 && getComputedStyle(document.querySelector(".topline [data-workbench-key]")).display!=="none"'
 Capture 'quiet-desktop'
 Check 'Model and simulated key persist across navigation' 'document.querySelector(".topline [data-workbench-model]").textContent.includes("GPT-6.1 Sol") && document.querySelector(".topline [data-workbench-key]").dataset.keyState==="saved"'
 Check 'No script errors or external resources' 'window.__characterErrors.length===0 && performance.getEntriesByType("resource").every(r=>r.name.startsWith(location.origin)||r.name.startsWith("blob:"))'
 Navigate 'a.html'
 Check 'Reload resets all prototype selections and simulated keys' 'document.querySelector(".topline [data-workbench-model]").textContent.includes("Auto") && document.querySelector(".topline [data-workbench-key]").dataset.keyState==="missing"'
 Navigate 'b.html'
 Js 'document.querySelector("[data-route=library]").click()'
 Check 'B baseline has no added key model or book-frame layer' 'document.querySelector(".workbench-header")===null && document.querySelector(".tome-card")===null && document.querySelectorAll(".book-card .book-art").length===3'
} finally {
 $script:CdpSocket.Dispose()
 $report=[PSCustomObject]@{time_utc=[DateTime]::UtcNow.ToString('o');checks=$results.Count;passed=@($results|Where-Object passed).Count;results=$results}
 [IO.File]::WriteAllText((Join-Path $evidence 'verification.json'),($report|ConvertTo-Json -Depth 6),[Text.UTF8Encoding]::new($false))
}
Write-Output "All $($results.Count) library-character checks passed."
