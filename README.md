# Web · Matemàtiques · INS Pere Vives

Repositori **públic** que publica la GitHub Page amb els materials de matemàtiques
de 3r d'ESO i 1r de batxillerat.

**Autoria:** Mar Vidal Segura · Departament de Matemàtiques · INS Pere Vives
**Llicència del material:** CC BY-NC-SA 4.0

---

## Què és

Portada → tries curs → tries tema → fas les activitats en línia, amb les solucions
desplegables, i te'n pots descarregar el PDF.

**Ara mateix només es publica el tema 1 de batxillerat.** 3r d'ESO surt com a
*properament* (l'alumnat té el material al Classroom) i els altres temes de
batxillerat també, fins que estiguin revisats. **Els apunts no es publiquen**:
l'alumnat els copia a classe.

---

## Per què existeix aquest repositori

Els repositoris de material (`3ESO_26-27` i `1BTX_26-27`) són **privats**: hi ha
els `.tex`, els exàmens i tot el material de treball. Una GitHub Page **només pot
servir fitxers del seu propi repositori**, així que no pot enllaçar res d'un repo
privat (els visitants rebrien un 404).

Per això existeix aquest repositori públic, que conté **només els PDF que han de
ser públics**. L'script [`publica.sh`](publica.sh) els hi copia.

```
   3ESO_26-27 (privat)  ─┐
                         ├─→  publica.sh  ─→  web/  ─→  GitHub Page (pública)
   1BTX_26-27 (privat)  ─┘
```

---

## Estructura

```
web/
├── index.html          portada · tria de curs
├── batx.html           selector de temes de 1r de batxillerat
├── exercicis.html      activitats d'un tema · ?tema=N
├── assets/
│   ├── estil.css       full d'estil (imatge de marca)
│   ├── web.js          munta el selector de temes
│   ├── exercicis.js    munta la pàgina d'activitats
│   ├── dades.js              ← GENERAT · no editar a mà
│   ├── exercicis-batx.json   ← GENERAT · no editar a mà
│   └── logo.png
├── pdf/                ← GENERAT per publica.sh · no editar a mà
├── publica.sh          decideix què es publica, copia els PDF i regenera dades.js
└── genera-exercicis.py converteix les activitats .tex en JSON
```

Les tres pàgines no tenen cap tema escrit a dins: es munten a partir de
`assets/dades.js`, que `publica.sh` genera llegint els repositoris. Afegir un
document nou és crear el PDF al repo privat i tornar a executar l'script.

---

## Com actualitzar la web

Des de la carpeta `web/`:

```bash
./publica.sh --dry     # veure què faria, sense tocar res
./publica.sh           # copiar els PDF i regenerar dades.js
git add -A && git commit -m "Actualitza material" && git push
```

GitHub torna a construir la Page automàticament (triga 1-2 minuts).

### Si sembla que la web no s'ha actualitzat

`publica.sh` posa una **empremta de versió** a cada asset
(`assets/estil.css?v=a6cfcc15`), que canvia quan el fitxer canvia. Això obliga
el navegador a demanar la versió nova del CSS i del JavaScript en comptes de
servir la que té desada.

L'HTML, però, el navegador també se'l guarda una estona. Si acabes de publicar
i encara veus la versió antiga:

- **Mac · Chrome:** ⌘ + ⇧ + R · **Safari:** ⌘ + ⌥ + R
- O obre-la en una finestra privada, que és la manera fiable de veure què hi ha
  realment publicat.

### Canviar què es publica

Tot es decideix a les primeres línies de `publica.sh`:

```bash
PUBLICA_3ESO=0                  # 0 = 3r d'ESO surt com a "properament"
TEMES_BATX="1"                  # quins temes de batxillerat es publiquen
TIPUS_BATX=("Activitats")       # quins documents, i en quin ordre
```

**Per obrir un tema nou**, afegeix-hi el número: `TEMES_BATX="1 2"`. Per obrir-los
tots, deixa-ho buit: `TEMES_BATX=""`.

Això no és només cosmètic: el que no es publica **no es copia al repositori públic**.
Els PDF i els exercicis d'un tema marcat com a properament no hi són, així que ningú
no hi pot arribar encara que endevini l'adreça. Els apunts, els exàmens, Els
essencials, el Quadern pas a pas, l'Aprofundiment, el Thinking Classroom, el material
d'avaluació i les fonts `.tex` es queden sempre als repositoris privats.

### Com troba els PDF

Busca dins de cada carpeta de tema (`1 Nombres racionals/`, …) qualsevol PDF
anomenat `<Tipus> - <Tema>.pdf`, sigui a la subcarpeta que sigui. Per això és
important mantenir la nomenclatura dels PDF als repositoris de material.
Les carpetes `original*/` s'ignoren.

---

## Exercicis en línia (1r de batxillerat)

Cada tema de batxillerat té, a més del PDF, una versió per fer a la pantalla amb
les **solucions desplegables**: `exercicis.html?tema=N`.

No és un document a part: `genera-exercicis.py` llegeix els mateixos `.tex` de
`2 Activitats/` i en treu l'enunciat, els apartats i la solució de cada exercici.
El LaTeX continua sent l'única font — si canvies un exercici al `.tex`, torna a
executar `publica.sh` i la web queda actualitzada.

- Una fila d'eines amb un desplegable de **seccions** (hi saltes directament, i el botó
  mostra en tot moment en quina secció ets mentre fas scroll) i un **filtre per dificultat**
  que amaga els exercicis dels nivells desmarcats, sense canviar-ne la numeració.
