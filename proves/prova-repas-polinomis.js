#!/usr/bin/env node
/* Prova automàtica de l'aplicatiu «Repàs del tema 2 · Polinomis».
   Ús (des de la carpeta web/):   node proves/prova-repas-polinomis.js [vegades]
   Genera moltes preguntes de cada plantilla i nivell i comprova, amb un càlcul
   independent (racionals amb BigInt i valors a l'atzar de les lletres), que:
   l'expressió que veu l'alumne val el mateix que la solució, la correcció accepta
   la resposta bona, dona mig punt a la no simplificada i zero a una d'equivocada,
   a l'opció múltiple només hi ha una opció correcta, el factor comú és el més gran,
   i que no hi ha «NaN», «undefined» ni opcions repetides. */
'use strict';
const path = require('path');
const M = require(path.join(__dirname, '..', 'assets', 'repas-polinomis.js'));
const VEGADES = Number(process.argv[2]) || 300;

/* ── racionals amb BigInt ── */
const bg = (a,b) => { a=a<0n?-a:a; b=b<0n?-b:b; while(b){ [a,b]=[b,a%b]; } return a; };
function Q(n,d=1n){ n=BigInt(n); d=BigInt(d); if(d===0n) throw new Error('÷0'); if(d<0n){n=-n;d=-d;} const g=bg(n,d)||1n; return {n:n/g, d:d/g}; }
const qa=(x,y)=>Q(x.n*y.d+y.n*x.d, x.d*y.d), qs=(x,y)=>Q(x.n*y.d-y.n*x.d, x.d*y.d), qm=(x,y)=>Q(x.n*y.n, x.d*y.d), qd=(x,y)=>Q(x.n*y.d, x.d*y.n);
const qp=(x,k)=>{ let r=Q(1); for(let i=0;i<k;i++) r=qm(r,x); return r; };
const qeq=(x,y)=> x.n===y.n && x.d===y.d;
const qtxt=x=>x.d===1n?`${x.n}`:`${x.n}/${x.d}`;

/* ── avaluador d'expressions (text) amb lletres ── */
function avaluaText(s, vals){
  s=s.replace(/\s/g,''); let i=0; const peek=()=>s[i];
  function expr(){ let v=term(); while(peek()==='+'||peek()==='-'){ const o=s[i++]; const w=term(); v=o==='+'?qa(v,w):qs(v,w); } return v; }
  function term(){ let v=unary(); while(peek()==='*'||peek()===':'||peek()==='/'){ const o=s[i++]; const w=unary(); v=o==='*'?qm(v,w):qd(v,w); } return v; }
  function unary(){ if(peek()==='-'){ i++; const v=unary(); return Q(-v.n,v.d); } if(peek()==='+'){ i++; return unary(); } return power(); }
  function power(){ const b=atom(); if(peek()==='^'){ i++; const mm=/^\d+/.exec(s.slice(i)); i+=mm[0].length; return qp(b,Number(mm[0])); } return b; }
  function atom(){
    const c=peek();
    if(c==='('){ i++; const v=expr(); if(s[i++]!==')') throw new Error('parèntesi: '+s); return v; }
    if(/\d/.test(c)){ const mm=/^\d+/.exec(s.slice(i)); i+=mm[0].length; return Q(mm[0]); }
    if(/[a-zA-Z]/.test(c)){ i++; if(!(c in vals)) throw new Error('lletra '+c); return vals[c]; }
    throw new Error(`caràcter inesperat «${c}» a ${i}: ${s}`);
  }
  const v=expr(); if(i!==s.length) throw new Error('sobra text: '+s.slice(i)); return v;
}
/* el que veu l'alumne (HTML) → text amb multiplicacions explícites */
function htmlAText(h){
  let s=h.replace(/<sup>(\d+)<\/sup>/g,'^$1');
  for(let k=0;k<5;k++) s=s.replace(/<span class="frac"><span>([^<]*)<\/span><span>([^<]*)<\/span><\/span>/g,'(($1):($2))');
  s=s.replace(/<[^>]+>/g,'').replace(/&nbsp;/g,'').replace(/−/g,'-').replace(/·/g,'*').replace(/\s/g,'');
  for(let k=0;k<3;k++) s=s.replace(/([\d)a-zA-Z])([a-zA-Z(])/g,'$1*$2');
  return s;
}
const VALORS = [Q(2),Q(-3),Q(5,7),Q(-4,3)];
function valorsLletres(i){ const v={}; 'abcdefghjkmnpqrstuvwxyz'.split('').forEach((l,j)=>{ v[l]=[Q(2),Q(-3),Q(5,7),Q(-4,3),Q(3,2),Q(7)][(i+j)%6]; }); return v; }
/* polinomi del motor (llista de Fr) avaluat en un valor */
function polVal(p, x){ let r=Q(0); for(let k=p.length-1;k>=0;k--) r=qa(qm(r,x), Q(p[k].n,p[k].d)); return r; }
function mateixValor(t1, t2){ for(let i=0;i<4;i++){ const v=valorsLletres(i); if(!qeq(avaluaText(t1,v), avaluaText(t2,v))) return false; } return true; }

