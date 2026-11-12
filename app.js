const DB_NAME = "musixyz-library";
const DB_VERSION = 1;
let db, tracks = [], currentId = null, shuffle = false, repeat = false, sortNewest = true;
const $ = id => document.getElementById(id);
const audio = $("audio");

function openDatabase(){return new Promise((resolve,reject)=>{const r=indexedDB.open(DB_NAME,DB_VERSION);r.onupgradeneeded=()=>{const d=r.result;if(!d.objectStoreNames.contains("tracks")){const s=d.createObjectStore("tracks",{keyPath:"id"});s.createIndex("addedAt","addedAt");}};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
function store(mode="readonly"){return db.transaction("tracks",mode).objectStore("tracks");}
function getAllTracks(){return new Promise((resolve,reject)=>{const r=store().getAll();r.onsuccess=()=>resolve(r.result||[]);r.onerror=()=>reject(r.error);});}
function saveTrack(t){return new Promise((resolve,reject)=>{const r=store("readwrite").put(t);r.onsuccess=resolve;r.onerror=()=>reject(r.error);});}
function deleteTrack(id){return new Promise((resolve,reject)=>{const r=store("readwrite").delete(id);r.onsuccess=resolve;r.onerror=()=>reject(r.error);});}
function formatTime(n){if(!Number.isFinite(n))return"0:00";return`${Math.floor(n/60)}:${Math.floor(n%60).toString().padStart(2,"0")}`;}
function safeTitle(n){return n.replace(/\.[^.]+$/,"").replace(/[_-]+/g," ").trim()||"Unknown track";}
function sortedTracks(){const q=$("searchInput").value.trim().toLowerCase();return tracks.filter(t=>`${t.title} ${t.artist} ${t.fileName}`.toLowerCase().includes(q)).sort((a,b)=>sortNewest?b.addedAt-a.addedAt:a.title.localeCompare(b.title));}
function makeButton(text,cls,aria,fn){const b=document.createElement("button");b.className=cls;b.textContent=text;b.setAttribute("aria-label",aria);b.addEventListener("click",fn);return b;}
function render(){
  $("trackCount").textContent=tracks.length;const list=$("trackList");list.replaceChildren();const shown=sortedTracks();
  $("emptyState").style.display=tracks.length?"none":"block";
  $("statusMessage").textContent=tracks.length?`${tracks.length} track${tracks.length===1?"":"s"} in library`:"Ready";
  if(!tracks.length)return;
  if(!shown.length){const p=document.createElement("p");p.className="empty-state";p.textContent="No songs match that search.";list.append(p);return;}
  for(const t of shown){
    const row=document.createElement("div");row.className="track-row"+(t.id===currentId?" active":"");
    const main=document.createElement("div");main.className="row-main";
    const thumb=document.createElement("div");thumb.className="track-thumb";thumb.textContent="♫";
    const info=document.createElement("div");info.className="row-info";
    const title=document.createElement("strong");title.textContent=t.title;
    const artist=document.createElement("span");artist.textContent=t.artist||t.fileName;info.append(title,artist);main.append(thumb,info);
    main.addEventListener("click",()=>playTrack(t.id));
    const duration=document.createElement("span");duration.className="duration-label";duration.textContent=formatTime(t.duration);
    const actions=document.createElement("div");actions.className="row-actions";
    actions.append(makeButton(t.id===currentId&&!audio.paused?"Ⅱ":"▶","row-play","Play "+t.title,()=>t.id===currentId?togglePlay():playTrack(t.id)));
    actions.append(makeButton("×","remove-button","Remove "+t.title,async()=>{if(t.id===currentId)stopCurrent();await deleteTrack(t.id);tracks=tracks.filter(x=>x.id!==t.id);render();}));
    row.append(main,duration,actions);list.append(row);
  }
}
async function importFiles(fileList){
  const files=[...fileList].filter(f=>f.type.startsWith("audio/")||/\.(mp3|m4a|aac|wav|ogg|flac|opus)$/i.test(f.name));if(!files.length)return;
  $("importButton").disabled=true;$("importButton").textContent="Importing...";
  for(const file of files){const t={id:crypto.randomUUID?crypto.randomUUID():`${Date.now()}-${Math.random()}`,title:safeTitle(file.name),artist:"Local file",fileName:file.name,mimeType:file.type||"audio/mpeg",size:file.size,addedAt:Date.now(),duration:0,blob:file};await saveTrack(t);tracks.push(t);}
  $("importButton").disabled=false;$("importButton").innerHTML="<span>📂</span> Import music";$("fileInput").value="";render();
}
function getTrack(id){return tracks.find(t=>t.id===id);}
function playTrack(id){const t=getTrack(id);if(!t)return;currentId=id;if(audio.dataset.objectUrl)URL.revokeObjectURL(audio.dataset.objectUrl);const url=URL.createObjectURL(t.blob);audio.dataset.objectUrl=url;audio.src=url;$("playingTitle").textContent=t.title;$("playingArtist").textContent=t.artist||t.fileName;$("favoriteButton").textContent=t.favorite?"♥":"♡";$("favoriteButton").classList.toggle("on",!!t.favorite);audio.play().catch(()=>updatePlayButton());render();}
function stopCurrent(){audio.pause();audio.removeAttribute("src");audio.load();if(audio.dataset.objectUrl)URL.revokeObjectURL(audio.dataset.objectUrl);delete audio.dataset.objectUrl;currentId=null;$("playingTitle").textContent="Nothing playing";$("playingArtist").textContent="Choose a song";$("playButton").textContent="▶";$("seekBar").value=0;$("currentTime").textContent="0:00";$("duration").textContent="0:00";}
function togglePlay(){if(!currentId){const t=sortedTracks()[0]||tracks[0];if(t)playTrack(t.id);return;}if(audio.paused)audio.play().catch(()=>{});else audio.pause();}
function updatePlayButton(){$("playButton").textContent=audio.paused?"▶":"Ⅱ";render();}
function nextTrack(dir=1){if(!tracks.length)return;const i=tracks.findIndex(t=>t.id===currentId);let t;if(shuffle&&tracks.length>1){const a=tracks.filter(x=>x.id!==currentId);t=a[Math.floor(Math.random()*a.length)];}else t=tracks[(i<0?0:(i+dir+tracks.length)%tracks.length)];if(t)playTrack(t.id);}

$("importButton").addEventListener("click",()=>$("fileInput").click());$("emptyImportButton").addEventListener("click",()=>$("fileInput").click());$("desktopImport").addEventListener("click",()=>$("fileInput").click());$("startImport").addEventListener("click",()=>$("fileInput").click());$("fileInput").addEventListener("change",e=>importFiles(e.target.files));
$("searchInput").addEventListener("input",render);
$("sortButton").addEventListener("click",()=>{sortNewest=!sortNewest;$("sortButton").textContent=sortNewest?"↕ Sort: newest":"↕ Sort: A–Z";render();});
$("playButton").addEventListener("click",togglePlay);$("previousButton").addEventListener("click",()=>{if(audio.currentTime>3)audio.currentTime=0;else nextTrack(-1);});$("nextButton").addEventListener("click",()=>nextTrack(1));
$("shuffleButton").addEventListener("click",()=>{shuffle=!shuffle;$("shuffleButton").classList.toggle("pressed",shuffle);});$("repeatButton").addEventListener("click",()=>{repeat=!repeat;audio.loop=repeat;$("repeatButton").classList.toggle("pressed",repeat);});
$("favoriteButton").addEventListener("click",async()=>{const t=getTrack(currentId);if(!t)return;t.favorite=!t.favorite;await saveTrack(t);$("favoriteButton").textContent=t.favorite?"♥":"♡";$("favoriteButton").classList.toggle("on",t.favorite);});
$("seekBar").addEventListener("input",e=>{if(Number.isFinite(audio.duration)&&audio.duration>0)audio.currentTime=Number(e.target.value)/1000*audio.duration;});
audio.addEventListener("loadedmetadata",()=>{const t=getTrack(currentId);if(t&&Number.isFinite(audio.duration)){t.duration=audio.duration;saveTrack(t);$("duration").textContent=formatTime(audio.duration);render();}});
audio.addEventListener("timeupdate",()=>{if(!Number.isFinite(audio.duration)||audio.duration<=0)return;$("seekBar").value=Math.round(audio.currentTime/audio.duration*1000);$("currentTime").textContent=formatTime(audio.currentTime);$("duration").textContent=formatTime(audio.duration);});
audio.addEventListener("play",updatePlayButton);audio.addEventListener("pause",updatePlayButton);audio.addEventListener("ended",()=>{if(!repeat)nextTrack(1);});

$("startButton").addEventListener("click",()=>{$("startMenu").hidden=!$("startMenu").hidden;});
document.addEventListener("click",e=>{if(!$("startMenu").hidden&&!$("startMenu").contains(e.target)&&e.target!==$("startButton"))$("startMenu").hidden=true;});
$("startShowPlayer").addEventListener("click",()=>{$("playerWindow").scrollIntoView({behavior:"smooth",block:"center"});$("startMenu").hidden=true;});
$("desktopPlayer").addEventListener("click",()=>$("playerWindow").scrollIntoView({behavior:"smooth",block:"center"}));
$("playerTask").addEventListener("click",()=>$("playerWindow").scrollIntoView({behavior:"smooth",block:"center"}));
$("libraryTask").addEventListener("click",()=>$("mainWindow").scrollIntoView({behavior:"smooth",block:"center"}));
$("minimizeButton").addEventListener("click",()=>$("mainWindow").classList.toggle("minimized"));
$("closeButton").addEventListener("click",()=>$("mainWindow").classList.toggle("minimized"));
$("maximizeButton").addEventListener("click",()=>$("mainWindow").classList.toggle("maximized"));
$("playerMinimize").addEventListener("click",()=>$("playerWindow").classList.toggle("minimized"));
$("playerClose").addEventListener("click",()=>$("playerWindow").classList.toggle("minimized"));
$("startAbout").addEventListener("click",()=>{alert("musixyz 95\\nA tiny home for your local music.");$("startMenu").hidden=true;});
function updateClock(){const d=new Date();$("clock").textContent=d.toLocaleTimeString([], {hour:"numeric",minute:"2-digit"});}
setInterval(updateClock,30000);updateClock();
(async()=>{try{db=await openDatabase();tracks=await getAllTracks();render();}catch(err){console.error(err);$("emptyState").querySelector("p").textContent="Local storage could not be opened. Check available app storage.";}})();
