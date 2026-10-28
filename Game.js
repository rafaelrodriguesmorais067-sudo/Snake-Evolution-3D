// ===== SNAKE EVOLUTION 3D — Three.js r128 =====
const $=id=>document.getElementById(id), R=Math.random, TAU=Math.PI*2;
// ---------- Dados e save ----------
const S=Object.assign({hi:0,coins:0,skin:0,owned:[0],lv:1,mv:50,sv:80,sens:50,cam:0,q:null,ach:[]},JSON.parse(localStorage.getItem('se3d')||'{}'));
const save=()=>localStorage.setItem('se3d',JSON.stringify(S));
if(S.q===null)S.q=(/Mobi|Android/i.test(navigator.userAgent)||innerWidth<700)?0:2; // qualidade automática
const SKINS=[['Verde',0x3ddc4b,0],['Vermelha',0xe53935,100],['Azul',0x2196f3,150],['Dourada',0xffc107,300],['Neon',0xff00ff,400],['Fogo',0xff5722,500],['Gelo',0x80deea,600],['Elétrica',0xffee00,800]];
// nome, meta de pontos, chão, céu
const LV=[['Prado',500,0x6abf4b,0x87ceeb],['Floresta',1000,0x2e7d32,0x6fa8a0],['Deserto',1800,0xe0c068,0xf5d9a0],['Gelo',2800,0xdff3fa,0xb3e5fc],['Vulcão',4000,0x3b2a2a,0x5a1a0a],['Mundo Neon',6000,0x120824,0x05010f]];
const FOODS=[['Maçã',10,0xff3333],['Morango',20,0xff4d88],['Laranja',30,0xff9800],['Cristal',50,0x40e0ff],['Estrela',100,0xffee33]];
const PW={mag:['Ímã',0xff00ff],spd:['Velocidade',0x00e5ff],shd:['Escudo',0x4caf50],x2:['x2 Pontos',0xffd700],red:['Redutor',0xff8a65],tp:['Teleporte',0xb388ff]};
const ACH={bite:'Primeira Mordida',giant:'Gigante (100 segmentos)',surv:'Sobrevivente (5 min)',master:'Mestre da Cobra (5000 pts)',legend:'Lendário (todas as fases)',boss:'Caçador de Chefes (derrote um chefe)'};
// ---------- Cena ----------
const scene=new THREE.Scene(), cam=new THREE.PerspectiveCamera(60,1,.1,250);
const ren=new THREE.WebGLRenderer({antialias:true,canvas:$('c')});
const sun=new THREE.DirectionalLight(0xffffff,.9); sun.position.set(15,25,10);
Object.assign(sun.shadow.camera,{left:-26,right:26,top:26,bottom:-26}); sun.shadow.mapSize.set(1024,1024);
const hemi=new THREE.HemisphereLight(0xffffff,0x445566,.75); scene.add(sun,hemi);
function resize(){ren.setSize(innerWidth,innerHeight);cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix()}
function applyQ(){ren.setPixelRatio([1,Math.min(devicePixelRatio,1.5),Math.min(devicePixelRatio,2)][S.q]);ren.shadowMap.enabled=S.q>0;sun.castShadow=S.q>0;resize()}
addEventListener('resize',resize); applyQ();
const ground=new THREE.Mesh(new THREE.PlaneGeometry(220,220),new THREE.MeshLambertMaterial());
ground.rotation.x=-Math.PI/2; ground.receiveShadow=true; scene.add(ground);
const mat=(c,e=0)=>new THREE.MeshStandardMaterial({color:c,roughness:.5,emissive:c,emissiveIntensity:e});
let W=new THREE.Group(); scene.add(W); // mundo do nível (recriado)
const G={on:false,lv:1,obs:[],foods:[],pws:[],coins:[],parts:[]}; const A=20; // metade da arena
// ---------- Cobra ----------
const snake=new THREE.Group(); scene.add(snake);
const head=new THREE.Group(); head.add(new THREE.Mesh(new THREE.SphereGeometry(.55,20,16),mat(0xffffff)));
[-1,1].forEach(s=>{const e=new THREE.Mesh(new THREE.SphereGeometry(.17,10,8),mat(0xffffff,.3));e.position.set(s*.25,.25,.38);const p=new THREE.Mesh(new THREE.SphereGeometry(.08,8,6),mat(0x111111));p.position.set(0,0,.13);e.add(p);head.add(e)});
head.children[0].castShadow=true; snake.add(head);
let skA=mat(0x3ddc4b,.2), skB=mat(0x3ddc4b,.2); const segG=new THREE.SphereGeometry(.42,14,10), segs=[];
function applySkin(){const c=SKINS[S.skin][1];[skA,skB].forEach(m=>{m.color.set(c);m.emissive.set(c)});skB.color.multiplyScalar(.7);head.children[0].material=skA}
// ---------- Utilidades ----------
function toast(t){const e=$('toast');e.textContent=t;e.style.opacity=1;clearTimeout(toast.t);toast.t=setTimeout(()=>e.style.opacity=0,1800)}
function unlock(k){if(S.ach.includes(k))return;S.ach.push(k);save();toast('🏅 '+ACH[k])}
let ac;function beep(f,d=.12,t='sine',v=.25){if(!ac)return;const o=ac.createOscillator(),g=ac.createGain();o.type=t;o.frequency.value=f;g.gain.value=v*S.sv/100;g.gain.exponentialRampToValueAtTime(.001,ac.currentTime+d);o.connect(g);g.connect(ac.destination);o.start();o.stop(ac.currentTime+d)}
const SC=[262,294,330,392,440,523,440,392];let mi=0;
setInterval(()=>{if(G.on&&ac&&!G.dead&&!paused){beep(SC[mi++%8]*(G.lv==6?2:1)*(bossOn?.7:1),.25,bossOn?'sawtooth':G.lv==6?'square':'triangle',.1*S.mv/S.sv||0)}},300);
function burst(p,c,n=14){for(let i=0;i<n;i++){const m=new THREE.Mesh(new THREE.SphereGeometry(.1,6,4),new THREE.MeshBasicMaterial({color:c}));m.position.copy(p);m.v=new THREE.Vector3(R()-.5,R()*.8+.2,R()-.5).multiplyScalar(6);m.life=.7;scene.add(m);G.parts.push(m)}}
function freePos(){for(let i=0;i<40;i++){const x=(R()-.5)*34,z=(R()-.5)*34;if(G.obs.every(o=>Math.hypot(x-o.position.x,z-o.position.z)>o.r+1.2)&&Math.hypot(x-H.x,z-H.z)>4)return new THREE.Vector3(x,.6,z)}return new THREE.Vector3(5,.6,5)}
// ---------- Construção do nível ----------
function buildLevel(n){
  scene.remove(W);W=new THREE.Group();scene.add(W);G.obs=[];const L=LV[n-1];
  ground.material.color.set(L[2]);scene.background=new THREE.Color(L[3]);scene.fog=new THREE.Fog(L[3],35,95);
  hemi.intensity=n==6?.35:.75;
  const wm=mat(n==6?0xff00cc:0x8d6e63,n==6?.8:0);
  [[0,-A,A*2,1],[0,A,A*2,1],[-A,0,1,A*2],[A,0,1,A*2]].forEach(w=>{const b=new THREE.Mesh(new THREE.BoxGeometry(w[2]+1,1.2,w[3]+(w[3]>1?1:0)),wm);b.position.set(w[0],.6,w[1]);b.castShadow=true;W.add(b)});
  for(let i=0;i<16;i++){const a=i/16*TAU,m=new THREE.Mesh(new THREE.ConeGeometry(9+R()*6,16+R()*14,6),mat(n==5?0x5a2a1a:n==4?0xeaf6ff:n==6?0x3a1a6a:0x6d7f8a,n==6?.3:0));m.position.set(Math.cos(a)*70,8,Math.sin(a)*70);W.add(m)} // montanhas
  for(let i=0;i<(S.q?9:4);i++){const c=new THREE.Mesh(new THREE.SphereGeometry(4,8,6),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:n>4?.1:.8}));c.scale.set(2,.5,1);c.position.set((R()-.5)*120,28+R()*8,(R()-.5)*120);W.add(c)} // nuvens
  for(let i=0;i<(S.q?40:15);i++){const a=R()*TAU,r=24+R()*18,g=new THREE.Group(),col=[0x2e8b3a,0x2e8b3a,0xc9a64b,0xdff3fa,0x7a2b1a,0x00e5ff][n-1];const k=new THREE.Mesh(new THREE.ConeGeometry(1.2,3.5,7),mat(col,n==6?.7:0));k.position.y=1.75;g.add(k);g.position.set(Math.cos(a)*r,0,Math.sin(a)*r);W.add(g)} // decoração fora da arena
  const no=n==1?2:3+n*2;
  for(let i=0;i<no;i++){let o,r=.9;
    if(n==1||n==5){o=new THREE.Mesh(new THREE.DodecahedronGeometry(.9),mat(n==5?0x7a1a0a:0x888888,n==5?.7:0));o.position.y=.7}
    else if(n==2){o=new THREE.Group();const t=new THREE.Mesh(new THREE.CylinderGeometry(.25,.3,1.6),mat(0x6d4c41)),l=new THREE.Mesh(new THREE.ConeGeometry(1.1,2.4,8),mat(0x1b5e20));t.position.y=.8;l.position.y=2.6;o.add(t,l);r=1}
    else if(n==3){o=new THREE.Mesh(new THREE.CylinderGeometry(.45,.5,2.4,10),mat(0x2e7d32));o.position.y=1.2;r=.7}
    else if(n==4){o=new THREE.Mesh(new THREE.OctahedronGeometry(1.1),mat(0x8fe3ff,.2));o.position.y=1}
    else{o=new THREE.Mesh(new THREE.BoxGeometry(1.2,2.4,1.2),mat(0x00ffe1,.9));o.position.y=1.2;o.mv=1;r=.9}
    const p=freePos();o.position.x=o.bx=p.x;o.position.z=p.z;o.ph=R()*TAU;o.r=r;o.castShadow=true;W.add(o);G.obs.push(o)}
  fx(n);document.body.style.background='#'+L[3].toString(16).padStart(6,'0');
}
// ---------- Estado do jogo ----------
const H={x:0,z:0,a:0}; let trail=[],len=5,score=0,coins=0,buf={},t0=0,tm=0,pwT=0,inv=0,shake=0,deadT=0,grow=0;
function start(lv){
  ac=ac||new (window.AudioContext||window.webkitAudioContext)();
  G.lv=lv;H.x=0;H.z=-10;buildLevel(lv);score=lv>1?LV[lv-2][1]:0;coins=0;len=5;H.x=0;H.z=-10;H.a=0;buf={};inv=1;shake=0;t0=performance.now();tm=0;pwT=6;
  trail=[];for(let i=0;i<150;i++)trail.push({x:H.x,z:H.z-(150-i)*.12});
  [...G.foods,...G.pws,...G.coins].forEach(m=>scene.remove(m));G.foods=[];G.pws=[];G.coins=[];
  for(let i=0;i<8;i++)spawnFood();for(let i=0;i<3;i++)spawnCoin();
  segs.forEach(s=>s.scale.setScalar(1));G.dead=false;G.on=true;$('p').innerHTML='';$('hud').hidden=false;
  if('ontouchstart' in window){$('joy').hidden=$('boost').hidden=false}
}
function spawnFood(){const r=R(),t=r<.4?0:r<.65?1:r<.82?2:r<.93?3:4,F=FOODS[t];
  const m=new THREE.Mesh(t>2?new THREE.OctahedronGeometry(.5):new THREE.SphereGeometry(.4,12,10),mat(F[2],t>2?.8:.15));m.position.copy(freePos());m.castShadow=true;m.t=t;scene.add(m);G.foods.push(m)}
