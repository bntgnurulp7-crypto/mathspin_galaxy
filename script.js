// ===== DATA DASAR =====
const CATS=[
 {s:"+",n:"Penjumlahan"},{s:"−",n:"Pengurangan"},{s:"×",n:"Perkalian"},
 {s:"÷",n:"Pembagian"},{s:"√",n:"Akar kuadrat"},{s:"π",n:"Geometri"}
];
const TIMES=[180,180,180], LEVELS=["🌱 Mudah","🚀 Sedang","🔥 Sulit"];
const R=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;
const pick=a=>a[R(0,a.length-1)];
const fmt=n=>n.toLocaleString("id-ID");

// ===== GENERATOR SOAL (acak; permainan memakai tingkat sedang = indeks 1) =====
const GEN=[
 d=>{const g=[[11,60],[101,499],[1001,4999]][d],a=R(...g),b=R(...g);return{q:`${fmt(a)} + ${fmt(b)} = ?`,v:a+b,h:"Jumlahkan dari satuan, puluhan, lalu ratusan."}},
 d=>{const g=[[11,60],[101,499],[1001,4999]][d];let a=R(...g)+R(...g),b=R(...g);if(a<b)[a,b]=[b,a];return{q:`${fmt(a)} − ${fmt(b)} = ?`,v:a-b,h:"Kurangi bertahap, mulai dari satuan."}},
 d=>{const g=[[2,9,2,9],[11,25,3,12],[12,39,11,29]][d],a=R(g[0],g[1]),b=R(g[2],g[3]);return{q:`${a} × ${b} = ?`,v:a*b,h:`Pecah menjadi ${a} × (${b-b%10} + ${b%10}).`}},
 d=>{const g=[[2,9,2,12],[6,15,6,25],[11,29,12,40]][d],b=R(g[0],g[1]),q=R(g[2],g[3]);return{q:`${b*q} ÷ ${b} = ?`,v:q,h:`Cari bilangan yang jika dikali ${b} hasilnya ${b*q}.`}},
 d=>{if(d<2){const n=d?R(11,25):R(2,12);return{q:`√${n*n} = ?`,v:n,h:`Cari bilangan yang kuadratnya ${n*n}.`}}const k=R(2,9),n=R(6,20);return{q:`${k} × √${n*n} = ?`,v:k*n,h:`Hitung √${n*n} dulu, lalu kalikan ${k}.`}},
 d=>{const L=[
  ()=>{const p=R(3,15),l=R(2,p);return{q:`Luas persegi panjang ${p} cm × ${l} cm?`,v:p*l,u:" cm²",h:"Luas = panjang × lebar."}},
  ()=>{const p=R(5,20),l=R(3,15);return{q:`Keliling persegi panjang ${p} cm × ${l} cm?`,v:2*(p+l),u:" cm",h:"Keliling = 2 × (p + l)."}},
  ()=>{const r=7*R(1,3);return{q:`Keliling lingkaran r = ${r} cm (π = 22/7)?`,v:44*r/7,u:" cm",h:"Keliling = 2 × π × r."}},
  ()=>{const a=2*R(3,15),t=R(4,12);return{q:`Luas segitiga alas ${a} cm, tinggi ${t} cm?`,v:a*t/2,u:" cm²",h:"Luas = ½ × alas × tinggi."}},
  ()=>{const r=pick([7,14,21]);return{q:`Luas lingkaran r = ${r} cm (π = 22/7)?`,v:22*r*r/7,u:" cm²",h:"Luas = π × r × r."}}
 ];return pick(d===0?L.slice(0,2):d===1?L.slice(0,4):L.slice(2))()}
];

function buildQuestion(cat,d){
 const g=GEN[cat](d),set=new Set([g.v]),opts=[g.v];
 let guard=0;
 while(opts.length<4&&guard++<60){
  const off=pick([1,2,5,10,Math.max(1,Math.round(g.v*.1)),Math.max(1,Math.round(g.v*.2))]);
  const c=g.v+pick([-1,1])*off;
  if(c>0&&!set.has(c)){set.add(c);opts.push(c)}
 }
 opts.sort(()=>Math.random()-.5);
 return{q:g.q,h:g.h,u:g.u||"",a:opts.map(o=>fmt(o)+(g.u||"")),c:opts.indexOf(g.v)};
}

