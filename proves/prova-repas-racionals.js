#!/usr/bin/env node
/* Prova automàtica de l'aplicatiu «Repàs del tema 1 · Nombres racionals».
   Ús (des de la carpeta web/):   node proves/prova-repas-racionals.js [vegades]
   Genera moltes preguntes de cada plantilla i nivell i comprova, amb un càlcul
   independent fet amb enters grans (BigInt), que la solució és correcta, que les
   fraccions de la solució són irreductibles, que la correcció accepta la resposta
   bona, dona mig punt a la no simplificada i zero a una d'equivocada, i que no hi
   ha exponents negatius, propietats de potències ni notació científica. */
'use strict';
const path = require('path');
const M = require(path.join(__dirname, '..', 'assets', 'repas-racionals.js'));
const VEGADES = Number(process.argv[2]) || 400;

/* ── racionals amb BigInt (independents del motor) ── */
const bg = (a,b) => { a=a<0n?-a:a; b=b<0n?-b:b; while(b){ [a,b]=[b,a%b]; } return a; };
function Q(n,d=1n){ n=BigInt(n); d=BigInt(d); if(d===0n) throw new Error('÷0'); if(d<0n){n=-n;d=-d;} const g=bg(n,d)||1n; return {n:n/g, d:d/g}; }
const qa=(x,y)=>Q(x.n*y.d+y.n*x.d, x.d*y.d), qs=(x,y)=>Q(x.n*y.d-y.n*x.d, x.d*y.d), qm=(x,y)=>Q(x.n*y.n, x.d*y.d), qd=(x,y)=>Q(x.n*y.d, x.d*y.n);
const qp=(x,k)=>{ let r=Q(1); for(let i=0;i<k;i++) r=qm(r,x); return r; };
const qeq=(x,f)=> x.n===BigInt(f.n) && x.d===BigInt(f.d);
const qtxt=x=>x.d===1n?`${x.n}`:`${x.n}/${x.d}`;

/* ── avaluador d'expressions (text) ── */
function avaluaText(s){
  let i=0; const peek=()=>s[i];
  function expr(){ let v=term(); while(peek()==='+'||peek()==='-'){ const o=s[i++]; const w=term(); v=o==='+'?qa(v,w):qs(v,w); } return v; }
  function term(){ let v=unary(); while(peek()==='*'||peek()===':'){ const o=s[i++]; const w=unary(); v=o==='*'?qm(v,w):qd(v,w); } return v; }
  function unary(){ if(peek()==='-'){ i++; const v=unary(); return Q(-v.n,v.d); } return power(); }
  function power(){ const b=atom(); if(peek()==='^'){ i++; const n=int(); if(n<0) throw new Error('exponent negatiu'); return qp(b,n); } return b; }
  function int(){ const m=/^-?\d+/.exec(s.slice(i)); if(!m) throw new Error('enter esperat a '+i+': '+s); i+=m[0].length; return Number(m[0]); }
  function atom(){
    const c=peek();
    if(c==='('||c==='['){ i++; const v=expr(); const t=s[i++]; if(t!==(c==='('?')':']')) throw new Error('parèntesi: '+s); return v; }
    if(c==='{'){ const m=/^\{(-?\d+)\/(-?\d+)\}/.exec(s.slice(i)); if(!m) throw new Error('fracció: '+s); i+=m[0].length; return Q(m[1],m[2]); }
    if(/\d/.test(c)){ return Q(int()); }
    throw new Error(`caràcter inesperat «${c}» a ${i}: ${s}`);
  }
  const v=expr(); if(i!==s.length) throw new Error('sobra text: '+s.slice(i)); return v;
}
/* el que veu l'alumne (HTML) → text, per comprovar que els parèntesis són al seu lloc */
function htmlAText(h){
  let s=h.replace(/<sup>(\d+)<\/sup>/g,'^$1');
  for(let k=0;k<5;k++) s=s.replace(/<span class="frac"><span>([^<]*)<\/span><span>([^<]*)<\/span><\/span>/g,'(($1):($2))');
  s=s.replace(/<[^>]+>/g,'').replace(/−/g,'-').replace(/·/g,'*').replace(/\s/g,'').replace(/(\d)\.(\d{3})/g,'$1$2');
  return s;
}
/* desenvolupament decimal propi */
function expand(n,d){ n=BigInt(n); d=BigInt(d); const neg=n<0n; if(neg) n=-n; const ent=n/d; let r=n%d; const seen=new Map(); let digs='';
  while(r!==0n && !seen.has(r)){ seen.set(r,digs.length); r*=10n; digs+=String(r/d); r%=d; }
  if(r===0n) return {neg,ent,ante:digs,per:''}; const k=seen.get(r); return {neg,ent,ante:digs.slice(0,k),per:digs.slice(k)}; }