function spawnCoin(){const m=new THREE.Mesh(new THREE.TorusGeometry(.35,.12,8,16),mat(0xffd700,.6));m.position.copy(freePos());scene.add(m);G.coins.push(m)}
function spawnPw(){if(G.pws.length)return;const k=Object.keys(PW)[Math.floor(R()*6)];
  const m=new THREE.Mesh(new THREE.IcosahedronGeometry(.55),mat(PW[k][1],.9));m.position.copy(freePos());m.k=k;m.life=14;scene.add(m);G.pws.push(m)}
function eat(m){const F=FOODS[m.t],p=F[1]*(buf.x2>0?2:1);score+=p;len+=m.t==4?5:m.t>=2?3:2;
  burst(m.position,F[2]);beep(520+m.t*120,.12);beep(780+m.t*100,.15,'triangle');
  scene.remove(m);G.foods.splice(G.foods.indexOf(m),1);spawnFood();unlock('bite');
  head.scale.setScalar(1.45);pw=0; // animação ao comer
  if(len>=100)unlock('giant');if(score>=5000)unlock('master');
  if(score>=LV[G.lv-1][1]&&!bossOn)goal()}
function nextLevel(){if(G.lv<6){G.lv++;S.lv=Math.max(S.lv,G.lv);save();H.x=0;H.z=-10;buildLevel(G.lv);toast('FASE '+G.lv+' — '+LV[G.lv-1][0]);beep(880,.4,'square');
  [...G.foods,...G.coins].forEach(m=>scene.remove(m));G.foods=[];G.coins=[];for(let i=0;i<8;i++)spawnFood();for(let i=0;i<3;i++)spawnCoin();H.x=0;H.z=-10;H.a=0;trail=[];for(let i=0;i<150;i++)trail.push({x:0,z:-10-(150-i)*.12});inv=2}
  else{unlock('legend');die(true)}}
