/* Munta la pàgina d'exercicis en línia a partir de assets/exercicis-batx.json */
(function () {
  const params = new URLSearchParams(location.search);
  const numTema = parseInt(params.get('tema') || '1', 10);
  const cont = document.getElementById('contingut');
  const LLETRES = 'abcdefghijklmnopqrstuvwxyz';

  const punts = n => {
    if (!n) return '';
    const col = ['', 'var(--nivell-a)', 'var(--nivell-b)', 'var(--nivell-c)'][n];
    const buit = '<span style="color:var(--punt-buit)">●</span>';
    return '<span class="ex-nivell" title="' +
      ['', 'bàsic', 'mitjà', 'repte'][n] + '">' +
      '<span style="color:' + col + '">' + '●'.repeat(n) + '</span>' +
      buit.repeat(3 - n) + '</span>';
  };

  const llista = (items, columnes) =>
    '<ul class="ex-parts' + (columnes && items.length > 3 ? ' columnes' : '') + '">' +
    items.map((p, i) => '<li data-lletra="' + LLETRES[i] + '.">' +
      '<span>' + p + '</span></li>').join('') + '</ul>';

  fetch('assets/exercicis-batx.json')
    .then(r => { if (!r.ok) throw new Error('no s\'ha pogut carregar'); return r.json(); })
    .then(dades => {
      const tema = dades.temes.find(t => t.num === numTema);
      if (!tema) { cont.innerHTML = '<p class="nota">No hi ha exercicis per a aquest tema.</p>'; return; }

      document.title = tema.nom + ' · Activitats · Matemàtiques · INS Pere Vives';
      document.getElementById('titol').textContent = tema.nom;
      const total = tema.seccions.reduce((s, x) => s + x.exercicis.length, 0);
      document.getElementById('subtitol').textContent =
        total + ' exercicis · obre la solució quan l\'hagis provat';

      const pdf = 'pdf/batx/' + tema.carpeta + '/Activitats - ' + tema.nom + '.pdf';
      document.getElementById('baixa').href = pdf;

      cont.innerHTML = tema.seccions.map(sec => `
        <section class="seccio-ex">
          <h2>${sec.titol}</h2>
          ${sec.exercicis.map(e => `
            <article class="exercici">
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
        </section>`).join('');

      // Mostra / amaga totes les solucions
      const boto = document.getElementById('totes');
      boto.hidden = false;
      boto.addEventListener('click', () => {
        const detalls = [...cont.querySelectorAll('details')];
        const obrir = detalls.some(d => !d.open);
        detalls.forEach(d => { d.open = obrir; });
        boto.textContent = obrir ? 'Amaga totes les solucions' : 'Mostra totes les solucions';
      });

      if (window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise([cont]);
    })
    .catch(() => {
      cont.innerHTML = '<p class="nota">No s\'han pogut carregar els exercicis. ' +
        'Pots descarregar-te el PDF amb el botó de dalt.</p>';
    });
})();
