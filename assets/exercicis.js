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

  // extra(i) afegeix contingut al final de l'apartat i (p. ex. el botó del vídeo)
  const llista = (items, columnes, extra) =>
    '<ul class="ex-parts' + (columnes && items.length > 3 ? ' columnes' : '') + '">' +
    items.map((p, i) => '<li data-lletra="' + LLETRES[i] + '.">' +
      '<span>' + p + (extra ? extra(i) : '') + '</span></li>').join('') + '</ul>';

  // ── Vídeos de les solucions ─────────────────────────────────────────────
  // Surten d'assets/videos-batx.csv (s'edita a mà): tema, exercici, apartat
  // (lletra, o buit si és tot l'exercici), vídeo i segon on comença.
  const ICONA_PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z" fill="currentColor"/></svg>';
  const segons = s => (s || '0').split(':').reduce((a, x) => a * 60 + (parseFloat(x) || 0), 0);
  const videos = fetch('assets/videos-batx.csv?v=0')
    .then(r => r.ok ? r.text() : '')
    .catch(() => '')
    .then(txt => {
      const m = {};
      txt.split('\n').slice(1).forEach(l => {
        const c = l.split(',').map(x => x.trim());
        if (c.length < 4 || parseInt(c[0], 10) !== numTema || !c[3]) return;
        m[c[1] + (c[2] || '').toLowerCase()] = { src: c[3], inici: segons(c[4]) };
      });
      return m;
    });

  const botoVideo = (v, apartat) => v
    ? '<button type="button" class="boto-video" data-src="' + v.src + '" data-inici="' + v.inici + '"' +
      ' data-titol="' + apartat + '">' + ICONA_PLAY + 'Mira-ho en vídeo</button>'
    : '';

  // Finestra del vídeo: un <dialog> amb botó de tancar (a l'app de l'iPad no hi ha barra del navegador)
  function obreVideo(src, inici, titol) {
    let dlg = document.getElementById('finestra-video');
    if (!dlg) {
      dlg = document.createElement('dialog');
      dlg.id = 'finestra-video';
      dlg.className = 'finestra-video';
      dlg.innerHTML = '<div class="fv-cap"><span class="fv-titol"></span>' +
        '<button type="button" class="fv-tanca" aria-label="Tanca el vídeo">✕</button></div>' +
        '<div class="fv-cos"></div>';
      document.body.appendChild(dlg);
      const tanca = () => dlg.close();
      dlg.querySelector('.fv-tanca').addEventListener('click', tanca);
      dlg.addEventListener('click', e => { if (e.target === dlg) tanca(); });
      dlg.addEventListener('close', () => { dlg.querySelector('.fv-cos').innerHTML = ''; });
    }
    dlg.querySelector('.fv-titol').textContent = titol;
    const cos = dlg.querySelector('.fv-cos');
    const yt = src.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]{11})/);
    if (yt) {
      cos.innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + yt[1] +
        '?autoplay=1&rel=0&start=' + Math.floor(inici) + '" allow="autoplay; fullscreen" allowfullscreen></iframe>';
    } else {
      const v = document.createElement('video');
      v.controls = true; v.playsInline = true; v.preload = 'auto';
      v.src = src + '#t=' + inici;
      v.addEventListener('loadedmetadata', () => {
        if (Math.abs(v.currentTime - inici) > 1) v.currentTime = inici;
        v.play().catch(() => {});
      }, { once: true });
      cos.appendChild(v);
    }
    dlg.showModal();
  }
  document.addEventListener('click', e => {
    const b = e.target.closest('.boto-video');
    if (b) obreVideo(b.dataset.src, parseFloat(b.dataset.inici) || 0, b.dataset.titol);
  });

  const ENLLAC_PDF = document.getElementById('baixa');

  Promise.all([
    fetch('assets/exercicis-batx.json?v=0cc7f188')
      .then(r => { if (!r.ok) throw new Error(); return r.json(); }),
    videos,
  ])
    .then(([dades, vids]) => {
      const tema = dades.temes.find(t => t.num === numTema);
      if (!tema) {
        document.getElementById('titol').textContent = 'Properament';
        document.getElementById('subtitol').textContent =
          'Aquest tema encara s\'està revisant.';
        document.querySelector('.barra-ex').hidden = true;
        document.title = 'Properament · Matemàtiques · INS Pere Vives';
        cont.innerHTML = '<p class="nota">Les activitats d\'aquest tema encara no estan ' +
          'publicades. <a href="batx.html">Torna als temes</a> per veure què hi ha disponible.</p>';
        return;
      }

      const tots = tema.seccions.reduce((a, s) => a.concat(s.exercicis), []);
      document.title = tema.nom + ' · Activitats · Matemàtiques · INS Pere Vives';
      document.getElementById('titol').textContent = tema.nom;
      document.getElementById('subtitol').textContent =
        tots.length + ' exercicis · Obre la solució quan l\'hagis provat';
      ENLLAC_PDF.href = 'pdf/batx/' + tema.carpeta + '/Activitats - ' + tema.nom + '.pdf';

      // El botó del test només surt si el tema té prou preguntes al CSV.
      // Així, per obrir-lo a un tema nou només cal afegir-hi files.
      const botoTest = document.getElementById('test');
      if (botoTest) {
        fetch('assets/preguntes-limits.csv?v=57b1b8a9')
          .then(r => r.ok ? r.text() : Promise.reject())
          .then(txt => {
            const files = txt.split('\n').slice(1)
              .filter(l => l.trim() && parseInt(l, 10) === numTema
                        && !l.trim().endsWith(',0'));
            if (files.length >= 4) {
              botoTest.href = 'test-limits.html?tema=' + numTema;
              botoTest.hidden = false;
            }
          })
          .catch(() => {});
      }

      // ── Contingut ───────────────────────────────────────────────────────
      cont.innerHTML = tema.seccions.map((sec, i) => `
        <section class="seccio-ex" id="sec-${i}">
          <h2>${sec.titol}</h2>
          ${sec.exercicis.map(e => {
            const titolEx = 'Tema ' + numTema + ' · Exercici ' + e.num;
            const vTot = vids[String(e.num)];
            const vPart = i => botoVideo(vids[e.num + LLETRES[i]], titolEx + LLETRES[i]);
            const teVideo = vTot || e.solucioParts.some((_, i) => vids[e.num + LLETRES[i]]);
            return `
            <article class="exercici" data-nivell="${e.nivell}">
              <div class="ex-cap">
                <span class="ex-num">${e.num}.</span>
                ${punts(e.nivell)}
                <div class="ex-enunciat">${e.enunciat}</div>
                ${teVideo ? '<span class="ex-te-video" title="La solució té vídeo">' + ICONA_PLAY + 'Vídeo</span>' : ''}
              </div>
              ${e.parts.length ? llista(e.parts, true) : ''}
              <details class="ex-solucio">
                <summary>Solució</summary>
                <div class="sol-cos">
                  ${e.solucio ? '<div>' + e.solucio + '</div>' : ''}
                  ${e.solucioParts.length ? llista(e.solucioParts, false, vPart) : ''}
                  ${botoVideo(vTot, titolEx)}
                </div>
              </details>
            </article>`; }).join('')}
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

      // La capçalera canvia d'alçada segons la mida de pantalla: mesurem-la
      // perquè la fila s'enganxi just a sota i les àncores no quedin tapades.
      const fila = lateral.querySelector('.fila-eines');
      const capcalera = document.querySelector('.capcalera');
      let altCapcalera = 70;

      function mesura() {
        altCapcalera = capcalera ? capcalera.offsetHeight : 70;
        const arrel = document.documentElement.style;
        arrel.setProperty('--alt-capcalera', altCapcalera + 'px');
        arrel.setProperty('--alt-ancoratge', (altCapcalera + fila.offsetHeight + 14) + 'px');
      }
      function ombra() {
        fila.classList.toggle('enganxada',
          lateral.getBoundingClientRect().top <= altCapcalera + 1);
      }
      mesura(); ombra();
      window.addEventListener('resize', () => { mesura(); ombra(); });
      window.addEventListener('scroll', ombra, { passive: true });

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