function die(win){if(G.dead)return;G.dead=true;shake=1;deadT=0;burst(head.position,SKINS[S.skin][1],40);beep(120,.6,'sawtooth',.4);
  S.coins+=coins;const rec=score>S.hi;if(rec)S.hi=score;save();
  setTimeout(()=>{G.on=false;$('hud').hidden=$('joy').hidden=$('boost').hidden=true;
    show('over',`<h1 style="font-size:clamp(30px,8vw,60px)">${win?'VITÓRIA!':'GAME OVER'}</h1><h2>Pontuação: ${score.toLocaleString('pt-BR')}</h2><p>Recorde: ${S.hi.toLocaleString('pt-BR')}</p>${rec?'<h2>🎉 NOVO RECORDE!</h2>':''}<p>💰 +${coins} moedas</p><button onclick="start(${win?1:G.lv})">JOGAR NOVAMENTE</button><button class="alt" onclick="show('main')">MENU PRINCIPAL</button>`)},1500)}
// ---------- Entrada ----------
const K={};let joyX=0,joyY=0,boostT=false;
addEventListener('keydown',e=>{K[e.code]=1});addEventListener('keyup',e=>{K[e.code]=0});
const joy=$('joy'),kn=$('knob');
function jm(e){const t=e.touches[0],r=joy.getBoundingClientRect();let dx=(t.clientX-r.left-65)/45,dy=(t.clientY-r.top-65)/45,d=Math.hypot(dx,dy);if(d>1){dx/=d;dy/=d}joyX=dx;joyY=dy;kn.style.transform=`translate(${dx*35}px,${dy*35}px)`}
joy.addEventListener('touchstart',jm);joy.addEventListener('touchmove',jm);joy.addEventListener('touchend',()=>{joyX=joyY=0;kn.style.transform=''});
$('boost').addEventListener('touchstart',()=>boostT=true);$('boost').addEventListener('touchend',()=>boostT=false);
// ---------- Loop ----------
const clock=new THREE.Clock(),V=new THREE.Vector3(),lk=new THREE.Vector3();
function loop(){requestAnimationFrame(loop);const dt=Math.min(clock.getDelta(),.05),T=clock.elapsedTime;
  G.obs.forEach(o=>{if(o.mv){o.position.x=o.bx+Math.sin(T+o.ph)*3}});
  G.foods.forEach(f=>{f.rotation.y+=dt*2;f.position.y=.6+Math.sin(T*3+f.id)*.12});G.coins.forEach(c=>{c.rotation.y+=dt*3});G.pws.forEach(p=>{p.rotation.y+=dt*2;p.rotation.x+=dt});
  for(let i=G.parts.length-1;i>=0;i--){const p=G.parts[i];p.life-=dt;p.v.y-=12*dt;p.position.addScaledVector(p.v,dt);if(p.life<=0){scene.remove(p);G.parts.splice(i,1)}}
  if(G.on&&!paused)update(dt,T);
  camUpdate(dt,T);ren.render(scene,cam)}
