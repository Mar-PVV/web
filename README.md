# Web · Matemàtiques · INS Pere Vives

Repositori **públic** que publica la GitHub Page amb els materials de matemàtiques
de 3r d'ESO i 1r de batxillerat.

**Autoria:** Mar Vidal Segura · Departament de Matemàtiques · INS Pere Vives
**Llicència del material:** CC BY-NC-SA 4.0

---

## Què és

Portada → tries curs → tries tema → fas les activitats en línia, amb les solucions
desplegables, i te'n pots descarregar el PDF.

**Ara mateix es publiquen els temes 1 i 2 de batxillerat.** Els altres temes de
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
├── suma-resta-fraccions.html  aplicatiu: suma i resta de fraccions (3r ESO, tema 1)
├── repas-racionals.html  aplicatiu: repàs del tema 1 per nivells AS/AN/AE (3r ESO)
├── batx.html           selector de temes de 1r de batxillerat
├── exercicis.html      activitats d'un tema · ?tema=N
├── test-limits.html    test ràpid de límits (1r BTX, tema 1)
├── distribucions/
│   ├── index.html      eina per a docents: distribucions de l'aula (/distribucions)
│   └── tutorial/       vídeo tutorial de l'eina (/distribucions/tutorial)
├── tutoria/
│   └── index.html      pàgina d'eines de tutoria (/tutoria): enllaça distribucions i acta
├── acta/
│   ├── index.html      eina per a tutors: visualitzador d'actes d'iEduca (/acta)
│   ├── lib/            pdf.js, pdf-lib i fontkit (còpies locals, vegeu LLICENCIES.md)
│   └── fonts/          Work Sans i Poppins (TTF, subconjunt llatí) per al PDF
├── manifest.json       per instal·lar la web a la pantalla d'inici
├── assets/
│   ├── estil.css       full d'estil (imatge de marca)
│   ├── web.js          munta el selector de temes
│   ├── exercicis.js    munta la pàgina d'activitats
│   ├── test.js         fa funcionar el test de límits
│   ├── decimal-fraccio.css, decimal-fraccio.js  l'aplicatiu de decimal a fracció
│   │                   (el CSS també té els estils comuns de tots els aplicatius)
│   ├── suma-resta-fraccions.css, suma-resta-fraccions.js  l'aplicatiu de suma i resta
│   ├── repas-racionals.css, repas-racionals.js  l'aplicatiu de repàs del tema 1
│   ├── preguntes-limits.csv  preguntes del test · s'edita a mà
│   ├── videos-batx.csv quins exercicis tenen vídeo a la solució · s'edita a mà
│   ├── dades.js              ← GENERAT · no editar a mà
│   ├── exercicis-batx.json   ← GENERAT · no editar a mà
│   ├── grafics/              ← GENERAT · SVG dels gràfics TikZ
│   ├── logo.png, logo-sense-fons.png
│   └── icona-*.png     icones (a partir de icona-mestra.png)
├── videos/             vídeos de les solucions de batxillerat (MP4)
├── pdf/                ← GENERAT per publica.sh · no editar a mà
├── proves/
│   └── prova-repas-racionals.js  prova automàtica del repàs (node proves/prova-repas-racionals.js)
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
TEMES_BATX="1 2"                # quins temes de batxillerat es publiquen
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

### Vídeos a les solucions

Alguns exercicis tenen, dins de la solució, un botó **Mira-ho en vídeo** que obre el
vídeo en una finestra (amb botó de tancar, perquè a l'app de l'iPad no hi ha barra
del navegador). A la capçalera de l'exercici surt l'etiqueta «Vídeo».

- Els vídeos són a `videos/` (MP4, H.264). Nom sense espais: `t1-ex50-a-e.mp4`.
- Quins exercicis en tenen es diu a **`assets/videos-batx.csv`** (s'edita a mà, com
  el CSV del test). No toca el LaTeX ni `exercicis-batx.json`. Columnes:

| columna | què hi va |
|---|---|
| `tema` | el número de tema |
| `exercici` | el número de l'exercici, el mateix que a la web i al PDF |
| `apartat` | la lletra (`a`, `e`…). Buida = el botó surt al final de la solució |
| `video` | el camí del fitxer (`videos/t1-ex50-a-e.mp4`) o un enllaç de YouTube |
| `inici` | on comença aquell apartat dins del vídeo (`3:14`). Buida = des del principi |

- Un mateix vídeo pot servir per a diversos apartats: una fila per apartat, cadascuna
  amb el seu `inici`.
- Si la numeració dels exercicis canvia al LaTeX, cal revisar aquest CSV.
- El repo és públic i GitHub Pages té un límit d'1 GB: vídeos lleugers (720p o 1080p
  amb poc moviment, uns 2-10 MB cadascun). Si en fossin molts, millor pujar-los a
  YouTube (ocults) i posar-ne l'enllaç a la columna `video`.

---

## Aplicatius de 3r d'ESO

