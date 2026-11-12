/* Aplicatiu «Multiplicació de polinomis» (3r d'ESO · tema 2, Polinomis) · el munta multiplica-polinomis.html
   Tres tipus: monomi per monomi, monomi per polinomi (distributiva) i polinomi per polinomi.
   Pas 1: cada terme per cada terme; per a cada producte l'alumne escriu el coeficient (amb el
   seu signe) i l'exponent. Pas 2 (polinomi per polinomi): reduir els semblants i ordenar, amb
   una casella per grau (sense cap «+» fix entre caselles) i la vista «Així queda».
   El motor (generadors i comprovacions) també s'exporta per a la prova de proves/. */
(function(){
"use strict";
const rand = (a,b) => a + Math.floor(Math.random()*(b-a+1));
const pick = arr => arr[Math.floor(Math.random()*arr.length)];
const nz = (a,b) => { let c; do{ c=rand(a,b); }while(c===0); return c; };

/* ---------- polinomis: llistes de termes {c, e} ---------- */
function reduce(terms){
  const m=new Map();
  terms.forEach(t=>m.set(t.e,(m.get(t.e)||0)+t.c));
  return [...m.entries()].filter(([,c])=>c!==0).sort((a,b)=>b[0]-a[0]).map(([e,c])=>({c,e}));
}
/* Productes parcials: cada terme del primer per cada terme del segon */
const productes = ex => ex.A.flatMap(a=>ex.B.map(b=>({a, b, c:a.c*b.c, e:a.e+b.e})));

/* ---------- generadors ---------- */
const LLETRES=['x','x','x','a','m','y','b','z'];
function binomi(neg, ambCoef){
  const a = ambCoef ? rand(1,4) : 1;
  return [{c: neg && Math.random()<0.15 ? -a : a, e:1}, {c: neg ? nz(-9,9) : rand(1,9), e:0}];
}
function genMonMon(neg){
  const A=[{c: neg ? nz(-6,6) : rand(2,6), e:rand(1,4)}], B=[{c: neg ? nz(-6,6) : rand(2,6), e:rand(1,4)}];
  if(Math.abs(A[0].c)===1 && Math.abs(B[0].c)===1) return genMonMon(neg);
  return {tipus:'mm', l:pick(LLETRES), A, B};
}
function genMonPol(neg){
  for(;;){
    const e=rand(0,2);
    let c = neg ? nz(-5,5) : rand(2,5);
    if(e===0 && Math.abs(c)===1 && !neg) continue;
    const A=[{c,e}];
    const n=rand(2,3), maxG=n===2 ? rand(1,2) : 2;
    const graus=[maxG, ...[...Array(maxG).keys()].reverse()].slice(0,n);
    const B=graus.map(g=>({c: neg ? nz(-9,9) : rand(1,9), e:g}));
    if(neg && !A.concat(B).some(t=>t.c<0)) continue;
    if(e===0 && Math.abs(c)===1 && c>0) continue;               // 1·(…) no té gràcia
    return {tipus:'mp', l:pick(LLETRES), A, B};
  }
}
function genPolPol(neg){
  for(;;){
    let A, B;
    if(!neg){
      A=binomi(false, Math.random()<0.4); B=binomi(false, Math.random()<0.3);
    } else if(Math.random()<0.7){
      A=binomi(true, Math.random()<0.4); B=binomi(true, Math.random()<0.4);
      if(!A.concat(B).some(t=>t.c<0)) continue;
    } else {
      A=binomi(true, Math.random()<0.5);
      B=[{c:1,e:2},{c:nz(-5,5),e:1},{c:nz(-5,5),e:0}];
    }
    if(Math.random()<0.5) [A,B]=[B,A];
    const ex={tipus:'pp', l:'x', A, B};
    if(reduce(productes(ex)).length<2) continue;
    return ex;
  }
}
function genera(nivell){
  const neg = nivell!=='facil';
  const r=Math.random();
  return r<0.2 ? genMonMon(neg) : r<0.55 ? genMonPol(neg) : genPolPol(neg);
}

/* ---------- lectura de les caselles ---------- */
/* «−3», «-3», «+3», «3»; «−» o «+» sols valen −1 i 1. Buit → null. No vàlid → NaN. */
function llegeix(raw){
  const s=String(raw).trim().replace(/[−–]/g,'-').replace(/\s+/g,'');
  if(s==='') return null;
  if(s==='-') return -1;
  if(s==='+') return 1;
  return /^[+-]?\d+$/.test(s) ? parseInt(s,10) : NaN;
}

/* ---------- comprovacions (sense DOM) ---------- */
/* Un producte parcial: v = {c, e} escrits (e null = buit, val com a 0) */
function comprovaProducte(p,v){
  const e = v.e===null ? 0 : v.e;
  const cOk = v.c===p.c, eOk = e===p.e;
  if(cOk && eOk) return {ok:true};
  const r={ok:false, badC:!cOk, badE:!eOk};
  if(!eOk && p.a.e>0 && p.b.e>0 && e===p.a.e*p.b.e && p.a.e*p.b.e!==p.a.e+p.b.e) r.msg='Els exponents se sumen, no es multipliquen: x² · x³ = x⁵.';
  else if(!eOk && v.e===null && p.e>0) r.msg='Falta l\'exponent: si queda x, escriu-hi 1; si no queda cap lletra, escriu-hi 0 o deixa-ho buit.';
  else if(!eOk) r.msg='Revisa l\'exponent: quan es multipliquen potències de la mateixa base, els exponents se sumen. Si un factor no té lletra, l\'exponent no canvia.';
  else if(v.c===-p.c) r.msg='Revisa el signe: dos signes iguals fan +, dos de diferents fan −.';
  else if(v.c===p.a.c+p.b.c && p.a.c+p.b.c!==p.c) r.msg='Els coeficients es multipliquen, no se sumen.';
  else r.msg='Revisa el coeficient: multiplica els dos coeficients, amb els seus signes.';
  return r;
}
/* Resultat: vals[e] = coeficient escrit per al grau e (null = buit = 0) */
function comprovaResultat(prods,graus,vals){
  const r=new Map(reduce(prods).map(t=>[t.e,t.c]));
  const hi=new Set(prods.map(t=>t.e));
  const bad=graus.filter(e=>(vals[e]??0)!==(r.get(e)||0));
  if(!bad.length) return {ok:true};
  const e=bad[0], esc=vals[e], esp=r.get(e)||0;
  if(!hi.has(e)) return {ok:false, bad, msg:`Cap producte no dona un terme ${e===0?'sense lletra':'de grau '+e}: aquesta casella s'ha de deixar buida.`};
  if(esp===0) return {ok:false, bad, msg:`Revisa la casella marcada: els termes ${e===0?'sense lletra':'de grau '+e} s'anul·len.`};
  if(esc===null) return {ok:false, bad, msg:'Falta algun terme: només es deixa buida la casella d\'un grau que no hi és o que s\'anul·la.'};
  if(esc===-esp) return {ok:false, bad, msg:'Revisa el signe de la casella marcada.'};
  return {ok:false, bad, msg:'Revisa la casella marcada: suma els coeficients dels productes que tenen el mateix grau, cadascun amb el seu signe.'};
}

const MOTOR = {genera, genMonMon, genMonPol, genPolPol, productes, reduce, llegeix, comprovaProducte, comprovaResultat};
if(typeof module!=='undefined' && module.exports){ module.exports = MOTOR; }
if(typeof document==='undefined') return;

/* ====================================================================
   Interfície
   ==================================================================== */
const $ = s => document.querySelector(s);
const pl = (n,s,p) => n===1 ? s : p;

/* ---------- format ---------- */
const lit = (e,l) => e===0 ? '' : `<span class="lit"><i>${l}</i>${e>1?`<sup>${e}</sup>`:''}</span>`;
const mono = (c,e,l) => { const a=Math.abs(c); return (a===1 && e>0 ? '' : a) + lit(e,l); };
function polHTML(terms,l){
  if(!terms.length) return '0';
  return '<span class="pol">'+terms.map((t,i)=>`<span class="t">${i===0 ? (t.c<0?'−':'') : `<span class="sg">${t.c<0?'−':'+'}</span>`}${mono(t.c,t.e,l)}</span>`).join('')+'</span>';
}
const par = h => `<span class="pr">(</span>${h}<span class="pr">)</span>`;
/* Un monomi sol: amb signe, i entre parèntesis si és negatiu i no va primer */
const monoS = (t,l) => (t.c<0?'−':'')+mono(t.c,t.e,l);
const factor = (t,l,primer) => t.c<0 && !primer ? par(monoS(t,l)) : monoS(t,l);
/* El monomi de davant d'un parèntesi: «2(…)», «−(…)», «3x(…)», «−x²(…)» */
const davant = (t,l) => t.e===0 && Math.abs(t.c)===1 ? (t.c<0?'−':'') : monoS(t,l);
function exprHTML(ex){
  const l=ex.l;
  if(ex.tipus==='mm') return `<span class="pol">${factor(ex.A[0],l,true)} <span class="sg">·</span> ${factor(ex.B[0],l,false)}</span>`;
  if(ex.tipus==='mp') return `<span class="pol">${davant(ex.A[0],l)}${par(polHTML(ex.B,l))}</span>`;
  return `<span class="pol">${par(polHTML(ex.A,l))}${par(polHTML(ex.B,l))}</span>`;
}

const casellaCoef = (id,label) => `<input id="${id}" class="box cf" inputmode="text" autocomplete="off" spellcheck="false" aria-label="${label}">`;
const casellaExp = (id,label) => `<input id="${id}" class="box ex" inputmode="numeric" autocomplete="off" spellcheck="false" aria-label="${label}">`;
const casellaTerme = (id,e,l,label) => `<span class="cterme">${casellaCoef(id,label)}${lit(e,l)}</span>`;
const nomGrau = e => e===0 ? 'terme independent' : `terme de grau ${e}`;

function previHTML(parts,l){
  const out=[]; let primer=true;
  for(const p of parts){
    if(p.c===null){ if(p.buitCompta){ out.push(`<span class="t">${primer?'':'<span class="sg">+</span>'}<span class="forat">□</span>${p.expBox ? `<span class="lit"><i>${l}</i>${p.e>1?`<sup>${p.e}</sup>`:p.e===null?'<sup class="forat">□</sup>':''}</span>` : lit(p.e||0,l)}</span>`); primer=false; } continue; }
    if(Number.isNaN(p.c) || Number.isNaN(p.e)){ out.push(`<span class="t">${primer?'':'<span class="sg">+</span>'}<span class="forat">?</span></span>`); primer=false; continue; }
    if(p.c===0 && !p.fix) continue;
    const e = p.e===null ? 0 : p.e;
    const cos = p.e===null && p.expBox ? `${Math.abs(p.c)===1?'':Math.abs(p.c)}<span class="lit"><i>${l}</i><sup class="forat">□</sup></span>` : mono(p.c,e,l);
    out.push(`<span class="t">${primer ? (p.c<0?'−':'') : `<span class="sg">${p.c<0?'−':'+'}</span>`}${cos}</span>`);
    primer=false;
  }
  return out.length ? out.join('') : '0';
}

/* ---------- estat ---------- */
const state = {nivell:'facil', ex:null, prods:null, steps:[], cur:0, errs:0, hint:false};
let stats = {fets:0, primera:0, ratxa:0};
try{ const raw=localStorage.getItem('mpol-stats'); if(raw) stats=Object.assign(stats,JSON.parse(raw)); }catch(e){}
function saveStats(){ try{ localStorage.setItem('mpol-stats',JSON.stringify(stats)); }catch(e){} }
function renderStats(){
  $('#stats').innerHTML = `<span class="xip">Fets <strong>${stats.fets}</strong></span><span class="xip${stats.primera?' verd':''}">Bé a la primera <strong>${stats.primera}</strong></span><span class="xip${stats.ratxa>=3?' verd':''}">Ratxa <strong>${stats.ratxa}</strong></span><button class="enllac" id="reset" type="button">Posa a zero</button>`;
  $('#reset').onclick = () => { stats={fets:0,primera:0,ratxa:0}; saveStats(); renderStats(); };
}

/* ---------- pas: cada terme per cada terme ---------- */
function stepProductes(){
  const ex=state.ex, l=ex.l, prods=state.prods;
  const ids=prods.map((p,i)=>({c:'c'+i, e: p.e===0 ? null : 'e'+i}));   // dos nombres: sense casella d'exponent
  const titol = ex.tipus==='mm' ? 'Multiplica els coeficients i suma els exponents'
    : ex.tipus==='mp' ? 'Multiplica el monomi per cada terme del parèntesi' : 'Multiplica cada terme del primer per cada terme del segon';
  const fila = (p,i) => `<span class="lbl fila-prod"><span class="prod-op">${factor(p.a,l,true)} <span class="sg">·</span> ${factor(p.b,l,false)}</span><span>=</span><span class="cterme">${casellaCoef(ids[i].c,`coeficient del producte ${i+1}`)}${ids[i].e ? `<span class="lit"><i>${l}</i><sup class="supbox">${casellaExp(ids[i].e,`exponent del producte ${i+1}`)}</sup></span>` : ''}</span></span>`;
  return {
    title:titol,
    sub: ex.tipus==='mm' ? 'Escriu el coeficient amb el seu signe i l\'exponent de la lletra.'
      : 'A cada producte, escriu el coeficient amb el seu signe i l\'exponent de la lletra (una lletra sola té exponent 1).',
    html(){ return `<span class="prods">${prods.map(fila).join('')}</span>`; },
    ids:ids.flatMap(x=>x.e ? [x.c,x.e] : [x.c]),
    previ(v){ return previHTML(prods.map((p,i)=>({c:v[ids[i].c], e: ids[i].e ? v[ids[i].e] : 0, expBox:!!ids[i].e, fix:true, buitCompta:true})), l); },
    hint(){
      if(ex.tipus==='mm') return 'Coeficients: multiplica\'ls, amb la regla dels signes. Lletres: x<sup>m</sup> · x<sup>n</sup> = x<sup>m+n</sup> (els exponents se <b>sumen</b>).';
      return 'Per a cada fila: <b>coeficient</b> = producte dels dos coeficients (dos signes iguals fan +, dos de diferents fan −); <b>exponent</b> = suma dels exponents. Un nombre sense lletra té exponent 0, i una x sola té exponent 1.';
    },
    check(v){
      for(const x of ids){ if(v[x.c]===null) return {ok:false,msg:'Omple totes les caselles dels coeficients.',bad:[x.c]}; }
      let primer=null; const bad=[];
      prods.forEach((p,i)=>{
        const r=comprovaProducte(p,{c:v[ids[i].c], e: ids[i].e ? v[ids[i].e] : 0});
        if(!r.ok){ if(!primer) primer=r; if(r.badC) bad.push(ids[i].c); if(r.badE) bad.push(ids[i].e); }
      });
      return primer ? {ok:false, msg:primer.msg, bad} : {ok:true};
    },
    res(){
      if(ex.tipus==='pp') return `${exprHTML(ex)} <span>=</span> ${polHTML(prods,l)}`;
      return `${exprHTML(ex)} <span>=</span> <span class="final-r">${polHTML(prods,l)}</span>`;
    }
  };
}

/* ---------- pas: redueix i ordena (polinomi per polinomi) ---------- */
function stepResultat(){
  const ex=state.ex, l=ex.l, prods=state.prods;
  const maxG=Math.max(...prods.map(t=>t.e));
  const graus=[...Array(maxG+1).keys()].reverse();
  const id = e => 'r'+e;
  return {
    title:'Redueix els termes semblants i ordena', permetBuit:true,
    sub:'Suma els coeficients dels termes del mateix grau. Deixa buida la casella d\'un grau que no hi sigui.',
    html(){ return `<span class="lbl fila-pol">${polHTML(prods,l)} <span>=</span></span><span class="caselles resultat">${graus.map(e=>casellaTerme(id(e),e,l,nomGrau(e)+' del resultat')).join('')}</span>`; },
    ids:graus.map(id),
    previ(v){ return previHTML(graus.map(e=>({c:v[id(e)], e})), l); },
    hint(){
      const txt = cs => cs.map((c,i)=>i===0 ? (c<0?'−':'')+Math.abs(c) : ` ${c<0?'−':'+'} ${Math.abs(c)}`).join('');
      return 'Termes semblants: ' + graus.filter(e=>prods.some(p=>p.e===e)).map(e=>`<b>${e===0?'nombres':lit(e,l)}</b>: ${txt(prods.filter(p=>p.e===e).map(p=>p.c))}`).join(' · ') + '.';
    },
    check(v){
      if(graus.every(e=>v[id(e)]===null)) return {ok:false,msg:'Escriu el resultat a les caselles.',bad:[id(graus[0])]};
      const vals={}; graus.forEach(e=>vals[e]=v[id(e)]);
      const r=comprovaResultat(prods, graus, vals);
      return r.ok ? r : {ok:false, msg:r.msg, bad:r.bad.map(id)};
    },
    res(){ return `${polHTML(prods,l)} <span>=</span> <span class="final-r">${polHTML(reduce(prods),l)}</span>`; }
  };
}

/* ---------- render ---------- */
const ETIQ = {mm:['Monomi per monomi','finit'], mp:['Monomi per polinomi','pur'], pp:['Polinomi per polinomi','mixt']};
function newExercise(){
  const ex=genera(state.nivell);
  state.ex=ex; state.prods=productes(ex); state.cur=0; state.errs=0; state.hint=false;
  state.steps = ex.tipus==='pp' ? [stepProductes(), stepResultat()] : [stepProductes()];
  state.steps.forEach((st,i)=>{ st.label = state.steps.length>1 ? 'Pas '+(i+1) : 'Calcula'; });
  $('#tag').className='tipus '+ETIQ[ex.tipus][1];
  $('#tag').textContent = ETIQ[ex.tipus][0];
  $('#target').innerHTML = exprHTML(ex);
  $('#steps').innerHTML=''; $('#result').innerHTML='';
  next(false);
}

function valors(sec,st){ const v={}; st.ids.forEach(id=>{ v[id]=llegeix(sec.querySelector('#'+id).value); }); return v; }
function actualitzaPrevi(sec,st){ const p=sec.querySelector('.previ-m'); if(p) p.innerHTML=st.previ(valors(sec,st)); }

function addStep(i){
  const st=state.steps[i];
  const sec=document.createElement('section');
  sec.className='step'; sec.dataset.i=i;
  sec.innerHTML = `<div class="step-head"><span class="num">${st.label}</span><h3>${st.title}</h3></div>
    ${st.sub?`<p class="sub">${st.sub}</p>`:''}
    <div class="work pol-work">${st.html()}</div>
    <p class="previ"><span class="previ-et">Així queda:</span> <span class="previ-m"></span></p>
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
    sec.querySelector('.previ').remove();
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
  const clean = state.errs===0 && !state.hint;
  stats.fets++; if(clean){ stats.primera++; stats.ratxa++; } else stats.ratxa=0;
  saveStats(); renderStats();
  const msg = clean ? 'Tot bé a la primera.' : (state.errs ? `Fet! Has corregit ${state.errs} ${pl(state.errs,'error','errors')} pel camí.` : 'Fet, amb l\'ajuda d\'alguna pista.');
  $('#result').innerHTML = `<div class="result">
      <div class="final pol-final">${exprHTML(state.ex)}<span>=</span><span class="final-r">${polHTML(reduce(state.prods),state.ex.l)}</span></div>
      <p class="fb ok">${msg}</p>
      <div class="actions"><button class="boto boto-principal" id="nextEx" type="button">Nou exercici</button></div>
    </div>`;
  const b=$('#nextEx'); b.onclick=()=>newExercise();
  b.focus();
}

/* Retorn: passa a la casella següent o, a l'última, comprova */
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
  $('#nivellDesc').textContent = n==='facil' ? 'sense nombres negatius' : 'amb signes negatius: dos signes iguals fan +, dos de diferents fan −';
  try{ localStorage.setItem('mpol-nivell', n); }catch(e){}
}
document.querySelectorAll('.nivell').forEach(btn=>{ btn.onclick=()=>{ setNivell(btn.dataset.nivell); newExercise(); }; });
try{ const n=localStorage.getItem('mpol-nivell'); if(['facil','normal'].includes(n)) setNivell(n); }catch(e){}

const bm=$('#btnMetode'), pm=$('#metode');
function setMetode(open){ bm.setAttribute('aria-expanded',String(open)); pm.hidden=!open; try{ localStorage.setItem('mpol-metode', open?'1':'0'); }catch(e){} }
bm.onclick=()=>setMetode(pm.hidden);
try{ if(localStorage.getItem('mpol-metode')==='1') setMetode(true); }catch(e){}

renderStats();
newExercise();
})();
