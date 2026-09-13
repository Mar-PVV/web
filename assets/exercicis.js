/* Exercicis en línia · índex de seccions + filtre per dificultat */
(function () {
  const numTema = parseInt(new URLSearchParams(location.search).get('tema') || '1', 10);
  const cont = document.getElementById('contingut');
  const lateral = document.getElementById('lateral');
  const LLETRES = 'abcdefghijklmnopqrstuvwxyz';
  const NIVELLS = [
    { n: 1, nom: 'Bàsic', var: '--nivell-a' },
    { n: 2, nom: 'Mitjà', var: '--nivell-b' },
    { n: 3, nom: 'Repte', var: '--nivell-c' },
  ];

  const punts = n => {
    if (!n) return '<span class="ex-nivell"></span>';
    const col = ['', 'var(--nivell-a)', 'var(--nivell-b)', 'var(--nivell-c)'][n];
    return '<span class="ex-nivell" title="' + ['', 'bàsic', 'mitjà', 'repte'][n] + '">'
      + '<span style="color:' + col + '">' + '●'.repeat(n) + '</span>'
      + '<span style="color:var(--punt-buit)">' + '●'.repeat(3 - n) + '</span></span>';
  };

  const llista = (items, columnes) =>
    '<ul class="ex-parts' + (columnes && items.length > 3 ? ' columnes' : '') + '">' +
    items.map((p, i) => '<li data-lletra="' + LLETRES[i] + '.">' +
      '<span>' + p + '</span></li>').join('') + '</ul>';

  const ENLLAC_PDF = document.getElementById('baixa');

  fetch('assets/exercicis-batx.json')
    .then(r => { if (!r.ok) throw new Error(); return r.json(); })
    .then(dades => {
      const tema = dades.temes.find(t => t.num === numTema);
      if (!tema) { cont.innerHTML = '<p class="nota">No hi ha exercicis per a aquest tema.</p>'; return; }

      const tots = tema.seccions.reduce((a, s) => a.concat(s.exercicis), []);
      document.title = tema.nom + ' · Activitats · Matemàtiques · INS Pere Vives';
      document.getElementById('titol').textContent = tema.nom;
      document.getElementById('subtitol').textContent =
        tots.length + ' exercicis · obre la solució quan l\'hagis provat';
      ENLLAC_PDF.href = 'pdf/batx/' + tema.carpeta + '/Activitats - ' + tema.nom + '.pdf';

      // ── Contingut ───────────────────────────────────────────────────────
      cont.innerHTML = tema.seccions.map((sec, i) => `
        <section class="seccio-ex" id="sec-${i}">
          <h2>${sec.titol}</h2>
          ${sec.exercicis.map(e => `
            <article class="exercici" data-nivell="${e.nivell}">
              <div class="ex-cap">
                <span class="ex-num">${e.num}.</span>
                ${punts(e.nivell)}
                <div class="ex-enunciat">${e.enunciat}</div>
              </div>
              ${e.parts.length ? llista(e.parts, true) : ''}
              <details class="ex-solucio">
                <summary>Solució</summary>
                <div class="sol-cos">
                  ${e.solucio ? '<div>' + e.solucio + '</div>' : ''}
                  ${e.solucioParts.length ? llista(e.solucioParts, false) : ''}
                </div>
              </details>
            </article>`).join('')}
        </section>`).join('') +
        '<p class="res-filtre" id="res-filtre" hidden>Cap exercici d\'aquesta dificultat en aquest tema.</p>';

      // ── Columna lateral ────────────────────────────────────────────────
      const compta = n => tots.filter(e => e.nivell === n).length;
      lateral.innerHTML = `
        <div class="fila-eines">
          <details class="desplegable" id="menu-sec">
            <summary class="boto">
              <span class="etiq">Secció</span>
              <span class="sec-actual">${tema.seccions[0].titol}</span>
            </summary>
            <ul class="index-sec menu-flotant">
              ${tema.seccions.map((s, i) => `
                <li><a href="#sec-${i}" data-sec="${i}">
                  <span>${s.titol}</span><span class="compta">${s.exercicis.length}</span>
                </a></li>`).join('')}
            </ul>
          </details>
          <span class="separador"></span>
          <span class="etiqueta-grup">Dificultat</span>
          ${NIVELLS.map(v => `
            <button class="filtre" data-nivell="${v.n}" aria-pressed="true">
              <span class="punts"><span style="color:var(${v.var})">${'●'.repeat(v.n)}</span><span style="color:var(--punt-buit)">${'●'.repeat(3 - v.n)}</span></span>
              <span class="nom">${v.nom}</span>
              <span class="compta">${compta(v.n)}</span>
            </button>`).join('')}
        </div>`;

      const menu = document.getElementById('menu-sec');
      const etiquetaSec = lateral.querySelector('.sec-actual');
      lateral.querySelectorAll('.menu-flotant a').forEach(a =>
        a.addEventListener('click', () => { menu.open = false; }));
      document.addEventListener('click', e => {
        if (menu.open && !menu.contains(e.target)) menu.open = false;
      });
      document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && menu.open) menu.open = false;
      });

      // ── Filtre per dificultat ──────────────────────────────────────────
      const actius = new Set([1, 2, 3]);
      const enllacos = [...lateral.querySelectorAll('.index-sec a')];

      function filtra() {
        let visibles = 0;
        tema.seccions.forEach((sec, i) => {
          const seccio = document.getElementById('sec-' + i);
          let n = 0;
          seccio.querySelectorAll('.exercici').forEach(art => {
            const niv = parseInt(art.dataset.nivell, 10);
            const mostra = niv === 0 || actius.has(niv);
            art.hidden = !mostra;
            if (mostra) n++;
          });
          seccio.hidden = n === 0;
          visibles += n;
          enllacos[i].querySelector('.compta').textContent = n;
          enllacos[i].classList.toggle('buida', n === 0);
        });
        document.getElementById('res-filtre').hidden = visibles > 0;
        document.getElementById('subtitol').textContent = visibles === tots.length
          ? tots.length + ' exercicis · obre la solució quan l\'hagis provat'
          : visibles + ' de ' + tots.length + ' exercicis (filtrats per dificultat)';
      }

      lateral.querySelectorAll('.filtre').forEach(b => {
        b.addEventListener('click', () => {
          const n = parseInt(b.dataset.nivell, 10);
          if (actius.has(n)) actius.delete(n); else actius.add(n);
          if (!actius.size) { actius.add(1); actius.add(2); actius.add(3); }
          lateral.querySelectorAll('.filtre').forEach(x =>
            x.setAttribute('aria-pressed', String(actius.has(parseInt(x.dataset.nivell, 10)))));
          filtra();
        });
      });

      // ── Mostra / amaga totes les solucions ─────────────────────────────
      const boto = document.getElementById('totes');
      boto.hidden = false;
      boto.addEventListener('click', () => {
        const d = [...cont.querySelectorAll('.exercici:not([hidden]) details')];
        const obrir = d.some(x => !x.open);
        d.forEach(x => { x.open = obrir; });
        boto.textContent = obrir ? 'Amaga totes les solucions' : 'Mostra totes les solucions';
      });

      // ── Secció activa mentre es fa scroll ──────────────────────────────
      const marca = i => {
        enllacos.forEach((a, k) => a.setAttribute('aria-current', String(k === i)));
        etiquetaSec.textContent = tema.seccions[i].titol;
      };
      marca(0);
      const obs = new IntersectionObserver(entrades => {
        const dins = entrades.filter(e => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (dins) marca(parseInt(dins.target.id.slice(4), 10));
      }, { rootMargin: '-96px 0px -65% 0px' });
      tema.seccions.forEach((s, i) => obs.observe(document.getElementById('sec-' + i)));

      if (window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise([cont]);
    })
    .catch(() => {
      cont.innerHTML = '<p class="nota">No s\'han pogut carregar els exercicis. ' +
        'Pots descarregar-te el PDF amb el botó de dalt.</p>';
    });
})();