/* ── comprovacions ── */
const errors=[]; const stats={};
function err(q,msg){ if(errors.length<60) errors.push(`[${q.niv} ${q.id}] ${msg}`); else errors.length++; }
const textos = q => [q.enunciat, q.gran||'', ...(q.res||[]), ...(q.mc?q.mc.opcions:[]), M.solucioH(q)].join(' ');

function verifica(q){
  const v=q.v||{};
  const tot=textos(q);
  if(/NaN|undefined|null|\[object/.test(tot)) err(q,'text estrany: '+tot.slice(0,200));
  if(q.mc){
    const o=q.mc;
    if(!(o.ok>=0 && o.ok<o.opcions.length)) err(q,'opció correcta fora de rang');
    if(new Set(o.opcions).size!==o.opcions.length) err(q,'opcions repetides');
    if(o.opcions.length<3) err(q,'només hi ha '+o.opcions.length+' opcions');
    if(M.avalua(q,o.ok).p!==1) err(q,'la correcció no accepta l’opció bona');
    if(M.avalua(q,(o.ok+1)%o.opcions.length).p!==0) err(q,'la correcció accepta una opció dolenta');
    if(v.k==='mc-eq'){
      if(!mateixValor(o.txt[o.ok], v.ok)) err(q,'l’opció bona no és la que toca');
      if(v.orig && !mateixValor(v.ok, v.orig)) err(q,`l’opció bona (${v.ok}) no val el mateix que l’enunciat (${v.orig})`);
      o.txt.forEach((t,i)=>{ if(i!==o.ok && t && o.opcions[i]!==v.noMax && mateixValor(t, v.orig||v.ok)) err(q,'una opció dolenta també és correcta: '+o.opcions[i]); });
      o.opcions.forEach((h,i)=>{ if(!o.txt[i]) return; const t=htmlAText(h); try{ if(!mateixValor(t,o.txt[i])) err(q,`l’opció ${h} no s’escriu com el seu valor (${t} ≠ ${o.txt[i]})`); }catch(e){ err(q,'opció il·legible: '+t+' · '+e.message); } });
    }
    if(v.k==='mc-cap'){
      const es = t => { const x=Q(0), u=Q(1); const v0=avaluaText(t,{[q.mc.opcions[0].match(/<i>(\w)<\/i>/)[1]]:x}); return v0; };
      const L=q.mc.opcions[0].match(/<i>(\w)<\/i>/)[1];
      const coef = t => { const c0=avaluaText(t,{[L]:Q(0)}), c1p=avaluaText(t,{[L]:Q(1)}), c1m=avaluaText(t,{[L]:Q(-1)}); const c2=qd(qs(qa(c1p,c1m),qm(Q(2),c0)),Q(2)); const c1=qd(qs(c1p,c1m),Q(2)); return [c0,c1,c2]; };
      const quad = x => { if(x.d!==1n || x.n<0n) return false; const r=BigInt(Math.round(Math.sqrt(Number(x.n)))); return r*r===x.n; };
      const identitat = t => { const [c0,c1,c2]=coef(t); if(!quad(c2)) return false; if(c1.n===0n) return c0.n<0n && quad(Q(-c0.n)); return quad(c0) && qeq(qm(c1,c1), qm(Q(4),qm(c0,c2))); };
      if(identitat(v.no)) err(q,'la que no ho és sí que és una identitat');
      v.ops.forEach(t=>{ if(!identitat(t)) err(q,'una opció no és identitat notable: '+t); });
      if(!htmlAText(o.opcions[o.ok]) || !mateixValor(htmlAText(o.opcions[o.ok]), v.no)) err(q,'l’opció bona no és la que no és identitat');
    }
    if(v.k==='semblant'){ const clau=x=>Object.keys(x.v).filter(k=>x.v[k]).sort().map(k=>k+x.v[k]).join(''); if(clau(v.obj)!==clau(v.ok)) err(q,'el semblant no ho és'); }
    if(v.k==='grau-alt'){ const g=x=>Object.values(x.v).reduce((s,e)=>s+e,0); const gs=v.ms.map(g); const max=Math.max(...gs); if(g(v.alt)!==max || gs.filter(x=>x===max).length!==1) err(q,'el terme de grau més alt no és únic o no és el bo'); }
    return;
  }
  /* resposta oberta */
  const bona=M.rawCorrecte(q,false);
  const r=M.avalua(q,bona); if(r.p!==1) err(q,`la correcció no accepta la resposta bona (p=${r.p}) ${JSON.stringify(bona)}`);
  if(q.camps.some(c=>c.tipus==='pol' && c.p.some(x=>x.d>1)) || q.camps.some(c=>c.tipus==='frac' && c.v.d>1)){
    const r2=M.avalua(q,M.rawCorrecte(q,true)); if(r2.p!==0.5 && !(q.camps.length>1 && r2.p>0 && r2.p<1)) err(q,`la no simplificada té p=${r2.p}`);
  }
  /* una resposta equivocada: suma 1 al primer coeficient o nombre */
  const dolenta=JSON.parse(JSON.stringify(bona));
  const c0=q.camps[0];
  if(c0.tipus==='pol'){ const k=Object.keys(dolenta[0].g)[0]||'0'; const x=M.llegeixCoef(dolenta[0].g[k]||'0',+k); dolenta[0].g[k]=String(x.v.n+x.v.d)+(x.v.d>1?'/'+x.v.d:''); }
  else dolenta[0].n=String(Number(dolenta[0].n)+Number(dolenta[0].d||1));
  if(M.avalua(q,dolenta).p===1) err(q,'la correcció accepta una resposta equivocada');
  for(const c of q.camps) if(c.tipus==='pol'){ if(c.G>6) err(q,'massa caselles: '+c.G); if(!c.p.length) err(q,'resultat zero'); }

  if(v.k==='expr'){
    const c=q.camps[0];
    for(let i=0;i<4;i++){ const x=VALORS[i]; const val=avaluaText(v.txt,{[v.L]:x}); if(!qeq(val, polVal(c.p,x))) { err(q,`${v.txt} amb ${v.L}=${qtxt(x)} val ${qtxt(val)} però la solució ${qtxt(polVal(c.p,x))}`); break; } }
    if(q.gran){ const t=htmlAText(q.gran); try{ for(let i=0;i<4;i++){ const x=VALORS[i]; if(!qeq(avaluaText(t,{[v.L]:x}), polVal(c.p,x))) { err(q,`l’enunciat que es veu (${t}) no val la solució`); break; } } }catch(e){ err(q,'no puc llegir l’enunciat: '+t+' · '+e.message); } }
    /* línies de la resolució: «= …» i «enunciat = …» han de valer la solució */
    const gt = q.gran ? htmlAText(q.gran) : null;
    (q.res||[]).forEach(l=>{ const t=htmlAText(l); if(!/^[-\d()a-zA-Z+*^:=,.]+$/.test(t) || /[a-z]{3}/.test(t)) return;
      const parts=t.split('='); if(!(parts[0]==='' || parts[0]===gt)) return;
      parts.filter(Boolean).forEach(pt=>{ try{ for(let i=0;i<3;i++){ const x=VALORS[i]; if(!qeq(avaluaText(pt,{[v.L]:x}), polVal(c.p,x))){ err(q,`a la resolució, ${pt} no val la solució`); break; } } }catch(e){ err(q,'resolució il·legible: '+pt); } }); });
    if(v.grau){ const g=c.p.length-1; if(q.camps[1].v.n!==g) err(q,'el grau no és el del polinomi reduït'); }
  }
  if(v.k==='fc'){
    const [cf,cd]=q.camps;
    for(let i=0;i<4;i++){ const x=VALORS[i]; if(!qeq(qm(polVal(cf.p,x),polVal(cd.p,x)), avaluaText(v.txt,{[v.L]:x}))){ err(q,'factor · parèntesi no torna a donar el polinomi'); break; } }
    const ts=[...v.txt.matchAll(/\((-?\d+)\/(\d+)\)\*\w\^(\d+)/g)].map(mm=>({n:BigInt(mm[1]), d:BigInt(mm[2]), e:Number(mm[3])}));
    if(ts.some(t=>t.d!==1n)) err(q,'coeficients no enters');
    const g=ts.reduce((s,t)=>bg(s,t.n),0n), e=Math.min(...ts.map(t=>t.e));
    const nz=cf.p.map((x,k)=>({x,k})).filter(o=>o.x.n!==0);
    if(nz.length!==1 || BigInt(nz[0].x.n)!==g || nz[0].k!==e) err(q,`el factor comú no és el més gran (${g}, exp ${e})`);
    /* un factor més petit (si n'hi ha) val mig punt */
    if(g>1n){ const bona2=JSON.parse(JSON.stringify(bona)); bona2[0].g={[e]:'1'}; bona2[1].g={}; cd.p.forEach((x,k)=>{ if(x.n!==0) bona2[1].g[k]=String(x.n*Number(g)); }); if(M.avalua(q,bona2).p!==0.5) err(q,'un factor no màxim no dona mig punt'); }
  }
  if(v.k==='mon'){ const g=Object.values(v.mm.v).reduce((s,e)=>s+e,0); if(q.camps[1].v.n!==g) err(q,'grau del monomi'); if(!q.camps[0].v.eq(v.mm.c)) err(q,'coeficient'); }
  if(v.k==='pol-info'){ if(q.camps[0].v.n!==v.ts.length || q.camps[1].v.n!==Math.max(...v.ts.map(t=>t.e))) err(q,'termes o grau'); }
  if(v.k==='pol-multi'){ const g=x=>Object.values(x.v).reduce((s,e)=>s+e,0); const gs=v.ms.map(g); if(q.camps[0].v.n!==v.ms.length) err(q,'nombre de termes'); if(q.camps[1].v.n!==Math.max(...gs)) err(q,'grau'); const ind=v.ms.find(x=>!Object.keys(x.v).length); if(q.camps[2].v.n!==(ind?ind.c.n:0)) err(q,'terme independent'); }
  if(v.k==='num'){ const val=avaluaText(v.txt,{}); if(!qeq(val,Q(q.camps[0].v.n))) err(q,`${v.txt} = ${qtxt(val)} i no ${q.camps[0].v.n}`); }
}

for(const t of M.T){
  for(let i=0;i<VEGADES;i++){
    let q; try{ q=M.genera(t); }catch(e){ err({niv:t.niv,id:t.id},'error en generar: '+e.message); break; }
    try{ verifica(q); }catch(e){ err(q,'error en verificar: '+e.stack.split('\n').slice(0,2).join(' ')); }
    const k=t.niv+' '+t.id; stats[k]=(stats[k]||0)+1;
  }
}
/* proves (simulacre i per apartats) */
for(const niv of ['AS','AN','AE']){ const s=M.prova(niv,'simulacre'); if(s.length!==12) errors.push('el simulacre '+niv+' té '+s.length+' preguntes'); }
/* lectura de caselles */
const LC=[['-3',1,'-3'],['−',1,'-1'],['+',2,'1'],['1/2',0,'1/2'],['-4/6',0,'-2/3'],['1,5',1,'3/2'],['',1,null]];
for(const [s,k,esp] of LC){ const x=M.llegeixCoef(s,k); const got=x===null?null:(x.v.d===1?String(x.v.n):x.v.n+'/'+x.v.d); if(got!==esp) errors.push(`llegeixCoef(${s}) = ${got} i no ${esp}`); }

if(errors.length){ console.log('✗ '+errors.length+' errors:\n'+errors.join('\n')); process.exit(1); }
console.log(`✓ Tot correcte (${M.T.length} plantilles, ${VEGADES} vegades cadascuna)`);
