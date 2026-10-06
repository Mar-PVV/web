/* ───────────────────────────────────────────────────────────────────────────
   Test ràpid de límits
   Les preguntes surten del fitxer preguntes-limits.csv (en aquesta mateixa
   carpeta). Per afegir-ne o canviar-ne, edita el CSV: aquest fitxer no s'ha de tocar.

   Columnes del CSV:
     tema       número de tema (1 = Successions i límits)
     nivell     1 bàsic · 2 mitjà · 3 repte
     pregunta   el text, amb les matemàtiques entre dòlars: $\Lim\dfrac{n+1}{n}$
     opcions    les opcions separades per |  ·  si es deixa buit, l'alumne
                escriu la resposta en comptes de triar
     resposta   l'opció bona (ha de coincidir amb una de les opcions), o bé,
                si no hi ha opcions, les respostes que s'accepten separades per |
     explicacio opcional: una línia que surt després de respondre
   ─────────────────────────────────────────────────────────────────────────── */
(function () {
  const CSV = 'assets/preguntes-limits.csv?v=bf47d220';
  const PER_TANDA = 10;
  const tema = parseInt(new URLSearchParams(location.search).get('tema') || '1', 10);

  const $ = id => document.getElementById(id);
  const pantalles = { inici: $('inici'), joc: $('joc'), final: $('final') };
  const mostra = nom => Object.keys(pantalles).forEach(k => pantalles[k].hidden = k !== nom);

  let totes = [], tanda = [], i = 0, encerts = 0, fallades = [], nivell = 0, respost = false;

  // ── Lectura del CSV ──────────────────────────────────────────────────────
  function llegeixCSV(text) {
    text = text.replace(/^﻿/, '');
    const tall = text.indexOf('\n');
    const cap = tall < 0 ? text : text.slice(0, tall);
    const sep = [',', ';', '\t'].reduce((a, c) =>
      cap.split(c).length > cap.split(a).length ? c : a, ',');
    const files = [];
    let camp = '', fila = [], dins = false;
    for (let k = 0; k < text.length; k++) {
      const c = text[k];
      if (dins) {
        if (c === '"') { if (text[k + 1] === '"') { camp += '"'; k++; } else dins = false; }
        else camp += c;
      } else if (c === '"') dins = true;
      else if (c === sep) { fila.push(camp); camp = ''; }
      else if (c === '\n') { fila.push(camp); files.push(fila); fila = []; camp = ''; }
      else if (c !== '\r') camp += c;
    }
    if (camp !== '' || fila.length) { fila.push(camp); files.push(fila); }
    if (!files.length) return [];
    const noms = files[0].map(x => x.trim().toLowerCase());
    return files.slice(1)
      .filter(f => f.some(x => x.trim() !== ''))
      .map(f => {
        const o = {};
        noms.forEach((n, j) => o[n] = (f[j] || '').trim());
        return o;
      });
  }

  // ── Comparació de respostes escrites ─────────────────────────────────────
  function clau(s) {
    let t = String(s).toLowerCase().trim();
    // fora accents: així «no té límit» i «no te limit» valen igual
    t = t.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    t = t.replace(/\$/g, '').replace(/\\left|\\right/g, '');
    t = t.replace(/\\[dt]?frac\s*\{([^{}]*)\}\s*\{([^{}]*)\}/g, '$1/$2');
    t = t.replace(/[−–—]/g, '-');
    t = t.replace(/\\infty/g, 'inf').replace(/∞/g, 'inf').replace(/infinit\w*/g, 'inf');
    t = t.replace(/\s| /g, '').replace(/,/g, '.').replace(/^\+/, '');
    // «no existeix», «no té límit», «no hi ha límit», «oscil·la»… tot val igual
    if ((/^no/.test(t) && /(existeix|limit)$/.test(t)) || /^oscil(·|l)?la$/.test(t)) {
      return 'noexisteix';
    }
    return t;
  }
  function valor(t) {
    if (/^-?\d+(\.\d+)?$/.test(t)) return parseFloat(t);
    const m = t.match(/^(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)$/);
    if (m && parseFloat(m[2]) !== 0) return parseFloat(m[1]) / parseFloat(m[2]);
    return null;
  }
  function encerta(dit, acceptades) {
    const k = clau(dit), v = valor(k);
    return acceptades.some(a => {
      const ka = clau(a);
      if (k === ka) return true;
      const va = valor(ka);
      return v !== null && va !== null && Math.abs(v - va) < 1e-9;
    });
  }

  // ── Utilitats ────────────────────────────────────────────────────────────
  const barreja = a => { a = a.slice();
    for (let k = a.length - 1; k > 0; k--) {
      const j = Math.floor(Math.random() * (k + 1)); [a[k], a[j]] = [a[j], a[k]];
    } return a; };
  const escapa = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const pinta = el => { if (window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise([el]); };

  function recorda(clauLS, valorNou) {
    try {
      if (valorNou === undefined) return parseInt(localStorage.getItem(clauLS) || '', 10);
      localStorage.setItem(clauLS, String(valorNou));
    } catch (e) { /* navegació privada: tant se val */ }
  }

  // ── Pantalla d'inici ─────────────────────────────────────────────────────
  const NIVELLS = [
    { n: 0, nom: 'Tots' },
    { n: 1, nom: 'Bàsic', col: 'var(--nivell-a)' },
    { n: 2, nom: 'Mitjà', col: 'var(--nivell-b)' },
    { n: 3, nom: 'Repte', col: 'var(--nivell-c)' },
  ];

  function pintaInici() {
    $('tria-nivell').innerHTML = NIVELLS.map(x => {
      const quants = totes.filter(p => !x.n || p.nivell === x.n).length;
      const punts = x.n
        ? '<span style="color:' + x.col + '">' + '●'.repeat(x.n) + '</span>'
          + '<span style="color:var(--punt-buit)">' + '●'.repeat(3 - x.n) + '</span> '
        : '';
      return '<button class="test-nivell-boto" data-n="' + x.n + '"'
        + (quants < 4 ? ' disabled' : '') + '>'
        + punts + x.nom + ' <span class="compta">' + quants + '</span></button>';
    }).join('');
    marcaNivell();
    $('tria-nivell').onclick = ev => {
      const b = ev.target.closest('[data-n]');
      if (!b || b.disabled) return;
      nivell = parseInt(b.dataset.n, 10);
      marcaNivell();
    };
    const millor = recorda(clauMarca());
    $('marca').hidden = !millor;
    if (millor) $('marca').textContent = 'La teva millor marca: ' + millor + ' de ' + PER_TANDA + '.';
  }
  function marcaNivell() {
    [...$('tria-nivell').children].forEach(b =>
      b.classList.toggle('actiu', parseInt(b.dataset.n, 10) === nivell));
  }
  const clauMarca = () => 'test-limits-t' + tema + '-n' + nivell;

  // ── Joc ──────────────────────────────────────────────────────────────────
  function comenca() {
    const pool = totes.filter(p => !nivell || p.nivell === nivell);
    tanda = barreja(pool).slice(0, Math.min(PER_TANDA, pool.length));
    i = 0; encerts = 0; fallades = [];
    mostra('joc');
    pintaPregunta();
  }

  function pintaPregunta() {
    const p = tanda[i];
    respost = false;
    $('compta').textContent = (i + 1) + ' de ' + tanda.length;
    $('barra').style.width = (i / tanda.length * 100) + '%';
    $('nivell-preg').innerHTML = NIVELLS[p.nivell]
      ? '<span style="color:' + NIVELLS[p.nivell].col + '">' + '●'.repeat(p.nivell) + '</span>'
        + '<span style="color:var(--punt-buit)">' + '●'.repeat(3 - p.nivell) + '</span> '
        + NIVELLS[p.nivell].nom
      : '';
    $('pregunta').innerHTML = escapa(p.pregunta);
    $('resultat').hidden = true;
    $('resultat').className = 'test-resultat';
    $('comprova').hidden = false;
    $('seguent').hidden = true;

    if (p.opcions.length) {
      $('lliure').hidden = true;
      $('opcions').hidden = false;
      $('opcions').innerHTML = p.barrejades.map((o, k) =>
        '<button class="test-opcio" data-k="' + k + '">'
        + '<span class="test-lletra">' + 'abcd'[k] + '</span>'
        + '<span class="test-valor">' + escapa(o) + '</span></button>').join('');
    } else {
      $('opcions').hidden = true;
      $('lliure').hidden = false;
      $('resposta').value = '';
      $('resposta').className = '';
    }
    pinta($('joc'));
    if (!p.opcions.length) setTimeout(() => $('resposta').focus(), 50);
  }

  let triada = null;
  $('opcions').onclick = ev => {
    const b = ev.target.closest('[data-k]');
    if (!b || respost) return;
    triada = parseInt(b.dataset.k, 10);
    [...$('opcions').children].forEach(x => x.classList.toggle('triada', x === b));
  };

  function comprova() {
    const p = tanda[i];
    let dit, be;
    if (p.opcions.length) {
      if (triada === null) { $('opcions').classList.add('cal-triar');
        setTimeout(() => $('opcions').classList.remove('cal-triar'), 600); return; }
      dit = p.barrejades[triada];
      be = clau(dit) === clau(p.resposta);
      [...$('opcions').children].forEach((x, k) => {
        if (clau(p.barrejades[k]) === clau(p.resposta)) x.classList.add('bona');
        else if (k === triada) x.classList.add('malament');
        x.classList.remove('triada');
      });
    } else {
      dit = $('resposta').value;
      if (!dit.trim()) { $('resposta').focus(); return; }
      be = encerta(dit, p.accepta);
      $('resposta').className = be ? 'bona' : 'malament';
    }
    respost = true; triada = null;
    if (be) encerts++; else fallades.push(p);

    const sol = p.opcions.length ? p.resposta : p.accepta[0];
    $('resultat').className = 'test-resultat ' + (be ? 'es-bona' : 'es-malament');
    $('resultat').innerHTML =
      '<p class="test-veredicte">' + (be ? '✓ Molt bé' : '✗ No hi és') + '</p>'
      + (be ? '' : '<p>La resposta és ' + escapa(sol) + '.</p>')
      + (p.explicacio ? '<p class="test-explica">' + escapa(p.explicacio) + '</p>' : '');
    $('resultat').hidden = false;
    $('comprova').hidden = true;
    $('seguent').hidden = false;
    $('seguent').textContent = i + 1 < tanda.length ? 'Següent' : 'Veure el resultat';
    $('barra').style.width = ((i + 1) / tanda.length * 100) + '%';
    pinta($('resultat'));
    $('seguent').focus();
  }

  function seguent() {
    i++;
    if (i < tanda.length) pintaPregunta();
    else acaba();
  }

  function acaba() {
    mostra('final');
    $('nota').innerHTML = '<strong>' + encerts + '</strong> de ' + tanda.length;
    const p = encerts / tanda.length;
    $('missatge').textContent =
      p === 1 ? 'Rodó. Totes bé.'
      : p >= 0.8 ? 'Molt bé: només se te n\'ha escapat alguna.'
      : p >= 0.5 ? 'Vas pel bon camí. Mira les que has fallat i torna-hi.'
      : 'Encara costa. Repassa les activitats del tema i torna a provar-ho.';
    const millor = recorda(clauMarca());
    if (!(millor >= 0) || encerts > millor) recorda(clauMarca(), encerts);

    $('repas').innerHTML = !fallades.length ? '' :
      '<h2 class="test-repas-titol">Per repassar</h2>'
      + fallades.map(p => '<div class="test-caixa test-repas">'
        + '<div class="test-pregunta petita">' + escapa(p.pregunta) + '</div>'
        + '<p class="test-sol">Resposta: <strong>'
        + escapa(p.opcions.length ? p.resposta : p.accepta[0]) + '</strong></p>'
        + (p.explicacio ? '<p class="test-explica">' + escapa(p.explicacio) + '</p>' : '')
        + '</div>').join('');
    pinta($('final'));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ── Engegada ─────────────────────────────────────────────────────────────
  $('comprova').onclick = comprova;
  $('seguent').onclick = seguent;
  $('comenca').onclick = comenca;
  $('altra').onclick = () => { mostra('inici'); pintaInici(); comenca(); };
  document.addEventListener('keydown', ev => {
    if (ev.key !== 'Enter' || pantalles.joc.hidden) return;
    ev.preventDefault();
    (respost ? seguent : comprova)();
  });

  fetch(CSV)
    .then(r => { if (!r.ok) throw new Error(); return r.text(); })
    .then(text => {
      totes = llegeixCSV(text)
        .filter(f => parseInt(f.tema, 10) === tema && f.pregunta)
        .map(f => {
          const opcions = f.opcions ? f.opcions.split('|').map(x => x.trim()).filter(Boolean) : [];
          return {
            nivell: parseInt(f.nivell, 10) || 1,
            pregunta: f.pregunta,
            opcions: opcions,
            barrejades: barreja(opcions),
            resposta: f.resposta,
            accepta: f.resposta.split('|').map(x => x.trim()).filter(Boolean),
            explicacio: f.explicacio || '',
          };
        });
      if (totes.length < 4) throw new Error('poques preguntes');
      $('subtitol').textContent = totes.length
        + ' preguntes al sac · cada tanda en treu ' + PER_TANDA + ' a l\'atzar';
      pintaInici();
      mostra('inici');
    })
    .catch(() => {
      $('subtitol').textContent = 'Aquest test encara no està disponible.';
      $('inici').hidden = false;
      $('inici').innerHTML = '<p class="nota">No he pogut carregar les preguntes. '
        + '<a href="exercicis.html?tema=' + tema + '">Torna a les activitats</a>.</p>';
    });
})();
