/* Aplicatiu «Repàs del tema 1 · Nombres racionals» (3r d'ESO) · el munta repas-racionals.html
   Tres nivells (AS, AN, AE), mode per apartats o simulacre. Els exercicis surten de
   plantilles amb nombres a l'atzar; tota l'aritmètica és exacta (fraccions d'enters).
   La part de dalt (motor i plantilles) no toca el DOM: la prova automàtica
   (proves/prova-repas-racionals.js) la carrega amb Node. */
(function(){
"use strict";

/* ═══════════════════ Aritmètica exacta ═══════════════════ */
function gcd(a,b){ a=Math.abs(a); b=Math.abs(b); while(b){ [a,b]=[b,a%b]; } return a; }
const lcm = (a,b) => a/gcd(a,b)*b;
class Fr{
  constructor(n,d){
    if(d===undefined) d=1;
    if(!Number.isSafeInteger(n) || !Number.isSafeInteger(d)) throw new Error('nombre no exacte: '+n+'/'+d);
    if(d===0) throw new Error('denominador 0');
    if(d<0){ n=-n; d=-d; }
    const g=gcd(n,d)||1;
    this.n=(n/g)||0; this.d=d/g;
  }
  add(o){ o=F(o); return new Fr(this.n*o.d+o.n*this.d, this.d*o.d); }
  sub(o){ o=F(o); return new Fr(this.n*o.d-o.n*this.d, this.d*o.d); }
  mul(o){ o=F(o); return new Fr(this.n*o.n, this.d*o.d); }
  div(o){ o=F(o); if(o.n===0) throw new Error('divisió per 0'); return new Fr(this.n*o.d, this.d*o.n); }
  pow(k){ let r=new Fr(1); for(let i=0;i<k;i++) r=r.mul(this); return r; }
  neg(){ return new Fr(-this.n,this.d); }
  inv(){ return new Fr(this.d,this.n); }
  abs(){ return new Fr(Math.abs(this.n),this.d); }
  eq(o){ o=F(o); return this.n===o.n && this.d===o.d; }
  cmp(o){ o=F(o); return Math.sign(this.n*o.d-o.n*this.d); }
  isInt(){ return this.d===1; }
  sign(){ return Math.sign(this.n); }
}
const F = (n,d) => n instanceof Fr ? n : new Fr(n,d);

/* ═══════════════════ Atzar ═══════════════════ */
const rand = (a,b) => a + Math.floor(Math.random()*(b-a+1));
const pick = arr => arr[Math.floor(Math.random()*arr.length)];
const coin = (p=0.5) => Math.random()<p;
function shuffle(a){ a=a.slice(); for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
function numIrr(d,max,min=1){ let n, k=0; do{ n=rand(min,max); if(++k>500) throw new Error('numIrr'); }while(gcd(n,d)!==1); return n; }
/* fracció irreductible no entera amb denominador de la llista */
function frIrr(dens, maxFactor=1){ const d=pick(dens); return F(numIrr(d, Math.max(1, Math.round(d*maxFactor)-1) || 1), d); }
function retry(fn, n=4000){ for(let i=0;i<n;i++){ let r=null; try{ r=fn(); }catch(e){ if(!/divisió per 0|denominador 0/.test(e.message)) throw e; } if(r) return r; } throw new Error('no he trobat cap exercici vàlid'); }
const amable = (f, maxN=99, maxD=60) => Math.abs(f.n)<=maxN && f.d<=maxD;

/* ═══════════════════ Escriptura (HTML) ═══════════════════ */
const MENYS='−';
function fmtInt(n){
  const s=String(Math.abs(n));
  const t = Math.abs(n)>=10000 ? s.replace(/\B(?=(\d{3})+(?!\d))/g,'.') : s;
  return (n<0?MENYS:'')+t;
}
const par = h => `<span class="par">(</span>${h}<span class="par">)</span>`;
const cla = h => `<span class="par">[</span>${h}<span class="par">]</span>`;
const fmtX = x => typeof x==='number' ? fmtInt(x) : x;
const fracRaw = (n,d) => `<span class="frac"><span>${fmtX(n)}</span><span>${fmtX(d)}</span></span>`;
/* fracció (o enter) amb el signe davant */
function fr(f){ f=F(f); if(f.d===1) return fmtInt(f.n); return (f.n<0?MENYS:'')+fracRaw(Math.abs(f.n),f.d); }
/* entre parèntesis si és negatiu */
const frp = f => F(f).n<0 ? par(fr(f)) : fr(f);
const m = h => `<span class="mt">${h}</span>`;
const abs = h => `<span class="vabs">${h}</span>`;
const sup = (h,n) => `${h}<sup>${n}</sup>`;
/* decimal exacte amb coma */
function decStr(f){
  f=F(f); let d=f.d, k=0; while(d%2===0){ d/=2; k++; } let k5=0; while(d%5===0){ d/=5; k5++; }
  if(d!==1) throw new Error('no és decimal exacte');
  const e=Math.max(k,k5), p=10**e, N=f.n*(p/f.d);
  const s=String(Math.abs(N)).padStart(e+1,'0');
  const ent=s.slice(0,s.length-e), dec=s.slice(s.length-e);
  return (N<0?MENYS:'')+fmtInt(Number(ent))+(e?','+dec:'');
}
/* desenvolupament decimal: part entera, avantperíode, període */
function expand(f){
  f=F(f); const neg=f.n<0; let n=Math.abs(f.n); const d=f.d;
  const ent=Math.floor(n/d); let r=n%d; const seen=new Map(); let digs='';
  while(r!==0 && !seen.has(r)){ seen.set(r,digs.length); r*=10; digs+=Math.floor(r/d); r%=d; }
  if(r===0) return {neg, ent, ante:digs, per:''};
  const i=seen.get(r); return {neg, ent, ante:digs.slice(0,i), per:digs.slice(i)};
}
const perH = (neg,ent,ante,per) => `${neg?MENYS:''}${fmtInt(ent)}${(ante||per)?',':''}${ante}${per?`<span class="ov">${per}</span>`:''}`;
const decH = f => { const e=expand(f); return perH(e.neg,e.ent,e.ante,e.per); };
const perTxt = (neg,ent,ante,per) => `${neg?'-':''}${ent}${(ante||per)?',':''}${ante}${per?'('+per+')':''}`;
function valPer(ent,ante,per){ const a=ante.length, p=per.length; if(!p) return F(Number(String(ent)+ante), 10**a);
  return F(Number(String(ent)+ante+per)-Number(String(ent)+ante), (10**p-1)*10**a); }
function tipusDec(f){ const e=expand(f); return e.ante===''&&e.per==='' ? 'enter' : e.per==='' ? 'finit' : e.ante==='' ? 'pur' : 'mixt'; }
const TIPUS_NOM={enter:'Enter', finit:'Decimal finit', pur:'Periòdic pur', mixt:'Periòdic mixt'};
function rootH(idx, rad){ return `<span class="rad">${idx>2?`<sup class="idx">${idx}</sup>`:''}<span class="rs">√</span><span class="ri">${rad}</span></span>`; }
function factH(n){
  n=Math.abs(n); if(n===1) return '1';
  const parts=[]; let x=n;
  for(let p=2;p*p<=x;p++){ let e=0; while(x%p===0){ x/=p; e++; } if(e) parts.push(e>1?`${p}<sup>${e}</sup>`:`${p}`); }
  if(x>1) parts.push(String(x));
  return parts.join('·');
}
const eur = f => decStr(f).replace(/^(−?\d+(?:\.\d{3})*),(\d)$/,'$1,$20')+' €';

/* ═══════════════════ Expressions (jerarquia) ═══════════════════ */
/* nodes: {t:'L',v} fulla · {t:'B',op,a,b} op ∈ + − · : · {t:'P',a,k:'()'|'[]'} · {t:'W',a,n} potència · {t:'N',a} menys davant */
const L = v => ({t:'L', v:F(v)});
const B = (op,a,b) => ({t:'B', op, a:nd(a), b:nd(b)});
const P = (a,k='()') => ({t:'P', a:nd(a), k});
const W = (a,n) => ({t:'W', a:nd(a), n});
const N = a => ({t:'N', a:nd(a)});
const nd = x => (x && x.t) ? x : L(x);
function ev(e){
  switch(e.t){
    case 'L': return e.v;
    case 'P': return ev(e.a);
    case 'W': return ev(e.a).pow(e.n);
    case 'N': return ev(e.a).neg();
    case 'B': { const a=ev(e.a), b=ev(e.b);
      return e.op==='+'?a.add(b): e.op==='−'?a.sub(b): e.op==='·'?a.mul(b): a.div(b); }
  }
}
/* wrap: el nombre negatiu va entre parèntesis (està darrere d'un signe d'operació) */
function eh(e, wrap){
  switch(e.t){
    case 'L': return wrap && e.v.n<0 ? frp(e.v) : fr(e.v);
    case 'P': return (e.k==='[]'?cla:par)(eh(e.a,false));
    case 'W': { const v=e.a.t==='L'?e.a.v:null;
      const base = v ? ((v.n<0||v.d!==1) ? par(fr(v)) : fr(v)) : eh(e.a,false);
      return `<span class="pot">${base}<sup>${e.n}</sup></span>`; }
    case 'N': { const h=MENYS+eh(e.a,false); return wrap?par(h):h; }
    case 'B': return `${eh(e.a,wrap)}<span class="opr">${e.op}</span>${eh(e.b,true)}`;
  }
}
/* text pla per a la prova automàtica: fraccions com a {n/d} */
function et(e){
  switch(e.t){
    case 'L': return `{${e.v.n}/${e.v.d}}`;
    case 'P': return e.k==='[]' ? `[${et(e.a)}]` : `(${et(e.a)})`;
    case 'W': return `${e.a.t==='L'?et(e.a):'('+et(e.a)+')'}^${e.n}`;
    case 'N': return `-${et(e.a)}`;
    case 'B': return `${et(e.a)}${e.op==='·'?'*':e.op==='−'?'-':e.op}${et(e.b)}`;
  }
}
/* un pas de pissarra: es fan alhora totes les operacions que ja tenen nombres a banda i banda */
function pas(e){
  if(e.t==='L') return e;
  const fulla = x => x.t==='L';
  if(e.t==='P'){ const a=pas(e.a); return fulla(a) ? a : {t:'P',a,k:e.k}; }
  if(e.t==='W' && fulla(e.a)) return L(ev(e));
  if(e.t==='N' && fulla(e.a)) return L(ev(e));
  if(e.t==='B' && fulla(e.a) && fulla(e.b)) return L(ev(e));
  if(e.t==='W') return {t:'W', a:pas(e.a), n:e.n};
  if(e.t==='N') return {t:'N', a:pas(e.a)};
  return {t:'B', op:e.op, a:pas(e.a), b:pas(e.b)};
}
function passos(e){ const out=[]; let x=e, k=0; while(x.t!=='L'){ x=pas(x); out.push(x); if(++k>20) break; } return out; }
/* tots els valors intermedis (per controlar que els nombres siguin amables) */
function intermedis(e){ const vs=[]; (function rec(x){ vs.push(ev(x)); if(x.a) rec(x.a); if(x.b) rec(x.b); })(e); return vs; }
const exprAmable = (e, maxN=200, maxD=144) => intermedis(e).every(v=>Math.abs(v.n)<=maxN && v.d<=maxD);
function resolExpr(e){ return passos(e).map(x => `= ${eh(x,false)}`); }

/* ═══════════════════ Preguntes ═══════════════════ */
/* camps de resposta oberta */
const cFrac  = (v, o={}) => Object.assign({tipus:'frac', v:F(v), simp:true}, o);
const cEnter = (v, o={}) => Object.assign({tipus:'enter', v:F(v)}, o);
const cDec   = (v, o={}) => Object.assign({tipus:'dec', v:F(v)}, o);
const cDig   = (s, o={}) => Object.assign({tipus:'dig', s:String(s)}, o);
/* arrel: v (valor positiu o amb signe), pm (±), no (no existeix); forma 'enter' o 'frac' */
const cArrel = (r, o={}) => Object.assign({tipus:'arrel', v:r.v?F(r.v):null, pm:!!r.pm, no:!!r.no, forma:'enter', permetNo:true, simp:true}, o);

/* opció múltiple: la primera és la correcta; es barregen i es treuen repetides */
function mc(correcta, altres, ordre){
  const ops=[correcta]; for(const a of altres) if(!ops.includes(a)) ops.push(a);
  const o = ordre ? ops.slice() : shuffle(ops);
  if(ordre) o.sort((x,y)=>ordre.indexOf(x)-ordre.indexOf(y));
  return {opcions:o, ok:o.indexOf(correcta)};
}

/* ═══════════════════ Plantilles ═══════════════════ */
const T = [];
function plantilla(ap, niv, id, nom, gen){ T.push({ap, niv, id, nom, gen}); }
const DEN_AS=[2,3,4,5,6,8,9,10,12];
const DEN_AN=[2,3,4,5,6,7,8,9,10,12,14,15,16,18,20];
const DEN_AE=[2,3,4,5,6,7,8,9,10,12,14,15,16,18,20,24,25,30];

/* ─────────── 1. Definició i conjunts ─────────── */
const CONJ=['ℕ','ℤ','ℚ'];
function conjunt(f){ f=F(f); return f.d!==1 ? 2 : f.n>=0 ? 0 : 1; }
const CONJ_EXPL = ['és un nombre natural (el 0 també ho és)', 'és un enter negatiu', 'no és enter: és un nombre racional'];
/* un nombre per classificar: {h, v, nota} */
function nombreConjunt(tipus){
  switch(tipus){
    case 'nat':  { const n=rand(0,25); return {h:fmtInt(n), v:F(n)}; }
    case 'neg':  { const n=-rand(1,25); return {h:fmtInt(n), v:F(n)}; }
    case 'dec':  { const f=F(rand(1,99)*(coin()?1:-1),pick([10,100,4])); if(f.isInt()) return nombreConjunt('dec'); return {h:decStr(f), v:f}; }
    case 'frac': { const f=frIrr([2,3,4,5,7,8,9],2).mul(coin(0.4)?-1:1); if(f.isInt()) return nombreConjunt('frac'); return {h:fr(f), v:f}; }
    case 'fracEnt': { const k=rand(2,6), q=rand(1,8)*(coin()?1:-1); return {h:(q<0?MENYS:'')+fracRaw(Math.abs(q)*k,k), v:F(q), nota:`perquè ${(q<0?MENYS:'')+fracRaw(Math.abs(q)*k,k)} = ${fmtInt(q)}`}; }
    case 'zero': { const k=rand(2,9); return {h:fracRaw(0,k), v:F(0), nota:`perquè ${fracRaw(0,k)} = 0`}; }
    case 'per':  { const f=pick([F(1,3),F(2,3),F(5,9),F(1,6),F(7,9),F(4,11)]); return {h:decH(f), v:f, nota:'els periòdics també són racionals'}; }
  }
}
plantilla(1,'AS','1-oposat','Oposat d’un nombre (opció múltiple)', () => {
  const x = coin(0.7) ? frIrr(DEN_AS,1.5) : F(rand(2,12)*(coin(0.8)?1:-1));
  const o = mc(fr(x.neg()), [fr(x.inv()), fr(x.inv().neg()), fr(x)]);
  return { enunciat:`Quin és l’<b>oposat</b> de ${m(fr(x))}?`, mc:o,
    pista:'L’oposat és el mateix nombre amb el signe canviat.',
    res:[`L’oposat de ${m(fr(x))} és ${m(fr(x.neg()))}, perquè ${m(fr(x)+' + '+frp(x.neg())+' = 0')}.`], v:{k:'oposat', x, r:x.neg()} };
});
plantilla(1,'AS','1-invers','Invers d’un nombre (opció múltiple)', () => {
  const x = coin(0.75) ? retry(()=>{ const f=frIrr(DEN_AS,1.5); return f.n!==1?f:null; }) : F(rand(2,12));
  const o = mc(fr(x.inv()), [fr(x.neg()), fr(x.inv().neg()), fr(x)]);
  return { enunciat:`Quin és l’<b>invers</b> de ${m(fr(x))}?`, mc:o,
    pista:'L’invers és el nombre que multiplicat per ell dona 1: es giren numerador i denominador.',
    res:[`L’invers de ${m(fr(x))} és ${m(fr(x.inv()))}, perquè ${m(frp(x)+' · '+frp(x.inv())+' = 1')}.`], v:{k:'invers', x, r:x.inv()} };
});
plantilla(1,'AS','1-absolut','Valor absolut (opció múltiple)', () => {
  const x = coin(0.7) ? frIrr(DEN_AS,1.5).neg() : F(-rand(2,15));
  const o = mc(fr(x.abs()), [fr(x), fr(x.inv().abs()), fr(x.inv())]);
  return { enunciat:`Quant val ${m(abs(fr(x)))}?`, mc:o,
    pista:'El valor absolut és la distància al 0: mai és negatiu.',
    res:[`${m(abs(fr(x))+' = '+fr(x.abs()))}: el valor absolut treu el signe.`], v:{k:'absolut', x, r:x.abs()} };
});
plantilla(1,'AS','1-conjunt','Conjunt més petit (ℕ, ℤ o ℚ)', () => {
  const n = nombreConjunt(pick(['nat','neg','dec','frac']));
  const c = conjunt(n.v);
  return { enunciat:`Quin és el <b>conjunt més petit</b> al qual pertany ${m(n.h)}?`, mc:{opcions:CONJ.slice(), ok:c},
    pista:'ℕ ⊂ ℤ ⊂ ℚ. Els naturals són 0, 1, 2, …; els enters hi afegeixen els negatius; els racionals, les fraccions.',
    res:[`${m(n.h)} ${CONJ_EXPL[c]}: pertany a ${CONJ[c]}${c<2?' (i també a '+CONJ.slice(c+1).join(' i ')+')':''}.`], v:{k:'conjunt', x:n.v, c} };
});
plantilla(1,'AS','1-noracional','Quin no és racional (denominador 0)', () => {
  const a=rand(1,9);
  const o = mc(fracRaw(a,0), shuffle([fmtInt(-rand(2,9)), decStr(F(rand(1,9),10)), fracRaw(0,rand(2,9)), fr(frIrr([3,5,7],1))]).slice(0,3));
  return { enunciat:`Quin d’aquests <b>no</b> és un nombre racional?`, mc:o,
    pista:'Un racional és una fracció a/b d’enters amb b ≠ 0.',
    res:[`${m(fracRaw(a,0))} no és racional: no es pot dividir entre 0.`, `${m(fracRaw(0,2))} = 0 sí que és racional: el 0 pot anar al numerador.`], v:{k:'noracional'} };
});
plantilla(1,'AN','1-tres','Oposat, invers i valor absolut alhora (negatius)', () => {
  const x = coin(0.8) ? frIrr(DEN_AN,2).neg() : F(-rand(2,20));
  return { enunciat:`Escriu l’oposat, l’invers i el valor absolut de ${m(fr(x))}.`,
    camps:[cFrac(x.neg(),{et:'Oposat'}), cFrac(x.inv(),{et:'Invers'}), cFrac(x.abs(),{et:'Valor absolut'})],
    pista:'Oposat: canvia el signe. Invers: gira la fracció (el signe es manté). Valor absolut: treu el signe.',
    res:[`Oposat: ${m(fr(x.neg()))}`, `Invers: ${m(fr(x.inv()))} (el signe no canvia: ${m(frp(x)+' · '+frp(x.inv())+' = 1')})`, `Valor absolut: ${m(abs(fr(x))+' = '+fr(x.abs()))}`],
    v:{k:'tres', x} };
});
plantilla(1,'AN','1-classifica','Classificar nombres a ℕ, ℤ o ℚ', () => {
  const tipus = shuffle(['nat','neg','dec','frac','fracEnt']);
  const items = tipus.map(nombreConjunt);
  return { enunciat:'Classifica cada nombre en el <b>conjunt més petit</b> al qual pertany.',
    classifica:{cats:CONJ.slice(), items:items.map(n=>({h:n.h, c:conjunt(n.v)}))},
    pista:'Si una fracció dona un resultat exacte, mira quin nombre és: 12/4 = 3.',
    res: items.map(n=>`${m(n.h)} → ${CONJ[conjunt(n.v)]}${n.nota?' ('+n.nota+')':''}`), v:{k:'classifica', xs:items.map(n=>n.v)} };
});
plantilla(1,'AN','1-compost','Oposat de l’invers i combinacions', () => {
  const x = frIrr(DEN_AN,2).neg();
  const op = pick([
    {t:'l’oposat de l’invers', f:y=>y.inv().neg(), r:[`Invers: ${m(fr(x.inv()))}`, `Oposat: ${m(fr(x.inv().neg()))}`]},
    {t:'l’invers de l’oposat', f:y=>y.neg().inv(), r:[`Oposat: ${m(fr(x.neg()))}`, `Invers: ${m(fr(x.neg().inv()))}`]},
    {t:'l’invers del valor absolut', f:y=>y.abs().inv(), r:[`Valor absolut: ${m(fr(x.abs()))}`, `Invers: ${m(fr(x.abs().inv()))}`]},
  ]);
  return { enunciat:`Calcula ${op.t} de ${m(fr(x))}.`, camps:[cFrac(op.f(x))],
    pista:'Fes-ho per parts: primer el que hi ha més a la dreta de la frase.', res:op.r, v:{k:'compost', x, r:op.f(x)} };
});
const VF1 = [
  () => ({h:'L’invers de 0 és 0.', v:false, e:'El 0 no té invers: cap nombre multiplicat per 0 dona 1.'}),
  () => { const x=frIrr(DEN_AE,2).neg(); return {h:`L’oposat de l’oposat de ${m(fr(x))} és ${m(fr(x))}.`, v:true, e:'Canviar el signe dues vegades deixa el nombre igual.'}; },
  () => { const x=frIrr(DEN_AE,2).neg(); return {h:`L’invers de ${m(fr(x))} és ${m(fr(x.inv().neg()))}.`, v:false, e:`L’invers manté el signe: és ${m(fr(x.inv()))}.`}; },
  () => ({h:'El valor absolut d’un nombre sempre és positiu.', v:false, e:'El valor absolut de 0 és 0, que no és positiu: és positiu <i>o zero</i>.'}),
  () => ({h:'Tot nombre enter és racional.', v:true, e:'Qualsevol enter es pot escriure com a fracció: −5 = −5/1.'}),
  () => ({h:'Tot nombre racional és enter.', v:false, e:'Per exemple, 1/2 és racional i no és enter.'}),
  () => ({h:'Un nombre i el seu oposat sempre tenen signes diferents.', v:false, e:'El 0 és el seu propi oposat.'}),
  () => ({h:'Un nombre i el seu invers sempre tenen el mateix signe.', v:true, e:'El producte ha de ser 1, que és positiu.'}),
  () => ({h:'El 0 és un nombre natural.', v:true, e:'A classe considerem ℕ = {0, 1, 2, 3, …}.'}),
  () => { const a=rand(1,9), b=rand(2,9); return {h:`${m(MENYS+fracRaw(a,b))} i ${m(fracRaw(a,'−'+b))} són el mateix nombre.`, v:true, e:'El signe pot anar al numerador, al denominador o davant: el valor és el mateix.'}; },
  () => { const x=frIrr(DEN_AE,2); return {h:`L’oposat de ${m(MENYS+fr(x))} és ${m(fr(x.inv()))}.`, v:false, e:`L’oposat només canvia el signe: és ${m(fr(x))}.`}; },
  () => { const x=frIrr(DEN_AE,2); return {h:`${m(abs(MENYS+fr(x)))} = ${m(abs(fr(x)))}`, v:true, e:'Un nombre i el seu oposat tenen el mateix valor absolut.'}; },
  () => { const n=rand(2,9); return {h:`L’invers de ${m(fmtInt(-n))} és ${m(fmtInt(n))}.`, v:false, e:`L’invers de ${m(fmtInt(-n))} és ${m(fr(F(-1,n)))}.`}; },
];
function vfDe(pool, k=3){ const fs=shuffle(pool).slice(0,k).map(f=>f()); return fs; }
plantilla(1,'AE','1-vf','Vertader o fals amb trampa (invers de 0, oposat de l’oposat…)', () => {
  const af=vfDe(VF1);
  return { enunciat:'Digues si cada afirmació és vertadera o falsa.', vf:af.map(a=>({h:a.h, v:a.v})),
    res:af.map(a=>`${a.v?'<b>V</b>':'<b>F</b>'} · ${a.e}`), v:{k:'vf'} };
});
plantilla(1,'AE','1-suma','Suma d’un invers i un oposat (enters i fraccions)', () => retry(() => {
  const x = coin() ? F(-rand(2,9)) : frIrr(DEN_AE,2).neg();
  const y = frIrr(DEN_AE,2).mul(coin()?1:-1);
  const op = pick(['ix+oy','ox+iy','ax+iy']);
  let a,b,ta,tb;
  if(op==='ix+oy'){ a=x.inv(); b=y.neg(); ta=`l’invers de ${m(fr(x))}`; tb=`l’oposat de ${m(fr(y))}`; }
  else if(op==='ox+iy'){ a=x.neg(); b=y.inv(); ta=`l’oposat de ${m(fr(x))}`; tb=`l’invers de ${m(fr(y))}`; }
  else { a=x.abs(); b=y.inv(); ta=`el valor absolut de ${m(fr(x))}`; tb=`l’invers de ${m(fr(y))}`; }
  const e=B('+',a,b), r=ev(e);
  if(!amable(r) || r.n===0) return null;
  return { enunciat:`Suma ${ta} i ${tb}. Dona el resultat simplificat.`, camps:[cFrac(r)],
    res:[`${ta[0].toUpperCase()+ta.slice(1)}: ${m(fr(a))}`, `${tb[0].toUpperCase()+tb.slice(1)}: ${m(fr(b))}`, m(eh(e,false)+' '+resolExpr(e).join(' '))], v:{k:'expr', txt:et(e), r} };
}));
plantilla(1,'AE','1-classifica','Classificar amb trampes (12/4, 0/5, periòdics)', () => {
  const tipus = shuffle(['fracEnt','fracEnt','zero','per','neg','frac']);
  const items = tipus.map(nombreConjunt);
  return { enunciat:'Classifica cada nombre en el <b>conjunt més petit</b> al qual pertany.',
    classifica:{cats:CONJ.slice(), items:items.map(n=>({h:n.h, c:conjunt(n.v)}))},
    res: items.map(n=>`${m(n.h)} → ${CONJ[conjunt(n.v)]}${n.nota?' ('+n.nota+')':''}`), v:{k:'classifica', xs:items.map(n=>n.v)} };
});

/* ─────────── 2. Equivalents i simplificació ─────────── */
plantilla(2,'AS','2-creu','Són equivalents? (en creu)', () => retry(() => {
  const p=frIrr(DEN_AS,1), k1=rand(1,4), k2=rand(2,5);
  let a=p.n*k1, b=p.d*k1, c=p.n*k2, d=p.d*k2;
  const si=coin();
  if(!si){ if(coin()) c+=pick([1,-1]); else d+=pick([1,-1]); }
  if(c<=0||d<=1||(a===c&&b===d)||d>36||b>36) return null;
  if(!si && a*d===b*c) return null;
  const o={opcions:['Sí, són equivalents','No, no són equivalents'], ok:si?0:1};
  return { enunciat:`Són equivalents ${m(fracRaw(a,b))} i ${m(fracRaw(c,d))}?`, mc:o,
    pista:'Multiplica en creu: si els dos productes són iguals, són equivalents.',
    res:[`${m(a+' · '+d+' = '+fmtInt(a*d))} i ${m(b+' · '+c+' = '+fmtInt(b*c))}`, a*d===b*c?'Els productes són iguals: <b>són equivalents</b>.':'Els productes són diferents: <b>no són equivalents</b>.'], v:{k:'creu', a,b,c,d, si} };
}));
plantilla(2,'AS','2-simplifica','Simplificar fraccions petites', () => {
  const p=frIrr(DEN_AS,1.3), k=rand(2,6);
  return { enunciat:`Simplifica fins a la fracció irreductible:`, gran:fracRaw(p.n*k,p.d*k), camps:[cFrac(p)],
    pista:'Divideix el numerador i el denominador pel mateix nombre (2, 3, 5…) fins que no es pugui més.',
    res:[m(`${fracRaw(p.n*k,p.d*k)} = ${fracRaw(p.n+' · '+k, p.d+' · '+k)} = ${fr(p)}`), `Dividim tots dos termes per ${k}.`], v:{k:'simp', a:p.n*k, b:p.d*k, r:p} };
});
plantilla(2,'AS','2-falta','Terme que falta (amplificar)', () => {
  const p=frIrr(DEN_AS,1.3), k=rand(2,6), aNum=coin();
  const h = aNum ? `${fr(p)} = <span class="frac"><span><span class="buit">?</span></span><span>${p.d*k}</span></span>` : `${fr(p)} = <span class="frac"><span>${p.n*k}</span><span><span class="buit">?</span></span></span>`;
  const r = aNum ? p.n*k : p.d*k;
  return { enunciat:`Quin nombre falta perquè les fraccions siguin equivalents?`, gran:h, camps:[cEnter(r)],
    pista:'Mira per quant s’ha multiplicat el terme que coneixes i fes el mateix amb l’altre.',
    res:[aNum?`El denominador s’ha multiplicat per ${k} (${p.d} · ${k} = ${p.d*k}).`:`El numerador s’ha multiplicat per ${k} (${p.n} · ${k} = ${p.n*k}).`, `Multipliquem l’altre terme per ${k}: <b>${r}</b>.`], v:{k:'falta', p, a:aNum?r:p.n*k, b:aNum?p.d*k:r} };
});
plantilla(2,'AS','2-quina','Quina fracció és equivalent (opció múltiple)', () => {
  const p=retry(()=>{ const f=frIrr(DEN_AS,1); return f.n>1?f:null; }), k=rand(2,5);
  const o=mc(fracRaw(p.n*k,p.d*k), [fracRaw(p.n+k,p.d+k), fracRaw(p.n*k,p.d), fracRaw(p.n,p.d*k)]);
  return { enunciat:`Quina d’aquestes fraccions és equivalent a ${m(fr(p))}?`, mc:o,
    pista:'Per amplificar, cal multiplicar el numerador i el denominador pel mateix nombre (sumar no val).',
    res:[`${m(`${fr(p)} = <span class="frac"><span>${p.n} · ${k}</span><span>${p.d} · ${k}</span></span> = ${fracRaw(p.n*k,p.d*k)}`)}`, 'Sumar el mateix nombre a dalt i a baix no dona una fracció equivalent.'], v:{k:'quina', p, a:p.n*k, b:p.d*k} };
});
plantilla(2,'AN','2-simplifica','Simplificar amb factors primers (84/126)', () => retry(() => {
  const p=frIrr(DEN_AN,1.4), k=pick([6,10,12,14,15,18,21,22,24,28,30,35,42]);
  const a=p.n*k, b=p.d*k; if(b>400) return null;
  const g=gcd(a,b), s=coin(0.3)?-1:1;
  return { enunciat:`Simplifica fins a la fracció irreductible:`, gran:(s<0?MENYS:'')+fracRaw(a,b), camps:[cFrac(p.mul(s))],
    pista:'Descompon el numerador i el denominador en factors primers i ratlla els factors comuns.',
    res:[`${m(fmtInt(a)+' = '+factH(a))} i ${m(fmtInt(b)+' = '+factH(b))}`, `Factors comuns: ${m(factH(g))} = ${g}`, m(`${s<0?MENYS:''}${fracRaw(a,b)} = ${s<0?MENYS:''}<span class="frac"><span>${a} : ${g}</span><span>${b} : ${g}</span></span> = ${fr(p.mul(s))}`)], v:{k:'simp', a:a*s, b, r:p.mul(s)} };
}));
function ordena(n, dens, neg, maxL){
  return retry(() => {
    const xs=[]; for(let i=0;i<n;i++){ const f=frIrr(dens,neg?1.6:1.3); xs.push(neg && coin(0.45) ? f.neg() : f); }
    if(neg && coin(0.4)) xs[0]=F(pick([-1,1,-2,2,0]));
    const vals=xs.map(x=>x.n/x.d); if(new Set(xs.map(x=>x.n+'/'+x.d)).size<n) return null;
    const L_=xs.map(x=>x.d).reduce(lcm); if(L_>maxL) return null;
    if(neg && !xs.some(x=>x.n<0)) return null;
    if(new Set(xs.map(x=>x.d)).size<Math.min(n,3)) return null;
    const ord=xs.map((x,i)=>i).sort((i,j)=>xs[i].cmp(xs[j]));
    const res=[`m.c.m.(${[...new Set(xs.map(x=>x.d))].sort((a,b)=>a-b).join(', ')}) = ${L_}`,
      m(xs.map(x=>`${fr(x)} = ${(x.n<0?MENYS:'')+fracRaw(Math.abs(x.n)*L_/x.d, L_)}`).join(' ; ')),
      m(ord.map(i=>fr(xs[i])).join(' &lt; '))];
    return { enunciat:'Ordena les fraccions de <b>més petita a més gran</b> (arrossega-les).', ordena:{items:xs.map(fr), ok:ord},
      pista:'Redueix-les a comú denominador i compara els numeradors. Les negatives van davant.', res, v:{k:'ordena', xs, ord} };
  });
}
plantilla(2,'AN','2-ordena','Ordenar 3 fraccions (comú denominador)', () => ordena(3,[2,3,4,5,6,8,9,10,12,15],false,60));
plantilla(2,'AN','2-falta','Terme que falta, amb negatius', () => {
  const p=frIrr(DEN_AN,1.5).mul(coin()?-1:1), k=rand(2,9), aNum=coin();
  const s=p.n<0?MENYS:'';
  const h = aNum ? `${fr(p)} = ${s}<span class="frac"><span><span class="buit">?</span></span><span>${p.d*k}</span></span>` : `${fr(p)} = ${s}<span class="frac"><span>${Math.abs(p.n)*k}</span><span><span class="buit">?</span></span></span>`;
  const r = aNum ? Math.abs(p.n)*k : p.d*k;
  return { enunciat:`Quin nombre falta perquè les fraccions siguin equivalents?`, gran:h, camps:[cEnter(r)],
    pista:'Multiplicació en creu, o bé: per quant s’ha multiplicat el terme que coneixes?',
    res:[aNum?`${p.d} · ${k} = ${p.d*k}: s’ha multiplicat per ${k}.`:`${Math.abs(p.n)} · ${k} = ${Math.abs(p.n)*k}: s’ha multiplicat per ${k}.`, `${aNum?Math.abs(p.n):p.d} · ${k} = <b>${r}</b>`], v:{k:'falta', p:p.abs(), a:aNum?r:Math.abs(p.n)*k, b:aNum?p.d*k:r} };
});
plantilla(2,'AE','2-ordena','Ordenar 4 o 5 nombres amb negatius', () => ordena(rand(4,5),[2,3,4,5,6,8,9,10,12,15,18,20],true,120));
plantilla(2,'AE','2-falta','Terme que falta (cal simplificar abans)', () => retry(() => {
  const p=frIrr(DEN_AN,1.5), k1=rand(2,9), k2=rand(2,9);
  if(k1===k2 || k1%k2===0 || k2%k1===0) return null;
  const s=coin()?-1:1, sg=s<0?MENYS:'';
  const a=p.n*k1, b=p.d*k1, aNum=coin();
  const h = aNum ? `${sg}${fracRaw(a,b)} = ${sg}<span class="frac"><span><span class="buit">?</span></span><span>${p.d*k2}</span></span>` : `${sg}${fracRaw(a,b)} = ${sg}<span class="frac"><span>${p.n*k2}</span><span><span class="buit">?</span></span></span>`;
  const r = aNum ? p.n*k2 : p.d*k2;
  if(b>200 || p.d*k2>200) return null;
  return { enunciat:`Quin nombre falta perquè les fraccions siguin equivalents?`, gran:h, camps:[cEnter(r)],
    res:[`Primer simplifiquem: ${m(fracRaw(a,b)+' = '+fr(p))}`, aNum?`${p.d} · ${k2} = ${p.d*k2}, així que el numerador és ${p.n} · ${k2} = <b>${r}</b>.`:`${p.n} · ${k2} = ${p.n*k2}, així que el denominador és ${p.d} · ${k2} = <b>${r}</b>.`, `Comprovació en creu: ${a} · ${aNum?p.d*k2:r} = ${b} · ${aNum?r:p.n*k2} = ${fmtInt(a*(aNum?p.d*k2:r))}`], v:{k:'falta', p, a:aNum?r:p.n*k2, b:aNum?p.d*k2:r} };
}));
plantilla(2,'AE','2-vf','Quines són equivalents a una fracció negativa', () => {
  const p=frIrr(DEN_AN,1.3), k=rand(2,6);
  const cands = shuffle([
    {h:fracRaw(p.n,MENYS+p.d), v:true},
    {h:MENYS+fracRaw(p.n*k,p.d*k), v:true},
    {h:fracRaw(MENYS+p.n*k,p.d*k), v:true},
    {h:fracRaw(MENYS+p.n,MENYS+p.d), v:false},
    {h:MENYS+fracRaw(p.n+k,p.d+k), v:false},
    {h:MENYS+fracRaw(p.d,p.n), v:false},
  ]).slice(0,3);
  return { enunciat:`Digues si cada fracció és equivalent a ${m(MENYS+fr(p))}.`, vf:cands.map(c=>({h:m(c.h), v:c.v})), vfEt:['Sí','No'],
    res:[`Una fracció negativa té el signe davant, al numerador o al denominador (però només en un lloc).`, `Si el signe és a dalt i a baix, la fracció és positiva. Sumar el mateix nombre o girar-la canvia el valor.`], v:{k:'vf'} };
});

/* ─────────── 3. Operacions ─────────── */
plantilla(3,'AS','3-enters','Operació amb enters (signes)', () => retry(() => {
  const op=pick(['+','−','·',':']);
  let a=rand(-12,12), b=rand(-12,12); if(a===0||b===0) return null;
  if(op===':'){ a=a*b; if(Math.abs(a)>100) return null; }
  if(op!==':' && op!=='·' && a>0 && b>0) return null;
  if((op==='·'||op===':') && a>0 && b>0) return null;
  const e=B(op,a,b), r=ev(e);
  const regla = op==='·'||op===':' ? 'Signes iguals → +; signes diferents → −.' : 'Mira els signes: si són iguals se sumen, si són diferents es resten i es posa el signe del més gran en valor absolut.';
  return { enunciat:'Calcula:', gran:eh(e,false), camps:[cEnter(r)], pista:regla, res:[m(eh(e,false)+' = '+fr(r)), regla], v:{k:'expr', txt:et(e), r} };
}));
plantilla(3,'AS','3-suma','Suma o resta de dues fraccions (m.c.m.)', () => retry(() => {
  const a=frIrr(DEN_AS,1), b=frIrr(DEN_AS,1); if(a.d===b.d) return null;
  const op = a.cmp(b)>0 && coin() ? '−' : '+';
  const e=B(op,a,b), r=ev(e), M=lcm(a.d,b.d); if(M>36) return null;
  return { enunciat:'Calcula i simplifica el resultat:', gran:eh(e,false), camps:[cFrac(r)],
    pista:`Busca el m.c.m. dels denominadors (${a.d} i ${b.d}) i redueix a comú denominador.`,
    res:[`m.c.m.(${a.d}, ${b.d}) = ${M}`, m(`${eh(e,false)} = ${fracRaw(a.n*M/a.d,M)}<span class="opr">${op}</span>${fracRaw(b.n*M/b.d,M)} = ${fracRaw(op==='+'?a.n*M/a.d+b.n*M/b.d:a.n*M/a.d-b.n*M/b.d,M)}${F(op==='+'?a.n*M/a.d+b.n*M/b.d:a.n*M/a.d-b.n*M/b.d,M).d!==M?' = '+fr(r):''}`)], v:{k:'expr', txt:et(e), r} };
}));
plantilla(3,'AS','3-mateix','Suma amb el mateix denominador o amb un enter', () => retry(() => {
  let e;
  if(coin()){ const d=pick(DEN_AS), a=rand(1,d-1), b=rand(1,d); if(a===b) return null; e=B(a>b&&coin()?'−':'+',F(a,d),F(b,d)); if(F(a,d).d!==d||F(b,d).d!==d) return null; }
  else { const k=rand(1,5), f=frIrr(DEN_AS,1); e=coin()?B('+',k,f):B('−',k,f); }
  const r=ev(e); if(r.n<=0) return null;
  const res = e.a.v.d===e.b.v.d
    ? [m(`${eh(e,false)} = <span class="frac"><span>${e.a.v.n} ${e.op} ${e.b.v.n}</span><span>${e.a.v.d}</span></span> = ${fracRaw(e.op==='+'?e.a.v.n+e.b.v.n:e.a.v.n-e.b.v.n, e.a.v.d)}${F(e.op==='+'?e.a.v.n+e.b.v.n:e.a.v.n-e.b.v.n, e.a.v.d).d!==e.a.v.d?' = '+fr(r):''}`), 'Amb el mateix denominador, se sumen o resten els numeradors.']
    : [m(`${eh(e,false)} = ${fracRaw(e.a.v.n*e.b.v.d,e.b.v.d)}<span class="opr">${e.op}</span>${fr(e.b.v)} = ${fr(r)}`), `L’enter ${e.a.v.n} s’escriu com ${fracRaw(e.a.v.n*e.b.v.d,e.b.v.d)}.`];
  return { enunciat:'Calcula i simplifica el resultat:', gran:eh(e,false), camps:[cFrac(r)],
    pista:'Si un terme és enter, escriu-lo com a fracció amb el mateix denominador que l’altre.', res, v:{k:'expr', txt:et(e), r} };
}));
plantilla(3,'AS','3-producte','Producte de dues fraccions', () => retry(() => {
  const a=frIrr(DEN_AS,1.2), b=frIrr(DEN_AS,1.2), e=B('·',a,b), r=ev(e);
  return { enunciat:'Calcula i simplifica el resultat:', gran:eh(e,false), camps:[cFrac(r)],
    pista:'Numerador per numerador i denominador per denominador.',
    res:[m(`${eh(e,false)} = <span class="frac"><span>${a.n} · ${b.n}</span><span>${a.d} · ${b.d}</span></span> = ${fracRaw(a.n*b.n,a.d*b.d)}${a.n*b.n!==r.n?' = '+fr(r):''}`)], v:{k:'expr', txt:et(e), r} };
}));
plantilla(3,'AS','3-divisio','Divisió de dues fraccions', () => retry(() => {
  const a=frIrr(DEN_AS,1.2), b=frIrr(DEN_AS,1.2), e=B(':',a,b), r=ev(e); if(!amable(r,99,99)) return null;
  return { enunciat:'Calcula i simplifica el resultat:', gran:eh(e,false), camps:[cFrac(r)],
    pista:'Dividir és multiplicar per l’invers del divisor (gira la segona fracció).',
    res:[m(`${eh(e,false)} = ${fr(a)} · ${fr(b.inv())} = <span class="frac"><span>${a.n} · ${b.d}</span><span>${a.d} · ${b.n}</span></span> = ${fracRaw(a.n*b.d,a.d*b.n)}${a.n*b.d!==r.n?' = '+fr(r):''}`)], v:{k:'expr', txt:et(e), r} };
}));
/* fracció per a operacions d'AN/AE, amb signe a l'atzar */
const fS = (dens, pneg=0.35, f=1.3) => { const x=frIrr(dens,f); return coin(pneg)?x.neg():x; };
function exprQ(e, pista, maxN=99, maxD=60){
  const r=ev(e); if(!amable(r,maxN,maxD) || !exprAmable(e)) return null;
  return { enunciat:'Calcula i simplifica el resultat:', gran:eh(e,false), camps:[cFrac(r)], pista,
    res:[m(eh(e,false)), ...resolExpr(e).map(m)], v:{k:'expr', txt:et(e), r} };
}
plantilla(3,'AN','3-tres','Suma i resta de 3 termes amb enters (2 + 1/10 + 3/20)', () => retry(() => {
  const k=rand(-4,4)||2, a=fS(DEN_AN,0.25), b=frIrr(DEN_AN,1.2);
  if(lcm(a.d,b.d)>60 || a.d===b.d) return null;
  const e=B(pick(['+','−']), B(pick(['+','−']), k, a), b), r=ev(e); if(!amable(r)) return null;
  const M=lcm(a.d,b.d);
  return { enunciat:'Calcula i simplifica el resultat:', gran:eh(e,false), camps:[cFrac(r)], pista:'L’enter també es passa a fracció amb el denominador comú.',
    res:[`m.c.m.(${a.d}, ${b.d}) = ${M}`, m(`${eh(e,false)} = ${(k<0?MENYS:'')+fracRaw(Math.abs(k)*M,M)}<span class="opr">${e.a.op}</span>${a.n<0?par(MENYS+fracRaw(-a.n*M/a.d,M)):fracRaw(a.n*M/a.d,M)}<span class="opr">${e.op}</span>${fracRaw(b.n*M/b.d,M)}`), m(`= ${(r.mul(M).n<0?MENYS:'')+fracRaw(Math.abs(r.mul(M).n),M)}${r.d!==M?' = '+fr(r):''}`)], v:{k:'expr', txt:et(e), r} };
}));
plantilla(3,'AN','3-jerarquia','Jerarquia: suma/resta amb producte o divisió', () => retry(() => {
  const a=fS(DEN_AN), b=fS(DEN_AN), c=fS(DEN_AN);
  const e = coin() ? B(pick(['+','−']), a, B(pick(['·',':']), b, c)) : B(pick(['+','−']), B(pick(['·',':']), a, b), c);
  return exprQ(e, 'Primer els productes i les divisions, després les sumes i les restes.');
}));
plantilla(3,'AN','3-parentesi','Operació amb un parèntesi', () => retry(() => {
  const a=fS(DEN_AN,0.25), b=frIrr(DEN_AN,1.2), c=fS(DEN_AN,0.3);
  const dins=P(B(pick(['+','−']),a,b));
  const e = pick([()=>B(pick(['·',':']),dins,c), ()=>B(pick(['·',':']),c,dins), ()=>B('−',rand(1,3),dins)])();
  return exprQ(e, 'Primer el parèntesi; després productes i divisions; al final sumes i restes.');
}));
plantilla(3,'AN','3-signes','Producte i divisió amb signes negatius', () => retry(() => {
  const a=fS(DEN_AN,0.5,1.5), b=fS(DEN_AN,0.6,1.5), c=fS(DEN_AN,0.6,1.5);
  if(a.n>0&&b.n>0&&c.n>0) return null;
  const e=B(pick(['·',':']), B(pick(['·',':']),a,b), c);
  return exprQ(e, 'D’esquerra a dreta. Per dividir, multiplica per l’invers. Compta els signes negatius.');
}));
plantilla(3,'AE','3-potencia','Parèntesis amb potències dins: (1/2 − 1/3)·(−3/2)² + 1/4', () => retry(() => {
  const a=fS(DEN_AN,0.2,1.2), b=frIrr(DEN_AN,1.2), c=frIrr([2,3,4,5],1.6).neg(), d=fS(DEN_AN,0.4,1.2);
  const pw=W(c,pick([2,2,3]));
  const e = pick([
    ()=>B(pick(['+','−']), B('·', P(B('−',a,b)), pw), d),
    ()=>B(pick(['+','−']), d, B(':', pw, P(B(pick(['+','−']),a,b)))),
    ()=>B('·', P(B(pick(['+','−']),d,pw)), P(B('−',a,b))),
  ])();
  return exprQ(e, null, 99, 72);
}));
plantilla(3,'AE','3-niats','Parèntesis niats i claudàtors', () => retry(() => {
  const a=fS(DEN_AE,0.3,1.2), b=fS(DEN_AE,0.3,1.2), c=frIrr(DEN_AN,1.2), d=fS(DEN_AN,0.3,1.2);
  const e = pick([
    ()=>B('−', a, P(B('·', b, P(B(pick(['+','−']),c,d))),'[]')),
    ()=>B(':', P(B(pick(['+','−']), a, P(B('·',b,c))),'[]'), d),
    ()=>B('·', P(B('−', rand(1,3), P(B(pick(['+','−']),c,d))),'[]'), a),
  ])();
  return exprQ(e, null, 99, 72);
}));
plantilla(3,'AE','3-mixt','Enters barrejats amb fraccions: (−2 + 1/3) : (5/6 − 3)', () => retry(() => {
  const k1=rand(-5,5)||-2, k2=rand(1,5), a=frIrr(DEN_AE,1.2), b=frIrr(DEN_AE,1.2);
  const e = B(pick([':','·']), P(B(pick(['+','−']),k1,a)), P(B('−',b,k2)));
  return exprQ(e, null, 99, 72);
}));
/* Troba l'error: es mostra una resolució amb un pas equivocat */
plantilla(3,'AE','3-error','Troba l’error en una resolució', () => retry(() => {
  const tipus=pick(['jerarquia','invers','signe']);
  const a=frIrr(DEN_AS,1.2), b=frIrr(DEN_AS,1.2), c=frIrr(DEN_AS,1.2);
  let e, linies, malPas, expl;
  if(tipus==='jerarquia'){
    e=B('+',a,B('·',b,c));
    const mal=a.add(b), mal2=mal.mul(c);
    linies=[eh(e,false), `= ${fr(mal)} · ${fr(c)}`, `= ${fr(mal2)}`]; malPas=1;
    expl=`L’error és al pas 1: s’ha sumat abans de multiplicar. Primer va el producte: ${m(eh(e,false)+' = '+fr(a)+' + '+fr(b.mul(c))+' = '+fr(ev(e)))}.`;
    if(mal2.eq(ev(e))) return null;
  } else if(tipus==='invers'){
    e=B(':',P(B('+',a,b)),c);
    const s=a.add(b), mal=F(s.n*c.n, s.d*c.d);
    linies=[eh(e,false), `= ${fr(s)} : ${fr(c)}`, `= ${fr(mal)}`]; malPas=2;
    expl=`L’error és al pas 2: per dividir cal multiplicar per l’invers del divisor. ${m(fr(s)+' : '+fr(c)+' = '+fr(s)+' · '+fr(c.inv())+' = '+fr(ev(e)))}.`;
    if(mal.eq(ev(e))) return null;
  } else {
    e=B('−',a,P(B('−',b,c)));
    if(b.cmp(c)<=0) return null;
    const mal=a.sub(b).sub(c);
    linies=[eh(e,false), `= ${fr(a)} − ${fr(b)} − ${fr(c)}`, `= ${fr(mal)}`]; malPas=1;
    expl=`L’error és al pas 1: el menys de davant del parèntesi canvia el signe de <i>tots</i> dos termes: ${m(fr(a)+' − '+fr(b)+' + '+fr(c)+' = '+fr(ev(e)))}.`;
  }
  if(!amable(ev(e)) || linies.some(l=>/\d{4}/.test(l))) return null;
  return { enunciat:'Aquesta resolució té un error. En quin pas és?', taula:linies.map((l,i)=>(i?`<span class="pas-n">Pas ${i}</span>`:'<span class="pas-n"></span>')+m(l)),
    mc:{opcions:['Pas 1','Pas 2','No hi ha cap error'], ok:malPas-1}, res:[expl], v:{k:'error', txt:et(e), r:ev(e), tipus} };
}));

/* ─────────── 4. Part d'un total i percentatges ─────────── */
const COSES = [
  ['alumnes','d’una escola'], ['llibres','d’una biblioteca'], ['ovelles','d’un ramat'], ['socis','d’un club'], ['cromos','d’una col·lecció'], ['arbres','d’un bosc'],
];
plantilla(4,'AS','4-fraccio','Fracció d’una quantitat (3/8 de 200)', () => retry(() => {
  const f=frIrr([2,3,4,5,6,8,10,12],1), N=f.d*rand(2,25); if(f.n===0||N>600) return null;
  const r=f.mul(N);
  return { enunciat:`Calcula ${m(fr(f))} de ${fmtInt(N)}.`, camps:[cEnter(r)], pista:'Divideix pel denominador i multiplica pel numerador.',
    res:[m(`${fmtInt(N)} : ${f.d} = ${N/f.d}`), m(`${N/f.d} · ${f.n} = ${fmtInt(r.n)}`)], v:{k:'fracq', f, N, r} };
}));
plantilla(4,'AS','4-percent','Percentatge d’una quantitat (10 %, 25 %, 50 %)', () => retry(() => {
  const p=pick([10,20,25,50,75]), f=F(p,100), N=f.d*rand(1,40); if(N>800||N<20) return null;
  const r=f.mul(N);
  return { enunciat:`Calcula el ${p} % de ${fmtInt(N)}.`, camps:[cEnter(r)], pista:`${p} % vol dir ${p} de cada 100: escriu-lo com una fracció i simplifica-la.`,
    res:[m(`${p} % = ${fracRaw(p,100)} = ${fr(f)}`), m(`${fr(f)} de ${fmtInt(N)} = ${fmtInt(N)} : ${f.d} · ${f.n} = ${fmtInt(r.n)}`)], v:{k:'pct', p, N, r} };
}));
plantilla(4,'AS','4-quina','Quina fracció representa una part (18 de 48)', () => retry(() => {
  const f=frIrr([2,3,4,5,6,8,10,12],1), k=rand(2,8), [qui,on]=pick(COSES);
  const part=f.n*k*rand(1,2), tot=part/f.n*f.d; if(!Number.isInteger(tot)||tot>200) return null;
  return { enunciat:`De ${tot} ${qui} ${on}, ${part} són ${pick(['de l’equip A','nous','vermells','de primer'])}. Quina fracció del total representen? Simplifica-la.`, camps:[cFrac(F(part,tot))],
    pista:'Part entre total, i després simplifica.', res:[m(`${fracRaw(part,tot)} = ${fr(F(part,tot))}`)], v:{k:'part', part, tot, r:F(part,tot)} };
}));
plantilla(4,'AS','4-relacio','Percentatge, fracció i decimal (opció múltiple)', () => {
  const p=pick([5,10,20,25,40,50,75]), f=F(p,100);
  if(coin()){
    const o=mc(fr(f), [fr(F(p,10)), fr(F(p,1000)), fracRaw(1,p)]);
    return { enunciat:`Quina fracció irreductible correspon al ${p} %?`, mc:o, pista:`${p} % vol dir ${p} de cada 100.`, res:[m(`${p} % = ${fracRaw(p,100)} = ${fr(f)}`)], v:{k:'pctfrac', p, r:f} };
  }
  const o=mc(decStr(f), [decStr(F(p,10)), decStr(F(p,1000)), fmtInt(p)]);
  return { enunciat:`Quin nombre decimal correspon al ${p} %?`, mc:o, pista:`${p} % = ${p} : 100`, res:[m(`${p} % = ${fracRaw(p,100)} = ${decStr(f)}`)], v:{k:'pctdec', p, r:f} };
});
const RESTA_CTX = [
  {tot:'llibres', a:'són novel·les', b:'són de ciència', q:'Quants llibres no són ni novel·les ni de ciència?'},
  {tot:'alumnes', a:'van a l’institut a peu', b:'hi van en bus', q:'Quants alumnes hi van d’una altra manera?'},
  {tot:'euros', a:'es gasten en menjar', b:'en transport', q:'Quants euros queden?'},
  {tot:'plantes', a:'són tomaqueres', b:'són pebroteres', q:'Quantes plantes són d’altres tipus?'},
];
function dosFrac(){ return retry(() => { const a=frIrr([2,3,4,5,6,8,10],1), b=frIrr([3,4,5,6,8,10,12],1); if(a.d===b.d || a.add(b).cmp(1)>=0) return null; return [a,b]; }); }
plantilla(4,'AN','4-resta','Problema de la resta: quants en queden', () => retry(() => {
  const [a,b]=dosFrac(), M=lcm(a.d,b.d), N=M*rand(1,8), c=pick(RESTA_CTX); if(N<20||N>600) return null;
  const A=a.mul(N), Bq=b.mul(N), r=F(N).sub(A).sub(Bq);
  return { enunciat:`Hi ha ${fmtInt(N)} ${c.tot}: ${m(fr(a))} ${c.a} i ${m(fr(b))} ${c.b}. ${c.q}`, camps:[cEnter(r)], pista:'Calcula cada part i resta-les del total (o calcula primer la fracció que queda).',
    res:[m(`${fr(a)} de ${N} = ${A.n}`), m(`${fr(b)} de ${N} = ${Bq.n}`), m(`${N} − ${A.n} − ${Bq.n} = ${r.n}`)], v:{k:'resta', a, b, N, r} };
}));
plantilla(4,'AN','4-restafrac','Problema de la resta: quina fracció queda', () => {
  const [a,b]=dosFrac(), c=pick(RESTA_CTX), r=F(1).sub(a).sub(b), M=lcm(a.d,b.d);
  return { enunciat:`D’un grup de ${c.tot}, ${m(fr(a))} ${c.a} i ${m(fr(b))} ${c.b}. Quina fracció del total queda? Simplifica-la.`, camps:[cFrac(r)],
    pista:'El total és 1. Suma les dues fraccions i resta-les d’1.',
    res:[m(`${fr(a)} + ${fr(b)} = ${fracRaw(a.n*M/a.d,M)} + ${fracRaw(b.n*M/b.d,M)} = ${fr(a.add(b))}`), m(`1 − ${fr(a.add(b))} = ${fr(r)}`)], v:{k:'restafrac', a, b, r} };
});
plantilla(4,'AN','4-descompte','Descomptes i augments', () => retry(() => {
  const P_=rand(4,60)*5, x=pick([5,10,15,20,25,30,40]), aug=coin(0.4);
  const r=F(P_).mul(F(100+(aug?x:-x),100)); if(r.d>100) return null;
  const obj=pick(['Una jaqueta','Una bicicleta','Uns auriculars','Una entrada de concert','Un joc']);
  return { enunciat:aug?`${obj} costava ${fmtInt(P_)} € i el preu ha augmentat un ${x} %. Quant costa ara?`:`${obj} costa ${fmtInt(P_)} € i té un descompte del ${x} %. Quant s’ha de pagar?`,
    camps:[cDec(r,{et:'Preu (€)'})], pista:aug?`Si augmenta un ${x} %, pagues el ${100+x} %.`:`Si et descompten un ${x} %, pagues el ${100-x} %.`,
    res:[`${aug?'Augment':'Descompte'}: ${m(`${x} % de ${P_} = ${eur(F(P_*x,100))}`)}`, m(`${P_} ${aug?'+':'−'} ${decStr(F(P_*x,100))} = ${eur(r)}`), `O directament: ${m(`${P_} · ${decStr(F(100+(aug?x:-x),100))} = ${eur(r)}`)}`], v:{k:'desc', P:P_, x, aug, r} };
}));
plantilla(4,'AN','4-relacio','Percentatge = fracció irreductible = decimal', () => {
  const p=pick([5,12,15,35,40,45,60,64,75,80,8,2]), f=F(p,100);
  return { enunciat:`Escriu el ${p} % com a fracció irreductible i com a nombre decimal.`, camps:[cFrac(f,{et:'Fracció'}), cDec(f,{et:'Decimal'})],
    pista:'Escriu-lo sobre 100 i simplifica. Per al decimal, divideix entre 100.', res:[m(`${p} % = ${fracRaw(p,100)} = ${fr(f)} = ${decStr(f)}`)], v:{k:'pctrel', p, r:f} };
});
plantilla(4,'AE','4-invers','Problema invers: la resta són 18, quantes n’hi ha?', () => retry(() => {
  const a=frIrr([3,4,5,6,7,8,9,10],1), T_=a.d*rand(2,12), R=T_-a.mul(T_).n; if(R<=0||T_>300) return null;
  const ctx=pick([
    `En un hort, ${m(fr(a))} de les plantes són tomaqueres i la resta, ${R}, són enciams. Quantes plantes hi ha?`,
    `En una classe, ${m(fr(a))} dels alumnes són noies i la resta, ${R}, són nois. Quants alumnes hi ha?`,
    `En una caixa, ${m(fr(a))} de les galetes són de xocolata i la resta, ${R}, són de crema. Quantes galetes hi ha?`,
    `D’un curs, ${m(fr(a))} dels alumnes han anat d’excursió i la resta, ${R}, s’han quedat a l’institut. Quants alumnes hi ha al curs?`]);
  return { enunciat:ctx,
    camps:[cEnter(T_)], res:[m(`1 − ${fr(a)} = ${fr(F(1).sub(a))}`)+' del total són '+R+'.', m(`${fr(F(1).sub(a))} de x = ${R} → x = ${R} : ${F(1).sub(a).n} · ${a.d} = ${T_}`), `Comprovació: ${m(`${fr(a)} de ${T_} = ${a.mul(T_).n}`)} i ${a.mul(T_).n} + ${R} = ${T_}.`], v:{k:'invers1', a, R, r:F(T_)} };
}));
plantilla(4,'AE','4-invers2','Problema invers amb dues fraccions', () => retry(() => {
  const [a,b]=dosFrac(), q=F(1).sub(a).sub(b), M=lcm(a.d,b.d), T_=M*rand(1,8), R=q.mul(T_); if(!R.isInt()||T_>400||R.n<2) return null;
  return { enunciat:`D’una paga, en Pol gasta ${m(fr(a))} en roba i ${m(fr(b))} en llibres. Encara li queden ${R.n} €. Quants euros tenia?`, camps:[cEnter(T_)],
    res:[m(`${fr(a)} + ${fr(b)} = ${fr(a.add(b))}`), m(`Li queda 1 − ${fr(a.add(b))} = ${fr(q)}`), m(`${fr(q)} de x = ${R.n} → x = ${R.n} : ${q.n} · ${q.d} = ${T_}`)], v:{k:'invers2', a, b, R, r:F(T_)} };
}));
plantilla(4,'AE','4-pctinvers','Percentatge invers (després del descompte costa 48 €)', () => retry(() => {
  const O=rand(4,60)*5, x=pick([5,10,15,20,25,30,40]), aug=coin(0.4), P_=F(O).mul(F(100+(aug?x:-x),100)); if(P_.d>100) return null;
  return { enunciat:aug?`Després d’un augment del ${x} %, un producte costa ${eur(P_)}. Quant costava abans de l’augment?`:`Després d’un descompte del ${x} %, un producte costa ${eur(P_)}. Quin era el preu inicial?`,
    camps:[cDec(F(O),{et:'Preu (€)'})], res:[`Ara es paga el ${100+(aug?x:-x)} % del preu inicial: ${m(`${decStr(F(100+(aug?x:-x),100))} · x = ${decStr(P_)}`)}`, m(`x = ${decStr(P_)} : ${decStr(F(100+(aug?x:-x),100))} = ${fmtInt(O)} €`)], v:{k:'pctinv', x, aug, P:P_, r:F(O)} };
}));
plantilla(4,'AE','4-proporcio','Proporcionalitat amb fraccions (recepta de 4 a 6 persones)', () => retry(() => {
  const n=pick([2,3,4,5,6,8]), mm=pick([2,3,4,5,6,8,10,12]); if(n===mm) return null;
  const q=frIrr([2,3,4,5,8],1.6), r=q.mul(mm).div(n); if(r.isInt()||!amable(r,40,24)) return null;
  const [ing,qu]=pick([['kg de farina','Quants quilos de farina'],['litres de llet','Quants litres de llet'],['kg de patates','Quants quilos de patates'],['tasses de sucre','Quantes tasses de sucre']]);
  return { enunciat:`Una recepta per a ${n} persones porta ${m(fr(q))} ${ing}. ${qu} calen per a ${mm} persones? Dona la fracció irreductible.`, camps:[cFrac(r)],
    res:[`Per a 1 persona: ${m(`${fr(q)} : ${n} = ${fr(q.div(n))}`)}`, `Per a ${mm} persones: ${m(`${fr(q.div(n))} · ${mm} = ${fr(r)}`)} ${ing}`], v:{k:'prop', q, n, mm, r} };
}));
plantilla(4,'AE','4-fracfrac','Fracció del que queda (gasta 2/5 i després 1/3 del que queda)', () => retry(() => {
  const a=frIrr([3,4,5,6,7,8],1), b=frIrr([2,3,4,5],1), r=F(1).sub(a).mul(F(1).sub(b));
  return { enunciat:`La Laia gasta ${m(fr(a))} dels seus estalvis en una bicicleta i després ${m(fr(b))} <b>del que li queda</b> en un casc. Quina fracció dels estalvis li queda al final?`, camps:[cFrac(r)],
    res:[m(`Després de la bici li queda 1 − ${fr(a)} = ${fr(F(1).sub(a))}`), m(`El casc: ${fr(b)} de ${fr(F(1).sub(a))} = ${fr(b.mul(F(1).sub(a)))}`), m(`Li queda ${fr(F(1).sub(a))} − ${fr(b.mul(F(1).sub(a)))} = ${fr(r)}`)], v:{k:'fracfrac', a, b, r} };
}));

/* ─────────── 5. Tipus de nombres racionals ─────────── */
const TIPUS4=['enter','finit','pur','mixt'];
function fracTipus(t){
  return retry(() => {
    let f;
    if(t==='enter'){ const d=pick([2,3,4,5,6]), n=rand(2,9)*d; f=F(n,d); f.raw=[n,d]; }
    else if(t==='finit') f=F(numIrr(8,30), pick([2,4,5,8,10,20,25,40]));
    else if(t==='pur') f=F(rand(1,30), pick([3,9,11,7,33,99]));
    else f=F(rand(1,30), pick([6,12,15,18,30,45,22]));
    if(f.n===0 || tipusDec(f)!==t) return null;
    const e=expand(f); if(e.per.length>6) return null;
    return f;
  });
}
plantilla(5,'AS','5-classifica','Classificar un decimal (finit, pur, mixt)', () => {
  const t=pick(['finit','pur','mixt']), f=fracTipus(t), e=expand(f);
  const o={opcions:['Decimal finit','Periòdic pur','Periòdic mixt'], ok:['finit','pur','mixt'].indexOf(t)};
  const ex = t==='finit' ? 'Té un nombre limitat de xifres decimals.' : t==='pur' ? `El període (${e.per}) comença just després de la coma.` : `Entre la coma i el període (${e.per}) hi ha l’avantperíode (${e.ante}).`;
  return { enunciat:`Quin tipus de nombre decimal és ${m(decH(f))}?`, mc:o, pista:'Mira si té barret i on comença.', res:[ex], v:{k:'tipus', f, t} };
});
plantilla(5,'AS','5-fraccio-dec','De fracció a decimal (exacte)', () => {
  const f=fracTipus('finit');
  return { enunciat:`Escriu ${m(fr(f))} com a nombre decimal.`, camps:[cDec(f)], pista:'Divideix el numerador entre el denominador.',
    res:[m(`${f.n} : ${f.d} = ${decStr(f)}`), 'És un decimal finit.'], v:{k:'f2d', f, r:f} };
});
plantilla(5,'AS','5-dec-fraccio','De decimal exacte a fracció irreductible (0,125 = 1/8)', () => retry(() => {
  const d=pick([2,4,5,8,10,20,25,40,50]), f=F(numIrr(d, d*(coin(0.6)?1:5)-1), d);
  const e=decStr(f).split(',')[1].length, N=f.n*(10**e/f.d);
  return { enunciat:`Escriu ${m(decStr(f))} com a fracció irreductible.`, camps:[cFrac(f)], pista:'Posa el nombre sense coma a dalt i un 1 amb tants zeros com decimals a baix. Després simplifica.',
    res:[m(`${decStr(f)} = ${fracRaw(N,10**e)}${f.d!==10**e?' = '+fr(f):''}`)], v:{k:'d2f', s:decStr(f), r:f} };
}));
plantilla(5,'AS','5-periodic-mc','De fracció a decimal periòdic (opció múltiple)', () => {
  const f=pick([F(1,3),F(2,3),F(1,9),F(4,9),F(5,9),F(1,6),F(5,6),F(7,9),F(4,3),F(7,6),F(8,9)]), e=expand(f);
  const cand=[[e.ent,'',e.ante+e.per], [e.ent,e.ante+e.per,''], [e.ent,e.ante+e.per+e.per,''], [e.ent,'',e.per], [e.ent,e.per,''], [e.ent+1,e.ante,e.per]];
  const alt=cand.filter(([a,b,c])=>!valPer(a,b,c).eq(f)).map(([a,b,c])=>perH(false,a,b,c));
  const o=mc(decH(f), shuffle([...new Set(alt)]).slice(0,3));
  return { enunciat:`Quin nombre decimal és ${m(fr(f))}?`, mc:o, pista:'Fes la divisió i mira quines xifres es repeteixen.', res:[m(`${f.n} : ${f.d} = ${e.ent},${(e.ante+e.per+e.per+e.per).slice(0,6)}… = ${decH(f)}`)], v:{k:'per', f} };
});
plantilla(5,'AS','5-litre','Quantitats com a fracció de litre (750 ml = 3/4 L)', () => {
  const ml=coin(), q= ml ? pick([250,500,750,200,125,100,400,600,800,150]) : pick([33,25,75,50,20,70,40,10,5,15]);
  const f=F(q, ml?1000:100);
  return { enunciat:`Quina fracció de litre són ${q} ${ml?'ml':'cl'}? Dona la fracció irreductible.`, camps:[cFrac(f,{et:'Litres'})], pista:ml?'1 L = 1.000 ml':'1 L = 100 cl',
    res:[m(`${q} ${ml?'ml':'cl'} = ${fracRaw(q,ml?1000:100).replace('1000','1.000')} L${f.d!==(ml?1000:100)?' = '+fr(f)+' L':''}`)], v:{k:'litre', q, ml, r:f} };
});
/* fracció generatriu: mètode de classe x = …, ·10ⁿ, restar, aïllar */
function generatriu(neg, ent, ante, per){
  const a=ante.length, p=per.length;
  const num=Number(String(ent)+ante+per)-Number(String(ent)+ante), den=Number('9'.repeat(p)+'0'.repeat(a));
  const r=F(neg?-num:num, den);
  const x=perH(false,ent,ante,per);
  const tail = per+per;
  const shown = (pre,v)=>`${pre}${v}…`;
  const rows=[];
  const Ab=10**(a+p), Aa=10**a;
  const linia = (k,txt) => `${k===1?'':fmtInt(k)}<i>x</i> = ${txt}`;
  const vA = (()=>{ const s=String(ent)+ante+per; const i=String(ent).length+a+p; return `${Number(s.slice(0,i))},${tail}…`.replace(/^(\d+),/, (mm,d)=>fmtInt(Number(d))+','); })();
  const vB = a ? `${fmtInt(Number(String(ent)+ante))},${tail}…` : `${fmtInt(ent)},${tail}…`;
  rows.push(m(linia(1, `${x} = ${fmtInt(ent)},${ante}${tail}…`)));
  rows.push(m(`${linia(Ab, vA)}`));
  if(a) rows.push(m(`${linia(Aa, vB)}`));
  const mult = Ab - Aa;
  rows.push(`Restem: ${m(`${fmtInt(mult)}<i>x</i> = ${fmtInt(Number(String(ent)+ante+per))} − ${fmtInt(Number(String(ent)+ante))} = ${fmtInt(num)}`)}`);
  rows.push(m(`<i>x</i> = ${fracRaw(num,mult)}${F(num,mult).d!==mult?' = '+fr(F(num,mult)):''}`));
  if(neg) rows.push(`Com que el nombre és negatiu: ${m(perH(true,ent,ante,per)+' = '+fr(r))}`);
  if(mult!==den) throw new Error('generatriu');
  return {r, rows};
}
function genQ(neg, ent, ante, per, pista){
  const g=generatriu(neg,ent,ante,per);
  return { enunciat:`Troba la fracció generatriu de ${m(perH(neg,ent,ante,per))}. Simplifica-la.`, camps:[cFrac(g.r)], pista, res:g.rows, v:{k:'gen', s:perTxt(neg,ent,ante,per), r:g.r} };
}
const PISTA_GEN='Anomena x el nombre, multiplica per 10, 100… perquè els períodes quedin alineats, resta i aïlla x.';
plantilla(5,'AN','5-gen-pur','Generatriu d’un periòdic pur (0,7̄)', () => retry(() => {
  const ent=coin(0.6)?0:rand(1,5), p=coin(0.6)?String(rand(1,8)):String(rand(10,98));
  if(p.length===2 && p[0]===p[1]) return null;
  return genQ(false, ent, '', p, PISTA_GEN);
}));
plantilla(5,'AN','5-gen-mixt','Generatriu d’un periòdic mixt senzill (0,23̄)', () => retry(() => {
  const ent=coin(0.7)?0:rand(1,3), a=String(rand(1,9)), p=String(rand(1,8)); if(a===p) return null;
  return genQ(false, ent, a, p, PISTA_GEN);
}));
plantilla(5,'AN','5-parts','Part entera, avantperíode i període', () => retry(() => {
  const ent=rand(0,12), a=String(rand(1,99)), p=String(rand(1,98)); if(a.slice(-1)===p.slice(-1) || p==='9') return null;
  if(p.length===2 && p[0]===p[1]) return null;
  return { enunciat:`Escriu la part entera, l’avantperíode i el període de ${m(perH(false,ent,a,p))}.`, camps:[cDig(ent,{et:'Part entera'}), cDig(a,{et:'Avantperíode'}), cDig(p,{et:'Període'})],
    pista:'L’avantperíode són les xifres decimals que hi ha abans del barret; el període, les que van sota el barret.',
    res:[`Part entera: <b>${ent}</b> · avantperíode: <b>${a}</b> · període: <b>${p}</b>`, 'És un periòdic mixt.'], v:{k:'parts', ent, a, p} };
}));
plantilla(5,'AN','5-classifica','Classificar fraccions segons el decimal', () => {
  const ts=shuffle(TIPUS4), fs=ts.map(fracTipus);
  return { enunciat:'Fes les divisions i classifica cada fracció segons el nombre decimal que dona.', classifica:{cats:TIPUS4.map(t=>TIPUS_NOM[t]), items:fs.map(f=>({h:f.raw?fracRaw(...f.raw):fr(f), c:TIPUS4.indexOf(tipusDec(f))}))},
    pista:'Divideix el numerador entre el denominador.', res:fs.map(f=>`${m((f.raw?fracRaw(...f.raw):fr(f))+' = '+decH(f))} → ${TIPUS_NOM[tipusDec(f)]}`), v:{k:'classTipus', fs} };
});
plantilla(5,'AE','5-gen-llarg','Generatriu amb part entera i període de 2 xifres (2,38̄1̄)', () => retry(() => {
  const ent=rand(1,4), a=String(rand(1,9)), p=String(rand(10,98)); if(p[0]===p[1] || a===p[1]) return null;
  return genQ(false, ent, a, p, null);
}));
plantilla(5,'AE','5-gen-neg','Generatriu de periòdics negatius', () => retry(() => {
  const ent=rand(0,3), mix=coin(0.7), a=mix?String(rand(1,9)):'', p=coin()?String(rand(1,8)):String(rand(10,98));
  if(p.length===2&&p[0]===p[1]) return null; if(mix && a===p.slice(-1)) return null;
  return genQ(true, ent, a, p, null);
}));
plantilla(5,'AE','5-sense','Tipus de decimal sense dividir (mirant el denominador)', () => retry(() => {
  const t=pick(TIPUS4.slice(1)), f=fracTipus(t), k=rand(2,7), a=f.n*k, b=f.d*k; if(b>150 || f.isInt()) return null;
  const o={opcions:['Decimal finit','Periòdic pur','Periòdic mixt'], ok:['finit','pur','mixt'].indexOf(t)};
  const fd=factH(f.d);
  const ex = t==='finit' ? 'només té els factors 2 i/o 5: decimal finit' : t==='pur' ? 'no té ni 2 ni 5: periòdic pur' : 'té factors 2 o 5 i també altres primers: periòdic mixt';
  return { enunciat:`Sense fer la divisió, digues quin tipus de decimal és ${m(fracRaw(a,b))}.`, mc:o,
    res:[`Primer simplifiquem: ${m(fracRaw(a,b)+' = '+fr(f))}`, `${f.d} = ${fd}: ${ex}.`, m(`${fr(f)} = ${decH(f)}`)], v:{k:'tipus', f, t} };
}));

/* ─────────── 6. Potències (exponent natural o zero) ─────────── */
plantilla(6,'AS','6-enter','Potència d’un enter positiu (exponent 0 a 3)', () => retry(() => {
  const a=rand(2,10), n=rand(0,3); if(a**n>1000) return null;
  const e=W(a,n);
  return { enunciat:'Calcula:', gran:eh(e,false), camps:[cEnter(ev(e))], pista:n===0?'Qualsevol nombre (diferent de 0) elevat a 0 val 1.':`Multiplica la base ${a} per ella mateixa ${n} vegades.`,
    res:[n===0?m(`${sup(a,0)} = 1`):m(`${sup(a,n)} = ${Array(n).fill(a).join(' · ')} = ${fmtInt(a**n)}`)], v:{k:'expr', txt:et(e), r:ev(e)} };
}));
plantilla(6,'AS','6-fraccio','Potència d’una fracció positiva', () => retry(() => {
  const f=frIrr([2,3,4,5,6],1.4), n=rand(0,3); const e=W(f,n), r=ev(e); if(!amable(r,343,216)) return null;
  return { enunciat:'Calcula:', gran:eh(e,false), camps:[cFrac(r)], pista:'S’eleva el numerador i el denominador.',
    res:[n===0?m(`${eh(e,false)} = 1`):m(`${eh(e,false)} = <span class="frac"><span>${sup(f.n,n)}</span><span>${sup(f.d,n)}</span></span> = ${fr(r)}`)], v:{k:'expr', txt:et(e), r} };
}));
plantilla(6,'AS','6-concepte','Base, exponent, exponent 0 i 1 (opció múltiple)', () => {
  const k=pick(['base','exp','zero','un','zerob']);
  const a=rand(2,9), n=rand(2,6);
  if(k==='base'){ const o=mc(String(a), [String(n), String(a*n), fmtInt(a**n)]); return { enunciat:`Quina és la <b>base</b> de ${m(sup(a,n))}?`, mc:o, pista:'La base és el nombre que es multiplica; l’exponent diu quantes vegades.', res:[`La base és ${a} i l’exponent és ${n}: ${m(sup(a,n)+' = '+Array(n).fill(a).join(' · '))}.`], v:{k:'conc'} }; }
  if(k==='exp'){ const o=mc(String(n), [String(a), String(a*n), fmtInt(a**n)]); return { enunciat:`Quin és l’<b>exponent</b> de ${m(sup(a,n))}?`, mc:o, pista:'L’exponent és el nombre petit de dalt.', res:[`L’exponent és ${n}: la base ${a} es multiplica ${n} vegades.`], v:{k:'conc'} }; }
  if(k==='zero'){ const f=coin()?F(a):frIrr([3,5,7],1).neg(); const o=mc('1',['0',fr(f),'No es pot calcular']); return { enunciat:`Quant val ${m(eh(W(f,0),false))}?`, mc:o, pista:'Exponent zero.', res:[m(`${eh(W(f,0),false)} = 1`)+': tot nombre diferent de 0 elevat a 0 val 1.'], v:{k:'conc'} }; }
  if(k==='un'){ const f=frIrr([3,5,7],1.4); const o=mc(fr(f),['1','0',fr(f.inv())]); return { enunciat:`Quant val ${m(eh(W(f,1),false))}?`, mc:o, pista:'Exponent 1.', res:[m(`${eh(W(f,1),false)} = ${fr(f)}`)+': elevar a 1 deixa el nombre igual.'], v:{k:'conc'} }; }
  const o=mc('0',['1',String(n),'No es pot calcular']); return { enunciat:`Quant val ${m(sup(0,n))}?`, mc:o, pista:'Multiplica 0 per ell mateix.', res:[m(`${sup(0,n)} = ${Array(n).fill(0).join(' · ')} = 0`)], v:{k:'conc'} };
});
plantilla(6,'AN','6-negatiu','Base entera negativa (parell o senar)', () => retry(() => {
  const a=rand(2,6), n=rand(2,5); if(a**n>1300) return null;
  const e=W(-a,n), r=ev(e);
  return { enunciat:'Calcula:', gran:eh(e,false), camps:[cEnter(r)], pista:'Base negativa: exponent parell → resultat positiu; senar → negatiu.',
    res:[m(`${eh(e,false)} = ${Array(n).fill(par(fmtInt(-a))).join(' · ')} = ${fmtInt(r.n)}`), `L’exponent ${n} és ${n%2?'senar: resultat negatiu':'parell: resultat positiu'}.`], v:{k:'expr', txt:et(e), r} };
}));
plantilla(6,'AN','6-fracneg','Potència d’una fracció negativa', () => retry(() => {
  const f=frIrr([2,3,4,5],1.6).neg(), n=rand(2,4), e=W(f,n), r=ev(e); if(!amable(r,625,625)) return null;
  return { enunciat:'Calcula:', gran:eh(e,false), camps:[cFrac(r)], pista:'Primer el signe (parell o senar) i després numerador i denominador.',
    res:[m(`${eh(e,false)} = ${n%2?MENYS:''}<span class="frac"><span>${sup(Math.abs(f.n),n)}</span><span>${sup(f.d,n)}</span></span> = ${fr(r)}`), `Exponent ${n%2?'senar → negatiu':'parell → positiu'}.`], v:{k:'expr', txt:et(e), r} };
}));
plantilla(6,'AN','6-signe','Signe d’una potència de base negativa', () => {
  const a=rand(2,9), n=rand(7,25), f=coin()?F(-a):frIrr([3,5,7],1).neg();
  const o={opcions:['Positiu','Negatiu'], ok:n%2?1:0};
  return { enunciat:`Sense calcular-la, quin signe té ${m(eh(W(f,n),false))}?`, mc:o, pista:'Compta si l’exponent és parell o senar.',
    res:[`La base és negativa i l’exponent ${n} és ${n%2?'senar':'parell'}: el resultat és <b>${n%2?'negatiu':'positiu'}</b>.`], v:{k:'signe', f, n} };
});
plantilla(6,'AE','6-trampa','Trampes de signe: −2⁴ i (−2)⁴, −5⁰ i (−5)⁰', () => {
  const k=pick(['par','frac','zero']);
  let e1, e2;
  if(k==='par'){ const a=rand(2,5), n=pick([2,4]); e1=W(-a,n); e2=N(W(a,n)); }
  else if(k==='frac'){ const f=frIrr([2,3,4,5],1.4); e1=W(f.neg(),2); e2=N(W(f,2)); }
  else { const a=rand(2,9); e1=W(-a,0); e2=N(W(a,0)); }
  if(coin()) [e1,e2]=[e2,e1];
  const r1=ev(e1), r2=ev(e2);
  const expl = e => e.t==='N' ? `${m(eh(e,false))}: el menys no és a la base; primer la potència i després el signe.` : `${m(eh(e,false))}: la base és negativa (el menys és dins del parèntesi).`;
  return { enunciat:'Calcula les dues potències. Compte amb els parèntesis!', camps:[(r1.isInt()?cEnter:cFrac)(r1,{et:eh(e1,false), etMat:true}), (r2.isInt()?cEnter:cFrac)(r2,{et:eh(e2,false), etMat:true})],
    res:[expl(e1)+' '+m('= '+fr(r1)), expl(e2)+' '+m('= '+fr(r2))], v:{k:'expr2', txts:[et(e1),et(e2)], rs:[r1,r2]} };
});
plantilla(6,'AE','6-combinada','Potències dins d’operacions combinades', () => retry(() => {
  const a=rand(2,3), b=frIrr([2,3,4],1.4), c=rand(2,5);
  const e = pick([
    ()=>B('+', N(W(a,2)), B('·', W(-a,2), W(b,2))),
    ()=>B('−', B('·', W(b.neg(),3), c), W(-c,0)),
    ()=>B('+', B(':', N(W(a,2)), W(-a,2)), W(b,pick([0,1,2]))),
    ()=>B('·', P(B('−', W(b,2), N(W(c,0)))), W(-a,pick([2,3]))),
  ])();
  const q=exprQ(e, null, 99, 72); if(!q) return null;
  q.v.pot=true; return q;
}));
const VF6 = [
  () => { const a=rand(2,4), n=pick([2,4]); return {h:`${m(MENYS+sup(a,n))} = ${fmtInt(a**n)}`, v:false, e:`${m(MENYS+sup(a,n)+' = '+fmtInt(-(a**n)))}: primer la potència, després el menys.`}; },
  () => { const a=rand(2,4), n=3; return {h:`${m(par(fmtInt(-a))+'<sup>3</sup>')} = ${fmtInt(-(a**n))}`, v:true, e:'Exponent senar: es manté el signe negatiu.'}; },
  () => { const a=rand(2,9); return {h:`${m(MENYS+sup(a,0))} = 1`, v:false, e:`${m(MENYS+sup(a,0)+' = −1')}: el menys queda fora.`}; },
  () => { const a=rand(2,9); return {h:`${m(par(fmtInt(-a))+'<sup>0</sup>')} = 1`, v:true, e:'Tot nombre diferent de 0 elevat a 0 val 1.'}; },
  () => { const n=rand(2,9); return {h:`${m(sup(0,n))} = 0`, v:true, e:'0 multiplicat per ell mateix sempre dona 0.'}; },
  () => { const n=pick([10,20,50,100]); return {h:`${m(par('−1')+'<sup>'+n+'</sup>')} = −1`, v:false, e:`Exponent parell: ${m(par('−1')+'<sup>'+n+'</sup> = 1')}.`}; },
  () => { const f=frIrr([3,5,7],1); return {h:`${m(par(fr(f))+'<sup>3</sup>')} = ${m(fracRaw(f.n**3,f.d))}`, v:false, e:`S’eleva també el numerador: ${m(par(fr(f))+'<sup>3</sup> = '+fr(f.pow(3)))}.`}; },
  () => { const f=frIrr([3,4,5],1); return {h:`${m(par(fr(f.neg()))+'<sup>2</sup>')} = ${m(fr(f.pow(2).neg()))}`, v:false, e:`Exponent parell: el resultat és positiu, ${m(fr(f.pow(2)))}.`}; },
  () => { const f=frIrr([3,4,5],1); return {h:`${m(MENYS+par(fr(f))+'<sup>2</sup>')} = ${m(fr(f.pow(2).neg()))}`, v:true, e:'El menys és fora del parèntesi: es calcula la potència i després es canvia el signe.'}; },
  () => { const a=rand(2,5); return {h:`${m(sup(a,3))} = ${a*3}`, v:false, e:`${m(sup(a,3)+' = '+a+' · '+a+' · '+a+' = '+a**3)}, no ${a} · 3.`}; },
];
plantilla(6,'AE','6-vf','Vertader o fals de potències amb trampa', () => {
  const af=vfDe(VF6);
  return { enunciat:'Digues si cada igualtat és vertadera o falsa.', vf:af.map(a=>({h:a.h, v:a.v})), res:af.map(a=>`${a.v?'<b>V</b>':'<b>F</b>'} · ${a.e}`), v:{k:'vf'} };
});

/* ─────────── 7. Arrels ─────────── */
const radF = f => F(f).d===1 ? fmtInt(F(f).n) : fr(f);
function arrelQ(idx, rad, opts={}){
  /* rad: Fr; idx: 2..5 */
  rad=F(rad);
  const parell=idx%2===0;
  let r;
  if(rad.n<0 && parell) r={no:true};
  else {
    const abs=rad.abs(); let base=null;
    for(let n=0;n<=40 && !base;n++) for(let d=1; d<=40; d++){ const c=F(n,d); if(c.pow(idx).eq(abs)){ base=c; break; } }
    if(!base) throw new Error('arrel no exacta');
    if(rad.n===0) r={v:F(0)};
    else if(parell) r={v:base, pm:true};
    else r={v:rad.n<0?base.neg():base};
  }
  const h = rootH(idx, opts.radH || radF(rad));
  const nomI = idx===2?'quadrada':idx===3?'cúbica':`d’índex ${idx}`;
  const res = r.no ? [`${m(h)} <b>no existeix</b> en ℚ: cap nombre elevat a ${idx} (parell) no dona un resultat negatiu.`]
    : r.pm ? [`${m(h)} = ${m('±'+fr(r.v))}, perquè ${m(par(fr(r.v))+'<sup>'+idx+'</sup> = '+radF(rad))} i ${m(par(fr(r.v.neg()))+'<sup>'+idx+'</sup> = '+radF(rad))}.`, `Índex parell i radicand positiu: <b>dues arrels</b>.`]
    : rad.n===0 ? [`${m(h+' = 0')}: el zero només té una arrel.`]
    : [`${m(h+' = '+fr(r.v))}, perquè ${m(frp(r.v)+'<sup>'+idx+'</sup> = '+radF(rad))}.`, `Índex senar: <b>una sola arrel</b>, amb el signe del radicand.`];
  return { enunciat:opts.enunciat||`Calcula ${idx===2?'l’arrel quadrada':'l’arrel '+nomI}:`, gran:h,
    camps:[cArrel(r,{forma:(F(rad).d!==1||opts.frac)?'frac':'enter', permetNo:opts.permetNo!==false})], pista:opts.pista, res, v:{k:'arrel', idx, rad, r} };
}
plantilla(7,'AS','7-quadrada','Arrel quadrada d’un quadrat perfecte (±)', () => { const n=rand(1,15); return arrelQ(2, n*n, {permetNo:false, pista:'Quin nombre multiplicat per ell mateix dona el radicand? Recorda que n’hi ha dos.'}); });
plantilla(7,'AS','7-cubica','Arrel cúbica d’un cub perfecte', () => { const n=rand(1,6), s=coin(0.3)?-1:1; return arrelQ(3, s*n**3, {permetNo:false, pista:'Quin nombre multiplicat tres vegades per ell mateix dona el radicand? Només n’hi ha un.'}); });
plantilla(7,'AS','7-quantes','Quantes arrels té? (dues, una o cap)', () => {
  const k=pick(['pos','zero','neg','cub']); const n=rand(2,12);
  if(k==='cub'){ const c=-pick([8,27,64,125]); const o={opcions:['Dues','Una','Cap (no existeix en ℚ)'], ok:1}; return { enunciat:`Quantes arrels cúbiques té ${m(fmtInt(c))}?`, mc:o, pista:'Índex senar.', res:[`Una: ${m(rootH(3,fmtInt(c))+' = '+fmtInt(-Math.round(Math.cbrt(-c))))}. L’arrel cúbica sempre existeix i en té una.`], v:{k:'quantes'} }; }
  const rad = k==='pos'?n*n : k==='zero'?0 : -n*n;
  const o={opcions:['Dues','Una','Cap (no existeix en ℚ)'], ok:k==='pos'?0:k==='zero'?1:2};
  const ex = k==='pos' ? `Dues: ${m(rootH(2,rad)+' = ±'+n)}.` : k==='zero' ? `Una: ${m(rootH(2,0)+' = 0')}.` : `Cap: cap nombre al quadrat dona negatiu, així que ${m(rootH(2,fmtInt(rad)))} no existeix en ℚ.`;
  return { enunciat:`Quantes arrels quadrades té ${m(fmtInt(rad))}?`, mc:o, pista:'Radicand positiu → dues; zero → una; negatiu → cap.', res:[ex], v:{k:'quantes'} };
});
plantilla(7,'AN','7-fraccio','Arrel quadrada d’una fracció (±7/4)', () => retry(() => { const f=frIrr([2,3,4,5,6,7,8,9,10,11],1.6); if(f.n>12) return null; return arrelQ(2, f.pow(2), {pista:'Arrel del numerador entre arrel del denominador. I el ±!'}); }));
plantilla(7,'AN','7-cubfrac','Arrel cúbica d’una fracció (∛(−27/64) = −3/4)', () => { const f=frIrr([2,3,4,5],1.3).mul(coin(0.6)?-1:1); return arrelQ(3, f.pow(3), {pista:'Índex senar: una arrel, amb el signe del radicand.'}); });
plantilla(7,'AN','7-existeix','Existeix o no? (radicand negatiu, zero)', () => {
  const k=pick(['neg','neg','pos','zero','cub']), n=rand(2,10);
  if(k==='cub'){ const c=rand(2,5); return arrelQ(3, -(c**3), {pista:'Fixa’t en l’índex i en el signe del radicand.'}); }
  return arrelQ(2, k==='neg'?-n*n:k==='zero'?0:n*n, {pista:'Fixa’t en l’índex i en el signe del radicand.'});
});
plantilla(7,'AE','7-index45','Arrels d’índex 4 i 5 (existeixen o no?)', () => retry(() => {
  const idx=pick([4,5]), f = coin(0.6) ? F(rand(1,3)) : frIrr([2,3],1.6), s=coin(0.5)?-1:1;
  if(f.n>3) return null; const rad=f.pow(idx).mul(s); if(Math.abs(rad.n)>243||rad.d>243) return null;
  return arrelQ(idx, rad, {});
}));
const pw2 = (b,n) => `${par(b)}<sup>${n}</sup>`;
const IRR = [
  {h:rootH(2,'25'), r:true, e:`25 = 5<sup>2</sup>, així que ${m(rootH(2,'25')+' = ±5')}`},
  {h:rootH(2,fracRaw(4,9)), r:true, e:`${m(fracRaw(4,9)+' = '+pw2(fracRaw(2,3),2))}, així que ${m(rootH(2,fracRaw(4,9))+' = ±'+fracRaw(2,3))}`},
  {h:rootH(2,'0,49'), r:true, e:`${m('0,49 = '+fracRaw(49,100)+' = '+pw2(fracRaw(7,10),2))}, així que ${m(rootH(2,'0,49')+' = ±0,7')}`},
  {h:rootH(2,'1,44'), r:true, e:`${m('1,44 = '+fracRaw(144,100)+' = '+pw2(fracRaw(12,10),2))}, així que ${m(rootH(2,'1,44')+' = ±1,2')}`},
  {h:rootH(3,'−8'), r:true, e:`${m(par('−2')+'<sup>3</sup> = −8')}, així que ${m(rootH(3,'−8')+' = −2')}`},
  {h:rootH(2,fracRaw(9,16)), r:true, e:`${m(fracRaw(9,16)+' = '+pw2(fracRaw(3,4),2))}, així que ${m(rootH(2,fracRaw(9,16))+' = ±'+fracRaw(3,4))}`},
  {h:rootH(2,'7'), r:false, e:'7 no és un quadrat perfecte'},
  {h:rootH(2,'2'), r:false, e:'2 no és un quadrat perfecte'},
  {h:rootH(2,'12'), r:false, e:'12 no és un quadrat perfecte (3<sup>2</sup> = 9 i 4<sup>2</sup> = 16)'},
  {h:'π', r:false, e:'π té infinites xifres decimals no periòdiques'},
  {h:rootH(2,fracRaw(2,9)), r:false, e:'el numerador 2 no és un quadrat perfecte'},
  {h:rootH(3,'10'), r:false, e:'10 no és un cub perfecte'},
];
plantilla(7,'AE','7-racional','Racional o irracional (classificar)', () => {
  const it=shuffle(IRR.filter(x=>x.r)).slice(0,3).concat(shuffle(IRR.filter(x=>!x.r)).slice(0,2));
  const items=shuffle(it);
  return { enunciat:'Classifica cada nombre: és racional o irracional?', classifica:{cats:['Racional','Irracional'], items:items.map(x=>({h:m(x.h), c:x.r?0:1}))},
    res:items.map(x=>`${m(x.h)}: ${x.r?'racional':'irracional'}, perquè ${x.e}.`), v:{k:'irr'} };
});
plantilla(7,'AE','7-justifica','Racional o irracional: tria la justificació', () => {
  const x=pick(IRR.filter(y=>y.h!=='π'));
  const ok = `${x.r?'Racional':'Irracional'}, perquè ${x.e}.`;
  const dist = x.r
    ? ['Irracional, perquè té una arrel.', 'Irracional, perquè el radicand no és un nombre natural.', 'Racional, perquè totes les arrels són racionals.']
    : ['Racional, perquè el radicand és un nombre racional.', 'Racional, perquè totes les arrels són racionals.', 'Irracional, perquè el radicand és negatiu.'];
  const o=mc(ok, dist);
  return { enunciat:`Quina és la classificació correcta de ${m(x.h)}?`, mc:o, res:[ok, 'Una arrel és racional només si el radicand és una potència perfecta (d’enters o de fraccions).'], v:{k:'irr'} };
});

/* ═══════════════════ Correcció ═══════════════════ */
function parseInt_(s){
  s=String(s||'').trim().replace(/[−–]/g,'-').replace(/\s/g,'');
  if(/^-?\d{1,3}(\.\d{3})+$/.test(s)) s=s.replace(/\./g,'');
  if(!/^-?\d+$/.test(s)) return null;
  const n=Number(s); return Number.isSafeInteger(n)?n:null;
}
function parseDec(s){
  s=String(s||'').trim().replace(/[−–]/g,'-').replace(/\s/g,'').replace(',', '.');
  const mm=/^(-?)(\d*)(?:\.(\d+))?$/.exec(s); if(!mm || (mm[2]===''&&!mm[3])) return null;
  const dec=mm[3]||''; const n=Number((mm[2]||'0')+dec); if(!Number.isSafeInteger(n)||dec.length>9) return null;
  return F((mm[1]?-1:1)*n, 10**dec.length);
}
/* raw: {s:'+'|'-'|'pm'|'', n, d, t, no} → {p: 0 | 0.5 | 1, msg} */
function avaluaCamp(c, raw){
  raw=raw||{};
  if(c.tipus==='dig'){ const t=String(raw.t||'').replace(/\s/g,''); return t===c.s ? {p:1} : {p:0}; }
  if(c.tipus==='arrel'){
    if(raw.no) return c.no ? {p:1} : {p:0, msg:'Sí que existeix.'};
    if(c.no) return {p:0, msg:'Aquesta arrel no existeix en ℚ.'};
  }
  let val, nn=null, dd=1;
  if(c.tipus==='dec'){ val=parseDec(raw.t); if(!val) return {p:0, buit:!String(raw.t||'').trim()}; }
  else {
    nn=parseInt_(raw.n); if(nn===null) return {p:0, buit:!String(raw.n||'').trim()};
    if((c.tipus==='frac'||c.tipus==='arrel') && String(raw.d||'').trim()!==''){ dd=parseInt_(raw.d); if(dd===null||dd===0) return {p:0}; }
    val=F(nn,dd);
  }
  const sg = raw.s==='-' ? -1 : 1;
  if(c.tipus==='arrel'){
    const pm=raw.s==='pm';
    if(c.pm && !pm){ return {p:0, msg:'Falta el ±: un radicand positiu té dues arrels quadrades (d’índex parell).'}; }
    if(!c.pm && pm){ return {p:0, msg: c.v.n===0 ? 'El 0 només té una arrel.' : 'Amb índex senar només hi ha una arrel.'}; }
    if(!pm) val=val.mul(sg);
    const okV = pm ? val.abs().eq(c.v.abs()) : val.eq(c.v);
    if(!okV) return {p:0};
  } else {
    val=val.mul(sg);
    if(!val.eq(c.v)) return {p:0};
  }
  if(c.simp && (c.tipus==='frac'||c.tipus==='arrel') && (gcd(nn,dd)!==1 || dd<0)) return {p:0.5, msg:'Correcte, però simplifica-la.'};
  return {p:1};
}
function avalua(q, raw){
  if(q.mc){ return {p: raw===q.mc.ok ? 1 : 0}; }
  if(q.vf){ const bons=q.vf.filter((a,i)=>raw && raw[i]===a.v).length; return {p:bons/q.vf.length, bons, total:q.vf.length}; }
  if(q.ordena){ const ok=raw && raw.length===q.ordena.ok.length && raw.every((x,i)=>q.ordena.items[x]===q.ordena.items[q.ordena.ok[i]]); return {p:ok?1:0}; }
  if(q.classifica){ const bons=q.classifica.items.filter((it,i)=>raw && raw[i]===it.c).length; return {p:bons/q.classifica.items.length, bons, total:q.classifica.items.length}; }
  const det=q.camps.map((c,i)=>avaluaCamp(c, raw && raw[i]));
  return {p:det.reduce((s,d)=>s+d.p,0)/det.length, det};
}
/* resposta correcta en forma "raw" (per a la prova automàtica) */
function rawCorrecte(q, desimplificada){
  if(q.mc) return q.mc.ok;
  if(q.vf) return q.vf.map(a=>a.v);
  if(q.ordena) return q.ordena.ok.slice();
  if(q.classifica) return q.classifica.items.map(it=>it.c);
  return q.camps.map(c=>{
    if(c.tipus==='dig') return {t:c.s};
    if(c.tipus==='dec') return {t:decStr(c.v).replace(MENYS,'-').replace(/\./g,'')};
    if(c.tipus==='arrel' && c.no) return {no:true};
    const v=c.v, k=desimplificada?2:1;
    const s = c.tipus==='arrel' && c.pm ? 'pm' : v.n<0 ? '-' : '+';
    return {s, n:String(Math.abs(v.n)*k), d:String(v.d*k)};
  });
}
/* com s'escriu la solució (per al missatge d'incorrecte) */
function solucioH(q){
  if(q.mc) return q.mc.opcions[q.mc.ok];
  if(q.camps) return q.camps.map(c=>{
    const et = c.et && q.camps.length>1 ? (c.etMat? m(c.et) : c.et)+': ' : '';
    if(c.tipus==='dig') return et+c.s;
    if(c.tipus==='dec') return et+m(decStr(c.v));
    if(c.tipus==='arrel') return et+(c.no?'no existeix':m((c.pm?'±':'')+fr(c.pm?c.v.abs():c.v)));
    return et+m(fr(c.v));
  }).join(' · ');
  return '';
}

/* ═══════════════════ Generació de proves ═══════════════════ */
const APARTATS = ['Definició i conjunts','Equivalents i simplificació','Operacions','Part d’un total i %','Tipus de racionals','Potències','Arrels'];
const NIVELLS = {
  AS:{nom:'AS', llarg:'Assoliment satisfactori', desc:'Un sol pas, molts d’opció múltiple. Amb pista.', pista:true},
  AN:{nom:'AN', llarg:'Assoliment notable', desc:'Resposta oberta, 2 o 3 passos, amb negatius. Pista opcional.', pista:true},
  AE:{nom:'AE', llarg:'Assoliment excel·lent', desc:'Molts passos, problemes i «troba l’error». Sense pista.', pista:false},
};
const plantillesDe = (ap,niv) => T.filter(t=>t.ap===ap && t.niv===niv);
function genera(t){
  const q=t.gen();
  q.ap=t.ap; q.niv=t.niv; q.id=t.id; q.nom=t.nom;
  return q;
}
/* tria k plantilles diferents (si n'hi ha prou) i genera'n preguntes */
function deApartat(ap, niv, k){
  const ts=plantillesDe(ap,niv); const out=[]; let bossa=[];
  for(let i=0;i<k;i++){ if(!bossa.length) bossa=shuffle(ts); out.push(genera(bossa.pop())); }
  return out;
}
const SIMULACRE = [1,2,2,2,2,2,1];   /* 12 preguntes */
function prova(niv, mode, aps){
  if(mode==='simulacre') return SIMULACRE.flatMap((k,i)=>deApartat(i+1, niv, k));
  const n=aps.length, per = n===1 ? 8 : Math.max(2, Math.round(12/n));
  return aps.flatMap(ap=>deApartat(ap, niv, per));
}

const MOTOR = {Fr, F, gcd, lcm, T, APARTATS, NIVELLS, plantillesDe, genera, prova, avalua, avaluaCamp, rawCorrecte, expand, decStr, tipusDec, ev, et, parseDec, parseInt_};
if(typeof module!=='undefined' && module.exports){ module.exports = MOTOR; }
if(typeof document==='undefined') return;

/* ═══════════════════ Interfície ═══════════════════ */
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const app = $('#app');
window.RepasRacionals = MOTOR;   /* per a proves des de la consola */
const st = MOTOR.estat = {niv:'AS', mode:'apartats', aps:[1,2,3,4,5,6,7], qs:[], i:0, punts:[], fet:false, pistes:0};
const DESA='repas-racionals';
/* Formulari de Google on s'envia el resultat en acabar (en segon pla).
   Buit = no s'envia res i no es demana el nom a l'inici. Es configura amb l'enllaç
   «emplenat prèviament» del formulari: url = …/formResponse i un entry.N per camp. */
const FORMULARI = {
  url: 'https://docs.google.com/forms/d/e/1FAIpQLScj9qFsbQWPOqOr7ClW3s-fgHm57pH16figTfjJ_HcWH2iaQw/formResponse',
  camps: { nom:'entry.1360789373', grup:'entry.388389291', nivell:'entry.634011608', mode:'entry.1437789598',
           nota:'entry.1477433729', apartats:'entry.147403560', detall:'entry.950916433', codi:'entry.531152409' },
  grups: ['E3A','E3D'],   /* han de coincidir amb les opcions de la pregunta Grup del formulari */
};
const ambFormulari = () => !!FORMULARI.url;
function enviaFormulari(d){
  if(!ambFormulari()) return Promise.resolve(false);
  const cos=new URLSearchParams();
  for(const [k,entry] of Object.entries(FORMULARI.camps)) if(entry) cos.append(entry, d[k]==null?'':String(d[k]));
  return fetch(FORMULARI.url, {method:'POST', mode:'no-cors', body:cos}).then(()=>true, ()=>false);
}
function llegeix(){ try{ return JSON.parse(localStorage.getItem(DESA)||'{}')||{}; }catch(e){ return {}; } }
function desa(o){ try{ localStorage.setItem(DESA, JSON.stringify(Object.assign(llegeix(),o))); }catch(e){} }
(function(){ const d=llegeix(); if(NIVELLS[d.niv]) st.niv=d.niv; if(d.mode==='simulacre'||d.mode==='apartats') st.mode=d.mode; if(Array.isArray(d.aps) && d.aps.length && d.aps.every(a=>a>=1&&a<=7)) st.aps=d.aps; })();

function inici(){
  const d=llegeix(), millors=d.millors||{};
  app.innerHTML = `
  <section class="rp-card">
    <h2 class="rp-h2">1. Tria el nivell</h2>
    <div class="rp-nivells" role="radiogroup" aria-label="Nivell">
      ${Object.values(NIVELLS).map(n=>`<button type="button" class="rp-niv" role="radio" data-niv="${n.nom}" aria-checked="${st.niv===n.nom}">
        <span class="rp-niv-sigla">${n.nom}</span><span class="rp-niv-nom">${n.llarg}</span><span class="rp-niv-desc">${n.desc}</span>
        ${millors[n.nom+'-simulacre']!=null?`<span class="rp-niv-millor">Millor simulacre: ${String(millors[n.nom+'-simulacre']).replace('.',',')}</span>`:''}</button>`).join('')}
    </div>
    <h2 class="rp-h2">2. Tria el mode</h2>
    <div class="rp-modes" role="radiogroup" aria-label="Mode">
      <button type="button" class="rp-mode" role="radio" data-mode="apartats" aria-checked="${st.mode==='apartats'}"><b>Per apartats</b><span>Tria què vols repassar</span></button>
      <button type="button" class="rp-mode" role="radio" data-mode="simulacre" aria-checked="${st.mode==='simulacre'}"><b>Simulacre</b><span>12 preguntes de tot el tema, com un examen</span></button>
    </div>
    <div class="rp-aps" id="aps" ${st.mode==='apartats'?'':'hidden'}>
      <div class="rp-aps-cap"><span>Apartats</span><button type="button" class="enllac" id="tots">${st.aps.length===7?'Cap':'Tots'}</button></div>
      <div class="rp-aps-llista">${APARTATS.map((a,i)=>`<label class="rp-ap"><input type="checkbox" value="${i+1}" ${st.aps.includes(i+1)?'checked':''}><span class="rp-ap-n">${i+1}</span><span>${a}</span></label>`).join('')}</div>
    </div>
    <p class="rp-avis" id="avis" hidden>Tria almenys un apartat.</p>
    ${ambFormulari()?`<h2 class="rp-h2">3. Qui ets?</h2>
    <p class="rp-qui-nota">En acabar, el resultat s’envia a la teva professora.</p>
    <div class="rp-desa-camps rp-qui">
      <label><span>Nom i cognoms</span><input id="nomIn" autocomplete="off" maxlength="60" value="${esc(st.nom||'')}"></label>
      <label><span>Grup</span><select id="grupIn"><option value="">—</option>${FORMULARI.grups.map(g=>`<option${st.grup===g?' selected':''}>${g}</option>`).join('')}</select></label>
    </div>
    <p class="rp-avis" id="avisQui" hidden>Escriu el teu nom i el grup.</p>`:''}
    <div class="rp-comenca"><button type="button" class="boto boto-principal rp-gran" id="comenca">Comença →</button></div>
  </section>`;
  app.querySelectorAll('.rp-niv').forEach(b=>b.onclick=()=>{ st.niv=b.dataset.niv; app.querySelectorAll('.rp-niv').forEach(x=>x.setAttribute('aria-checked', x===b)); });
  app.querySelectorAll('.rp-mode').forEach(b=>b.onclick=()=>{ st.mode=b.dataset.mode; app.querySelectorAll('.rp-mode').forEach(x=>x.setAttribute('aria-checked', x===b)); $('#aps').hidden = st.mode!=='apartats'; });
  const llegeixAps = () => { st.aps=[...app.querySelectorAll('.rp-ap input')].filter(x=>x.checked).map(x=>+x.value); $('#tots').textContent = st.aps.length===7?'Cap':'Tots'; };
  app.querySelectorAll('.rp-ap input').forEach(x=>x.onchange=llegeixAps);
  $('#tots').onclick=()=>{ const tots=st.aps.length!==7; app.querySelectorAll('.rp-ap input').forEach(x=>x.checked=tots); llegeixAps(); };
  $('#comenca').onclick=()=>{ if(st.mode==='apartats' && !st.aps.length){ $('#avis').hidden=false; return; }
    if(ambFormulari()){ st.nom=$('#nomIn').value.trim(); st.grup=$('#grupIn').value.trim(); if(!st.nom||!st.grup){ $('#avisQui').hidden=false; $('#nomIn').focus(); return; } }
    comenca(); };
  window.scrollTo(0,0);
}
function comenca(){
  desa({niv:st.niv, mode:st.mode, aps:st.aps});
  st.qs=prova(st.niv, st.mode, st.aps); st.i=0; st.punts=[]; st.data=null; pregunta();
}

/* ─── controls de resposta ─── */
function campH(c, i){
  const et = c.et ? `<span class="rp-camp-et">${c.etMat? m(c.et)+' =' : c.et}</span>` : '';
  if(c.tipus==='dig') return `<div class="rp-camp" data-i="${i}">${et}<input class="box rp-box rp-ample" inputmode="numeric" autocomplete="off" aria-label="${esc(c.et||'resposta')}"></div>`;
  const signes = c.tipus==='arrel' ? ['+','-','pm'] : ['+','-'];
  const sH = `<span class="rp-signe" role="group" aria-label="Signe">${signes.map(s=>`<button type="button" data-s="${s}" aria-pressed="${s==='+'&&c.tipus!=='arrel'}" aria-label="${s==='+'?'positiu':s==='-'?'negatiu':'més o menys'}">${s==='+'?'+':s==='-'?'−':'±'}</button>`).join('')}</span>`;
  let cos;
  if(c.tipus==='dec') cos=`<input class="box rp-box rp-ample" inputmode="decimal" autocomplete="off" aria-label="nombre decimal" placeholder="0,0">`;
  else if(c.tipus==='enter' || (c.tipus==='arrel' && c.forma==='enter')) cos=`<input class="box rp-box" data-r="n" inputmode="numeric" autocomplete="off" aria-label="nombre">`;
  else cos=`<span class="rp-fin"><input class="box rp-box" data-r="n" inputmode="numeric" autocomplete="off" aria-label="numerador"><span class="rp-ratlla"></span><input class="box rp-box" data-r="d" inputmode="numeric" autocomplete="off" aria-label="denominador"></span>`;
  const no = c.tipus==='arrel' && c.permetNo ? `<button type="button" class="rp-no" aria-pressed="false">No existeix en ℚ</button>` : '';
  return `<div class="rp-camp" data-i="${i}">${et}<span class="rp-entrada">${sH}${cos}</span>${no}</div>`;
}
function respostaH(q){
  if(q.mc) return `<div class="rp-opcions${q.mc.opcions.some(o=>o.length>60)?' rp-llarg':''}">${q.mc.opcions.map((o,i)=>`<button type="button" class="rp-op" data-i="${i}"><span class="rp-op-lletra">${'ABCD'[i]}</span><span>${o}</span></button>`).join('')}</div>`;
  if(q.vf) { const [a,b]=q.vfEt||['V','F']; return `<div class="rp-vf">${q.vf.map((x,i)=>`<div class="rp-vf-fila" data-i="${i}"><span class="rp-vf-h">${x.h}</span><span class="rp-seg"><button type="button" data-v="1" aria-pressed="false">${a==='V'?'Vertader':a}</button><button type="button" data-v="0" aria-pressed="false">${b==='F'?'Fals':b}</button></span></div>`).join('')}</div>`; }
  if(q.classifica) return `<div class="rp-vf">${q.classifica.items.map((x,i)=>`<div class="rp-vf-fila" data-i="${i}"><span class="rp-vf-h">${m(x.h)}</span><span class="rp-seg">${q.classifica.cats.map((c,j)=>`<button type="button" data-v="${j}" aria-pressed="false">${c}</button>`).join('')}</span></div>`).join('')}</div>`;
  if(q.ordena) return `<p class="rp-ord-et">↑ més petit</p><ol class="rp-ord" id="ord">${shuffleNoOk(q.ordena).map(i=>`<li class="rp-ord-it" data-k="${i}"><span class="rp-ord-mans" aria-hidden="true">⠿</span><span class="mt">${q.ordena.items[i]}</span><span class="rp-ord-btns"><button type="button" data-d="-1" aria-label="Puja">▲</button><button type="button" data-d="1" aria-label="Baixa">▼</button></span></li>`).join('')}</ol><p class="rp-ord-et">↓ més gran</p>`;
  return `<div class="rp-camps">${q.camps.map(campH).join('')}</div>`;
}
function shuffleNoOk(o){ for(let k=0;k<20;k++){ const s=shuffle(o.ok); if(s.some((x,i)=>x!==o.ok[i])) return s; } return o.ok.slice().reverse(); }

function pregunta(){
  const q=st.qs[st.i], N_=st.qs.length; st.fet=false; st.pista=false;
  const pista = NIVELLS[st.niv].pista && q.pista;
  app.innerHTML = `
  <div class="rp-barra">
    <span class="rp-xip rp-x-${st.niv}">${st.niv}</span>
    <span class="rp-prog-text">Pregunta <b>${st.i+1}</b> de ${N_}</span>
    <button type="button" class="enllac" id="surt">Surt</button>
  </div>
  <div class="rp-prog" role="progressbar" aria-valuemin="0" aria-valuemax="${N_}" aria-valuenow="${st.i}"><span style="width:${st.i/N_*100}%"></span></div>
  <section class="rp-card rp-preg">
    <span class="rp-ap-tag">${q.ap}. ${APARTATS[q.ap-1]}</span>
    <p class="rp-enunciat">${q.enunciat}</p>
    ${q.gran?`<div class="rp-gran-mt mt">${q.gran}</div>`:''}
    ${q.taula?`<div class="rp-taula">${q.taula.map(l=>`<div>${l}</div>`).join('')}</div>`:''}
    <div class="rp-resposta" id="resp">${respostaH(q)}</div>
    ${pista?`<div class="rp-pista" id="pista" hidden><b>Pista.</b> ${q.pista}</div>`:''}
    <div id="fb"></div>
    <div class="rp-accions" id="acc">
      ${pista?`<button type="button" class="boto" id="bPista">💡 Pista</button>`:''}
      <button type="button" class="boto boto-principal" id="bComprova">Comprova</button>
    </div>
  </section>`;
  $('#surt').onclick=()=>{ inici(); };
  if(pista) $('#bPista').onclick=()=>{ $('#pista').hidden=false; $('#bPista').remove(); };
  $('#bComprova').onclick=comprova;
  enllacaControls(q);
  const primer=app.querySelector('#resp input'); if(primer && matchMedia('(pointer:fine)').matches) primer.focus();
}
function enllacaControls(q){
  const R=$('#resp');
  R.querySelectorAll('.rp-signe').forEach(g=>g.querySelectorAll('button').forEach(b=>b.onclick=()=>{ if(st.fet) return; g.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed', x===b)); const no=g.closest('.rp-camp').querySelector('.rp-no'); if(no) no.setAttribute('aria-pressed','false'); }));
  R.querySelectorAll('.rp-no').forEach(b=>b.onclick=()=>{ if(st.fet) return; const on=b.getAttribute('aria-pressed')!=='true'; b.setAttribute('aria-pressed',on); const c=b.closest('.rp-camp'); c.classList.toggle('rp-off',on); });
  R.querySelectorAll('input').forEach(x=>x.addEventListener('keydown',ev_=>{ if(ev_.key==='Enter'){ ev_.preventDefault(); st.fet ? seguent() : comprova(); } }));
  R.querySelectorAll('.rp-op').forEach(b=>b.onclick=()=>{ if(st.fet) return; R.querySelectorAll('.rp-op').forEach(x=>x.setAttribute('aria-pressed', x===b)); });
  R.querySelectorAll('.rp-seg').forEach(g=>g.querySelectorAll('button').forEach(b=>b.onclick=()=>{ if(st.fet) return; g.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed', x===b)); }));
  if(q.ordena) arrossega($('#ord'));
}
/* ordenar: arrossegar (ratolí o dit) o amb les fletxes */
function arrossega(ol){
  ol.querySelectorAll('.rp-ord-btns button').forEach(b=>b.onclick=()=>{ if(st.fet) return; const li=b.closest('li'), d=+b.dataset.d;
    if(d<0 && li.previousElementSibling) ol.insertBefore(li, li.previousElementSibling);
    if(d>0 && li.nextElementSibling) ol.insertBefore(li.nextElementSibling, li); });
  let drag=null, dy=0;
  ol.addEventListener('pointerdown', e=>{
    if(st.fet || e.target.closest('button')) return;
    const li=e.target.closest('li'); if(!li) return;
    drag=li; dy=e.clientY; li.classList.add('rp-drag'); li.setPointerCapture(e.pointerId); e.preventDefault();
  });
  ol.addEventListener('pointermove', e=>{
    if(!drag) return;
    drag.style.transform=`translateY(${e.clientY-dy}px)`;
    const sibs=[...ol.children].filter(x=>x!==drag);
    for(const s of sibs){ const r=s.getBoundingClientRect(), mid=r.top+r.height/2;
      const dr=drag.getBoundingClientRect(), dm=dr.top+dr.height/2;
      if(s===drag.previousElementSibling && dm<mid){ const before=drag.getBoundingClientRect().top; ol.insertBefore(drag,s); dy+=drag.getBoundingClientRect().top-before; drag.style.transform=`translateY(${e.clientY-dy}px)`; break; }
      if(s===drag.nextElementSibling && dm>mid){ const before=drag.getBoundingClientRect().top; ol.insertBefore(s,drag); dy+=drag.getBoundingClientRect().top-before; drag.style.transform=`translateY(${e.clientY-dy}px)`; break; }
    }
  });
  const fi=()=>{ if(!drag) return; drag.style.transform=''; drag.classList.remove('rp-drag'); drag=null; };
  ol.addEventListener('pointerup', fi); ol.addEventListener('pointercancel', fi);
}
function llegeixRaw(q){
  const R=$('#resp');
  if(q.mc){ const b=R.querySelector('.rp-op[aria-pressed="true"]'); return b?+b.dataset.i:null; }
  if(q.vf) return [...R.querySelectorAll('.rp-vf-fila')].map(f=>{ const b=f.querySelector('button[aria-pressed="true"]'); return b? b.dataset.v==='1' : null; });
  if(q.classifica) return [...R.querySelectorAll('.rp-vf-fila')].map(f=>{ const b=f.querySelector('button[aria-pressed="true"]'); return b? +b.dataset.v : null; });
  if(q.ordena) return [...R.querySelectorAll('.rp-ord-it')].map(li=>+li.dataset.k);
  return [...R.querySelectorAll('.rp-camp')].map(c=>{
    const s=c.querySelector('.rp-signe button[aria-pressed="true"]');
    const no=c.querySelector('.rp-no');
    const n=c.querySelector('[data-r="n"]'), d=c.querySelector('[data-r="d"]'), t=c.querySelector('input:not([data-r])');
    return {s:s?s.dataset.s:'', n:n?n.value:'', d:d?d.value:'', t:t?t.value:'', no:no?no.getAttribute('aria-pressed')==='true':false};
  });
}
function incomplet(q, raw){
  if(q.mc) return raw===null;
  if(q.vf || q.classifica) return raw.some(x=>x===null);
  if(q.ordena) return false;
  return raw.some((r,i)=>!r.no && !(r.n||r.t).trim());
}
function comprova(){
  if(st.fet) return;
  const q=st.qs[st.i], raw=llegeixRaw(q);
  if(incomplet(q,raw)){ $('#fb').innerHTML=`<p class="fb err rp-fb">Respon totes les parts abans de comprovar.</p>`; return; }
  const r=avalua(q,raw); st.fet=true;
  st.punts.push({ap:q.ap, p:r.p, q});
  marca(q, raw, r);
  const ok=r.p===1, mig=r.p>0&&r.p<1;
  const msgs = (r.det||[]).map(d=>d.msg).filter(Boolean);
  const cap = ok ? `<span class="rp-icona" aria-hidden="true">✓</span> Correcte!`
    : mig ? `<span class="rp-icona" aria-hidden="true">½</span> ${msgs.includes('Correcte, però simplifica-la.')&&r.det.length===1?'Correcte, però simplifica-la.':r.total?`Mig encert: ${r.bons} de ${r.total} bé.`:'Mig encert.'}`
    : `<span class="rp-icona" aria-hidden="true">✗</span> Incorrecte.`;
  const extra = [...new Set(msgs.filter(x=>x!=='Correcte, però simplifica-la.' || r.det.length>1))].map(x=>`<span class="rp-msg">${x}</span>`).join('');
  const sol = !ok && solucioH(q) ? `<span class="rp-sol">La resposta és ${solucioH(q).replace(/\.$/,'')}.</span>` : '';
  $('#fb').innerHTML = `
    <div class="rp-fb ${ok?'rp-ok':mig?'rp-mig':'rp-ko'}" role="status"><b>${cap}</b>${extra}${sol}</div>
    <div class="rp-res"><span class="rp-res-cap">Resolució</span>${q.res.map(l=>`<div class="rp-res-l">${l}</div>`).join('')}</div>`;
  $('#acc').innerHTML = `<button type="button" class="boto boto-principal" id="bSeg">${st.i+1<st.qs.length?'Següent →':'Veure el resultat →'}</button>`;
  $('#bSeg').onclick=seguent; $('#bSeg').focus({preventScroll:true});
  $('#fb').scrollIntoView({behavior:'smooth', block:'nearest'});
}
function marca(q, raw, r){
  const R=$('#resp'); R.classList.add('rp-fet');
  R.querySelectorAll('input,button').forEach(x=>{ x.disabled=true; });
  if(q.mc){ R.querySelectorAll('.rp-op').forEach((b,i)=>{ if(i===q.mc.ok) b.classList.add('rp-bo'); else if(i===raw) b.classList.add('rp-mal'); }); }
  if(q.vf||q.classifica){ const bo=q.vf?q.vf.map(a=>a.v?'1':'0'):q.classifica.items.map(it=>String(it.c));
    R.querySelectorAll('.rp-vf-fila').forEach((f,i)=>{ f.querySelectorAll('button').forEach(b=>{ if(b.dataset.v===bo[i]) b.classList.add('rp-bo'); else if(b.getAttribute('aria-pressed')==='true') b.classList.add('rp-mal'); }); }); }
  if(q.ordena){ R.querySelector('.rp-ord').classList.add(r.p===1?'rp-ord-ok':'rp-ord-ko'); }
  if(q.camps) R.querySelectorAll('.rp-camp').forEach((c,i)=>{ const p=r.det[i].p; c.classList.add(p===1?'rp-c-ok':p>0?'rp-c-mig':'rp-c-ko'); });
}
function seguent(){
  st.i++;
  if(st.i<st.qs.length){ pregunta(); window.scrollTo({top:0}); } else final();
}
function final(){
  const per={}; st.punts.forEach(x=>{ (per[x.ap]=per[x.ap]||{p:0,n:0}); per[x.ap].p+=x.p; per[x.ap].n++; });
  const tot=st.punts.reduce((s,x)=>s+x.p,0), nota=Math.round(tot/st.punts.length*100)/10;
  const clau=st.niv+'-'+st.mode; const d=llegeix(); const mil=d.millors||{};
  if(st.mode==='simulacre' && (mil[clau]==null || nota>mil[clau])) mil[clau]=nota;
  desa({millors:mil});
  const fmt = x => String(Math.round(x*10)/10).replace('.',',');
  const repassa = Object.keys(per).filter(a=>per[a].p/per[a].n<0.6).map(Number);
  app.innerHTML = `
  <section class="rp-card rp-final">
    <span class="rp-xip rp-x-${st.niv}">${st.niv} · ${st.mode==='simulacre'?'Simulacre':'Per apartats'}</span>
    <div class="rp-nota"><span class="rp-nota-n">${fmt(nota)}</span><span class="rp-nota-de">/ 10</span></div>
    <p class="rp-nota-text">${nota>=9?'Excel·lent! 🎉':nota>=7?'Molt bé!':nota>=5?'Aprovat, però encara pots millorar.':'Cal repassar: torna-ho a provar.'} · ${fmt(tot)} punts de ${st.punts.length}</p>
    <table class="rp-taula-ap"><thead><tr><th>Apartat</th><th>Encerts</th><th></th></tr></thead><tbody>
      ${Object.keys(per).map(Number).sort((a,b)=>a-b).map(a=>{ const r=per[a].p/per[a].n; return `<tr><td>${a}. ${APARTATS[a-1]}</td><td class="rp-num">${fmt(per[a].p)} / ${per[a].n}</td><td><span class="rp-estat ${r>=0.85?'rp-e-ok':r>=0.6?'rp-e-mig':'rp-e-ko'}">${r>=0.85?'✓ Ben fet':r>=0.6?'• Gairebé':'✗ Repassa'}</span></td></tr>`; }).join('')}
    </tbody></table>
    ${repassa.length?`<p class="rp-repassa"><b>Cal repassar:</b> ${repassa.map(a=>APARTATS[a-1]).join(', ')}.</p>`:`<p class="rp-repassa rp-tot-be">Cap apartat per sota del 60 %. Bona feina!</p>`}
    ${ambFormulari()?`<p class="rp-enviat" id="enviat">Enviant el resultat a la professora…</p>`:''}
    <div class="rp-accions rp-centre">
      <button type="button" class="boto boto-principal" id="bTorna">Torna a provar</button>
      ${repassa.length && st.mode==='simulacre' ?`<button type="button" class="boto" id="bRepassa">Repassa només aquests</button>`:''}
      <button type="button" class="boto" id="bNivell">Canvia de nivell</button>
    </div>
  </section>`;
  $('#bTorna').onclick=comenca;
  $('#bNivell').onclick=inici;
  if(ambFormulari()){
    const dd=dadesInforme(st.nom, st.grup, nota);
    enviaFormulari({nom:dd.nom, grup:dd.grup, nivell:dd.niv, mode:dd.mode, nota:dd.nota,
      apartats:Object.keys(per).map(Number).sort((a,b)=>a-b).map(a=>`${a}. ${APARTATS[a-1]}: ${fmt(per[a].p)}/${per[a].n}`).join(' · '),
      detall:st.punts.map((x,i)=>`${i+1}) ${x.q.id} ${x.p===1?'✓':x.p>0?'½':'✗'}`).join(' '), codi:codiDe(dd)+' · '+dd.data})
      .then(ok=>{ const e=$('#enviat'); if(e){ e.textContent = ok ? '✓ Resultat enviat a la professora.' : '✗ No s’ha pogut enviar el resultat (potser no hi ha connexió). Avisa la professora.'; e.classList.add(ok?'rp-env-ok':'rp-env-ko'); } });
  }
  if($('#bRepassa')) $('#bRepassa').onclick=()=>{ st.mode='apartats'; st.aps=repassa; comenca(); };
  window.scrollTo(0,0);
}
/* ─── codi de comprovació del resultat que s'envia al formulari ─── */
/* resum de les dades del resultat: la professora pot comprovar a #comprova si una fila del formulari s'ha inventat */
function codi(txt){
  let h1=0x811c9dc5, h2=0x01000193;
  for(const ch of 'pv-rac-26|'+txt){ const c=ch.codePointAt(0); h1=Math.imul(h1^c,16777619)>>>0; h2=Math.imul(h2+c,2246822519)>>>0; h2^=h2>>>13; }
  return ((h1.toString(36)+h2.toString(36)).toUpperCase().replace(/[^A-Z0-9]/g,'')+'0000000000').slice(0,10).replace(/(.{5})/,'$1-');
}
const codiDe = d => codi([d.nom.toLowerCase().replace(/\s+/g,' '), d.grup.toLowerCase(), d.niv, d.mode, d.nota, d.data].join('|'));
function dadesInforme(nom, grup, nota){
  if(!st.data){ const ara=new Date(); st.data=ara.toLocaleDateString('ca-ES',{day:'2-digit',month:'2-digit',year:'numeric'})+' '+ara.toLocaleTimeString('ca-ES',{hour:'2-digit',minute:'2-digit'}); }
  return {nom, grup, niv:st.niv, mode:st.mode==='simulacre'?'Simulacre':'Per apartats', nota:String(Math.round(nota*10)/10).replace('.',','), data:st.data};
}
/* repas-racionals.html#comprova · la professora comprova el codi d'un informe */
function comprovaCodi(){
  app.innerHTML = `<section class="rp-card"><h2 class="rp-h2">Comprova el codi d’un resultat</h2>
    <p class="rp-nota-text" style="text-align:left">Copia les dades tal com surten al full de respostes del formulari (el codi i la data són a la columna Codi).</p>
    <div class="rp-desa-camps rp-comp">
      ${[['nom','Alumne/a'],['grup','Grup'],['niv','Nivell (AS, AN, AE)'],['mode','Mode (Simulacre o Per apartats)'],['nota','Nota (p. ex. 7,5)'],['data','Data (p. ex. 20/10/2026 19:05)'],['codi','Codi']].map(([k,e])=>`<label><span>${e}</span><input data-k="${k}"></label>`).join('')}
      <button type="button" class="boto boto-principal" id="bComp">Comprova</button>
    </div><div id="resComp"></div></section>`;
  $('#bComp').onclick=()=>{ const d={}; app.querySelectorAll('[data-k]').forEach(i=>d[i.dataset.k]=i.value.trim());
    d.niv=d.niv.toUpperCase(); d.mode=/^s/i.test(d.mode)?'Simulacre':'Per apartats';
    const ok = codiDe(d)===d.codi.toUpperCase().replace(/\s/g,'');
    $('#resComp').innerHTML = `<div class="rp-fb ${ok?'rp-ok':'rp-ko'}"><b><span class="rp-icona">${ok?'✓':'✗'}</span> ${ok?'El codi correspon a aquestes dades.':'El codi no correspon: alguna dada és diferent o s’ha modificat.'}</b></div>`; };
}
/* teclat (ordinador): Retorn = Comprova / Següent; A-D o 1-4 = tria opció */
document.addEventListener('keydown', e=>{
  if(!st.qs.length || !$('.rp-preg') || e.ctrlKey || e.metaKey || e.altKey) return;
  const enInput = e.target.tagName==='INPUT';
  if(e.key==='Enter' && !enInput && !(e.target.tagName==='BUTTON' && !e.target.classList.contains('rp-op'))){ e.preventDefault(); st.fet ? seguent() : comprova(); return; }
  if(enInput || st.fet) return;
  const ops=[...document.querySelectorAll('#resp .rp-op')]; if(!ops.length) return;
  const k='abcd'.indexOf(e.key.toLowerCase()), n='1234'.indexOf(e.key), i=k>=0?k:n;
  if(i>=0 && ops[i]){ ops[i].click(); ops[i].focus(); }
});
/* repas-racionals.html#plantilla=3-error&nivell=AE · per revisar una plantilla concreta */
(function(){
  const h=new URLSearchParams(location.hash.slice(1)), id=h.get('plantilla'), niv=h.get('nivell');
  if(h.has('comprova')){ comprovaCodi(); return; }
  const t=T.find(x=>x.id===id && (!niv || x.niv===niv));
  if(!t){ inici(); return; }
  st.niv=t.niv; st.mode='apartats'; st.aps=[t.ap];
  st.qs=Array.from({length:5},()=>genera(t)); st.i=0; st.punts=[]; pregunta();
})();
})();