// ===== STATE =====
let lvl=1,score=0,streak=0,bestStreak=0,correct=0,current=0,answered=true,spinning=false,
 rot=0,cq=null,hintUsed=false,tl=0,timerId=null,musicOn=false,soundOn=true,ctx=null;
const $=id=>document.getElementById(id);

// ===== PENYIMPANAN SKOR TERTINGGI =====
function getBest(l){try{return +localStorage.getItem("msg-best-"+l)||0}catch(e){return 0}}
function setBest(l,v){try{localStorage.setItem("msg-best-"+l,v)}catch(e){}}
function showBest(){const b=getBest(1);$("best1").textContent=b?"🏅 Skor tertinggi: "+b:""}

// ===== AUDIO =====
function audio(){if(!ctx)ctx=new(window.AudioContext||window.webkitAudioContext)();if(ctx.state==="suspended")ctx.resume();return ctx}
function tone(f,d=.15,t="sine",v=.07){
 if(!soundOn)return;
 try{const c=audio(),o=c.createOscillator(),g=c.createGain();o.type=t;o.frequency.value=f;
 g.gain.setValueAtTime(v,c.currentTime);g.gain.exponentialRampToValueAtTime(.001,c.currentTime+d);
 o.connect(g);g.connect(c.destination);o.start();o.stop(c.currentTime+d)}catch(e){}
}
const sCorrect=()=>{tone(523);setTimeout(()=>tone(659),100);setTimeout(()=>tone(784,.25),200)};
const sWrong=()=>tone(220,.3,"triangle");
function toggleSound(){soundOn=!soundOn;$("soundBtn").textContent=soundOn?"🔊 Suara: ON":"🔇 Suara: OFF"}

// Lagu original bergaya chiptune: melodi + bass + drum + arpeggio (progresi C - Am - F - G)
let mg=null,noiseBuf=null,mTimer=null,nextT=0,mStep=0,SP=60/132/4;
const LA=[[72,0,76,0,79,0,76,72,0,76,79,0,84,0,79,0],[69,0,72,0,76,0,72,69,0,72,76,0,81,0,76,0],[65,0,69,0,72,0,69,65,0,69,72,0,77,0,72,0],[67,0,71,0,74,0,71,67,0,71,74,79,77,74,71,0]];
const LB=[[79,0,79,76,0,72,0,76,79,0,84,0,83,0,79,0],[81,0,81,79,0,76,0,72,76,0,81,0,79,0,76,0],[77,0,77,74,0,72,0,69,72,0,77,0,76,0,72,0],[74,0,76,77,0,79,0,83,86,0,83,0,79,0,74,0]];
const ROOT=[36,33,41,43],CH=[[60,64,67],[57,60,64],[53,57,60],[55,59,62]];
const mid=m=>440*Math.pow(2,(m-69)/12);
function note(f,t,d,type,v){const c=ctx,o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.setValueAtTime(f,t);g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(mg);o.start(t);o.stop(t+d+.02)}
function kick(t){const c=ctx,o=c.createOscillator(),g=c.createGain();o.type="sine";o.frequency.setValueAtTime(150,t);o.frequency.exponentialRampToValueAtTime(45,t+.12);g.gain.setValueAtTime(.55,t);g.gain.exponentialRampToValueAtTime(.001,t+.2);o.connect(g);g.connect(mg);o.start(t);o.stop(t+.22)}
function noise(t,d,v,hp){const c=ctx;if(!noiseBuf){noiseBuf=c.createBuffer(1,c.sampleRate,c.sampleRate);const a=noiseBuf.getChannelData(0);for(let i=0;i<a.length;i++)a[i]=Math.random()*2-1}const s=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();s.buffer=noiseBuf;f.type="highpass";f.frequency.value=hp;g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);s.connect(f);f.connect(g);g.connect(mg);s.start(t);s.stop(t+d)}
function sched(s,t){
 const bar=Math.floor(s/16)%4,st=s%16,sec=Math.floor(s/64)%2;
 const lead=(sec?LB:LA)[bar][st];
 if(lead)note(mid(lead),t,SP*1.8,"square",.045);
 if(st%2===0)note(mid(ROOT[bar]+(st%4?12:0)),t,SP*1.8,"triangle",.16);
 if(st%4===0)kick(t);
 if(st===4||st===12){noise(t,.14,.14,1500);note(190,t,.08,"triangle",.1)}
 if(bar===3&&st>=12&&st%2===0)noise(t,.08,.1,1800);
 if(st%2===1)noise(t,.04,.05,7000);else if(st%4===2)noise(t,.05,.07,7000);
 if(sec)note(mid(CH[bar][st%3]+12),t,SP,"square",.02);
}
function startMusic(){
 const c=audio();stopMusic();mStep=0;nextT=c.currentTime+.08;
 if(!mg){mg=c.createGain();mg.gain.value=.5;mg.connect(c.destination)}
 mTimer=setInterval(()=>{
  if(nextT<c.currentTime-.3)nextT=c.currentTime+.05;
  while(nextT<c.currentTime+.15){
   SP=60/(132+Math.min(streak,6)*4)/4; // tempo naik saat streak bertambah
   if(soundOn)sched(mStep,nextT);
   mStep++;nextT+=SP;
  }
 },30);
}
function stopMusic(){clearInterval(mTimer);mTimer=null}
function toggleMusic(){
 musicOn=!musicOn;$("musicBtn").textContent=musicOn?"🎵 Musik: ON":"🎵 Musik: OFF";
 if(musicOn){try{startMusic()}catch(e){}}else stopMusic();
}

