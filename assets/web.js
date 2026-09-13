/* Renderitza la llista de temes d'un curs a partir de assets/dades.js */
(function () {
  const curs = document.body.dataset.curs;
  const dades = (window.DADES && window.DADES.cursos && window.DADES.cursos[curs]) || null;
  const cont = document.getElementById('temes');
  if (!cont) return;

  if (!dades || !dades.temes.length) {
    cont.innerHTML = '<p class="buit">Encara no hi ha material publicat d\'aquest curs.</p>';
    return;
  }

  const ICONA = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" '
    + 'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
    + '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/>'
    + '<path d="M14 3v5h5"/><path d="M9 13h6"/><path d="M9 17h4"/></svg>';

  const ENLINIA = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" '
    + 'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
    + '<rect x="2" y="4" width="20" height="14" rx="2"/><path d="M8 21h8"/>'
    + '<path d="M12 18v3"/><path d="M7 9l2 2-2 2"/><path d="M12 13h5"/></svg>';

  cont.innerHTML = dades.temes.map((tema, i) => {
    const online = tema.enLinia ? `
          <a class="doc doc-destacat" href="exercicis.html?tema=${tema.num}">
            <span class="doc-icona">${ENLINIA}</span>
            <span class="doc-text">
              <span class="doc-nom">Fer-los en línia</span>
              <span class="doc-mida">${tema.enLinia} exercicis amb solució</span>
            </span>
          </a>` : '';
    const docs = tema.docs.length
      ? `<div class="docs">${online}${tema.docs.map(d => `
          <a class="doc" href="${d.fitxer}" target="_blank" rel="noopener">
            <span class="doc-icona">${ICONA}</span>
            <span class="doc-text">
              <span class="doc-nom">${d.tipus}</span>
              <span class="doc-mida">PDF · ${d.mida}</span>
            </span>
          </a>`).join('')}</div>`
      : (online ? `<div class="docs">${online}</div>`
                : '<p class="buit">Material en preparació.</p>');

    const n = tema.docs.length;
    const meta = (n === 0 ? 'en preparació' : n === 1 ? '1 document' : n + ' documents')
      + (tema.enLinia ? ' · exercicis en línia' : '');
    return `
      <section class="tema">
        <button class="tema-cap" aria-expanded="false" aria-controls="tema-${tema.num}">
          <span class="tema-num" style="background:${tema.color}">${tema.num}</span>
          <span class="tema-info">
            <span class="tema-nom">${tema.nom}</span>
            <span class="tema-meta">${meta}</span>
          </span>
          <span class="tema-fletxa" aria-hidden="true">▶</span>
        </button>
        <div class="tema-cos" id="tema-${tema.num}" hidden>${docs}</div>
      </section>`;
  }).join('');

  cont.addEventListener('click', e => {
    const cap = e.target.closest('.tema-cap');
    if (!cap) return;
    const cos = document.getElementById(cap.getAttribute('aria-controls'));
    const obert = cap.getAttribute('aria-expanded') === 'true';
    cap.setAttribute('aria-expanded', String(!obert));
    cap.closest('.tema').classList.toggle('obert', !obert);
    cos.hidden = obert;
  });

  // Primer tema obert d'entrada
  const primer = cont.querySelector('.tema-cap');
  if (primer) primer.click();
})();

/* Data d'actualització al peu */
(function () {
  const el = document.getElementById('actualitzat');
  if (el && window.DADES && window.DADES.generat) el.textContent = window.DADES.generat;
})();
