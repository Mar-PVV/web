/* Aplicatiu «Factor comú» (3r d'ESO · tema 2, Polinomis) · el munta factor-comu.html
   Passos: 1) el nombre (el més gran que divideix tots els coeficients); 2) la lletra que hi és a
   tots els termes, amb l'exponent més petit (només al nivell Normal); 3) el que queda dins del
   parèntesi, amb una casella de coeficient (amb el seu signe) i una d'exponent per terme.
   Al final es comprova tornant a multiplicar (distributiva).
   El motor (generadors i comprovacions) també s'exporta per a la prova de proves/. */
(function(){
"use strict";
const rand = (a,b) => a + Math.floor(Math.random()*(b-a+1));
const pick = arr => arr[Math.floor(Math.random()*arr.length)];
const nz = (a,b) => { let c; do{ c=rand(a,b); }while(c===0); return c; };
function gcd(a,b){ a=Math.abs(a); b=Math.abs(b); while(b){ [a,b]=[b,a%b]; } return a; }
const gcdL = l => l.reduce((a,b)=>gcd(a,b));
function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=rand(0,i); [a[i],a[j]]=[a[j],a[i]]; } return a; }

/* ---------- generadors ----------
   Exercici: {l, g, m, Q, terms}: terms = g·x^m · Q, amb Q de coeficients primers entre ells
   i amb algun terme de grau 0 (així x^m és el factor comú màxim). */
const LLETRES=['x','x','x','a','m','y','p','b'];
function construeix(l,g,m,Q,desordena){
  let terms=Q.map(t=>({c:g*t.c, e:m+t.e}));
  if(desordena){ const idx=shuffle(terms.map((t,i)=>i)); terms=idx.map(i=>terms[i]); Q=idx.map(i=>Q[i]); }
  return {l, g, m, Q, terms};
}
function genFacil(){
  for(;;){
    const g=rand(2,9), n=pick([2,2,3]);
    const graus = n===2 ? [rand(1,2),0] : [2,1,0];
    const Q=graus.map(e=>({c:rand(1,9), e}));
    if(gcdL(Q.map(t=>t.c))!==1) continue;
    if(Q.some(t=>g*t.c>60)) continue;
    if(Q.every(t=>t.c===1)) continue;
    return construeix(pick(LLETRES), g, 0, Q, false);
  }
}
function genNormal(){
  for(;;){
    const g = Math.random()<0.2 ? 1 : rand(2,9);
    const m = pick([1,1,1,2,2,3]);
    const n = pick([2,2,3]);
    const graus = n===2 ? [rand(1,2),0] : pick([[2,1,0],[3,1,0],[3,2,0]]);
    const Q=graus.map((e,i)=>({c: i===0 ? rand(1,9) : nz(-9,9), e}));
    if(Math.random()<0.3) Q[Q.length-1].c = pick([1,-1]);        // el cas de l'1: 9m + 18m² = 9m(1 + 2m)
    if(gcdL(Q.map(t=>t.c))!==1) continue;
    if(Q.some(t=>Math.abs(g*t.c)>60)) continue;
    if(g===1 && Q.every(t=>Math.abs(t.c)===1) && n===2 && Math.random()<0.5) continue;
    return construeix(pick(LLETRES), g, m, Q, Math.random()<0.2 && Q.every(t=>t.c>0));
  }
}
const genera = nivell => nivell==='facil' ? genFacil() : genNormal();

/* ---------- lectura de les caselles ---------- */
function llegeix(raw){
  const s=String(raw).trim().replace(/[−–]/g,'-').replace(/\s+/g,'');
  if(s==='') return null;
  if(s==='-') return -1;
  if(s==='+') return 1;
  return /^[+-]?\d+$/.test(s) ? parseInt(s,10) : NaN;
}