function update(dt,T){
  head.scale.lerp(V.setScalar(1+Math.min(len*.004,.4)),dt*8);
  if(G.dead){deadT+=dt;segs.forEach((s,i)=>s.scale.setScalar(Math.max(0,1-deadT*1.2+i*.002)));shake=Math.max(0,shake-dt);return}
  tm+=dt;inv=Math.max(0,inv-dt);for(const k in buf)buf[k]=Math.max(0,buf[k]-dt);
  if(tm>300)unlock('surv');
  // virar (quanto maior a cobra, mais difícil de controlar)
  let dx=(K.KeyA||K.ArrowLeft?1:0)-(K.KeyD||K.ArrowRight?1:0)-joyX,dz=(K.KeyW||K.ArrowUp?1:0)-(K.KeyS||K.ArrowDown?1:0)-joyY;
  if(Math.hypot(dx,dz)>.25){const d=Math.atan2(dx,dz)-H.a,tn=Math.max(2.2,5.5-len*.025)*(S.sens/50)*ZT*dt; // maior = mais difícil de virar
    H.a+=Math.max(-tn,Math.min(tn,((d+Math.PI)%TAU+TAU)%TAU-Math.PI))}
  let sp=5+G.lv*.3+Math.min(len*.015,2);sp*=ZS;if(buf.spd>0)sp*=1.5;if(K.Space||K.ShiftLeft||boostT)sp*=1.4;
  H.x+=Math.sin(H.a)*sp*dt;H.z+=Math.cos(H.a)*sp*dt;
  const L=trail[trail.length-1];if(Math.hypot(H.x-L.x,H.z-L.z)>=.12){trail.push({x:H.x,z:H.z});if(trail.length>len*6+60)trail.shift()}
  head.position.set(H.x,.55,H.z);head.rotation.y=H.a;
  while(segs.length<len){const s=new THREE.Mesh(segG,segs.length%2?skA:skB);s.castShadow=true;snake.add(s);segs.push(s)}
  while(segs.length>len)snake.remove(segs.pop());
  segs.forEach((s,i)=>{const p=trail[Math.max(0,trail.length-1-Math.round((i+1)*5))];s.position.set(p.x,.42,p.z);s.scale.setScalar((1-.5*i/len+Math.sin(T*8-i*.6)*.03)*(1+Math.min(len*.004,.4))+Math.max(0,.45-Math.abs(i-pw)*.15))});
  // comida / moedas / poderes
  const mg=buf.mag>0;G.foods.slice().forEach(f=>{const d=Math.hypot(f.position.x-H.x,f.position.z-H.z);if(mg&&d<7){f.position.x+=(H.x-f.position.x)*dt*4;f.position.z+=(H.z-f.position.z)*dt*4}if(d<.95)eat(f)});
  G.coins.slice().forEach(c=>{if(Math.hypot(c.position.x-H.x,c.position.z-H.z)<.9){coins++;beep(1200,.1,'square',.15);burst(c.position,0xffd700,6);scene.remove(c);G.coins.splice(G.coins.indexOf(c),1);spawnCoin()}});
  pwT-=dt;if(pwT<=0){pwT=12;spawnPw()}
  G.pws.slice().forEach(p=>{p.life-=dt;if(p.life<=0){scene.remove(p);G.pws.splice(0,1);return}
    if(Math.hypot(p.position.x-H.x,p.position.z-H.z)<1){const k=p.k;toast(PW[k][0]+'!');beep(660,.3,'square');burst(p.position,PW[k][1],20);
      if(k=='red')len=Math.max(3,len-6);else if(k=='tp'){H.x=Math.max(-18,Math.min(18,H.x+Math.sin(H.a)*6));H.z=Math.max(-18,Math.min(18,H.z+Math.cos(H.a)*6))}else buf[k]=k=='shd'?10:8;
      scene.remove(p);G.pws.splice(0,1)}});
  // colisões
  let hit=fxHit()||Math.abs(H.x)>A-.9||Math.abs(H.z)>A-.9||G.obs.some(o=>Math.hypot(H.x-o.position.x,H.z-o.position.z)<o.r+.45);
  if(!hit)for(let i=8;i<segs.length;i++){if(Math.hypot(H.x-segs[i].position.x,H.z-segs[i].position.z)<.42){hit=true;break}}
  if(hit&&inv<=0){if(buf.shd>0){buf.shd=0;inv=1.2;H.a+=Math.PI;H.x=Math.max(-18,Math.min(18,H.x));H.z=Math.max(-18,Math.min(18,H.z));beep(300,.3,'square');toast('🛡 Escudo usado!');shake=.4}else die()}
  fxUpdate(dt,T);hud();fxBoss()}
