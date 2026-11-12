/* Aplicatiu «Monomis i polinomis» (3r d'ESO · tema 2, Polinomis) · el munta monomis-polinomis.html
   Tres tipus d'exercici (quadern, exercicis 6 i 7; apunts 2 i 3):
   · Monomi: coeficient, part literal i grau.
   · Polinomi: nombre de termes, terme de grau més alt, grau i terme independent.
   · Semblants: tria els monomis semblants a un de donat.
   Fàcil: una sola lletra i sense negatius. Normal: negatius, coeficients fraccionaris i més d'una lletra.
   El motor (generadors i comprovacions) també s'exporta per a la prova de proves/. */
(function(){
"use strict";
const rand = (a,b) => a + Math.floor(Math.random()*(b-a+1));
const pick = arr => arr[Math.floor(Math.random()*arr.length)];
function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=rand(0,i); [a[i],a[j]]=[a[j],a[i]]; } return a; }
function gcd(a,b){ a=Math.abs(a); b=Math.abs(b); while(b){ [a,b]=[b,a%b]; } return a; }

/* Monomi: {n, d, v:{lletra:exponent}} (coeficient n/d irreductible, d>0) */
const grau = m => Object.values(m.v).reduce((a,b)=>a+b,0);
const clauLit = m => Object.keys(m.v).sort().map(k=>k+(m.v[k]>1?m.v[k]:'')).join('');
const mateixaLit = (a,b) => clauLit(a)===clauLit(b);
const FRACS=[[1,2],[1,3],[2,3],[1,4],[3,4],[2,5],[3,5]];
const JOCS=[['x','y'],['a','b'],['m','n'],['x','y','z'],['a','b','c']];

