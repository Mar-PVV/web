# Web · Matemàtiques · INS Pere Vives

Repositori **públic** que publica la GitHub Page amb els materials de matemàtiques
de 3r d'ESO i 1r de batxillerat.

**Autoria:** Mar Vidal Segura · Departament de Matemàtiques · INS Pere Vives
**Llicència del material:** CC BY-NC-SA 4.0

---

## Què és

Un catàleg obert de material. Portada → tries curs → tries tema → descarregues
el PDF. Res més: ni seguiment, ni zona privada, ni material d'avaluació.

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
├── 3eso.html           temes i material de 3r d'ESO
├── batx.html           temes i material de 1r de batxillerat
├── exercicis.html      exercicis en línia (1r BTX) · ?tema=N
├── assets/
│   ├── estil.css       full d'estil (imatge de marca)
│   ├── web.js          munta la llista de temes
│   ├── exercicis.js    munta la pàgina d'exercicis
│   ├── dades.js              ← GENERAT · no editar a mà
│   ├── exercicis-batx.json   ← GENERAT · no editar a mà
│   └── logo.png
├── pdf/                ← GENERAT per publica.sh · no editar a mà
│   ├── 3eso/<tema>/
│   └── batx/<tema>/
├── publica.sh          copia els PDF i regenera dades.js
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

### Canviar què es publica

A dalt de `publica.sh`:

```bash
TIPUS_3ESO=("Apunts" "Activitats" "Activitats amb solucions" "Quadern de classe")
TIPUS_BATX=("Apunts" "Activitats")
```

L'ordre de la llista és l'ordre en què surten els documents a la web. Tot el que
no hi consti **es queda al repositori privat**: exàmens, Els essencials, Quadern
pas a pas, Aprofundiment, Thinking Classroom, material d'avaluació i les fonts `.tex`.

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

- Columna lateral amb l'**índex de seccions** (hi pots saltar directament; la secció
  on ets queda marcada mentre fas scroll) i un **filtre per dificultat** que amaga els
  exercicis dels nivells que desmarquis, sense canviar-ne la numeració.
- Respecta el `main.tex`: si hi tens una secció comentada, tampoc no surt a la web
  (i l'script t'ho avisa).
- La numeració i els punts de nivell (●○○ bàsic · ●●○ mitjà · ●●● repte) són els
  mateixos que al PDF.
- Les fórmules les pinta **MathJax**; el macro `\Lim` està definit a `exercicis.html`.
  Si en crees de nous a `estil1btx.sty`, afegeix-los allà (`MathJax.tex.macros`).
- Els gràfics fets amb TikZ/pgfplots no es poden dibuixar a la web: al seu lloc hi
  surt un avís que remet al PDF.

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
