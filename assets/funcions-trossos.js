/* Funcions a trossos · 1r de batxillerat, tema 2 (Funcions)
   L'alumne escriu cada tros (expressió + interval) i la gràfica es dibuixa sola.
   Part 1: el motor (llegir expressions, avaluar-les, passar-les a TeX, revisar intervals).
           No toca la pàgina, i la prova proves/prova-funcions-trossos.js el fa servir amb Node.
   Part 2: la interfície (només al navegador). */
'use strict';

const MOTOR = (function () {

  // ── Llegir una expressió ───────────────────────────────────────────────
  // Noms que s'entenen. L'ordre no importa: sempre es pren el nom més llarg.
  const FUNCIONS = {
    sqrt: 'sqrt', arrel: 'sqrt', cbrt: 'cbrt', abs: 'abs',
    ln: 'ln', log: 'log', exp: 'exp',
    sin: 'sin', sen: 'sin', cos: 'cos', tan: 'tan', tg: 'tan',
  };
  const CONSTANTS = { pi: 'pi', e: 'e' };
  const NOMS = Object.keys(FUNCIONS).concat(Object.keys(CONSTANTS), ['x'])
    .sort((a, b) => b.length - a.length);

  function normalitza(s) {
    return String(s)
      .replace(/[−–—]/g, '-').replace(/[·×∙⋅]/g, '*').replace(/÷/g, '/').replace(/:/g, '/')
      .replace(/,/g, '.').replace(/²/g, '^2').replace(/³/g, '^3')
      .replace(/√/g, 'sqrt').replace(/π/g, 'pi').replace(/X/g, 'x');
  }

  function tokens(s) {
    const t = []; let i = 0;
    while (i < s.length) {
      const c = s[i];
      if (/\s/.test(c)) { i++; continue; }
      const num = /^(\d+\.?\d*|\.\d+)/.exec(s.slice(i));
      if (num) { t.push({ k: 'n', v: parseFloat(num[1]), txt: num[1] }); i += num[1].length; continue; }
      if (/[a-z]/i.test(c)) {
        const nom = NOMS.find(n => s.startsWith(n, i));
        if (!nom) {
          const paraula = /^[a-z]+/i.exec(s.slice(i))[0];
          throw new Error('No entenc «' + paraula + '». La variable és x.');
        }
        if (nom === 'x') t.push({ k: 'x' });
        else if (FUNCIONS[nom]) t.push({ k: 'f', v: FUNCIONS[nom] });
        else t.push({ k: 'c', v: CONSTANTS[nom] });
        i += nom.length; continue;
      }
      if ('+-*/^()|'.includes(c)) { t.push({ k: c }); i++; continue; }
      if ('[{'.includes(c)) { t.push({ k: '(' }); i++; continue; }
      if (']}'.includes(c)) { t.push({ k: ')' }); i++; continue; }
      throw new Error('No entenc el símbol «' + c + '».');
    }
    return t;
  }

  function llegeix(text) {
    const s = normalitza(text).trim();
    if (!s) throw new Error('Escriu una expressió.');
    const t = tokens(s);
    let p = 0, dinsAbs = 0;
    const mira = () => t[p] && t[p].k;
    const pren = k => { if (mira() !== k) throw new Error(k === ')' ? 'Falta tancar un parèntesi.' : k === '|' ? 'Falta tancar el valor absolut |…|.' : 'Hi falta «' + k + '».'); p++; };

    function expr() {
      let a = terme();
      while (mira() === '+' || mira() === '-') { const op = t[p++].k; a = { t: op, a, b: terme() }; }
      return a;
    }
    const comencaFactor = () => {
      const k = mira();
      return k === 'n' || k === 'x' || k === 'c' || k === 'f' || k === '(' || (k === '|' && dinsAbs === 0);
    };
    function terme() {
      let a = unari();
      for (;;) {
        if (mira() === '*' || mira() === '/') { const op = t[p++].k; a = { t: op, a, b: unari() }; }
        else if (comencaFactor()) a = { t: '*', a, b: potencia(), imp: true };
        else return a;
      }
    }
    function unari() {
      if (mira() === '-') { p++; return { t: 'neg', a: unari() }; }
      if (mira() === '+') { p++; return unari(); }
      return potencia();
    }
    function potencia() {
      const base = primari();
      if (mira() === '^') { p++; return { t: '^', a: base, b: unari() }; }
      return base;
    }
    function primari() {
      const tk = t[p];
      if (!tk) throw new Error('L\'expressió s\'acaba massa aviat.');
      if (tk.k === 'n') { p++; return { t: 'n', v: tk.v, txt: tk.txt }; }
      if (tk.k === 'x') { p++; return { t: 'x' }; }
      if (tk.k === 'c') { p++; return { t: 'c', v: tk.v }; }
      if (tk.k === '(') { p++; const e = expr(); pren(')'); return { t: 'par', a: e }; }
      if (tk.k === '|') { p++; dinsAbs++; const e = expr(); dinsAbs--; pren('|'); return { t: 'f', v: 'abs', a: e }; }
      if (tk.k === 'f') {
        p++;
        if (!t[p]) throw new Error('Després de «' + tk.v + '» hi va un parèntesi: ' + tk.v + '(x).');
        const arg = mira() === '(' ? (p++, (() => { const e = expr(); pren(')'); return e; })()) : potencia();
        return { t: 'f', v: tk.v, a: arg };
      }
      if (tk.k === ')') throw new Error('Sobra un parèntesi «)».');
      throw new Error('Hi ha un «' + tk.k + '» on no toca.');
    }

    const arbre = expr();
    if (p < t.length) throw new Error(t[p].k === ')' ? 'Sobra un parèntesi «)».' : 'Hi ha alguna cosa que sobra al final.');
    return arbre;
  }

  // ── Avaluar ────────────────────────────────────────────────────────────
  function potReal(b, e) {
    const r = Math.pow(b, e);
    if (!isNaN(r) || b >= 0) return r;
    // base negativa i exponent fraccionari: arrel d'índex senar (p. ex. x^(1/3))
    for (let q = 3; q <= 15; q += 2) {
      const pq = e * q;
      if (Math.abs(pq - Math.round(pq)) < 1e-9) {
        const v = Math.pow(-b, e);
        return Math.round(pq) % 2 ? -v : v;
      }
    }
    return NaN;
  }

  function avalua(n, x) {
    switch (n.t) {
      case 'n': return n.v;
      case 'x': return x;
      case 'c': return n.v === 'pi' ? Math.PI : Math.E;
      case 'par': return avalua(n.a, x);
      case 'neg': return -avalua(n.a, x);
      case '+': return avalua(n.a, x) + avalua(n.b, x);
      case '-': return avalua(n.a, x) - avalua(n.b, x);
      case '*': return avalua(n.a, x) * avalua(n.b, x);
      case '/': { const d = avalua(n.b, x); return d === 0 ? NaN : avalua(n.a, x) / d; }
      case '^': return potReal(avalua(n.a, x), avalua(n.b, x));
      case 'f': {
        const a = avalua(n.a, x);
        switch (n.v) {
          case 'sqrt': return a < 0 ? NaN : Math.sqrt(a);
          case 'cbrt': return Math.cbrt(a);
          case 'abs': return Math.abs(a);
          case 'ln': return a <= 0 ? NaN : Math.log(a);
          case 'log': return a <= 0 ? NaN : Math.log10(a);
          case 'exp': return Math.exp(a);
          case 'sin': return Math.sin(a);
          case 'cos': return Math.cos(a);
          case 'tan': return Math.abs(Math.cos(a)) < 1e-12 ? NaN : Math.tan(a);
        }
      }
    }
    return NaN;
  }

  const teX = n => n.t === 'x' || (n.t === 'par' && teX(n.a)) || (n.a && teX(n.a)) || (n.b && teX(n.b));

  // ── Escriure nombres ───────────────────────────────────────────────────
  function arrodoneix(v, dec) { const f = Math.pow(10, dec); return Math.round(v * f) / f; }
  // text pla: −2,5
  function fmt(v, dec) {
    if (!isFinite(v)) return v > 0 ? '+∞' : v < 0 ? '−∞' : '?';
    let r = arrodoneix(v, dec == null ? 4 : dec);
    if (Object.is(r, -0)) r = 0;
    return (r < 0 ? '−' : '') + String(Math.abs(r)).replace('.', ',');
  }
  // TeX: -2{,}5
  function fmtTeX(v, dec) {
    let r = arrodoneix(v, dec == null ? 4 : dec);
    if (Object.is(r, -0)) r = 0;
    return (r < 0 ? '-' : '') + String(Math.abs(r)).replace('.', '{,}');
  }
  const exacte = (v, dec) => Math.abs(v - arrodoneix(v, dec == null ? 4 : dec)) < 1e-9;

  // ── Passar a TeX ───────────────────────────────────────────────────────
  // opc.sub = valor que substitueix la x (per escriure f(−2) = 2·(−2) − 10)
  const FTEX = { ln: '\\ln', log: '\\log', sin: '\\sin', cos: '\\cos', tan: '\\tan' };

  function comencaAmbXifra(n) {
    while (n) {
      if (n.t === 'n') return true;
      if (n.t === '*' || n.t === '/' || n.t === '^') { if (n.t === '/') return false; n = n.a; continue; }
      return false;
    }
    return false;
  }
  function tex(n, opc) {
    opc = opc || {};
    const T = m => tex(m, opc);
    const ambPar = s => '\\left(' + s + '\\right)';
    switch (n.t) {
      case 'n': return n.txt ? n.txt.replace('.', '{,}') : fmtTeX(n.v);
      case 'x':
        if (opc.sub == null) return 'x';
        return opc.sub < 0 ? '(' + fmtTeX(opc.sub) + ')' : fmtTeX(opc.sub);
      case 'c': return n.v === 'pi' ? '\\pi' : 'e';
      case 'par': return ambPar(T(n.a));
      case 'neg': {
        const a = n.a;
        const s = T(a);
        return '-' + (a.t === '+' || a.t === '-' || a.t === 'neg' ? ambPar(s) : s);
      }
      case '+': case '-': {
        const b = n.b;
        let sb = T(b);
        if (b.t === 'neg' || (n.t === '-' && (b.t === '+' || b.t === '-'))) sb = ambPar(sb);
        return T(n.a) + n.t + sb;
      }
      case '*': {
        const a = n.a, b = n.b;
        let sa = T(a), sb = T(b);
        if (a.t === '+' || a.t === '-') sa = ambPar(sa);
        if (b.t === '+' || b.t === '-' || b.t === 'neg') sb = ambPar(sb);
        let junt = (n.imp || a.t === 'n') && !comencaAmbXifra(b);
        // en substituir, 2x passa a 2·(−3): cal el punt
        if (opc.sub != null && teX(b) && (b.t === 'x' || (b.t === '^' && b.a.t === 'x') || b.t === '*')) junt = false;
        if (opc.sub != null && a.t !== 'n' && teX(a)) junt = false;
        return sa + (junt ? '' : '\\cdot ') + sb;
      }
      case '/': {
        const treu = m => m.t === 'par' ? m.a : m;
        return '\\dfrac{' + T(treu(n.a)) + '}{' + T(treu(n.b)) + '}';
      }
      case '^': {
        const a = n.a;
        let sa = T(a);
        const simple = a.t === 'x' || a.t === 'c' || a.t === 'par' || (a.t === 'n') || (a.t === 'f' && a.v === 'abs');
        if (!simple) sa = ambPar(sa);
        const treu = m => m.t === 'par' ? m.a : m;
        return sa + '^{' + T(treu(n.b)) + '}';
      }
      case 'f': {
        const treu = m => m.t === 'par' ? m.a : m;
        const arg = T(treu(n.a));
        if (n.v === 'sqrt') return '\\sqrt{' + arg + '}';
        if (n.v === 'cbrt') return '\\sqrt[3]{' + arg + '}';
        if (n.v === 'abs') return '\\left|' + arg + '\\right|';
        if (n.v === 'exp') return 'e^{' + arg + '}';
        return FTEX[n.v] + ambPar(arg);
      }
    }
    return '?';
  }

  // ── Intervals ──────────────────────────────────────────────────────────
  // Un interval és { a, ai, b, bi }: a = −Infinity si no té límit per l'esquerra;
  // ai/bi = el límit hi és inclòs (≤) o no (<).
  function buit(I) { return I.a > I.b || (I.a === I.b && !(I.ai && I.bi)); }
  function dins(I, x) {
    return (x > I.a || (x === I.a && I.ai)) && (x < I.b || (x === I.b && I.bi));
  }
  function interseccio(I, J) {
    let a, ai, b, bi;
    if (I.a > J.a) { a = I.a; ai = I.ai; } else if (J.a > I.a) { a = J.a; ai = J.ai; } else { a = I.a; ai = I.ai && J.ai; }
    if (I.b < J.b) { b = I.b; bi = I.bi; } else if (J.b < I.b) { b = J.b; bi = J.bi; } else { b = I.b; bi = I.bi && J.bi; }
    const R = { a, ai: isFinite(a) && ai, b, bi: isFinite(b) && bi };
    return buit(R) ? null : R;
  }
  function textInterval(I) {
    if (I.a === I.b) return 'x = ' + fmt(I.a);
    const e = isFinite(I.a) ? (I.ai ? '[' : '(') + fmt(I.a) : '(−∞';
    const d = isFinite(I.b) ? fmt(I.b) + (I.bi ? ']' : ')') : '+∞)';
    return e + ', ' + d;
  }
  function texCondicio(I) {
    const A = fmtTeX(I.a), B = fmtTeX(I.b);
    if (I.a === I.b) return 'x=' + A;
    if (!isFinite(I.a) && !isFinite(I.b)) return 'x\\in\\mathbb{R}';
    if (!isFinite(I.a)) return 'x' + (I.bi ? '\\le ' : '<') + B;
    if (!isFinite(I.b)) return 'x' + (I.ai ? '\\ge ' : '>') + A;
    return A + (I.ai ? '\\le ' : '<') + 'x' + (I.bi ? '\\le ' : '<') + B;
  }
  function textCondicio(I) {
    const A = fmt(I.a), B = fmt(I.b);
    if (I.a === I.b) return 'x = ' + A;
    if (!isFinite(I.a) && !isFinite(I.b)) return 'qualsevol x';
    if (!isFinite(I.a)) return 'x ' + (I.bi ? '≤' : '<') + ' ' + B;
    if (!isFinite(I.b)) return 'x ' + (I.ai ? '≥' : '>') + ' ' + A;
    return A + ' ' + (I.ai ? '≤' : '<') + ' x ' + (I.bi ? '≤' : '<') + ' ' + B;
  }

  // Trossos de la recta real que no són a cap interval (llista d'intervals)
  function forats(llista) {
    const ord = llista.filter(I => !buit(I)).slice().sort((p, q) => p.a - q.a || (q.ai - p.ai));
    const res = [];
    let fins = -Infinity, finsInc = false; // fins on està cobert
    let primer = true;
    for (const I of ord) {
      if (primer) {
        if (isFinite(I.a)) res.push({ a: -Infinity, ai: false, b: I.a, bi: !I.ai });
        primer = false;
      } else if (I.a > fins || (I.a === fins && !finsInc && !I.ai)) {
        res.push({ a: fins, ai: !finsInc, b: I.a, bi: !I.ai });
      }
      if (I.b > fins || (I.b === fins && I.bi)) { fins = I.b; finsInc = I.bi; }
      if (fins === Infinity) break;
    }
    if (primer) return [{ a: -Infinity, ai: false, b: Infinity, bi: false }];
    if (fins < Infinity) res.push({ a: fins, ai: !finsInc, b: Infinity, bi: false });
    return res.filter(I => !buit(I));
  }

  // Revisa una llista de trossos { expr, a, ai, b, bi } (a i b són text; buit = infinit)
  // i torna, per a cada tros, l'arbre i l'interval (o l'error), i els avisos generals.
  function valor(text) {
    const s = String(text).trim();
    if (!s) return null;
    const n = llegeix(s);
    if (teX(n)) throw new Error('Aquí hi va un nombre, sense x.');
    const v = avalua(n, 0);
    if (!isFinite(v)) throw new Error('Aquest valor no és un nombre real.');
    return v;
  }

  function revisa(trossos) {
    const res = trossos.map(t => {
      const r = { errExpr: null, errInt: null, arbre: null, I: null };
      try { r.arbre = llegeix(t.expr); } catch (e) { r.errExpr = e.message; }
      try {
        const a = valor(t.a), b = valor(t.b);
        r.I = { a: a == null ? -Infinity : a, ai: a != null && !!t.ai, b: b == null ? Infinity : b, bi: b != null && !!t.bi };
        if (buit(r.I)) {
          r.errInt = r.I.a > r.I.b ? 'L\'interval és buit: el límit de l\'esquerra ha de ser més petit que el de la dreta.'
            : 'Per a un sol punt (x = ' + fmt(r.I.a) + '), posa ≤ als dos costats.';
          r.I = null;
        }
      } catch (e) { r.errInt = e.message; }
      return r;
    });
    const avisos = [];
    // només els trossos que ja tenen una expressió bona (un tros acabat d'afegir no molesta)
    const bons = res.map((r, i) => ({ i, I: r.I, ok: !!r.arbre })).filter(o => o.I && o.ok);
    for (let i = 0; i < bons.length; i++) for (let j = i + 1; j < bons.length; j++) {
      const X = interseccio(bons[i].I, bons[j].I);
      if (!X) continue;
      const qui = 'Els trossos ' + (bons[i].i + 1) + ' i ' + (bons[j].i + 1);
      if (X.a === X.b) avisos.push({ tipus: 'error', text: qui + ' inclouen tots dos x = ' + fmt(X.a) + '. Una x només pot tenir una imatge: en un dels dos, canvia ≤ per <.' });
      else avisos.push({ tipus: 'error', text: qui + ' es trepitgen a ' + textInterval(X) + '. Una x només pot tenir una imatge: revisa els intervals.' });
    }
    if (bons.length) {
      const f = forats(bons.map(o => o.I));
      if (f.length) avisos.push({ tipus: 'info', text: 'Cap tros no inclou ' + f.map(I => I.a === I.b ? 'x = ' + fmt(I.a) : textInterval(I)).join(' ni ') + ': allà la funció no està definida.' });
    }
    return { trossos: res, avisos };
  }

  return { llegeix, avalua, tex, fmt, fmtTeX, exacte, valor, revisa, interseccio, forats, dins, buit,
           texCondicio, textCondicio, textInterval, teX };
})();

