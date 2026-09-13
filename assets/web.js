/* Selector de temes d'un curs, a partir de assets/dades.js */
(function () {
  const curs = document.body.dataset.curs;
  const dades = (window.DADES && window.DADES.cursos && window.DADES.cursos[curs]) || null;
  const cont = document.getElementById('temes');
  if (!cont) return;

  if (!dades || !dades.temes.length) {
    cont.innerHTML = '<p class="buit">Encara no hi ha material publicat d\'aquest curs.</p>';
    return;
  }

  const FLETXA = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" '
    + 'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
    + '<path d="M5 12h14"/><path d="M13 6l6 6-6 6"/></svg>';

  cont.innerHTML = dades.temes.map(tema => {
    const obert = !tema.properament && (tema.enLinia || tema.docs.length);
    const peu = obert
      ? `<span class="tt-peu"><span>${tema.enLinia ? tema.enLinia + ' exercicis' : tema.docs.length + ' documents'}</span>${FLETXA}</span>`
      : '<span class="tt-peu tt-aviat">Properament</span>';
    const cos = `
      <span class="tt-banda" style="background:${tema.color}"></span>
      <span class="tt-cos">
        <span class="tt-num" style="background:${tema.color}">${tema.num}</span>
        <span class="tt-nom">${tema.nom}</span>
        ${peu}
      </span>`;
    return obert
      ? `<a class="tema-targeta" href="exercicis.html?tema=${tema.num}">${cos}</a>`
      : `<div class="tema-targeta tt-inactiva" aria-disabled="true">${cos}</div>`;
  }).join('');

})();

(function () {
  const el = document.getElementById('actualitzat');
  if (el && window.DADES && window.DADES.generat) el.textContent = window.DADES.generat;
})();