`eso.html` és la pàgina de 3r d'ESO. **No surt de `dades.js`**: els temes i els
aplicatius s'hi escriuen a mà, perquè de 3r no es publica cap document
(`PUBLICA_3ESO=0` a `publica.sh` continua igual). Ara hi ha el tema 1, Nombres
racionals, amb els aplicatius **De decimal a fracció** (`decimal-fraccio.html`),
**Suma i resta de fraccions** (`suma-resta-fraccions.html`) i **Repàs del tema**
(`repas-racionals.html`, vegeu més avall). Tots dos tenen nivell
fàcil i normal; a la suma i resta, el m.c.m. es pot fer per descomposició, amb
llistes de múltiples o directament, i el nivell fàcil no té nombres negatius. La
suma i resta té també el nivell **Negatius**: fraccions negatives entre parèntesis,
amb un primer pas per treure els parèntesis (regla dels signes).

- Cada aplicatiu és una pàgina a l'arrel amb la capçalera i el peu comuns, el seu
  CSS i JS a `assets/`. Els estils comuns dels aplicatius són a
  `decimal-fraccio.css`, dins de `main.dec2frac` perquè no xoquin amb `estil.css`;
  cada aplicatiu nou l'enllaça i hi afegeix el seu CSS propi.
- **Per afegir-ne un altre:** crea la pàgina copiant `decimal-fraccio.html`,
  afegeix-ne un `<a class="doc">` dins del tema a `eso.html` (o copia el bloc
  `<section class="tema obert">` per obrir un tema nou) i posa els seus assets a la
  llista de `versiona.py`. Si cal, actualitza el comptador «1 aplicatiu» de la
  targeta de 3r d'ESO a `index.html`.
- Les estadístiques (fets, encerts, ratxa) es desen només al navegador de
  l'alumne (`localStorage`): la web no recull cap dada.

### Repàs del tema 1 (`repas-racionals.html`)

