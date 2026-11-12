/* Aplicatiu «Suma i resta de polinomis» (3r d'ESO · tema 2, Polinomis) · el munta suma-resta-polinomis.html
   Passos: (si hi ha un − davant d'un parèntesi) treure els parèntesis, agrupar els termes
   semblants i reduir-los escrivint el resultat ordenat.
   Les respostes s'escriuen en caselles, una per terme: cada casella porta el seu signe
   (sense signe s'entén +) i no hi ha cap «+» fix entre caselles.
   El motor (generadors i comprovacions) també s'exporta per a la prova de proves/. */
(function(){
"use strict";
const rand = (a,b) => a + Math.floor(Math.random()*(b-a+1));
const pick = arr => arr[Math.floor(Math.random()*arr.length)];
function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=rand(0,i); [a[i],a[j]]=[a[j],a[i]]; } return a; }
const coef = neg => { let c; do{ c=rand(neg?-9:1,9); }while(c===0); return c; };

/* ---------- polinomis: llistes de termes {c, e} ---------- */
function reduce(terms){
  const m=new Map();
  terms.forEach(t=>m.set(t.e,(m.get(t.e)||0)+t.c));
  return [...m.entries()].filter(([,c])=>c!==0).sort((a,b)=>b[0]-a[0]).map(([e,c])=>({c,e}));
}
/* Termes un cop tret el parèntesi: el signe de davant multiplica cada terme */
const flat = ex => ex.parts.flatMap(p=>p.terms.map(t=>({c:p.op*t.c, e:t.e})));
const grausDesc = terms => [...new Set(terms.map(t=>t.e))].sort((a,b)=>b-a);
/* Grups de termes semblants, de grau més alt a més baix, en l'ordre en què surten */
const grups = terms => grausDesc(terms).map(e=>({e, cs:terms.filter(t=>t.e===e).map(t=>t.c)}));
const nGrupsAmbMesDun = terms => grups(terms).filter(g=>g.cs.length>1).length;

/* ---------- generadors ---------- */
const LLETRES=['x','x','x','a','m','y','b','z'];
const NOMS=['P','Q','R','S'];

/* Polinomi ordenat amb graus diferents; el grau més alt sempre hi és */
function polOrdenat(neg,maxG,n){
  const resta=shuffle([...Array(maxG).keys()]).slice(0,n-1);
  return [maxG,...resta].sort((a,b)=>b-a).map((e,i)=>({c: (i===0 && Math.random()<0.8) ? Math.abs(coef(neg)) : coef(neg), e}));
}

/* Un sol polinomi desordenat amb termes semblants (quadern, exercici 8) */
function genRedueix(neg){
  for(;;){
    const maxG = neg ? rand(2,3) : rand(1,2);
    const n = neg ? rand(5,7) : rand(4,5);
    const graus=[maxG]; while(graus.length<n) graus.push(rand(0,maxG));
    const terms=shuffle(graus.map(e=>({c:coef(neg), e})));
    if(neg && terms.filter(t=>t.c<0).length<2) continue;
    const gs=grups(terms);
    if(gs.some(g=>g.cs.length>3)) continue;
    if(nGrupsAmbMesDun(terms) < 2) continue;
    const r=reduce(terms);
    if(!r.some(t=>t.e>0)) continue;
    return {tipus:'redueix', l:pick(LLETRES), parts:[{op:1, terms}]};
  }
}

/* P(x) + Q(x) (quadern, exercici 10) */
function genSuma(neg){
  for(;;){
    const P=polOrdenat(neg, rand(2, neg?4:3), rand(2,4));
    const Q=polOrdenat(neg, rand(1, neg?4:3), rand(2,3));
    const ex={tipus:'suma', l:'x', parts:[{op:1,nom:'P',terms:P},{op:1,nom:'Q',terms:Q}]};
    const f=flat(ex);
    if(nGrupsAmbMesDun(f) < 2) continue;
    if(reduce(f).length<2) continue;
    return ex;
  }
}

/* P(x) − Q(x), i a vegades tres polinomis (quadern, exercicis 9 i 10) */
function genResta(){
  for(;;){
    const k=pick([2,2,2,3]);
    const ops = k===2 ? [1,-1] : pick([[1,-1,-1],[1,1,-1],[1,-1,1]]);
    const parts=ops.map((op,i)=>({op, nom:NOMS[i], terms:polOrdenat(true, rand(1, i===0?4:3), rand(2, i===0?4:3))}));
    const ex={tipus:'resta', l:'x', parts};
    const f=flat(ex);
    if(nGrupsAmbMesDun(f) < 2) continue;
    if(reduce(f).length<2) continue;
    /* almenys un terme negatiu dins d'un parèntesi restat, perquè el canvi de signe es noti */
    if(!parts.some(p=>p.op<0 && p.terms.some(t=>t.c<0))) continue;
    return ex;
  }
}