function hud(){$('sc').textContent=score.toLocaleString('pt-BR');$('hi').textContent=Math.max(S.hi,score).toLocaleString('pt-BR');
  const a=G.lv>1?LV[G.lv-2][1]:0,b=LV[G.lv-1][1],p=Math.floor((score-a)/(b-a)*100);$('lv').textContent=`NÍVEL ${G.lv} — ${LV[G.lv-1][0]} — ${p}%`;$('barf').style.width=p+'%';
  $('cn').textContent='💰 '+(S.coins+coins)+'   📏 '+len;$('bf').textContent=Object.keys(buf).filter(k=>buf[k]>0).map(k=>PW[k][0]+' '+Math.ceil(buf[k])+'s').join(' · ')}
const cl=new THREE.Vector3(),tp=new THREE.Vector3(),tl=new THREE.Vector3();
function camUpdate(dt,T){const hp=head.position,k=1-Math.exp(-dt*3); // câmera só segue a posição; não gira com a cobra
  if(!G.on){tp.set(Math.sin(T*.15)*6,14,-22);tl.set(0,0,0)}
  else{const o=[[0,14,-12],[0,27,-5],[Math.sin(T*.25)*7,9,-14+Math.cos(T*.2)*2]][S.cam],ld=2.5,sx=Math.sin(H.a)*ld,sz=Math.cos(H.a)*ld;
    tp.set(hp.x+o[0]+sx,o[1],hp.z+o[2]+sz);tl.set(hp.x+sx,0,hp.z+sz)}
  cam.position.lerp(tp,k);cl.lerp(tl,k);if(shake>0){cam.position.x+=(R()-.5)*shake;cam.position.y+=(R()-.5)*shake}cam.lookAt(cl);
  if(G.on){sun.position.set(hp.x+15,25,hp.z+10);sun.target.position.copy(hp);sun.target.updateMatrixWorld();sun.target.parent||scene.add(sun.target)}}
