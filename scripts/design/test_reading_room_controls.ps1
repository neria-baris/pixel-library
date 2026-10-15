param([int]$DebugPort=9332,[string]$BaseUrl='http://127.0.0.1:8817')
$ErrorActionPreference='Stop'
. "$PSScriptRoot/cdp_helpers.ps1"
$evidence=[IO.Path]::GetFullPath((Join-Path (Get-Location) 'docs/design/pixel-library/reading-room-controls'))
[void][IO.Directory]::CreateDirectory($evidence)
$results=New-Object Collections.Generic.List[object]
function Js([string]$Code){Invoke-BrowserJs ('(async()=>{'+$Code+'})()') | Out-Null}
function Check([string]$Name,[string]$Expression){
 $passed=[bool](Invoke-BrowserJs "Boolean($Expression)")
 $results.Add([PSCustomObject]@{name=$Name;passed=$passed})
 if(!$passed){throw "FAIL $Name"}
 Write-Output "PASS $Name"
}
function Key([string]$Key,[int]$Virtual){
 Send-Cdp 'Input.dispatchKeyEvent' @{type='keyDown';key=$Key;code=$Key;windowsVirtualKeyCode=$Virtual} | Out-Null
 Send-Cdp 'Input.dispatchKeyEvent' @{type='keyUp';key=$Key;code=$Key;windowsVirtualKeyCode=$Virtual} | Out-Null
}
function Width([int]$Value){Send-Cdp 'Emulation.setDeviceMetricsOverride' @{width=$Value;height=1000;deviceScaleFactor=1;mobile=$false} | Out-Null}
function Capture([string]$Name){
 Js 'document.querySelector("#toast").hidden=true;document.activeElement?.blur()'
 Save-BrowserScreenshot (Join-Path $evidence ($Name+'.png'))
}
Connect-Cdp -Port $DebugPort
try {
 Width 1440
 Send-Cdp 'Page.navigate' @{url="$BaseUrl/a.html"} | Out-Null
 Start-Sleep -Milliseconds 400
 Js 'document.querySelector("[data-route=new]").click()'
 Check 'Native range retains label and large pointer zone' 'document.querySelector("#quality").type==="range" && document.querySelector("#quality").labels.length>0 && document.querySelector("#quality").getBoundingClientRect().height>=56'
 Check 'Primary stations have 56px targets' '[...document.querySelectorAll("[data-quality]")].every(b=>b.getBoundingClientRect().height>=56)'
 Js 'document.querySelector("#quality").focus()'
 Key 'End' 35
 Check 'Keyboard End updates fill and label' 'document.querySelector("#quality").value==="2" && document.querySelector("#quality").style.getPropertyValue("--range-progress")==="100%" && document.querySelector("#quality-value").textContent===document.querySelectorAll("[data-quality]")[2].textContent'
 Key 'Home' 36
 Check 'Keyboard Home sets minimum' 'document.querySelector("#quality").value==="0" && document.querySelector("#quality").style.getPropertyValue("--range-progress")==="0%"'
 # Real pointer drag across the native RTL control, from minimum on right to maximum on left.
 Js 'document.querySelector("#quality").scrollIntoView({block:"center"})'
 $box=Invoke-BrowserJs '(()=>{const r=document.querySelector("#quality").getBoundingClientRect();return {left:r.left,right:r.right,y:r.top+r.height/2}})()'
 Send-Cdp 'Input.dispatchMouseEvent' @{type='mouseMoved';x=($box.right-16);y=$box.y} | Out-Null
 Send-Cdp 'Input.dispatchMouseEvent' @{type='mousePressed';x=($box.right-16);y=$box.y;button='left';clickCount=1} | Out-Null
 Send-Cdp 'Input.dispatchMouseEvent' @{type='mouseMoved';x=($box.left+16);y=$box.y;button='left';buttons=1} | Out-Null
 Send-Cdp 'Input.dispatchMouseEvent' @{type='mouseReleased';x=($box.left+16);y=$box.y;button='left';clickCount=1} | Out-Null
 Check 'Pointer drag native RTL slider to maximum' 'document.querySelector("#quality").value==="2"'
 Js 'document.querySelectorAll("[data-quality]")[1].click()'
 Check 'Direct station updates fill and summary' 'document.querySelector("#quality").value==="1" && document.querySelector("#quality").style.getPropertyValue("--range-progress")==="50%" && document.querySelector("#sum-quality").textContent===document.querySelectorAll("[data-quality]")[1].textContent'
 Js 'const n=document.querySelector("#budget-number");n.value="7.25";n.dispatchEvent(new Event("input",{bubbles:true}));document.querySelector("[data-room-step=budget-number][data-delta=\"1\"]").click()'
 Check 'Budget step preserves exact cents' 'document.querySelector("#budget-number").value==="8.25" && document.querySelector("#sum-budget").textContent==="$8.25"'
 Js 'const n=document.querySelector("#budget-number");n.value="0.25";n.dispatchEvent(new Event("input",{bubbles:true}));document.querySelector("[data-room-step=budget-number][data-delta=\"-1\"]").click()'
 Check 'Budget decrease clamps and disables at minimum' 'document.querySelector("#budget-number").value==="0.01" && document.querySelector("[data-room-step=budget-number][data-delta=\"-1\"]").disabled'
 Js 'const n=document.querySelector("#budget-number");n.value="";n.dispatchEvent(new Event("input",{bubbles:true}));document.querySelector("[data-room-step=budget-number][data-delta=\"1\"]").click()'
 Check 'Empty exact input recovers without NaN' 'document.querySelector("#budget-number").value==="1" && document.querySelector("#sum-budget").textContent==="$1.00"'
 Js 'const n=document.querySelector("#budget-number");n.value="7.25";n.dispatchEvent(new Event("input",{bubbles:true}));document.querySelector("#quality").scrollIntoView({block:"center"})'
 Capture 'settings-desktop'
 foreach($size in @(390,320)){
   Width $size
   Js 'document.querySelector("#quality").scrollIntoView({block:"start"})'
   Check "Settings at $size no overflow" 'document.documentElement.scrollWidth<=innerWidth+1'
   Check "Number steps at $size remain large" '[...document.querySelectorAll(".room-number button")].every(b=>b.getBoundingClientRect().width>=48 && b.getBoundingClientRect().height>=48)'
   Capture "settings-$size"
 }
 Width 1440
 Js 'document.querySelector("[data-route=learning]").click();document.querySelector(".learning-controls").open=true;document.querySelectorAll("[data-room-range=effort]")[2].click()'
 Check 'Effort stations update native value and description' 'document.querySelector("#effort").value==="2" && document.querySelector("#effort-help").textContent.includes("30%") && document.querySelectorAll("[data-room-range=effort]")[2].getAttribute("aria-pressed")==="true"'
 Js 'document.querySelector("[data-room-step=reader-size][data-delta=\"1\"]").click()'
 Check 'Text size step updates reader and output' 'document.querySelector("#reader-size").value==="21" && document.querySelector("#size-value").textContent==="21" && document.querySelector("#reader-copy").style.getPropertyValue("--reader-size")==="21px"'
 Js 'document.querySelector("#reader-size").focus()'
 Key 'End' 35
 Check 'Text size upper bound disables increase' 'document.querySelector("#reader-size").value==="28" && document.querySelector("[data-room-step=reader-size][data-delta=\"1\"]").disabled'
 Js 'document.querySelector("#reader-size").value="20";document.querySelector("#reader-size").dispatchEvent(new Event("input",{bubbles:true}));window.scrollTo(0,200)'
 Capture 'learning-desktop'
 foreach($size in @(390,320)){
   Width $size
   Js 'document.querySelector(".learning-controls").open=true;document.querySelector("#effort").scrollIntoView({block:"center"})'
   Check "Effort at $size no overflow" 'document.documentElement.scrollWidth<=innerWidth+1'
   Capture "effort-$size"
   Js 'document.querySelector(".learning-controls").open=false;document.querySelector(".reader").scrollIntoView({block:"start"})'
   Check "Reader at $size no overflow" 'document.documentElement.scrollWidth<=innerWidth+1'
   Capture "reader-$size"
 }
 Js 'document.querySelector("[data-route=library]").click();document.querySelector("[data-book=memory]").click()'
 Check 'Navigation has words with pixel symbols' '[...document.querySelectorAll(".room-page-button")].every(b=>b.querySelector("svg") && b.textContent.trim().length>1 && b.getBoundingClientRect().height>=48)'
 Js 'document.querySelector("[data-action=next-segment]").click()'
 Check 'Labeled next button preserves navigation behavior' 'document.querySelector("#segment-number").textContent.includes("2")'
 Check 'No hairline arrow-only buttons' '![...document.querySelectorAll("button")].some(b=>/^[←→]$/.test(b.textContent.trim()))'
 Check 'No duplicate range enhancement' 'document.querySelectorAll(".room-slider .room-slider").length===0'
 Width 1440
 Send-Cdp 'Page.navigate' @{url="$BaseUrl/b.html"} | Out-Null
 Start-Sleep -Milliseconds 400
 Check 'B remains without A enhancement' 'document.querySelector("link[href=\"reading-room.css\"]")===null && document.querySelectorAll(".room-slider").length===0 && !document.documentElement.classList.contains("reading-room")'
} finally {
 $script:CdpSocket.Dispose()
 $report=[PSCustomObject]@{time_utc=[DateTime]::UtcNow.ToString('o');checks=$results.Count;passed=@($results|Where-Object passed).Count;results=$results}
 [IO.File]::WriteAllText((Join-Path $evidence 'verification.json'),($report|ConvertTo-Json -Depth 6),[Text.UTF8Encoding]::new($false))
}
Write-Output "All $($results.Count) reading-room checks passed."
