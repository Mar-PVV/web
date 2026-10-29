#!/usr/bin/env python3
"""Posa una empremta de versió als assets (assets/estil.css?v=a1b2c3d4).

Sense això, els navegadors serveixen la còpia antiga de l'HTML, el CSS i el
JavaScript durant hores després d'una actualització, i sembla que la web no
s'hagi actualitzat. L'empremta és un resum del contingut: només canvia quan
el fitxer canvia de debò. Ho crida publica.sh."""
import hashlib, os, re

WEB = os.path.dirname(os.path.abspath(__file__))

def empremta(nom):
    p = os.path.join(WEB, "assets", nom)
    if not os.path.isfile(p):
        return None
    with open(p, "rb") as fh:
        return hashlib.sha1(fh.read()).hexdigest()[:8]

def htmls():
    # les pàgines de l'arrel i les de les seccions en carpeta (distribucions/, tutoria/, acta/)
    fs = [f for f in sorted(os.listdir(WEB)) if f.endswith(".html")]
    for d in ("distribucions", "distribucions/tutorial", "tutoria", "acta"):
        if os.path.isfile(os.path.join(WEB, d, "index.html")):
            fs.append(d + "/index.html")
    return fs

def posa(versions):
    tocats = []
    for f in htmls():
        p = os.path.join(WEB, f)
        t = o = open(p, encoding="utf-8").read()
        for nom, v in versions.items():
            if v:
                t = re.sub(r"(assets/" + re.escape(nom) + r")(\?v=[0-9a-f]+)?\"",
                           r"\1?v=" + v + "\"", t)
        if t != o:
            open(p, "w", encoding="utf-8").write(t)
            tocats.append(f)
    return tocats

# 1) el JSON el demana exercicis.js: primer hi posem la seva versió
vj = empremta("exercicis-batx.json")
if vj:
    p = os.path.join(WEB, "assets", "exercicis.js")
    t = o = open(p, encoding="utf-8").read()
    t = re.sub(r"fetch\('assets/exercicis-batx\.json(\?v=[0-9a-f]+)?'\)",
               "fetch('assets/exercicis-batx.json?v=%s')" % vj, t)
    if t != o:
        open(p, "w", encoding="utf-8").write(t)

# 1 bis) el CSV de preguntes el demanen test.js i exercicis.js
vc = empremta("preguntes-limits.csv")
if vc:
    for nom in ("test.js", "exercicis.js"):
        p = os.path.join(WEB, "assets", nom)
        if not os.path.isfile(p):
            continue
        t = o = open(p, encoding="utf-8").read()
        t = re.sub(r"(assets/preguntes-limits\.csv)(\?v=[0-9a-f]+)?",
                   r"\1?v=" + vc, t)
        if t != o:
            open(p, "w", encoding="utf-8").write(t)

# 1 ter) el CSV dels vídeos de les solucions el demana exercicis.js
vv = empremta("videos-batx.csv")
if vv:
    p = os.path.join(WEB, "assets", "exercicis.js")
    t = o = open(p, encoding="utf-8").read()
    t = re.sub(r"(assets/videos-batx\.csv)(\?v=[0-9a-f]+)?", r"\1?v=" + vv, t)
    if t != o:
        open(p, "w", encoding="utf-8").write(t)

# 2) i ara les versions de tots els assets als HTML
versions = {n: empremta(n)
            for n in ("estil.css", "web.js", "exercicis.js", "dades.js", "test.js",
              "decimal-fraccio.css", "decimal-fraccio.js",
              "suma-resta-fraccions.css", "suma-resta-fraccions.js",
              "repas-racionals.css", "repas-racionals.js")}
tocats = posa(versions)
print("  · " + (", ".join(tocats) if tocats else "cap canvi"))