Repàs de tot el tema 1 (sense notació científica) en tres nivells: **AS**, **AN** i **AE**. L'alumne tria el nivell i el
mode: **per apartats** (un o diversos dels 7 apartats) o **simulacre** (12 preguntes de
tot el tema: 2 de cada apartat, i 1 de potències bàsiques i 1 d'arrels). Les
**potències bàsiques** (apartat 5) només demanen calcular a<sup>n</sup> amb base entera o
fracció i exponent natural o zero; la resta (propietats, exponent negatiu, base 2,
operacions) és a l'apartat 6, **Potències**. Només hi surten tipus d'exercici que hi ha al Quadern
o a les Activitats del tema. Correcció immediata amb la resolució pas a pas, pista a AS i AN (a AE no
n'hi ha) i, al final, la nota sobre 10, els encerts per apartat i què cal repassar.

- Els exercicis surten de **plantilles** (`assets/repas-racionals.js`, secció
  «Plantilles»), amb nombres a l'atzar i aritmètica exacta de fraccions. Cada plantilla
  té apartat, nivell, identificador i nom.
- El signe negatiu s'escriu a la mateixa casella (−3, o al numerador si és una fracció).
  A les arrels hi ha a més un botó ±.
- Una fracció equivalent no simplificada, quan es demana simplificada, compta mig punt
  («Correcte, però simplifica-la»). A les arrels d'índex parell cal el ±.
- Per revisar una plantilla concreta: `repas-racionals.html#plantilla=2-dos&nivell=AE`
  (5 preguntes d'aquella plantilla).
- **Prova automàtica:** `node proves/prova-repas-racionals.js` (cal Node). Genera
  centenars de preguntes de cada plantilla i comprova amb un càlcul independent que la
  solució és bona i irreductible, que l'enunciat que es veu dona aquell resultat, que la
  correcció funciona, que no hi ha notació científica i que els exponents negatius i
  les propietats de potències només surten a l'apartat 6. Passa-la sempre que toquis les plantilles.
- Només desa al navegador (`localStorage`) l'últim nivell triat i la millor nota del
  simulacre. El nom de l'alumne no es desa enlloc del navegador.
- A l'ordinador es pot fer tot amb el teclat: Retorn = Comprova / Següent, i les
  lletres A-D (o 1-4) trien l'opció.

#### Resultats al formulari de Google

En acabar cada intent, el resultat s'envia **en segon pla** a un formulari de Google
de la professora (nom, grup, nivell, mode, nota, encerts per apartat, detall de les
preguntes i un codi de comprovació). L'alumne escriu el nom i el grup a l'inici. Es
configura a la constant `FORMULARI` del principi de la interfície de
`assets/repas-racionals.js`: si `url` és buida, no s'envia res i no es demana el nom.

- Per obtenir els `entry.N`: al formulari, ⋮ → «Obtén l'enllaç emplenat prèviament»,
  omple-ho tot i copia l'enllaç. La `url` és la del formulari acabada en `/formResponse`.
- El formulari ha de ser **obert** (sense «Restringeix als usuaris de l'institut» ni
  «Recull adreces electròniques»): des d'una pàgina sense servidor no es pot enviar un
  formulari que demana iniciar sessió.
- Google no respon a la pàgina, així que no hi ha confirmació real que hagi arribat.
- L'adreça del formulari és al codi públic: algú podria enviar files inventades. Per
  detectar-les, cada fila porta un **codi**; es comprova a
  `repas-racionals.html#comprova`.

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

## Distribucions de l'aula (`distribucions/`)

Eina per al professorat, a `https://mar-pvv.github.io/web/distribucions/`. És una
sola pàgina (`distribucions/index.html`) amb el CSS i el JavaScript a dins; només
fa servir `../assets/estil.css` per a la capçalera i el peu de la web.

- **No desa cap dada**, ni al servidor ni al navegador (només recorda la vista
  triada, des del fons o des de la pissarra). Cada docent obre el CSV del seu
  grup o en crea un de nou, i en acabar descarrega el CSV i el PDF. Avisa abans
  de tancar si hi ha canvis sense descarregar.
- **CSV:** punt i coma, UTF-8. Una fila per alumne i una columna per distribució
  (llocs com a `T3-2` = taula 3, lloc 2), una columna «Primeres files», i files
  que comencen per `#` amb el grup, l'aula, la pissarra, la taula del professorat,
  les taules i les restriccions (`#restriccio;A;B;tipus`, amb tipus `no junts`,
  `lluny` o `junts`). «Lluny» vol dir ni a la mateixa taula ni en cap lloc del voltant
  (es mira lloc a lloc: a 2 quadres o menys, també en diagonal i a l'altra banda d'un passadís estret).
- **Revisió:** avisa de restriccions que no es compleixen, de parelles que ja han segut juntes i
  d'alumnes que repeteixen taula respecte a les distribucions desades anteriors.
- **Projecta a classe:** pantalla completa des de la pissarra; cada clic (o espai / fletxa) destapa
  on seu un alumne, en ordre aleatori.
- **Mai** pugis al repo cap CSV amb noms d'alumnes: el repo és públic.
- **Tutorial:** `distribucions/tutorial/` té el vídeo (`tutorial-distribucions.mp4`, fet amb un grup inventat), la imatge de portada i la pàgina que el mostra.
- Els colors de l'eina són variables a `.dist{...}` al principi del `<style>`.
- Si canvies la secció de lloc o n'afegeixes una altra en carpeta, afegeix-la a
  la funció `htmls()` de `versiona.py`, perquè rebi l'empremta de versió.

---

## Tutoria (`tutoria/`) i visualitzador d'actes (`acta/`)

`tutoria/index.html` és una pàgina amb dues targetes: **Distribucions de l'aula**
(`../distribucions/`) i **Visualitzador d'actes** (`../acta/`). Cap de les tres pàgines
s'enllaça des de la portada: s'hi entra amb l'enllaç directe
(`https://mar-pvv.github.io/web/tutoria/`).

El **visualitzador d'actes** (`acta/index.html`, amb el CSS i el JavaScript a dins):

- La tutora puja l'**acta en PDF d'iEduca** i, si vol, un **CSV de PSI**. Tot es llegeix
  al navegador: **no s'envia ni es desa res** (ni al servidor ni al `localStorage`).
  En recarregar la pàgina s'esborra tot; avisa abans de tancar si hi ha notes.
- **Lectura de l'acta** (pdf.js, `getTextContent()`): es troba la x de cada capçalera
  de columna de la taula i cada nota s'assigna a la columna més propera (les cel·les
  buides no fan córrer les columnes). L'identificador (IDALU) no es guarda mai. Si el
  nom tapa la primera nota, la cel·la surt marcada com a dubtosa i es pot corregir.
  Els noms llargs de les matèries surten de l'annex «Codificacions»; les optatives,
  de la llegenda `NOM [CODI]` de la capçalera. Els comentaris es llegeixen des de
  «Comentaris individuals…» i es treu el peu de pàgina que es repeteix.
- **CSV de PSI:** separador `,` `;` o tabulador. Accepta el format de l'exemple
  (primera columna amb el nom «Nom Cognoms», sense títol; columna `PSI` amb el tipus,
  en blanc si no en té) i també columnes amb títol (`Alumne`, `PSI` Sí/No, `Tipus`).
  Aparella pel nom complet, sense tenir en compte majúscules ni accents.
- Si falta una matèria (p. ex. matemàtiques), es pot afegir a mà a la pestanya Alumnes.
- **PDF** (pdf-lib + fontkit, A4 vertical, vectors): pàgina del grup, una pàgina per
  alumne i «Acords de grup». Té camps de formulari: `notes_07`, `acc_07_entrevista`
  (també `_orientacio`, `_seguiment`, `_felicitar`, `_compromis`), `nota_07_mat` (si
  la matèria afegida a mà no té nota) i `acords_grup`. La font Work Sans va incrustada
  sencera perquè els camps mostrin accents i «l·l». Nom: `Preavaluacio_E3D_2026-10-26.pdf`.
- **Mai** pugis al repo cap acta, CSV de PSI ni PDF generat amb dades reals: el repo
  és públic. Per provar-lo, cal una acta inventada.
- Les llibreries són còpies locals a `acta/lib/` (sense CDN) i les fonts a `acta/fonts/`.

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