/* ---------- comprovacions (sense DOM) ---------- */
function comprovaNombre(ex,v){
  const cs=ex.terms.map(t=>Math.abs(t.c));
  if(v===ex.g) return {ok:true};
  if(v===-ex.g) return {ok:false, msg:'Agafa el factor comú positiu.'};
  if(v<=0) return {ok:false, msg:'El factor comú dels coeficients és un nombre positiu.'};
  const no=cs.filter(c=>c%v!==0);
  if(no.length) return {ok:false, msg:`${v} no divideix ${no.join(' ni ')}. Ha de dividir tots els coeficients.`};
  return {ok:false, msg:`${v} divideix tots els coeficients, però n'hi ha un de més gran.`};
}
function comprovaLletra(ex,v){
  const es=ex.terms.map(t=>t.e);
  if(v===ex.m) return {ok:true};
  if(v>ex.m && v<=Math.max(...es)) return {ok:false, msg:'S\'agafa l\'exponent més petit: és el que hi ha a tots els termes.'};
  if(v===0) return {ok:false, msg:'La lletra és a tots els termes, així que forma part del factor comú.'};
  return {ok:false, msg:'Revisa l\'exponent: mira quin és l\'exponent més petit de la lletra.'};
}
/* vals: per a cada terme {c, e} escrits (e null = buit = 0) */
function comprovaDins(ex,vals){
  const bad=[]; let msg=null;
  ex.Q.forEach((q,i)=>{
    const v=vals[i], e=v.e===null ? 0 : v.e;
    const badC = v.c!==q.c, badE = e!==q.e;
    if(!badC && !badE) return;
    bad.push({i, c:badC, e:badE});
    if(msg) return;
    if(badC && v.c===null && Math.abs(q.c)===1 && q.e===0) msg='Quan un terme és exactament el factor comú, dins del parèntesi hi queda un 1 (amb el seu signe), no un buit.';
    else if(badC && v.c===null) msg='Omple el coeficient de tots els termes.';
    else if(badC && v.c===-q.c) msg='Revisa el signe: cada terme manté el seu signe quan el divideixes pel factor comú.';
    else if(badC) msg='Revisa el coeficient: divideix el coeficient del terme pel nombre del factor comú.';
    else msg='Revisa l\'exponent: resta-li l\'exponent del factor comú (x³ : x = x²). Si no queda lletra, posa-hi 0 o deixa-ho buit.';
  });
  return bad.length ? {ok:false, bad, msg} : {ok:true};
}

const MOTOR = {genera, genFacil, genNormal, gcd, gcdL, llegeix, comprovaNombre, comprovaLletra, comprovaDins};
if(typeof module!=='undefined' && module.exports){ module.exports = MOTOR; }
if(typeof document==='undefined') return;

/* ====================================================================
   Interfície
   ==================================================================== */
const $ = s => document.querySelector(s);
const pl = (n,s,p) => n===1 ? s : p;

const lit = (e,l) => e===0 ? '' : `<span class="lit"><i>${l}</i>${e>1?`<sup>${e}</sup>`:''}</span>`;
const mono = (c,e,l) => { const a=Math.abs(c); return (a===1 && e>0 ? '' : a) + lit(e,l); };
function polHTML(terms,l){
  if(!terms.length) return '0';
  return '<span class="pol">'+terms.map((t,i)=>`<span class="t">${i===0 ? (t.c<0?'−':'') : `<span class="sg">${t.c<0?'−':'+'}</span>`}${mono(t.c,t.e,l)}</span>`).join('')+'</span>';
}
const par = h => `<span class="pr">(</span>${h}<span class="pr">)</span>`;
const factorHTML = ex => ex.g===1 && ex.m>0 ? lit(ex.m,ex.l) : `${ex.g}${lit(ex.m,ex.l)}`;
const resultatHTML = ex => `<span class="pol">${factorHTML(ex)}${par(polHTML(ex.Q,ex.l))}</span>`;

const casellaCoef = (id,label) => `<input id="${id}" class="box cf" inputmode="text" autocomplete="off" spellcheck="false" aria-label="${label}">`;
const casellaExp = (id,label) => `<input id="${id}" class="box ex" inputmode="numeric" autocomplete="off" spellcheck="false" aria-label="${label}">`;
const casellaNum = (id,label) => `<input id="${id}" class="box cf" inputmode="numeric" autocomplete="off" spellcheck="false" aria-label="${label}">`;