const txtDec = e => `${e.neg?'-':''}${e.ent}${(e.ante||e.per)?',':''}${e.ante}${e.per?'('+e.per+')':''}`;
/* fracció a partir d'un periòdic escrit com 2,3(81) (sèrie geomètrica) */
function deDigits(s){
  const m=/^(-?)(\d+)(?:,(\d*)(?:\((\d+)\))?)?$/.exec(s); if(!m) throw new Error('decimal: '+s);
  const ante=m[3]||'', per=m[4]||'';
  let v=Q(m[2]); if(ante) v=qa(v, Q(ante, 10n**BigInt(ante.length)));
  if(per) v=qa(v, Q(BigInt(per), (10n**BigInt(per.length)-1n)*10n**BigInt(ante.length)));
  return m[1]?Q(-v.n,v.d):v;
}
function tipusPropi(n,d){ let q=Q(n,d), D=q.d; if(D===1n) return 'enter'; const g=bg(D,10n); if(g===1n) return 'pur'; while(D%2n===0n) D/=2n; while(D%5n===0n) D/=5n; return D===1n?'finit':'mixt'; }
const conjuntPropi = x => { const q=Q(x.n,x.d); return q.d!==1n?2: q.n>=0n?0:1; };
const opHtmlAText = h => h.replace(/<span class="ov">(\d+)<\/span>/,'($1)').replace(/<[^>]+>/g,'').replace(/−/g,'-');

/* ── comprovacions ── */
const errors=[]; const stats={};
function err(q,msg){ if(errors.length<60) errors.push(`[${q.niv} ${q.id}] ${msg}`); else errors.length++; }
function irreductible(f){ return f.d>0 && bg(BigInt(f.n),BigInt(f.d))===1n; }
const solucio = q => q.camps ? q.camps[0].v : q.v.r;

