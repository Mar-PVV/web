/* Aplicatiu «Identitats notables» (3r d'ESO · tema 2, Polinomis) · el munta identitats-notables.html
   Dos modes:
   · Desenvolupa: (a + b)², (a − b)², (a + b)(a − b). Pas 1: quina identitat és (i, al Normal,
     qui són a i b). Pas 2: el resultat, terme a terme (coeficient amb signe i exponent).
   · Reconeix (camí invers): x² + 6x + 9 → (x + 3)². Pas 1: quina identitat és (o cap).
     Pas 2: escriure-la com a producte.
   a = k·x^p i b és un nombre positiu. Fàcil: a = x. Normal: k fins a 5 i p fins a 2.
   El motor (generadors i comprovacions) també s'exporta per a la prova de proves/. */
(function(){
"use strict";
const rand = (a,b) => a + Math.floor(Math.random()*(b-a+1));
const pick = arr => arr[Math.floor(Math.random()*arr.length)];
const LLETRES=['x','x','x','m','y','p','q','n','z'];   // sense a ni b, que són els noms de la fórmula
const TIPUS = {suma:'Quadrat d\'una suma', dif:'Quadrat d\'una diferència', sxd:'Suma per diferència', no:'No és cap identitat notable'};

/* Termes del desenvolupament: [{c,e}] ordenats */
function desenvolupa(ex){
  const {k,p,b}=ex;
  if(ex.tipus==='suma') return [{c:k*k,e:2*p},{c:2*k*b,e:p},{c:b*b,e:0}];
  if(ex.tipus==='dif')  return [{c:k*k,e:2*p},{c:-2*k*b,e:p},{c:b*b,e:0}];
  if(ex.tipus==='sxd')  return [{c:k*k,e:2*p},{c:-b*b,e:0}];
  return ex.fals;                                  // 'no': l'expressió inventada
}
function genera(nivell, mode){
  const normal = nivell!=='facil';
  const k = normal && Math.random()<0.6 ? rand(2,5) : 1;
  const p = normal && Math.random()<0.25 ? 2 : 1;
  const b = normal ? rand(1,9) : rand(1,9);
  const l = pick(LLETRES);
  let tipus = pick(['suma','dif','sxd']);
  const ex = {mode, tipus, k, p, b, l, primerSuma: Math.random()<0.5};
  if(mode==='rec' && normal && Math.random()<0.2){
    ex.tipus='no';
    const fals = Math.random()<0.5
      ? [{c:k*k,e:2*p},{c:b*b,e:0}]                                     // suma de quadrats: c² + 25
      : [{c:k*k,e:2*p},{c:pick([k*b, 3*k*b, k*b+1]),e:p},{c:b*b,e:0}];  // el terme del mig no és el doble producte
    if(fals.length===3 && Math.abs(fals[1].c)===2*k*b) fals[1].c+=1;
    ex.fals=fals;
  }
  return ex;
}

function llegeix(raw){
  const s=String(raw).trim().replace(/[−–]/g,'-').replace(/\s+/g,'');
  if(s==='') return null;
  if(s==='-') return -1;
  if(s==='+') return 1;
  return /^[+-]?\d+$/.test(s) ? parseInt(s,10) : NaN;
}

/* ---------- comprovacions (sense DOM) ---------- */
function comprovaTipus(ex,t){
  if(t===ex.tipus) return {ok:true};
  if(ex.tipus==='no') return {ok:false, msg: ex.fals.length===2 ? 'Una suma de quadrats no és cap identitat notable: la suma per diferència dona una resta de quadrats.' : 'Mira el terme del mig: ha de ser el doble del primer pel segon (2ab). Aquí no ho és.'};
  if(t==='no') return {ok:false, msg:'Sí que és una identitat notable: busca a² i b² i mira el terme del mig.'};
  if(ex.mode==='des') return {ok:false, msg: ex.tipus==='sxd' ? 'Fixa\'t que els dos parèntesis tenen els mateixos termes, un sumant i l\'altre restant.' : 'Fixa\'t en el signe de dins del parèntesi.'};
  if(ex.tipus==='sxd') return {ok:false, msg:'Només hi ha dos termes i es resten: és una diferència de quadrats.'};
  return {ok:false, msg:'Fixa\'t en el signe del terme del mig.'};
}
/* a i b: va = {c, e}, vb = nombre */
function comprovaAB(ex,va,vb){
  const bad=[];
  if(va.c!==ex.k) bad.push('ac'); if((va.e??0)!==ex.p) bad.push('ae'); if(vb!==ex.b) bad.push('b');
  if(!bad.length) return {ok:true};
  if(bad.includes('b') && vb===-ex.b) return {ok:false, bad, msg:'Escriu b sense signe: el signe ja el diu la identitat.'};
  return {ok:false, bad, msg:'a és el primer terme del parèntesi i b el segon (sense el signe).'};
}
/* Desenvolupament: vals = [{c, e}] per a cada terme, en ordre */
function comprovaDes(ex,vals){
  const bo=desenvolupa(ex);
  const bad=[]; let msg=null;
  bo.forEach((t,i)=>{
    const v=vals[i], e=v.e===null||v.e===undefined ? 0 : v.e;
    const bc = v.c!==t.c, be = e!==t.e;
    if(bc||be) bad.push({i,c:bc,e:be});
  });
  if(!bad.length) return {ok:true};
  const {k,b}=ex;
  const mig = bo.length===3 ? 1 : -1;
  if(mig>=0 && vals[mig].c===null) msg='No t\'oblidis del terme del mig, el doble producte 2ab: (a + b)² no és a² + b².';
  else if(vals.some(v=>v.c===null)) msg='Omple el coeficient de tots els termes.';
  else if(k>1 && vals[0].c===k) msg='Eleva al quadrat tot el terme, coeficient inclòs: (2a)² = 4a².';
  else if(bad.some(x=>x.e)) msg='Revisa els exponents: (xᵖ)² = x²ᵖ i el doble producte té l\'exponent de a.';
  else if(ex.tipus!=='sxd' && vals[2].c===-b*b) msg='L\'últim terme, b², sempre és positiu.';
  else if(mig>=0 && vals[1].c===-bo[1].c) msg = ex.tipus==='dif' ? 'Al quadrat d\'una diferència, el doble producte va restant.' : 'Al quadrat d\'una suma, el doble producte va sumant.';
  else if(mig>=0 && Math.abs(vals[1].c)===k*b) msg='El terme del mig és el doble del primer pel segon: 2 · a · b.';
  else if(ex.tipus==='sxd' && vals[1].c===b*b) msg='És una diferència de quadrats: el b² va restant.';
  else msg='Revisa els termes marcats.';
  return {ok:false, bad, msg};
}
/* Reconeix: va = {c,e} (a), vb = nombre amb signe per als quadrats, o positiu per a la suma per diferència */
function comprovaRec(ex,va,vb){
  const bad=[];
  if(va.c!==ex.k) bad.push('ac'); if((va.e??0)!==ex.p) bad.push('ae');
  const bBo = ex.tipus==='dif' ? -ex.b : ex.b;
  if(vb!==bBo) bad.push('b');
  if(!bad.length) return {ok:true};
  if(bad.length===1 && bad[0]==='b' && vb===-bBo) return {ok:false, bad, msg: ex.tipus==='sxd' ? 'Escriu b sense signe: els signes + i − ja hi són.' : 'Revisa el signe de b: el dona el signe del terme del mig.'};
  if(bad.includes('ac') && va.c===ex.k*ex.k) return {ok:false, bad, msg:'a és l\'arrel del primer terme: si el primer és 4x², a = 2x.'};
  if(bad.includes('b') && Math.abs(vb)===ex.b*ex.b) return {ok:false, bad, msg:'b és l\'arrel de l\'últim terme: si és 25, b = 5.'};
  return {ok:false, bad, msg:'a és l\'arrel del primer terme i b l\'arrel de l\'últim.'};
}

const MOTOR = {genera, desenvolupa, llegeix, comprovaTipus, comprovaAB, comprovaDes, comprovaRec, TIPUS};
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
  return '<span class="pol">'+terms.map((t,i)=>`<span class="t">${i===0 ? (t.c<0?'−':'') : `<span class="sg">${t.c<0?'−':'+'}</span>`}${mono(t.c,t.e,l)}</span>`).join('')+'</span>';
}
const par = h => `<span class="pr">(</span>${h}<span class="pr">)</span>`;
const aHTML = ex => mono(ex.k,ex.p,ex.l);
function factoritzat(ex){
  const a=aHTML(ex), b=ex.b;
  if(ex.tipus==='suma') return `<span class="pol">${par(`${a}<span class="sg">+</span>${b}`)}<sup>2</sup></span>`;
  if(ex.tipus==='dif') return `<span class="pol">${par(`${a}<span class="sg">−</span>${b}`)}<sup>2</sup></span>`;
  const s=par(`${a}<span class="sg">+</span>${b}`), d=par(`${a}<span class="sg">−</span>${b}`);
  return `<span class="pol">${ex.primerSuma ? s+d : d+s}</span>`;
}
const casellaCoef = (id,label) => `<input id="${id}" class="box cf" inputmode="text" autocomplete="off" spellcheck="false" aria-label="${label}">`;
const casellaExp = (id,label) => `<input id="${id}" class="box ex" inputmode="numeric" autocomplete="off" spellcheck="false" aria-label="${label}">`;
const ambExp = (idc,ide,l,label) => `<span class="cterme">${casellaCoef(idc,'coeficient de '+label)}<span class="lit"><i>${l}</i><sup class="supbox">${casellaExp(ide,'exponent de '+label)}</sup></span></span>`;

/* ---------- estat ---------- */
const state = {nivell:'facil', mode:'des', ex:null, steps:[], cur:0, errs:0, hint:false, tria:null};
let stats = {fets:0, primera:0, ratxa:0};
try{ const raw=localStorage.getItem('idn-stats'); if(raw) stats=Object.assign(stats,JSON.parse(raw)); }catch(e){}
function saveStats(){ try{ localStorage.setItem('idn-stats',JSON.stringify(stats)); }catch(e){} }
function renderStats(){
  $('#stats').innerHTML = `<span class="xip">Fets <strong>${stats.fets}</strong></span><span class="xip${stats.primera?' verd':''}">Bé a la primera <strong>${stats.primera}</strong></span><span class="xip${stats.ratxa>=3?' verd':''}">Ratxa <strong>${stats.ratxa}</strong></span><button class="enllac" id="reset" type="button">Posa a zero</button>`;
  $('#reset').onclick = () => { stats={fets:0,primera:0,ratxa:0}; saveStats(); renderStats(); };
}

/* ---------- pas: quina identitat és ---------- */
function stepTipus(){
  const ex=state.ex, normal=state.nivell!=='facil';
  const opcions = ex.mode==='rec' && normal ? ['suma','dif','sxd','no'] : ['suma','dif','sxd'];
  const demanaAB = ex.mode==='des' && normal;
  return {
    title: demanaAB ? 'Quina identitat és? Qui són a i b?' : 'Quina identitat notable és?',
    sub: ex.mode==='des' ? (demanaAB ? 'Tria la identitat i escriu a i b (b sense signe).' : `Aquí a = ${aHTML(ex)} i b = ${ex.b}.`) : 'Mira quants termes hi ha i el signe del terme del mig.',
    html(){
      return `<div class="tria" role="group" aria-label="Quina identitat és">${opcions.map(t=>`<button type="button" class="tria-op" data-t="${t}" aria-pressed="false">${TIPUS[t]}</button>`).join('')}</div>`
        + (demanaAB ? `<span class="lbl fila-pol">a = ${ambExp('ac','ae',ex.l,'a')} <span class="tail">i</span> b = <input id="b" class="box cf" inputmode="numeric" autocomplete="off" aria-label="b"></span>` : '');
    },
    ids: demanaAB ? ['ac','ae','b'] : [],
    hint(){
      if(ex.mode==='des') return '(a + b)² → quadrat d\'una suma · (a − b)² → quadrat d\'una diferència · (a + b)(a − b) → suma per diferència.' + (demanaAB?' a és el primer terme del parèntesi i b el segon.':'');
      return 'Tres termes amb dos quadrats i el doble producte → quadrat d\'una suma (si el del mig suma) o d\'una diferència (si resta). Dos quadrats que es resten → suma per diferència.';
    },
    check(v){
      if(!state.tria) return {ok:false,msg:'Tria una de les opcions.'};
      const r=comprovaTipus(ex,state.tria);
      if(!r.ok) return {...r, triaMal:true};
      if(demanaAB){
        if(v.ac===null || v.b===null) return {ok:false,msg:'Escriu a i b.',bad:['ac','b'].filter(id=>v[id]===null)};
        return comprovaAB(ex,{c:v.ac,e:v.ae},v.b);
      }
      return {ok:true};
    },
    res(){ return `<span>${TIPUS[ex.tipus]}${ex.mode==='des' ? ` · a = ${aHTML(ex)}, b = ${ex.b}` : ''}</span>`; }
  };
}
/* ---------- pas: desenvolupa ---------- */
function stepDes(){
  const ex=state.ex, l=ex.l, bo=desenvolupa(ex);
  const etiq = ex.tipus==='sxd' ? ['a²','−b²'] : ['a²', ex.tipus==='dif'?'−2ab':'+2ab', 'b²'];
  const ids = bo.map((t,i)=>({c:'d'+i, e: t.e===0 ? null : 'x'+i}));
  const cas = (t,i) => `<span class="amb-et">${ids[i].e ? ambExp(ids[i].c,ids[i].e,l,etiq[i]) : casellaCoef(ids[i].c,etiq[i])}<small>${etiq[i]}</small></span>`;
  const formula = ex.tipus==='suma' ? '(a + b)² = a² + 2ab + b²' : ex.tipus==='dif' ? '(a − b)² = a² − 2ab + b²' : '(a + b)(a − b) = a² − b²';
  return {
    title:'Desenvolupa', previ:true,
    sub:`${formula}. Escriu cada terme amb el seu signe (si és positiu, no cal el +).`,
    html(){ return `<span class="lbl fila-pol">${factoritzat(ex)} <span>=</span></span><span class="caselles">${bo.map(cas).join('')}</span>`; },
    ids: ids.flatMap(x=>x.e?[x.c,x.e]:[x.c]),
    previv(v){ return ids.map((x,i)=>({c:v[x.c], e: x.e ? v[x.e] : 0})); },
    hint(){
      const a=aHTML(ex);
      const parts=[`a² = (${a})²`];
      if(ex.tipus!=='sxd') parts.push(`2ab = 2 · ${a} · ${ex.b}`);
      parts.push(`b² = ${ex.b}²`);
      return parts.join(' · ') + '.';
    },
    check(v){
      const r=comprovaDes(ex, ids.map(x=>({c:v[x.c], e: x.e ? v[x.e] : 0})));
      return r.ok ? r : {ok:false, msg:r.msg, bad:r.bad.flatMap(b=>[...(b.c?[ids[b.i].c]:[]), ...(b.e&&ids[b.i].e?[ids[b.i].e]:[])])};
    },
    res(){ return `${factoritzat(ex)} <span>=</span> <span class="final-r">${polHTML(bo,l)}</span>`; }
  };
}
/* ---------- pas: escriu-la com a producte ---------- */
function stepRec(){
  const ex=state.ex, l=ex.l, expr=desenvolupa(ex);
  const A = ambExp('ac','ae',l,'a');
  const B = id => `<input id="${id}" class="box cf" inputmode="text" autocomplete="off" spellcheck="false" aria-label="b">`;
  return {
    title:'Escriu-la com a producte', previ:true,
    sub: ex.tipus==='sxd' ? 'a és l\'arrel del primer terme i b l\'arrel del segon.' : 'a és l\'arrel del primer terme i b l\'arrel de l\'últim. El signe de b el dona el terme del mig.',
    html(){
      const dins = ex.tipus==='sxd'
        ? `<span class="pr">(</span>${A}<span class="sg">+</span>${B('b')}<span class="pr">)</span><span class="pr">(</span><span class="copia" data-de="a"></span><span class="sg">−</span><span class="copia" data-de="b"></span><span class="pr">)</span>`
        : `<span class="pr">(</span>${A}${B('b')}<span class="pr">)</span><sup>2</sup>`;
      return `<span class="lbl fila-pol">${polHTML(expr,l)} <span>=</span> <span class="caselles">${dins}</span></span>`;
    },
    ids:['ac','ae','b'],
    hint(){
      const pr=expr[0], ul=expr[expr.length-1];
      return `${mono(pr.c,pr.e,l)} = (${aHTML(ex)})² i ${Math.abs(ul.c)} = ${ex.b}².` + (ex.tipus==='sxd' ? '' : ` Comprova el terme del mig: 2 · ${aHTML(ex)} · ${ex.b} = ${mono(2*ex.k*ex.b,ex.p,l)}.`);
    },
    check(v){
      if(v.ac===null || v.b===null) return {ok:false,msg:'Escriu a i b.',bad:['ac','b'].filter(id=>v[id]===null)};
      return comprovaRec(ex,{c:v.ac,e:v.ae},v.b);
    },
    res(){ return `${polHTML(expr,l)} <span>=</span> <span class="final-r">${factoritzat(ex)}</span>`; }
  };
}

/* ---------- vista prèvia ---------- */
function previHTML(sec,st){
  const ex=state.ex, l=ex.l;
  const v={}; st.ids.forEach(id=>{ v[id]=llegeix(sec.querySelector('#'+id).value); });
  const num = x => x===null ? '<span class="forat">□</span>' : Number.isNaN(x) ? '?' : x;
  if(st.previv){
    const ps=st.previv(v); let primer=true;
    return '<span class="pol">'+ps.map(p=>{
      let s;
      if(p.c===null || Number.isNaN(p.c)) s=(primer?'':'<span class="sg">+</span>')+'<span class="forat">□</span>'+(p.e?lit(p.e,l):'');
      else s=(primer ? (p.c<0?'−':'') : `<span class="sg">${p.c<0?'−':'+'}</span>`)+mono(p.c, p.e===null||Number.isNaN(p.e)?0:p.e, l);
      primer=false; return `<span class="t">${s}</span>`;
    }).join('')+'</span>';
  }
  const a = v.ac===null||Number.isNaN(v.ac) ? '<span class="forat">□</span>'+lit(v.ae||1,l) : mono(v.ac, v.ae===null||Number.isNaN(v.ae)?0:v.ae, l);
  if(ex.tipus==='sxd'){ const b=num(v.b===null?null:Math.abs(v.b)); return `<span class="pol">${par(`${a}<span class="sg">+</span>${b}`)}${par(`${a}<span class="sg">−</span>${b}`)}</span>`; }
  const b = v.b===null ? '<span class="sg">+</span><span class="forat">□</span>' : Number.isNaN(v.b) ? '?' : `<span class="sg">${v.b<0?'−':'+'}</span>${Math.abs(v.b)}`;
  return `<span class="pol">${par(a+b)}<sup>2</sup></span>`;
}

/* ---------- render ---------- */
function newExercise(){
  const ex=genera(state.nivell, state.mode);
  state.ex=ex; state.cur=0; state.errs=0; state.hint=false; state.tria=null;
  state.steps = ex.mode==='des' ? [stepTipus(), stepDes()] : (ex.tipus==='no' ? [stepTipus()] : [stepTipus(), stepRec()]);
  state.steps.forEach((st,i)=>{ st.label='Pas '+(i+1); });
  $('#enunciat').textContent = ex.mode==='des' ? 'Desenvolupa la identitat notable' : 'Escriu-ho com a identitat notable, si es pot';
  $('#target').innerHTML = ex.mode==='des' ? factoritzat(ex) : polHTML(desenvolupa(ex),ex.l);
  $('#steps').innerHTML=''; $('#result').innerHTML='';
  next(false);
}
function addStep(i){
  const st=state.steps[i];
  const sec=document.createElement('section');
  sec.className='step'; sec.dataset.i=i;
  sec.innerHTML = `<div class="step-head"><span class="num">${st.label}</span><h3>${st.title}</h3></div>
    ${st.sub?`<p class="sub">${st.sub}</p>`:''}
    <div class="work pol-work">${st.html()}</div>
    ${st.previ?'<p class="previ"><span class="previ-et">Així queda:</span> <span class="previ-m"></span></p>':''}
    <div class="actions"><button class="boto boto-principal check" type="button">Comprova</button><button class="boto hintbtn" type="button">Pista</button></div>
    <p class="fb" role="status"></p><p class="hinttext" hidden></p>`;
  $('#steps').appendChild(sec);
  const upd=()=>{
    const p=sec.querySelector('.previ-m'); if(p) p.innerHTML=previHTML(sec,st);
    /* suma per diferència: el segon parèntesi repeteix a i b */
    sec.querySelectorAll('.copia').forEach(c=>{
      const l=state.ex.l;
      if(c.dataset.de==='a'){ const ac=llegeix(sec.querySelector('#ac').value), ae=llegeix(sec.querySelector('#ae').value);
        c.innerHTML = ac===null||Number.isNaN(ac) ? '<span class="forat">□</span>' : mono(ac, ae===null||Number.isNaN(ae)?0:ae, l); }
      else { const b=llegeix(sec.querySelector('#b').value); c.innerHTML = b===null||Number.isNaN(b) ? '<span class="forat">□</span>' : Math.abs(b); }
    });
  };
  upd();
  sec.querySelector('.work').addEventListener('input',e=>{ e.target.classList.remove('bad'); upd(); });
  sec.querySelectorAll('.tria-op').forEach(b=>b.onclick=()=>{
    if(i!==state.cur) return;
    state.tria=b.dataset.t;
    sec.querySelectorAll('.tria-op').forEach(x=>{ x.setAttribute('aria-pressed',String(x===b)); x.classList.remove('bad'); });
    const f=sec.querySelector('.box'); if(f) f.focus(); else onCheck(i);
  });
  sec.querySelector('.check').onclick=()=>onCheck(i);
  sec.querySelector('.hintbtn').onclick=()=>{ const h=sec.querySelector('.hinttext'); h.innerHTML='<b>Pista:</b> '+st.hint(); h.hidden=false; state.hint=true; };
  return sec;
}
function next(focus){
  if(state.cur<state.steps.length){
    const sec=addStep(state.cur);
    if(focus!==false){ const f=sec.querySelector('.box, .tria-op'); if(f) f.focus({preventScroll:false}); }
    return;
  }
  finish();
}
function onCheck(i){
  if(i!==state.cur) return;
  const st=state.steps[i]; const sec=$(`.step[data-i="${i}"]`); const fb=sec.querySelector('.fb');
  sec.querySelectorAll('.box').forEach(b=>b.classList.remove('bad'));
  const v={}; st.ids.forEach(id=>{ v[id]=llegeix(sec.querySelector('#'+id).value); });
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
  if(r.triaMal){ const t=sec.querySelector(`.tria-op[data-t="${state.tria}"]`); if(t){ t.classList.add('bad'); t.focus(); } return; }
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
  const final = ex.tipus==='no'
    ? `${polHTML(desenvolupa(ex),l)} <span class="nota-m">no és cap identitat notable</span>`
    : ex.mode==='des' ? `${factoritzat(ex)}<span>=</span><span class="final-r">${polHTML(desenvolupa(ex),l)}</span>` : `${polHTML(desenvolupa(ex),l)}<span>=</span><span class="final-r">${factoritzat(ex)}</span>`;
  $('#result').innerHTML = `<div class="result">
      <div class="final pol-final">${final}</div>
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
  $('#nivellDesc').textContent = n==='facil' ? 'a és la lletra sola: (x + 3)²' : 'a pot portar coeficient o ser x²: (2a − 5)²' ;
  try{ localStorage.setItem('idn-nivell', n); }catch(e){}
}
function setMode(m){
  state.mode=m;
  document.querySelectorAll('.mode').forEach(b=>b.setAttribute('aria-pressed', String(b.dataset.mode===m)));
  try{ localStorage.setItem('idn-mode', m); }catch(e){}
}
document.querySelectorAll('.nivell').forEach(btn=>{ btn.onclick=()=>{ setNivell(btn.dataset.nivell); newExercise(); }; });
document.querySelectorAll('.mode').forEach(btn=>{ btn.onclick=()=>{ setMode(btn.dataset.mode); newExercise(); }; });
try{ const n=localStorage.getItem('idn-nivell'); if(['facil','normal'].includes(n)) setNivell(n); }catch(e){}
try{ const m=localStorage.getItem('idn-mode'); if(['des','rec'].includes(m)) setMode(m); }catch(e){}
const bm=$('#btnMetode'), pm=$('#metode');
function setMetode(open){ bm.setAttribute('aria-expanded',String(open)); pm.hidden=!open; try{ localStorage.setItem('idn-metode', open?'1':'0'); }catch(e){} }
bm.onclick=()=>setMetode(pm.hidden);
try{ if(localStorage.getItem('idn-metode')==='1') setMetode(true); }catch(e){}
renderStats();
newExercise();
})();