function genera(nivell){
  if(nivell==='facil') return Math.random()<0.5 ? genRedueix(false) : genSuma(false);
  const r=Math.random();
  return r<0.3 ? genRedueix(true) : r<0.5 ? genSuma(true) : genResta();
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
const mateixos = (a,b) => a.length===b.length && [...a].sort((x,y)=>x-y).every((v,i)=>v===[...b].sort((x,y)=>x-y)[i]);

/* Pas 1: vals = valors escrits per als termes de cada parèntesi restat, en ordre */
function comprovaParentesis(ex,vals){
  const esperat=[], original=[];
  ex.parts.forEach(p=>{ if(p.op<0) p.terms.forEach(t=>{ esperat.push(-t.c); original.push(t.c); }); });
  const bad=esperat.map((v,i)=>i).filter(i=>vals[i]!==esperat[i]);
  if(!bad.length) return {ok:true};
  if(bad.some(i=>Math.abs(vals[i])!==Math.abs(esperat[i])))
    return {ok:false, bad, msg:'Revisa els nombres marcats: en treure el parèntesi només canvien els signes, els nombres són els mateixos.'};
  if(vals.every((v,i)=>v===original[i]))
    return {ok:false, bad, msg:'Has copiat el parèntesi igual. El − de davant canvia el signe de tots els termes de dins.'};
  /* el primer de cada parèntesi canviat i els altres no */
  let i0=0, nomesPrimer=true;
  ex.parts.forEach(p=>{ if(p.op<0){ p.terms.forEach((t,j)=>{ const ok=vals[i0+j]===-t.c; if((j===0)!==ok) nomesPrimer=false; }); i0+=p.terms.length; } });
  if(nomesPrimer && ex.parts.some(p=>p.op<0 && p.terms.length>1))
    return {ok:false, bad, msg:'Has canviat només el signe del primer terme. El − afecta tots els termes del parèntesi, no només el primer.'};
  return {ok:false, bad, msg:'Revisa els signes marcats: el − de davant del parèntesi canvia el signe de cada terme (el + passa a − i el − passa a +).'};
}

/* Pas 2: per a cada grup (grau), els coeficients escrits; l'ordre dins del grup no importa */
function comprovaAgrupa(terms,valsPerGrup){
  const gs=grups(terms);
  const badG=gs.map((g,i)=>i).filter(i=>!mateixos(valsPerGrup[i],gs[i].cs));
  if(!badG.length) return {ok:true};
  const absOk = badG.every(i=>mateixos(valsPerGrup[i].map(Math.abs), gs[i].cs.map(Math.abs)));
  if(absOk) return {ok:false, badG, msg:'Els termes són aquests, però revisa els signes: cada terme s\'emporta el signe que té davant.'};
  const tots=gs.flatMap(g=>g.cs);
  const escrits=valsPerGrup.flat();
  if(mateixos(escrits,tots)) return {ok:false, badG, msg:'Has posat algun terme en un grup que no és el seu. Només van junts els termes semblants: la mateixa lletra amb el mateix exponent.'};
  return {ok:false, badG, msg:'Revisa els grups marcats: a cada grup hi van tots els termes amb aquella part literal, amb el seu signe.'};
}

/* Pas 3: vals[e] = coeficient escrit per al grau e (null = buit = 0) */
function comprovaResultat(terms,graus,vals){
  const r=new Map(reduce(terms).map(t=>[t.e,t.c]));
  const bad=graus.filter(e=>(vals[e]??0)!==(r.get(e)||0));
  if(!bad.length) return {ok:true};
  const gs=new Map(grups(terms).map(g=>[g.e,g.cs]));
  const e=bad[0], esc=vals[e]??0, esp=r.get(e)||0;
  if(!gs.has(e)) return {ok:false, bad, msg:`No hi ha cap terme ${e===0?'sense lletra':'de grau '+e}: aquesta casella s'ha de deixar buida.`};
  if(esp===0) return {ok:false, bad, msg:`Revisa la casella marcada: fixa't que els termes ${e===0?'sense lletra':'de grau '+e} s'anul·len.`};
  if(vals[e]===null) return {ok:false, bad, msg:'Falta algun terme: només es deixa buida la casella d\'un grau que no hi és o que s\'anul·la.'};
  if(esc===-esp) return {ok:false, bad, msg:'Revisa el signe de la casella marcada.'};
  return {ok:false, bad, msg:'Revisa la casella marcada: suma els coeficients del grup, cadascun amb el seu signe.'};
}

const MOTOR = {genera, genRedueix, genSuma, genResta, flat, reduce, grups, llegeix, comprovaParentesis, comprovaAgrupa, comprovaResultat};
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
function exprHTML(ex){
  if(ex.tipus==='redueix') return polHTML(ex.parts[0].terms, ex.l);
  return '<span class="pol">'+ex.parts.map((p,i)=>(i===0?'':`<span class="sg">${p.op<0?'−':'+'}</span>`)+par(polHTML(p.terms,ex.l))).join('')+'</span>';
}
const nomsHTML = ex => '<span class="pol">'+ex.parts.map((p,i)=>(i===0?'':`<span class="sg">${p.op<0?'−':'+'}</span>`)+`${p.nom}(<i>${ex.l}</i>)`).join('')+'</span>';
const nomExpr = ex => ex.tipus==='redueix' ? exprHTML(ex) : nomsHTML(ex);

/* Casella d'un terme: el coeficient (amb el seu signe) i, darrere, la part literal */
const casella = (id,e,l,label) => `<span class="cterme"><input id="${id}" class="box cf" inputmode="text" autocomplete="off" spellcheck="false" aria-label="${label}">${lit(e,l)}</span>`;
const nomGrau = (e,l) => e===0 ? 'terme independent' : `terme de grau ${e}`;

/* Vista prèvia: com queda escrit el que hi ha a les caselles */
function previHTML(parts,l){
  /* parts: llista de {c (nombre, null o NaN), e, fix} */
  const out=[]; let primer=true;
  for(const p of parts){
    if(p.c===null){ if(p.buitCompta){ out.push(`<span class="t">${primer?'':'<span class="sg">+</span>'}<span class="forat">□</span>${lit(p.e,l)}</span>`); primer=false; } continue; }
    if(Number.isNaN(p.c)){ out.push(`<span class="t">${primer?'':'<span class="sg">+</span>'}<span class="forat">?</span>${lit(p.e,l)}</span>`); primer=false; continue; }
    if(p.c===0 && !p.fix) continue;
    out.push(`<span class="t">${primer ? (p.c<0?'−':'') : `<span class="sg">${p.c<0?'−':'+'}</span>`}${mono(p.c,p.e,l)}</span>`);
    primer=false;
  }
  return out.length ? out.join('') : '0';
}

/* ---------- estat ---------- */
const state = {nivell:'facil', ex:null, f:null, steps:[], cur:0, errs:0, hint:false, saltat:false};
let stats = {fets:0, primera:0, ratxa:0};
try{ const raw=localStorage.getItem('srpol-stats'); if(raw) stats=Object.assign(stats,JSON.parse(raw)); }catch(e){}
function saveStats(){ try{ localStorage.setItem('srpol-stats',JSON.stringify(stats)); }catch(e){} }
function renderStats(){
  $('#stats').innerHTML = `<span class="xip">Fets <strong>${stats.fets}</strong></span><span class="xip${stats.primera?' verd':''}">Bé a la primera <strong>${stats.primera}</strong></span><span class="xip${stats.ratxa>=3?' verd':''}">Ratxa <strong>${stats.ratxa}</strong></span><button class="enllac" id="reset" type="button">Posa a zero</button>`;
  $('#reset').onclick = () => { stats={fets:0,primera:0,ratxa:0}; saveStats(); renderStats(); };
}

/* ---------- pas: treu els parèntesis ---------- */
function stepParentesis(){
  const ex=state.ex, l=ex.l;
  let k=0; const ids=[];
  const parts=ex.parts.map((p,i)=>{
    if(i===0) return `<span class="fix">${polHTML(p.terms,l)}</span>`;
    if(p.op>0) return `<span class="fix">${p.terms.map(t=>`<span class="t"><span class="sg">${t.c<0?'−':'+'}</span>${mono(t.c,t.e,l)}</span>`).join('')}</span>`;
    return `<span class="caselles">${p.terms.map(t=>{ const id='p'+(k++); ids.push(id); return casella(id,t.e,l,`${nomGrau(t.e)} del parèntesi ${p.nom}, amb el seu signe`); }).join('')}</span>`;
  });
  return {
    title:'Treu els parèntesis',
    sub:'Escriu cada terme amb el signe que li queda quan treus el parèntesi. Si és positiu, no cal posar-hi el +.',
    html(){ return `<span class="lbl fila-pol"><span class="ve">${exprHTML(ex)}</span><span>=</span>${parts.join('')}</span>`; },
    ids,
    previ(v){
      const pp=[]; let j=0;
      ex.parts.forEach((p,i)=>p.terms.forEach(t=>{
        if(p.op<0) pp.push({c:v[ids[j++]], e:t.e, fix:true, buitCompta:true});
        else pp.push({c:t.c, e:t.e, fix:true});
      }));
      return previHTML(pp,l);
    },
    hint(){ return `El signe <b>−</b> de davant del parèntesi canvia el signe de <b>tots</b> els termes de dins: el que era <b>+</b> passa a <b>−</b>, i el que era <b>−</b> passa a <b>+</b>. Un <b>+</b> davant del parèntesi no canvia res.`; },
    check(v){
      for(const id of ids){ if(v[id]===null) return {ok:false,msg:'Omple totes les caselles.',bad:[id]}; }
      const r=comprovaParentesis(ex, ids.map(id=>v[id]));
      return r.ok ? r : {ok:false, msg:r.msg, bad:r.bad.map(i=>ids[i])};
    },
    res(){ return `${exprHTML(ex)} <span>=</span> ${polHTML(state.f,l)}`; }
  };
}

/* ---------- pas: agrupa els termes semblants ---------- */
function stepAgrupa(desDe){
  const ex=state.ex, l=ex.l, gs=grups(state.f);
  const ids=gs.map((g,gi)=>g.cs.map((c,j)=>`g${gi}_${j}`));
  const grupHTML = (g,gi) => `<span class="grup" data-g="${gi}"><span class="grup-et">${g.e===0?'nombres':lit(g.e,l)}</span><span class="caselles">${g.cs.map((c,j)=>casella(ids[gi][j],g.e,l,`${nomGrau(g.e)} ${j+1} de ${g.cs.length}`)).join('')}</span></span>`;
  return {
    title:'Agrupa els termes semblants', skip:true,
    sub:'Busca els termes que tenen la mateixa part literal i escriu-los junts, cadascun amb el seu signe.',
    from(){ return {html:polHTML(state.f,l)}; },
    fromLabel:desDe,
    html(){ return `<span class="lbl fila-pol">${polHTML(state.f,l)} <span>=</span></span><span class="grups">${gs.map(grupHTML).join('')}</span>`; },
    ids:ids.flat(),
    previ(v){ return previHTML(gs.flatMap((g,gi)=>g.cs.map((c,j)=>({c:v[ids[gi][j]], e:g.e, fix:true, buitCompta:true}))), l); },
    hint(){ return 'Termes semblants: ' + gs.map(g=>`<b>${g.e===0?'nombres':lit(g.e,l)}</b> → ${g.cs.length} ${pl(g.cs.length,'terme','termes')}`).join(' · ') + '. El signe que hi ha davant de cada terme va amb ell.'; },
    check(v){
      for(const id of ids.flat()){ if(v[id]===null) return {ok:false,msg:'Omple totes les caselles.',bad:[id]}; }
      const r=comprovaAgrupa(state.f, ids.map(g=>g.map(id=>v[id])));
      return r.ok ? r : {ok:false, msg:r.msg, bad:r.badG.flatMap(gi=>ids[gi])};
    },
    res(){ return `${polHTML(state.f,l)} <span>=</span> ${polHTML(gs.flatMap(g=>g.cs.map(c=>({c,e:g.e}))),l)}`; },
    saltat(){ return polHTML(gs.flatMap(g=>g.cs.map(c=>({c,e:g.e}))),l); }
  };
}

/* ---------- pas: redueix i ordena ---------- */
function stepResultat(desDe){
  const ex=state.ex, l=ex.l, gs=grups(state.f);
  const maxG=Math.max(...state.f.map(t=>t.e));
  const graus=[...Array(maxG+1).keys()].reverse();
  const id = e => 'r'+e;
  const agrupat = polHTML(gs.flatMap(g=>g.cs.map(c=>({c,e:g.e}))),l);
  return {
    title:'Redueix i escriu el resultat ordenat', permetBuit:true,
    sub:'Suma els coeficients de cada grup. Deixa buida la casella d\'un grau que no hi sigui.',
    from(){ return {html:agrupat}; },
    fromLabel:desDe,
    html(){ return `<span class="lbl fila-pol">${agrupat} <span>=</span></span><span class="caselles resultat">${graus.map(e=>casella(id(e),e,l,nomGrau(e)+' del resultat')).join('')}</span>`; },
    ids:graus.map(id),
    previ(v){ return previHTML(graus.map(e=>({c:v[id(e)], e})), l); },
    hint(){
      const txt = cs => cs.map((c,i)=>i===0 ? (c<0?'−':'')+Math.abs(c) : ` ${c<0?'−':'+'} ${Math.abs(c)}`).join('');
      return 'Opera els coeficients de cada grup: ' + gs.map(g=>`<b>${g.e===0?'nombres':lit(g.e,l)}</b>: ${txt(g.cs)}`).join(' · ') + '.';
    },
    check(v){
      if(graus.every(e=>v[id(e)]===null)) return {ok:false,msg:'Escriu el resultat a les caselles.',bad:[id(graus[0])]};
      const vals={}; graus.forEach(e=>vals[e]=v[id(e)]);
      const r=comprovaResultat(state.f, graus, vals);
      return r.ok ? r : {ok:false, msg:r.msg, bad:r.bad.map(id)};
    },
    res(){ return `${agrupat} <span>=</span> <span class="final-r">${polHTML(reduce(state.f),l)}</span>`; }
  };
}

/* ---------- render ---------- */
function newExercise(){
  const ex=genera(state.nivell);
  state.ex=ex; state.f=flat(ex); state.cur=0; state.errs=0; state.hint=false; state.saltat=false;
  const resta=ex.parts.some((p,i)=>i>0 && p.op<0);
  state.steps = resta ? [stepParentesis(), stepAgrupa(null), stepResultat(null)] : [stepAgrupa(null), stepResultat(null)];
  state.steps.forEach((st,i)=>{ st.label='Pas '+(i+1); });
  const suma=ex.parts.some((p,i)=>i>0 && p.op>0);
  $('#tag').className='tipus '+(ex.tipus==='redueix'?'finit':resta&&suma?'mixt':resta?'pur':'finit');
  $('#tag').textContent = ex.tipus==='redueix' ? 'Redueix' : resta&&suma ? 'Sumes i restes' : resta ? 'Resta' : 'Suma';
  $('#enunciat').textContent = ex.tipus==='redueix' ? 'Redueix els termes semblants i ordena el resultat' : 'Calcula i ordena el resultat';
  $('#target').innerHTML = nomExpr(ex);
  $('#defs').innerHTML = ex.tipus==='redueix' ? '' : ex.parts.map(p=>`<span class="def">${p.nom}(<i>${ex.l}</i>) = ${polHTML(p.terms,ex.l)}</span>`).join('');
  $('#defs').hidden = ex.tipus==='redueix';
  $('#steps').innerHTML=''; $('#result').innerHTML='';
  next(false);
}

function valors(sec,st){ const v={}; st.ids.forEach(id=>{ v[id]=llegeix(sec.querySelector('#'+id).value); }); return v; }
function actualitzaPrevi(sec,st){ const p=sec.querySelector('.previ-m'); if(p) p.innerHTML=st.previ(valors(sec,st)); }

function addStep(i){
  const st=state.steps[i];
  const sec=document.createElement('section');
  sec.className='step'; sec.dataset.i=i;
  const from = st.from && st.fromLabel ? `<div class="partim"><span class="etq">${st.fromLabel}</span><span class="m">${st.from().html}</span></div>` : '';
  sec.innerHTML = `<div class="step-head"><span class="num">${st.label}</span><h3>${st.title}</h3></div>
    ${st.sub?`<p class="sub">${st.sub}</p>`:''}
    ${from}
    <div class="work pol-work">${st.html()}</div>
    <p class="previ"><span class="previ-et">Així queda:</span> <span class="previ-m"></span></p>
    <div class="actions"><button class="boto boto-principal check" type="button">Comprova</button><button class="boto hintbtn" type="button">Pista</button>${st.skip?'<button class="boto saltabtn" type="button">Salta aquest pas</button>':''}</div>
    <p class="fb" role="status"></p><p class="hinttext" hidden></p>`;
  $('#steps').appendChild(sec);
  actualitzaPrevi(sec,st);
  sec.querySelector('.work').addEventListener('input',e=>{ e.target.classList.remove('bad'); actualitzaPrevi(sec,st); });
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

function tancaPas(sec,html,cls){
  sec.querySelector('.actions').remove();
  sec.querySelector('.work').innerHTML = `<div class="fet">${html}</div>`;
  ['.partim','.previ'].forEach(s=>{ const x=sec.querySelector(s); if(x) x.remove(); });
  const ht=sec.querySelector('.hinttext'); if(ht) ht.hidden=true;
  const fb=sec.querySelector('.fb'); fb.className='fb'; fb.textContent='';
  sec.classList.add(cls);
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
  if(r.ok){ tancaPas(sec,st.res(),'done'); state.cur++; next(); return; }
  state.errs++;
  fb.className='fb err'; fb.textContent=r.msg;
  const bad=(r.bad||[]).map(id=>sec.querySelector('#'+id)).filter(Boolean);
  bad.forEach(b=>b.classList.add('bad'));
  if(bad[0]){ bad[0].focus(); bad[0].select(); }
}

function onSkip(i){
  if(i!==state.cur) return;
  const st=state.steps[i]; const sec=$(`.step[data-i="${i}"]`);
  tancaPas(sec, `${st.saltat()} <span class="nota-m">agrupat automàticament</span>`, 'skipped');
  sec.querySelector('.num').textContent += ' · saltat';
  state.saltat=true;
  state.cur++; next();
}

function finish(){
  const clean = state.errs===0 && !state.hint;
  stats.fets++; if(clean){ stats.primera++; stats.ratxa++; } else stats.ratxa=0;
  saveStats(); renderStats();
  const msg = clean ? (state.saltat ? 'Tot bé a la primera (amb un pas saltat).' : 'Tot bé a la primera.') : (state.errs ? `Fet! Has corregit ${state.errs} ${pl(state.errs,'error','errors')} pel camí.` : 'Fet, amb l\'ajuda d\'alguna pista.');
  $('#result').innerHTML = `<div class="result">
      <div class="final pol-final">${nomExpr(state.ex)}<span>=</span><span class="final-r">${polHTML(reduce(state.f),state.ex.l)}</span></div>
      <p class="fb ok">${msg}</p>
      <div class="actions"><button class="boto boto-principal" id="nextEx" type="button">Nou exercici</button></div>
    </div>`;
  const b=$('#nextEx'); b.onclick=()=>newExercise();
  b.focus();
}

/* Retorn: passa a la casella següent (buida, si n'hi ha) o comprova */
$('#steps').addEventListener('keydown',e=>{
  if(e.key!=='Enter' || !e.target.classList.contains('box')) return;
  e.preventDefault();
  const sec=e.target.closest('.step'); const st=state.steps[+sec.dataset.i];
  const boxes=[...sec.querySelectorAll('.box')];
  const idx=boxes.indexOf(e.target);
  const seg = st.permetBuit ? boxes[idx+1] : boxes.slice(idx+1).find(b=>!b.value.trim());
  if(seg && (st.permetBuit || e.target.value.trim())) seg.focus();
  else onCheck(+sec.dataset.i);
});

/* nivell (es recorda en aquest navegador) */
function setNivell(n){
  state.nivell=n;
  document.querySelectorAll('.nivell').forEach(b=>b.setAttribute('aria-pressed', String(b.dataset.nivell===n)));
  $('#nivellDesc').textContent = n==='facil' ? 'reduir i sumar, sense nombres negatius' : 'amb negatius i restes: el − de davant del parèntesi canvia els signes';
  try{ localStorage.setItem('srpol-nivell', n); }catch(e){}
}
document.querySelectorAll('.nivell').forEach(btn=>{ btn.onclick=()=>{ setNivell(btn.dataset.nivell); newExercise(); }; });
try{ const n=localStorage.getItem('srpol-nivell'); if(['facil','normal'].includes(n)) setNivell(n); }catch(e){}

const bm=$('#btnMetode'), pm=$('#metode');
function setMetode(open){ bm.setAttribute('aria-expanded',String(open)); pm.hidden=!open; try{ localStorage.setItem('srpol-metode', open?'1':'0'); }catch(e){} }
bm.onclick=()=>setMetode(pm.hidden);
try{ if(localStorage.getItem('srpol-metode')==='1') setMetode(true); }catch(e){}

renderStats();
newExercise();
})();