function verifica(q){
  const v=q.v||{};
  const fr=x=>Q(x.n,x.d);
  switch(v.k){
    case 'expr': {
      const val=avaluaText(v.txt);
      if(!qeq(val, q.camps[0].v)) err(q,`expressió ${v.txt} = ${qtxt(val)} però la solució és ${q.camps[0].v.n}/${q.camps[0].v.d}`);
      if(q.gran){ const t=htmlAText(q.gran); let w; try{ w=avaluaText(t); }catch(e){ err(q,'no puc llegir l’enunciat: '+t+' · '+e.message); break; } if(!qeq(w,q.camps[0].v)) err(q,`l’enunciat que es veu (${t}) val ${qtxt(w)}, no ${q.camps[0].v.n}/${q.camps[0].v.d}`); }
      /* cada línia de la resolució que només té càlculs ha de valer el mateix */
      q.res.forEach(l=>{ const t=htmlAText(l); if(!/^[-\d(){}\/*:+^\[\]=,]+$/.test(t) || /m\.c\.m/.test(l)) return;
        t.split('=').filter(Boolean).forEach(part=>{ let w; try{ w=avaluaText(part); }catch(e){ err(q,'resolució il·legible: '+part); return; } if(!qeq(w,q.camps[0].v)) err(q,`a la resolució, ${part} val ${qtxt(w)} i no ${q.camps[0].v.n}/${q.camps[0].v.d}`); }); });
      break; }
    case 'expr2': v.txts.forEach((t,i)=>{ const val=avaluaText(t); if(!qeq(val,q.camps[i].v)) err(q,`${t} ≠ solució`); const w=avaluaText(htmlAText(q.camps[i].et)); if(!qeq(w,q.camps[i].v)) err(q,`etiqueta ${htmlAText(q.camps[i].et)} ≠ solució`); }); break;
    case 'error': { const val=avaluaText(v.txt); if(!qeq(val,v.r)) err(q,'troba l’error: valor correcte malament'); 
      const ult=htmlAText(q.taula[q.taula.length-1].replace(/<span class="pas-n">[^<]*<\/span>/,'')).replace(/^=/,''); if(qeq(avaluaText(ult),v.r)) err(q,'troba l’error: la resolució errònia dona el resultat bo'); break; }
    case 'oposat': if(!qeq(Q(-v.x.n,v.x.d),v.r)) err(q,'oposat'); break;
    case 'invers': if(!qeq(Q(v.x.d,v.x.n),v.r)) err(q,'invers'); break;
    case 'absolut': if(!qeq(Q(v.x.n<0?-v.x.n:v.x.n,v.x.d),v.r)) err(q,'absolut'); break;
    case 'conjunt': if(conjuntPropi(v.x)!==v.c || q.mc.ok!==v.c) err(q,'conjunt'); break;
    case 'tres': { const x=fr(v.x); const [o,i,a]=q.camps.map(c=>c.v); if(!qeq(Q(-x.n,x.d),o)||!qeq(Q(x.d,x.n),i)||!qeq(Q(x.n<0n?-x.n:x.n,x.d),a)) err(q,'oposat/invers/absolut'); break; }
    case 'classifica': v.xs.forEach((x,i)=>{ if(conjuntPropi(x)!==q.classifica.items[i].c) err(q,'classificació ℕℤℚ'); }); break;
    case 'creu': { const eq=BigInt(v.a)*BigInt(v.d)===BigInt(v.b)*BigInt(v.c); if(eq!==v.si || q.mc.ok!==(eq?0:1)) err(q,'equivalència en creu'); break; }
    case 'simp': if(!qeq(Q(v.a,v.b),v.r)) err(q,`simplificació ${v.a}/${v.b}`); break;
    case 'falta': if(!qeq(Q(v.a,v.b), v.p)) err(q,`terme que falta ${v.a}/${v.b} no és ${v.p.n}/${v.p.d}`); break;
    case 'quina': if(!qeq(Q(v.a,v.b), v.p)) err(q,'fracció equivalent'); break;
    case 'ordena': { const xs=v.xs.map(fr); const o=v.ord; for(let i=1;i<o.length;i++){ const a=xs[o[i-1]], b=xs[o[i]]; if(!(a.n*b.d < b.n*a.d)) err(q,'ordre'); } break; }
    case 'fracq': { const r=qm(fr(v.f),Q(v.N)); if(!qeq(r,v.r)||r.d!==1n) err(q,'fracció d’una quantitat'); break; }
    case 'pct': { const r=Q(BigInt(v.p)*BigInt(v.N),100n); if(!qeq(r,v.r)||r.d!==1n) err(q,'percentatge'); break; }
    case 'part': if(!qeq(Q(v.part,v.tot),v.r)) err(q,'quina fracció representa'); break;
    case 'pctfrac': case 'pctdec': case 'pctrel': if(!qeq(Q(v.p,100),v.r)) err(q,'percentatge = fracció'); break;
    case 'resta': { const N=Q(v.N), A=qm(fr(v.a),N), Bq=qm(fr(v.b),N), r=qs(qs(N,A),Bq); if(A.d!==1n||Bq.d!==1n||!qeq(r,v.r)||r.n<=0n) err(q,'problema de la resta'); break; }
    case 'restafrac': if(!qeq(qs(qs(Q(1),fr(v.a)),fr(v.b)),v.r)) err(q,'fracció que queda'); break;
    case 'desc': { const r=Q(BigInt(v.P)*BigInt(100+(v.aug?v.x:-v.x)),100n); if(!qeq(r,v.r)) err(q,'descompte/augment'); break; }
    case 'invers1': { const T=fr(v.r); const R=qm(T, qs(Q(1),fr(v.a))); if(R.n!==BigInt(v.R)||R.d!==1n) err(q,'problema invers'); break; }
    case 'pctinv': { const P=qm(fr(v.r),Q(100+(v.aug?v.x:-v.x),100)); if(!qeq(P,v.P)) err(q,'percentatge invers'); break; }
    case 'prop': if(!qeq(qd(qm(fr(v.q),Q(v.mm)),Q(v.n)),v.r)) err(q,'proporcionalitat'); break;
    case 'fracfrac': if(!qeq(qm(qs(Q(1),fr(v.a)),qs(Q(1),fr(v.b))),v.r)) err(q,'fracció del que queda'); break;
    case 'tipus': if(tipusPropi(v.f.n,v.f.d)!==v.t || q.mc.opcions[q.mc.ok]!==({finit:'Decimal finit',pur:'Periòdic pur',mixt:'Periòdic mixt'})[v.t]) err(q,'tipus de decimal'); break;
    case 'f2d': if(expand(v.f.n,v.f.d).per!=='') err(q,'no és decimal finit'); break;
    case 'd2f': if(!qeq(deDigits(v.s.replace('−','-')),v.r)) err(q,`decimal ${v.s} a fracció`); break;
    case 'per': { const e=expand(v.f.n,v.f.d); if(opHtmlAText(q.mc.opcions[q.mc.ok])!==txtDec(e)) err(q,`periòdic ${opHtmlAText(q.mc.opcions[q.mc.ok])} ≠ ${txtDec(e)}`);
      q.mc.opcions.forEach((o,i)=>{ const w=deDigits(opHtmlAText(o)); if(i!==q.mc.ok && w.n*BigInt(v.f.d)===BigInt(v.f.n)*w.d) err(q,'distractor amb el mateix valor que la solució: '+opHtmlAText(o)); }); break; }
    case 'litre': { const r = v.unit==='ml'?Q(v.q,1000): v.unit==='cl'?Q(v.q,100): deDigits(htmlAText(q.enunciat).match(/(\d+,\d+)L/)[1]); if(!qeq(r,v.r)) err(q,'fracció de litre'); break; }
    case 'f2dt': { const [n,d]=v.f.raw, e=expand(n,d), t=tipusPropi(n,d);
      if(t!==v.t) err(q,`tipus de ${n}/${d}: ${t} i no ${v.t}`);
      const c=q.camps[0], x=Q(n,d); if(!qeq(x,c.v)) err(q,'valor del decimal');
      if(q.camps[1].ok!==['enter','finit','pur','mixt'].indexOf(t)) err(q,'opció de tipus');
      const sol=htmlAText(q.res[1].replace(/<span class="ov">(\d+)<\/span>/g,'($1)')).match(/=([\d,()]+):/); if(!sol || sol[1]!==txtDec(e)) err(q,`resolució: ${sol&&sol[1]} ≠ ${txtDec(e)}`);
      break; }
    case 'gen': { const r=deDigits(v.s); if(!qeq(r,v.r)) err(q,`generatriu ${v.s} = ${qtxt(r)} i no ${v.r.n}/${v.r.d}`); const e=expand(v.r.n,v.r.d); if(txtDec(e)!==v.s) err(q,`${v.s} no està escrit en forma canònica (${txtDec(e)})`); break; }
    case 'parts': { const s=`${v.ent},${v.a}(${v.p})`; const r=deDigits(s); const e=expand(r.n,r.d); if(txtDec(e)!==s) err(q,`parts: ${s} no és canònic (${txtDec(e)})`); break; }
    case 'classTipus': v.fs.forEach((f,i)=>{ if(['enter','finit','pur','mixt'][q.classifica.items[i].c]!==tipusPropi(f.n,f.d)) err(q,'classificació de decimals'); }); break;
    case 'signe': if(q.mc.ok!==(v.n%2?1:0)) err(q,'signe de la potència'); break;
    case 'arrel': { const rad=fr(v.rad), c=q.camps[0], parell=v.idx%2===0;
      if(parell && rad.n<0n){ if(!c.no) err(q,'arrel parella de negatiu hauria de no existir'); break; }
      if(c.no){ err(q,'diu que no existeix i sí que existeix'); break; }
      const p=qp(Q(c.v.n,c.v.d), v.idx); if(!(p.n===rad.n && p.d===rad.d)) err(q,`(${c.v.n}/${c.v.d})^${v.idx} ≠ radicand`);
      if(c.pm !== (parell && rad.n>0n)) err(q,'el ± no toca'); break; }
    case 'invers2': { const T=fr(v.r); const R=qm(T, qs(qs(Q(1),fr(v.a)),fr(v.b))); if(!qeq(R,v.R)) err(q,'problema invers (2)'); break; }
    case 'base': if(BigInt(v.b)**BigInt(v.n)!==BigInt(v.N) || !qeq(fr(q.camps[0].v),Q(v.n))) err(q,`${v.N} no és ${v.b}^${v.n}`); break;
    case 'compost': case 'vf': case 'conc': case 'quantes': case 'irr': case 'noracional': break;
    default: err(q,'sense verificació: '+v.k);
  }
}

function prohibits(q){
  const tot=[q.enunciat,q.gran||'',(q.camps||[]).map(c=>c.et||'').join(' '),(q.mc?q.mc.opcions.join(' '):''),(q.vf||[]).map(a=>a.h).join(' '),(q.taula||[]).join(' '),(q.res||[]).join(' '),(q.v&&q.v.txt)||''].join(' ');
  if(/<sup>\s*[−-]/.test(tot) || /\^-/.test(tot)) err(q,'exponent negatiu');
  if(/notaci[óo] cient/i.test(tot) || /·\s*10<sup>/.test(tot) || /\*\{10\/1\}\^/.test(tot)) err(q,'notació científica');
  if(/propietat/i.test(tot)) err(q,'demana propietats');
  const txt=(q.v&&q.v.txt)||'';
  if(/(\{[^}]+\})\^\d+[*:]\1\^\d+/.test(txt)) err(q,'producte o quocient de potències de la mateixa base');
  if(/\([^()]*\^\d+\)\^\d+/.test(txt)) err(q,'potència d’una potència');
  if(/<sup>\d+\/\d+<\/sup>|<sup><span class="frac">/.test(tot)) err(q,'exponent fraccionari');
}

function correccio(q){
  const bo=M.rawCorrecte(q);
  const r=M.avalua(q,bo); if(r.p!==1) err(q,'la resposta correcta no puntua 1 ('+r.p+')');
  if(q.camps){
    q.camps.forEach((c,i)=>{
      if(c.v && !irreductible(c.v)) err(q,'solució no irreductible');
      if(c.v && (Math.abs(c.v.n)>9999 || c.v.d>999)) err(q,`solució poc amable ${c.v.n}/${c.v.d}`);
    });
    const des=M.rawCorrecte(q,true);
    q.camps.forEach((c,i)=>{
      if((c.tipus==='frac'||c.tipus==='arrel') && c.simp && !c.no && c.v.n!==0){
        const raw=bo.slice(); raw[i]=des[i]; const p=M.avaluaCamp(c,des[i]).p; if(p!==0.5) err(q,'no simplificada hauria de ser mig punt ('+p+')');
      }
      const mal=JSON.parse(JSON.stringify(bo[i]));
      if(mal.n!==undefined && !mal.no){ mal.n=String(Number(mal.n)+1); if(M.avaluaCamp(c,mal).p!==0) err(q,'una resposta equivocada puntua'); }
      if(c.tipus==='per'){ const ex=expand(c.v.n,c.v.d);
        if(ex.per){ const p=M.avaluaCamp(c,{e:String(ex.ent),a:ex.ante+ex.per,p:ex.per}).p; if(p!==0.5) err(q,'període repetit hauria de ser mig punt ('+p+')'); }
        if(M.avaluaCamp(c,{e:String(ex.ent+1n),a:ex.ante,p:ex.per}).p!==0) err(q,'decimal equivocat puntua');
        if(ex.per && M.avaluaCamp(c,{e:String(ex.ent),a:ex.ante+ex.per,p:''}).p!==0) err(q,'sense període hauria de ser incorrecte'); }
      if(c.tipus==='tria' && M.avaluaCamp(c,{t:(c.ok+1)%c.opcions.length}).p!==0) err(q,'opció de tipus equivocada puntua');
      /* el signe s'escriu a la casella: amb el menys tipogràfic (−) també ha de valer */
      if(mal.n!==undefined && !mal.no && Number(bo[i].n)<0){ const t=Object.assign({},bo[i],{n:bo[i].n.replace('-','−')}); if(M.avaluaCamp(c,t).p!==1) err(q,'el signe − escrit a la casella no puntua'); const sg=Object.assign({},bo[i],{n:bo[i].n.replace('-','')}); if(M.avaluaCamp(c,sg).p!==0) err(q,'sense el signe − hauria de ser incorrecte'); }
      if(c.tipus==='arrel' && c.pm){ const sense=Object.assign({},bo[i],{s:'+'}); if(M.avaluaCamp(c,sense).p!==0) err(q,'sense ± hauria de ser incorrecte'); }
    });
  }
  if(q.mc){ const vals=q.mc.opcions.map(o=>{ try{ const t=htmlAText(o).replace(/,/,'.'); if(/\./.test(t)) return null; const w=avaluaText(t); return qtxt(w); }catch(e){ return null; } }).filter(x=>x!==null);
    if(new Set(vals).size!==vals.length) err(q,'dues opcions amb el mateix valor: '+q.mc.opcions.map(htmlAText).join(' | '));
    if(new Set(q.mc.opcions).size!==q.mc.opcions.length) err(q,'opcions repetides'); if(q.mc.opcions.length<2) err(q,'poques opcions'); if(M.avalua(q,(q.mc.ok+1)%q.mc.opcions.length).p!==0) err(q,'opció equivocada puntua'); }
  if(q.ordena && q.ordena.items.length<3) err(q,'poques fraccions per ordenar');
}

const t0=Date.now(); let total=0;
for(const t of M.T){
  const vistos=new Set(); let maxN=0, maxD=0;
  for(let k=0;k<VEGADES;k++){
    let q; try{ q=M.genera(t); }catch(e){ errors.push(`[${t.niv} ${t.id}] error en generar: ${e.message}`); break; }
    total++; vistos.add(q.enunciat+(q.gran||'')+JSON.stringify(q.mc||q.vf||q.classifica||q.ordena||''));
    try{ verifica(q); prohibits(q); correccio(q); }catch(e){ err(q,'excepció: '+e.message); }
    if(q.camps) q.camps.forEach(c=>{ if(c.v){ maxN=Math.max(maxN,Math.abs(c.v.n)); maxD=Math.max(maxD,c.v.d); } });
  }
  stats[t.niv+' '+t.id]={variants:vistos.size, maxN, maxD};
}
/* el mode simulacre i per apartats */
for(const niv of ['AS','AN','AE']){
  for(let k=0;k<50;k++){ const p=M.prova(niv,'simulacre'); if(p.length!==12) errors.push('simulacre amb '+p.length+' preguntes'); if(new Set(p.map(q=>q.ap)).size!==6) errors.push('simulacre sense tots els apartats'); }
  for(let a=1;a<=6;a++) if(!M.plantillesDe(a,niv).length) errors.push(`no hi ha plantilles per a l’apartat ${a}, nivell ${niv}`);
}

console.log(`Plantilles: ${M.T.length} · preguntes generades i comprovades: ${total} · ${Date.now()-t0} ms`);
console.log('\nplantilla                    variants  màx |num|  màx den');
for(const [k,s] of Object.entries(stats)) console.log(k.padEnd(28), String(s.variants).padStart(8), String(s.maxN||'-').padStart(10), String(s.maxD||'-').padStart(8));
if(errors.length){ console.log(`\n✗ ${errors.length} errors:`); errors.slice(0,60).forEach(e=>console.log('  '+e)); process.exit(1); }
console.log('\n✓ Tot correcte: solucions verificades, fraccions irreductibles, cap exponent negatiu, cap propietat de potències ni notació científica.');