function coefAleatori(normal){
  if(normal && Math.random()<0.2){ const [n,d]=pick(FRACS); return {n: Math.random()<0.3?-n:n, d}; }
  if(Math.random()<0.15) return {n: normal && Math.random()<0.5 ? -1 : 1, d:1};   // coeficient 1 o −1 implícit
  const n=rand(2,12);
  return {n: normal && Math.random()<0.4 ? -n : n, d:1};
}
function partLiteral(normal, joc){
  if(!normal || Math.random()<0.4){ const l=pick(joc); return {[l]:rand(1,5)}; }
  const ls=shuffle([...joc]).slice(0, rand(2, Math.min(3,joc.length)));
  const v={}; ls.forEach(l=>v[l]=rand(1,4)); return v;
}
function genMonomi(normal){
  const joc = normal ? pick(JOCS) : [pick(['x','y','z','a','m','t'])];
  const c=coefAleatori(normal);
  const v = Math.random()<0.07 ? {} : partLiteral(normal, joc);
  if(!Object.keys(v).length && Math.abs(c.n)===1 && c.d===1) c.n*=7;
  return {tipus:'monomi', m:{...c, v}};
}
/* Opcions per a la part literal: la bona i tres de falses versemblants */
function opcionsLit(m){
  const bona=clauLit(m);
  const ops=new Set([bona]);
  const ls=Object.keys(m.v).sort();
  const cand=[];
  if(!ls.length){ cand.push('x','x0'); }
  else {
    if(Math.abs(m.n)!==1 || m.d!==1) cand.push('#coef');                                   // amb el coeficient
    cand.push(clauLit({v:Object.fromEntries(ls.map(l=>[l,m.v[l]+1]))}));
    if(ls.length>1){ const r=[...ls].reverse(); cand.push(clauLit({v:Object.fromEntries(ls.map((l,i)=>[l,m.v[r[i]]]))})); cand.push(clauLit({v:{[ls[0]]:m.v[ls[0]]}})); }
    cand.push(clauLit({v:Object.fromEntries(ls.map(l=>[l,1]))}));
    cand.push(ls.join('')+grau(m));
  }
  for(const c of shuffle(cand)){ if(ops.size>=4) break; if(c!==bona) ops.add(c); }
  return shuffle([...ops]);
}
function genPolinomi(normal){
  for(;;){
    const joc = normal && Math.random()<0.35 ? pick(JOCS.slice(0,3)) : [normal ? pick(['x','y','z','a','m']) : pick(['x','y','a','m'])];
    const n=rand(2,4);
    const ts=[];
    for(let i=0;i<n;i++){
      const c=coefAleatori(normal);
      if(!normal) { c.n=Math.abs(c.n); }
      let v = i===n-1 && Math.random()<0.7 ? {} : partLiteral(normal && joc.length>1, joc);
      if(joc.length===1 && Object.keys(v).length){ v={[joc[0]]:rand(1, normal?5:4)}; }
      if(!Object.keys(v).length && Math.abs(c.n)===1 && c.d===1) c.n*=rand(2,9);
      ts.push({...c, v});
    }
    if(normal && ts[0].n<0) ts[0].n=-ts[0].n;
    const claus=ts.map(clauLit);
    if(new Set(claus).size!==n) continue;                               // sense termes semblants
    const gs=ts.map(grau), max=Math.max(...gs);
    if(gs.filter(g=>g===max).length!==1) continue;                     // el terme de grau més alt ha de ser únic
    if(max===0) continue;
    if(Math.random()<0.4) shuffle(ts);
    return {tipus:'polinomi', ts};
  }
}
function genSemblants(normal){
  for(;;){
    const joc = normal ? pick(JOCS.slice(0,3)) : [pick(['x','y','a','m'])];
    let v = joc.length===1 ? {[joc[0]]:rand(1,4)} : partLiteral(true, joc);
    if(joc.length>1 && Object.keys(v).length<2) v={[joc[0]]:rand(1,3), [joc[1]]:rand(1,3)};
    const obj={...coefAleatori(normal), v};
    const ls=Object.keys(v).sort();
    const llista=[];
    const ns=rand(2,3);
    for(let i=0;i<ns;i++) llista.push({...coefAleatori(normal), v:{...v}});
    /* falsos: mateix coeficient i lletres, però exponents diferents; exponents intercanviats; una lletra de més o de menys */
    const falsos=[];
    falsos.push({n:obj.n, d:obj.d, v:Object.fromEntries(ls.map((l,i)=>[l, i===0 ? v[l]+1 : v[l]]))});
    if(ls.length>1 && v[ls[0]]!==v[ls[1]]) falsos.push({...coefAleatori(normal), v:{[ls[0]]:v[ls[1]], [ls[1]]:v[ls[0]]}});
    if(ls.length>1) falsos.push({...coefAleatori(normal), v:{[ls[0]]:v[ls[0]]}});
    else { const altra = joc[0]==='x' ? 'y' : 'x'; falsos.push({...coefAleatori(normal), v:{[altra]:v[ls[0]]}}); }
    falsos.push({...coefAleatori(normal), v:Object.fromEntries(ls.map(l=>[l, Math.max(1, v[l]-1) === v[l] ? v[l]+2 : v[l]-1]))});
    if(ls.length===1) falsos.push({...coefAleatori(normal), v:{[ls[0]]: v[ls[0]]===1 ? 3 : 1}});
    const fs=falsos.filter(f=>!mateixaLit(f,obj));
    const tots=shuffle([...llista, ...fs.slice(0, 7-ns)]);
    if(tots.length<5) continue;
    return {tipus:'semblants', obj, llista:tots};
  }
}
function genera(nivell, tipus){
  const normal = nivell!=='facil';
  const t = tipus || pick(['monomi','polinomi','semblants']);
  return t==='monomi' ? genMonomi(normal) : t==='polinomi' ? genPolinomi(normal) : genSemblants(normal);
}

/* Coeficient escrit: enter o fracció («−3», «1/2», «-3/4»); «−» i «+» sols valen −1 i 1 */
function llegeixQ(raw){
  const s=String(raw).trim().replace(/[−–]/g,'-').replace(/\s+/g,'').replace(/^\+/,'');
  if(s==='') return null;
  if(s==='-') return {n:-1,d:1};
  let m=/^(-?\d+)$/.exec(s); if(m) return {n:parseInt(m[1],10), d:1};
  m=/^(-?)(\d+)\/(\d+)$/.exec(s); if(m && +m[3]>0){ const n=+m[2]*(m[1]?-1:1), d=+m[3], g=gcd(n,d)||1; return {n:n/g, d:d/g}; }
  return NaN;
}
const igualQ = (a,b) => a && b && a.n*b.d===b.n*a.d;