// ---------- Menus ----------
function show(n,html){const p=$('p');$('hud').hidden=$('joy').hidden=$('boost').hidden=true;G.on=false;
  const B=(t,f,c='')=>`<button class="${c}" onclick="${f}">${t}</button>`;
  if(n=='over')return p.innerHTML=html;
  if(n=='main')p.innerHTML=`<h1>🐍 SNAKE EVOLUTION 3D</h1>${B('JOGAR','start(S.lv>1?S.lv:1)')}${B('FASES',"show('lv')",'alt')}${B('SKINS',"show('sk')",'alt')}${B('RECORDE',"show('rec')",'alt')}${B('CONFIGURAÇÕES',"show('cfg')",'alt')}${B('COMO JOGAR',"show('help')",'alt')}<p>💰 ${S.coins} moedas</p>`;
  if(n=='lv')p.innerHTML=`<h2>Fases</h2><div class="row">${LV.map((l,i)=>`<button ${i+1>S.lv?'disabled':''} onclick="start(${i+1})">${i+1}. ${l[0]}<br><small>meta ${l[1]}</small></button>`).join('')}</div>${B('Voltar',"show('main')",'alt')}`;
  if(n=='sk')p.innerHTML=`<h2>Skins — 💰 ${S.coins}</h2><div class="row">${SKINS.map((s,i)=>`<button class="${S.skin==i?'':'alt'}" style="border-bottom:6px solid #${s[1].toString(16).padStart(6,'0')}" onclick="pick(${i})">${s[0]}<br><small>${S.owned.includes(i)?(S.skin==i?'em uso':'usar'):'💰 '+s[2]}</small></button>`).join('')}</div>${B('Voltar',"show('main')",'alt')}`;
  if(n=='rec')p.innerHTML=`<h2>Recorde: ${S.hi.toLocaleString('pt-BR')}</h2><p>Conquistas</p>${Object.keys(ACH).map(k=>`<p>${S.ach.includes(k)?'🏅':'🔒'} ${ACH[k]}</p>`).join('')}${B('Voltar',"show('main')",'alt')}`;
  if(n=='cfg')p.innerHTML=`<h2>Configurações</h2><label>Música <input type=range value=${S.mv} oninput="S.mv=+this.value;save()"></label><label>Efeitos <input type=range value=${S.sv} oninput="S.sv=+this.value;save()"></label><label>Sensibilidade <input type=range min=20 max=100 value=${S.sens} oninput="sens(this.value)"></label><label>Qualidade <select onchange="S.q=+this.value;save();applyQ()">${['Baixo','Médio','Alto'].map((q,i)=>`<option value=${i} ${S.q==i?'selected':''}>${q}</option>`).join('')}</select></label><label>Câmera <select onchange="S.cam=+this.value;save()">${['Atrás','Superior','Cinematográfica'].map((q,i)=>`<option value=${i} ${S.cam==i?'selected':''}>${q}</option>`).join('')}</select></label>${B('Tela cheia','document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen()','alt')}${B('Voltar',"show('main')",'alt')}`;
  if(n=='help')p.innerHTML=`<h2>Como jogar</h2><p>WASD ou setas: mover a cobra · Espaço: acelerar<br>Celular: joystick à esquerda, ⚡ para acelerar.<br>Coma, cresça e desvie de paredes, obstáculos e do próprio corpo.<br>Quanto maior a cobra, mais difícil virar!<br>Fuja dos inimigos e evite lava, areia movediça e gelo escorregadio. P pausa. Nas fases 3, 5 e 6 há chefe: sobreviva até o tempo acabar!<br>Pegue poderes: Ímã, Velocidade, Escudo, x2, Redutor, Teleporte.</p>${B('Voltar',"show('main')",'alt')}`}
function pick(i){if(!S.owned.includes(i)){if(S.coins<SKINS[i][2])return toast('Moedas insuficientes');S.coins-=SKINS[i][2];S.owned.push(i)}S.skin=i;save();applySkin();show('sk')}
function sens(v){S.sens=+v;save()}
// ===== EXTRAS: inimigos, chefes, efeitos de fase, dia/noite, pausa =====
let paused=false,ZT=1,ZS=1,bossOn=false,bossDone=false,bossT=0,boss=null,dayT=0,storm=0,sf=0,stormT=18,enemies=[],zones=[],wp=null,starM=null;
const EN={2:['Rato',0x9e9e9e,2.6,0],3:['Escorpião',0xd2691e,2.4,1],4:['Aranha',0x4a4a8a,3,1],5:['Aranha de Lava',0xff3d00,3.2,1],6:['Águia Neon',0x00ffe1,4,1]}; // nome,cor,vel,persegue
const BOSS={3:['REI ESCORPIÃO',0xb5651d,30],5:['GOLEM DE LAVA',0xff3d00,35],6:['SOBERANO NEON',0xff00cc,40]}; // nome,cor,segundos
const WX=[0,[0xffffaa,.2,-.3,.5],[0x88cc44,.25,-1,.8],[0xe8c882,.2,-.2,9],[0xffffff,.25,-2,.3],[0xff6a1a,.2,2.5,.4],[0x00ffe1,.2,1.5,.2]]; // clima: cor,tamanho,vy,vx
const night=new THREE.Color(0x050a1a),SAND=new THREE.Color(0xd2b27a),baseSky=new THREE.Color(),hl=new THREE.PointLight(0xfff2cc,0,14);scene.add(hl);
const FG=new THREE.SphereGeometry(.14,6,5),FM=[0xff4081,0xffeb3b,0xffffff,0xb388ff].map(c=>mat(c,.3));
function critter(c,s,eagle){const g=new THREE.Group(),m=mat(c,.25),b=new THREE.Mesh(new THREE.SphereGeometry(.5*s,12,10),m);b.scale.set(1,.7,1.4);b.position.y=.4*s;g.add(b);
  if(eagle)[-1,1].forEach(x=>{const w=new THREE.Mesh(new THREE.BoxGeometry(1.4*s,.06,.6*s),m);w.position.set(x*.8*s,.4*s,0);g.add(w)});
  else{for(let i=0;i<6;i++){const l=new THREE.Mesh(new THREE.CylinderGeometry(.04*s,.04*s,.7*s),m);l.rotation.z=1.25*(i%2?1:-1);l.position.set((i%2?1:-1)*.5*s,.25*s,(Math.floor(i/2)-1)*.35*s);g.add(l)}
    for(let i=1;i<=3;i++){const t=new THREE.Mesh(new THREE.SphereGeometry(.2*s,8,6),m);t.position.set(0,.4*s+i*.3*s,-.5*s-i*.12*s);g.add(t)}}
  [-1,1].forEach(x=>{const e=new THREE.Mesh(new THREE.SphereGeometry(.09*s,6,6),mat(0xff0000,1));e.position.set(x*.2*s,.55*s,.6*s);g.add(e)});
  g.traverse(o=>{if(o.isMesh)o.castShadow=true});return g}
