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
  pow(k){ if(k<0) return this.inv().pow(-k); let r=new Fr(1); for(let i=0;i<k;i++) r=r.mul(this); return r; }
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
const sup = (h,n) => `${h}<sup>${typeof n==='number'?fmtInt(n):n}</sup>`;
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
const X = () => ({t:'X'});
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
    case 'X': return '<i>x</i>';
    case 'P': return (e.k==='[]'?cla:par)(eh(e.a,false));
    case 'W': { const v=e.a.t==='L'?e.a.v:null;
      const base = v ? ((v.n<0||v.d!==1) ? par(fr(v)) : fr(v)) : eh(e.a,false);   /* X o P: ja porta el que cal */
      return `<span class="pot">${base}<sup>${fmtInt(e.n)}</sup></span>`; }
    case 'N': { const h=MENYS+eh(e.a,false); return wrap?par(h):h; }
    case 'B': return `${eh(e.a,wrap)}<span class="opr">${e.op}</span>${eh(e.b,true)}`;
  }
}
/* text pla per a la prova automàtica: fraccions com a {n/d} */
function et(e){
  switch(e.t){
    case 'L': return `{${e.v.n}/${e.v.d}}`;
    case 'X': return 'x';
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
/* decimal amb període: tres caselles (part entera, decimals no periòdics, període amb barret) */
const cPer   = (v, o={}) => Object.assign({tipus:'per', v:F(v)}, o);
/* triar una opció dins d'una pregunta amb diversos camps */
const cTria  = (opcions, ok, o={}) => Object.assign({tipus:'tria', opcions, ok}, o);
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

/* ─────────── 1. Equivalents i simplificació ─────────── */
plantilla(1,'AS','1-creu','Són equivalents? (en creu)', () => retry(() => {
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
plantilla(1,'AS','1-simplifica','Simplificar fraccions petites', () => {
  const p=frIrr(DEN_AS,1.3), k=rand(2,6);
  return { enunciat:`Simplifica fins a la fracció irreductible:`, gran:fracRaw(p.n*k,p.d*k), camps:[cFrac(p)],
    pista:'Divideix el numerador i el denominador pel mateix nombre (2, 3, 5…) fins que no es pugui més.',
    res:[m(`${fracRaw(p.n*k,p.d*k)} = ${fracRaw(p.n+' · '+k, p.d+' · '+k)} = ${fr(p)}`), `Dividim tots dos termes per ${k}.`], v:{k:'simp', a:p.n*k, b:p.d*k, r:p} };
});
plantilla(1,'AS','1-falta','Terme que falta (amplificar)', () => {
  const p=frIrr(DEN_AS,1.3), k=rand(2,6), aNum=coin();
  const h = aNum ? `${fr(p)} = <span class="frac"><span><span class="buit">?</span></span><span>${p.d*k}</span></span>` : `${fr(p)} = <span class="frac"><span>${p.n*k}</span><span><span class="buit">?</span></span></span>`;
  const r = aNum ? p.n*k : p.d*k;
  return { enunciat:`Quin nombre falta perquè les fraccions siguin equivalents?`, gran:h, camps:[cEnter(r)],
    pista:'Mira per quant s’ha multiplicat el terme que coneixes i fes el mateix amb l’altre.',
    res:[aNum?`El denominador s’ha multiplicat per ${k} (${p.d} · ${k} = ${p.d*k}).`:`El numerador s’ha multiplicat per ${k} (${p.n} · ${k} = ${p.n*k}).`, `Multipliquem l’altre terme per ${k}: <b>${r}</b>.`], v:{k:'falta', p, a:aNum?r:p.n*k, b:aNum?p.d*k:r} };
});
plantilla(1,'AN','1-simplifica','Simplificar amb factors primers (84/126)', () => retry(() => {
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
plantilla(1,'AN','1-ordena','Ordenar 3 fraccions (comú denominador)', () => ordena(3,[2,3,4,5,6,8,9,10,12,15],false,60));
plantilla(1,'AN','1-falta','Terme que falta, amb negatius', () => {
  const p=frIrr(DEN_AN,1.5).mul(coin()?-1:1), k=rand(2,9), aNum=coin();
  const s=p.n<0?MENYS:'';
  const h = aNum ? `${fr(p)} = ${s}<span class="frac"><span><span class="buit">?</span></span><span>${p.d*k}</span></span>` : `${fr(p)} = ${s}<span class="frac"><span>${Math.abs(p.n)*k}</span><span><span class="buit">?</span></span></span>`;
  const r = aNum ? Math.abs(p.n)*k : p.d*k;
  return { enunciat:`Quin nombre falta perquè les fraccions siguin equivalents?`, gran:h, camps:[cEnter(r)],
    pista:'Multiplicació en creu, o bé: per quant s’ha multiplicat el terme que coneixes?',
    res:[aNum?`${p.d} · ${k} = ${p.d*k}: s’ha multiplicat per ${k}.`:`${Math.abs(p.n)} · ${k} = ${Math.abs(p.n)*k}: s’ha multiplicat per ${k}.`, `${aNum?Math.abs(p.n):p.d} · ${k} = <b>${r}</b>`], v:{k:'falta', p:p.abs(), a:aNum?r:Math.abs(p.n)*k, b:aNum?p.d*k:r} };
});
plantilla(1,'AE','1-ordena','Ordenar 4 o 5 nombres amb negatius', () => ordena(rand(4,5),[2,3,4,5,6,8,9,10,12,15,18,20],true,120));
plantilla(1,'AE','1-falta','Terme que falta (cal simplificar abans)', () => retry(() => {
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

/* ─────────── 2. Operacions ─────────── */
plantilla(2,'AS','2-suma','Suma o resta de dues fraccions (m.c.m.)', () => retry(() => {
  const a=frIrr(DEN_AS,1), b=frIrr(DEN_AS,1); if(a.d===b.d) return null;
  const op = a.cmp(b)>0 && coin() ? '−' : '+';
  const e=B(op,a,b), r=ev(e), M=lcm(a.d,b.d); if(M>36) return null;
  return { enunciat:'Calcula i simplifica el resultat:', gran:eh(e,false), camps:[cFrac(r)],
    pista:`Busca el m.c.m. dels denominadors (${a.d} i ${b.d}) i redueix a comú denominador.`,
    res:[`m.c.m.(${a.d}, ${b.d}) = ${M}`, m(`${eh(e,false)} = ${fracRaw(a.n*M/a.d,M)}<span class="opr">${op}</span>${fracRaw(b.n*M/b.d,M)} = ${fracRaw(op==='+'?a.n*M/a.d+b.n*M/b.d:a.n*M/a.d-b.n*M/b.d,M)}${F(op==='+'?a.n*M/a.d+b.n*M/b.d:a.n*M/a.d-b.n*M/b.d,M).d!==M?' = '+fr(r):''}`)], v:{k:'expr', txt:et(e), r} };
}));
plantilla(2,'AS','2-mateix','Suma amb el mateix denominador o amb un enter', () => retry(() => {
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
plantilla(2,'AS','2-producte','Producte de dues fraccions', () => retry(() => {
  const a=frIrr(DEN_AS,1.2), b=frIrr(DEN_AS,1.2), e=B('·',a,b), r=ev(e);
  return { enunciat:'Calcula i simplifica el resultat:', gran:eh(e,false), camps:[cFrac(r)],
    pista:'Numerador per numerador i denominador per denominador.',
    res:[m(`${eh(e,false)} = <span class="frac"><span>${a.n} · ${b.n}</span><span>${a.d} · ${b.d}</span></span> = ${fracRaw(a.n*b.n,a.d*b.d)}${a.n*b.n!==r.n?' = '+fr(r):''}`)], v:{k:'expr', txt:et(e), r} };
}));
plantilla(2,'AS','2-divisio','Divisió de dues fraccions', () => retry(() => {
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
plantilla(2,'AN','2-tres','Suma i resta de 3 termes amb enters (2 + 1/10 + 3/20)', () => retry(() => {
  const k=rand(-4,4)||2, a=fS(DEN_AN,0.25), b=frIrr(DEN_AN,1.2);
  if(lcm(a.d,b.d)>60 || a.d===b.d) return null;
  const e=B(pick(['+','−']), B(pick(['+','−']), k, a), b), r=ev(e); if(!amable(r)) return null;
  const M=lcm(a.d,b.d);
  return { enunciat:'Calcula i simplifica el resultat:', gran:eh(e,false), camps:[cFrac(r)], pista:'L’enter també es passa a fracció amb el denominador comú.',
    res:[`m.c.m.(${a.d}, ${b.d}) = ${M}`, m(`${eh(e,false)} = ${(k<0?MENYS:'')+fracRaw(Math.abs(k)*M,M)}<span class="opr">${e.a.op}</span>${a.n<0?par(MENYS+fracRaw(-a.n*M/a.d,M)):fracRaw(a.n*M/a.d,M)}<span class="opr">${e.op}</span>${fracRaw(b.n*M/b.d,M)}`), m(`= ${(r.mul(M).n<0?MENYS:'')+fracRaw(Math.abs(r.mul(M).n),M)}${r.d!==M?' = '+fr(r):''}`)], v:{k:'expr', txt:et(e), r} };
}));
plantilla(2,'AN','2-jerarquia','Jerarquia: suma/resta amb producte o divisió', () => retry(() => {
  const a=fS(DEN_AN), b=fS(DEN_AN), c=fS(DEN_AN);
  const e = coin() ? B(pick(['+','−']), a, B(pick(['·',':']), b, c)) : B(pick(['+','−']), B(pick(['·',':']), a, b), c);
  return exprQ(e, 'Primer els productes i les divisions, després les sumes i les restes.');
}));
plantilla(2,'AN','2-parentesi','Operació amb un parèntesi', () => retry(() => {
  const a=fS(DEN_AN,0.25), b=frIrr(DEN_AN,1.2), c=fS(DEN_AN,0.3);
  const dins=P(B(pick(['+','−']),a,b));
  const e = pick([()=>B(pick(['·',':']),dins,c), ()=>B(pick(['·',':']),c,dins), ()=>B('−',rand(1,3),dins)])();
  return exprQ(e, 'Primer el parèntesi; després productes i divisions; al final sumes i restes.');
}));
plantilla(2,'AN','2-signes','Producte i divisió amb signes negatius', () => retry(() => {
  const a=fS(DEN_AN,0.5,1.5), b=fS(DEN_AN,0.6,1.5), c=fS(DEN_AN,0.6,1.5);
  if(a.n>0&&b.n>0&&c.n>0) return null;
  const e=B(pick(['·',':']), B(pick(['·',':']),a,b), c);
  return exprQ(e, 'D’esquerra a dreta. Per dividir, multiplica per l’invers. Compta els signes negatius.');
}));
plantilla(2,'AE','2-potencia','Parèntesis amb potències dins: (1/2 − 1/3)·(−3/2)² + 1/4', () => retry(() => {
  const a=fS(DEN_AN,0.2,1.2), b=frIrr(DEN_AN,1.2), c=frIrr([2,3,4,5],1.6).neg(), d=fS(DEN_AN,0.4,1.2);
  const pw=W(c,pick([2,2,3]));
  const e = pick([
    ()=>B(pick(['+','−']), B('·', P(B('−',a,b)), pw), d),
    ()=>B(pick(['+','−']), d, B(':', pw, P(B(pick(['+','−']),a,b)))),
    ()=>B('·', P(B(pick(['+','−']),d,pw)), P(B('−',a,b))),
  ])();
  return exprQ(e, null, 99, 72);
}));
plantilla(2,'AE','2-dos','Dos parèntesis: (2/5 + 3/10) : (1/4 − 3/2)', () => retry(() => {
  const a=fS(DEN_AE,0.2,1.2), b=frIrr(DEN_AE,1.2), c=frIrr(DEN_AN,1.2), d=fS(DEN_AN,0.2,1.2), k=rand(2,4);
  const e = pick([
    ()=>B(pick(['·',':']), P(B(pick(['+','−']),a,b)), P(B(pick(['+','−']),c,d))),
    ()=>B(pick(['+','−']), P(B(pick(['+','−']),a,b)), B('·', c, P(B('−',d,b)))),
    ()=>B('·', B('·', k, P(B('−',b,c))), d),
    ()=>B('+', b, B(':', k, P(B('−',1,c)))),
  ])();
  return exprQ(e, null, 99, 72);
}));
plantilla(2,'AE','2-mixt','Enters barrejats amb fraccions: (−2 + 1/3) : (5/6 − 3)', () => retry(() => {
  const k1=rand(-5,5)||-2, k2=rand(1,5), a=frIrr(DEN_AE,1.2), b=frIrr(DEN_AE,1.2);
  const e = B(pick([':','·']), P(B(pick(['+','−']),k1,a)), P(B('−',b,k2)));
  return exprQ(e, null, 99, 72);
}));

/* ─────────── 3. Part d'un total i percentatges ─────────── */
const COSES = [
  ['alumnes','d’una escola'], ['llibres','d’una biblioteca'], ['ovelles','d’un ramat'], ['socis','d’un club'], ['cromos','d’una col·lecció'], ['arbres','d’un bosc'],
];
plantilla(3,'AS','3-fraccio','Fracció d’una quantitat (3/8 de 200)', () => retry(() => {
  const f=frIrr([2,3,4,5,6,8,10,12],1), N=f.d*rand(2,25); if(f.n===0||N>600) return null;
  const r=f.mul(N);
  return { enunciat:`Calcula ${m(fr(f))} de ${fmtInt(N)}.`, camps:[cEnter(r)], pista:'Divideix pel denominador i multiplica pel numerador.',
    res:[m(`${fmtInt(N)} : ${f.d} = ${N/f.d}`), m(`${N/f.d} · ${f.n} = ${fmtInt(r.n)}`)], v:{k:'fracq', f, N, r} };
}));
plantilla(3,'AS','3-percent','Percentatge d’una quantitat (10 %, 25 %, 50 %)', () => retry(() => {
  const p=pick([10,20,25,50,75]), f=F(p,100), N=f.d*rand(1,40); if(N>800||N<20) return null;
  const r=f.mul(N);
  return { enunciat:`Calcula el ${p} % de ${fmtInt(N)}.`, camps:[cEnter(r)], pista:`${p} % vol dir ${p} de cada 100: escriu-lo com una fracció i simplifica-la.`,
    res:[m(`${p} % = ${fracRaw(p,100)} = ${fr(f)}`), m(`${fr(f)} de ${fmtInt(N)} = ${fmtInt(N)} : ${f.d} · ${f.n} = ${fmtInt(r.n)}`)], v:{k:'pct', p, N, r} };
}));
plantilla(3,'AS','3-quina','Quina fracció representa una part (18 de 48)', () => retry(() => {
  const f=frIrr([2,3,4,5,6,8,10,12],1), k=rand(2,8), [qui,on]=pick(COSES);
  const part=f.n*k*rand(1,2), tot=part/f.n*f.d; if(!Number.isInteger(tot)||tot>200) return null;
  return { enunciat:`De ${tot} ${qui} ${on}, ${part} són ${pick(['de l’equip A','nous','vermells','de primer'])}. Quina fracció del total representen? Simplifica-la.`, camps:[cFrac(F(part,tot))],
    pista:'Part entre total, i després simplifica.', res:[m(`${fracRaw(part,tot)} = ${fr(F(part,tot))}`)], v:{k:'part', part, tot, r:F(part,tot)} };
}));
plantilla(3,'AS','3-relacio','Percentatge, fracció i decimal (opció múltiple)', () => {
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
plantilla(3,'AN','3-resta','Problema de la resta: quants en queden', () => retry(() => {
  const [a,b]=dosFrac(), M=lcm(a.d,b.d), N=M*rand(1,8), c=pick(RESTA_CTX); if(N<20||N>600) return null;
  const A=a.mul(N), Bq=b.mul(N), r=F(N).sub(A).sub(Bq);
  return { enunciat:`Hi ha ${fmtInt(N)} ${c.tot}: ${m(fr(a))} ${c.a} i ${m(fr(b))} ${c.b}. ${c.q}`, camps:[cEnter(r)], pista:'Calcula cada part i resta-les del total (o calcula primer la fracció que queda).',
    res:[m(`${fr(a)} de ${N} = ${A.n}`), m(`${fr(b)} de ${N} = ${Bq.n}`), m(`${N} − ${A.n} − ${Bq.n} = ${r.n}`)], v:{k:'resta', a, b, N, r} };
}));
plantilla(3,'AN','3-restafrac','Problema de la resta: quina fracció queda', () => {
  const [a,b]=dosFrac(), c=pick(RESTA_CTX), r=F(1).sub(a).sub(b), M=lcm(a.d,b.d);
  return { enunciat:`D’un grup de ${c.tot}, ${m(fr(a))} ${c.a} i ${m(fr(b))} ${c.b}. Quina fracció del total queda? Simplifica-la.`, camps:[cFrac(r)],
    pista:'El total és 1. Suma les dues fraccions i resta-les d’1.',
    res:[m(`${fr(a)} + ${fr(b)} = ${fracRaw(a.n*M/a.d,M)} + ${fracRaw(b.n*M/b.d,M)} = ${fr(a.add(b))}`), m(`1 − ${fr(a.add(b))} = ${fr(r)}`)], v:{k:'restafrac', a, b, r} };
});
plantilla(3,'AN','3-descompte','Descomptes i augments', () => retry(() => {
  const P_=rand(4,60)*5, x=pick([5,10,15,20,25,30,40]), aug=coin(0.4);
  const r=F(P_).mul(F(100+(aug?x:-x),100)); if(r.d>100) return null;
  const obj=pick(['Una jaqueta','Una bicicleta','Uns auriculars','Una entrada de concert','Un joc']);
  return { enunciat:aug?`${obj} costava ${fmtInt(P_)} € i el preu ha augmentat un ${x} %. Quant costa ara?`:`${obj} costa ${fmtInt(P_)} € i té un descompte del ${x} %. Quant s’ha de pagar?`,
    camps:[cDec(r,{et:'Preu (€)'})], pista:aug?`Si augmenta un ${x} %, pagues el ${100+x} %.`:`Si et descompten un ${x} %, pagues el ${100-x} %.`,
    res:[`${aug?'Augment':'Descompte'}: ${m(`${x} % de ${P_} = ${eur(F(P_*x,100))}`)}`, m(`${P_} ${aug?'+':'−'} ${decStr(F(P_*x,100))} = ${eur(r)}`), `O directament: ${m(`${P_} · ${decStr(F(100+(aug?x:-x),100))} = ${eur(r)}`)}`], v:{k:'desc', P:P_, x, aug, r} };
}));
plantilla(3,'AN','3-relacio','Percentatge = fracció irreductible = decimal', () => {
  const p=pick([5,12,15,35,40,45,60,64,75,80,8,2]), f=F(p,100);
  return { enunciat:`Escriu el ${p} % com a fracció irreductible i com a nombre decimal.`, camps:[cFrac(f,{et:'Fracció'}), cDec(f,{et:'Decimal'})],
    pista:'Escriu-lo sobre 100 i simplifica. Per al decimal, divideix entre 100.', res:[m(`${p} % = ${fracRaw(p,100)} = ${fr(f)} = ${decStr(f)}`)], v:{k:'pctrel', p, r:f} };
});
plantilla(3,'AE','3-invers','Problema invers: la resta són 18, quantes n’hi ha?', () => retry(() => {
  const a=frIrr([3,4,5,6,7,8,9,10],1), T_=a.d*rand(2,12), R=T_-a.mul(T_).n; if(R<=0||T_>300) return null;
  const ctx=pick([
    `En un hort, ${m(fr(a))} de les plantes són tomaqueres i la resta, ${R}, són enciams. Quantes plantes hi ha?`,
    `En una classe, ${m(fr(a))} dels alumnes són noies i la resta, ${R}, són nois. Quants alumnes hi ha?`,
    `En una caixa, ${m(fr(a))} de les galetes són de xocolata i la resta, ${R}, són de crema. Quantes galetes hi ha?`,
    `D’un curs, ${m(fr(a))} dels alumnes han anat d’excursió i la resta, ${R}, s’han quedat a l’institut. Quants alumnes hi ha al curs?`]);
  return { enunciat:ctx,
    camps:[cEnter(T_)], res:[m(`1 − ${fr(a)} = ${fr(F(1).sub(a))}`)+' del total són '+R+'.', m(`${fr(F(1).sub(a))} de x = ${R} → x = ${R} : ${F(1).sub(a).n} · ${a.d} = ${T_}`), `Comprovació: ${m(`${fr(a)} de ${T_} = ${a.mul(T_).n}`)} i ${a.mul(T_).n} + ${R} = ${T_}.`], v:{k:'invers1', a, R, r:F(T_)} };
}));
plantilla(3,'AE','3-invers2','Problema invers amb dues fraccions', () => retry(() => {
  const [a,b]=dosFrac(), q=F(1).sub(a).sub(b), M=lcm(a.d,b.d), T_=M*rand(1,8), R=q.mul(T_); if(!R.isInt()||T_>400||R.n<2) return null;
  return { enunciat:`D’una paga, en Pol gasta ${m(fr(a))} en roba i ${m(fr(b))} en llibres. Encara li queden ${R.n} €. Quants euros tenia?`, camps:[cEnter(T_)],
    res:[m(`${fr(a)} + ${fr(b)} = ${fr(a.add(b))}`), m(`Li queda 1 − ${fr(a.add(b))} = ${fr(q)}`), m(`${fr(q)} de x = ${R.n} → x = ${R.n} : ${q.n} · ${q.d} = ${T_}`)], v:{k:'invers2', a, b, R, r:F(T_)} };
}));
plantilla(3,'AE','3-pctinvers','Percentatge invers (després del descompte costa 48 €)', () => retry(() => {
  const O=rand(4,60)*5, x=pick([5,10,15,20,25,30,40]), aug=coin(0.4), P_=F(O).mul(F(100+(aug?x:-x),100)); if(P_.d>100) return null;
  return { enunciat:aug?`Després d’un augment del ${x} %, un producte costa ${eur(P_)}. Quant costava abans de l’augment?`:`Després d’un descompte del ${x} %, un producte costa ${eur(P_)}. Quin era el preu inicial?`,
    camps:[cDec(F(O),{et:'Preu (€)'})], res:[`Ara es paga el ${100+(aug?x:-x)} % del preu inicial: ${m(`${decStr(F(100+(aug?x:-x),100))} · x = ${decStr(P_)}`)}`, m(`x = ${decStr(P_)} : ${decStr(F(100+(aug?x:-x),100))} = ${fmtInt(O)} €`)], v:{k:'pctinv', x, aug, P:P_, r:F(O)} };
}));
plantilla(3,'AE','3-proporcio','Proporcionalitat amb fraccions (recepta de 4 a 6 persones)', () => retry(() => {
  const n=pick([2,3,4,5,6,8]), mm=pick([2,3,4,5,6,8,10,12]); if(n===mm) return null;
  const q=frIrr([2,3,4,5,8],1.6), r=q.mul(mm).div(n); if(r.isInt()||!amable(r,40,24)) return null;
  const [ing,qu]=pick([['kg de farina','Quants quilos de farina'],['litres de llet','Quants litres de llet'],['kg de patates','Quants quilos de patates'],['tasses de sucre','Quantes tasses de sucre']]);
  return { enunciat:`Una recepta per a ${n} persones porta ${m(fr(q))} ${ing}. ${qu} calen per a ${mm} persones? Dona la fracció irreductible.`, camps:[cFrac(r)],
    res:[`Per a 1 persona: ${m(`${fr(q)} : ${n} = ${fr(q.div(n))}`)}`, `Per a ${mm} persones: ${m(`${fr(q.div(n))} · ${mm} = ${fr(r)}`)} ${ing}`], v:{k:'prop', q, n, mm, r} };
}));
plantilla(3,'AE','3-fracfrac','Fracció del que queda (gasta 2/5 i després 1/3 del que queda)', () => retry(() => {
  const a=frIrr([3,4,5,6,7,8],1), b=frIrr([2,3,4,5],1), r=F(1).sub(a).mul(F(1).sub(b));
  return { enunciat:`La Laia gasta ${m(fr(a))} dels seus estalvis en una bicicleta i després ${m(fr(b))} <b>del que li queda</b> en un casc. Quina fracció dels estalvis li queda al final?`, camps:[cFrac(r)],
    res:[m(`Després de la bici li queda 1 − ${fr(a)} = ${fr(F(1).sub(a))}`), m(`El casc: ${fr(b)} de ${fr(F(1).sub(a))} = ${fr(b.mul(F(1).sub(a)))}`), m(`Li queda ${fr(F(1).sub(a))} − ${fr(b.mul(F(1).sub(a)))} = ${fr(r)}`)], v:{k:'fracfrac', a, b, r} };
}));

/* ─────────── 4. Tipus de nombres racionals ───────────
   Com a classe (Apunts 5 i Activitats 17-20): fracció → decimal i tipus, classificar i
   identificar el període, decimal → fracció (exacte i periòdic, mètode de les potències
   de 10 amb barret) i quantitats com a fracció de litre. Sense negatius. */
const TIPUS4=['enter','finit','pur','mixt'];
const TIPUS_OP=['Enter','Decimal finit','Periòdic pur','Periòdic mixt'];
const TIPUS_PER={enter:'és un nombre enter', finit:'té un nombre limitat de xifres decimals', pur:'el període comença just després de la coma', mixt:'entre la coma i el període hi ha l’avantperíode'};
/* fracció d'un tipus donat; dens = denominadors possibles; maxPer = xifres màximes del període */
function fracTipus(t, dens, maxN, maxPer=3){
  return retry(() => {
    let f, raw=null;
    if(t==='enter'){ const d=pick([2,3,4,5,6]), n=rand(1,Math.max(1,Math.floor(maxN/d)))*d; f=F(n,d); raw=[n,d]; }
    else { const d=pick(dens), n=rand(1,maxN); if(gcd(n,d)!==1) return null; f=F(n,d); raw=[n,d]; }
    if(tipusDec(f)!==t) return null;
    const e=expand(f); if(e.per.length>maxPer || e.ante.length>3) return null;
    f.raw=raw; return f;
  });
}
const DENS_TIPUS = {
  AS:{finit:[2,4,5,8,10,20,25], pur:[3,9], mixt:[6], maxN:12},
  AN:{finit:[4,8,16,20,25,40], pur:[3,9,11,33], mixt:[6,12,15,18,30], maxN:40},
  AE:{finit:[8,16,25,40,125], pur:[11,27,33,37,99], mixt:[12,22,30,44,45,55], maxN:90},
};
function divisioH(f){ const e=expand(f); const xs=e.ante+(e.per? e.per.repeat(Math.max(2,Math.ceil(6/e.per.length))).slice(0,Math.max(6,e.per.length*2)) : ''); return `${f.raw[0]} : ${f.raw[1]} = ${fmtInt(e.ent)}${xs?','+xs:''}${e.per?'…':''}`; }
function fracDecQ(niv){
  const t = pick(niv==='AS' ? ['enter','finit','finit','pur','mixt'] : ['enter','finit','pur','pur','mixt','mixt']);
  const D=DENS_TIPUS[niv], f=fracTipus(t, D[t]||[2], D.maxN, niv==='AE'?3:2), e=expand(f);
  return { enunciat:`Passa ${m(fracRaw(...f.raw))} a decimal i digues de quin tipus és.`,
    camps:[cPer(f,{et:'Decimal'}), cTria(TIPUS_OP, TIPUS4.indexOf(t), {et:'Tipus'})],
    pista:'Divideix el numerador entre el denominador. Si es repeteixen xifres, posa-les al període (el barret).',
    res:[m(divisioH(f)), `${m(fracRaw(...f.raw)+' = '+decH(f))}: <b>${TIPUS_OP[TIPUS4.indexOf(t)].toLowerCase()}</b>, perquè ${TIPUS_PER[t]}${t==='mixt'?` (${e.ante})`:''}.`],
    v:{k:'f2dt', f, t} };
}
plantilla(4,'AS','4-fraccio-dec','Fracció → decimal i tipus (3/4, 1/3, 7/6, 4/2)', () => fracDecQ('AS'));
/* decimal exacte → fracció: 0,125 = 125/1000 = 1/8 */
function decExacteQ(f){
  const e=decStr(f).split(',')[1].length, P10=10**e, N=f.n*(P10/f.d);
  return { enunciat:`Passa ${m(decStr(f))} a fracció irreductible.`, camps:[cFrac(f)], pista:'Posa el nombre sense coma al numerador i, al denominador, un 1 amb tants zeros com xifres decimals. Després simplifica.',
    res:[m(`${decStr(f)} = ${fracRaw(N,P10)}${f.d!==P10?' = '+fr(f):''}`), `Hi ha ${e} ${e===1?'xifra decimal':'xifres decimals'}: denominador ${fmtInt(P10)}.`], v:{k:'d2f', s:decStr(f), r:f} };
}
function decExacte(maxEnt, dens){ return retry(() => { const d=pick(dens), f=F(numIrr(d, d*(maxEnt+1)-1), d); return f.isInt()?null:f; }); }
plantilla(4,'AS','4-dec-fraccio','Decimal exacte → fracció (0,125 = 1/8; 4,25 = 17/4)', () => decExacteQ(decExacte(coin(0.6)?0:4, [2,4,5,8,10,20,25,50])));
plantilla(4,'AS','4-litre','Quantitats com a fracció de litre (750 ml = 3/4 L)', () => {
  const k=pick(['ml','ml','cl','L']);
  let q, f, txt, pas;
  if(k==='ml'){ q=pick([250,500,750,200,125,100,400,600,800,150]); f=F(q,1000); txt=`${q} ml`; pas=`${fracRaw(q,1000)} L`; }
  else if(k==='cl'){ q=pick([33,25,75,50,20,70,40,10,5,15]); f=F(q,100); txt=`${q} cl`; pas=`${fracRaw(q,100)} L`; }
  else { q=pick([F(3,2),F(5,2),F(5,4),F(3,4),F(1,2),F(1,4)]); f=q; txt=`${decStr(q)} L`; pas=`${fracRaw(Number(decStr(q).replace(',','')), 10**(decStr(q).split(',')[1]||'').length)} L`; }
  const ctx=pick(['una ampolla de','una llauna de','un tetrabric de','un pot de']);
  return { enunciat:`Expressa com a fracció de litre: ${ctx} ${txt}. Dona la fracció irreductible.`, camps:[cFrac(f,{et:'Litres'})], pista:'1 L = 100 cl = 1000 ml',
    res:[m(`${txt} = ${pas}${F(f).d!==(k==='ml'?1000:k==='cl'?100:10**(decStr(q).split(',')[1]||'').length)?' = '+fr(f)+' L':''}`)], v:{k:'litre', q:k==='L'?null:q, unit:k, r:f} };
});
/* fracció generatriu, mètode de classe:
   x = 0,83̄ → 10x = 8,3̄ (periòdic pur) → 100x = 83,3̄ → 100x − 10x = 83,3̄ − 8,3̄ ⇒ 90x = 75 ⇒ x = 75/90 = 5/6 */
const kx = k => k===1 ? '<i>x</i>' : `${fmtInt(k)}<i>x</i>`;
function generatriu(ent, ante, per){
  const a=ante.length, p=per.length;
  const nA=Number(String(ent)+ante), nB=Number(String(ent)+ante+per);
  const kA=10**a, kB=10**(a+p), num=nB-nA, den=kB-kA, r=F(num,den);
  if(den!==Number('9'.repeat(p)+'0'.repeat(a))) throw new Error('generatriu');
  const rows=[m(`${kx(1)} = ${perH(false,ent,ante,per)}`)];
  if(a) rows.push(`${m(`${kx(kA)} = ${perH(false,nA,'',per)}`)} (ara és periòdic pur)`);
  rows.push(m(`${kx(kB)} = ${perH(false,nB,'',per)}`));
  rows.push(m(`${kx(kB)} − ${kx(kA)} = ${perH(false,nB,'',per)} − ${perH(false,nA,'',per)} ⇒ ${kx(den)} = ${fmtInt(num)} ⇒ <i>x</i> = ${fracRaw(num,den)}${r.d!==den?' = '+fr(r):''}`));
  return {r, rows};
}
function genQ(ent, ante, per, pista){
  const g=generatriu(ent,ante,per);
  return { enunciat:`Passa ${m(perH(false,ent,ante,per))} a fracció irreductible.`, camps:[cFrac(g.r)], pista, res:g.rows, v:{k:'gen', s:perTxt(false,ent,ante,per), r:g.r} };
}
const PISTA_GEN='Anomena x el nombre. Si cal, multiplica’l per 10, 100… perquè sigui periòdic pur; multiplica’l per 10, 100… segons les xifres del període; resta les dues igualtats i aïlla x.';
const perMin = p => !(p.length===2 && p[0]===p[1]) && !/^9+$/.test(p) && !(p.length===3 && p===p[0].repeat(3));
plantilla(4,'AN','4-gen-pur','Periòdic pur → fracció (0,7̄ = 7/9; 0,5̄4̄ = 6/11)', () => retry(() => {
  const ent=coin(0.75)?0:rand(1,3), p=coin(0.55)?String(rand(1,8)):String(rand(10,98)); if(!perMin(p)) return null;
  return genQ(ent, '', p, PISTA_GEN);
}));
plantilla(4,'AN','4-gen-mixt','Periòdic mixt → fracció (0,23̄ = 7/30; 0,43̄ = 13/30)', () => retry(() => {
  const ent=coin(0.75)?0:rand(1,3), a=String(rand(1,9)), p=String(rand(1,8)); if(a===p) return null;
  return genQ(ent, a, p, PISTA_GEN);
}));
plantilla(4,'AN','4-fraccio-dec','Fracció → decimal i tipus (2/11, 7/12, 31/12)', () => fracDecQ('AN'));
plantilla(4,'AE','4-gen-llarg','Periòdic amb part entera → fracció (3,16̄ = 19/6; 2,38̄1̄ = 131/55)', () => retry(() => {
  const ent=rand(1,5), a=String(rand(1,9)), p=coin(0.6)?String(rand(10,98)):String(rand(1,8)); if(!perMin(p) || a===p.slice(-1)) return null;
  return genQ(ent, a, p, null);
}));
plantilla(4,'AE','4-dec-fraccio','Decimal → fracció, exacte o periòdic (12,625; 1,2̄7̄)', () => retry(() => {
  const k=pick(['exacte','pur','mixt']);
  if(k==='exacte') return decExacteQ(decExacte(15, [4,8,20,25,40,125]));
  const ent=rand(1,9), p=k==='pur'&&coin()?String(rand(10,98)):String(rand(1,8)); if(!perMin(p)) return null;
  if(k==='pur') return genQ(ent,'',p,null);
  const a=String(rand(1,9)); if(a===p.slice(-1)) return null;
  return genQ(ent,a,p,null);
}));
plantilla(4,'AE','4-fraccio-dec','Fracció → decimal i tipus (4/27, 25/11, 31/12)', () => fracDecQ('AE'));

/* ─────────── 5. Potències bàsiques: calcular a^n (base entera o fracció, exponent natural o zero) ─────────── */
plantilla(5,'AS','5-enter','Potència d’un enter positiu (exponent 0 a 3)', () => retry(() => {
  const a=rand(2,10), n=rand(0,3); if(a**n>1000) return null;
  const e=W(a,n);
  return { enunciat:'Calcula:', gran:eh(e,false), camps:[cEnter(ev(e))], pista:n===0?'Qualsevol nombre (diferent de 0) elevat a 0 val 1.':`Multiplica la base ${a} per ella mateixa ${n} vegades.`,
    res:[n===0?m(`${sup(a,0)} = 1`):m(`${sup(a,n)} = ${Array(n).fill(a).join(' · ')} = ${fmtInt(a**n)}`)], v:{k:'expr', txt:et(e), r:ev(e)} };
}));
plantilla(5,'AS','5-fraccio','Potència d’una fracció positiva', () => retry(() => {
  const f=frIrr([2,3,4,5,6],1.4), n=rand(0,3); const e=W(f,n), r=ev(e); if(!amable(r,343,216)) return null;
  return { enunciat:'Calcula:', gran:eh(e,false), camps:[cFrac(r)], pista:'S’eleva el numerador i el denominador.',
    res:[n===0?m(`${eh(e,false)} = 1`):m(`${eh(e,false)} = <span class="frac"><span>${sup(f.n,n)}</span><span>${sup(f.d,n)}</span></span> = ${fr(r)}`)], v:{k:'expr', txt:et(e), r} };
}));
plantilla(5,'AN','5-negatiu','Base entera negativa (parell o senar)', () => retry(() => {
  const a=rand(2,6), n=rand(2,5); if(a**n>1300) return null;
  const e=W(-a,n), r=ev(e);
  return { enunciat:'Calcula:', gran:eh(e,false), camps:[cEnter(r)], pista:'Base negativa: exponent parell → resultat positiu; senar → negatiu.',
    res:[m(`${eh(e,false)} = ${Array(n).fill(par(fmtInt(-a))).join(' · ')} = ${fmtInt(r.n)}`), `L’exponent ${n} és ${n%2?'senar: resultat negatiu':'parell: resultat positiu'}.`], v:{k:'expr', txt:et(e), r} };
}));
plantilla(5,'AN','5-fracneg','Potència d’una fracció negativa', () => retry(() => {
  const f=frIrr([2,3,4,5],1.6).neg(), n=rand(2,4), e=W(f,n), r=ev(e); if(!amable(r,625,625)) return null;
  return { enunciat:'Calcula:', gran:eh(e,false), camps:[cFrac(r)], pista:'Primer el signe (parell o senar) i després numerador i denominador.',
    res:[m(`${eh(e,false)} = ${n%2?MENYS:''}<span class="frac"><span>${sup(Math.abs(f.n),n)}</span><span>${sup(f.d,n)}</span></span> = ${fr(r)}`), `Exponent ${n%2?'senar → negatiu':'parell → positiu'}.`], v:{k:'expr', txt:et(e), r} };
}));
const POT_LLISTA = [
  () => W(frIrr([2,3,4,5],1.4), rand(2,3)),
  () => W(-rand(2,4), rand(3,5)),
  () => W(frIrr([2,3,4],1.4).neg(), rand(2,4)),
  () => W(0, rand(2,7)),
  () => W(pick([1,-1]), rand(5,12)),
  () => W(frIrr([3,5,7],1.6).mul(coin()?1:-1), pick([0,1])),
  () => W(rand(2,4), rand(3,4)),
];
plantilla(5,'AE','5-llista','Tres potències alhora (enters, fraccions, 0 i 1)', () => retry(() => {
  const es=shuffle(POT_LLISTA).slice(0,3).map(f=>f()), rs=es.map(ev);
  if(rs.some(r=>!amable(r,729,256))) return null;
  const expl = (e,r) => { const b=ev(e.a), n=e.n;
    if(n===0) return `${m(eh(e,false)+' = 1')}: tot nombre diferent de 0 elevat a 0 val 1.`;
    if(n===1) return `${m(eh(e,false)+' = '+fr(r))}: elevar a 1 deixa el nombre igual.`;
    if(b.n===0) return `${m(eh(e,false)+' = 0')}: 0 multiplicat per ell mateix sempre dona 0.`;
    if(b.d===1 && Math.abs(b.n)===1) return `${m(eh(e,false)+' = '+fr(r))}: ${b.n>0?'1 multiplicat per ell mateix sempre dona 1.':`base −1 i exponent ${n%2?'senar: dona −1.':'parell: dona 1.'}`}`;
    const sg = b.n<0 ? ` Base negativa i exponent ${n%2?'senar: resultat negatiu':'parell: resultat positiu'}.` : '';
    return m(`${eh(e,false)} = ${b.d===1 ? Array(n).fill(frp(b)).join(' · ') : (r.n<0?MENYS:'')+fracRaw(sup(Math.abs(b.n),n), sup(b.d,n))} = ${fr(r)}`)+sg; };
  return { enunciat:'Calcula les tres potències:', camps:es.map((e,i)=>(rs[i].isInt()?cEnter:cFrac)(rs[i],{et:eh(e,false), etMat:true})),
    res:es.map((e,i)=>expl(e,rs[i])), v:{k:'expr2', txts:es.map(et), rs} };
}));

/* ─────────── 6. Potències: propietats, exponent negatiu, base 2, operacions ─────────── */
/* potència com a fulla: {b, e} si el node és p^e (o p sol); null si no */
function pw(x, p){
  if(x.t==='X') return {e:1};
  if(x.t==='L'){ if(p!==undefined && x.v.eq(p)) return {e:1}; return null; }
  if(x.t==='W' && (x.a.t==='X' || (x.a.t==='L' && p!==undefined && x.a.v.eq(p)))) return {e:x.n};
  return null;
}
const pwN = (base, e) => e===1 ? (base==='x'?X():L(base)) : W(base==='x'?X():base, e);
/* un pas de simplificació amb propietats: producte i quocient de la mateixa base, potència de potència */
function pasPot(x, p){
  const base = p===undefined ? 'x' : p;
  if(pw(x,p)) return x;
  if(x.t==='P'){ return pw(x.a,p) ? x.a : P(pasPot(x.a,p)); }
  if(x.t==='W' && x.a.t==='P' && pw(x.a.a,p)) return pwN(base, pw(x.a.a,p).e*x.n);
  if(x.t==='W') return W(pasPot(x.a,p), x.n);
  if(x.t==='B'){ const A=pw(x.a,p), Bb=pw(x.b,p);
    if(A && Bb) return pwN(base, x.op==='·' ? A.e+Bb.e : A.e-Bb.e);
    return B(x.op, pasPot(x.a,p), pasPot(x.b,p)); }
  throw new Error('pasPot');
}
function passosPot(x, p){ const out=[]; let k=0; while(!pw(x,p)){ x=pasPot(x,p); out.push(x); if(++k>12) throw new Error('passosPot'); } return {passos:out, e:pw(x,p).e}; }
/* escriu en base p els nombres que en són potència (4 → 2², 27 → 3³) */
function logP(v, p){ let k=0, x=F(v); if(x.n===0) return null; let inv=false; if(x.n===1 && x.d!==1){ x=x.inv(); inv=true; } if(x.d!==1||x.n<1) return null; while(x.n%p===0){ x=F(x.n/p); k++; } return x.n===1 ? (inv?-k:k) : null; }
function enBase(x, p, sotaW=false){
  if(x.t==='L'){ const k=logP(x.v,p); if(k===null) throw new Error('no és potència de '+p); if(k===1) return x; const w=W(p,k); return sotaW?P(w):w; }
  if(x.t==='P') return P(enBase(x.a,p));
  if(x.t==='W') return W(enBase(x.a,p,true), x.n);
  if(x.t==='B') return B(x.op, enBase(x.a,p), enBase(x.b,p));
  return x;
}
const buitExp = h => `${h}<sup><span class="buit">?</span></sup>`;
/* pregunta amb resposta «exponent»: e és l'expressió, p la base final (o 'x') */
function expQ(e, p, opts={}){
  const base = p===undefined ? 'x' : p;
  const eb = p===undefined ? e : enBase(e,p);
  const {passos:ps, e:r} = passosPot(eb, p);
  if(Math.abs(r)>(opts.maxE||20)) return null;
  const baseH = base==='x' ? '<i>x</i>' : fmtInt(base);
  const res = [];
  if(eb!==e && et(eb)!==et(e)) res.push(`Ho escrivim tot en base ${baseH}: ${m(eh(e,false)+' = '+eh(eb,false))}`);
  res.push(m(eh(eb,false)+' '+ps.map(x=>'= '+eh(x,false)).join(' ')));
  res.push('Producte de la mateixa base: se sumen els exponents. Quocient: es resten. Potència d’una potència: es multipliquen.');
  return { enunciat:opts.enunciat||`Simplifica fins a una sola potència de base ${baseH}. Quin és l’exponent?`, gran:`${eh(e,false)} = ${buitExp(baseH)}`, camps:[cEnter(r,{et:'Exponent'})],
    pista:opts.pista, res, v:{k:'unapot', txt:et(e), b:base==='x'?2:base, n:r, x:base==='x'} };
}
plantilla(6,'AS','6-mateixa','Producte o quocient de la mateixa base (2³ · 2⁴ = 2⁷)', () => retry(() => {
  const p=rand(2,9), op=pick(['·',':']); let a=rand(1,8), b=rand(0,6); if(op===':' && a<b) [a,b]=[b,a];
  const e=B(op, W(p,a), W(p,b)), r = op==='·' ? a+b : a-b;
  const val = r<=1 ? ` = ${r===0?'1':fmtInt(p)}` : '';
  return { enunciat:'Simplifica en una sola potència. Quin és l’exponent?', gran:`${eh(e,false)} = ${buitExp(fmtInt(p))}`, camps:[cEnter(r,{et:'Exponent'})],
    pista: op==='·' ? 'Producte de potències de la mateixa base: es deixa la base i se sumen els exponents.' : 'Quocient de potències de la mateixa base: es deixa la base i es resten els exponents.',
    res:[m(`${eh(e,false)} = ${sup(fmtInt(p), `${a} ${op==='·'?'+':'−'} ${b}`)} = ${sup(fmtInt(p), r)}${val}`), op==='·' ? 'Mateixa base: se sumen els exponents.' : 'Mateixa base: es resten els exponents.'], v:{k:'unapot', txt:et(e), b:p, n:r} };
}));
plantilla(6,'AS','6-negenter','Exponent negatiu amb base entera (2⁻³ = 1/8)', () => retry(() => {
  const a=pick([2,3,4,5,10,-2,-3,-1,6,7]), n=rand(1,3); if(Math.abs(a)**n>=1000 || (a===-1 && n<3)) return null;
  const nn = a===-1 ? pick([3,5,4]) : n;
  const e=W(a,-nn), r=ev(e);
  return { enunciat:'Calcula. Expressa el resultat com a fracció o enter:', gran:eh(e,false), camps:[(r.isInt()?cEnter:cFrac)(r)],
    pista:'Un exponent negatiu vol dir «u partit per la potència amb l’exponent positiu».',
    res:[m(`${eh(e,false)} = ${fracRaw(1, sup(a<0?'('+fmtInt(a)+')':fmtInt(a), nn))} = ${fracRaw(1, fmtInt(a**nn))}${r.isInt()||(a**nn)<0?' = '+fr(r):''}`)], v:{k:'expr', txt:et(e), r} };
}));
function base2Q(neg){
  return retry(() => {
    const n = neg ? rand(-5,7) : rand(0,9); if(neg && n>=0 && coin(0.6)) return null;
    const N_=F(2).pow(n);
    const h = n>=0 ? fmtInt(N_.n) : (n>=-3 && coin(0.4) ? decStr(N_) : fr(N_));
    const res = n>0 ? m(`${fmtInt(N_.n)} = ${Array(n).fill(2).join(' · ')} = ${sup(2,n)}`)
      : n===0 ? m('1 = '+sup(2,0))+': tot nombre diferent de 0 elevat a 0 val 1.'
      : m(`${h} = ${h.includes(',')?fr(N_)+' = ':''}${fracRaw(1, sup(2,-n))} = ${sup(2,n)}`);
    return { enunciat:`Expressa ${m(h)} com una potència de base 2. Quin és l’exponent?`, gran:`${h} = ${buitExp('2')}`, camps:[cEnter(n,{et:'Exponent'})],
      pista: neg ? 'Si el nombre és més petit que 1, escriu-lo com a 1 partit per una potència de 2: l’exponent serà negatiu.' : 'Divideix successivament entre 2 i compta quantes vegades ho has fet. Recorda que 1 = 2<sup>0</sup>.',
      res:[res], v:{k:'base', b:2, n, N:N_} };
  });
}
plantilla(6,'AS','6-base2','Expressar un nombre com a potència de base 2 (32 = 2⁵)', () => base2Q(false));
plantilla(6,'AN','6-base2','Potència de base 2, també amb exponent negatiu (1/4 = 2⁻²)', () => base2Q(true));
const DEC_BASE = [[F(1,2),'0,5'],[F(1,4),'0,25'],[F(3,4),'0,75'],[F(3,2),'1,5'],[F(1,5),'0,2'],[F(5,2),'2,5']];
plantilla(6,'AN','6-negfrac','Exponent negatiu amb base fracció o decimal ((2/3)⁻² = 9/4)', () => retry(() => {
  const n=rand(1,3);
  if(coin(0.35)){
    const [f,h]=pick(DEC_BASE), r=f.pow(-n); if(!amable(r,125,125)) return null;
    const g=`${par(h)}<sup>${fmtInt(-n)}</sup>`;
    return { enunciat:'Calcula. Expressa el resultat com a fracció o enter:', gran:g, camps:[(r.isInt()?cEnter:cFrac)(r)],
      pista:'Passa el decimal a fracció. Després gira la fracció i canvia el signe de l’exponent.',
      res:[m(`${g} = ${eh(W(f,-n),false)} = ${n===1?fr(f.inv()):eh(W(f.inv(),n),false)}${n===1?'':' = '+fr(r)}`)], v:{k:'negdec', s:h, f, n:-n, r} };
  }
  const f=frIrr([2,3,4,5],1.6).mul(coin(0.3)?-1:1), e=W(f,-n), r=ev(e); if(!amable(r,125,125)) return null;
  return { enunciat:'Calcula. Expressa el resultat com a fracció o enter:', gran:eh(e,false), camps:[(r.isInt()?cEnter:cFrac)(r)],
    pista:'Gira la fracció (fes-ne l’invers) i l’exponent passa a ser positiu.',
    res:[m(`${eh(e,false)} = ${n===1?fr(f.inv()):eh(W(f.inv(),n),false)}${n===1?'':' = '+fr(r)}`)], v:{k:'expr', txt:et(e), r} };
}));
const POT_DE = {2:[4,8,16,32], 3:[9,27], 5:[25]};
plantilla(6,'AN','6-canvi','Una sola potència canviant la base (4⁴ · 2³ = 2¹¹)', () => retry(() => {
  const p=pick([2,2,3,3,5]), Xb=pick(POT_DE[p]), mm=rand(1,4), n=rand(1,5), op=pick(['·',':']);
  const e = pick([
    ()=>B(op, W(Xb,mm), W(p,n)),
    ()=>B('·', W(p,n), W(Xb,mm)),
    ()=>W(P(W(Xb,mm)), rand(2,3)),
    ()=>B(op, W(Xb,mm), W(pick(POT_DE[p]),rand(1,3))),
  ])();
  const q=expQ(e,p,{maxE:16, pista:`Escriu ${fmtInt(Xb)} com a potència de ${p} i aplica les propietats.`}); if(!q || q.v.n<0) return null;
  return q;
}));
plantilla(6,'AN','6-mateixexp','Mateix exponent: 2³ · 5³ = 10³, 7⁴ : 3⁴ = (7/3)⁴', () => retry(() => {
  const a=pick([2,3,4,5,6,10,-2]), b=pick([2,3,4,5,7]), n=rand(2,5), op=pick(['·',':']);
  if(a===b) return null;
  const base = op==='·' ? F(a).mul(b) : F(a).div(b), e=B(op, W(a,n), W(b,n));
  if(Math.abs(base.n)>40) return null;
  const vh = base.d===1 && base.n>0 ? fmtInt(base.n) : par(fr(base));
  const val = n<=2 ? ' = '+fr(base.pow(n)) : '';
  return { enunciat:'Expressa com una sola potència. Quina és la base?', gran:`${eh(e,false)} = ${par('<span class="buit">?</span>')}<sup>${n}</sup>`, camps:[(base.isInt()?cEnter:cFrac)(base,{et:'Base'})],
    pista:'Si l’exponent és el mateix, es multipliquen (o es divideixen) les bases i es deixa l’exponent.',
    res:[m(`${eh(e,false)} = ${par(`${frp(F(a))} ${op} ${b}`)}<sup>${n}</sup> = ${vh}<sup>${n}</sup>${val}`), 'Mateix exponent: es fa l’operació amb les bases i l’exponent es manté.'], v:{k:'mexp', a, b, op, n, r:base} };
}));
plantilla(6,'AE','6-una','Una sola potència amb exponents negatius ((9³ · 27)² : 3¹⁵)', () => retry(() => {
  const p=pick([2,3]), Xb=pick(POT_DE[p]), Yb=pick(POT_DE[p]);
  const ex = () => rand(-3,5) || 2;
  const e = pick([
    ()=>B(pick(['·',':']), W(p,ex()), W(p,ex())),
    ()=>W(P(W(p,ex())), rand(-3,4) || 2),
    ()=>B(':', W(p,rand(4,9)), P(B('·', W(p,ex()), W(p,ex())))),
    ()=>B(':', B('·', W(p,rand(1,4)), W(Xb,rand(1,3))), W(Yb,rand(1,3))),
    ()=>B(':', W(P(B('·', W(Xb,rand(1,3)), Yb)), rand(2,3)), W(p,rand(5,15))),
  ])();
  const t=et(e); if(!/\^-/.test(t) && coin(0.5)) return null;
  return expQ(e,p,{maxE:15});
}));
plantilla(6,'AE','6-lletres','Una sola potència amb lletres ((x⁴ · x⁷)² : (x⁵)⁴)', () => retry(() => {
  const ex = () => rand(2,7);
  const e = pick([
    ()=>B(':', W(P(B('·', W(X(),ex()), W(X(),ex()))), rand(2,3)), W(P(W(X(),ex())), rand(2,4))),
    ()=>B('·', W(X(),ex()), W(P(W(X(),ex())), -rand(1,3))),
    ()=>B(':', B('·', W(X(),ex()), W(X(),ex())), W(X(),ex())),
    ()=>W(P(B(':', W(X(),ex()), W(X(),ex()))), rand(2,3)),
  ])();
  return expQ(e, undefined, {maxE:20});
}));
plantilla(6,'AE','6-calcula','Operacions amb exponents negatius (3⁻¹ + (3/2)⁻² + 6⁻¹)', () => retry(() => {
  const a=rand(2,6), b=rand(2,6), f=frIrr([2,3,4,5],1.6), g=frIrr([2,3,4,5],1.6), h=pick([F(1,2),F(1,3),F(2,3)]);
  const e = pick([
    ()=>B('+', B('+', W(a,-1), W(f,-2)), W(b,-1)),
    ()=>B('−', B('+', W(f,-2), W(g,-1)), W(h,3)),
    ()=>B('·', B('·', W(f,-2), W(f,3)), W(f.inv(),2)),
    ()=>B('+', B(':', W(a,-1), W(b,2)), g),
    ()=>B(pick(['+','−']), W(f,-1), W(a,-2)),
  ])();
  return exprQ(e, null, 99, 72);
}));
plantilla(6,'AE','6-combinada','Operacions amb potències (3³ − 3², (3/4)² · (2/3)³)', () => retry(() => {
  const a=rand(2,5), b=frIrr([2,3,4,5],1.4), c=frIrr([2,3,4,5],1.4), d=frIrr(DEN_AS,1.2);
  if(b.eq(c)||b.eq(c.inv())) return null;   /* bases diferents: sense propietats de potències */
  const e = pick([
    ()=>B(pick(['+','−']), W(a,rand(2,3)), W(a,pick([0,1,2]))),
    ()=>B('·', W(b,2), W(c,pick([2,3]))),
    ()=>B(pick(['+','−']), W(b,pick([2,3])), B('·', d, W(c,pick([0,2])))),
    ()=>B(':', W(b.neg(),pick([2,3])), P(B(pick(['+','−']), c, d))),
    ()=>B('+', W(-a,pick([2,3])), W(b,pick([0,1,2]))),
  ])();
  const q=exprQ(e, null, 99, 72); if(!q) return null;
  q.v.pot=true; return q;
}));

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
  if(c.tipus==='tria'){ return raw.t===c.ok ? {p:1} : {p:0}; }
  if(c.tipus==='per'){
    const net = x => String(x==null?'':x).replace(/\s/g,'');
    const e=net(raw.e), a=net(raw.a), pr=net(raw.p);
    if(!/^\d+$/.test(e) || !/^\d*$/.test(a) || !/^\d*$/.test(pr) || e.length>9 || a.length>9 || pr.length>9) return {p:0, buit:!e};
    if(!valPer(Number(e),a,pr).eq(c.v)) return {p:0};
    const x=expand(c.v);
    if(String(Number(e))===String(x.ent) && a===x.ante && pr===x.per) return {p:1};
    return {p:0.5, msg:`El valor és correcte, però s’escriu ${m(decH(c.v))}: el període va sota el barret una sola vegada.`};
  }
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
    if(c.tipus==='tria') return {t:c.ok};
    if(c.tipus==='per'){ const x=expand(c.v); return desimplificada && x.per ? {e:String(x.ent), a:x.ante+x.per, p:x.per} : {e:String(x.ent), a:x.ante, p:x.per}; }
    if(c.tipus==='dec') return {t:decStr(c.v).replace(MENYS,'-').replace(/\./g,'')};
    if(c.tipus==='arrel' && c.no) return {no:true};
    const v=c.v, k=desimplificada?2:1;
    const pm = c.tipus==='arrel' && c.pm;
    return {s:pm?'pm':'', n:String((pm?Math.abs(v.n):v.n)*k), d:String(v.d*k)};
  });
}
/* com s'escriu la solució (per al missatge d'incorrecte) */
function solucioH(q){
  if(q.mc) return q.mc.opcions[q.mc.ok];
  if(q.camps) return q.camps.map(c=>{
    const et = c.et && q.camps.length>1 ? (c.etMat? m(c.et) : c.et)+': ' : '';
    if(c.tipus==='dig') return et+c.s;
    if(c.tipus==='tria') return et+c.opcions[c.ok].toLowerCase();
    if(c.tipus==='per') return et+m(decH(c.v));
    if(c.tipus==='dec') return et+m(decStr(c.v));
    if(c.tipus==='arrel') return et+(c.no?'no existeix':m((c.pm?'±':'')+fr(c.pm?c.v.abs():c.v)));
    return et+m(fr(c.v));
  }).join(' · ');
  return '';
}

/* ═══════════════════ Generació de proves ═══════════════════ */
const APARTATS = ['Equivalents i simplificació','Operacions','Part d’un total i %','Tipus de racionals','Potències bàsiques','Potències','Arrels'];
const NIVELLS = {
  AS:{nom:'AS', llarg:'Assoliment satisfactori', desc:'Un sol pas, molts d’opció múltiple. Amb pista.', pista:true},
  AN:{nom:'AN', llarg:'Assoliment notable', desc:'Resposta oberta, 2 o 3 passos, amb negatius. Pista opcional.', pista:true},
  AE:{nom:'AE', llarg:'Assoliment excel·lent', desc:'Molts passos i problemes. Sense pista.', pista:false},
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
const SIMULACRE = [2,2,2,2,1,2,1];   /* 12 preguntes */
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
const DESA='repas-racionals-v3';   /* v3: 7 apartats (potències bàsiques i potències) */
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
(function(){ const d=llegeix(); if(NIVELLS[d.niv]) st.niv=d.niv; if(d.mode==='simulacre'||d.mode==='apartats') st.mode=d.mode; if(Array.isArray(d.aps) && d.aps.length && d.aps.every(a=>a>=1&&a<=APARTATS.length)) st.aps=d.aps; })();

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
      <div class="rp-aps-cap"><span>Apartats</span><button type="button" class="enllac" id="tots">${st.aps.length===APARTATS.length?'Cap':'Tots'}</button></div>
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
  const llegeixAps = () => { st.aps=[...app.querySelectorAll('.rp-ap input')].filter(x=>x.checked).map(x=>+x.value); $('#tots').textContent = st.aps.length===APARTATS.length?'Cap':'Tots'; };
  app.querySelectorAll('.rp-ap input').forEach(x=>x.onchange=llegeixAps);
  $('#tots').onclick=()=>{ const tots=st.aps.length!==APARTATS.length; app.querySelectorAll('.rp-ap input').forEach(x=>x.checked=tots); llegeixAps(); };
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
  if(c.tipus==='tria') return `<div class="rp-camp" data-i="${i}">${et}<span class="rp-seg">${c.opcions.map((o,j)=>`<button type="button" data-v="${j}" aria-pressed="false">${o}</button>`).join('')}</span></div>`;
  if(c.tipus==='per') return `<div class="rp-camp" data-i="${i}">${et}<span class="rp-perin">
      <label><input class="box rp-box" data-r="e" inputmode="numeric" autocomplete="off" aria-label="part entera"><small>part entera</small></label><span class="rp-coma">,</span>
      <label><input class="box rp-box rp-ample" data-r="a" inputmode="numeric" autocomplete="off" aria-label="xifres decimals que no es repeteixen"><small>sense barret</small></label>
      <label><span class="rp-barret"></span><input class="box rp-box rp-ample" data-r="p" inputmode="numeric" autocomplete="off" aria-label="període (amb barret)"><small>període (barret)</small></label>
    </span><span class="rp-camp-nota">Si no hi ha període, deixa’l buit; si és enter, omple només la part entera.</span></div>`;
  /* el signe negatiu s'escriu a la casella (−3); a les arrels hi ha a més el botó ± */
  const sH = c.tipus==='arrel' ? `<button type="button" class="rp-pm" aria-pressed="false" aria-label="més o menys" title="Dues arrels: ±">±</button>` : '';
  let cos;
  if(c.tipus==='dec') cos=`<input class="box rp-box rp-ample" inputmode="decimal" autocomplete="off" aria-label="nombre decimal" placeholder="0,0">`;
  else if(c.tipus==='enter' || (c.tipus==='arrel' && c.forma==='enter')) cos=`<input class="box rp-box" data-r="n" inputmode="text" autocomplete="off" aria-label="nombre">`;
  else cos=`<span class="rp-fin"><input class="box rp-box" data-r="n" inputmode="text" autocomplete="off" aria-label="numerador"><span class="rp-ratlla"></span><input class="box rp-box" data-r="d" inputmode="numeric" autocomplete="off" aria-label="denominador"></span>`;
  const no = c.tipus==='arrel' && c.permetNo ? `<button type="button" class="rp-no" aria-pressed="false">No existeix en ℚ</button>` : '';
  return `<div class="rp-camp" data-i="${i}">${et}<span class="rp-entrada">${sH}${cos}</span>${no}</div>`;
}
const NOTA_SIGNE = '<p class="rp-nota-signe">Si el resultat és negatiu, escriu el signe − davant del nombre (al numerador si és una fracció).</p>';
/* recordatori de com s'escriu el signe, només on hi pot haver resultats negatius */
function notaSigne(q){
  const pot = q.ap===7 || (q.ap===6 && q.id!=='6-mateixa' && !(q.id==='6-base2' && q.niv==='AS')) || ([1,2,5].includes(q.ap) && q.niv!=='AS');
  if(!pot || !q.camps.some(c=>['frac','enter','arrel'].includes(c.tipus))) return '';
  return q.camps.some(c=>c.tipus==='arrel') ? NOTA_SIGNE.replace('.</p>','. Si hi ha dues arrels, marca el botó ±.</p>') : NOTA_SIGNE;
}
function respostaH(q){
  if(q.mc) return `<div class="rp-opcions${q.mc.opcions.some(o=>o.length>60)?' rp-llarg':''}">${q.mc.opcions.map((o,i)=>`<button type="button" class="rp-op" data-i="${i}"><span class="rp-op-lletra">${'ABCD'[i]}</span><span>${o}</span></button>`).join('')}</div>`;
  if(q.vf) { const [a,b]=q.vfEt||['V','F']; return `<div class="rp-vf">${q.vf.map((x,i)=>`<div class="rp-vf-fila" data-i="${i}"><span class="rp-vf-h">${x.h}</span><span class="rp-seg"><button type="button" data-v="1" aria-pressed="false">${a==='V'?'Vertader':a}</button><button type="button" data-v="0" aria-pressed="false">${b==='F'?'Fals':b}</button></span></div>`).join('')}</div>`; }
  if(q.classifica) return `<div class="rp-vf">${q.classifica.items.map((x,i)=>`<div class="rp-vf-fila" data-i="${i}"><span class="rp-vf-h">${m(x.h)}</span><span class="rp-seg">${q.classifica.cats.map((c,j)=>`<button type="button" data-v="${j}" aria-pressed="false">${c}</button>`).join('')}</span></div>`).join('')}</div>`;
  if(q.ordena) return `<p class="rp-ord-et">↑ més petit</p><ol class="rp-ord" id="ord">${shuffleNoOk(q.ordena).map(i=>`<li class="rp-ord-it" data-k="${i}"><span class="rp-ord-mans" aria-hidden="true">⠿</span><span class="mt">${q.ordena.items[i]}</span><span class="rp-ord-btns"><button type="button" data-d="-1" aria-label="Puja">▲</button><button type="button" data-d="1" aria-label="Baixa">▼</button></span></li>`).join('')}</ol><p class="rp-ord-et">↓ més gran</p>`;
  return `<div class="rp-camps">${q.camps.map(campH).join('')}</div>${notaSigne(q)}`;
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
  R.querySelectorAll('.rp-pm').forEach(b=>b.onclick=()=>{ if(st.fet) return; b.setAttribute('aria-pressed', b.getAttribute('aria-pressed')!=='true'); const c=b.closest('.rp-camp'), no=c.querySelector('.rp-no'); if(no){ no.setAttribute('aria-pressed','false'); c.classList.remove('rp-off'); } });
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
  return [...R.querySelectorAll('.rp-camp')].map((c,i)=>{
    const tc=q.camps[i].tipus;
    if(tc==='tria'){ const b=c.querySelector('.rp-seg button[aria-pressed="true"]'); return {t:b?+b.dataset.v:null}; }
    if(tc==='per') return {e:c.querySelector('[data-r="e"]').value, a:c.querySelector('[data-r="a"]').value, p:c.querySelector('[data-r="p"]').value};
    const pm=c.querySelector('.rp-pm[aria-pressed="true"]');
    const no=c.querySelector('.rp-no');
    const n=c.querySelector('[data-r="n"]'), d=c.querySelector('[data-r="d"]'), t=c.querySelector('input:not([data-r])');
    return {s:pm?'pm':'', n:n?n.value:'', d:d?d.value:'', t:t?t.value:'', no:no?no.getAttribute('aria-pressed')==='true':false};
  });
}
function incomplet(q, raw){
  if(q.mc) return raw===null;
  if(q.vf || q.classifica) return raw.some(x=>x===null);
  if(q.ordena) return false;
  return raw.some((r,i)=>{ const tc=q.camps[i].tipus;
    if(tc==='tria') return r.t===null;
    if(tc==='per') return !String(r.e).trim();
    return !r.no && !String(r.n||r.t||'').trim(); });
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
  if(q.camps) R.querySelectorAll('.rp-camp').forEach((c,i)=>{ const p=r.det[i].p; c.classList.add(p===1?'rp-c-ok':p>0?'rp-c-mig':'rp-c-ko');
    if(q.camps[i].tipus==='tria') c.querySelectorAll('.rp-seg button').forEach(b=>{ if(+b.dataset.v===q.camps[i].ok) b.classList.add('rp-bo'); else if(b.getAttribute('aria-pressed')==='true') b.classList.add('rp-mal'); }); });
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