/* ---------- comprovacions (sense DOM) ---------- */
function comprovaMonomi(ex,r){
  const m=ex.m, bad=[]; let msg=null;
  if(!igualQ(r.coef,m)){ bad.push('coef');
    if(Math.abs(m.n)===1 && m.d===1 && Object.keys(m.v).length && !igualQ(r.coef,{n:-m.n,d:1})) msg='Quan una lletra no porta cap nombre al davant, el coeficient és 1 (o −1 si hi ha un signe menys).';
    else if(igualQ(r.coef,{n:-m.n,d:m.d})) msg='El coeficient porta el signe del monomi.';
    else msg='El coeficient és el nombre que multiplica la part literal.'; }
  if(r.lit!==clauLit(m)){ bad.push('lit'); if(!msg) msg = r.lit==='#coef' ? 'La part literal són només les lletres amb els seus exponents, sense el coeficient.' : 'La part literal són les lletres amb els seus exponents, tal com surten al monomi.'; }
  if(r.grau!==grau(m)){ bad.push('grau'); if(!msg) msg = Object.keys(m.v).length>1 ? 'El grau és la suma dels exponents de totes les lletres.' : !Object.keys(m.v).length ? 'Un nombre sol no té part literal: el seu grau és 0.' : 'El grau és l\'exponent de la lletra (si no en porta, és 1).'; }
  return bad.length ? {ok:false, bad, msg} : {ok:true};
}
function comprovaPolinomi(ex,r){
  const ts=ex.ts, gs=ts.map(grau), max=Math.max(...gs), iMax=gs.indexOf(max);
  const ti=ts.find(t=>!Object.keys(t.v).length) || {n:0,d:1};
  const bad=[]; let msg=null;
  if(r.nt!==ts.length){ bad.push('nt'); msg='Compta els termes: cada monomi separat per un + o un − és un terme.'; }
  if(r.alt!==iMax){ bad.push('alt'); if(!msg) msg='El terme de grau més alt és el que té més grau, encara que no sigui el primer.' + (Object.keys(ts[0].v).length>1||ts.some(t=>Object.keys(t.v).length>1)?' Amb diverses lletres, suma els exponents.':''); }
  if(r.grau!==max){ bad.push('grau'); if(!msg) msg='El grau del polinomi és el grau del seu terme de grau més alt.'; }
  if(!igualQ(r.ti||{n:0,d:1},ti)){ bad.push('ti'); if(!msg) msg = ti.n===0 ? 'Aquest polinomi no té terme independent (cap terme sense lletra): posa-hi 0.' : 'El terme independent és el terme sense lletra, amb el seu signe.'; }
  return bad.length ? {ok:false, bad, msg} : {ok:true};
}
function comprovaSemblants(ex,sel){
  const bons=new Set(ex.llista.map((m,i)=>mateixaLit(m,ex.obj)?i:-1).filter(i=>i>=0));
  const sobren=[...sel].filter(i=>!bons.has(i)), falten=[...bons].filter(i=>!sel.has(i));
  if(!sobren.length && !falten.length) return {ok:true};
  let msg;
  if(sobren.length){
    const m=ex.llista[sobren[0]];
    msg = m.n===ex.obj.n && m.d===ex.obj.d ? 'N\'has marcat algun que té el mateix coeficient però no la mateixa part literal: el coeficient no importa, mira les lletres i els exponents.' : 'N\'has marcat algun que no és semblant: han de tenir les mateixes lletres amb els mateixos exponents.';
  } else msg='En falta algun: el coeficient pot ser diferent, fins i tot negatiu o fraccionari.';
  return {ok:false, sobren, falten, msg};
}

const MOTOR = {genera, genMonomi, genPolinomi, genSemblants, grau, clauLit, mateixaLit, opcionsLit, llegeixQ, comprovaMonomi, comprovaPolinomi, comprovaSemblants};
if(typeof module!=='undefined' && module.exports){ module.exports = MOTOR; }
if(typeof document==='undefined') return;

/* ====================================================================
   Interfície
   ==================================================================== */
const $ = s => document.querySelector(s);
const pl = (n,s,p) => n===1 ? s : p;
const frac = (n,d) => `<span class="frac"><span>${n}</span><span>${d}</span></span>`;
const litHTML = v => Object.keys(v).sort().map(l=>`<i>${l}</i>${v[l]>1?`<sup>${v[l]}</sup>`:''}`).join('');
const clauHTML = k => k==='#coef' ? null : k==='' ? 'no en té' : k.replace(/([a-z])(\d*)/g,(m,l,e)=>`<i>${l}</i>${e?`<sup>${e}</sup>`:''}`);
function monoHTML(m, ambSigne=true){
  const a=Math.abs(m.n), te=Object.keys(m.v).length;
  const cos = m.d>1 ? frac(a,m.d) : (a===1 && te ? '' : a);
  return `<span class="t">${ambSigne && m.n<0 ? '−' : ''}${cos}${litHTML(m.v)}</span>`;
}
const polHTML = ts => '<span class="pol">'+ts.map((t,i)=>i===0 ? monoHTML(t) : `<span class="t"><span class="sg">${t.n<0?'−':'+'}</span>${monoHTML(t,false)}</span>`).join('')+'</span>';
const qHTML = q => q.d>1 ? `${q.n<0?'−':''}${frac(Math.abs(q.n),q.d)}` : `${q.n<0?'−':''}${Math.abs(q.n)}`;
const casella = (id,label,w) => `<input id="${id}" class="box cf" inputmode="text" autocomplete="off" spellcheck="false" aria-label="${label}"${w?` style="width:${w}"`:''}>`;

