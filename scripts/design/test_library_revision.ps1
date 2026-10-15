param([int]$DebugPort=9332,[string]$BaseUrl='http://127.0.0.1:8817')
$ErrorActionPreference='Stop'
. "$PSScriptRoot/cdp_helpers.ps1"
$evidence=[IO.Path]::GetFullPath((Join-Path (Get-Location) 'docs/design/pixel-library/library-revision'))
[void][IO.Directory]::CreateDirectory($evidence)
$results=New-Object Collections.Generic.List[object]
function Js([string]$Code){Invoke-BrowserJs ('(async()=>{'+$Code+'})()')|Out-Null}
function Check([string]$Name,[string]$Expression){
 $passed=[bool](Invoke-BrowserJs "Boolean($Expression)")
 $results.Add([PSCustomObject]@{name=$Name;passed=$passed})
 if(!$passed){throw "FAIL $Name"}
 Write-Output "PASS $Name"
}
function Width([int]$Value,[int]$Height=1000){Send-Cdp 'Emulation.setDeviceMetricsOverride' @{width=$Value;height=$Height;deviceScaleFactor=1;mobile=$false}|Out-Null}
function Key([string]$Value,[int]$Virtual){
 Send-Cdp 'Input.dispatchKeyEvent' @{type='keyDown';key=$Value;code=$Value;windowsVirtualKeyCode=$Virtual}|Out-Null
 Send-Cdp 'Input.dispatchKeyEvent' @{type='keyUp';key=$Value;code=$Value;windowsVirtualKeyCode=$Virtual}|Out-Null
}
function Capture([string]$Name){
 Js 'document.querySelector("#toast").hidden=true;document.activeElement?.blur()'
 Save-BrowserScreenshot (Join-Path $evidence ($Name+'.png'))
}
function Navigate([string]$Page){
 Send-Cdp 'Page.navigate' @{url="$BaseUrl/$Page"}|Out-Null
 Start-Sleep -Milliseconds 350
}
Connect-Cdp -Port $DebugPort
try {
 Send-Cdp 'Page.enable' @{}|Out-Null
 Send-Cdp 'Page.addScriptToEvaluateOnNewDocument' @{source='window.__libraryErrors=[];window.addEventListener("error",e=>__libraryErrors.push(e.message));window.addEventListener("unhandledrejection",e=>__libraryErrors.push(String(e.reason)));'}|Out-Null
 Width 1440 1160
 Navigate 'a.html'
 Check 'Browser error instrumentation initialized' 'Array.isArray(window.__libraryErrors)'
 Check 'Library name visible in page and title' 'document.querySelector(".brand strong").textContent==="הספרייה" && document.title.startsWith("הספרייה") && !document.querySelector("#app").innerText.includes("חדר הקריאה")'
 Check 'Shelf illustration replaces furnished room' 'document.querySelector(".hero-art .shelf-scene")!==null'
 Check 'Delete is present on every card' 'document.querySelectorAll("[data-room-delete]").length===3 && [...document.querySelectorAll("[data-room-delete]")].every(b=>b.textContent.includes("מחיקה"))'
 Check 'Arrow glyphs and icons removed from navigation' '!/[←→]/.test(document.querySelector("#app").innerText) && document.querySelector(".room-chevron")===null'
 Capture 'library-desktop'
 foreach($size in @(390,320)){
  Width $size
  Js 'window.scrollTo(0,0)'
  Check "Library at $size no horizontal overflow" 'document.documentElement.scrollWidth<=innerWidth+1'
  Capture "library-$size"
  Js 'document.querySelector(".book-card").scrollIntoView({block:"center"})'
  Check "Delete targets at $size are visible and comfortable" '[...document.querySelectorAll("[data-room-delete]")].every(b=>b.getBoundingClientRect().height>=44 && b.getBoundingClientRect().width>=90 && getComputedStyle(b).visibility==="visible")'
  Capture "book-actions-$size"
 }
 Js 'document.querySelector("[data-room-delete=memory]").click()'
 Check 'Deletion confirmation names book and protects source file' 'document.querySelector("#modal").open && document.querySelector("#modal").textContent.includes("על הזמן והזיכרון") && document.querySelector("#modal").textContent.includes("קובץ המקור במחשב אינו נמחק")'
 Capture 'delete-confirmation-320'
 Js 'document.querySelector("#modal [data-action=close-modal]").click()'
 Check 'Cancel keeps books and restores focus' 'document.querySelectorAll(".book-card").length===3 && document.activeElement.dataset.roomDelete==="memory"'
 Js 'document.querySelector("[data-room-delete=memory]").click()'
 Key 'Escape' 27
 Check 'Escape retains book and restores delete trigger' '!document.querySelector("#modal").open && document.querySelectorAll(".book-card").length===3 && document.activeElement.dataset.roomDelete==="memory"'
 Js 'document.querySelector("[data-room-delete=memory]").click();document.querySelector("[data-room-confirm-delete]").click()'
 Check 'Confirm removes selected book and updates count' 'document.querySelectorAll(".book-card").length===2 && !document.querySelector("[data-book=memory]") && document.querySelector(".section-title h2").textContent.includes("02")'
 Check 'Focus moves to adjacent book' 'document.activeElement.dataset.roomDelete==="garden"'
 Js 'const q=document.querySelector("#book-search");q.value="על הזמן";q.dispatchEvent(new Event("input",{bubbles:true}))'
 Check 'Deleted book absent from search results' 'document.querySelectorAll(".book-card").length===0'
 Js 'document.querySelector("[data-action=clear-search]").click();document.querySelector("[data-route=learning]").click();document.querySelector("[data-route=library]").click()'
 Check 'Deletion survives navigation and filter rebuild' 'document.querySelectorAll(".book-card").length===2 && !document.querySelector("[data-book=memory]") && document.querySelector("[data-room-undo]")!==null'
 Js 'document.querySelector("[data-room-undo]").click()'
 Check 'Undo restores book and focus' 'document.querySelectorAll(".book-card").length===3 && document.activeElement.dataset.roomDelete==="memory"'
 Js 'for(let i=0;i<3;i++){document.querySelector("[data-room-delete]").click();document.querySelector("[data-room-confirm-delete]").click()}'
 Check 'All deletions produce meaningful empty state' 'document.querySelectorAll(".book-card").length===0 && document.querySelector("#books").textContent.includes("הספרייה ריקה") && document.querySelector("#books [data-route=new]")!==null && document.querySelector(".section-title h2").textContent.includes("00")'
 Check 'Deleted reading suggestion is hidden' 'document.querySelector(".continue-card").hidden'
 Capture 'empty-library-320'
 Js 'document.querySelector("[data-room-undo]").click()'
 Check 'Undo from empty state restores last book' 'document.querySelectorAll(".book-card").length===1 && document.querySelector("[data-book=journey]")!==null'
 Navigate 'a.html'
 Check 'Reload resets only sample inventory' 'document.querySelectorAll(".book-card").length===3'
 Width 1440
 Js 'document.querySelector("[data-route=new]").click();document.querySelector("#quality").focus()'
 Key 'Home' 36
 Check 'Keyboard minimum preserved' 'document.querySelector("#quality").value==="0"'
 Js 'document.querySelector("#quality").scrollIntoView({block:"center"})'
 $box=Invoke-BrowserJs '(()=>{const r=document.querySelector("#quality").getBoundingClientRect();return {left:r.left,right:r.right,y:r.top+r.height/2}})()'
 Send-Cdp 'Input.dispatchMouseEvent' @{type='mousePressed';x=($box.right-16);y=$box.y;button='left';clickCount=1}|Out-Null
 Send-Cdp 'Input.dispatchMouseEvent' @{type='mouseMoved';x=($box.left+16);y=$box.y;button='left';buttons=1}|Out-Null
 Send-Cdp 'Input.dispatchMouseEvent' @{type='mouseReleased';x=($box.left+16);y=$box.y;button='left';clickCount=1}|Out-Null
 Check 'Matte native slider still supports RTL drag' 'document.querySelector("#quality").value==="2" && document.querySelector("#quality").style.getPropertyValue("--range-progress")==="100%"'
 Js 'const n=document.querySelector("#budget-number");n.value="7.25";n.dispatchEvent(new Event("input",{bubbles:true}));document.querySelector("[data-room-step=budget-number][data-delta=\"1\"]").click()'
 Check 'Exact budget remains precise' 'document.querySelector("#budget-number").value==="8.25"'
 Capture 'controls-desktop'
 Width 320
 Js 'document.querySelector("#quality").scrollIntoView({block:"start"})'
 Check 'Controls at 320 no horizontal overflow' 'document.documentElement.scrollWidth<=innerWidth+1'
 Capture 'controls-320'
 Js 'document.querySelector("[data-route=library]").click();document.querySelector("[data-book=memory]").click();document.querySelector("#review-target").value="מונח ← משמעות";document.querySelector("[data-action=save-edit]").click();document.querySelector("[data-action=next-segment]").click();document.querySelector("[data-action=prev-segment]").click()'
 Check 'Arrow cleanup never changes edited content' 'document.querySelector("#review-target").value==="מונח ← משמעות"'
 Check 'Previous and next remain labeled without arrow icons' '[...document.querySelectorAll(".room-page-button")].every(b=>b.textContent.trim().length>1 && !b.querySelector("svg"))'
 Check 'No duplicate delete controls' 'document.querySelectorAll(".book-card [data-room-delete]").length<=3'
 Check 'No script errors after deletion and navigation' 'window.__libraryErrors.length===0'
 Width 1440
 Navigate 'b.html'
 Js 'document.querySelector("[data-route=library]").click()'
 Check 'B keeps baseline identity and artwork' 'document.querySelector(".brand strong").textContent==="שולחן הקטלוג" && document.querySelector(".shelf-scene")===null && document.querySelectorAll("[data-room-delete]").length===0 && document.querySelectorAll(".book-card").length===3'
} finally {
 $script:CdpSocket.Dispose()
 $report=[PSCustomObject]@{time_utc=[DateTime]::UtcNow.ToString('o');checks=$results.Count;passed=@($results|Where-Object passed).Count;results=$results}
 [IO.File]::WriteAllText((Join-Path $evidence 'verification.json'),($report|ConvertTo-Json -Depth 6),[Text.UTF8Encoding]::new($false))
}
Write-Output "All $($results.Count) library-revision checks passed."
