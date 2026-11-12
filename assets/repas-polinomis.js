/* Aplicatiu «Repàs del tema 2 · Polinomis» (3r d'ESO) · el munta repas-polinomis.html
   Tres nivells (AS, AN, AE), mode per apartats o simulacre. Els exercicis surten de
   plantilles amb nombres a l'atzar i només són dels tipus que hi ha al quadern i als
   apunts del tema. Tota l'aritmètica és exacta (fraccions d'enters).
   La part de dalt (motor i plantilles) no toca el DOM: la prova automàtica
   (proves/prova-repas-polinomis.js) la carrega amb Node. */
(function(){
"use strict";

/* ═══════════════════ Aritmètica exacta ═══════════════════ */
function gcd(a,b){ a=Math.abs(a); b=Math.abs(b); while(b){ [a,b]=[b,a%b]; } return a; }
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
  neg(){ return new Fr(-this.n,this.d); }
  abs(){ return new Fr(Math.abs(this.n),this.d); }
  eq(o){ o=F(o); return this.n===o.n && this.d===o.d; }
  isInt(){ return this.d===1; }
}
const F = (n,d) => n instanceof Fr ? n : new Fr(n,d);
const Z = F(0);

/* ═══════════════════ Atzar ═══════════════════ */
const rand = (a,b) => a + Math.floor(Math.random()*(b-a+1));
const pick = arr => arr[Math.floor(Math.random()*arr.length)];
const coin = (p=0.5) => Math.random()<p;
const nz = (a,b) => { let k; do{ k=rand(a,b); }while(k===0); return k; };
const sgn = (p=0.5) => coin(p) ? -1 : 1;
function shuffle(a){ a=a.slice(); for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
function retry(fn, n=4000){ for(let i=0;i<n;i++){ const r=fn(); if(r) return r; } throw new Error('no he trobat cap exercici vàlid'); }
const LLETRES = ['x','x','x','a','b','y','m','n','p','t'];
const lletra = () => pick(LLETRES);

/* ═══════════════════ Polinomis d'una lletra ═══════════════════ */
/* un polinomi és una llista de coeficients (Fr): p[k] és el coeficient de grau k */
function trim(p){ p=p.slice(); while(p.length && p[p.length-1].n===0) p.pop(); return p; }
function pol(ts){ const p=[]; for(const [c,e] of ts){ while(p.length<=e) p.push(Z); p[e]=p[e].add(F(c)); } return trim(p); }
const pAdd = (a,b) => { const r=[]; for(let i=0;i<Math.max(a.length,b.length);i++) r.push((a[i]||Z).add(b[i]||Z)); return trim(r); };
const pNeg = a => a.map(c=>c.neg());
const pSub = (a,b) => pAdd(a,pNeg(b));
function pMul(a,b){ if(!a.length||!b.length) return []; const r=Array(a.length+b.length-1).fill(Z); a.forEach((x,i)=>b.forEach((y,j)=>{ r[i+j]=r[i+j].add(x.mul(y)); })); return trim(r); }
const pEq = (a,b) => { a=trim(a); b=trim(b); return a.length===b.length && a.every((c,i)=>c.eq(b[i])); };
const grauP = p => trim(p).length-1;
/* termes en ordre decreixent (sense els zeros) */
const tl = p => { const out=[]; for(let k=p.length-1;k>=0;k--) if(p[k].n!==0) out.push({c:p[k], e:k}); return out; };
const tlPol = ts => pol(ts.map(t=>[t.c,t.e]));
const T_ = (c,e) => ({c:F(c), e});
const coefsAmables = (p, maxN=99, maxD=12) => p.every(c=>Math.abs(c.n)<=maxN && c.d<=maxD);

/* ═══════════════════ Escriptura (HTML i text) ═══════════════════ */
const MENYS='−';
const m = h => `<span class="mt">${h}</span>`;
const fracRaw = (n,d) => `<span class="frac"><span>${n}</span><span>${d}</span></span>`;
function fr(f){ f=F(f); if(f.d===1) return (f.n<0?MENYS:'')+Math.abs(f.n); return (f.n<0?MENYS:'')+fracRaw(Math.abs(f.n),f.d); }
const teFrac = h => h.includes('class="frac"');
const par = h => teFrac(h) ? `<span class="par">(</span>${h}<span class="par">)</span>` : `<span class="pr">(</span>${h}<span class="pr">)</span>`;
const sg = s => `<span class="sg">${s}</span>`;
const litH = (e,L) => e===0 ? '' : `<span class="lit"><i>${L}</i>${e>1?`<sup>${e}</sup>`:''}</span>`;
function coefAbsH(c,e){ const a=F(c).abs(); if(e>0 && a.eq(1)) return ''; return a.d===1 ? String(a.n) : fracRaw(a.n,a.d); }
/* llista de termes {c,e} tal com s'ha d'escriure (pot estar desordenada) */
function tlH(ts,L){
  if(!ts.length) return '0';
  return '<span class="pol">'+ts.map((t,i)=>{ const c=F(t.c); const s = i===0 ? (c.n<0?MENYS:'') : sg(c.n<0?MENYS:'+'); return `<span class="t">${s}${coefAbsH(c,t.e)}${litH(t.e,L)}</span>`; }).join('')+'</span>';
}
const pH = (p,L) => tlH(tl(p),L);
const cT = c => `(${F(c).n}/${F(c).d})`;
const tlT = (ts,L) => ts.length ? '('+ts.map(t=>`${cT(t.c)}*${L}^${t.e}`).join('+')+')' : '(0)';
const pT = (p,L) => tlT(tl(p),L);

/* monomis de diverses lletres: {c, v:{x:2, y:1}} */
const mon = (c,v) => ({c:F(c), v});
const grauM = mm => Object.values(mm.v).reduce((s,e)=>s+e,0);
const clauM = mm => Object.keys(mm.v).filter(k=>mm.v[k]).sort().map(k=>k+mm.v[k]).join('');
const litMH = mm => Object.keys(mm.v).filter(k=>mm.v[k]).sort().map(k=>litH(mm.v[k],k)).join('');
function monH(mm, primer=true){ const c=mm.c; const s = primer ? (c.n<0?MENYS:'') : sg(c.n<0?MENYS:'+'); const lit=litMH(mm); const a=c.abs(); return `<span class="t">${s}${lit && a.eq(1) ? '' : (a.d===1?String(a.n):fracRaw(a.n,a.d))}${lit}</span>`; }
const msH = ms => '<span class="pol">'+ms.map((x,i)=>monH(x,i===0)).join('')+'</span>';
const monT = mm => [cT(mm.c), ...Object.keys(mm.v).filter(k=>mm.v[k]).map(k=>`${k}^${mm.v[k]}`)].join('*');
const msT = ms => '('+ms.map(monT).join('+')+')';

/* ═══════════════════ Expressions ═══════════════════ */
/* p: polinomi (amb l'ordre d'escriptura ts) · + − · : operacions · q: quadrat · (): parèntesi */
const Ep = (p,L,ts) => ({t:'p', p:trim(p), L, ts: ts || tl(p)});
const Et = (ts,L) => Ep(tlPol(ts),L,ts);
const Ea = (a,b) => ({t:'+',a,b}), Es = (a,b) => ({t:'−',a,b}), Em = (a,b) => ({t:'·',a,b});
const Eq = a => ({t:'q',a}), Epar = a => ({t:'()',a});
/* suma o resta un terme segons el seu signe (per no escriure «+ (−3x)») */
const EaT = (e, t, L) => F(t.c).n<0 ? Es(e, Et([T_(F(t.c).neg(),t.e)],L)) : Ea(e, Et([t],L));
function ev(e){
  switch(e.t){
    case 'p': return e.p;
    case '+': return pAdd(ev(e.a),ev(e.b));
    case '−': return pSub(ev(e.a),ev(e.b));
    case '·': return pMul(ev(e.a),ev(e.b));
    case 'q': { const x=ev(e.a); return pMul(x,x); }
    case '()': return ev(e.a);
  }
}
function et(e){
  switch(e.t){
    case 'p': return tlT(e.ts,e.L);
    case '+': return `(${et(e.a)}+${et(e.b)})`;
    case '−': return `(${et(e.a)}-${et(e.b)})`;
    case '·': return `(${et(e.a)}*${et(e.b)})`;
    case 'q': return `(${et(e.a)})^2`;
    case '()': return et(e.a);
  }
}
const unTerme = e => e.t==='p' && e.ts.length===1;
const comencaMenys = h => h.startsWith(MENYS) || h.startsWith('<span class="pol"><span class="t">'+MENYS);
function factorH(x, primer){
  if(x.t==='p'){ if(x.ts.length>1) return par(eh(x)); const h=eh(x); return (!primer && comencaMenys(h)) ? par(h) : h; }
  if(x.t==='+'||x.t==='−') return par(eh(x));
  return eh(x);
}
function eh(e){
  switch(e.t){
    case 'p': return tlH(e.ts,e.L);
    case '()': return par(eh(e.a));
    case 'q': return (unTerme(e.a) && F(e.a.ts[0].c).eq(1) ? eh(e.a) : par(eh(e.a)))+'<sup>2</sup>';
    case '+': case '−': {
      let r=eh(e.b);
      if(comencaMenys(r) || (e.t==='−' && e.b.t==='p' && e.b.ts.length>1) || (e.t==='−' && (e.b.t==='+'||e.b.t==='−'))) r=par(r);
      return `${eh(e.a)}${sg(e.t)}${r}`;
    }
    case '·': {
      const a=e.a, b=e.b;
      const rb=factorH(b,false), parB = rb.startsWith('<span class="pr">(')||rb.startsWith('<span class="par">(');
      /* −(x + 4): el −1 només és el signe */
      if(a.t==='p' && a.ts.length===1 && a.ts[0].e===0 && Math.abs(F(a.ts[0].c).n)===1 && F(a.ts[0].c).d===1 && parB) return (F(a.ts[0].c).n<0?MENYS:'')+rb;
      const ra=factorH(a,true);
      return parB ? `${ra}${rb}` : `${ra}${sg('·')}${rb}`;
    }
  }
}


/* resolució d'una operació combinada: primer cada producte o quadrat, després es treuen parèntesis i s'agrupa */
function resComb(e, L){
  const ops=[]; (function rec(x, sgn){ if(x.t==='+'||x.t==='−'){ rec(x.a, sgn); rec(x.b, x.t==='−'?-sgn:sgn); } else ops.push({x, sgn}); })(e, 1);
  const linies=[];
  ops.forEach(o=>{ if(o.x.t==='q'||o.x.t==='·') linies.push(`${m(eh(o.x))} = ${m(pH(ev(o.x),L))}`); });
  const subst=ops.map((o,i)=>{ const p=ev(o.x), h=(o.x.t==='p' && o.x.ts.length===1) ? tlH(o.x.ts.map(t=>T_(F(t.c).abs(),t.e)),L) : par(pH(p,L)); const neg = o.x.t==='p' && o.x.ts.length===1 ? (o.sgn*F(o.x.ts[0].c).n<0) : o.sgn<0; return (i===0 ? (neg?MENYS:'') : sg(neg?MENYS:'+'))+h; }).join('');
  linies.push(`${m(eh(e))} = ${m(subst)}`);
  const sense=[]; ops.forEach(o=>{ tl(ev(o.x)).forEach(t=>sense.push(T_(t.c.mul(o.sgn),t.e))); });
  linies.push(`= ${m(tlH(sense,L))}`);
  linies.push(`= ${m(pH(ev(e),L))}`);
  return linies;
}
/* ═══════════════════ Preguntes ═══════════════════ */
/* camps de resposta: pol (una casella per grau), enter, frac */
const cPol   = (p, L, G, o={}) => Object.assign({tipus:'pol', p:trim(p), L, G: Math.max(G==null?0:G, grauP(p))}, o);
const cEnter = (v, o={}) => Object.assign({tipus:'enter', v:F(v)}, o);
const cFrac  = (v, o={}) => Object.assign({tipus:'frac', v:F(v), simp:true}, o);
/* opció múltiple: la primera és la correcta; es barregen i es treuen repetides.
   Cada opció és [html, text] (el text el fa servir la prova automàtica) o només html. */
function mc(correcta, altres){
  const ops=[correcta]; for(const a of altres){ const h=Array.isArray(a)?a[0]:a; if(!ops.some(o=>(Array.isArray(o)?o[0]:o)===h)) ops.push(a); }
  const o=shuffle(ops); const okH=Array.isArray(correcta)?correcta[0]:correcta;
  return {opcions:o.map(x=>Array.isArray(x)?x[0]:x), txt:o.map(x=>Array.isArray(x)?x[1]:null), ok:o.findIndex(x=>(Array.isArray(x)?x[0]:x)===okH)};
}
const opE = e => [m(eh(e)), et(e)];
/* pregunta d'operar: enunciat + expressió + resposta en caselles */
function opQ(enunciat, e, L, o={}){
  const r=ev(e);
  return Object.assign({ enunciat, gran:eh(e), camps:[cPol(r,L,o.G)], v:{k:'expr', txt:et(e), L} }, o.extra||{});
}

const T = [];
function plantilla(ap, niv, id, nom, gen){ T.push({ap, niv, id, nom, gen}); }

/* ─────────── 1. Llenguatge algebraic ─────────── */
plantilla(1,'AS','1-tradueix','Tradueix un enunciat', () => {
  const L=pick(['x','n']), k=rand(2,4), b=pick([2,3,4,5,6,7,8,9].filter(v=>v!==k)), nomK={2:'doble',3:'triple',4:'quàdruple'}[k];
  const E = (ts) => Et(ts.map(([c,e])=>T_(c,e)), L);
  const casos = [
    () => ({t:`El ${nomK} d’un nombre ${L === 'x' ? '<i>x</i>' : '<i>n</i>'}, més ${b}`, ok:E([[k,1],[b,0]]), d:[Em(E([[k,0]]),E([[1,1],[b,0]])), E([[1,1],[k*b,0]]), E([[b,1],[k,0]])]}),
    () => ({t:`El ${nomK} d’un nombre ${L === 'x' ? '<i>x</i>' : '<i>n</i>'}, menys ${b}`, ok:E([[k,1],[-b,0]]), d:[Em(E([[k,0]]),E([[1,1],[-b,0]])), E([[1,1],[-k*b,0]]), E([[b,1],[-k,0]])]}),
    () => ({t:`El quadrat d’un nombre ${L === 'x' ? '<i>x</i>' : '<i>n</i>'}, més ${b}`, ok:E([[1,2],[b,0]]), d:[Eq(E([[1,1],[b,0]])), E([[2,1],[b,0]]), E([[1,2],[b*b,0]])]}),
    () => ({t:`La suma d’un nombre ${L === 'x' ? '<i>x</i>' : '<i>n</i>'} i el seu consecutiu`, ok:E([[2,1],[1,0]]), d:[E([[1,1],[1,0]]), E([[2,1]]), E([[1,2],[1,0]])]}),
    () => ({t:`El ${nomK} de la suma d’un nombre ${L === 'x' ? '<i>x</i>' : '<i>n</i>'} i ${b}`, ok:Em(E([[k,0]]),E([[1,1],[b,0]])), d:[E([[k,1],[b,0]]), E([[1,1],[k*b,0]]), E([[1,1],[k,0]])]}),
  ];
  const c=pick(casos)();
  const o=mc(opE(c.ok), c.d.map(opE));
  return { enunciat:`Quina expressió algebraica correspon a aquest enunciat?<br><b>${c.t}</b>`, mc:o,
    pista:'Llegeix l’enunciat a poc a poc: «el doble de…» multiplica per 2 tot el que ve darrere; «el quadrat» és elevar a 2.',
    res:[`${c.t}: ${m(eh(c.ok))}`], v:{k:'mc-eq', ok:et(c.ok)} };
});
plantilla(1,'AS','1-figures','Perímetres i àrees', () => {
  const casos = [
    {t:'El perímetre d’un quadrat de costat <i>x</i>', ok:[m('4<i>x</i>'),'4*x'], d:[[m('<i>x</i><sup>2</sup>'),'x^2'],[m('2<i>x</i>'),'2*x'],[m('<i>x</i><sup>4</sup>'),'x^4']], r:'Els quatre costats fan <i>x</i>: <i>x</i> + <i>x</i> + <i>x</i> + <i>x</i> = 4<i>x</i>.'},
    {t:'L’àrea d’un quadrat de costat <i>x</i>', ok:[m('<i>x</i><sup>2</sup>'),'x^2'], d:[[m('4<i>x</i>'),'4*x'],[m('2<i>x</i>'),'2*x'],[m('<i>x</i><sup>4</sup>'),'x^4']], r:'Àrea = costat · costat = <i>x</i> · <i>x</i> = <i>x</i><sup>2</sup>.'},
    {t:'El perímetre d’un triangle equilàter de costat <i>x</i>', ok:[m('3<i>x</i>'),'3*x'], d:[[m('<i>x</i><sup>3</sup>'),'x^3'],[m('3 + <i>x</i>'),'3+x'],[m('2<i>x</i>'),'2*x']], r:'Té tres costats iguals: <i>x</i> + <i>x</i> + <i>x</i> = 3<i>x</i>.'},
    {t:'El perímetre d’un rectangle de base <i>b</i> i altura <i>h</i>', ok:[m('2<i>b</i> + 2<i>h</i>'),'2*b+2*h'], d:[[m('<i>b</i> · <i>h</i>'),'b*h'],[m('<i>b</i> + <i>h</i>'),'b+h'],[m('2<i>b</i><i>h</i>'),'2*b*h']], r:'Dues bases i dues altures: <i>b</i> + <i>h</i> + <i>b</i> + <i>h</i> = 2<i>b</i> + 2<i>h</i>.'},
    {t:'L’àrea d’un rectangle de base <i>b</i> i altura <i>h</i>', ok:[m('<i>b</i> · <i>h</i>'),'b*h'], d:[[m('2<i>b</i> + 2<i>h</i>'),'2*b+2*h'],[m('<i>b</i> + <i>h</i>'),'b+h'],[m('<i>b</i><sup>2</sup><i>h</i>'),'b^2*h']], r:'Àrea del rectangle = base · altura = <i>b</i> · <i>h</i>.'},
    {t:'La longitud d’una circumferència de radi <i>r</i>', ok:[m('2π<i>r</i>'),'2*P*r'], d:[[m('π<i>r</i><sup>2</sup>'),'P*r^2'],[m('2<i>r</i>'),'2*r'],[m('π<i>r</i>'),'P*r']], r:'La longitud de la circumferència és 2π<i>r</i>.'},
    {t:'L’àrea d’un cercle de radi <i>r</i>', ok:[m('π<i>r</i><sup>2</sup>'),'P*r^2'], d:[[m('2π<i>r</i>'),'2*P*r'],[m('<i>r</i><sup>2</sup>'),'r^2'],[m('2π<i>r</i><sup>2</sup>'),'2*P*r^2']], r:'L’àrea del cercle és π<i>r</i><sup>2</sup>.'},
  ];
  const c=pick(casos), o=mc(c.ok, c.d);
  return { enunciat:`Quina expressió algebraica correspon a aquest enunciat?<br><b>${c.t}</b>`, mc:o, pista:'El perímetre és la suma de tots els costats; l’àrea, la superfície de dins.', res:[c.r], v:{k:'mc-fix'} };
});
const CONTEXTOS = [
  () => { const a=rand(3,6), b=rand(1,3); return {t:`Un taxi cobra ${a} € per pujar-hi i ${b} € per cada quilòmetre. Escriu el cost, en euros, d’un viatge de <i>x</i> km.`, L:'x', p:pol([[b,1],[a,0]]), r:[`${b} € per cada km: ${m(b+'<i>x</i>')}. Més els ${a} € de pujar-hi: ${m(pH(pol([[b,1],[a,0]]),'x'))}.`], pista:'Una part és fixa i l’altra depèn dels quilòmetres.'}; },
  () => { const p=rand(2,5), q=p+rand(1,4); return {t:`Una botiga compra cada samarreta a ${p} € i la ven a ${q} €. Escriu el benefici total, en euros, si en ven <i>b</i>.`, L:'b', p:pol([[q-p,1]]), r:[`Per cada samarreta guanya ${q} − ${p} = ${q-p} €.`, `Amb <i>b</i> samarretes: ${m((q-p)+'<i>b</i>')}.`], pista:'Calcula primer quant guanya amb cada samarreta.'}; },
  () => { const a=rand(5,12), b=rand(2,4); return {t:`Llogar una bicicleta costa ${a} € de fiança més ${b} € per hora. Escriu el cost, en euros, de llogar-la <i>t</i> hores.`, L:'t', p:pol([[b,1],[a,0]]), r:[`${b} € cada hora: ${m(b+'<i>t</i>')}. Més la fiança: ${m(pH(pol([[b,1],[a,0]]),'t'))}.`], pista:'Una part és fixa i l’altra depèn de les hores.'}; },
  () => { const a=rand(4,10), k=rand(2,5); return {t:`Una entrada de cinema costa <i>x</i> euros i unes crispetes, ${a} €. Escriu quant paguen ${k} amics si cadascú compra una entrada i unes crispetes.`, L:'x', p:pol([[k,1],[k*a,0]]), r:[`Cada amic paga ${m(pH(pol([[1,1],[a,0]]),'x'))}.`, `${k} amics: ${m(k+par(pH(pol([[1,1],[a,0]]),'x')))} = ${m(pH(pol([[k,1],[k*a,0]]),'x'))}.`], pista:'Escriu primer el que paga un amic i multiplica-ho pel nombre d’amics.'}; },
];
plantilla(1,'AN','1-context','Expressió d’una situació', () => {
  const c=pick(CONTEXTOS)();
  return { enunciat:c.t, camps:[cPol(c.p,c.L,1)], pista:c.pista, res:c.r, v:{k:'pol-fix'} };
});
plantilla(1,'AN','1-pot','El pot comú', () => {
  const k=rand(3,9)*100, a=rand(2,8)*10;
  const p=pol([[a,1],[k,0]]);
  return { enunciat:`Un grup de <i>x</i> amics ha estalviat ${k} € entre tots. Després, cadascun hi afegeix ${a} € més. Quants euros hi ha ara al pot?`, camps:[cPol(p,'x',1)], pista:'Cada amic hi posa la mateixa quantitat: multiplica-la pel nombre d’amics i suma-hi el que ja hi havia.',
    res:[`Els <i>x</i> amics hi afegeixen ${m(a+'<i>x</i>')} €; amb el que ja hi havia: ${m(pH(p,'x'))}.`], v:{k:'pol-fix'} };
});
plantilla(1,'AE','1-pot-part','El pot comú i una part', () => {
  const d=pick([2,4,5]), nom={2:'la meitat',4:'la quarta part',5:'la cinquena part'}[d];
  const k=d*rand(2,9)*20, a=d*rand(2,6)*5;
  const tot=pol([[a,1],[k,0]]), r=pol([[a/d,1],[k/d,0]]);
  return { enunciat:`Un grup de <i>x</i> amics té ${k} € al pot comú i cadascun hi afegeix ${a} € més. Destinen ${nom} del pot a comprar menjar. Escriu aquesta despesa simplificada al màxim.`, camps:[cPol(r,'x',1)],
    res:[`Al pot hi ha ${m(pH(tot,'x'))}.`, `${nom[0].toUpperCase()+nom.slice(1)}: ${m(fracRaw(pH(tot,'x'),d))} = ${m(pH(r,'x'))}.`], v:{k:'pol-fix'} };
});
plantilla(1,'AE','1-piscina','Piscina rectangular', () => {
  const a=rand(2,4), b=rand(1,6);
  const llarg=pol([[a,1],[b,0]]), per=pol([[2*a+2,1],[2*b,0]]), area=pol([[a,2],[b,1]]);
  const nomA={2:'el doble',3:'el triple',4:'el quàdruple'}[a];
  return { enunciat:`El costat curt d’una piscina rectangular fa <i>x</i> metres i el costat llarg fa ${nomA} del curt més ${b} m. Escriu el perímetre i l’àrea de la piscina.`,
    camps:[cPol(per,'x',1,{et:'Perímetre'}), cPol(area,'x',2,{et:'Àrea'})],
    res:[`Costat llarg: ${m(pH(llarg,'x'))}.`, `Perímetre: ${m('2<i>x</i>'+sg('+')+'2'+par(pH(llarg,'x')))} = ${m(pH(per,'x'))}.`, `Àrea: ${m('<i>x</i>'+par(pH(llarg,'x')))} = ${m(pH(area,'x'))}.`],
    v:{k:'pol-fix'} };
});
plantilla(1,'AE','1-caixa','Caixa de base quadrada', () => {
  const k=rand(2,5);
  const arestes=pol([[8+4*k,1]]), vol=pol([[k,3]]);
  return { enunciat:`Una caixa té forma de prisma de base quadrada. El costat de la base fa <i>x</i> i l’alçada, ${k}<i>x</i>. Escriu la suma de les longituds de totes les arestes i el volum de la caixa.`,
    camps:[cPol(arestes,'x',1,{et:'Arestes'}), cPol(vol,'x',3,{et:'Volum'})],
    res:[`Arestes: 8 de la base i la tapa, ${m('8<i>x</i>')}, i 4 d’alçada, ${m('4 · '+k+'<i>x</i>')} = ${m(4*k+'<i>x</i>')}. Total: ${m(pH(arestes,'x'))}.`, `Volum: ${m('<i>x</i> · <i>x</i> · '+k+'<i>x</i>')} = ${m(pH(vol,'x'))}.`],
    v:{k:'pol-fix'} };
});

/* ─────────── 2. Monomis i polinomis ─────────── */
const GRUPS_L = [['x','y'],['x','y','z'],['a','b'],['a','b','c'],['m','n'],['p','q']];
function monAtzar(ls, maxE=3, minL=1){ const v={}; const n=rand(minL, ls.length); shuffle(ls).slice(0,n).forEach(l=>{ v[l]=rand(1,maxE); }); return v; }
plantilla(2,'AS','2-monomi','Coeficient i grau d’un monomi', () => {
  const ls=pick(GRUPS_L), mm=mon(nz(-9,12)*1, monAtzar(ls,4));
  return { enunciat:'Indica el coeficient i el grau d’aquest monomi:', gran:msH([mm]),
    camps:[cEnter(mm.c,{et:'Coeficient'}), cEnter(grauM(mm),{et:'Grau'})], pista:'El coeficient és el nombre (amb el seu signe). El grau és la suma dels exponents de les lletres.',
    res:[`Coeficient: ${m(fr(mm.c))}.`, `Grau: ${Object.keys(mm.v).sort().map(k=>mm.v[k]).join(' + ')} = ${grauM(mm)}.`], v:{k:'mon', mm} };
});
function semblantQ(ambFrac){
  const ls=pick(GRUPS_L.filter(g=>g.length>=2)), v=monAtzar(ls,3,2);
  const ks=Object.keys(v);
  const cf = () => ambFrac && coin(0.3) ? F(nz(-5,5), pick([2,3,4,5])) : F(nz(ambFrac?-9:1,9));
  const obj=mon(cf(),v), ok=mon(cf(),Object.assign({},v));
  const dist=[];
  const k1=ks[0], k2=ks[1];
  if(v[k1]!==v[k2]){ const w=Object.assign({},v); [w[k1],w[k2]]=[v[k2],v[k1]]; dist.push(w); }
  { const w=Object.assign({},v); w[k1]=v[k1]+1; dist.push(w); }
  { const w=Object.assign({},v); delete w[k2]; dist.push(w); }
  { const w=Object.assign({},v); w[k2]=v[k2]+1; dist.push(w); }
  const o=mc(m(msH([ok])), dist.slice(0,3).map(w=>m(msH([mon(cf(),w)]))));
  return { enunciat:`Quin d’aquests monomis és semblant a ${m(msH([obj]))}?`, mc:o, pista:'Dos monomis són semblants si tenen exactament la mateixa part literal (les mateixes lletres amb els mateixos exponents). El coeficient pot ser diferent.',
    res:[`La part literal de ${m(msH([obj]))} és ${m(litMH(obj))}: el semblant és ${m(msH([ok]))}.`], v:{k:'semblant', obj, ok} };
}
plantilla(2,'AS','2-semblant','Monomis semblants', () => semblantQ(false));
plantilla(2,'AS','2-polinomi','Termes i grau d’un polinomi', () => {
  const L=lletra(), n=rand(2,4), graus=shuffle([0,1,2,3,4]).slice(0,n).sort((a,b)=>b-a);
  const ts=graus.map(e=>T_(nz(-9,9),e)); if(ts[0].c.n<0) ts[0].c=ts[0].c.neg();
  return { enunciat:'Quants termes té aquest polinomi i quin grau té?', gran:tlH(ts,L),
    camps:[cEnter(n,{et:'Nombre de termes'}), cEnter(graus[0],{et:'Grau'})], pista:'Compta els sumands. El grau del polinomi és el grau més alt dels seus termes.',
    res:[`Té ${n} termes.`, `El terme de grau més alt és ${m(tlH([ts[0]],L))}: el grau del polinomi és ${graus[0]}.`], v:{k:'pol-info', ts, n, g:graus[0]} };
});
plantilla(2,'AN','2-monomi','Coeficient i grau (fraccions i signes)', () => {
  const ls=pick(GRUPS_L);
  const c = pick([()=>F(nz(-7,7),pick([2,3,4,5])), ()=>F(-1), ()=>F(1), ()=>F(nz(-12,-2))])();
  const mm=mon(c, monAtzar(ls,5));
  return { enunciat:'Indica el coeficient i el grau d’aquest monomi:', gran:msH([mm]),
    camps:[cFrac(mm.c,{et:'Coeficient'}), cEnter(grauM(mm),{et:'Grau'})], pista:'Si no hi ha cap nombre davant, el coeficient és 1 (o −1 si hi ha un signe −).',
    res:[`Coeficient: ${m(fr(mm.c))}${c.abs().eq(1)?' (no s’escriu, però hi és)':''}.`, `Grau: ${Object.keys(mm.v).sort().map(k=>mm.v[k]).join(' + ')} = ${grauM(mm)}.`], v:{k:'mon', mm} };
});
plantilla(2,'AN','2-polinomi','Termes, grau i terme independent', () => retry(() => {
  const ls=pick(GRUPS_L.filter(g=>g.length<=3)), n=rand(3,4);
  const ms=[]; for(let i=0;i<n-1;i++) ms.push(mon(nz(-9,9),monAtzar(ls,4)));
  if(new Set(ms.map(clauM)).size<ms.length) return null;
  const ind = coin(0.75) ? nz(-12,12) : 0;
  if(ind) ms.splice(rand(1,ms.length),0,mon(ind,{}));
  const graus=ms.map(grauM), g=Math.max(...graus);
  if(graus.filter(x=>x===g).length>1) return null;
  const alt=ms[graus.indexOf(g)];
  return { enunciat:'Analitza aquest polinomi:', gran:msH(ms),
    camps:[cEnter(ms.length,{et:'Nombre de termes'}), cEnter(g,{et:'Grau'}), cEnter(ind,{et:'Terme independent'})],
    pista:'El grau de cada terme és la suma dels exponents. El terme independent és el que no té lletra (amb el seu signe); si no n’hi ha, és 0.',
    res:[`Té ${ms.length} termes.`, `Graus dels termes: ${ms.map(x=>`${m(msH([mon(x.c.abs(),x.v)]))} → ${grauM(x)}`).join(', ')}. El grau del polinomi és ${g} (${m(msH([alt]))}).`, `Terme independent: ${ind===0?'no n’hi ha, és 0':m(fr(ind))}.`],
    v:{k:'pol-multi', ms, ind} };
}));
plantilla(2,'AN','2-semblant','Monomis semblants (signes i fraccions)', () => semblantQ(true));
plantilla(2,'AE','2-grau-alt','El terme de grau més alt', () => retry(() => {
  const ls=pick(GRUPS_L.filter(g=>g.length>=2)), ms=[];
  for(let i=0;i<4;i++) ms.push(mon(nz(-9,9), monAtzar(ls,5)));
  ms.push(mon(nz(-9,9),{}));
  const graus=ms.map(grauM), g=Math.max(...graus);
  if(graus.filter(x=>x===g).length>1 || new Set(ms.map(clauM)).size<ms.length) return null;
  const alt=ms[graus.indexOf(g)];
  /* el parany: el terme amb l'exponent més gran d'una sola lletra no és el de grau més alt */
  const maxExp = x => Math.max(0,...Object.values(x.v));
  const trampa=ms.reduce((a,b)=>maxExp(b)>maxExp(a)?b:a);
  if(trampa===alt) return null;
  const o=mc(m(msH([alt])), ms.filter(x=>x!==alt && Object.keys(x.v).length).map(x=>m(msH([x]))));
  return { enunciat:`Quin és el terme de grau més alt del polinomi ${m(msH(ms))}?`, mc:o,
    res:[`Graus: ${ms.filter(x=>Object.keys(x.v).length).map(x=>`${m(msH([mon(x.c.abs(),x.v)]))} → ${grauM(x)}`).join(', ')}.`, `El de grau més alt és ${m(msH([alt]))}, de grau ${g}: el grau del polinomi és ${g}.`], v:{k:'grau-alt', ms, alt} };
}));
plantilla(2,'AE','2-redueix-grau','Redueix i troba el grau', () => retry(() => {
  const L=lletra(), g=rand(3,5), a=nz(-6,6);
  /* el terme de grau més alt s'anul·la en reduir */
  const ts=[T_(a,g), T_(nz(-9,9),g-1), T_(nz(-9,9),rand(0,g-2)), T_(-a,g), T_(nz(-9,9),g-1), T_(nz(-9,9),0)];
  const p=tlPol(ts); if(grauP(p)<1 || tl(p).length<2) return null;
  const ord=shuffle(ts); if(ord[0].c.n<0 && coin()) return null;
  return { enunciat:'Redueix el polinomi (agrupa els termes semblants i ordena’l) i indica’n el grau:', gran:tlH(ord,L),
    camps:[cPol(p,L,g,{et:'Reduït'}), cEnter(grauP(p),{et:'Grau'})],
    res:[`Agrupant els termes semblants: ${m(pH(p,L))}.`, `Els termes de grau ${g} s’anul·len (${m(fr(a))} ${a>0?MENYS:'+'} ${Math.abs(a)} = 0): el grau és ${grauP(p)}.`],
    v:{k:'expr', txt:tlT(ord,L), L, grau:true} };
}));

/* ─────────── 3. Suma i resta ─────────── */
function polAtzar(graus, neg, L){ return graus.map(e=>T_(neg ? nz(-9,9) : rand(1,9), e)); }
plantilla(3,'AS','3-redueix','Agrupa els termes semblants', () => retry(() => {
  const L=lletra(), ts=[T_(rand(2,9),1), T_(rand(1,9),0), T_(rand(1,9),1), T_(-rand(1,5),0)];
  if(coin()) ts.push(T_(rand(1,6),2));
  const ord=shuffle(ts); if(ord[0].c.n<0) return null;
  const p=tlPol(ts); if(p.some(c=>c.n<=0)) return null;
  return Object.assign(opQ('Agrupa i ordena els termes semblants:', Et(ord,L), L), {pista:'Suma per una banda els termes amb la mateixa lletra i exponent, i per l’altra els nombres.',
    res:[`= ${m(pH(p,L))}`]});
}));
plantilla(3,'AS','3-suma','Suma de dos polinomis', () => {
  const L=lletra(), P=Et(polAtzar([2,1,0],false),L), Q=Et(polAtzar(shuffle([[2,1],[1,0],[2,0]])[0],false),L);
  const e=Ea(Epar(P),Epar(Q));
  return Object.assign(opQ('Calcula i redueix:', e, L), {pista:'Treu els parèntesis (amb un + davant no canvia res) i suma els termes semblants.', res:[`= ${m(tlH([...P.ts,...Q.ts],L))}`, `= ${m(pH(ev(e),L))}`]});
});
plantilla(3,'AN','3-resta','Resta de polinomis', () => retry(() => {
  const L=lletra(), P=Et(polAtzar([3,2,1,0].filter(()=>coin(0.8)),true),L), Q=Et(polAtzar([2,1,0],true),L);
  if(P.ts.length<2 || P.ts[0].c.n<0 || Q.ts[0].c.n<0) return null;
  const e=Es(Epar(P),Epar(Q)), r=ev(e); if(tl(r).length<2) return null;
  return Object.assign(opQ('Calcula i redueix:', e, L, {G:3}), {pista:'Un signe − davant d’un parèntesi canvia el signe de tots els termes de dins.',
    res:[`= ${m(tlH([...P.ts,...Q.ts.map(t=>T_(t.c.neg(),t.e))],L))}`, `= ${m(pH(r,L))}`]});
}));
plantilla(3,'AN','3-noms','P(x) + Q(x) − R(x)', () => retry(() => {
  const L='x', P=polAtzar([2,1,0],true), Q=polAtzar([2,1,0],true), R=polAtzar([1,0],true);
  if(P[0].c.n<0||Q[0].c.n<0||R[0].c.n<0) return null;
  const ops=pick([['+','−'],['−','+'],['−','−']]);
  const eP=Et(P,L), eQ=Et(Q,L), eR=Et(R,L);
  const mk=(op,a,b)=>op==='+'?Ea(a,b):Es(a,b);
  const e=mk(ops[1], mk(ops[0], Epar(eP), Epar(eQ)), Epar(eR)), r=ev(e); if(tl(r).length<2) return null;
  const defs=`${m('<i>P</i>(<i>x</i>) = '+tlH(P,L))} &nbsp; ${m('<i>Q</i>(<i>x</i>) = '+tlH(Q,L))} &nbsp; ${m('<i>R</i>(<i>x</i>) = '+tlH(R,L))}`;
  const nom=`<i>P</i>(<i>x</i>) ${ops[0]} <i>Q</i>(<i>x</i>) ${ops[1]} <i>R</i>(<i>x</i>)`;
  return { enunciat:`Donats els polinomis<br>${defs}<br>calcula ${m(nom)}.`, gran:eh(e), camps:[cPol(r,L,2)], pista:'Escriu cada polinomi entre parèntesis; on hi ha un − davant, canvia el signe de tots els seus termes.',
    res:[`${m(nom)} = ${m(eh(e))}`, `= ${m(pH(r,L))}`], v:{k:'expr', txt:et(e), L} };
}));
plantilla(3,'AN','3-parentesi','Treu el parèntesi i redueix', () => retry(() => {
  const L=lletra(), a=rand(2,9), b=rand(1,9), c=rand(1,9);
  const e=Es(Et([T_(a,1)],L), Epar(Et([T_(rand(1,a-1)||1,1),T_(sgn()*b,0)],L)));
  const r=ev(e); if(tl(r).length<2) return null;
  const e2=pick([e, Ea(Et([T_(c,0)],L), Es(Et([T_(a,1)],L), e.b))]);
  return Object.assign(opQ('Simplifica tant com puguis:', e2, L), {pista:'Un signe − davant d’un parèntesi canvia el signe de tots els termes de dins.', res:[`= ${m(pH(ev(e2),L))}`]});
}));
plantilla(3,'AE','3-anul','Resta en què s’anul·len termes', () => retry(() => {
  const L=lletra(), g=pick([4,6]);
  const P=[T_(1,g),T_(nz(-5,5),g-2),T_(nz(-5,5),2),T_(nz(-5,5),0)];
  const Q=[T_(1,g),T_(P[1].c,g-2),T_(nz(-5,5),2),T_(P[3].c,0)];
  if(Q[2].c.eq(P[2].c) || g-2===2) return null;
  const e=Es(Epar(Et(P,L)),Epar(Et(Q,L)));
  return Object.assign(opQ('Simplifica tant com puguis:', e, L, {G:g}), {res:[`= ${m(tlH([...P,...Q.map(t=>T_(t.c.neg(),t.e))],L))}`, `= ${m(pH(ev(e),L))}`]});
}));
plantilla(3,'AE','3-fraccions','Suma i resta amb fraccions', () => retry(() => {
  const L='x', dens=[2,3,4,6];
  const fc = () => F(nz(-5,5), pick(dens));
  const P=[T_(fc(),2),T_(fc(),1),T_(fc(),0)], Q=[T_(fc(),1),T_(fc(),0)];
  if(P[0].c.n<0 || Q[0].c.n<0) return null;
  const e=pick([Es,Ea])(Epar(Et(P,L)),Epar(Et(Q,L))), r=ev(e);
  if(tl(r).length<3 || !coefsAmables(r,30,12)) return null;
  return Object.assign(opQ('Calcula i redueix (simplifica les fraccions):', e, L), {res:[`Agrupa els termes semblants i suma les fraccions: ${m(pH(r,L))}`]});
}));
plantilla(3,'AE','3-tres','Tres polinomis', () => retry(() => {
  const L='x', P=polAtzar([2,1,0],true), Q=polAtzar([1,0],true), R=polAtzar([2,1,0],true);
  if(P[0].c.n<0||Q[0].c.n<0||R[0].c.n<0) return null;
  const e=Es(Es(Epar(Et(P,L)),Epar(Et(Q,L))),Epar(Et(R,L))), r=ev(e); if(tl(r).length<2) return null;
  const defs=`${m('<i>P</i>(<i>x</i>) = '+tlH(P,L))} &nbsp; ${m('<i>Q</i>(<i>x</i>) = '+tlH(Q,L))} &nbsp; ${m('<i>R</i>(<i>x</i>) = '+tlH(R,L))}`;
  const nom='<i>P</i>(<i>x</i>) − <i>Q</i>(<i>x</i>) − <i>R</i>(<i>x</i>)';
  return { enunciat:`Donats els polinomis<br>${defs}<br>calcula ${m(nom)}.`, camps:[cPol(r,L,2)],
    res:[`${m(nom)} = ${m(eh(e))}`, `= ${m(tlH([...P,...Q.map(t=>T_(t.c.neg(),t.e)),...R.map(t=>T_(t.c.neg(),t.e))],L))}`, `= ${m(pH(r,L))}`], v:{k:'expr', txt:et(e), L} };
}));

/* ─────────── 4. Multiplicació ─────────── */
plantilla(4,'AS','4-nombre','Nombre per binomi', () => {
  const L=lletra(), k=rand(2,9), e=Em(Et([T_(k,0)],L), Et([T_(rand(1,9),1),T_(sgn()*rand(1,9),0)],L));
  return Object.assign(opQ('Calcula el producte:', e, L), {pista:'Multiplica el nombre per cada terme del parèntesi.', res:[`Multiplica ${k} per cada terme: ${m(pH(ev(e),L))}`]});
});
plantilla(4,'AS','4-monomi','Monomi per polinomi', () => {
  const L=lletra(), a=rand(2,6), ea=rand(1,2), e=Em(Et([T_(a,ea)],L), Et([T_(rand(1,6),rand(1,2)),T_(rand(1,9),0)],L));
  return Object.assign(opQ('Calcula el producte:', e, L, {G:ea+2}), {pista:'Multiplica el monomi per cada terme: els coeficients es multipliquen i els exponents de la lletra se sumen.', res:[`Multiplica ${m(tlH(e.a.ts,L))} per cada terme: ${m(pH(ev(e),L))}`]});
});
plantilla(4,'AN','4-monomi','Monomi per trinomi (amb signes)', () => {
  const L=lletra(), a=nz(-6,6), ea=rand(0,2);
  if(ea===0 && Math.abs(a)===1) return T.find(t=>t.id==='4-monomi'&&t.niv==='AN').gen();
  const e=Em(Et([T_(a,ea)],L), Et([T_(rand(1,5),2),T_(nz(-9,9),1),T_(nz(-9,9),0)].sort(()=>coin()?1:-1).sort((x,y)=>y.e-x.e),L));
  return Object.assign(opQ('Calcula el producte:', e, L, {G:ea+2}), {pista:'Multiplica el monomi per cada terme. Vigila amb la regla dels signes.', res:[`= ${m(tlH(e.b.ts.map(t=>T_(t.c.mul(a),t.e+ea)),L))}`]});
});
plantilla(4,'AN','4-binomis','Binomi per binomi', () => {
  const L=lletra(), e=Em(Et([T_(rand(1,3),1),T_(nz(-7,7),0)],L), Et([T_(rand(1,3),1),T_(nz(-7,7),0)],L));
  const [a,b]=e.a.ts, [c,d]=e.b.ts;
  const parts=[T_(a.c.mul(c.c),2),T_(a.c.mul(d.c),1),T_(b.c.mul(c.c),1),T_(b.c.mul(d.c),0)];
  return Object.assign(opQ('Multiplica i agrupa els termes semblants:', e, L, {G:2}), {pista:'Multiplica cada terme del primer parèntesi per cada terme del segon (4 productes) i després agrupa.',
    res:[`= ${m(tlH(parts,L))}`, `= ${m(pH(ev(e),L))}`]});
});
plantilla(4,'AE','4-trinomi','Trinomi per binomi', () => retry(() => {
  const L=lletra(), A=[T_(rand(1,4),2),T_(nz(-6,6),1),T_(nz(-6,6),0)], B=[T_(rand(1,3),1),T_(nz(-5,5),0)];
  const e=Em(Et(A,L),Et(B,L)), r=ev(e); if(tl(r).length<3) return null;
  const parts=[]; A.forEach(x=>B.forEach(y=>parts.push(T_(x.c.mul(y.c),x.e+y.e))));
  return Object.assign(opQ('Multiplica, ordena el resultat i agrupa els termes semblants:', e, L, {G:3}), {res:[`= ${m(tlH(parts,L))}`, `= ${m(pH(r,L))}`]});
}));
plantilla(4,'AE','4-fraccio','Fracció per polinomi', () => retry(() => {
  const L=lletra(), d=pick([2,3,4,5]), n=nz(-4,4), f=F(n,d); if(f.isInt()) return null;
  const B=[T_(d*rand(1,4),rand(1,2)),T_(sgn()*rand(1,12),0)];
  const e=Em(Et([T_(f,0)],L), Et(B,L)), r=ev(e);
  if(r.every(c=>c.isInt()) && coin(0.4)) return null;
  return Object.assign(opQ('Calcula el producte i simplifica les fraccions si es pot:', e, L, {G:2}), {res:[`Multiplica ${m(fr(f))} per cada terme: ${m(tlH(B.map(t=>T_(t.c.mul(f),t.e)),L))}`]});
}));

/* ─────────── 5. Operacions combinades ─────────── */
plantilla(5,'AS','5-parentesi','Nombre, parèntesi i suma', () => {
  const L=lletra(), a=rand(1,9), k=rand(2,6), b=rand(1,6), c=rand(1,6);
  const e=Ea(Ea(Et([T_(a,0)],L), Em(Et([T_(k,0)],L), Et([T_(1,1),T_(-b,0)],L))), Et([T_(c,1)],L));
  return Object.assign(opQ('Simplifica al màxim (primer la multiplicació):', e, L, {G:1}), {pista:'Primer fes la multiplicació del parèntesi; després agrupa els termes semblants.',
    res:[`= ${m(tlH([T_(a,0),T_(k,1),T_(-k*b,0),T_(c,1)],L))}`, `= ${m(pH(ev(e),L))}`]});
});
plantilla(5,'AS','5-dos','Dos productes i una suma', () => {
  const L=lletra(), k=rand(2,6), j=rand(2,6), A=[T_(1,1),T_(rand(1,9),0)], B=[T_(rand(2,5),1),T_(rand(1,9),0)];
  const e=Ea(Em(Et([T_(k,0)],L),Et(A,L)), Em(Et([T_(j,0)],L),Et(B,L)));
  return Object.assign(opQ('Simplifica al màxim:', e, L, {G:1}), {pista:'Fes cada multiplicació i després suma els termes semblants.',
    res:[`= ${m(tlH([...A.map(t=>T_(t.c.mul(k),t.e)),...B.map(t=>T_(t.c.mul(j),t.e))],L))}`, `= ${m(pH(ev(e),L))}`]});
});
plantilla(5,'AN','5-resta','Dos productes i una resta', () => retry(() => {
  const L=lletra(), k=rand(2,6), j=rand(2,6), A=[T_(rand(1,5),1),T_(nz(-9,9),0)], B=[T_(1,1),T_(nz(-9,9),0)];
  const e=Es(Em(Et([T_(k,0)],L),Et(A,L)), Em(Et([T_(j,0)],L),Et(B,L))), r=ev(e); if(tl(r).length<2) return null;
  return Object.assign(opQ('Simplifica al màxim:', e, L, {G:1}), {pista:'El − de davant del segon producte canvia el signe de tots els termes que surten d’aquest producte.',
    res:[`= ${m(tlH([...A.map(t=>T_(t.c.mul(k),t.e)),...B.map(t=>T_(t.c.mul(-j),t.e))],L))}`, `= ${m(pH(r,L))}`]});
}));
plantilla(5,'AN','5-monomi','Polinomi més monomi per binomi', () => retry(() => {
  const L=lletra(), a=rand(2,9), b=nz(-9,9), k=rand(2,5), c=rand(1,5), d=rand(1,5);
  const e=Ea(Et([T_(a,2),T_(b,1)],L), Em(Et([T_(k,1)],L),Et([T_(c,0),T_(d,1)],L))), r=ev(e); if(tl(r).length<2) return null;
  return Object.assign(opQ('Simplifica al màxim:', e, L, {G:2}), {pista:'Primer la multiplicació; després agrupa.', res:[`= ${m(tlH([T_(a,2),T_(b,1),T_(k*c,1),T_(k*d,2)],L))}`, `= ${m(pH(r,L))}`]});
}));
plantilla(5,'AN','5-binomis','Producte de binomis i suma', () => retry(() => {
  const L=lletra(), A=[T_(rand(1,3),1),T_(nz(-5,5),0)], B=[T_(1,1),T_(nz(-5,5),0)], C=[T_(nz(-3,3),2),T_(nz(-6,6),1)];
  const prod=Em(Et(A,L),Et(B,L)), e=EaT(EaT(prod,C[0],L),C[1],L), r=ev(e); if(tl(r).length<2) return null;
  return Object.assign(opQ('Simplifica al màxim:', e, L, {G:2}), {pista:'Multiplica els dos parèntesis (4 productes) i després agrupa amb la resta de termes.', res:resComb(e,L)});
}));
plantilla(5,'AE','5-quadrats','Quadrats i restes', () => retry(() => {
  const L=lletra(), a=rand(1,6), b=nz(-8,8);
  const casos=[
    () => EaT(Es(Eq(Et([T_(1,1),T_(a,0)],L)), Eq(Et([T_(1,1),T_(-a,0)],L))), T_(b,1), L),
    () => Es(Es(Eq(Et([T_(1,1),T_(a,0)],L)), Epar(Et([T_(1,2),T_(-a*a,0)],L))), Et([T_(2*a,1)],L)),
    () => Es(Et([T_(1,2),T_(-2*a,1),T_(a*a,0)],L), Em(Et([T_(1,1),T_(a,0)],L),Et([T_(1,1),T_(-a,0)],L))),
    () => EaT(Es(Em(Et([T_(rand(2,4),1),T_(nz(-5,5),0)],L),Et([T_(1,1),T_(a,0)],L)), Et([T_(1,2)],L)), T_(b,1), L),
  ];
  const e=pick(casos)(), r=ev(e); if(!r.length) return null;
  return Object.assign(opQ('Simplifica al màxim. Pensa quina operació has de fer primer!', e, L, {G:2}), {res:resComb(e,L)});
}));
plantilla(5,'AE','5-fraccions','Operacions amb fraccions', () => retry(() => {
  const L='x', f1=F(nz(1,5),pick([2,3,4])), f2=F(nz(1,5),pick([2,3,4,5])), f3=F(nz(-5,5),pick([2,3,6])), k=nz(-3,3);
  if(f1.isInt()||f2.isInt()||f3.isInt()) return null;
  const e=EaT(Es(Et([T_(f1,1)],L), Em(Et([T_(f2,0)],L),Et([T_(1,1),T_(k,0)],L))), T_(f3,2), L), r=ev(e);
  if(tl(r).length<3 || !coefsAmables(r,40,24)) return null;
  return Object.assign(opQ('Simplifica al màxim (deixa les fraccions irreductibles):', e, L, {G:2}), {res:resComb(e,L)});
}));

/* ─────────── 6. Factor comú ─────────── */
/* el factor comú màxim (coeficient positiu) i el que queda dins */
function factorComu(p){ const ts=tl(p); const g=ts.reduce((s,t)=>gcd(s,t.c.n),0); const e=Math.min(...ts.map(t=>t.e)); return {f:pol([[g,e]]), dins:pol(ts.map(t=>[F(t.c.n/g),t.e-e])), g, e}; }
function fcQ(ts, L, enunciat, o={}){
  const p=tlPol(ts), fc=factorComu(p), eMin=Math.min(...ts.map(t=>t.e)), gMax=grauP(p);
  return Object.assign({ enunciat, gran:tlH(ts,L), fc:true,
    camps:[cPol(fc.f,L,eMin,{et:'Factor comú'}), cPol(fc.dins,L,gMax-fc.e,{et:'Dins del parèntesi'})],
    res:[`m.c.d. dels coeficients: ${fc.g}. Lletra amb l’exponent més petit: ${fc.e?m(litH(fc.e,L)):'no n’hi ha a tots els termes'}.`, `${m(tlH(ts,L))} = ${m(pH(fc.f,L)+par(pH(fc.dins,L)))}`],
    pista:'Busca el m.c.d. dels coeficients i la lletra que surt a tots els termes, amb l’exponent més petit. Després divideix cada terme pel factor comú.',
    v:{k:'fc', txt:tlT(ts,L), L} }, o);
}
plantilla(6,'AS','6-nombre','Factor comú numèric', () => retry(() => {
  const L=lletra(), g=rand(2,7), a=rand(1,6), b=rand(1,9); if(gcd(a,b)!==1) return null;
  return fcQ([T_(g*a,1),T_(sgn()*g*b,0)], L, 'Extreu el factor comú:');
}));
plantilla(6,'AS','6-tria','Quina és la factorització?', () => retry(() => {
  const L=lletra(), g=pick([2,3,4,5,6]), a=rand(1,6), b=rand(1,9); if(gcd(a,b)!==1 || a===b) return null;
  const s=sgn(), ts=[T_(g*a,1),T_(s*g*b,0)];
  const E=(k,cs)=>Em(Et([T_(k[0],k[1])],L),Et(cs.map(([c,e])=>T_(c,e)),L));
  const ok=E([g,0],[[a,1],[s*b,0]]);
  const d=[E([g,0],[[a,1],[s*g*b,0]]), E([g,1],[[a,0],[s*b,0]]), E([g,0],[[a,1],[-s*b,0]])];
  const pf=[2,3].find(q=>g%q===0 && g!==q), noMax = pf ? E([pf,0],[[g*a/pf,1],[s*g*b/pf,0]]) : null; if(noMax) d.unshift(noMax);
  const o=mc(opE(ok), d.map(opE));
  return { enunciat:`Quina és la manera correcta de treure factor comú de ${m(tlH(ts,L))}?`, mc:o, pista:'Multiplica cada opció per comprovar-la, i tria la que té el factor comú més gran.',
    res:[`El m.c.d. de ${g*a} i ${g*b} és ${g}: ${m(tlH(ts,L))} = ${m(eh(ok))}.`], v:{k:'mc-eq', ok:et(ok), orig:tlT(ts,L), noMax: noMax ? m(eh(noMax)) : null} };
}));
plantilla(6,'AN','6-lletra','Factor comú amb lletres', () => retry(() => {
  const L=lletra(), g=rand(1,7), e=rand(1,2), n=rand(2,3);
  const graus=shuffle([0,1,2,3]).slice(0,n).sort((a,b)=>b-a);
  const cs=graus.map(()=>nz(-8,8)); if(cs[0]<0) cs[0]=-cs[0];
  if(cs.reduce((s,c)=>gcd(s,c),0)!==1) return null;
  const ts=graus.map((k,i)=>T_(g*cs[i],k+e)); if(g===1 && e===0) return null;
  return fcQ(ts, L, 'Extreu el factor comú (el més gran possible: nombres i lletres):');
}));
plantilla(6,'AN','6-problema','Un costat del rectangle', () => retry(() => {
  const L='x', k=rand(2,6), a=rand(1,5), b=rand(1,9);
  const area=[T_(k*a,2),T_(k*b,1)], costat=pol([[a,1],[b,0]]);
  return { enunciat:`Un rectangle té una àrea de ${m(tlH(area,L))} cm² i un dels costats fa ${m(k+'<i>x</i>')} cm. Quant fa l’altre costat?`, camps:[cPol(costat,L,1)],
    pista:'Treu el factor comú de l’àrea: el que queda dins del parèntesi és l’altre costat.',
    res:[`${m(tlH(area,L))} = ${m(k+'<i>x</i>'+par(pH(costat,L)))}`, `L’altre costat fa ${m(pH(costat,L))} cm.`], v:{k:'pol-fix'} };
}));
plantilla(6,'AE','6-alt','Factor comú amb exponents grans', () => retry(() => {
  const L=lletra(), e0=rand(10,40), a=rand(1,5), b=nz(-6,6), c=nz(-6,6), g=rand(1,4);
  const ts=[T_(g*a,e0+2),T_(g*b,e0+1),T_(g*c,e0)];
  const E=(k,cs)=>Em(Et([T_(k[0],k[1])],L),Et(cs.map(([cc,ee])=>T_(cc,ee)),L));
  const ok=E([g,e0],[[a,2],[b,1],[c,0]]);
  const noMax=E([g,1],[[a,e0+1],[b,e0],[c,e0-1]]);
  const d=[E([g,e0],[[a,e0+2],[b,e0+1],[c,0]]), noMax, E([g,e0+1],[[a,1],[b,0]])];
  const o=mc(opE(ok), d.map(opE));
  return { enunciat:`Quina és la factorització de ${m(tlH(ts,L))} amb el factor comú més gran?`, mc:o,
    res:[`La lletra surt a tots els termes; l’exponent més petit és ${e0}. Es divideix cada terme: es resten ${e0} als exponents.`, `${m(tlH(ts,L))} = ${m(eh(ok))}`], v:{k:'mc-eq', ok:et(ok), orig:tlT(ts,L), noMax:m(eh(noMax))} };
}));
plantilla(6,'AE','6-dues','Factor comú amb dues lletres', () => retry(() => {
  const ls=pick([['x','y'],['a','b'],['m','n']]), g=rand(2,6);
  const base={}; ls.forEach(l=>{ base[l]=rand(1,2); });
  const extres=[{},{},{}]; extres[0][ls[0]]=rand(1,2); extres[1][ls[1]]=rand(1,2); extres[2]={};
  const cs=[rand(1,5),nz(-6,6),nz(-6,6)]; if(cs.reduce((s,c)=>gcd(s,c),0)!==1) return null;
  const sum=(a,b)=>{ const r=Object.assign({},a); for(const k in b) r[k]=(r[k]||0)+b[k]; return r; };
  const ms=extres.map((x,i)=>mon(g*cs[i],sum(base,x)));
  const fac=mon(g,base), dins=extres.map((x,i)=>mon(cs[i],x));
  const okH=m(msH([fac])+par(msH(dins))), okT=`(${monT(fac)})*${msT(dins)}`;
  const menys=Object.assign({},base); menys[ls[0]]=Math.max(0,menys[ls[0]]-1);
  const d1m=dins.map(x=>mon(x.c,sum(x.v,{[ls[0]]:base[ls[0]]-menys[ls[0]]})));
  const d1=[m(msH([mon(g,menys)])+par(msH(d1m))), `(${monT(mon(g,menys))})*${msT(d1m)}`];
  const d2m=dins.map(x=>mon(x.c,x.v)); const fac2=mon(g,Object.assign({},base,{[ls[1]]:base[ls[1]]+1}));
  const d2=[m(msH([fac2])+par(msH(d2m))), `(${monT(fac2)})*${msT(d2m)}`];
  const d3m=dins.map(x=>mon(x.c.mul(g),x.v));
  const d3=[m(msH([mon(1,base)])+par(msH(d3m.map((x,i)=>i===2?mon(cs[2],x.v):x)))), `(${monT(mon(1,base))})*${msT(d3m.map((x,i)=>i===2?mon(cs[2],x.v):x))}`];
  const o=mc([okH,okT],[d1,d2,d3]);
  return { enunciat:`Quina és la factorització de ${m(msH(ms))} amb el factor comú més gran?`, mc:o,
    res:[`m.c.d. dels coeficients: ${g}. Lletres que surten a tots els termes, amb l’exponent més petit: ${m(litMH(fac))}.`, `${m(msH(ms))} = ${okH}`], v:{k:'mc-eq', ok:okT, orig:msT(ms), noMax:d1[0]} };
}));
plantilla(6,'AE','6-memoria','Càlcul de memòria', () => {
  const a=rand(12,49), sum=coin(), x=rand(41,89), y = sum ? 100-x : x-pick([10,20,30,40]);
  const r = sum ? a*(x+y) : a*(x-y);
  return { enunciat:`Calcula de memòria traient factor comú: ${m(`${a} · ${x} ${sum?'+':MENYS} ${a} · ${y}`)}`, camps:[cEnter(r,{et:'Resultat'})],
    res:[`${m(`${a} · ${x} ${sum?'+':MENYS} ${a} · ${y}`)} = ${m(a+par(`${x} ${sum?'+':MENYS} ${y}`))} = ${m(`${a} · ${sum?x+y:x-y}`)} = ${r}`], v:{k:'num', txt:`${a}*${x}${sum?'+':'-'}${a}*${y}`} };
});

/* ─────────── 7. Identitats notables ─────────── */
const NOMS_ID = {suma:'Quadrat d’una suma', dif:'Quadrat d’una diferència', sxd:'Suma per diferència'};
function idExpr(tipus, A, B, L){
  /* A i B: termes {c,e} positius; (A + B)², (A − B)², (A + B)(A − B) */
  if(tipus==='suma') return Eq(Et([A,B],L));
  if(tipus==='dif') return Eq(Et([A,T_(B.c.neg(),B.e)],L));
  return Em(Et([A,B],L), Et([A,T_(B.c.neg(),B.e)],L));
}
function idRes(tipus, A, B, L){
  const a=tlH([A],L), b=tlH([B],L), aa=pH(pMul(tlPol([A]),tlPol([A])),L), bb=pH(pMul(tlPol([B]),tlPol([B])),L), ab2=pH(pol([[A.c.mul(B.c).mul(2),A.e+B.e]]),L);
  if(tipus==='sxd') return `Suma per diferència, (<i>a</i> + <i>b</i>)(<i>a</i> − <i>b</i>) = <i>a</i><sup>2</sup> − <i>b</i><sup>2</sup>, amb <i>a</i> = ${m(a)} i <i>b</i> = ${m(b)}: ${m(aa)} − ${m(bb)}.`;
  return `${NOMS_ID[tipus]}, (<i>a</i> ${tipus==='suma'?'+':'−'} <i>b</i>)<sup>2</sup> = <i>a</i><sup>2</sup> ${tipus==='suma'?'+':'−'} 2<i>ab</i> + <i>b</i><sup>2</sup>, amb <i>a</i> = ${m(a)} i <i>b</i> = ${m(b)}: ${m(aa)} ${tipus==='suma'?'+':'−'} ${m(ab2)} + ${m(bb)}.`;
}
function idDes(niv){
  const L=lletra(), tipus=pick(['suma','dif','sxd']);
  let A, B;
  if(niv==='AS'){ A=T_(1,1); B=T_(rand(1,9),0); }
  else if(niv==='AN'){ A=T_(rand(2,5),1); B=T_(rand(1,7),0); if(coin(0.3)) [A,B]=[T_(rand(2,5),2),T_(rand(1,5),0)]; }
  else { const e=rand(1,2); A=T_(rand(1,5),e+1); B=T_(rand(1,6),e); }
  const e=idExpr(tipus,A,B,L), r=ev(e);
  return Object.assign(opQ('Desenvolupa fent servir les identitats notables:', e, L, {G:grauP(r)}), {pista:'(a + b)² = a² + 2ab + b² · (a − b)² = a² − 2ab + b² · (a + b)(a − b) = a² − b²',
    res:[idRes(tipus,A,B,L), `= ${m(pH(r,L))}`]});
}
plantilla(7,'AS','7-desenvolupa','Desenvolupa una identitat', () => idDes('AS'));
plantilla(7,'AN','7-desenvolupa','Desenvolupa (amb coeficients)', () => idDes('AN'));
plantilla(7,'AE','7-desenvolupa','Desenvolupa (amb potències)', () => idDes('AE'));
function idRec(niv){
  const L=lletra(), tipus=pick(['suma','dif','sxd']);
  let A, B;
  if(niv==='AS'){ A=T_(1,1); B=T_(rand(1,9),0); }
  else { A=pick([T_(rand(2,5),1),T_(1,1),T_(1,2)]); B=T_(rand(1,7),0); }
  const e=idExpr(tipus,A,B,L), r=ev(e);
  const altres=['suma','dif','sxd'].filter(t=>t!==tipus).map(t=>idExpr(t,A,B,L));
  const Bd=T_(B.c.mul(B.c),0); altres.push(idExpr(tipus==='sxd'?'suma':tipus, A, Bd, L));
  const o=mc(opE(e), altres.map(opE));
  return { enunciat:`Quina identitat notable correspon a ${m(pH(r,L))}?`, mc:o, pista:'Busca dos quadrats perfectes. Si hi ha un terme del mig, és el doble producte (amb el seu signe); si no n’hi ha i és una resta, és una suma per diferència.',
    res:[`${m(pH(r,L))} = ${m(eh(e))}`, idRes(tipus,A,B,L)], v:{k:'mc-eq', ok:et(e), orig:pT(r,L)} };
}
plantilla(7,'AS','7-reconeix','Reconeix la identitat', () => idRec('AS'));
plantilla(7,'AN','7-reconeix','Reconeix la identitat (amb coeficients)', () => idRec('AN'));
plantilla(7,'AE','7-cap','Quina no és una identitat notable?', () => retry(() => {
  const L=lletra(), A=T_(rand(1,4),1), ops=[];
  for(const t of shuffle(['suma','dif','sxd'])){ const B=T_(rand(1,7),0); ops.push([m(pH(ev(idExpr(t,A,B,L)),L)), pT(ev(idExpr(t,A,B,L)),L)]); }
  /* la que no ho és: suma de quadrats, o el terme del mig que no és el doble */
  const a=A.c.n, b=rand(1,7);
  const no = coin() ? pol([[a*a,2],[b*b,0]]) : pol([[a*a,2],[a*b,1],[b*b,0]]);
  const okH=m(pH(no,L));
  const o=mc(okH, ops.slice(0,3));
  return { enunciat:'Quina d’aquestes expressions <b>no</b> es pot escriure com una identitat notable?', mc:o,
    res:[`${okH} no és cap identitat notable: ${no.length===3 && no[1].n!==0 ? `el terme del mig hauria de ser el doble producte, ${m(pH(pol([[2*a*b,1]]),L))}` : 'una suma de quadrats no es pot escriure com un producte'}.`], v:{k:'mc-cap', no:pT(no,L), ops:ops.map(x=>x[1])} };
}));
plantilla(7,'AE','7-memoria','Calcula de memòria', () => {
  const casos=[
    () => { const n=pick([100,100,1000,50]), k=pick([1,2,3]), s=coin(); const v=s?n+k:n-k; return {t:`${v}<sup>2</sup>`, r:v*v, txt:`${v}^2`, res:`${v}<sup>2</sup> = (${n} ${s?'+':MENYS} ${k})<sup>2</sup> = ${n*n} ${s?'+':MENYS} ${2*n*k} + ${k*k} = ${v*v}`}; },
    () => { const n=pick([50,100,30,40,60]), k=rand(1,4); return {t:`${n+k} · ${n-k}`, r:(n+k)*(n-k), txt:`${n+k}*${n-k}`, res:`${n+k} · ${n-k} = (${n} + ${k})(${n} ${MENYS} ${k}) = ${n*n} ${MENYS} ${k*k} = ${(n+k)*(n-k)}`}; },
  ];
  const c=pick(casos)();
  return { enunciat:`Calcula sense calculadora fent servir una identitat notable: ${m(c.t)}`, camps:[cEnter(c.r,{et:'Resultat'})], res:[m(c.res)], v:{k:'num', txt:c.txt} };
});
plantilla(7,'AE','7-pati','El pati que s’amplia', () => {
  const k=rand(2,12), L='x';
  const area=ev(Eq(Et([T_(1,1),T_(k,0)],L))), aug=pol([[2*k,1],[k*k,0]]);
  return { enunciat:`Un pati quadrat fa <i>x</i> metres de costat. S’amplia allargant ${k} m cada costat, i continua sent quadrat. En quants metres quadrats augmenta l’àrea?`, camps:[cPol(aug,L,2)],
    res:[`Costat nou: ${m(pH(pol([[1,1],[k,0]]),L))}. Àrea nova: ${m(par(pH(pol([[1,1],[k,0]]),L))+'<sup>2</sup>')} = ${m(pH(area,L))}.`, `Augment: ${m(pH(area,L))} ${MENYS} ${m('<i>x</i><sup>2</sup>')} = ${m(pH(aug,L))}.`], v:{k:'pol-fix'} };
});

/* ═══════════════════ Correcció ═══════════════════ */
function parseInt_(s){
  s=String(s||'').trim().replace(/[−–]/g,'-').replace(/\s/g,'');
  if(!/^[+-]?\d+$/.test(s)) return null;
  const n=Number(s); return Number.isSafeInteger(n)?n:null;
}
/* una casella de coeficient: «−3», «3», «+3», «1/2», «-3/4», «1,5»; «−» o «+» sols valen ±1 (si hi ha lletra).
   Retorna null si és buida, NaN si no s'entén, o {v, simp} */
function llegeixCoef(raw, k){
  const s=String(raw==null?'':raw).trim().replace(/[−–]/g,'-').replace(/\s+/g,'');
  if(s==='') return null;
  if(s==='-'||s==='+') return k>0 ? {v:F(s==='-'?-1:1), simp:true} : NaN;
  let mm=/^([+-]?)(\d+)\/(\d+)$/.exec(s);
  if(mm){ const n=Number(mm[2]), d=Number(mm[3]); if(!d) return NaN; return {v:F((mm[1]==='-'?-1:1)*n,d), simp: gcd(n,d)===1 && d!==1}; }
  mm=/^([+-]?)(\d+)(?:[.,](\d+))?$/.exec(s);
  if(mm){ const dec=mm[3]||''; return {v:F((mm[1]==='-'?-1:1)*Number(mm[2]+dec), 10**dec.length), simp:true}; }
  return NaN;
}
function llegeixPol(c, raw){
  const g=(raw&&raw.g)||{}; const p=[]; let buit=true, simp=true;
  for(let k=0;k<=c.G;k++){ const x=llegeixCoef(g[k],k); if(x===null){ p.push(Z); continue; } buit=false; if(Number.isNaN(x)) return {mal:true}; p.push(x.v); if(!x.simp) simp=false; }
  return {p:trim(p), buit, simp};
}
function avaluaCamp(c, raw){
  raw=raw||{};
  if(c.tipus==='pol'){
    const r=llegeixPol(c,raw);
    if(r.mal) return {p:0, msg:'Hi ha alguna casella que no s’entén: escriu-hi només el coeficient (per exemple −3 o 1/2).'};
    if(r.buit) return {p:0, buit:true};
    if(pEq(r.p,c.p)) return r.simp ? {p:1} : {p:0.5, msg:'Correcte, però simplifica les fraccions.'};
    const absEq = r.p.length===c.p.length && r.p.every((x,i)=>x.abs().eq(c.p[i]||Z));
    return {p:0, msg: absEq ? 'Revisa els signes.' : null};
  }
  const nn=parseInt_(raw.n); if(nn===null) return {p:0, buit:!String(raw.n||'').trim()};
  let dd=1;
  if(c.tipus==='frac' && String(raw.d||'').trim()!==''){ dd=parseInt_(raw.d); if(dd===null||dd===0) return {p:0}; }
  const val=F(nn,dd);
  if(!val.eq(c.v)) return {p:0};
  if(c.simp && c.tipus==='frac' && (gcd(nn,dd)!==1 || dd<0)) return {p:0.5, msg:'Correcte, però simplifica-la.'};
  return {p:1};
}
/* factor comú: el producte ha de donar el polinomi i el factor ha de ser el més gran */
function avaluaFc(q, raw){
  const [cf,cd]=q.camps, f=llegeixPol(cf,raw[0]), d=llegeixPol(cd,raw[1]);
  if(f.mal||d.mal) return {p:0, det:[{p:0, msg:'Hi ha alguna casella que no s’entén.'},{p:0}]};
  const orig=pMul(cf.p,cd.p);
  const okF = pEq(f.p,cf.p) || pEq(f.p,pNeg(cf.p));
  if(!pEq(pMul(f.p,d.p),orig)){
    const det=[{p:okF?1:0},{p:0}];
    det[1].msg = okF ? 'El factor comú és bo, però revisa el que queda dins del parèntesi: si ho multipliques, no torna a donar el polinomi.' : 'Si multipliques el factor pel parèntesi, no torna a donar el polinomi.';
    return {p:det.reduce((s,x)=>s+x.p,0)/2, det};
  }
  if(okF) return {p:1, det:[{p:1},{p:1}]};
  return {p:0.5, det:[{p:0, msg:'La factorització és correcta, però encara es pot treure més factor comú.'},{p:1}]};
}
function avalua(q, raw){
  if(q.mc){ return {p: raw===q.mc.ok ? 1 : 0}; }
  if(q.fc) return avaluaFc(q, raw||[]);
  const det=q.camps.map((c,i)=>avaluaCamp(c, raw && raw[i]));
  return {p:det.reduce((s,d)=>s+d.p,0)/det.length, det};
}
/* resposta correcta en forma "raw" (per a la prova automàtica) */
const coefTxt = c => c.d===1 ? String(c.n) : `${c.n}/${c.d}`;
function rawCorrecte(q, desimplificada){
  if(q.mc) return q.mc.ok;
  return q.camps.map(c=>{
    if(c.tipus==='pol'){ const g={}; c.p.forEach((x,k)=>{ if(x.n!==0) g[k] = desimplificada && x.d>1 ? `${2*x.n}/${2*x.d}` : coefTxt(x); }); return {g}; }
    const k=desimplificada?2:1; return {n:String(c.v.n*k), d:String(c.v.d*k)};
  });
}
function solucioH(q){
  if(q.mc) return q.mc.opcions[q.mc.ok];
  if(q.fc) return m(pH(q.camps[0].p,q.camps[0].L)+par(pH(q.camps[1].p,q.camps[1].L)));
  return q.camps.map(c=>{
    const et = c.et && q.camps.length>1 ? c.et.toLowerCase()+': ' : '';
    if(c.tipus==='pol') return et+m(pH(c.p,c.L));
    return et+m(fr(c.v));
  }).join(' · ');
}

/* ═══════════════════ Generació de proves ═══════════════════ */
const APARTATS = ['Llenguatge algebraic','Monomis i polinomis','Suma i resta','Multiplicació','Operacions combinades','Factor comú','Identitats notables'];
const NIVELLS = {
  AS:{nom:'AS', llarg:'Assoliment satisfactori', desc:'Un sol pas, sense gaires signes negatius. Amb pista.', pista:true},
  AN:{nom:'AN', llarg:'Assoliment notable', desc:'Resposta oberta, 2 o 3 passos, amb negatius. Pista opcional.', pista:true},
  AE:{nom:'AE', llarg:'Assoliment excel·lent', desc:'Molts passos, fraccions i problemes. Sense pista.', pista:false},
};
const plantillesDe = (ap,niv) => T.filter(t=>t.ap===ap && t.niv===niv);
function genera(t){ const q=t.gen(); q.ap=t.ap; q.niv=t.niv; q.id=t.id; q.nom=t.nom; return q; }
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

const MOTOR = {Fr, F, gcd, T, APARTATS, NIVELLS, plantillesDe, genera, prova, avalua, avaluaCamp, rawCorrecte, solucioH, llegeixCoef, pMul, pAdd, pEq, ev, et, eh, pH, tl};
if(typeof module!=='undefined' && module.exports){ module.exports = MOTOR; }
if(typeof document==='undefined') return;

/* ═══════════════════ Interfície ═══════════════════ */
const $ = s => document.querySelector(s);
const app = $('#app');
window.RepasPolinomis = MOTOR;   /* per a proves des de la consola */
const st = MOTOR.estat = {niv:'AS', mode:'apartats', aps:[1,2,3,4,5,6,7], qs:[], i:0, punts:[], fet:false};
const DESA='repas-polinomis-v1';
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
    <div class="rp-comenca"><button type="button" class="boto boto-principal rp-gran" id="comenca">Comença →</button></div>
  </section>`;
  app.querySelectorAll('.rp-niv').forEach(b=>b.onclick=()=>{ st.niv=b.dataset.niv; app.querySelectorAll('.rp-niv').forEach(x=>x.setAttribute('aria-checked', x===b)); });
  app.querySelectorAll('.rp-mode').forEach(b=>b.onclick=()=>{ st.mode=b.dataset.mode; app.querySelectorAll('.rp-mode').forEach(x=>x.setAttribute('aria-checked', x===b)); $('#aps').hidden = st.mode!=='apartats'; });
  const llegeixAps = () => { st.aps=[...app.querySelectorAll('.rp-ap input')].filter(x=>x.checked).map(x=>+x.value); $('#tots').textContent = st.aps.length===APARTATS.length?'Cap':'Tots'; };
  app.querySelectorAll('.rp-ap input').forEach(x=>x.onchange=llegeixAps);
  $('#tots').onclick=()=>{ const tots=st.aps.length!==APARTATS.length; app.querySelectorAll('.rp-ap input').forEach(x=>x.checked=tots); llegeixAps(); };
  $('#comenca').onclick=()=>{ if(st.mode==='apartats' && !st.aps.length){ $('#avis').hidden=false; return; } comenca(); };
  window.scrollTo(0,0);
}
function comenca(){
  desa({niv:st.niv, mode:st.mode, aps:st.aps});
  st.qs=prova(st.niv, st.mode, st.aps); st.i=0; st.punts=[]; pregunta();
}

/* ─── controls de resposta ─── */
const nomGrau = (k,L) => k===0 ? 'terme independent' : k===1 ? `coeficient de ${L}` : `coeficient de ${L} a la ${k}`;
function campH(c, i, q){
  const et = c.et ? `<span class="rp-camp-et">${c.et}</span>` : '';
  if(c.tipus==='pol'){
    const graus=[...Array(c.G+1).keys()].reverse();
    const fc = q.fc ? (i===0 ? ' rp-fc-f' : ' rp-fc-d') : '';
    return `<div class="rp-camp rp-camp-pol${fc}" data-i="${i}">${et}<span class="rp-polin">${q.fc&&i===1?'<span class="pr rp-pr">(</span>':''}<span class="caselles">${graus.map(k=>`<span class="cterme"><input class="box cf" data-g="${k}" inputmode="text" autocomplete="off" spellcheck="false" aria-label="${nomGrau(k,c.L)}">${litH(k,c.L)}</span>`).join('')}</span>${q.fc&&i===1?'<span class="pr rp-pr">)</span>':''}</span>
      <p class="previ"><span class="previ-et">Així queda</span><span class="previ-m">—</span></p></div>`;
  }
  let cos;
  if(c.tipus==='enter') cos=`<input class="box rp-box" data-r="n" inputmode="text" autocomplete="off" aria-label="${c.et||'nombre'}">`;
  else cos=`<span class="rp-fin"><input class="box rp-box" data-r="n" inputmode="text" autocomplete="off" aria-label="numerador"><span class="rp-ratlla"></span><input class="box rp-box" data-r="d" inputmode="numeric" autocomplete="off" aria-label="denominador"></span>`;
  return `<div class="rp-camp" data-i="${i}">${et}<span class="rp-entrada">${cos}</span></div>`;
}
const NOTA_POL = '<p class="rp-nota-signe">Escriu a cada casella el coeficient amb el seu signe (sense signe vol dir +). Si el resultat no té algun grau, deixa’n la casella buida.</p>';
const NOTA_FC = '<p class="rp-nota-signe">Escriu el factor comú a les primeres caselles i el que queda dins del parèntesi a les segones. Cada casella porta el seu signe; deixa buides les que no facin falta.</p>';
const NOTA_SIGNE = '<p class="rp-nota-signe">Si és negatiu, escriu el signe − davant del nombre.</p>';
function respostaH(q){
  if(q.mc) return `<div class="rp-opcions">${q.mc.opcions.map((o,i)=>`<button type="button" class="rp-op" data-i="${i}"><span class="rp-op-lletra">${'ABCD'[i]}</span><span>${o}</span></button>`).join('')}</div>`;
  const nota = q.fc ? NOTA_FC : q.camps.some(c=>c.tipus==='pol') ? NOTA_POL : (q.ap===2 && q.niv!=='AS' ? NOTA_SIGNE : '');
  return `<div class="rp-camps${q.fc?' rp-camps-fc':''}">${q.camps.map((c,i)=>campH(c,i,q)).join('')}</div>${nota}`;
}
/* vista prèvia «Així queda» de les caselles d'un polinomi */
function previ(campEl, c){
  const ts=[]; let mal=false;
  for(let k=c.G;k>=0;k--){ const x=llegeixCoef(campEl.querySelector(`[data-g="${k}"]`).value,k); if(x===null) continue; if(Number.isNaN(x)){ mal=true; continue; } if(x.v.n!==0) ts.push({c:x.v,e:k}); }
  const out=campEl.querySelector('.previ-m');
  out.innerHTML = mal ? '<span class="forat">hi ha una casella que no s’entén</span>' : ts.length ? m(tlH(ts,c.L)) : '—';
}

function pregunta(){
  const q=st.qs[st.i], N_=st.qs.length; st.fet=false;
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
  const inputs=[...R.querySelectorAll('input')];
  inputs.forEach((x,j)=>x.addEventListener('keydown',ev_=>{ if(ev_.key!=='Enter') return; ev_.preventDefault(); if(st.fet) return seguent(); const seg=inputs[j+1]; if(seg) seg.focus(); else comprova(); }));
  R.querySelectorAll('.rp-camp-pol').forEach(el=>{ const c=q.camps[+el.dataset.i]; el.addEventListener('input',()=>previ(el,c)); });
  R.querySelectorAll('.rp-op').forEach(b=>b.onclick=()=>{ if(st.fet) return; R.querySelectorAll('.rp-op').forEach(x=>x.setAttribute('aria-pressed', x===b)); });
}
function llegeixRaw(q){
  const R=$('#resp');
  if(q.mc){ const b=R.querySelector('.rp-op[aria-pressed="true"]'); return b?+b.dataset.i:null; }
  return [...R.querySelectorAll('.rp-camp')].map((c,i)=>{
    if(q.camps[i].tipus==='pol'){ const g={}; c.querySelectorAll('[data-g]').forEach(x=>{ g[x.dataset.g]=x.value; }); return {g}; }
    const n=c.querySelector('[data-r="n"]'), d=c.querySelector('[data-r="d"]');
    return {n:n?n.value:'', d:d?d.value:''};
  });
}
function incomplet(q, raw){
  if(q.mc) return raw===null;
  return raw.some((r,i)=> q.camps[i].tipus==='pol' ? Object.values(r.g).every(v=>!String(v).trim()) : !String(r.n||'').trim());
}
function comprova(){
  if(st.fet) return;
  const q=st.qs[st.i], raw=llegeixRaw(q);
  if(incomplet(q,raw)){ $('#fb').innerHTML=`<p class="fb err rp-fb">Respon totes les parts abans de comprovar.</p>`; return; }
  const r=avalua(q,raw); st.fet=true;
  st.punts.push({ap:q.ap, p:r.p, q});
  marca(q, raw, r);
  const ok=r.p===1, mig=r.p>0&&r.p<1;
  const msgs=[...new Set((r.det||[]).map(d=>d.msg).filter(Boolean))];
  const cap = ok ? `<span class="rp-icona" aria-hidden="true">✓</span> Correcte!`
    : mig ? `<span class="rp-icona" aria-hidden="true">½</span> ${msgs.length===1 && /^Correcte, però/.test(msgs[0]) ? msgs.shift() : 'Mig encert.'}`
    : `<span class="rp-icona" aria-hidden="true">✗</span> Incorrecte.`;
  const extra = msgs.map(x=>`<span class="rp-msg">${x}</span>`).join('');
  const sol = !ok ? `<span class="rp-sol">La resposta és ${solucioH(q)}.</span>` : '';
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
  if(q.mc){ R.querySelectorAll('.rp-op').forEach((b,i)=>{ if(i===q.mc.ok) b.classList.add('rp-bo'); else if(i===raw) b.classList.add('rp-mal'); }); return; }
  R.querySelectorAll('.rp-camp').forEach((c,i)=>{ const p=r.det[i].p; c.classList.add(p===1?'rp-c-ok':p>0?'rp-c-mig':'rp-c-ko'); });
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
    <div class="rp-accions rp-centre">
      <button type="button" class="boto boto-principal" id="bTorna">Torna a provar</button>
      ${repassa.length && st.mode==='simulacre' ?`<button type="button" class="boto" id="bRepassa">Repassa només aquests</button>`:''}
      <button type="button" class="boto" id="bNivell">Canvia de nivell</button>
    </div>
  </section>`;
  $('#bTorna').onclick=comenca;
  $('#bNivell').onclick=inici;
  if($('#bRepassa')) $('#bRepassa').onclick=()=>{ st.mode='apartats'; st.aps=repassa; comenca(); };
  window.scrollTo(0,0);
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
/* repas-polinomis.html#plantilla=6-lletra&nivell=AN · per revisar una plantilla concreta */
(function(){
  const h=new URLSearchParams(location.hash.slice(1)), id=h.get('plantilla'), niv=h.get('nivell');
  const t=T.find(x=>x.id===id && (!niv || x.niv===niv));
  if(!t){ inici(); return; }
  st.niv=t.niv; st.mode='apartats'; st.aps=[t.ap];
  st.qs=Array.from({length:5},()=>genera(t)); st.i=0; st.punts=[]; pregunta();
})();
})();
