param([int]$DebugPort=9332,[string]$BaseUrl='http://127.0.0.1:8817')
$ErrorActionPreference='Stop'
. "$PSScriptRoot/cdp_helpers.ps1"
$evidence=[IO.Path]::GetFullPath((Join-Path (Get-Location) 'docs/design/pixel-library/library-motion'))
[void][IO.Directory]::CreateDirectory($evidence)
$results=New-Object Collections.Generic.List[object]
function Js([string]$Code){Invoke-BrowserJs ('(async()=>{'+$Code+'})()')|Out-Null}
function Check([string]$Name,[string]$Expression){
 $passed=[bool](Invoke-BrowserJs "Boolean($Expression)")
 $results.Add([PSCustomObject]@{name=$Name;passed=$passed})
 if(!$passed){throw "FAIL $Name"}; Write-Output "PASS $Name"
}
function Width([int]$Value,[int]$Height=1000){Send-Cdp 'Emulation.setDeviceMetricsOverride' @{width=$Value;height=$Height;deviceScaleFactor=1;mobile=$false}|Out-Null}
function WaitFor([string]$Expression,[int]$Limit=6000){
 $watch=[Diagnostics.Stopwatch]::StartNew()
 while(!(Invoke-BrowserJs "Boolean($Expression)")){
  if($watch.ElapsedMilliseconds -gt $Limit){throw "Timed out: $Expression"}
  Start-Sleep -Milliseconds 60
 }
}
function Capture([string]$Name){Js 'document.querySelector("#toast").hidden=true';Save-BrowserScreenshot (Join-Path $evidence ($Name+'.png'))}
function Navigate([string]$Page){Send-Cdp 'Page.navigate' @{url="$BaseUrl/$Page"}|Out-Null;Start-Sleep -Milliseconds 300}
Connect-Cdp -Port $DebugPort
try {
 Send-Cdp 'Page.enable' @{}|Out-Null
 Send-Cdp 'Emulation.setEmulatedMedia' @{features=@(@{name='prefers-reduced-motion';value='no-preference'})}|Out-Null
 $instrument=@'
window.__motionErrors=[];window.addEventListener('error',e=>__motionErrors.push(e.message));window.addEventListener('unhandledrejection',e=>__motionErrors.push(String(e.reason)));
window.__motionTasks=new Map();const originalTimeout=window.setTimeout.bind(window),originalClear=window.clearTimeout.bind(window);
window.setTimeout=(callback,delay,...args)=>{const track=new Error().stack.includes('library-motion.js');let id;id=originalTimeout(()=>{__motionTasks.delete(id);callback(...args)},delay);if(track)__motionTasks.set(id,{callback,delay});return id};
window.clearTimeout=id=>{__motionTasks.delete(id);return originalClear(id)};
window.__audioCreated=0;window.__audioNodes=[];
const NativeAudio=window.AudioContext;if(NativeAudio)window.AudioContext=class extends NativeAudio{constructor(){super();__audioCreated++;const make=this.createOscillator.bind(this);this.createOscillator=()=>{const node=make();__audioNodes.push(node);return node}}};
'@
 Send-Cdp 'Page.addScriptToEvaluateOnNewDocument' @{source=$instrument}|Out-Null
 Width 1440 1250
 Navigate 'a.html'
 Check 'Instrumentation and single reserved theatre initialized' 'Array.isArray(__motionErrors) && document.querySelectorAll(".library-theatre").length===1'
 Check 'Sound starts off without constructing audio context' '__audioCreated===0 && document.querySelector("[data-library-sound]").getAttribute("aria-pressed")==="false"'
 Check 'Initial cat waits before appearing' 'document.querySelector(".library-theatre").dataset.phase==="waiting"'
 WaitFor 'document.querySelector(".library-theatre").dataset.phase==="peeking"'
 Check 'Automatic occasional visit peeks without a click' 'document.body.classList.contains("library-awake")'
 WaitFor 'document.querySelector(".library-theatre").dataset.phase==="jumping"'
 Js 'window.__jumpStart=document.querySelector(".cat-actor").getBoundingClientRect().top'
 Start-Sleep -Milliseconds 450
 Check 'Jump really changes the rendered cat position' 'document.querySelector(".cat-actor").getBoundingClientRect().top<__jumpStart-10'
 Capture 'cat-jump-desktop'
 WaitFor 'document.querySelector(".library-theatre").dataset.phase==="talking"'
 Check 'Talking includes a readable local phrase and animated mouth' '!document.querySelector(".cat-bubble").hidden && document.querySelector(".cat-bubble p").textContent.length>15 && getComputedStyle(document.querySelector(".cat-mouth-open")).animationName==="cat-chatter"'
 Check 'Automatic speech does not interrupt screen-reader live region' '!document.querySelector("#announcer").textContent.includes("חתול הספרייה") && !document.querySelector(".cat-bubble").hasAttribute("aria-live")'
 Check 'Shelf books light and dust animate independently' 'document.querySelectorAll(".hero-art .shelf-volume").length===8 && getComputedStyle(document.querySelector(".hero-art .shelf-scene")).animationName==="old-shelf" && getComputedStyle(document.querySelector(".library-dust i")).animationName==="dust-drift"'
 Check 'Cat and bubble stay inside stage away from primary action' '(()=>{const b=document.querySelector(".cat-bubble").getBoundingClientRect(),s=document.querySelector(".cat-stage").getBoundingClientRect(),a=document.querySelector(".hero-copy button").getBoundingClientRect();return b.left>=s.left && b.right<=s.right && (b.right<=a.left||b.left>=a.right||b.bottom<=a.top||b.top>=a.bottom)})()'
 Capture 'cat-desktop'
 WaitFor 'document.querySelector(".library-theatre").dataset.phase==="leaving"' 8000
 Check 'Visit exits instead of remaining on screen' 'getComputedStyle(document.querySelector(".cat-actor")).animationName==="cat-exit"'
 WaitFor 'document.querySelector(".library-theatre").dataset.phase==="waiting"'
 Check 'Next occasional visit is scheduled30 to45 seconds later' '[...__motionTasks.values()].some(t=>t.delay>=30000&&t.delay<45000) && __motionTasks.size===1'
 Js 'document.querySelector("[data-workbench-key]").focus();const [id,task]=[...__motionTasks.entries()].find(([,t])=>t.delay>=30000);clearTimeout(id);task.callback()'
 Check 'Scheduled recurrence starts another visit without stealing focus' 'document.querySelector(".library-theatre").dataset.phase==="peeking" && document.activeElement.matches("[data-workbench-key]")'
 Js 'document.querySelector("[data-library-motion]").click()'
 Check 'Pause stops timers and ambient animation' '!document.body.classList.contains("library-awake") && __motionTasks.size===0 && getComputedStyle(document.querySelector(".hero-art .shelf-scene")).animationName==="none"'
 Js 'document.querySelector("[data-library-summon]").click()'
 WaitFor 'document.querySelector("#announcer").textContent.includes("חתול הספרייה")'
 Check 'Manual summon while paused gives static accessible speech' 'document.querySelector(".library-theatre").dataset.phase==="static" && !document.querySelector(".cat-bubble").hidden && document.querySelector("#announcer").textContent.includes("חתול הספרייה") && __motionTasks.size===0'
 Js 'document.querySelector("[data-library-dismiss]").focus();document.querySelector("[data-library-dismiss]").click()'
 Check 'Dismiss restores focus before hiding speech control' 'document.querySelector(".cat-bubble").hidden && document.activeElement.matches("[data-library-summon]")'
 Js 'document.querySelector("[data-library-motion]").click();document.querySelector("[data-workbench-model]").click()'
 Start-Sleep -Milliseconds 100
 Check 'Open model dialog pauses scene scheduler' '!document.body.classList.contains("library-awake") && __motionTasks.size===0'
 Js 'document.querySelector("#modal [data-action=close-modal]").click()'
 WaitFor 'document.body.classList.contains("library-awake")'
 Check 'Closing dialog resumes a single scheduler' '__motionTasks.size===1'
 Js 'Object.defineProperty(document,"hidden",{configurable:true,value:true});document.dispatchEvent(new Event("visibilitychange"))'
 Check 'Hidden-document handler stops automatic work' '!document.body.classList.contains("library-awake") && __motionTasks.size===0'
 Js 'delete document.hidden;document.dispatchEvent(new Event("visibilitychange"))'
 WaitFor 'document.body.classList.contains("library-awake")'
 Width 1440 600
 Js 'window.scrollTo(0,document.documentElement.scrollHeight)'
 WaitFor '!document.body.classList.contains("library-awake")'
 Check 'Actual offscreen scene stops its timer' '__motionTasks.size===0'
 Js 'window.scrollTo(0,0)'
 WaitFor 'document.body.classList.contains("library-awake")'
 Check 'Returning onscreen resumes once' '__motionTasks.size===1'
 Send-Cdp 'Emulation.setEmulatedMedia' @{features=@(@{name='prefers-reduced-motion';value='reduce'})}|Out-Null
 WaitFor '!document.body.classList.contains("library-awake")'
 Js 'document.querySelector("[data-library-summon]").click()'
 Check 'OS reduced motion allows static speech but no movement or timers' 'document.querySelector("[data-library-motion]").disabled && document.querySelector(".library-theatre").dataset.phase==="static" && __motionTasks.size===0 && getComputedStyle(document.querySelector(".cat-actor")).animationName==="none"'
 Width 320
 Js 'document.querySelector(".cat-stage").scrollIntoView({block:"center"})'
 Check 'Reduced-motion theatre at320 has no horizontal overflow' 'document.documentElement.scrollWidth<=innerWidth+1'
 Capture 'cat-reduced-320'
 Send-Cdp 'Emulation.setEmulatedMedia' @{features=@(@{name='prefers-reduced-motion';value='no-preference'})}|Out-Null
 Width 1440 1250
 Js 'window.scrollTo(0,0)'
 WaitFor 'document.body.classList.contains("library-awake")'
 Js 'document.querySelector("[data-library-sound]").click()'
 WaitFor 'document.querySelector("[data-library-sound]").getAttribute("aria-pressed")==="true"'
 Check 'Audio graph is created only after explicit opt-in' '__audioCreated===1 && __audioNodes.length>0'
 Js 'document.querySelector("[data-library-sound]").click();window.__mutedCount=__audioNodes.length;document.querySelector("[data-library-summon]").click()'
 Start-Sleep -Milliseconds 900
 Check 'Muted jump creates no audio voices' 'document.querySelector("[data-library-sound]").getAttribute("aria-pressed")==="false" && __audioNodes.length===__mutedCount'
 foreach($size in @(390,320)){
  Width $size
  Js 'document.querySelector(".cat-stage").scrollIntoView({block:"center"});document.querySelector("[data-library-summon]").click()'
  WaitFor 'document.querySelector(".library-theatre").dataset.phase==="talking"'
  Check "Scene at$size preserves width and44px controls" 'document.documentElement.scrollWidth<=innerWidth+1 && [...document.querySelectorAll(".library-theatre button")].every(b=>b.getBoundingClientRect().height>=44)'
  Capture "cat-$size"
 }
 Js 'const q=document.querySelector("#book-search");q.value="צרפתית";q.dispatchEvent(new Event("input",{bubbles:true}));q.value="";q.dispatchEvent(new Event("input",{bubbles:true}))'
 Check 'Search rerender keeps one cat one dust layer one timer' 'document.querySelectorAll(".library-cat").length===1 && document.querySelectorAll(".library-dust").length===1 && document.querySelectorAll(".library-theatre").length===1 && __motionTasks.size<=1'
 Js 'document.querySelector("[data-route=learning]").click()'
 Check 'Reader visit stays in reserved footer not over reading text' 'document.querySelectorAll(".footer-theatre").length===1 && !document.querySelector(".reader-copy .library-theatre") && getComputedStyle(document.querySelector(".footer-theatre")).position!=="fixed"'
 Js 'document.querySelector(".footer-theatre").scrollIntoView({block:"center"});document.querySelector("[data-library-summon]").click()'
 WaitFor 'document.querySelector(".library-theatre").dataset.phase==="talking"'
 Check 'Reader speech at320 fits vertically inside reserved stage' '(()=>{const b=document.querySelector(".cat-bubble").getBoundingClientRect(),s=document.querySelector(".cat-stage").getBoundingClientRect();return b.top>=s.top && b.bottom<=s.bottom && b.right<=s.right && b.left>=s.left})()'
 Capture 'reader-cat-320'
 Js 'document.querySelector("[data-route=settings]").click();document.querySelector("#art-enabled").click();document.querySelector("[data-route=library]").click()'
 Check 'Quiet-art preference hides theatre and pauses animation' 'getComputedStyle(document.querySelector(".library-theatre")).display==="none" && !document.body.classList.contains("library-awake") && __motionTasks.size===0'
 Check 'No runtime errors or external resources' '__motionErrors.length===0 && performance.getEntriesByType("resource").every(r=>r.name.startsWith(location.origin)||r.name.startsWith("blob:"))'
 Navigate 'a.html'
 WaitFor 'document.body.classList.contains("library-awake")'
 Js 'dispatchEvent(new PageTransitionEvent("pagehide",{persisted:true}));dispatchEvent(new PageTransitionEvent("pageshow",{persisted:true}))'
 WaitFor 'document.body.classList.contains("library-awake")'
 Check 'Back-forward-cache lifecycle remounts one muted scene and scheduler' 'document.querySelectorAll(".library-theatre").length===1 && __motionTasks.size===1 && document.querySelector("[data-library-sound]").getAttribute("aria-pressed")==="false"'
 Js 'window.AudioContext=undefined;window.webkitAudioContext=undefined;document.querySelector("[data-library-sound]").click()'
 Check 'Unsupported audio remains muted with visible explanation' 'document.querySelector("[data-library-sound]").getAttribute("aria-pressed")==="false" && document.querySelector(".motion-note").textContent.includes("אינם זמינים")'
 Navigate 'b.html'
 Check 'B remains free of motion layer and audio initialization' 'document.querySelector(".library-theatre")===null && __audioCreated===0'
} finally {
 Send-Cdp 'Emulation.setEmulatedMedia' @{features=@()}|Out-Null
 $script:CdpSocket.Dispose()
 $report=[PSCustomObject]@{time_utc=[DateTime]::UtcNow.ToString('o');checks=$results.Count;passed=@($results|Where-Object passed).Count;results=$results}
 [IO.File]::WriteAllText((Join-Path $evidence 'verification.json'),($report|ConvertTo-Json -Depth 6),[Text.UTF8Encoding]::new($false))
}
Write-Output "All $($results.Count) library-motion checks passed."