/* ---------- estat ---------- */
const state = {nivell:'facil', ex:null, steps:[], cur:0, errs:0, hint:false};
let stats = {fets:0, primera:0, ratxa:0};
try{ const raw=localStorage.getItem('fcom-stats'); if(raw) stats=Object.assign(stats,JSON.parse(raw)); }catch(e){}
function saveStats(){ try{ localStorage.setItem('fcom-stats',JSON.stringify(stats)); }catch(e){} }
function renderStats(){
  $('#stats').innerHTML = `<span class="xip">Fets <strong>${stats.fets}</strong></span><span class="xip${stats.primera?' verd':''}">Bé a la primera <strong>${stats.primera}</strong></span><span class="xip${stats.ratxa>=3?' verd':''}">Ratxa <strong>${stats.ratxa}</strong></span><button class="enllac" id="reset" type="button">Posa a zero</button>`;
  $('#reset').onclick = () => { stats={fets:0,primera:0,ratxa:0}; saveStats(); renderStats(); };
}

/* ---------- pas: el nombre ---------- */
function stepNombre(){
  const ex=state.ex, cs=ex.terms.map(t=>Math.abs(t.c));
  return {
    title:'Busca el nombre del factor comú',
    sub:'El nombre més gran que divideix tots els coeficients (sense fixar-te en els signes).',
    html(){ return `<span class="lbl fila-pol">${cs.join(', ')} <span class="tail">→</span> el més gran que els divideix tots: ${casellaNum('n','nombre del factor comú')}</span>`; },
    ids:['n'], previ:null,
    hint(){ return `Busca els divisors de ${Math.min(...cs)} i mira quin és el més gran que també divideix ${cs.filter(c=>c!==Math.min(...cs)).join(' i ') || 'els altres'}. Si només és l'1, el nombre del factor comú és 1.`; },
    check(v){ if(v.n===null) return {ok:false,msg:'Escriu el nombre.',bad:['n']}; const r=comprovaNombre(ex,v.n); return r.ok?r:{...r,bad:['n']}; },
    res(){ return `${cs.join(', ')} <span class="tail">→</span> <b>${ex.g}</b>`; }
  };
}
/* ---------- pas: la lletra ---------- */
function stepLletra(){
  const ex=state.ex, l=ex.l;
  return {
    title:'Busca la lletra del factor comú',
    sub:'La lletra és a tots els termes? Agafa-la amb l\'exponent més petit.',
    html(){ return `<span class="lbl fila-pol"><span class="pol">${ex.terms.map(t=>lit(t.e,l)||'1').join(', ')}</span> <span class="tail">→</span> <span class="cterme"><span class="lit"><i>${l}</i><sup class="supbox">${casellaExp('m','exponent de la lletra al factor comú')}</sup></span></span></span>`; },
    ids:['m'], previ:null,
    hint(){ return `Els exponents de la ${l} són ${ex.terms.map(t=>t.e).join(', ')}. El més petit és el que tenen tots els termes.`; },
    check(v){ if(v.m===null) return {ok:false,msg:'Escriu l\'exponent.',bad:['m']}; const r=comprovaLletra(ex,v.m); return r.ok?r:{...r,bad:['m']}; },
    res(){ return `<span class="pol">${ex.terms.map(t=>lit(t.e,l)||'1').join(', ')}</span> <span class="tail">→</span> ${lit(ex.m,l)}`; }
  };
}
/* ---------- pas: dins del parèntesi ---------- */
function stepDins(){
  const ex=state.ex, l=ex.l;
  const ids=ex.Q.map((q,i)=>({c:'c'+i, e: ex.m===0 ? null : 'e'+i}));   // factor sense lletra: l'exponent no canvia i ja surt escrit
  const fila = (q,i) => `<span class="cterme">${casellaCoef(ids[i].c,`coeficient del terme ${i+1} del parèntesi`)}${ids[i].e ? `<span class="lit"><i>${l}</i><sup class="supbox">${casellaExp(ids[i].e,`exponent del terme ${i+1} del parèntesi`)}</sup></span>` : lit(q.e,l)}</span>`;
  return {
    title:'Escriu què queda dins del parèntesi',
    sub: ex.m===0 ? 'Divideix el coeficient de cada terme pel factor comú. La part literal no canvia.' : 'Divideix cada terme pel factor comú: el coeficient amb el seu signe i l\'exponent (si no queda lletra, posa-hi 0 o deixa-ho buit).',
    html(){ return `<span class="lbl fila-pol">${polHTML(ex.terms,l)} <span>=</span> <span class="pol">${factorHTML(ex)}</span><span class="pr">(</span><span class="caselles">${ex.Q.map(fila).join('')}</span><span class="pr">)</span></span>`; },
    ids:ids.flatMap(x=>x.e ? [x.c,x.e] : [x.c]),
    previ(v){
      let primer=true; const out=[];
      ex.Q.forEach((q,i)=>{
        const c=v[ids[i].c], e = ids[i].e ? v[ids[i].e] : q.e;
        let cos;
        if(c===null || Number.isNaN(c)) cos=`<span class="forat">□</span>`;
        else cos = (primer ? (c<0?'−':'') : '');
        const sg = primer ? '' : `<span class="sg">${c!==null && !Number.isNaN(c) && c<0 ? '−':'+'}</span>`;
        if(c!==null && !Number.isNaN(c)){ const ee = e===null||Number.isNaN(e) ? 0 : e; cos += mono(c,ee,l); }
        else if(e) cos += lit(e,l);
        out.push(`<span class="t">${sg}${cos}</span>`); primer=false;
      });
      return `${factorHTML(ex)}${par('<span class="pol">'+out.join('')+'</span>')}`;
    },
    hint(){ return 'Cada terme dividit pel factor comú: ' + ex.terms.map(t=>`${mono(t.c,t.e,l)} : ${factorHTML(ex)}`).join(' · ') + '. Els coeficients es divideixen i els exponents es resten.'; },
    check(v){
      const r=comprovaDins(ex, ids.map((x,i)=>({c:v[x.c], e: x.e ? v[x.e] : ex.Q[i].e})));
      return r.ok ? r : {ok:false, msg:r.msg, bad:r.bad.flatMap(b=>[...(b.c?[ids[b.i].c]:[]), ...(b.e?[ids[b.i].e]:[])])};
    },
    res(){ return `${polHTML(ex.terms,l)} <span>=</span> <span class="final-r">${resultatHTML(ex)}</span>`; }
  };
}

