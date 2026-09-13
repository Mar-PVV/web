# Web · Matemàtiques · Mar Vidal Segura

Repositori **públic** que publica la GitHub Page amb el material de matemàtiques
de l'INS Pere Vives (3r d'ESO i 1r de batxillerat).

**Autoria:** Mar Vidal Segura · Departament de Matemàtiques
**Llicència del material:** CC BY-NC-SA 4.0

---

## Per què existeix aquest repositori

Els repositoris de material (`3ESO_26-27` i `1BTX_26-27`) són **privats**: hi ha
els `.tex`, els exàmens i el material de treball. Una GitHub Page **només pot servir
fitxers del seu propi repositori**, així que no pot enllaçar res d'un repo privat
(els visitants rebrien un 404).

La solució és aquest repositori públic, que conté **només els PDF que han de ser
públics**. L'script [`publica.sh`](publica.sh) els copia dels repos privats.

```
   3ESO_26-27 (privat)  ─┐
                         ├─→  publica.sh  ─→  web/pdf/  ─→  GitHub Page (pública)
   1BTX_26-27 (privat)  ─┘
```

---

## Estructura

```
web/
├── index.html              PORTADA · Portal Professora (els dos cursos)
├── professor-3eso.html     portal de 3r d'ESO
├── professor-batx.html     portal de 1r de batxillerat
├── alumnes/                zona de l'alumnat
│   ├── index.html          hub d'activitats interactives
│   └── tema-1.html … tema-9.html
├── interactives/           les activitats interactives (HTML)
│   └── 3eso/<tema>/
├── pdf/                    ← generat per publica.sh (no editar a mà)
│   ├── 3eso/<tema>/        Apunts, Activitats, Quadern de classe
│   ├── 3eso/avaluacio/
│   ├── 1btx/<tema>/        Apunts, Activitats
│   └── 1btx/avaluacio/
├── docs/                   documentació del projecte web
└── publica.sh
```

---

## Com actualitzar la web

Des de la carpeta `web/`:

```bash
./publica.sh --dry     # veure què copiaria, sense tocar res
./publica.sh           # copiar els PDF actualitzats
git add -A && git commit -m "Actualitza material" && git push
```

GitHub torna a construir la Page automàticament (triga 1-2 minuts).

### Canviar què es publica

A dalt de `publica.sh`:

```bash
TIPUS_3ESO=("Apunts" "Activitats" "Quadern de classe")
TIPUS_1BTX=("Apunts" "Activitats")
PUBLICA_SOLUCIONS=0     # posa 1 per publicar també els solucionaris
```

Tot el que no surti en aquestes llistes **es queda als repos privats**: exàmens,
Els essencials, Quadern pas a pas, Aprofundiment, Thinking Classroom, fonts `.tex`.

---

## Públic de la web

| Qui | Què hi busca |
|---|---|
| Alumnat de 1r de batxillerat | apunts i activitats per consultar a casa |
| Altres docents del centre | veure i reutilitzar el material (CC BY-NC-SA) |
| Jo mateixa | tauler de seguiment dels dos cursos |

L'alumnat de 3r d'ESO rep el material pel **Classroom**; aquí hi és sobretot
perquè el puguin consultar altres docents.

---

## Activar la GitHub Page

1. Puja aquest repositori a GitHub com a **públic**.
2. *Settings → Pages → Source: Deploy from a branch → `main` / `(root)`*.
3. La web quedarà a `https://mar-pvv.github.io/web/`
   (si el repositori es diu `mar-pvv.github.io`, la URL serà `https://mar-pvv.github.io/`).