/* ---------- estat ---------- */
const state = {nivell:'facil', tipus:'barreja', ex:null, errs:0, hint:false, lit:null, alt:null, sel:new Set(), fet:false};
let stats = {fets:0, primera:0, ratxa:0};
try{ const raw=localStorage.getItem('mpar-stats'); if(raw) stats=Object.assign(stats,JSON.parse(raw)); }catch(e){}
function saveStats(){ try{ localStorage.setItem('mpar-stats',JSON.stringify(stats)); }catch(e){} }
function renderStats(){
  $('#stats').innerHTML = `<span class="xip">Fets <strong>${stats.fets}</strong></span><span class="xip${stats.primera?' verd':''}">Bé a la primera <strong>${stats.primera}</strong></span><span class="xip${stats.ratxa>=3?' verd':''}">Ratxa <strong>${stats.ratxa}</strong></span><button class="enllac" id="reset" type="button">Posa a zero</button>`;
  $('#reset').onclick = () => { stats={fets:0,primera:0,ratxa:0}; saveStats(); renderStats(); };
}

function newExercise(){
  const ex=genera(state.nivell, state.tipus==='barreja' ? null : state.tipus);
  Object.assign(state,{ex, errs:0, hint:false, lit:null, alt:null, sel:new Set(), fet:false});
  const sec=$('#steps');
  $('#result').innerHTML='';
  if(ex.tipus==='monomi'){
    $('#enunciat').textContent='Indica el coeficient, la part literal i el grau del monomi';
    $('#target').innerHTML=monoHTML(ex.m);
    sec.innerHTML = `<section class="step"><div class="work pol-work parts">
      <span class="lbl camp"><b>Coeficient</b>${casella('coef','coeficient')}<small>amb el seu signe; si és una fracció, escriu-la amb / (per exemple 1/2)</small></span>
      <span class="lbl camp"><b>Part literal</b><span class="tria" role="group" aria-label="Part literal">${opcionsLit(ex.m).map(k=>`<button type="button" class="tria-op" data-k="${k}" aria-pressed="false">${k==='#coef' ? monoHTML(ex.m) : clauHTML(k)}</button>`).join('')}</span></span>
      <span class="lbl camp"><b>Grau</b>${casella('grau','grau','3.4em')}</span>
    </div>${accions()}</section>`;
  } else if(ex.tipus==='polinomi'){
    $('#enunciat').textContent='Analitza el polinomi';
    $('#target').innerHTML=polHTML(ex.ts);
    sec.innerHTML = `<section class="step"><div class="work pol-work parts">
      <span class="lbl camp"><b>Nombre de termes</b>${casella('nt','nombre de termes','3.4em')}</span>
      <span class="lbl camp"><b>Terme de grau més alt</b><span class="tria" role="group" aria-label="Terme de grau més alt">${ex.ts.map((t,i)=>`<button type="button" class="tria-op" data-i="${i}" aria-pressed="false">${monoHTML(t)}</button>`).join('')}</span></span>
      <span class="lbl camp"><b>Grau del polinomi</b>${casella('grau','grau del polinomi','3.4em')}</span>
      <span class="lbl camp"><b>Terme independent</b>${casella('ti','terme independent')}<small>amb el seu signe; si no en té, posa-hi 0</small></span>
    </div>${accions()}</section>`;
  } else {
    $('#enunciat').textContent='Marca tots els monomis semblants a aquest';
    $('#target').innerHTML=monoHTML(ex.obj);
    sec.innerHTML = `<section class="step"><div class="work pol-work parts">
      <span class="lbl camp"><b>Semblants a ${monoHTML(ex.obj)}</b><span class="tria xips-m" role="group" aria-label="Monomis">${ex.llista.map((m,i)=>`<button type="button" class="tria-op" data-s="${i}" aria-pressed="false">${monoHTML(m)}</button>`).join('')}</span><small>Pot ser que n'hi hagi més d'un. Toca'ls per marcar-los o desmarcar-los.</small></span>
    </div>${accions()}</section>`;
  }
  sec.querySelectorAll('.tria-op').forEach(b=>b.onclick=()=>{
    if(state.fet) return;
    b.classList.remove('bad');
    if(b.dataset.s!==undefined){ const i=+b.dataset.s; if(state.sel.has(i)) state.sel.delete(i); else state.sel.add(i); b.setAttribute('aria-pressed',String(state.sel.has(i))); return; }
    const grup=b.parentElement; grup.querySelectorAll('.tria-op').forEach(x=>{ x.setAttribute('aria-pressed',String(x===b)); x.classList.remove('bad'); });
    if(b.dataset.k!==undefined) state.lit=b.dataset.k; else state.alt=+b.dataset.i;
  });
  sec.querySelector('.check').onclick=onCheck;
  sec.querySelector('.hintbtn').onclick=()=>{ const h=sec.querySelector('.hinttext'); h.innerHTML='<b>Pista:</b> '+pista(); h.hidden=false; state.hint=true; };
  sec.querySelector('.work').addEventListener('input',e=>e.target.classList.remove('bad'));
}
const accions = () => `<div class="actions"><button class="boto boto-principal check" type="button">Comprova</button><button class="boto hintbtn" type="button">Pista</button></div><p class="fb" role="status"></p><p class="hinttext" hidden></p>`;
function pista(){
  const ex=state.ex;
  if(ex.tipus==='monomi') return 'Coeficient: el nombre (amb el signe). Part literal: les lletres amb els exponents. Grau: la suma dels exponents de les lletres (una lletra sense exponent té exponent 1).';
  if(ex.tipus==='polinomi') return 'Calcula el grau de cada terme: ' + ex.ts.map(t=>`${monoHTML(t)} → ${grau(t)}`).join(' · ') + '. El terme independent és el que no té lletra.';
  return 'Dos monomis són semblants si tenen <b>exactament</b> la mateixa part literal: les mateixes lletres amb els mateixos exponents. El coeficient no importa.';
}
function num(id){ const s=$('#'+id).value.trim(); return s==='' ? null : /^\d+$/.test(s) ? +s : NaN; }
function onCheck(){
  if(state.fet) return;
  const ex=state.ex, sec=$('#steps .step'), fb=sec.querySelector('.fb');
  sec.querySelectorAll('.box,.tria-op').forEach(b=>b.classList.remove('bad'));
  let r;
  if(ex.tipus==='monomi'){
    const coef=llegeixQ($('#coef').value), g=num('grau');
    if(coef===null || g===null || state.lit===null){ fb.className='fb err'; fb.textContent='Omple el coeficient i el grau, i tria la part literal.'; return; }
    if(Number.isNaN(coef) || Number.isNaN(g)){ fb.className='fb err'; fb.textContent='El coeficient és un nombre (enter o fracció amb /) i el grau, un nombre natural.'; return; }
    r=comprovaMonomi(ex,{coef, lit:state.lit, grau:g});
    if(!r.ok){ r.bad.forEach(b=>{ if(b==='lit'){ const t=sec.querySelector(`.tria-op[data-k="${state.lit}"]`); if(t) t.classList.add('bad'); } else $('#'+b).classList.add('bad'); }); }
  } else if(ex.tipus==='polinomi'){
    const nt=num('nt'), g=num('grau'), ti=llegeixQ($('#ti').value);
    if(nt===null || g===null || state.alt===null){ fb.className='fb err'; fb.textContent='Omple totes les caselles i tria el terme de grau més alt.'; return; }
    if(Number.isNaN(nt) || Number.isNaN(g) || Number.isNaN(ti)){ fb.className='fb err'; fb.textContent='A les caselles hi van nombres (el terme independent, amb el seu signe).'; return; }
    r=comprovaPolinomi(ex,{nt, alt:state.alt, grau:g, ti});
    if(!r.ok) r.bad.forEach(b=>{ if(b==='alt'){ const t=sec.querySelector(`.tria-op[data-i="${state.alt}"]`); if(t) t.classList.add('bad'); } else $('#'+b).classList.add('bad'); });
  } else {
    if(!state.sel.size){ fb.className='fb err'; fb.textContent='Marca els monomis semblants.'; return; }
    r=comprovaSemblants(ex,state.sel);
    if(!r.ok) r.sobren.forEach(i=>sec.querySelector(`.tria-op[data-s="${i}"]`).classList.add('bad'));
  }
  if(!r.ok){ state.errs++; fb.className='fb err'; fb.textContent=r.msg; return; }
  state.fet=true;
  fb.className='fb'; fb.textContent='';
  sec.querySelector('.actions').remove();
  sec.querySelectorAll('.box').forEach(b=>{ b.disabled=true; b.classList.add('ok'); });
  sec.querySelectorAll('.tria-op[aria-pressed="true"]').forEach(b=>b.classList.add('ok'));
  finish();
}
function finish(){
  const ex=state.ex;
  const clean = state.errs===0 && !state.hint;
  stats.fets++; if(clean){ stats.primera++; stats.ratxa++; } else stats.ratxa=0;
  saveStats(); renderStats();
  const msg = clean ? 'Tot bé a la primera.' : (state.errs ? `Fet! Has corregit ${state.errs} ${pl(state.errs,'error','errors')} pel camí.` : 'Fet, amb l\'ajuda d\'alguna pista.');
  let resum;
  if(ex.tipus==='monomi'){ const m=ex.m; resum=`${monoHTML(m)}: coeficient ${qHTML(m)}, part literal ${clauHTML(clauLit(m))}, grau ${grau(m)}`; }
  else if(ex.tipus==='polinomi'){ const gs=ex.ts.map(grau), mx=Math.max(...gs); const ti=ex.ts.find(t=>!Object.keys(t.v).length); resum=`${ex.ts.length} termes · grau més alt: ${monoHTML(ex.ts[gs.indexOf(mx)])} · grau ${mx} · terme independent ${ti?qHTML(ti):'0 (no en té)'}`; }
  else { resum=`Semblants a ${monoHTML(ex.obj)}: ${ex.llista.filter(m=>mateixaLit(m,ex.obj)).map(m=>monoHTML(m)).join(', ')}`; }
  $('#result').innerHTML = `<div class="result">
      <div class="final pol-final resum-parts"><span>${resum}</span></div>
      <p class="fb ok">${msg}</p>
      <div class="actions"><button class="boto boto-principal" id="nextEx" type="button">Nou exercici</button></div>
    </div>`;
  const b=$('#nextEx'); b.onclick=()=>newExercise(); b.focus();
}
$('#steps').addEventListener('keydown',e=>{
  if(e.key!=='Enter' || !e.target.classList.contains('box')) return;
  e.preventDefault();
  const boxes=[...$('#steps').querySelectorAll('.box')];
  const seg=boxes[boxes.indexOf(e.target)+1];
  if(seg) seg.focus(); else onCheck();
});
function setNivell(n){
  state.nivell=n;
  document.querySelectorAll('.nivell').forEach(b=>b.setAttribute('aria-pressed', String(b.dataset.nivell===n)));
  $('#nivellDesc').textContent = n==='facil' ? 'una sola lletra, sense negatius' : 'negatius, fraccions i diverses lletres';
  try{ localStorage.setItem('mpar-nivell', n); }catch(e){}
}
function setTipus(t){
  state.tipus=t;
  document.querySelectorAll('.mode').forEach(b=>b.setAttribute('aria-pressed', String(b.dataset.tipus===t)));
  try{ localStorage.setItem('mpar-tipus', t); }catch(e){}
}
document.querySelectorAll('.nivell').forEach(btn=>{ btn.onclick=()=>{ setNivell(btn.dataset.nivell); newExercise(); }; });
document.querySelectorAll('.mode').forEach(btn=>{ btn.onclick=()=>{ setTipus(btn.dataset.tipus); newExercise(); }; });
try{ const n=localStorage.getItem('mpar-nivell'); if(['facil','normal'].includes(n)) setNivell(n); }catch(e){}
try{ const t=localStorage.getItem('mpar-tipus'); if(['barreja','monomi','polinomi','semblants'].includes(t)) setTipus(t); }catch(e){}
const bm=$('#btnMetode'), pm=$('#metode');
function setMetode(open){ bm.setAttribute('aria-expanded',String(open)); pm.hidden=!open; try{ localStorage.setItem('mpar-metode', open?'1':'0'); }catch(e){} }
bm.onclick=()=>setMetode(pm.hidden);
try{ if(localStorage.getItem('mpar-metode')==='1') setMetode(true); }catch(e){}
renderStats();
newExercise();
})();