if (typeof module !== 'undefined' && module.exports) { module.exports = MOTOR; }

// ═══════════════════════════════════════════════════════════════════════════
// Part 2 · Interfície
// ═══════════════════════════════════════════════════════════════════════════
if (typeof document !== 'undefined') (function () {
  const M = MOTOR;
  const NS = 'http://www.w3.org/2000/svg';
  const COLORS = ['#2F6FA8', '#D9622B', '#2E8B5C', '#9C3D8F', '#B8860B', '#C73B3B', '#4A5BC4', '#1E8C92'];
  const MAX_TROSSOS = 8;

  const EXEMPLES = [
    { nom: 'Tres rectes', t: [['x+4', '', 0, '-3', 0], ['2x-10', '-3', 1, '0', 0], ['3-x', '0', 1, '', 0]] },
    { nom: 'Valor absolut', t: [['-x', '', 0, '0', 0], ['x', '0', 1, '', 0]] },
    { nom: 'Paràbola i recta', t: [['x^2', '', 0, '1', 0], ['2x-1', '1', 1, '', 0]] },
    { nom: 'Amb un salt', t: [['x+1', '', 0, '2', 1], ['5-x', '2', 0, '', 0]] },
    { nom: 'Un punt a part', t: [['x^2-1', '', 0, '1', 0], ['3', '1', 1, '1', 1], ['x^2-1', '1', 0, '', 0]] },
    { nom: 'Hipèrbola i arrel', t: [['1/x', '', 0, '0', 0], ['sqrt(x)', '0', 1, '', 0]] },
    { nom: 'Esglaons (tarifa)', t: [['2', '0', 1, '1', 0], ['3,5', '1', 1, '3', 0], ['5', '3', 1, '6', 1]] },
  ];

  const $ = id => document.getElementById(id);
  const llista = $('ft-trossos'), def = $('ft-def'), avisosEl = $('ft-avisos');
  const svg = $('ft-svg'), plot = $('ft-plot');
  const xin = $('ft-x'), resEl = $('ft-res');

  let trossos = [];          // { expr, a, ai, b, bi }
  let revisio = { trossos: [], avisos: [] };
  let vista = null;          // { x0, x1, y0, y1 }
  let xTria = null;          // valor triat per calcular f(x)

  // ── Estat a l'adreça (per compartir una funció concreta) ──────────────
  function codifica() {
    return trossos.map(t => [t.expr, t.a, t.ai ? 1 : 0, t.b, t.bi ? 1 : 0].map(v => encodeURIComponent(v)).join('~')).join('_');
  }
  function descodifica(h) {
    try {
      const m = /(?:^|&)f=([^&]*)/.exec(h);
      if (!m) return null;
      const t = m[1].split('_').map(s => {
        const p = s.split('~').map(decodeURIComponent);
        return { expr: p[0] || '', a: p[1] || '', ai: p[2] === '1', b: p[3] || '', bi: p[4] === '1' };
      });
      return t.length ? t.slice(0, MAX_TROSSOS) : null;
    } catch (e) { return null; }
  }
  function desaAdreca() {
    try { history.replaceState(null, '', '#f=' + codifica()); } catch (e) { /* res */ }
  }

  // ── Editor de trossos ──────────────────────────────────────────────────
  const PAPERERA = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16"/><path d="M10 11v6M14 11v6"/><path d="M6 7l1 13h10l1-13"/><path d="M9 7V4h6v3"/></svg>';

  function pintaLlista() {
    llista.innerHTML = trossos.map((t, i) => `
      <div class="ft-tros" data-i="${i}" style="--c:${COLORS[i % COLORS.length]}">
        <div class="ft-fila ft-fila-expr">
          <span class="ft-num">${i + 1}</span>
          <label class="ft-fx" for="ft-e${i}"><i>f</i>(<i>x</i>) =</label>
          <input id="ft-e${i}" class="ft-expr" type="text" inputmode="text" autocomplete="off" autocapitalize="off" spellcheck="false"
                 value="${esc(t.expr)}" placeholder="p. ex. 2x − 1" aria-label="Expressió del tros ${i + 1}">
          <button class="ft-treu" type="button" title="Treu aquest tros" aria-label="Treu el tros ${i + 1}" ${trossos.length < 2 ? 'disabled' : ''}>${PAPERERA}</button>
        </div>
        <div class="ft-fila ft-fila-int">
          <span class="ft-si">si</span>
          <input class="ft-lim ft-a" type="text" inputmode="decimal" autocomplete="off" value="${esc(t.a)}" placeholder="−∞" aria-label="Límit esquerre del tros ${i + 1} (buit = −∞)">
          <button class="ft-op ft-ai" type="button" aria-label="Canvia &lt; o ≤ a l'esquerra" ${t.a.trim() ? '' : 'disabled'}>${t.a.trim() && t.ai ? '≤' : '<'}</button>
          <span class="ft-xvar"><i>x</i></span>
          <button class="ft-op ft-bi" type="button" aria-label="Canvia &lt; o ≤ a la dreta" ${t.b.trim() ? '' : 'disabled'}>${t.b.trim() && t.bi ? '≤' : '<'}</button>
          <input class="ft-lim ft-b" type="text" inputmode="decimal" autocomplete="off" value="${esc(t.b)}" placeholder="+∞" aria-label="Límit dret del tros ${i + 1} (buit = +∞)">
        </div>
        <p class="ft-err" hidden></p>
      </div>`).join('');
    $('ft-afegeix').disabled = trossos.length >= MAX_TROSSOS;
  }

  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;'); }

  llista.addEventListener('input', e => {
    const fila = e.target.closest('.ft-tros'); if (!fila) return;
    const t = trossos[+fila.dataset.i];
    if (e.target.classList.contains('ft-expr')) t.expr = e.target.value;
    else if (e.target.classList.contains('ft-a')) {
      t.a = e.target.value;
      const op = fila.querySelector('.ft-ai'); op.disabled = !t.a.trim(); op.textContent = t.a.trim() && t.ai ? '≤' : '<';
    } else if (e.target.classList.contains('ft-b')) {
      t.b = e.target.value;
      const op = fila.querySelector('.ft-bi'); op.disabled = !t.b.trim(); op.textContent = t.b.trim() && t.bi ? '≤' : '<';
    }
    canvia(false);
  });
  llista.addEventListener('click', e => {
    const fila = e.target.closest('.ft-tros'); if (!fila) return;
    const i = +fila.dataset.i, t = trossos[i];
    const op = e.target.closest('.ft-op');
    if (op) {
      if (op.classList.contains('ft-ai')) t.ai = !t.ai; else t.bi = !t.bi;
      op.textContent = (op.classList.contains('ft-ai') ? t.ai : t.bi) ? '≤' : '<';
      canvia(false);
      return;
    }
    if (e.target.closest('.ft-treu') && trossos.length > 1) {
      trossos.splice(i, 1);
      pintaLlista(); canvia(false);
      const seg = llista.querySelectorAll('.ft-expr')[Math.min(i, trossos.length - 1)];
      if (seg) seg.focus();
    }
  });
  llista.addEventListener('keydown', e => {
    if (e.key === 'Enter' && e.target.tagName === 'INPUT') {
      e.preventDefault();
      const camps = [...llista.querySelectorAll('input')];
      const k = camps.indexOf(e.target);
      if (camps[k + 1]) camps[k + 1].focus(); else $('ft-afegeix').focus();
    }
  });

  $('ft-afegeix').addEventListener('click', () => {
    if (trossos.length >= MAX_TROSSOS) return;
    const ult = trossos[trossos.length - 1];
    const nou = { expr: '', a: '', ai: false, b: '', bi: false };
    if (ult && ult.b.trim()) { nou.a = ult.b; nou.ai = !ult.bi; }
    trossos.push(nou);
    pintaLlista(); canvia(false);
    const camps = llista.querySelectorAll('.ft-expr');
    camps[camps.length - 1].focus();
  });

  // Exemples
  const triaEx = $('ft-exemples');
  triaEx.innerHTML = '<option value="">Carrega un exemple…</option>' +
    EXEMPLES.map((e, i) => `<option value="${i}">${e.nom}</option>`).join('');
  triaEx.addEventListener('change', () => {
    const e = EXEMPLES[+triaEx.value]; if (!e) return;
    carrega(e.t.map(([expr, a, ai, b, bi]) => ({ expr, a, ai: !!ai, b, bi: !!bi })));
    triaEx.value = '';
  });
  $('ft-nova').addEventListener('click', () => {
    carrega([{ expr: '', a: '', ai: false, b: '', bi: false }]);
    llista.querySelector('.ft-expr').focus();
  });

  function carrega(t) {
    trossos = t; xTria = null; xin.value = '';
    pintaLlista(); canvia(true);
  }

  // ── Quan canvia alguna cosa ────────────────────────────────────────────
  let espera = null;
  function canvia(ajusta) {
    revisio = M.revisa(trossos);
    // errors de cada tros
    llista.querySelectorAll('.ft-tros').forEach((fila, i) => {
      const r = revisio.trossos[i], t = trossos[i];
      const errE = t.expr.trim() ? r.errExpr : null;
      const errI = r.errInt;
      fila.querySelector('.ft-expr').classList.toggle('malament', !!errE);
      fila.querySelectorAll('.ft-lim').forEach(c => c.classList.toggle('malament', !!errI));
      const p = fila.querySelector('.ft-err');
      const msg = [errE, errI].filter(Boolean).join(' ');
      p.textContent = msg; p.hidden = !msg;
    });
    avisosEl.innerHTML = revisio.avisos.map(a =>
      `<p class="ft-avis ft-avis-${a.tipus}">${a.text}</p>`).join('');
    if (ajusta || !vista) ajustaVista();
    dibuixa();
    calcula();
    desaAdreca();
    clearTimeout(espera);
    espera = setTimeout(pintaDefinicio, 180);
  }

  // Definició amb clau, amb MathJax (si no ha carregat, en text pla)
  function pintaDefinicio() {
    const files = trossos.map((t, i) => {
      const r = revisio.trossos[i];
      const e = r.arbre ? M.tex(r.arbre) : (t.expr.trim() ? '\\text{?}' : '\\ldots');
      const c = r.I ? M.texCondicio(r.I) : '\\ldots';
      return '{\\color{' + COLORS[i % COLORS.length] + '}' + e + '} & \\text{si } ' + c;
    });
    const tex = 'f(x)=' + (files.length === 1 ? files[0].replace(' & ', '\\quad ') : '\\begin{cases}' + files.join('\\\\[4pt]') + '\\end{cases}');
    if (window.MathJax && MathJax.typesetPromise) {
      def.innerHTML = '\\[' + tex + '\\]';
      MathJax.typesetClear && MathJax.typesetClear([def]);
      MathJax.typesetPromise([def]).catch(() => {});
    } else {
      def.textContent = 'f(x) = ' + trossos.map((t, i) => t.expr + ' si ' + (revisio.trossos[i].I ? M.textCondicio(revisio.trossos[i].I) : '…')).join(' ; ');
    }
  }

  // ── Gràfica ────────────────────────────────────────────────────────────
  function trossosBons() {
    return trossos.map((t, i) => ({ i, r: revisio.trossos[i] }))
      .filter(o => o.r.arbre && o.r.I && !o.r.errExpr);
  }

  function ajustaVista() {
    const bons = trossosBons();
    const lims = [];
    bons.forEach(o => { if (isFinite(o.r.I.a)) lims.push(o.r.I.a); if (isFinite(o.r.I.b)) lims.push(o.r.I.b); });
    let x0 = -8, x1 = 8;
    if (lims.length) {
      const mn = Math.min(...lims), mx = Math.max(...lims);
      x0 = Math.min(mn - 4, -2); x1 = Math.max(mx + 4, 2);
      const tancatE = bons.every(o => isFinite(o.r.I.a)), tancatD = bons.every(o => isFinite(o.r.I.b));
      if (tancatE) x0 = Math.min(mn - 1, -1);
      if (tancatD) x1 = Math.max(mx + 1, 1);
      if (x1 - x0 < 8) { const m = (x0 + x1) / 2; x0 = m - 4; x1 = m + 4; }
    }
    // valors de y dins de la finestra (sense els extrems de les asímptotes)
    const ys = [];
    bons.forEach(o => {
      for (let k = 0; k <= 400; k++) {
        const x = x0 + (x1 - x0) * k / 400;
        if (!M.dins(o.r.I, x)) continue;
        const y = M.avalua(o.r.arbre, x);
        if (isFinite(y)) ys.push(y);
      }
      [o.r.I.a, o.r.I.b].forEach(x => { if (isFinite(x)) { const y = M.avalua(o.r.arbre, x); if (isFinite(y)) ys.push(y); } });
    });
    // Primer, els punts clau (els extrems de cada tros i el 0); després s'amplia cap a la
    // resta de valors, però sense que l'escala vertical quedi massa aixafada.
    let y0 = -6, y1 = 6;
    if (ys.length) {
      const claus = [0];
      bons.forEach(o => [o.r.I.a, o.r.I.b].forEach(x => {
        if (!isFinite(x)) return;
        const f = t => M.avalua(o.r.arbre, t);
        const y = f(x);
        if (isFinite(y)) { claus.push(y); return; }
        // extrem on l'expressió no existeix: només si s'hi acosta a un valor (no a una asímptota)
        const cap = x === o.r.I.a ? 1 : -1, y1 = f(x + cap * 1e-7), y2 = f(x + cap * 1e-4);
        if (isFinite(y1) && Math.abs(y1 - y2) < 0.01) claus.push(y1);
      }));
      ys.sort((p, q) => p - q);
      const tall = Math.floor(ys.length * 0.04);
      const lo = ys[tall], hi = ys[ys.length - 1 - tall];
      let kLo = Math.min(...claus), kHi = Math.max(...claus);
      const W0 = plot.clientWidth || 800, H0 = plot.clientHeight || 500;
      const maxim = Math.max((x1 - x0) * H0 / W0 * 2, kHi - kLo);
      const baix = Math.max(lo, kHi - maxim), dalt = Math.min(hi, kLo + maxim);
      y0 = Math.min(kLo, baix); y1 = Math.max(kHi, dalt);
      if (y1 - y0 > maxim) { if (dalt > kHi) y1 = y0 + maxim; else y0 = y1 - maxim; }
      const marge = Math.max((y1 - y0) * 0.1, 1);
      y0 -= marge; y1 += marge;
      if (y1 - y0 < 6) { const m = (y0 + y1) / 2; y0 = m - 3; y1 = m + 3; }
    }
    vista = { x0, x1, y0, y1 };
  }

  function pas(rang, px) {
    // pas de la quadrícula: 1, 2, 5, 10… perquè quedin uns 45-90 px entre línies
    const brut = rang / Math.max(px / 60, 1);
    const p10 = Math.pow(10, Math.floor(Math.log10(brut)));
    const m = brut / p10;
    return (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * p10;
  }

  let X, Y, W, H;
  const el = (t, a, pare) => { const e = document.createElementNS(NS, t); for (const k in a) e.setAttribute(k, a[k]); (pare || svg).appendChild(e); return e; };

  function dibuixa() {
    W = plot.clientWidth; H = plot.clientHeight;
    if (!W || !H) return;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.innerHTML = '';
    const { x0, x1, y0, y1 } = vista;
    X = x => (x - x0) / (x1 - x0) * W;
    Y = y => H - (y - y0) / (y1 - y0) * H;

    // quadrícula
    const px = pas(x1 - x0, W), py = pas(y1 - y0, H);
    const g = el('g', { class: 'quadricula' });
    for (let x = Math.ceil(x0 / px) * px; x <= x1; x += px) el('line', { x1: X(x), x2: X(x), y1: 0, y2: H }, g);
    for (let y = Math.ceil(y0 / py) * py; y <= y1; y += py) el('line', { x1: 0, x2: W, y1: Y(y), y2: Y(y) }, g);

    // eixos
    const ex = Math.min(Math.max(Y(0), 0), H), ey = Math.min(Math.max(X(0), 0), W);
    const eixos = el('g', { class: 'eixos' });
    el('line', { x1: 0, x2: W, y1: ex, y2: ex }, eixos);
    el('line', { x1: ey, x2: ey, y1: 0, y2: H }, eixos);
    el('path', { d: `M${W - 1} ${ex} l-9 -5 v10 z`, class: 'fletxa' }, eixos);
    el('path', { d: `M${ey} 1 l-5 9 h10 z`, class: 'fletxa' }, eixos);
    const nums = el('g', { class: 'numeros' });
    const sota = ex + 17 > H - 4 ? ex - 7 : ex + 17;
    for (let x = Math.ceil(x0 / px) * px; x <= x1; x += px) {
      if (Math.abs(x) < px / 2 || X(x) < 10 || X(x) > W - 18) continue;
      const tx = el('text', { x: X(x), y: sota, 'text-anchor': 'middle' }, nums); tx.textContent = M.fmt(x, 6);
    }
    const costat = ey - 7 < 26 ? ey + 7 : ey - 7;
    for (let y = Math.ceil(y0 / py) * py; y <= y1; y += py) {
      if (Math.abs(y) < py / 2 || Y(y) < 12 || Y(y) > H - 8) continue;
      const ty = el('text', { x: costat, y: Y(y) + 4, 'text-anchor': costat > ey ? 'start' : 'end' }, nums); ty.textContent = M.fmt(y, 6);
    }
    if (X(0) > 10 && X(0) < W - 10 && Y(0) > 10 && Y(0) < H - 10) {
      const t0 = el('text', { x: ey - 6, y: ex + 16, 'text-anchor': 'end' }, nums); t0.textContent = '0';
    }
    const lx = el('text', { x: W - 8, y: ex - 10, 'text-anchor': 'end', class: 'nom-eix' }); lx.textContent = 'x';
    const ly = el('text', { x: ey + 10, y: 16, class: 'nom-eix' }); ly.textContent = 'y';

    // trossos
    const punts = [];  // els punts dels extrems, per dibuixar-los a sobre
    const marge = (y1 - y0) * 4;
    trossosBons().forEach(({ i, r }) => {
      const c = COLORS[i % COLORS.length], I = r.I, f = x => M.avalua(r.arbre, x);
      if (I.a === I.b) { const y = f(I.a); if (isFinite(y)) punts.push({ x: I.a, y, c, ple: true }); return; }
      const a = Math.max(I.a, x0 - (x1 - x0) * 0.02), b = Math.min(I.b, x1 + (x1 - x0) * 0.02);
      if (a < b) {
        const n = Math.max(200, Math.ceil(W * 1.5));
        let d = '', abans = null;
        for (let k = 0; k <= n; k++) {
          let x = a + (b - a) * k / n;
          // als extrems oberts, ens hi acostem sense tocar-los
          if (k === 0 && !I.ai && x === I.a) x += (b - a) * 1e-7;
          if (k === n && !I.bi && x === I.b) x -= (b - a) * 1e-7;
          let y = f(x);
          if (!isFinite(y)) { abans = null; continue; }
          if (abans) {
            const salt = Math.abs(Y(y) - Y(abans.y));
            if (salt > H * 0.5) {
              // asímptota? mirem el punt del mig
              const ym = f((x + abans.x) / 2);
              if (!isFinite(ym) || ym > Math.max(y, abans.y) + 1e-9 || ym < Math.min(y, abans.y) - 1e-9) abans = null;
            }
          }
          const yc = Math.max(y0 - marge, Math.min(y1 + marge, y));
          d += (abans ? 'L' : 'M') + X(x).toFixed(1) + ' ' + Y(yc).toFixed(1);
          abans = { x, y };
        }
        if (d) el('path', { d, class: 'corba', stroke: c });
      }
      // extrems finits
      [[I.a, I.ai, 1], [I.b, I.bi, -1]].forEach(([x, inc, cap]) => {
        if (!isFinite(x)) return;
        let y = f(x);
        if (inc) { if (isFinite(y)) punts.push({ x, y, c, ple: true }); return; }
        if (!isFinite(y)) y = f(x + cap * 1e-7 * Math.max(1, Math.abs(x)));
        if (isFinite(y) && Math.abs(f(x + cap * 1e-5) - y) < (y1 - y0) * 0.05) punts.push({ x, y, c, ple: false });
      });
    });
    // primer els buits, després els plens (un punt ple tapa un buit al mateix lloc)
    punts.sort((p, q) => p.ple - q.ple).forEach(p => {
      if (p.x < x0 || p.x > x1 || p.y < y0 || p.y > y1) return;
      el('circle', { cx: X(p.x), cy: Y(p.y), r: 5.5, class: p.ple ? 'punt-ple' : 'punt-buit', stroke: p.c, fill: p.ple ? p.c : '#fff' });
    });

    // punt triat per calcular f(x)
    dibuixaTria();
  }

  let capaTria = null;
  function dibuixaTria() {
    if (capaTria) capaTria.remove();
    capaTria = null;
    if (xTria == null || !vista) return;
    const quin = trossosBons().find(o => M.dins(o.r.I, xTria));
    if (!quin) return;
    const y = M.avalua(quin.r.arbre, xTria);
    if (!isFinite(y)) return;
    const { x0, x1, y0, y1 } = vista;
    if (xTria < x0 || xTria > x1 || y < y0 || y > y1) return;
    capaTria = el('g', { class: 'tria' });
    const ex = Math.min(Math.max(Y(0), 0), H), ey = Math.min(Math.max(X(0), 0), W);
    el('line', { x1: X(xTria), x2: X(xTria), y1: ex, y2: Y(y) }, capaTria);
    el('line', { x1: ey, x2: X(xTria), y1: Y(y), y2: Y(y) }, capaTria);
    el('circle', { cx: X(xTria), cy: Y(y), r: 7 }, capaTria);
    const dreta = X(xTria) < W * 0.72;
    const t = el('text', { x: X(xTria) + (dreta ? 12 : -12), y: Y(y) - 12, 'text-anchor': dreta ? 'start' : 'end' }, capaTria);
    t.textContent = '(' + M.fmt(xTria) + ', ' + M.fmt(y) + ')';
  }

  // ── Calcula f(x) ───────────────────────────────────────────────────────
  function calcula() {
    const txt = xin.value.trim();
    if (!txt) {
      xTria = null; dibuixaTria();
      resEl.innerHTML = '<span class="ft-pista">Escriu un valor de <i>x</i> o fes clic a la gràfica.</span>';
      return;
    }
    let x;
    try { x = M.valor(txt); } catch (e) { xTria = null; dibuixaTria(); resEl.innerHTML = '<span class="ft-mal">' + e.message + '</span>'; return; }
    xTria = x; dibuixaTria();
    const bons = trossos.map((t, i) => ({ i, r: revisio.trossos[i] })).filter(o => o.r.I && M.dins(o.r.I, x));
    if (!bons.length) {
      resEl.innerHTML = '<span class="ft-mal">x = ' + M.fmt(x) + ' no és a cap tros: <i>f</i>(' + M.fmt(x) + ') no existeix.</span>';
      return;
    }
    const o = bons[0];
    if (!o.r.arbre) { resEl.innerHTML = '<span class="ft-mal">Revisa l\'expressió del tros ' + (o.i + 1) + '.</span>'; return; }
    const y = M.avalua(o.r.arbre, x);
    const c = COLORS[o.i % COLORS.length];
    const quin = '<span class="ft-quin" style="--c:' + c + '">Tros ' + (o.i + 1) + ' · ' + M.textCondicio(o.r.I) + '</span>';
    let tex = 'f(' + M.fmtTeX(x) + ')=' + M.tex(o.r.arbre, { sub: x });
    const nomesNombre = !M.teX(o.r.arbre);
    if (!isFinite(y)) {
      resEl.innerHTML = quin + '<span class="ft-calc">\\(' + tex + '\\)</span><span class="ft-mal">No es pot calcular: ' + M.fmt(x) + ' no és del domini d\'aquesta expressió.</span>';
    } else {
      if (nomesNombre && o.r.arbre.t === 'n') tex = 'f(' + M.fmtTeX(x) + ')=' + M.fmtTeX(y);
      else tex += (M.exacte(y) ? '=' : '\\approx ') + M.fmtTeX(y);
      resEl.innerHTML = quin + '<span class="ft-calc">\\(' + tex + '\\)</span>';
    }
    if (bons.length > 1) resEl.innerHTML += '<span class="ft-mal">Compte: x = ' + M.fmt(x) + ' és a més d\'un tros.</span>';
    if (window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise([resEl]).catch(() => {});
    else resEl.querySelectorAll('.ft-calc').forEach(s => { s.textContent = 'f(' + M.fmt(x) + ') = ' + M.fmt(y); });
  }
  xin.addEventListener('input', calcula);

  // ── Moure i fer zoom ───────────────────────────────────────────────────
  function zoom(factor, cx, cy) {
    const { x0, x1, y0, y1 } = vista;
    const mx = cx == null ? (x0 + x1) / 2 : cx, my = cy == null ? (y0 + y1) / 2 : cy;
    vista = { x0: mx + (x0 - mx) * factor, x1: mx + (x1 - mx) * factor, y0: my + (y0 - my) * factor, y1: my + (y1 - my) * factor };
    dibuixa();
  }
  $('ft-mes').addEventListener('click', () => zoom(1 / 1.5));
  $('ft-menys').addEventListener('click', () => zoom(1.5));
  $('ft-ajusta').addEventListener('click', () => { ajustaVista(); dibuixa(); });

  const aValor = e => {
    const r = svg.getBoundingClientRect();
    return { x: vista.x0 + (e.clientX - r.left) / r.width * (vista.x1 - vista.x0),
             y: vista.y1 - (e.clientY - r.top) / r.height * (vista.y1 - vista.y0) };
  };
  svg.addEventListener('wheel', e => {
    e.preventDefault();
    const v = aValor(e);
    zoom(e.deltaY > 0 ? 1.15 : 1 / 1.15, v.x, v.y);
  }, { passive: false });

  let arrossega = null;
  const dits = new Map();
  svg.addEventListener('pointerdown', e => {
    dits.set(e.pointerId, { x: e.clientX, y: e.clientY });
    try { svg.setPointerCapture(e.pointerId); } catch (_) { /* res */ }
    if (dits.size === 1) arrossega = { x: e.clientX, y: e.clientY, v: Object.assign({}, vista), mogut: false };
    else { arrossega = null; }
  });
  svg.addEventListener('pointermove', e => {
    if (!dits.has(e.pointerId)) return;
    const abans = dits.get(e.pointerId);
    dits.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (dits.size === 2) {
      // pessic amb dos dits (iPad)
      const [p, q] = [...dits.values()];
      const altre = [...dits.entries()].find(([id]) => id !== e.pointerId)[1];
      const dAbans = Math.hypot(abans.x - altre.x, abans.y - altre.y), dAra = Math.hypot(p.x - q.x, p.y - q.y);
      if (dAbans > 0 && dAra > 0) {
        const r = svg.getBoundingClientRect();
        const c = aValor({ clientX: (p.x + q.x) / 2, clientY: (p.y + q.y) / 2 });
        zoom(dAbans / dAra, c.x, c.y);
        void r;
      }
      return;
    }
    if (!arrossega) return;
    const dx = e.clientX - arrossega.x, dy = e.clientY - arrossega.y;
    if (Math.hypot(dx, dy) > 4) arrossega.mogut = true;
    if (!arrossega.mogut) return;
    svg.classList.add('movent');
    const r = svg.getBoundingClientRect(), v = arrossega.v;
    const sx = (v.x1 - v.x0) / r.width, sy = (v.y1 - v.y0) / r.height;
    vista = { x0: v.x0 - dx * sx, x1: v.x1 - dx * sx, y0: v.y0 + dy * sy, y1: v.y1 + dy * sy };
    dibuixa();
  });
  const deixa = e => {
    dits.delete(e.pointerId);
    svg.classList.remove('movent');
    if (arrossega && !arrossega.mogut && e.type === 'pointerup') {
      // un clic: tria aquesta x (arrodonida segons el zoom)
      const v = aValor(e);
      const p = pas(vista.x1 - vista.x0, W) / 10;
      const x = Math.round(v.x / p) * p;
      xin.value = M.fmt(x, 6).replace('−', '-');
      calcula();
    }
    arrossega = null;
  };
  svg.addEventListener('pointerup', deixa);
  svg.addEventListener('pointercancel', deixa);

  // ── Copia l'enllaç ─────────────────────────────────────────────────────
  $('ft-enllac').addEventListener('click', async () => {
    const b = $('ft-enllac'), abans = b.innerHTML;
    try { await navigator.clipboard.writeText(location.href); b.textContent = 'Enllaç copiat ✓'; }
    catch (e) { b.textContent = 'Copia l\'adreça del navegador'; }
    setTimeout(() => { b.innerHTML = abans; }, 1800);
  });

  // ── Inici ──────────────────────────────────────────────────────────────
  new ResizeObserver(() => { if (vista) dibuixa(); }).observe(plot);
  const delHash = descodifica(location.hash.slice(1));
  carrega(delHash || EXEMPLES[0].t.map(([expr, a, ai, b, bi]) => ({ expr, a, ai: !!ai, b, bi: !!bi })));
  // MathJax es carrega amb defer: quan estigui a punt, repintem les fórmules
  const quanMJ = setInterval(() => {
    if (window.MathJax && MathJax.typesetPromise) { clearInterval(quanMJ); pintaDefinicio(); calcula(); }
  }, 150);
  setTimeout(() => clearInterval(quanMJ), 15000);
})();
