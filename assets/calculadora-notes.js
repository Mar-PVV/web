/* Calculadora de notes de 1r de batxillerat.
   Tot es calcula al navegador: no es desa ni s'envia res.
   Els criteris d'avaluació són aquí dalt: si canvien, només cal tocar CRITERIS. */
(function () {
  'use strict';

  const CRITERIS = {
    pesExamens: 0.9,          // part de la nota del trimestre que són els exàmens
    pesTests: 0.1,            // part que són els tests (mitjana si n'hi ha dos)
    examensInicials: 2,       // quantes caselles d'examen surten al principi
    maxExamens: 6,
    pesosTrimestres: [1, 1, 1],     // nota final: mitjana ponderada dels trimestres
    finalAmbArrodonides: false      // la final es fa amb les notes de trimestre sense arrodonir
  };

  const NOMS = ['1r trimestre', '2n trimestre', '3r trimestre'];
  const cont = document.getElementById('trimestres');
  if (!cont) return;

  // ── Utilitats ───────────────────────────────────────────────────────────
  const pct = x => Math.round(x * 100) + ' %';
  // "sense arrodonir": es talla a dues xifres decimals, no s'arrodoneix
  const talla = x => Math.floor(x * 100 + 1e-9) / 100;
  const mostra = x => talla(x).toFixed(2).replace('.', ',');
  const arrodoneix = x => Math.floor(x + 0.5 + 1e-9);
  const mitjana = v => v.reduce((a, b) => a + b, 0) / v.length;

  function llegeix(input) {
    const t = input.value.trim().replace(',', '.');
    if (t === '') { input.classList.remove('cn-malament'); return null; }
    const x = Number(t);
    const bo = /^\d{1,2}(\.\d*)?$|^\.\d+$/.test(t) && x >= 0 && x <= 10;
    input.classList.toggle('cn-malament', !bo);
    return bo ? x : NaN;
  }

  // ── Construcció de les targetes ─────────────────────────────────────────
  function filaNota(etiqueta, classe) {
    const id = 'n' + Math.random().toString(36).slice(2, 9);
    return `<div class="cn-fila ${classe}">
      <label for="${id}">${etiqueta}</label>
      <input id="${id}" type="text" inputmode="decimal" autocomplete="off" placeholder="—" aria-label="${etiqueta}">
    </div>`;
  }

  NOMS.forEach((nom, t) => {
    const art = document.createElement('section');
    art.className = 'cn-trim';
    art.dataset.t = t;
    art.innerHTML = `
      <h2 class="cn-trim-titol"><span class="cn-trim-num">${t + 1}</span>${nom}</h2>
      <div class="cn-bloc">
        <div class="cn-bloc-cap"><span>Exàmens</span><span class="cn-pes">${pct(CRITERIS.pesExamens)}</span></div>
        <div class="cn-examens"></div>
        <div class="cn-examens-botons">
          <button type="button" class="cn-mes">+ Afegeix un examen</button>
          <button type="button" class="cn-menys">− Treu-ne un</button>
        </div>
      </div>
      <div class="cn-bloc">
        <div class="cn-bloc-cap"><span>Tests</span><span class="cn-pes">${pct(CRITERIS.pesTests)}</span></div>
        <div class="cn-tria" role="radiogroup" aria-label="Quants tests hi ha aquest trimestre">
          <button type="button" role="radio" data-n="1" aria-checked="true">1 test</button>
          <button type="button" role="radio" data-n="2" aria-checked="false">2 tests</button>
        </div>
        <div class="cn-tests">${filaNota('Test 1', 'cn-test')}${filaNota('Test 2', 'cn-test cn-test2')}</div>
      </div>
      <div class="cn-resultat" aria-live="polite">
        <div class="cn-res-linia"><span>Sense arrodonir</span><strong class="cn-exacta">—</strong></div>
        <div class="cn-res-linia cn-res-gran"><span>Arrodonida</span><strong class="cn-arrodonida">—</strong></div>
        <p class="cn-avis" hidden></p>
      </div>`;
    cont.appendChild(art);

    const llista = art.querySelector('.cn-examens');
    const afegeix = () => {
      const n = llista.children.length + 1;
      llista.insertAdjacentHTML('beforeend', filaNota('Examen ' + n, 'cn-examen'));
    };
    for (let i = 0; i < CRITERIS.examensInicials; i++) afegeix();
    art.dataset.tests = '1';

    art.querySelector('.cn-mes').addEventListener('click', () => {
      if (llista.children.length < CRITERIS.maxExamens) afegeix();
      llista.lastElementChild.querySelector('input').focus();
      calcula();
    });
    art.querySelector('.cn-menys').addEventListener('click', () => {
      if (llista.children.length > 1) llista.lastElementChild.remove();
      calcula();
    });
    art.querySelectorAll('.cn-tria button').forEach(b => b.addEventListener('click', () => {
      art.dataset.tests = b.dataset.n;
      art.querySelectorAll('.cn-tria button').forEach(c =>
        c.setAttribute('aria-checked', String(c === b)));
      calcula();
    }));
  });

  cont.addEventListener('input', calcula);

  document.getElementById('buida').addEventListener('click', () => {
    document.querySelectorAll('.cn-trim input, .cn-final input').forEach(i => { i.value = ''; });
    calcula();
  });

  // ── Càlcul ──────────────────────────────────────────────────────────────
  function notaTrimestre(art) {
    const examens = [...art.querySelectorAll('.cn-examen input')].map(llegeix);
    const dosTests = art.dataset.tests === '2';
    art.querySelector('.cn-test2').hidden = !dosTests;
    const tests = [...art.querySelectorAll('.cn-test input')]
      .slice(0, dosTests ? 2 : 1).map(llegeix);

    const totes = examens.concat(tests);
    if (totes.some(Number.isNaN)) return { error: 'Hi ha alguna nota mal escrita: han de ser números del 0 al 10.' };

    const ex = examens.filter(x => x !== null);
    const te = tests.filter(x => x !== null);
    if (!ex.length && !te.length) return { buit: true };

    const falten = [];
    if (ex.length < examens.length) falten.push(examens.length - ex.length === 1 ? 'un examen' : 'algun examen');
    if (te.length < tests.length) falten.push(tests.length - te.length === 1 ? 'un test' : 'els tests');

    // Si falta una part sencera, es calcula amb el que hi ha (nota provisional)
    let nota;
    if (ex.length && te.length) nota = CRITERIS.pesExamens * mitjana(ex) + CRITERIS.pesTests * mitjana(te);
    else nota = ex.length ? mitjana(ex) : mitjana(te);

    return { nota, provisional: falten.length > 0, falten };
  }

  function calcula() {
    const notes = [];
    document.querySelectorAll('.cn-trim').forEach(art => {
      const r = notaTrimestre(art);
      const ex = art.querySelector('.cn-exacta');
      const ar = art.querySelector('.cn-arrodonida');
      const avis = art.querySelector('.cn-avis');
      art.querySelector('.cn-menys').disabled = art.querySelectorAll('.cn-examen').length <= 1;
      art.querySelector('.cn-mes').disabled = art.querySelectorAll('.cn-examen').length >= CRITERIS.maxExamens;
      avis.hidden = true;
      art.classList.toggle('cn-amb-nota', !!(r.nota !== undefined));
      if (r.error) {
        ex.textContent = ar.textContent = '—';
        avis.textContent = r.error; avis.hidden = false; avis.classList.add('cn-avis-error');
        return;
      }
      avis.classList.remove('cn-avis-error');
      if (r.buit) { ex.textContent = ar.textContent = '—'; return; }
      ex.textContent = mostra(r.nota);
      ar.textContent = arrodoneix(r.nota);
      notes[art.dataset.t] = r.nota;
      if (r.provisional) {
        avis.textContent = 'Provisional: encara falta ' + r.falten.join(' i ') + '.';
        avis.hidden = false;
      }
    });
    calculaFinal(notes);
  }

  function calculaFinal(notes) {
    const exacta = document.getElementById('final-exacta');
    const arrod = document.getElementById('final-arrodonida');
    const avis = document.getElementById('final-avis');
    const p = CRITERIS.pesosTrimestres;
    let suma = 0, pes = 0, quants = 0;
    for (let t = 0; t < 3; t++) {
      if (notes[t] === undefined) continue;
      const n = CRITERIS.finalAmbArrodonides ? arrodoneix(notes[t]) : notes[t];
      suma += p[t] * n; pes += p[t]; quants++;
    }
    avis.hidden = true;
    if (!quants) { exacta.textContent = arrod.textContent = '—'; return; }
    const f = suma / pes;
    exacta.textContent = mostra(f);
    arrod.textContent = arrodoneix(f);
    if (quants < 3) {
      avis.textContent = 'Provisional: només hi ha ' + (quants === 1 ? 'un trimestre' : 'dos trimestres')
        + ' amb nota. Quan hi siguin tots tres, aquesta serà la nota final.';
      avis.hidden = false;
    }
  }

  // ── Text que explica com es calcula ─────────────────────────────────────
  (function () {
    const p = CRITERIS.pesosTrimestres;
    const iguals = p.every(x => x === p[0]);
    const com = iguals
      ? 'És la mitjana dels tres trimestres'
      : 'Es fa amb els tres trimestres: ' + p.map((x, i) => NOMS[i] + ' ' + pct(x / p.reduce((a, b) => a + b, 0))).join(', ');
    document.getElementById('final-explica').textContent = com
      + (CRITERIS.finalAmbArrodonides ? ', amb les notes arrodonides.' : ', amb les notes sense arrodonir.')
      + ' Cada trimestre: exàmens ' + pct(CRITERIS.pesExamens) + ' i tests ' + pct(CRITERIS.pesTests) + '.';
  })();

  calcula();
})();
