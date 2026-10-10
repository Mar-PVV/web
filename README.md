# Web · Matemàtiques · INS Pere Vives

Repositori **públic** que publica la GitHub Page amb els materials de matemàtiques
de 3r d'ESO i 1r de batxillerat.

**Autoria:** Mar Vidal Segura · Departament de Matemàtiques · INS Pere Vives
**Llicència del material:** CC BY-NC-SA 4.0

---

## Què és

Portada → tries curs → tries tema → fas les activitats en línia, amb les solucions
desplegables, i te'n pots descarregar el PDF.

**Ara mateix només es publica el tema 1 de batxillerat.** Els altres temes de
batxillerat surten com a *properament* fins que estiguin revisats. De 3r d'ESO no
es publiquen documents (l'alumnat té el material al Classroom): només
**aplicatius** per practicar, tema a tema (vegeu [Aplicatius de 3r d'ESO](#aplicatius-de-3r-deso)). **Els apunts no es publiquen**:
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
├── eso.html            temes i aplicatius de 3r d'ESO · s'edita a mà
├── decimal-fraccio.html  aplicatiu: de decimal a fracció (3r ESO, tema 1)
├── batx.html           selector de temes de 1r de batxillerat
├── exercicis.html      activitats d'un tema · ?tema=N
├── test-limits.html    test ràpid de límits (1r BTX, tema 1)
├── manifest.json       per instal·lar la web a la pantalla d'inici
├── assets/
│   ├── estil.css       full d'estil (imatge de marca)
│   ├── web.js          munta el selector de temes
│   ├── exercicis.js    munta la pàgina d'activitats
│   ├── test.js         fa funcionar el test de límits
│   ├── decimal-fraccio.css, decimal-fraccio.js  l'aplicatiu de decimal a fracció
│   ├── preguntes-limits.csv  preguntes del test · s'edita a mà
│   ├── dades.js              ← GENERAT · no editar a mà
│   ├── exercicis-batx.json   ← GENERAT · no editar a mà
│   ├── grafics/              ← GENERAT · SVG dels gràfics TikZ
│   ├── logo.png, logo-sense-fons.png
│   └── icona-*.png     icones (a partir de icona-mestra.png)
├── pdf/                ← GENERAT per publica.sh · no editar a mà
├── publica.sh          decideix què es publica, copia els PDF i regenera dades.js
├── genera-exercicis.py converteix les activitats .tex en JSON
├── grafics.py          converteix els gràfics TikZ en SVG (el crida genera-exercicis.py)
├── versiona.py         posa l'empremta de versió als assets (el crida publica.sh)
└── genera-icones.py    refà les icones (només si canvies icona-mestra.png)
```

Les pàgines de batxillerat no tenen cap tema escrit a dins: es munten a partir de
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
- Els gràfics fets amb **TikZ/pgfplots** sí que surten: `grafics.py` els compila a
  part i els desa com a SVG a `assets/grafics/`. Funciona sol quan executes
  `publica.sh`; no has de fer res.
  - El nom del fitxer és el hash del codi TikZ, així que un gràfic que no has
    tocat no es torna a dibuixar (i els que ja no surten enlloc s'esborren).
  - Necessita `pdflatex` i `dvisvgm`, que vénen amb MacTeX i amb MiKTeX/TeX Live.
    Si no hi fossin, aquell gràfic es queda amb l'avís «gràfic — mira'l al PDF»
    i la resta de la web segueix igual.
  - Els colors i l'estil `btxplot` surten de `estil1btx.sty`, o sigui que el
    gràfic de la web es veu igual que el del PDF.
  - Si dins d'un exercici hi ha diversos gràfics seguits, es posen en graella
    (3 per fila a l'ordinador, menys a mòbil).

---

## Aplicatius de 3r d'ESO

`eso.html` és la pàgina de 3r d'ESO. **No surt de `dades.js`**: els temes i els
aplicatius s'hi escriuen a mà, perquè de 3r no es publica cap document
(`PUBLICA_3ESO=0` a `publica.sh` continua igual). Ara hi ha el tema 1, Nombres
racionals, amb l'aplicatiu **De decimal a fracció** (`decimal-fraccio.html`).

- Cada aplicatiu és una pàgina a l'arrel amb la capçalera i el peu comuns, el seu
  CSS i JS a `assets/` (`decimal-fraccio.css`, `decimal-fraccio.js`). Els estils
  propis van dins de `main.dec2frac` perquè no xoquin amb `estil.css`.
- **Per afegir-ne un altre:** crea la pàgina copiant `decimal-fraccio.html`,
  afegeix-ne un `<a class="doc">` dins del tema a `eso.html` (o copia el bloc
  `<section class="tema obert">` per obrir un tema nou) i posa els seus assets a la
  llista de `versiona.py`. Si cal, actualitza el comptador «1 aplicatiu» de la
  targeta de 3r d'ESO a `index.html`.
- Les estadístiques (fets, encerts, ratxa) es desen només al navegador de
  l'alumne (`localStorage`): la web no recull cap dada.

---

## Test ràpid de límits

A la barra de les activitats d'un tema hi surt el botó **Test ràpid**, que porta a
`test-limits.html`: deu límits triats a l'atzar, correcció immediata i un resum al
final amb les que han fallat.

Les preguntes són a **`assets/preguntes-limits.csv`** i és l'únic fitxer que has de
tocar per canviar-les. El pots obrir amb Numbers o Excel, o amb l'editor de text.
Columnes:

| columna | què hi va |
|---|---|
| `tema` | el número de tema (1 = Successions i límits) |
| `nivell` | 1 bàsic · 2 mitjà · 3 repte |
| `pregunta` | el text, amb les matemàtiques entre dòlars: `$\Lim\dfrac{n+1}{n}$`. Hi funciona la macro `\Lim` |
| `opcions` | les opcions separades per `\|`. **Si ho deixes buit, l'alumne escriu la resposta** en comptes de triar-la |
| `resposta` | l'opció bona (ha de ser igual que una de les opcions); si no hi ha opcions, les respostes que s'accepten, separades per `\|` |
| `explicacio` | opcional: una línia que surt després de respondre |
| `actiu` | `1` surt al test · `0` l'amaga sense esborrar-la, per a blocs que encara no has explicat. Buida compta com a `1` |

Quan la resposta s'escriu, es comparen els valors i no les lletres: per a `1/2`
també valen `0,5`, `0.5` i `$\dfrac{1}{2}$`; per a l'infinit valen `inf`,
`+inf`, `infinit` i `∞`; i per a les que no tenen límit, `no existeix`,
`no té límit` o `oscil·la`. Els accents i els espais tant li fan.

**Per obrir el test a un altre tema** només cal afegir-hi files amb aquell número
de tema: a partir de quatre preguntes, el botó surt sol a la pàgina del tema. No
s'ha de tocar cap HTML.

> El CSV es publica amb la resta de la web, o sigui que un alumne espavilat el pot
> obrir i veure les respostes. És inevitable en una pàgina sense servidor, i per a
> practicar no té importància — però no el facis servir per avaluar.

---

## Icones i "afegir a la pantalla d'inici"

iOS **no** fa servir el `<link rel="icon">` per a la icona de la pantalla d'inici:
necessita un `apple-touch-icon` **quadrat, en PNG i sense transparència** (el que
sigui transparent li surt negre). Com que el logo del centre és rectangular, abans
no en sortia cap.

La icona es dibuixa una vegada a **`assets/icona-mestra.png`** (1024×1024) i
d'allà en surten totes les mides:

```bash
python3 genera-icones.py
```

Genera `assets/icona-{32,180,192,512}.png`. El `manifest.json` i les etiquetes de
les pàgines ja hi apunten. Per canviar-la, substitueix la mestra i torna a
executar l'script.

L'script **aplana la transparència** sobre el crema de la marca, perquè iOS
pinta de negre el que sigui transparent.

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