- Respecta el `main.tex`: si hi tens una secció comentada, tampoc no surt a la web
  (i l'script t'ho avisa).
- La numeració i els punts de nivell (●○○ bàsic · ●●○ mitjà · ●●● repte) són els
  mateixos que al PDF.
- Les fórmules les pinta **MathJax**; el macro `\Lim` està definit a `exercicis.html`.
  Si en crees de nous a `estil1btx.sty`, afegeix-los allà (`MathJax.tex.macros`).
- Els gràfics fets amb TikZ/pgfplots no es poden dibuixar a la web: al seu lloc hi
  surt un avís que remet al PDF.

---

## Icones i "afegir a la pantalla d'inici"

iOS **no** fa servir el `<link rel="icon">` per a la icona de la pantalla d'inici:
necessita un `apple-touch-icon` **quadrat, en PNG i sense transparència** (el que
sigui transparent li surt negre). Com que el logo del centre és rectangular, abans
no en sortia cap.

```bash
python3 genera-icones.py 1     # 1 = blau  ·  2 = aquarel·les  ·  3 = crema
```

Genera `assets/icona-{32,180,192,512}.png`. El `manifest.json` i les etiquetes de
les pàgines ja hi apunten.

> **Si ja la tenies desada a la pantalla d'inici, esborra-la i torna-la a afegir.**
> iOS es guarda la icona del dia que la vas afegir i no la torna a demanar.

El `manifest.json` fa que s'obri **sense la barra de Safari**, com una aplicació.
Com que allà no hi ha botó de tornar enrere, la navegació ha d'estar sempre a la
pàgina: el menú de dalt i el botó "← Tots els temes". Si algun dia hi afegeixes
una pàgina sense sortida, canvia `"display": "standalone"` per `"browser"`.

---

## Imatge de marca

| | |
|---|---|
| Color d'identitat | blau acer `#39698C` |
| Fons | `#F8F7F4` · targetes `#FFFFFF` |
| Títols | Poppins (600/700/800) |
| Text | Work Sans (400/500/600) |
| Color de cada tema | la paleta de `0 Estil i plantilles/Imatge de marca/` |

El full d'estil és `assets/estil.css` i les variables de color són a `:root`.

---

## Activar la GitHub Page

1. Puja aquest repositori a GitHub com a **públic**.
2. *Settings → Pages → Source: Deploy from a branch → `main` / `(root)` → Save.*
3. La web quedarà a `https://mar-pvv.github.io/web/`
   (si el repositori es diu `Mar-PVV.github.io`, la URL serà `https://mar-pvv.github.io/`).