// ===== NAVIGASI LAYAR =====
function screen(id){["start","gamePanel","result"].forEach(s=>$(s).classList.toggle("hidden",s!==id))}
function goMenu(){clearInterval(timerId);showBest();screen("start")}

// ===== RODA =====
function buildWheel(){
 $("lights").innerHTML=Array.from({length:18},(_,k)=>`<u style="transform:rotate(${k*20}deg)"><s></s></u>`).join("");
 $("wheel").innerHTML=CATS.map((c,i)=>`<i style="transform:rotate(${30+60*i}deg)"><b>${c.s}</b></i>`).join("");
}

// ===== PERMAINAN =====
function startGame(l){
 lvl=l;score=0;streak=0;bestStreak=0;correct=0;current=0;
 if(!window.mAsked){window.mAsked=1;if(!musicOn)toggleMusic()}
 $("levelStat").textContent=LEVELS[l];
 $("wheel").style.transition="none";rot=0;$("wheel").style.transform="rotate(0deg)";
 void $("wheel").offsetWidth;$("wheel").style.transition="";
 screen("gamePanel");resetQuestion();
 window.scrollTo({top:0,behavior:"smooth"});
}

function resetQuestion(){
 answered=true;clearInterval(timerId);
 $("number").textContent=current+1;
 $("cat").textContent="Menunggu putaran";$("clock").textContent="⏱️ 3:00";
 $("question").textContent="Putar roda untuk mendapatkan soal!";
 $("answers").innerHTML=["A","B","C","D"].map(x=>`<button class="answer" disabled>${x}</button>`).join("");
 $("feedback").textContent="Siap untuk soal berikutnya?";
 $("wheelMessage").textContent="Putar roda untuk mendapatkan soal.";
 $("timeBar").style.width="100%";$("timeBar").style.background="";
 $("nextBtn").disabled=true;$("hintBtn").disabled=true;$("spinBtn").disabled=false;
 updateStats();
}

function spinWheel(){
 if(spinning||!answered||current>=10)return;
 spinning=true;answered=false;
 $("spinBtn").disabled=true;
 const i=R(0,5),jitter=R(-20,20);$("wrap").classList.add("spin");
 // roda berhenti tepat di segmen i, di bawah panah
 const need=(((-(rot+30+60*i)+jitter)%360)+360)%360;
 rot+=1800+need;
 $("wheel").style.transform=`rotate(${rot}deg)`;
 $("wheelMessage").textContent="✨ Roda sedang berputar...";
 let t=0;const tick=setInterval(()=>{tone(440+(t++%6)*40,.06,"square",.03);if(t>18)clearInterval(tick)},200);
 setTimeout(()=>{
  spinning=false;
  $("wheelMessage").textContent=`Kamu mendapat ${CATS[i].s} ${CATS[i].n}!`;$("wrap").classList.remove("spin");const rv=$("reveal");rv.textContent=CATS[i].s;rv.classList.remove("show");void rv.offsetWidth;rv.classList.add("show");confetti(8);
  showQuestion(i);
 },4100);
}

function showQuestion(i){
 cq=buildQuestion(i,lvl);hintUsed=false;
 $("cat").textContent=`${CATS[i].s} ${CATS[i].n}`;
 $("question").textContent=cq.q;
 $("answers").innerHTML="";
 cq.a.forEach((a,k)=>{
  const b=document.createElement("button");b.className="answer";
  b.textContent=String.fromCharCode(65+k)+". "+a;
  b.onclick=()=>checkAnswer(k);
  $("answers").appendChild(b);
 });
 $("feedback").textContent="Pilih jawaban yang menurutmu benar!";
 $("hintBtn").disabled=false;
 startTimer();
}

