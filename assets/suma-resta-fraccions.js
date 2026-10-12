/* Aplicatiu «Suma i resta de fraccions» · el munta suma-resta-fraccions.html
   Passos: m.c.m. (per descomposició, llista de múltiples o directament),
   comú denominador, suma/resta dels numeradors i simplificació. */
(function(){
"use strict";
const $ = s => document.querySelector(s);
const rand = (a,b) => a + Math.floor(Math.random()*(b-a+1));
const pick = arr => arr[Math.floor(Math.random()*arr.length)];
function gcd(a,b){ a=Math.abs(a); b=Math.abs(b); while(b){ [a,b]=[b,a%b]; } return a; }
const lcm = (a,b) => a/gcd(a,b)*b;
function isPrime(n){ if(n<2) return false; for(let p=2;p*p<=n;p++) if(n%p===0) return false; return true; }
function factorHTML(n){
  if(n===1) return '1';
  const parts=[]; let m=n;
  for(let p=2;p*p<=m;p++){ let e=0; while(m%p===0){ m/=p; e++; } if(e) parts.push(e>1?`${p}<sup>${e}</sup>`:`${p}`); }
  if(m>1) parts.push(String(m));
  return parts.join(' · ');
}
function smallestCommon(a,b){ const g=gcd(a,b); for(let p=2;p<=g;p++) if(g%p===0) return p; return 1; }
const pl = (n,s,p) => n===1 ? s : p;
const wlen = n => Math.max(2,String(Math.abs(n)).length);

/* Els denominadors només tenen factors 2, 3, 5 i 7 */
const PRIMS=[2,3,5,7];
function expo(n,p){ let e=0; while(n%p===0){ n/=p; e++; } return e; }

/* ---------- generadors ---------- */
const DEN_FACIL=[2,3,4,5,6,8,9,10,12];
const DEN_NORMAL=[2,3,4,5,6,7,8,9,10,12,14,15,16,18,20];
function numIrr(d,max){ let n; do{ n=rand(1,max); }while(gcd(n,d)!==1); return n; }
const valor = t => t.s*t.n/t.d;

function genFacil(){
  for(;;){
    const b=pick(DEN_FACIL), d=pick(DEN_FACIL);
    if(b===d) continue;
    const m=lcm(b,d);
    if(m>36 || m/Math.min(b,d)>12) continue;
    let t1={s:1,n:numIrr(b,b-1),d:b}, t2={s:1,n:numIrr(d,d-1),d:d};
    const resta=Math.random()<0.5;
    if(resta){
      if(t1.n*d===t2.n*b) continue;               // no volem 0
      if(t1.n*d<t2.n*b) [t1,t2]=[t2,t1];           // resultat positiu
      t2.s=-1;
    }
    return [t1,t2];
  }
}
function genNormal(){
  for(;;){
    const k=pick([2,3,3]);
    const ts=[];
    for(let i=0;i<k;i++){
      const d=pick(DEN_NORMAL);
      const n=numIrr(d, Math.random()<0.3 ? 2*d-1 : d-1);
      ts.push({s:(i===0 ? (Math.random()<0.3?-1:1) : pick([1,-1])), n, d});
    }
    const dens=ts.map(t=>t.d);
    if(new Set(dens).size<2) continue;
    const m=dens.reduce(lcm);
    if(m>180 || m/Math.min(...dens)>15) continue;
    const num=ts.reduce((a,t)=>a+t.s*t.n*(m/t.d),0);
    if(num===0) continue;
    return ts;
  }
}

function solve(ts){
  const dens=[...new Set(ts.map(t=>t.d))];
  const m=dens.reduce(lcm);
  const N=ts.map(t=>t.n*(m/t.d));
  const num=ts.reduce((a,t,i)=>a+t.s*N[i],0);
  const g=gcd(num,m);
  return {dens,m,N,num,rn:num/g,rd:m/g};
}

/* ---------- format ---------- */
const frac = (t,b) => `<span class="frac"><span>${t}</span><span>${b}</span></span>`;
const fracS = (n,d) => n<0 ? `<span class="opr">−</span>${frac(-n,d)}` : frac(n,d);
const signe = (s,primer) => primer ? (s<0?'<span class="opr">−</span>':'') : `<span class="opr">${s<0?'−':'+'}</span>`;
const expr = (ts,f) => ts.map((t,i)=>signe(t.s,i===0)+f(t,i)).join(' ');
const exprText = (ts,vals) => ts.map((t,i)=>(i===0 ? (t.s<0?'−':'') : (t.s<0?' − ':' + '))+vals[i]).join('');
function box(id,w,label,cls){ return `<input id="${id}" class="box${cls?' '+cls:''}" inputmode="numeric" autocomplete="off" spellcheck="false" style="width:${w+0.8}ch" aria-label="${label}">`; }

/* ---------- estat ---------- */
const state = {nivell:'facil', met:'desc', ts:null, s:null, steps:[], cur:0, errs:0, hint:false, saltat:false};
let stats = {fets:0, primera:0, ratxa:0};
try{ const raw=localStorage.getItem('srfrac-stats'); if(raw) stats=Object.assign(stats,JSON.parse(raw)); }catch(e){}
try{ const mt=localStorage.getItem('srfrac-mcm'); if(['desc','llista','directe'].includes(mt)) state.met=mt; }catch(e){}
function saveStats(){ try{ localStorage.setItem('srfrac-stats',JSON.stringify(stats)); }catch(e){} }
function renderStats(){
  $('#stats').innerHTML = `<span class="xip">Fets <strong>${stats.fets}</strong></span><span class="xip${stats.primera?' verd':''}">Bé a la primera <strong>${stats.primera}</strong></span><span class="xip${stats.ratxa>=3?' verd':''}">Ratxa <strong>${stats.ratxa}</strong></span><button class="enllac" id="reset" type="button">Posa a zero</button>`;
  $('#reset').onclick = () => { stats={fets:0,primera:0,ratxa:0}; saveStats(); renderStats(); };
}

/* ---------- pas 1: m.c.m. ---------- */
const METODES = {desc:'Descomposició', llista:'Llista de múltiples', directe:'Directament'};
function primsVisibles(dens){
  const usats=PRIMS.filter(p=>dens.some(d=>d%p===0));
  const max=Math.max(...usats);
  return PRIMS.filter(p=>p<=max);
}
function multiples(d,m){ const out=[]; for(let x=d;x<=m+d;x+=d) out.push(x); return out; }

/* Fila de la taula de descomposició (barra vertical): quocient | divisor primer */
const filaBV = (j,r,d) => `<div class="bv-fila" data-r="${r}"><span class="bv-n">${box(`b${j}_q${r}`,wlen(d),`quocient de la fila ${r+1}`)}</span><span class="bv-p">${box(`b${j}_p${r}`,2,`divisor primer de la fila ${r+1}`)}</span></div>`;
/* Quan s'escriu un quocient: si és 1 s'acaba la taula; si no, surt una fila nova */
function onBV(e){
  const mm=e.target.id && e.target.id.match(/^b(\d+)_q(\d+)$/);
  if(!mm) return;
  const j=+mm[1], r=+mm[2], bv=e.target.closest('.bv'), d=+bv.dataset.d;
  const p=bv.querySelector(`#b${j}_p${r}`);
  if(e.target.value.trim()==='1'){
    p.hidden=true; p.value='';
    bv.querySelectorAll('.bv-fila').forEach(f=>{ if(+f.dataset.r>r) f.remove(); });
  } else {
    p.hidden=false;
    const files=bv.querySelectorAll('.bv-fila');
    if(+files[files.length-1].dataset.r===r && files.length<9) bv.insertAdjacentHTML('beforeend', filaBV(j,r+1,d));
  }
}

function stepMcm(){
  const s=state.s, dens=s.dens, m=s.m;
  const P=primsVisibles(dens);
  const llistaDens=dens.join(', ');
  return {
    label:'Pas 1', title:'Calcula el m.c.m. dels denominadors', mcm:true,
    sub:'Tria com el vols calcular.',
    html(){
      if(state.met==='desc'){
        return `<div class="bvs">${dens.map((d,j)=>`<div class="bv" data-j="${j}" data-d="${d}"><div class="bv-fila" data-r="0"><span class="bv-n">${d}</span><span class="bv-p">${box(`b${j}_p0`,2,`divisor primer de ${d}`)}</span></div>${filaBV(j,1,d)}</div>`).join('')}</div>`
          + `<span class="lbl nota-exp">Divideix per un nombre primer (2, 3, 5, 7…) i escriu el quocient a sota, fins que arribis a 1.</span>`
          + `<span class="lbl fila fila-mcm"><span class="fila-cap"><b>m.c.m.</b> =</span><span class="fila-f">${P.map(p=>`<span class="pot">${p}<sup>${box('em_'+p,1,`exponent del ${p} al m.c.m.`,'exp')}</sup></span>`).join('<span class="per-punt">·</span>')} <span>=</span> ${box('mv',wlen(m)+1,'valor del m.c.m.')}</span></span>`
          + `<span class="lbl nota-exp">Si un factor no hi és, deixa'l buit o posa-hi 0.</span>`;
      }
      if(state.met==='llista'){
        return dens.map(d=>`<span class="lbl fila llista"><span class="fila-cap">Múltiples de ${d}:</span><span class="mults">${multiples(d,m).map(x=>`<button type="button" class="mult" data-v="${x}">${x}</button>`).join('')}<span class="tail">…</span></span></span>`).join('')
          + `<span class="lbl fila"><span class="fila-cap"><b>m.c.m.</b> =</span>${box('mv',wlen(m)+1,'valor del m.c.m.')}</span>`
          + `<span class="lbl nota-exp">Pots tocar un nombre de les llistes per escriure'l a la casella.</span>`;
      }
      return `<span class="lbl fila"><span class="fila-cap"><b>m.c.m.</b>(${llistaDens}) =</span>${box('mv',wlen(m)+1,'valor del m.c.m.')}</span>`;
    },
    inputs(sec){
      if(state.met!=='desc') return ['mv'];
      return [...sec.querySelectorAll('.work .box')].filter(b=>!b.hidden).map(b=>b.id);
    },
    hint(){
      if(state.met==='desc'){
        const line = k => `<div><span class="desc">${k} = ${factorHTML(k)}</span>${isPrime(k)?` <span class="primer">· ${k} és primer</span>`:''}</div>`;
        return `A cada taula, divideix pel primer més petit que puguis i escriu el quocient a sota, fins arribar a 1. Ha de quedar:<span class="descs">${dens.map(line).join('')}</span>Al m.c.m. hi van <b>tots</b> els factors primers, cadascun amb l'exponent <b>més gran</b>.`;
      }
      if(state.met==='llista') return `Busca el primer nombre que surt a <b>totes</b> les llistes.`;
      const mx=Math.max(...dens);
      return `Prova els múltiples de ${mx} (${multiples(mx,m).slice(0,4).join(', ')}…) i queda't amb el primer que també sigui múltiple de ${dens.filter(d=>d!==mx).join(' i ')}.`;
    },
    check(v){
      if(state.met==='desc'){
        for(let j=0;j<dens.length;j++){
          let cur=dens[j];
          for(let r=0;;r++){
            const pid=`b${j}_p${r}`, qid=`b${j}_q${r+1}`;
            if(!(pid in v)) break;                       // fila del 1: ja s'ha acabat
            const pr=v[pid];
            if(!isPrime(pr)) return {ok:false,msg:`A la taula del ${dens[j]}: ${pr} no és un nombre primer. A la dreta de la barra hi van nombres primers (2, 3, 5, 7…).`,bad:[pid]};
            if(cur%pr!==0) return {ok:false,msg:`A la taula del ${dens[j]}: ${cur} no és divisible per ${pr}. Prova amb un altre primer.`,bad:[pid]};
            if(!(qid in v)) return {ok:false,msg:`A la taula del ${dens[j]}: falta el quocient de ${cur} : ${pr}.`,bad:[pid]};
            if(v[qid]!==cur/pr) return {ok:false,msg:`A la taula del ${dens[j]}: revisa la divisió ${cur} : ${pr}.`,bad:[qid]};
            cur=v[qid];
          }
          if(cur!==1) return {ok:false,msg:`La taula del ${dens[j]} no s'ha acabat: continua dividint fins que quedi 1.`,bad:[]};
        }
        const badM=P.filter(p=>v['em_'+p]!==Math.max(...dens.map(d=>expo(d,p)))).map(p=>'em_'+p);
        if(badM.length) return {ok:false,msg:'Al m.c.m. hi van tots els factors primers que surten, cadascun amb l\'exponent més gran.',bad:badM};
        if(v.mv!==m) return {ok:false,msg:'Les taules i els exponents estan bé. Ara multiplica els factors per trobar el valor del m.c.m.',bad:['mv']};
        return {ok:true};
      }
      if(v.mv===m) return {ok:true};
      if(v.mv<=0) return {ok:false,msg:'El m.c.m. és un nombre positiu.',bad:['mv']};
      const noDiv=dens.filter(d=>v.mv%d!==0);
      if(noDiv.length) return {ok:false,msg:`${v.mv} no és múltiple de ${noDiv.join(' ni de ')}.`,bad:['mv']};
      return {ok:false,msg:`${v.mv} és un múltiple comú, però n'hi ha un de més petit.`,bad:['mv']};
    },
    res(){
      return `<span>m.c.m.(${llistaDens}) = ${m}</span>${state.met==='desc' && m>1 ? `<span class="nota-m">= ${factorHTML(m)}</span>` : ''}`;
    }
  };
}

/* ---------- pas 2: comú denominador ---------- */
function stepComu(){
  const ts=state.ts, s=state.s, m=s.m;
  return {
    label:'Pas 2', title:'Redueix a comú denominador',
    sub:`Escriu cada fracció amb denominador ${m}: divideix ${m} pel denominador i multiplica el numerador pel resultat.`,
    from(){ return {label:'Del pas 1', html:`m.c.m. = ${m}`}; },
    html(){ return ts.map((t,i)=>`<span class="lbl fila"><span class="fila-f">${frac(t.n,t.d)} <span>=</span> ${frac(box('c'+i,wlen(s.N[i])+1,`numerador de la fracció ${i+1}`),m)}</span></span>`).join(''); },
    inputs(){ return ts.map((t,i)=>'c'+i); },
    hint(){ return ts.map(t=>`${frac(t.n,t.d)}: ${m} : ${t.d} = <b>${m/t.d}</b>, i el numerador es multiplica per ${m/t.d}.`).join('<br>'); },
    check(v){
      const bad=ts.map((t,i)=>'c'+i).filter((id,i)=>v[id]!==s.N[i]);
      if(!bad.length) return {ok:true};
      const t=ts[+bad[0].slice(1)];
      return {ok:false,msg:`Revisa ${t.n}/${t.d}: quantes vegades cap ${t.d} a ${m}? Multiplica el numerador per aquest nombre.`,bad};
    },
    res(){ return expr(ts,(t,i)=>frac(s.N[i],m)); }
  };
}

/* ---------- pas 3: suma i resta dels numeradors ---------- */
function stepNumeradors(){
  const ts=state.ts, s=state.s, m=s.m, normal=state.nivell==='normal';
  return {
    label:'Pas 3', title:'Suma i resta els numeradors',
    sub: normal ? 'El denominador es queda igual. Compte amb el signe: si el resultat és negatiu, toca el botó + per canviar-lo a −.' : 'El denominador es queda igual.',
    from(){ return {label:'Del pas 2', html:expr(ts,(t,i)=>frac(s.N[i],m))}; },
    html(){
      const sg = normal ? `<button type="button" class="signe" id="sg" aria-label="signe del resultat: positiu">+</button>` : '';
      return `${frac(exprText(ts,s.N),m)} <span>=</span> <span class="amb-signe">${sg}${frac(box('rn',wlen(s.num)+1,'numerador del resultat'),m)}</span>`;
    },
    inputs(){ return ['rn']; },
    hint(){
      const pos=ts.filter(t=>t.s>0).map((t,i)=>s.N[ts.indexOf(t)]), neg=ts.filter(t=>t.s<0).map(t=>s.N[ts.indexOf(t)]);
      const sp=pos.reduce((a,b)=>a+b,0), sn=neg.reduce((a,b)=>a+b,0);
      if(!neg.length) return `Suma els numeradors: ${exprText(ts,s.N)}.`;
      if(!pos.length) return `Tots resten: el resultat és negatiu, i en valor absolut és ${neg.join(' + ')}.`;
      return `El que suma fa ${sp} i el que resta fa ${sn}. ${sp>=sn ? `${sp} − ${sn}` : `Com que ${sn} és més gran que ${sp}, el resultat és <b>negatiu</b>: −(${sn} − ${sp})`}.`;
    },
    check(v){
      if(v.rn===s.num) return {ok:true};
      if(v.rn===-s.num) return {ok:false,msg: normal ? 'El valor és bo, però el signe no: toca el botó del signe.' : 'Revisa el signe.',bad:['rn']};
      return {ok:false,msg:`Revisa l'operació: ${exprText(ts,s.N)}.`,bad:['rn']};
    },
    res(){ return `${frac(exprText(ts,s.N),m)} <span>=</span> ${fracS(s.num,m)}`; }
  };
}

/* ---------- pas 4: simplifica ---------- */
function stepSimplifica(){
  const s=state.s, n=Math.abs(s.num), d=s.m, neg=s.num<0, sg=neg?'<span class="opr">−</span>':'';
  return {
    label:'Pas 4', title:'Simplifica la fracció', simplify:true,
    sub:'Divideix numerador i denominador pel mateix nombre fins que ja no tinguin cap divisor comú.',
    html(){ return `<span class="ve" title="Resultat del pas anterior">${sg}${frac(n,d)}</span> <span>=</span> ${sg}${frac(box('sn',wlen(s.rn)+1,'numerador simplificat'), box('sd',wlen(s.rd)+1,'denominador simplificat'))}`
      + `<span class="brk"></span><label class="lbl irr"><input type="checkbox" class="irr-chk" id="irr"><span>Ja és irreductible (no es pot simplificar)</span></label>`; },
    inputs(){ return ['sn','sd']; },
    checkIrr(){ return gcd(n,d)===1 ? {ok:true} : {ok:false,msg:`Encara no és irreductible: ${n} i ${d} tenen algun divisor comú. Desmarca la casella i simplifica-la.`}; },
    hint(){
      const line = k => `<div><span class="desc">${k} = ${factorHTML(k)}</span>${isPrime(k)?` <span class="primer">· ${k} és un nombre primer</span>`:''}</div>`;
      return `Descompon numerador i denominador en factors primers:<span class="descs">${line(n)}${line(d)}</span>` +
        (gcd(n,d)===1 ? 'No tenen cap factor primer en comú: marca la casella <b>Ja és irreductible</b>.' : 'Elimina els factors que tenen en comú.');
    },
    check(v){
      if(v.sd===0) return {ok:false,msg:'El denominador no pot ser 0.',bad:['sd']};
      if(v.sn*d!==n*v.sd) return {ok:false,msg:`Aquesta fracció ja no és equivalent a ${n}/${d}. Has dividit els dos termes pel mateix nombre?`};
      if(gcd(v.sn,v.sd)>1) return {ok:false,msg:`Vas bé, però encara es pot simplificar: ${v.sn} i ${v.sd} són divisibles per ${smallestCommon(v.sn,v.sd)}.`};
      return {ok:true};
    },
    res(v){ return v.irr ? `${sg}${frac(n,d)} <span class="nota-m">✓ ja és irreductible</span>` : `${sg}${frac(n,d)} <span>=</span> ${sg}${frac(v.sn,v.sd)}`; },
    getN:()=>s.num, getD:()=>d
  };
}

/* ---------- render ---------- */
function newExercise(){
  const ts = state.nivell==='facil' ? genFacil() : genNormal();
  state.ts=ts; state.s=solve(ts); state.cur=0; state.errs=0; state.hint=false; state.saltat=false;
  state.steps=[stepMcm(), stepComu(), stepNumeradors(), stepSimplifica()];
  const resta = ts.some((t,i)=>i>0 && t.s<0), suma = ts.some((t,i)=>i>0 && t.s>0);
  $('#tag').className='tipus '+(suma&&resta?'mixt':resta?'pur':'finit');
  $('#tag').textContent = suma&&resta ? 'Sumes i restes' : resta ? 'Resta' : 'Suma';
  $('#target').innerHTML = expr(ts,t=>frac(t.n,t.d));
  $('#target').dataset.termes = JSON.stringify(ts);
  $('#steps').innerHTML=''; $('#result').innerHTML='';
  next(false);
}

function renderWork(sec,st){
  const w=sec.querySelector('.work');
  w.innerHTML = st.html();
  w.oninput = onBV;
  sec.querySelectorAll('.mult').forEach(b=>b.onclick=()=>{ const mv=sec.querySelector('#mv'); mv.value=b.dataset.v; mv.classList.remove('bad'); mv.focus(); });
  const sg=sec.querySelector('#sg');
  if(sg) sg.onclick=()=>{ const neg=sg.textContent==='+'; sg.textContent=neg?'−':'+'; sg.classList.toggle('neg',neg); sg.setAttribute('aria-label','signe del resultat: '+(neg?'negatiu':'positiu')); };
}

function addStep(i){
  const st=state.steps[i];
  const sec=document.createElement('section');
  sec.className='step'; sec.dataset.i=i;
  const tria = st.mcm ? `<div class="metodes" role="group" aria-label="Com calcules el m.c.m.">${Object.entries(METODES).map(([k,t])=>`<button type="button" class="met" data-m="${k}" aria-pressed="${k===state.met}">${t}</button>`).join('')}</div>` : '';
  sec.innerHTML = `<div class="step-head"><span class="num">${st.label}</span><h3>${st.title}</h3></div>
    ${st.sub?`<p class="sub">${st.sub}</p>`:''}
    ${tria}
    ${st.from?(f=>`<div class="partim"><span class="etq">${f.label}</span><span class="m">${f.html}</span></div>`)(st.from()):''}
    <div class="work"></div>
    <div class="actions"><button class="boto boto-principal check" type="button">Comprova</button><button class="boto hintbtn" type="button">Pista</button>${st.simplify?'<button class="boto saltabtn" type="button">Salta la simplificació</button>':''}</div>
    <p class="fb" role="status"></p><p class="hinttext" hidden></p>`;
  $('#steps').appendChild(sec);
  renderWork(sec,st);
  sec.querySelectorAll('.met').forEach(b=>b.onclick=()=>{
    if(i!==state.cur) return;
    state.met=b.dataset.m;
    try{ localStorage.setItem('srfrac-mcm',state.met); }catch(e){}
    sec.querySelectorAll('.met').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
    renderWork(sec,st);
    const fb=sec.querySelector('.fb'); fb.className='fb'; fb.textContent='';
    const h=sec.querySelector('.hinttext'); if(!h.hidden) h.innerHTML='<b>Pista:</b> '+st.hint();
    const f=sec.querySelector('.box'); if(f) f.focus();
  });
  const chk=sec.querySelector('.irr-chk');
  if(chk) chk.onchange=()=>{ sec.querySelectorAll('.box').forEach(b=>{ b.disabled=chk.checked; b.classList.remove('bad'); if(chk.checked) b.value=''; }); sec.classList.toggle('irr-on',chk.checked); };
  sec.querySelector('.check').onclick=()=>onCheck(i);
  sec.querySelector('.hintbtn').onclick=()=>{ const h=sec.querySelector('.hinttext'); h.innerHTML='<b>Pista:</b> '+st.hint(); h.hidden=false; state.hint=true; };
  const sb=sec.querySelector('.saltabtn'); if(sb) sb.onclick=()=>onSkip(i);
  return sec;
}

function next(focus){
  if(state.cur<state.steps.length){
    const sec=addStep(state.cur);
    if(focus!==false){ const f=sec.querySelector('.box'); if(f) f.focus({preventScroll:false}); }
    return;
  }
  finish();
}

function onCheck(i){
  if(i!==state.cur) return;
  const st=state.steps[i]; const sec=$(`.step[data-i="${i}"]`); const fb=sec.querySelector('.fb');
  let v={};
  sec.querySelectorAll('.box').forEach(b=>b.classList.remove('bad'));
  const irr=sec.querySelector('.irr-chk');
  if(irr && irr.checked){ v={irr:true}; }
  else for(const id of st.inputs(sec)){
    const el=sec.querySelector('#'+id); const raw=el.value.trim();
    if(raw==='' && el.classList.contains('exp')){ v[id]=0; continue; }
    if(!/^\d+$/.test(raw)){ el.classList.add('bad'); fb.className='fb err'; fb.textContent= raw==='' ? 'Omple totes les caselles.' : 'Escriu només nombres enters, sense signes ni lletres.'; el.focus(); return; }
    v[id]=parseInt(raw,10);
  }
  const sg=sec.querySelector('#sg'); if(sg && sg.textContent==='−' && 'rn' in v) v.rn=-v.rn;
  const r = v.irr ? st.checkIrr() : st.check(v);
  if(r.ok){
    sec.querySelector('.actions').remove();
    const tria=sec.querySelector('.metodes'); if(tria) tria.remove();
    sec.querySelector('.work').innerHTML = `<div class="fet">${st.res(v)}</div>`;
    const pt=sec.querySelector('.partim'); if(pt) pt.remove();
    const ht=sec.querySelector('.hinttext'); if(ht) ht.hidden=true;
    fb.className='fb'; fb.textContent='';
    sec.classList.add('done');
    state.cur++; next();
  } else {
    state.errs++;
    fb.className='fb err'; fb.textContent=r.msg;
    if(v.irr){ irr.focus(); return; }
    const bad=(r.bad||st.inputs(sec)).map(id=>sec.querySelector('#'+id)).filter(Boolean);
    bad.forEach(b=>b.classList.add('bad'));
    if(bad[0]){ bad[0].focus(); bad[0].select(); }
  }
}

/* Saltar la simplificació: el pas queda fet amb la fracció sense simplificar */
function onSkip(i){
  if(i!==state.cur) return;
  const st=state.steps[i]; const sec=$(`.step[data-i="${i}"]`);
  sec.querySelector('.actions').remove();
  sec.querySelector('.work').innerHTML = `<div class="fet">${fracS(st.getN(),st.getD())} <span class="nota-m">sense simplificar</span></div>`;
  const ht=sec.querySelector('.hinttext'); if(ht) ht.hidden=true;
  sec.querySelector('.fb').className='fb'; sec.querySelector('.fb').textContent='';
  sec.classList.add('skipped');
  sec.querySelector('.num').textContent += ' · saltat';
  state.saltat=true;
  state.cur++; next();
}

function finish(){
  const s=state.s;
  const clean = state.errs===0 && !state.hint;
  stats.fets++; if(clean){ stats.primera++; stats.ratxa++; } else stats.ratxa=0;
  saveStats(); renderStats();
  const sk=state.saltat && s.rd!==s.m;
  const n = state.saltat ? s.num : s.rn, d = state.saltat ? s.m : s.rd;
  const irr = sk ? `<p class="verify">Simplificada del tot seria ${fracS(s.rn,s.rd)}</p>` : '';
  const msg = clean ? (state.saltat ? 'Tot bé a la primera (sense simplificar).' : 'Tot bé a la primera.') : (state.errs ? `Fet! Has corregit ${state.errs} ${pl(state.errs,'error','errors')} pel camí.` : 'Fet, amb l\'ajuda d\'alguna pista.');
  $('#result').innerHTML = `<div class="result">
      <div class="final">${expr(state.ts,t=>frac(t.n,t.d))}<span>=</span><span class="final-r">${fracS(n,d)}</span></div>${irr}
      <p class="fb ok">${msg}</p>
      <div class="actions"><button class="boto boto-principal" id="nextEx" type="button">Nou exercici</button></div>
    </div>`;
  const b=$('#nextEx'); b.onclick=()=>newExercise();
  b.focus();
}

/* Retorn: passa a la casella següent buida o comprova */
$('#steps').addEventListener('keydown',e=>{
  if(e.key!=='Enter' || !e.target.classList.contains('box')) return;
  e.preventDefault();
  const sec=e.target.closest('.step'); const boxes=[...sec.querySelectorAll('.box')].filter(b=>!b.hidden);
  const idx=boxes.indexOf(e.target);
  const nextEmpty=boxes.slice(idx+1).find(b=>!b.value.trim());
  if(nextEmpty && e.target.value.trim()) nextEmpty.focus();
  else onCheck(+sec.dataset.i);
});

/* nivell (es recorda en aquest navegador) */
function setNivell(n){
  state.nivell=n;
  document.querySelectorAll('.nivell').forEach(b=>b.setAttribute('aria-pressed', String(b.dataset.nivell===n)));
  $('#nivellDesc').textContent = n==='facil' ? 'dues fraccions, sense nombres negatius' : 'dues o tres fraccions, i hi pot haver negatius';
  try{ localStorage.setItem('srfrac-nivell', n); }catch(e){}
}
document.querySelectorAll('.nivell').forEach(btn=>{
  btn.onclick=()=>{ setNivell(btn.dataset.nivell); newExercise(); };
});
try{ const n=localStorage.getItem('srfrac-nivell'); if(n==='facil'||n==='normal') setNivell(n); }catch(e){}

const bm=$('#btnMetode'), pm=$('#metode');
function setMetode(open){ bm.setAttribute('aria-expanded',String(open)); pm.hidden=!open; try{ localStorage.setItem('srfrac-metode', open?'1':'0'); }catch(e){} }
bm.onclick=()=>setMetode(pm.hidden);
try{ if(localStorage.getItem('srfrac-metode')==='1') setMetode(true); }catch(e){}

renderStats();
newExercise();
})();