function fx(n){ // chamado ao montar cada fase
  paused=false;ZT=ZS=1;bossOn=bossDone=false;boss=null;storm=sf=0;stormT=18;dayT=0;enemies=[];zones=[];baseSky.set(LV[n-1][3]);
  const zt={1:0,2:0,3:1,4:2,5:3}[n]; // 0 água, 1 areia movediça, 2 gelo escorregadio, 3 lava mortal
  if(zt!==undefined)for(let i=0;i<(n==1?2:3);i++){const p=freePos(),r=2+R()*1.3,m=new THREE.Mesh(new THREE.CircleGeometry(r,28),mat([0x2e86de,0xb8860b,0xaee9ff,0xff3d00][zt],zt==3?1:.1));m.rotation.x=-Math.PI/2;m.position.set(p.x,.04,p.z);W.add(m);zones.push({x:p.x,z:p.z,r,t:zt})}
  if(n<3)for(let i=0;i<30;i++){const f=new THREE.Mesh(FG,FM[i%4]);f.position.set((R()-.5)*38,.15,(R()-.5)*38);W.add(f)}
  if(n==3)for(let i=0;i<9;i++){const d=new THREE.Mesh(new THREE.SphereGeometry(3,10,6),mat(0xd8b45a));d.scale.set(1.6,.1,1.6);d.position.set((R()-.5)*44,0,(R()-.5)*44);W.add(d)}
  if(n==6){const g=new THREE.GridHelper(40,40,0xff00cc,0x00e5ff);g.position.y=.03;W.add(g)}
  starM=null;if(n>=3&&n<6){const a=new Float32Array(600);for(let i=0;i<200;i++){const t=R()*TAU,u=.15+R()*.8;a.set([Math.cos(t)*90*Math.cos(u),90*Math.sin(u)+5,Math.sin(t)*90*Math.cos(u)],i*3)}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(a,3));starM=new THREE.PointsMaterial({color:0xffffff,size:1.2,transparent:true,opacity:0,fog:false});W.add(new THREE.Points(g,starM))}
  const w=WX[n],N=[150,400,800][S.q],a=new Float32Array(N*3);for(let i=0;i<N;i++)a.set([(R()-.5)*44,R()*14,(R()-.5)*44],i*3);
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(a,3));wp=new THREE.Points(g,new THREE.PointsMaterial({color:w[0],size:w[1],transparent:true,opacity:.8,depthWrite:false}));wp.frustumCulled=false;W.add(wp);
  const E=EN[n];if(E)for(let i=0;i<Math.min(n,4);i++){const p=freePos(),eg=n==6,g=critter(E[1],eg?1.4:1.1,eg);W.add(g);enemies.push({g,x:p.x,z:p.z,a:R()*TAU,sp:E[2],ch:E[3],r:eg?.7:.6,eg})}}
function mv(e,dt,T,chase,sp){ // movimento de inimigos e chefe
  if(chase){const d=Math.atan2(H.x-e.x,H.z-e.z)-e.a;e.a+=Math.max(-2.5,Math.min(2.5,(((d+Math.PI)%TAU+TAU)%TAU-Math.PI)*3))*dt}else e.a+=(R()-.5)*dt*6;
  e.x+=Math.sin(e.a)*sp*dt;e.z+=Math.cos(e.a)*sp*dt;const L=e.lim||18;
  if(Math.abs(e.x)>L){e.x=Math.sign(e.x)*L;e.a=-e.a}if(Math.abs(e.z)>L){e.z=Math.sign(e.z)*L;e.a=Math.PI-e.a}
  e.g.position.set(e.x,e.eg?1.3+Math.sin(T*3)*.3:0,e.z);e.g.rotation.y=e.a;
  if(e.eg){e.g.children[1].rotation.z=Math.sin(T*14)*.5;e.g.children[2].rotation.z=-Math.sin(T*14)*.5}}
function fxHit(){return enemies.some(e=>Math.hypot(H.x-e.x,H.z-e.z)<e.r+.5)||(boss&&Math.hypot(H.x-boss.x,H.z-boss.z)<2.2)||zones.some(z=>z.t==3&&Math.hypot(H.x-z.x,H.z-z.z)<z.r-.2)}
function goal(){if(BOSS[G.lv]&&!bossDone&&!bossOn)startBoss();else if(!bossOn)nextLevel()}
function startBoss(){const B=BOSS[G.lv];bossOn=true;bossT=B[2];const g=critter(B[1],3);W.add(g);boss={g,x:-H.x,z:H.z>0?-14:14,a:0,cd:4,dash:0,lim:17};
  toast('👑 '+B[0]+'! Sobreviva '+B[2]+'s');beep(80,.8,'sawtooth',.5);shake=.5}