function startTimer(){
 const total=TIMES[lvl];tl=total;
 $("timeBar").style.width="100%";$("timeBar").style.background="";
 clearInterval(timerId);
 timerId=setInterval(()=>{
  tl=Math.max(0,tl-.1);
  const p=tl/total*100;
  $("timeBar").style.width=p+"%";const sc=Math.ceil(tl);$("clock").textContent="⏱️ "+Math.floor(sc/60)+":"+String(sc%60).padStart(2,"0");
  $("timeBar").style.background=p<30?"var(--pink)":p<60?"var(--gold)":"";
  if(tl<=0){clearInterval(timerId);checkAnswer(-1)}
 },100);
}

function checkAnswer(k){
 if(answered)return;
 answered=true;clearInterval(timerId);
 const btns=document.querySelectorAll("#answers .answer");
 btns.forEach(b=>b.disabled=true);
 if(k===cq.c){
  streak++;correct++;bestStreak=Math.max(bestStreak,streak);
  /* skor: 10 poin per jawaban benar, maksimal 100 */
  score+=10;
  btns[k].classList.add("correct");
  $("feedback").textContent=streak>=3?`🔥 Benar! +10 poin (streak ${streak})`:"🎉 Benar! +10 poin";
  sCorrect();if(streak>=3)confetti(18);
 }else{
  streak=0;
  if(k>=0)btns[k].classList.add("wrong");
  btns[cq.c].classList.add("correct");
  $("feedback").textContent=(k<0?"⏰ Waktu habis! ":"Belum tepat! ")+"Jawaban yang benar: "+cq.a[cq.c];
  sWrong();
 }
 updateStats();
 $("nextBtn").disabled=false;$("hintBtn").disabled=true;
}

function showHint(){
 if(!cq||answered||hintUsed)return;
 hintUsed=true;$("hintBtn").disabled=true;
 $("feedback").textContent="💡 Petunjuk: "+cq.h;
}

function nextQuestion(){
 if(!answered)return;
 current++;
 if(current>=10){finishGame();return}
 resetQuestion();
}

function updateStats(){
 $("score").textContent=score;$("streak").textContent=streak;
 $("number").textContent=Math.min(current+1,10);
 $("progress").style.width=(current/10*100)+"%";
}

function finishGame(){
 clearInterval(timerId);
 const best=Math.max(getBest(lvl),score);setBest(lvl,best);
 $("finalScore").textContent=score;$("fCorrect").textContent=correct;
 $("fStreak").textContent=bestStreak;$("fBest").textContent=best;
 let r,m;
 if(correct>=9){r="🏆 GALAXY MASTER!";m="Luar biasa! Kamu adalah bintang matematika!"}
 else if(correct>=7){r="🌟 SPACE EXPLORER!";m="Keren! Kamu sudah menguasai banyak soal."}
 else if(correct>=5){r="🚀 STAR LEARNER!";m="Bagus! Terus berlatih dan tingkatkan skormu."}
 else{r="🌱 LITTLE ASTRONAUT!";m="Jangan menyerah! Coba lagi, kamu pasti bisa."}
 $("rank").textContent=r;$("resultMessage").textContent=m;
 screen("result");confetti(correct>=7?40:15);
 tone(523,.2);setTimeout(()=>tone(659,.2),200);setTimeout(()=>tone(784,.3),400);
}

// ===== EFEK =====
function confetti(n){
 const e=["✨","⭐","🎉","💜","🌟"];
 for(let i=0;i<n;i++){
  const s=document.createElement("span");s.className="confetti";s.textContent=pick(e);
  s.style.left=R(0,98)+"vw";s.style.animationDelay=Math.random()*.6+"s";
  document.body.appendChild(s);setTimeout(()=>s.remove(),3000);
 }
}
for(let i=0;i<40;i++){
 const s=document.createElement("div");s.className="star";s.textContent="✦";
 s.style.left=Math.random()*100+"vw";s.style.top=Math.random()*100+"vh";
 s.style.fontSize=(8+Math.random()*14)+"px";s.style.animationDelay=Math.random()*2+"s";
 document.body.appendChild(s);
}

buildWheel();showBest();