/* ---------- render ---------- */
function newExercise(){
  const ex=genera(state.nivell);
  state.ex=ex; state.cur=0; state.errs=0; state.hint=false;
  state.steps = state.nivell==='facil' ? [stepNombre(), stepDins()] : [stepNombre(), stepLletra(), stepDins()];
  state.steps.forEach((st,i)=>{ st.label='Pas '+(i+1); });
  $('#target').innerHTML = polHTML(ex.terms,ex.l);
  $('#steps').innerHTML=''; $('#result').innerHTML='';
  next(false);
}
function valors(sec,st){ const v={}; st.ids.forEach(id=>{ v[id]=llegeix(sec.querySelector('#'+id).value); }); return v; }
function actualitzaPrevi(sec,st){ const p=sec.querySelector('.previ-m'); if(p && st.previ) p.innerHTML=st.previ(valors(sec,st)); }

function addStep(i){
  const st=state.steps[i];
  const sec=document.createElement('section');
  sec.className='step'; sec.dataset.i=i;
  const fet = state.steps.slice(0,i).length ? '' : '';
  sec.innerHTML = `<div class="step-head"><span class="num">${st.label}</span><h3>${st.title}</h3></div>
    ${st.sub?`<p class="sub">${st.sub}</p>`:''}${fet}
    <div class="work pol-work">${st.html()}</div>
    ${st.previ?'<p class="previ"><span class="previ-et">Així queda:</span> <span class="previ-m"></span></p>':''}
    <div class="actions"><button class="boto boto-principal check" type="button">Comprova</button><button class="boto hintbtn" type="button">Pista</button></div>
    <p class="fb" role="status"></p><p class="hinttext" hidden></p>`;
  $('#steps').appendChild(sec);
  actualitzaPrevi(sec,st);
  sec.querySelector('.work').addEventListener('input',e=>{ e.target.classList.remove('bad'); actualitzaPrevi(sec,st); });
  sec.querySelector('.check').onclick=()=>onCheck(i);
  sec.querySelector('.hintbtn').onclick=()=>{ const h=sec.querySelector('.hinttext'); h.innerHTML='<b>Pista:</b> '+st.hint(); h.hidden=false; state.hint=true; };
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
  sec.querySelectorAll('.box').forEach(b=>b.classList.remove('bad'));
  const v=valors(sec,st);
  const mal=st.ids.find(id=>Number.isNaN(v[id]));
  if(mal){
    const el=sec.querySelector('#'+mal); el.classList.add('bad'); el.focus(); el.select();
    fb.className='fb err'; fb.textContent='A cada casella hi va un nombre enter, amb el signe − si és negatiu (per exemple 5 o −3).';
    return;
  }
  const r=st.check(v);
  if(r.ok){
    sec.querySelector('.actions').remove();
    sec.querySelector('.work').innerHTML = `<div class="fet">${st.res()}</div>`;
    const pv=sec.querySelector('.previ'); if(pv) pv.remove();
    const ht=sec.querySelector('.hinttext'); if(ht) ht.hidden=true;
    fb.className='fb'; fb.textContent='';
    sec.classList.add('done');
    state.cur++; next(); return;
  }
  state.errs++;
  fb.className='fb err'; fb.textContent=r.msg;
  const bad=(r.bad||[]).map(id=>sec.querySelector('#'+id)).filter(Boolean);
  bad.forEach(b=>b.classList.add('bad'));
  if(bad[0]){ bad[0].focus(); bad[0].select(); }
}
function finish(){
  const ex=state.ex, l=ex.l;
  const clean = state.errs===0 && !state.hint;
  stats.fets++; if(clean){ stats.primera++; stats.ratxa++; } else stats.ratxa=0;
  saveStats(); renderStats();
  const msg = clean ? 'Tot bé a la primera.' : (state.errs ? `Fet! Has corregit ${state.errs} ${pl(state.errs,'error','errors')} pel camí.` : 'Fet, amb l\'ajuda d\'alguna pista.');
  const fc = ex.g===1 && ex.m>0 ? lit(ex.m,l) : `${ex.g}${lit(ex.m,l)}`;
  const comprova = ex.Q.map((q,i)=>`${i===0?'':`<span class="sg">${q.c<0?'−':'+'}</span>`}${fc} · ${mono(q.c,q.e,l)||'1'}`).join('');
  $('#result').innerHTML = `<div class="result">
      <div class="final pol-final">${polHTML(ex.terms,l)}<span>=</span><span class="final-r">${resultatHTML(ex)}</span></div>
      <p class="verify">Comprova-ho multiplicant: <span class="mono">${comprova} = ${polHTML(ex.terms,l)}</span> ✓</p>
      <p class="fb ok">${msg}</p>
      <div class="actions"><button class="boto boto-principal" id="nextEx" type="button">Nou exercici</button></div>
    </div>`;
  const b=$('#nextEx'); b.onclick=()=>newExercise();
  b.focus();
}
$('#steps').addEventListener('keydown',e=>{
  if(e.key!=='Enter' || !e.target.classList.contains('box')) return;
  e.preventDefault();
  const sec=e.target.closest('.step');
  const boxes=[...sec.querySelectorAll('.box')];
  const seg=boxes[boxes.indexOf(e.target)+1];
  if(seg) seg.focus(); else onCheck(+sec.dataset.i);
});
function setNivell(n){
  state.nivell=n;
  document.querySelectorAll('.nivell').forEach(b=>b.setAttribute('aria-pressed', String(b.dataset.nivell===n)));
  $('#nivellDesc').textContent = n==='facil' ? 'el factor comú és un nombre, sense negatius' : 'nombre i lletra, amb negatius';
  try{ localStorage.setItem('fcom-nivell', n); }catch(e){}
}
document.querySelectorAll('.nivell').forEach(btn=>{ btn.onclick=()=>{ setNivell(btn.dataset.nivell); newExercise(); }; });
try{ const n=localStorage.getItem('fcom-nivell'); if(['facil','normal'].includes(n)) setNivell(n); }catch(e){}
const bm=$('#btnMetode'), pm=$('#metode');
function setMetode(open){ bm.setAttribute('aria-expanded',String(open)); pm.hidden=!open; try{ localStorage.setItem('fcom-metode', open?'1':'0'); }catch(e){} }
bm.onclick=()=>setMetode(pm.hidden);
try{ if(localStorage.getItem('fcom-metode')==='1') setMetode(true); }catch(e){}
renderStats();
newExercise();
})();
