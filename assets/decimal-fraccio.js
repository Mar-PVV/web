/* Aplicatiu «De decimal a fracció» · el munta decimal-fraccio.html */
(function(){
"use strict";
const $ = s => document.querySelector(s);
const rand = (a,b) => a + Math.floor(Math.random()*(b-a+1));
const pick = arr => arr[Math.floor(Math.random()*arr.length)];
function gcd(a,b){ a=Math.abs(a); b=Math.abs(b); while(b){ [a,b]=[b,a%b]; } return a; }
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
const digits = n => { let s=''; for(let i=0;i<n;i++) s+=rand(0,9); return s; };

/* ---------- generadors ---------- */
function minimalPeriod(p){
  const L=p.length;
  for(let k=1;k<L;k++){ if(L%k===0 && p.slice(0,k).repeat(L/k)===p) return false; }
  return true;
}
function okPeriod(p){ return minimalPeriod(p) && !/^9+$/.test(p) && !/^0+$/.test(p); }
function genFinit(){
  const A=String(rand(0,9)); const d=pick([1,1,2,2,2,3]);
  let a=digits(d-1)+String(pick([1,2,4,5,5,6,8,5,2,3,7,9]));
  return {type:'finit',A,a,p:''};
}
function genPur(){
  const A=String(pick([0,0,1,1,2,3,4,5]));
  const lp=pick([1,1,2,2,2,3]);
  let p; do{ p=digits(lp); }while(!okPeriod(p));
  return {type:'periodic',A,a:'',p};
}
function genMixt(){
  const A=String(pick([0,0,1,1,2,3,4,5]));
  const la=pick([1,1,2]); const lp=pick([1,1,2,2]);
  let a,p; do{ a=digits(la); p=digits(lp); }while(!okPeriod(p) || a[a.length-1]===p[p.length-1]);
  return {type:'periodic',A,a,p};
}

/* ---------- càlculs ---------- */
function solve(ex){
  const la=ex.a.length, lp=ex.p.length;
  if(ex.type==='finit'){
    const N=parseInt(ex.A+ex.a,10), D=10**la, g=gcd(N,D);
    return {la,N,D,rn:N/g,rd:D/g};
  }
  const c2=10**la, i2=parseInt(ex.A+ex.a,10), c3=10**(la+lp), i3=parseInt(ex.A+ex.a+ex.p,10);
  const cd=c3-c2, nd=i3-i2, g=gcd(nd,cd);
  return {la,lp,c2,i2,c3,i3,cd,nd,rn:nd/g,rd:cd/g};
}

/* ---------- format ---------- */
const frac = (t,b) => `<span class="frac"><span>${t}</span><span>${b}</span></span>`;
const numHTML = ex => `${ex.A},${ex.a}${ex.p?`<span class="per">${ex.p}<svg class="arc" viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden="true"><path d="M2 10 Q50 -6 98 10"/></svg></span>`:''}`;
function rep(p){ let t=p; while(t.length<6 || t.length<2*p.length) t+=p; return t; }
const expanded = ex => `${ex.A},${ex.a}${rep(ex.p)}…`;
const tail = ex => `<span class="tail">,${rep(ex.p)}…</span>`;
const cx = c => c===1 ? `<i class="x">x</i>` : `<span>${c}<i class="x">x</i></span>`;
function box(id,w,label){ return `<input id="${id}" class="box" inputmode="numeric" autocomplete="off" spellcheck="false" style="width:${w+0.8}ch" aria-label="${label}">`; }
function longDiv(n,d,k){
  let q=Math.floor(n/d), r=n%d, s='';
  for(let i=0;i<k && r;i++){ r*=10; s+=Math.floor(r/d); r%=d; }
  return q + (s?','+s:'') + (r?'…':'');
}
const wlen = n => Math.max(2,String(n).length);

/* ---------- estat ---------- */
const state = {mode:'barreja', ex:null, s:null, steps:[], cur:0, ans:{}, errs:0, hint:false, lastKey:''};
let stats = {fets:0, primera:0, ratxa:0};
try{ const raw=localStorage.getItem('dec2frac-stats'); if(raw) stats=Object.assign(stats,JSON.parse(raw)); }catch(e){}
function saveStats(){ try{ localStorage.setItem('dec2frac-stats',JSON.stringify(stats)); }catch(e){} }
function renderStats(){
  $('#stats').innerHTML = `<span class="xip">Fets <strong>${stats.fets}</strong></span><span class="xip${stats.primera?' verd':''}">Bé a la primera <strong>${stats.primera}</strong></span><span class="xip${stats.ratxa>=3?' verd':''}">Ratxa <strong>${stats.ratxa}</strong></span><button class="enllac" id="reset" type="button">Posa a zero</button>`;
  $('#reset').onclick = () => { stats={fets:0,primera:0,ratxa:0}; saveStats(); renderStats(); };
}

/* ---------- passos ---------- */
function simplifyStep(label, getN, getD){
  const s=state.s;
  return {
    label, title:'Simplifica la fracció',
    sub:'Divideix numerador i denominador pel mateix nombre fins que ja no tinguin cap divisor comú.',
    res(v){ return v.irr ? `${frac(getN(),getD())} <span class="nota-m">✓ ja és irreductible</span>` : `${frac(getN(),getD())} <span>=</span> ${frac(v.sn,v.sd)}`; },
    html(){ const n=getN(), d=getD(); return `<span class="ve" title="Resultat del pas anterior">${frac(n,d)}</span> <span>=</span> ${frac(box('sn',wlen(s.rn)+1,'numerador simplificat'), box('sd',wlen(s.rd)+1,'denominador simplificat'))}`
      + `<span class="brk"></span><label class="lbl irr"><input type="checkbox" class="irr-chk" id="irr"><span>Ja és irreductible (no es pot simplificar)</span></label>`; },
    inputs:['sn','sd'],
    checkIrr(){ const n=getN(), d=getD(); return gcd(n,d)===1 ? {ok:true} : {ok:false,msg:`Encara no és irreductible: ${n} i ${d} tenen algun divisor comú. Desmarca la casella i simplifica-la.`}; },
    hint(){ const n=getN(), d=getD();
      const line = k => `<div><span class="desc">${k} = ${factorHTML(k)}</span>${isPrime(k)?` <span class="primer">· ${k} és un nombre primer</span>`:''}</div>`;
      return `Descompon numerador i denominador en factors primers:<span class="descs">${line(n)}${line(d)}</span>` +
        (gcd(n,d)===1 ? 'No tenen cap factor primer en comú: marca la casella <b>Ja és irreductible</b>.' : 'Elimina els factors que tenen en comú.');
    },
    check(v){
      const n=getN(), d=getD();
      if(v.sd===0) return {ok:false,msg:'El denominador no pot ser 0.',bad:['sd']};
      if(v.sn*d!==n*v.sd) return {ok:false,msg:`Aquesta fracció ja no és equivalent a ${n}/${d}. Has dividit els dos termes pel mateix nombre?`};
      const g=gcd(v.sn,v.sd);
      if(g>1) return {ok:false,msg:`Vas bé, però encara es pot simplificar: ${v.sn} i ${v.sd} són divisibles per ${smallestCommon(v.sn,v.sd)}.`};
      return {ok:true};
    }
  };
}

function buildSteps(){
  const ex=state.ex, s=state.s, A=state.ans;
  if(ex.type==='finit'){
    return [
      { label:'Pas 1', title:'Escriu-lo com a fracció decimal',
        sub:'Treu la coma i divideix per 10, 100, 1000…',
        res(v){ return `<span>${numHTML(ex)}</span> <span>=</span> ${frac(v.f1n,v.f1d)}`; },
        html(){ return `<span>${numHTML(ex)}</span> <span>=</span> ${frac(box('f1n',wlen(s.N)+1,'numerador'), box('f1d',wlen(s.D)+1,'denominador'))}`; },
        inputs:['f1n','f1d'],
        hint(){ return `${numHTML(ex)} té <b>${s.la} ${pl(s.la,'xifra decimal','xifres decimals')}</b>. El denominador és un 1 seguit de ${s.la} ${pl(s.la,'zero','zeros')}, i al numerador hi va el nombre sense la coma.`; },
        check(v){
          if(v.f1d===0) return {ok:false,msg:'El denominador no pot ser 0.',bad:['f1d']};
          if(v.f1n*s.D!==s.N*v.f1d) return {ok:false,msg:`Aquesta fracció no val ${ex.A},${ex.a}. Compta bé les xifres decimals.`};
          if(!/^10+$/.test(String(v.f1d))) return {ok:false,msg:'És equivalent, però en aquest pas el denominador ha de ser 10, 100, 1000…',bad:['f1d']};
          A.n1=v.f1n; A.d1=v.f1d; return {ok:true};
        }
      },
      simplifyStep('Pas 2', ()=>A.n1, ()=>A.d1)
    ];
  }
  const steps=[];
  steps.push({ label:'Pas 1', title:'Iguala a x',
    sub:'Identifica quines xifres decimals es repeteixen (sota l\'arc) i quines no.',
    res(v){ return `<span><i class="x">x</i> = ${expanded(ex)}</span><span class="nota-m">${s.la} ${pl(s.la,'no periòdica','no periòdiques')} · ${s.lp} ${pl(s.lp,'periòdica','periòdiques')}</span>`; },
    html(){ return `<span><i class="x">x</i> = ${expanded(ex)}</span>
      <span class="lbl"><span>Xifres decimals <b>no periòdiques</b>:</span> ${box('ca',2,'xifres no periòdiques')}</span>
      <span class="lbl"><span>Xifres <b>periòdiques</b>:</span> ${box('cp',2,'xifres periòdiques')}</span>`; },
    inputs:['ca','cp'],
    hint(){ return s.la ? `Després de la coma, <b>${ex.a}</b> no es repeteix i <b>${ex.p}</b> es repeteix sempre.` : `Just després de la coma ja comença el període: <b>${ex.p}</b> es repeteix sempre i no hi ha cap xifra abans.`; },
    check(v){
      const bad=[]; let msg='';
      if(v.ca!==s.la){ bad.push('ca'); msg='Les no periòdiques són les que hi ha entre la coma i l\'arc (poden ser 0). '; }
      if(v.cp!==s.lp){ bad.push('cp'); msg+='Les periòdiques són les que hi ha sota l\'arc.'; }
      return bad.length ? {ok:false,msg:msg.trim(),bad} : {ok:true};
    }
  });
  steps.push({ label:'Pas 2', title:'Multiplica per 10 per cada xifra no periòdica',
    sub: s.la ? 'Així la coma queda just davant del període.' : 'Aquest nombre no té cap xifra no periòdica: no multipliquem per 10 cap vegada. Torna a escriure la mateixa igualtat del pas 1 (davant de la x hi ha un 1).',
    from(){ return {label:'Del pas 1', html:`<i class="x">x</i> = ${expanded(ex)}`}; },
    res(v){ return `${cx(s.c2)} <span>=</span> <span>${s.i2}${tail(ex)}</span>`; },
    html(){ return `${box('m2c',wlen(s.c2)+1,'coeficient de x')}<i class="x">x</i> <span>=</span> <span>${box('m2i',wlen(s.i2)+1,'part entera')}${tail(ex)}</span>`; },
    inputs:['m2c','m2i'],
    hint(){ return s.la ? `Hi ha ${s.la} ${pl(s.la,'xifra no periòdica','xifres no periòdiques')} → multipliquem per <b>${s.c2}</b>. La coma es mou ${s.la} ${pl(s.la,'posició','posicions')} a la dreta.`
                        : `No hi ha cap xifra no periòdica, així que no multipliquem: el coeficient és <b>1</b> (1<i>x</i> = <i>x</i>) i la part entera és la mateixa, <b>${s.i2}</b>.`; },
    check(v){
      if(v.m2c!==s.c2) return s.la
        ? {ok:false,msg:`Has comptat ${s.la} ${pl(s.la,'xifra no periòdica','xifres no periòdiques')}: multiplica per 10 una vegada per cadascuna.`,bad:['m2c']}
        : {ok:false,msg:'No hi ha cap xifra no periòdica: no cal multiplicar per 10. Davant de la x hi ha un 1, com al pas 1.',bad:['m2c']};
      if(v.m2i!==s.i2) return s.la
        ? {ok:false,msg:`En multiplicar per ${s.c2}, la coma es mou ${s.la} ${pl(s.la,'posició','posicions')} a la dreta. Quin nombre queda davant de la coma?`,bad:['m2i']}
        : {ok:false,msg:'Com que no multipliquem, la coma no es mou: torna a escriure el mateix nombre del pas 1.',bad:['m2i']};
      return {ok:true};
    },
    okMsg(){ return s.la ? '' : 'Perfecte! Com que és periòdic pur, no cal multiplicar: l\'expressió queda igual.'; }
  });
  steps.push({ label:'Pas 3', title:'Multiplica per 10 per cada xifra periòdica',
    sub:'Partint del pas 2, mou la coma tantes posicions com xifres té el període. Després de la coma ha de quedar el mateix.',
    from(){ return {label:'Del pas 2', html:`${cx(s.c2)} = ${s.i2}${tail(ex)}`}; },
    res(v){ return `${cx(s.c3)} <span>=</span> <span>${s.i3}${tail(ex)}</span>`; },
    html(){ return `${box('m3c',wlen(s.c3)+1,'coeficient de x')}<i class="x">x</i> <span>=</span> <span>${box('m3i',wlen(s.i3)+1,'part entera')}${tail(ex)}</span>`; },
    inputs:['m3c','m3i'],
    hint(){ const f=10**s.lp; return s.la ? `El període té ${s.lp} ${pl(s.lp,'xifra','xifres')} → ×${f}. Partim de ${s.c2}<i>x</i>: ${s.c2} · ${f} = <b>${s.c3}</b>.` : `El període té ${s.lp} ${pl(s.lp,'xifra','xifres')} → ×${f}. Partim de <i>x</i> (pas 2): queda <b>${s.c3}</b><i>x</i>.`; },
    check(v){
      const f=10**s.lp;
      if(v.m3c!==s.c3){
        if(s.la && v.m3c===f) return {ok:false,msg:`Recorda que partim del pas 2 (${s.c2}x). Si el multipliques per ${f}, quant fa?`,bad:['m3c']};
        return {ok:false,msg:`El període té ${s.lp} ${pl(s.lp,'xifra','xifres')}: multiplica per 10 una vegada per cadascuna${', a partir del pas 2'}.`,bad:['m3c']};
      }
      if(v.m3i!==s.i3) return {ok:false,msg:`Des de x, la coma s'ha mogut ${s.la+s.lp} ${pl(s.la+s.lp,'posició','posicions')} a la dreta. Quin nombre queda davant de la coma?`,bad:['m3i']};
      return {ok:true};
    }
  });
  steps.push({ label:'Pas 4', title:'Resta pas 3 − pas 2 i aïlla la x',
    sub:'Les xifres periòdiques de després de la coma són iguals i desapareixen.',
    html(){ return `<table class="op"><tbody>
        <tr class="ve"><td class="etq">Pas 3</td><td></td><td>${cx(s.c3)}</td><td class="eq">=</td><td class="int">${s.i3}</td><td class="dec">${tail(ex)}</td></tr>
        <tr class="ve"><td class="etq">Pas 2</td><td class="sign">−</td><td>${cx(s.c2)}</td><td class="eq">=</td><td class="int">${s.i2}</td><td class="dec">${tail(ex)}</td></tr>
        <tr class="res"><td></td><td></td><td>${box('rc',wlen(s.cd)+1,'coeficient de x després de restar')}<i class="x">x</i></td><td class="eq">=</td><td class="int">${box('rn',wlen(s.nd)+1,'resultat de la resta')}</td><td class="dec cap"><span class="fl">→</span> <i class="x">x</i> <span>=</span> ${frac(box('xn',wlen(s.nd)+1,'numerador de x'), box('xd',wlen(s.cd)+1,'denominador de x'))}</td></tr>
      </tbody></table>`; },
    inputs:['rc','rn','xn','xd'],
    res(v){ return `${cx(s.cd)} <span>=</span> <span>${s.nd}</span> <span>→</span> <i class="x">x</i> <span>=</span> ${frac(v.xn,v.xd)}`; },
    hint(){ return `Resta columna per columna: a l'esquerra ${s.c3}<i>x</i> − ${s.c2===1?'':s.c2}<i>x</i>, a la dreta ${s.i3} − ${s.i2}. Després, el nombre que multiplica la <i>x</i> passa dividint.`; },
    check(v){
      if(v.rc!==s.cd) return {ok:false,msg:`Revisa la resta de l'esquerra: ${s.c3}x − ${s.c2===1?'':s.c2}x.`,bad:['rc']};
      if(v.rn!==s.nd) return {ok:false,msg:`Revisa la resta de la dreta: ${s.i3} − ${s.i2}. La part decimal s'anul·la.`,bad:['rn']};
      if(v.xd===0) return {ok:false,msg:'El denominador no pot ser 0.',bad:['xd']};
      if(v.xn*s.cd!==s.nd*v.xd) return {ok:false,msg:`Per aïllar la x, divideix els dos membres per ${s.cd}: el que queda a la dreta va a dalt.`,bad:['xn','xd']};
      A.xn=v.xn; A.xd=v.xd; return {ok:true};
    }
  });
  steps.push(simplifyStep('Pas 5', ()=>A.xn, ()=>A.xd));
  return steps;
}

/* ---------- render ---------- */
function newExercise(given){
  let ex=given;
  if(!ex){
    let m=state.mode; if(m==='propi') m='barreja';
    for(let t=0;t<20;t++){
      const kind = m==='barreja' ? pick(['finit','pur','mixt']) : m;
      ex = kind==='finit'?genFinit():kind==='pur'?genPur():genMixt();
      const key=ex.A+','+ex.a+'('+ex.p+')';
      if(key!==state.lastKey){ state.lastKey=key; break; }
    }
  }
  state.ex=ex; state.s=solve(ex); state.ans={}; state.cur=0; state.errs=0; state.hint=false;
  state.steps=buildSteps();
  const kind = ex.type==='finit' ? 'finit' : (ex.a ? 'mixt' : 'pur');
  $('#tag').className='tipus '+kind;
  $('#tag').textContent = {finit:'Decimal finit',pur:'Periòdic pur',mixt:'Periòdic mixt'}[kind];
  $('#target').innerHTML = numHTML(ex);
  $('#steps').innerHTML=''; $('#result').innerHTML='';
  next(false);
}

function addStep(i){
  const st=state.steps[i];
  const sec=document.createElement('section');
  sec.className='step'+(st.skip?' skipped':''); sec.dataset.i=i;
  sec.innerHTML = `<div class="step-head"><span class="num">${st.label}${st.skip?' · no cal':''}</span><h3>${st.title}</h3></div>
    ${st.sub?`<p class="sub">${st.sub}</p>`:''}
    ${st.from?(f=>`<div class="partim"><span class="etq">${f.label}</span><span class="m">${f.html}</span></div>`)(st.from()):''}
    ${st.skip?'':`<div class="work">${st.html()}</div>
    <div class="actions"><button class="boto boto-principal check" type="button">Comprova</button><button class="boto hintbtn" type="button">Pista</button></div>
    <p class="fb" role="status"></p><p class="hinttext" hidden></p>`}`;
  $('#steps').appendChild(sec);
  if(!st.skip){
    const chk=sec.querySelector('.irr-chk');
    if(chk) chk.onchange=()=>{ sec.querySelectorAll('.box').forEach(b=>{ b.disabled=chk.checked; b.classList.remove('bad'); if(chk.checked) b.value=''; }); sec.classList.toggle('irr-on',chk.checked); };
    sec.querySelector('.check').onclick=()=>onCheck(i);
    sec.querySelector('.hintbtn').onclick=()=>{ const h=sec.querySelector('.hinttext'); h.innerHTML='<b>Pista:</b> '+st.hint(); h.hidden=false; state.hint=true; };
  }
  return sec;
}

function next(focus){
  while(state.cur<state.steps.length){
    const st=state.steps[state.cur];
    const sec=addStep(state.cur);
    if(st.skip){ state.cur++; continue; }
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
  else for(const id of st.inputs){
    const el=sec.querySelector('#'+id); const raw=el.value.trim();
    if(!/^\d+$/.test(raw)){ el.classList.add('bad'); fb.className='fb err'; fb.textContent= raw==='' ? 'Omple totes les caselles.' : 'Escriu només nombres enters (sense comes ni lletres).'; el.focus(); return; }
    v[id]=parseInt(raw,10);
  }
  const r = v.irr ? st.checkIrr() : st.check(v);
  if(r.ok){
    sec.querySelectorAll('.box').forEach(b=>{ b.classList.add('ok'); b.disabled=true; });
    sec.querySelector('.actions').remove();
    if(st.res){ sec.querySelector('.work').innerHTML = `<div class="fet">${st.res(v)}</div>`; }
    const pt=sec.querySelector('.partim'); if(pt) pt.remove();
    const ht=sec.querySelector('.hinttext'); if(ht) ht.hidden=true;
    const om = st.okMsg ? st.okMsg() : '';
    fb.className = om ? 'fb ok' : 'fb'; fb.textContent = om;
    sec.classList.add('done');
    state.cur++; next();
  } else {
    state.errs++;
    fb.className='fb err'; fb.textContent=r.msg;
    if(v.irr){ irr.focus(); return; }
    const bad=(r.bad||st.inputs).map(id=>sec.querySelector('#'+id));
    bad.forEach(b=>b.classList.add('bad'));
    bad[0].focus(); bad[0].select();
  }
}

function finish(){
  const ex=state.ex, s=state.s;
  const clean = state.errs===0 && !state.hint;
  stats.fets++; if(clean){ stats.primera++; stats.ratxa++; } else stats.ratxa=0;
  saveStats(); renderStats();
  const msg = clean ? 'Tot bé a la primera.' : (state.errs ? `Fet! Has corregit ${state.errs} ${pl(state.errs,'error','errors')} pel camí.` : 'Fet, amb l\'ajuda d\'alguna pista.');
  $('#result').innerHTML = `<div class="result">
      <div class="final"><span>${numHTML(ex)}</span><span>=</span>${frac(s.rn,s.rd)}</div>
      <p class="verify">Comprovació amb la calculadora: <span class="mono">${s.rn} : ${s.rd} = ${longDiv(s.rn,s.rd,10)}</span></p>
      <p class="fb ok">${msg}</p>
      <div class="actions"><button class="boto boto-principal" id="nextEx" type="button">Nou exercici</button></div>
    </div>`;
  const b=$('#nextEx'); b.onclick=()=>{ state.mode==='propi' ? $('#ownIn').focus() : newExercise(); };
  if(state.mode==='propi') b.textContent='Prova un altre nombre';
  b.focus();
}

/* Retorn: passa a la casella següent buida o comprova */
$('#steps').addEventListener('keydown',e=>{
  if(e.key!=='Enter' || !e.target.classList.contains('box')) return;
  e.preventDefault();
  const sec=e.target.closest('.step'); const boxes=[...sec.querySelectorAll('.box')];
  const idx=boxes.indexOf(e.target);
  const nextEmpty=boxes.slice(idx+1).find(b=>!b.value.trim());
  if(nextEmpty && e.target.value.trim()) nextEmpty.focus();
  else onCheck(+sec.dataset.i);
});

/* modes */
document.querySelectorAll('.mode').forEach(btn=>{
  btn.onclick=()=>{
    state.mode=btn.dataset.mode;
    document.querySelectorAll('.mode').forEach(b=>b.setAttribute('aria-pressed', String(b===btn)));
    $('#own').hidden = state.mode!=='propi';
    if(state.mode==='propi'){ startOwn(); } else newExercise();
  };
});

function parseOwn(str){
  const t=str.replace(/\s/g,'').replace('.',',').replace(/^,/,'0,');
  const m=t.match(/^(\d+),(\d*)(?:\((\d+)\))?$/);
  if(!m) return {err:'No l\'entenc. Escriu-lo així: 2,45 o bé 0,(3) o bé 1,2(36).'};
  const A=String(parseInt(m[1],10)), a=m[2], p=m[3]||'';
  if(!a && !p) return {err:'Ha de tenir xifres decimals.'};
  if(p && /^9+$/.test(p)) return {err:'Un decimal amb període 9 és igual a un decimal finit (per exemple, 0,(9) = 1). Prova\'n un altre.'};
  if(p && /^0+$/.test(p)) return {err:'Un període de zeros vol dir que és un decimal finit: escriu-lo sense parèntesis.'};
  if((A+a+p).length>12) return {err:'Massa xifres: prova amb un nombre més curt.'};
  return {ex:{type:p?'periodic':'finit',A,a,p}};
}
function startOwn(){
  const r=parseOwn($('#ownIn').value); const fb=$('#ownFb');
  if(r.err){ fb.className='fb err'; fb.textContent=r.err; return; }
  fb.textContent=''; newExercise(r.ex);
}
$('#own').addEventListener('submit',e=>{ e.preventDefault(); startOwn(); });

const bm=$('#btnMetode'), pm=$('#metode');
function setMetode(open){ bm.setAttribute('aria-expanded',String(open)); pm.hidden=!open; try{ localStorage.setItem('dec2frac-metode', open?'1':'0'); }catch(e){} }
bm.onclick=()=>setMetode(pm.hidden);
try{ if(localStorage.getItem('dec2frac-metode')==='1') setMetode(true); }catch(e){}

renderStats();
newExercise();
})();
