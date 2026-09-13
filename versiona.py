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
    return [f for f in sorted(os.listdir(WEB)) if f.endswith(".html")]

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

# 2) i ara les versions de tots els assets als HTML
versions = {n: empremta(n) for n in ("estil.css", "web.js", "exercicis.js", "dades.js")}
tocats = posa(versions)
print("  · " + (", ".join(tocats) if tocats else "cap canvi"))