function bossWin(){burst(new THREE.Vector3(boss.x,1,boss.z),BOSS[G.lv][1],60);W.remove(boss.g);boss=null;bossOn=false;bossDone=true;score+=500;unlock('boss');beep(660,.2,'square');beep(990,.4,'square');nextLevel();toast('👑 CHEFE DERROTADO! +500')}
function fxUpdate(dt,T){pw+=dt*25;tg.scale.z=.6+Math.max(0,Math.sin(T*6));
  dayT+=dt*TAU/90;const day=G.lv>=3&&G.lv<6?.5+.5*Math.cos(dayT):1,nt=1-day; // ciclo dia/noite (fases 3 a 5)
  if(G.lv==3){stormT-=dt;if(stormT<=0){storm=storm?0:1;stormT=storm?9:22;if(storm)toast('🌪 Tempestade de areia!')}}
  sf+=((storm?1:0)-sf)*dt*1.5;
  scene.background.copy(baseSky).lerp(night,nt*.85).lerp(SAND,sf*.7);scene.fog.color.copy(scene.background);scene.fog.near=35-30*sf;scene.fog.far=95-60*sf;
  sun.intensity=.9*(1-nt*.85);hemi.intensity=(G.lv==6?.35:.75)*(1-nt*.7);hl.intensity=nt*1.5+(G.lv==6?1:0);hl.position.set(H.x,2.5,H.z);
  if(starM)starM.opacity=nt;H.x+=sf*1.2*dt; // vento da tempestade
  const P=wp.geometry.attributes.position,a=P.array,w=WX[G.lv];
  for(let i=0;i<a.length;i+=3){a[i]+=(w[3]*(1+sf*3)+Math.sin(T+i)*.3)*dt;a[i+1]+=w[2]*dt;if(a[i+1]<0)a[i+1]=14;if(a[i+1]>14)a[i+1]=0;
    if(a[i]-H.x>22)a[i]-=44;else if(a[i]-H.x<-22)a[i]+=44;if(a[i+2]-H.z>22)a[i+2]-=44;else if(a[i+2]-H.z<-22)a[i+2]+=44}P.needsUpdate=true;
  ZT=ZS=1;zones.forEach(z=>{if(Math.hypot(H.x-z.x,H.z-z.z)<z.r){if(z.t==0)ZS=.85;if(z.t==1)ZS=.6;if(z.t==2)ZT=.3}});
  enemies.forEach(e=>mv(e,dt,T,e.ch&&Math.hypot(H.x-e.x,H.z-e.z)<13,e.sp));
  if(boss){boss.cd-=dt;if(boss.cd<=0){boss.dash=1.2;boss.cd=6;shake=.3;beep(90,.4,'sawtooth',.4)}
    let sp=3+G.lv*.25;if(boss.dash>0){boss.dash-=dt;sp*=2.5}mv(boss,dt,T,true,sp);bossT-=dt;if(bossT<=0)bossWin()}
  if(S.skin>=4&&R()<dt*14&&segs.length)burst(segs[segs.length-1].position,[0xff00ff,0xff5722,0x80deea,0xffee00][S.skin-4],1); // rastro da skin
  cam.fov+=((K.Space||K.ShiftLeft||boostT||buf.spd>0?72:60)-cam.fov)*dt*5;cam.updateProjectionMatrix()}
function fxBoss(){if(!bossOn||!boss)return;$('lv').textContent='👑 CHEFE: '+BOSS[G.lv][0];$('barf').style.width=(bossT/BOSS[G.lv][2]*100)+'%';$('bf').textContent='Sobreviva '+Math.ceil(bossT)+'s! '+$('bf').textContent}
addEventListener('keydown',e=>{if((e.code=='KeyP'||e.code=='Escape')&&G.on&&!G.dead){paused=!paused;paused?toast('⏸ PAUSADO (P)'):($('toast').style.opacity=0)}});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&G.on)paused=true});$('hud').onclick=()=>{if(G.on)paused=!paused};
let pw=99;ren.toneMapping=THREE.ACESFilmicToneMapping;ren.toneMappingExposure=1.25;ren.shadowMap.type=THREE.PCFSoftShadowMap;
const gc=document.createElement('canvas');gc.width=gc.height=64;const gx=gc.getContext('2d');gx.fillStyle='#fff';gx.fillRect(0,0,64,64);gx.fillStyle='#e0e0e0';gx.fillRect(0,0,32,32);gx.fillRect(32,32,32,32);
const gt=new THREE.CanvasTexture(gc);gt.wrapS=gt.wrapT=THREE.RepeatWrapping;gt.repeat.set(55,55);gt.anisotropy=4;ground.material.map=gt;ground.material.needsUpdate=true;
const tg=new THREE.Mesh(new THREE.BoxGeometry(.07,.02,.45),mat(0xff2255,.5));tg.position.set(0,-.08,.8);head.add(tg);
applySkin();show('main');loop();