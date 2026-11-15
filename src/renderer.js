const capsule=document.getElementById('capsule');
const clock=document.getElementById('clock');
const dateEl=document.getElementById('date');
const focusPreview=document.getElementById('focus-preview');
const focusLarge=document.getElementById('focus-large');
const focusState=document.getElementById('focus-state');
const focusLabel=document.getElementById('focus-label');
let expanded=false, focusMode=false, running=false, remaining=25*60, endAt=0, timer=null;
const pad=n=>String(n).padStart(2,'0');
function updateClock(){
 const d=new Date();
 clock.textContent=d.getHours()+':'+pad(d.getMinutes());
 dateEl.textContent=d.toLocaleDateString('en-US',{weekday:'short',day:'2-digit',month:'short'}).toUpperCase();
 document.getElementById('clock-sub').textContent=d.getHours()<12?'Good morning':d.getHours()<18?'Good afternoon':'Good evening';
}
function renderTimer(){
 const s=Math.max(0,remaining), value=pad(Math.floor(s/60))+':'+pad(s%60);
 focusPreview.textContent=value; focusLarge.textContent=value;
 focusState.textContent=running?'Focus · running':remaining===25*60?'Focus · ready':'Focus · paused';
 document.getElementById('focus-pause').textContent=running?'Pause':'Start';
 if(s===0&&running){running=false;clearInterval(timer);focusLabel.textContent='Session complete';focusState.textContent='Focus · complete';}
}
function startTimer(){
 if(running){remaining=Math.max(0,Math.ceil((endAt-Date.now())/1000));running=false;clearInterval(timer);}
 else {running=true;endAt=Date.now()+remaining*1000;focusLabel.textContent='Stay focused';timer=setInterval(()=>{remaining=Math.max(0,Math.ceil((endAt-Date.now())/1000));renderTimer();},250);}
 renderTimer();
}
function setView(view){
 focusMode=view==='focus';
 capsule.classList.toggle('focus-mode',focusMode);
 capsule.classList.toggle('quick-mode',view==='quick');
 document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.tab===view));
}
document.getElementById('focus-start').addEventListener('click',()=>{setView('focus');if(!running)startTimer();});
document.getElementById('focus-pause').addEventListener('click',startTimer);
document.getElementById('focus-stop').addEventListener('click',()=>{running=false;clearInterval(timer);remaining=25*60;focusLabel.textContent='Focus session';renderTimer();});
document.getElementById('focus-add').addEventListener('click',()=>{remaining+=300;if(running)endAt+=300000;renderTimer();});
document.getElementById('fold').addEventListener('click',()=>{capsule.classList.remove('quick-mode');});
document.getElementById('more').addEventListener('click',()=>capsule.classList.toggle('quick-mode'));
document.getElementById('quit').addEventListener('click',()=>window.close());
document.querySelectorAll('.nav-item').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.tab==='home'?'home':b.dataset.tab==='focus'?'focus':'quick')));
document.getElementById('media-play').addEventListener('click',e=>{e.currentTarget.textContent=e.currentTarget.textContent==='▶'?'Ⅱ':'▶';});
window.pisho.onExpanded(value=>{
 expanded=value;
 capsule.classList.toggle('expanded',value);
 if(!value)capsule.classList.remove('quick-mode','focus-mode');
});
window.pisho.onPointer(data=>{
 const r=capsule.getBoundingClientRect();
 const x=data.x-(data.displayX+(data.displayWidth-r.width)/2);
 const y=data.y-data.displayY;
 const dx=Math.max(-1,Math.min(1,(x-r.width/2)/(r.width/2)));
 const dy=Math.max(-1,Math.min(1,(y-28)/100));
 document.querySelectorAll('.eye').forEach(eye=>eye.style.transform='translate('+dx*3+'px,'+dy*2+'px)');
});
updateClock();renderTimer();setInterval(updateClock,1000);