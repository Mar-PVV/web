#!/usr/bin/env python3
# ─────────────────────────────────────────────────────────────────────────────
#  genera-exercicis.py — converteix les activitats de 1r de batxillerat
#  (LaTeX) en el JSON que fa servir exercicis.html.
#
#  Llegeix, per a cada tema de 1BTX_26-27:
#     2 Activitats/main.tex      → quines seccions estan actives
#     2 Activitats/seccions/*.tex → enunciats i solucions
#  i escriu web/assets/exercicis-batx.json
#
#  Les fórmules es deixen tal com són ($...$) perquè les pinti MathJax.
#  El LaTeX continua sent l'única font: per actualitzar la web, torna a
#  executar publica.sh.
# ─────────────────────────────────────────────────────────────────────────────
import json, os, re, sys

BASE = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
REPO = os.path.join(BASE, "1BTX_26-27")
SORTIDA = os.path.join(os.path.dirname(__file__), "assets", "exercicis-batx.json")

avisos = []
# Només es generen els temes que publica.sh marca com a públics (TEMES_BATX).
TEMES_PUBLICS = {int(x) for x in os.environ.get("TEMES_BATX", "").split() if x.strip()}

# ── LaTeX → HTML (només la part de text; les mates no es toquen) ────────────

MATH = re.compile(r"(\$\$.*?\$\$|\\\[.*?\\\]|\$.*?\$)", re.S)

SIMPLES = [
    (r"\\checkmark", "✓"), (r"\\ldots", "…"), (r"\\dots", "…"),
    (r"\\%", "%"), (r"\\&", "&"), (r"\\_", "_"), (r"\\#", "#"),
    (r"\\euro", "€"), (r"\\textdegree", "°"), (r"\\degree", "°"),
    (r"\\quad", " "), (r"\\qquad", "  "), (r"\\,", " "), (r"\\;", " "),
    (r"\\!", ""), (r"\\ ", " "), (r"~", "\u00a0"),
]

def treu_comentaris(t):
    out = []
    for linia in t.split("\n"):
        tallat, i = linia, 0
        while i < len(tallat):
            if tallat[i] == "%" and (i == 0 or tallat[i-1] != "\\"):
                tallat = tallat[:i]
                break
            i += 1
        out.append(tallat)
    return "\n".join(out)

def parell(t, i):
    """Retorna (contingut, índex després del } ) per a un { ... } que comença a i."""
    nivell, j = 0, i
    while j < len(t):
        if t[j] == "{" and (j == 0 or t[j-1] != "\\"):
            nivell += 1
        elif t[j] == "}" and t[j-1] != "\\":
            nivell -= 1
            if nivell == 0:
                return t[i+1:j], j + 1
        j += 1
    return t[i+1:], len(t)

def ordre(t, nom, etiqueta):
    """\\nom{X} → <etiqueta>X</etiqueta>, respectant claus imbricades."""
    out, i = [], 0
    patro = "\\" + nom + "{"
    while True:
        p = t.find(patro, i)
        if p == -1:
            out.append(t[i:]); break
        out.append(t[i:p])
        dins, fi = parell(t, p + len(patro) - 1)
        out.append("<%s>%s</%s>" % (etiqueta, ordre(dins, nom, etiqueta), etiqueta))
        i = fi
    return "".join(out)

def html(t):
    if t is None:
        return ""
    t = treu_comentaris(t)
    # entorns purament visuals del PDF
    t = re.sub(r"\\begin\{multicols\}\{\d+\}", "", t)
    t = re.sub(r"\\end\{multicols\}", "", t)
    t = re.sub(r"\\(begin|end)\{center\}", "", t)
    t = re.sub(r"\\(dis|text)?style\b", "", t)
    # gràfics: no es poden dibuixar aquí
    if re.search(r"\\begin\{(tikzpicture|axis)\}", t):
        t = re.sub(r"\\begin\{tikzpicture\}.*?\\end\{tikzpicture\}",
                   "[[GRAFIC]]", t, flags=re.S)
        t = re.sub(r"\\begin\{axis\}.*?\\end\{axis\}", "[[GRAFIC]]", t, flags=re.S)

    # protegeix les mates
    trossos, guardat = [], []
    for k, tros in enumerate(MATH.split(t)):
        if k % 2:
            guardat.append(tros)
            trossos.append("\x00%d\x00" % (len(guardat) - 1))
        else:
            trossos.append(tros)
    t = "".join(trossos)

    t = t.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    t = ordre(t, "textbf", "strong")
    t = ordre(t, "textit", "em")
    t = ordre(t, "emph", "em")
    t = ordre(t, "underline", "u")
    for a, b in SIMPLES:
        t = re.sub(a, b, t)
    t = re.sub(r"\\\\", "<br>", t)

    # llistes simples
    if "\\begin{itemize}" in t or "\\begin{enumerate}" in t:
        t = re.sub(r"\\begin\{(itemize|enumerate)\}", "<ul>", t)
        t = re.sub(r"\\end\{(itemize|enumerate)\}", "</ul>", t)
        t = re.sub(r"\\item\s*", "<li>", t)

    t = t.replace("[[GRAFIC]]",
                  '<span class="avis-grafic">gràfic — mira\u2019l al PDF</span>')
    t = re.sub(r"\n{2,}", "<br><br>", t)
    t = re.sub(r"\s*\n\s*", " ", t).strip()

    # neteja salts sobrers al principi i al final
    t = re.sub(r"^(?:<br>|\s)+", "", t)
    t = re.sub(r"(?:<br>|\s)+$", "", t)

    # torna a posar les mates
    for k, m in enumerate(guardat):
        t = t.replace("\x00%d\x00" % k, m)
    return t.strip()

# ── Parseig ────────────────────────────────────────────────────────────────

def entorn(t, nom, des=0):
    """Troba \\begin{nom}...\\end{nom} imbricat. Retorna (contingut, ini, fi)."""
    obre, tanca = "\\begin{%s}" % nom, "\\end{%s}" % nom
    i = t.find(obre, des)
    if i == -1:
        return None, -1, -1
    nivell, j = 1, i + len(obre)
    while nivell and j < len(t):
        a, b = t.find(obre, j), t.find(tanca, j)
        if b == -1:
            return None, -1, -1
        if a != -1 and a < b:
            nivell += 1; j = a + len(obre)
        else:
            nivell -= 1; j = b + len(tanca)
    return t[i + len(obre): j - len(tanca)], i, j

def apartats(t):
    """Extreu els \\part d'un bloc parts. Retorna (llista, resta_abans)."""
    cos, i, f = entorn(t, "parts")
    if cos is None:
        return [], t
    trossos = re.split(r"\\part\b", cos)[1:]
    return [html(x) for x in trossos if x.strip()], t[:i] + t[f:]

def llegeix_seccio(cami, comptador):
    t = treu_comentaris(open(cami, encoding="utf-8").read())
    m = re.search(r"\\section\*?\{", t)
    titol = html(parell(t, m.end() - 1)[0]) if m else ""

    exercicis = []
    talls = [(m.start(), m.group(1)) for m in
             re.finditer(r"\\question(?:\[(\d)\])?", t)]
    for k, (pos, nivell) in enumerate(talls):
        fi = talls[k + 1][0] if k + 1 < len(talls) else len(t)
        bloc = t[pos:fi]
        bloc = re.sub(r"^\\question(?:\[\d\])?", "", bloc)

        sol, si, sf = entorn(bloc, "solution")
        enunciat_cru = bloc[:si] if si != -1 else bloc

        parts_enunciat, resta = apartats(enunciat_cru)
        parts_solucio, resta_sol = ([], "")
        if sol is not None:
            parts_solucio, resta_sol = apartats(sol)

        comptador += 1
        exercicis.append({
            "num": comptador,
            "nivell": int(nivell) if nivell else 0,
            "enunciat": html(resta),
            "parts": parts_enunciat,
            "solucio": html(resta_sol),
            "solucioParts": parts_solucio,
        })
    return titol, exercicis, comptador

def llegeix_tema(arrel, carpeta):
    act = os.path.join(arrel, carpeta, "2 Activitats")
    main = os.path.join(act, "main.tex")
    if not os.path.isfile(main):
        return None
    cru = open(main, encoding="utf-8").read()

    actives = re.findall(r"^\s*\\input\{seccions/([^}]+)\}", cru, re.M)
    totes = sorted(f[:-4] for f in os.listdir(os.path.join(act, "seccions"))
                   if f.endswith(".tex")) if os.path.isdir(os.path.join(act, "seccions")) else []
    if len(totes) > len(actives):
        fora = [s for s in totes if s not in actives]
        avisos.append("%s: %d secció(ns) del .tex no entren al document "
                      "(comentades a main.tex): %s" % (carpeta, len(fora), ", ".join(fora)))

    seccions, comptador = [], 0
    for nom in actives:
        cami = os.path.join(act, "seccions", nom + ".tex")
        if not os.path.isfile(cami):
            avisos.append("%s: no trobo seccions/%s.tex" % (carpeta, nom))
            continue
        titol, exs, comptador = llegeix_seccio(cami, comptador)
        if exs:
            seccions.append({"titol": titol, "exercicis": exs})
    return seccions

# ── Principal ──────────────────────────────────────────────────────────────

def main():
    if not os.path.isdir(REPO):
        print("  ⚠️  no trobo 1BTX_26-27"); return
    temes = []
    for carpeta in sorted(os.listdir(REPO)):
        m = re.match(r"^([1-9])\s+(.+)$", carpeta)
        if not m or not os.path.isdir(os.path.join(REPO, carpeta)):
            continue
        if TEMES_PUBLICS and int(m.group(1)) not in TEMES_PUBLICS:
            print("  · %s %s: properament (no es publica)" % (m.group(1), m.group(2)))
            continue
        seccions = llegeix_tema(REPO, carpeta)
        if seccions is None:
            continue
        n = sum(len(s["exercicis"]) for s in seccions)
        temes.append({"num": int(m.group(1)), "nom": m.group(2),
                      "carpeta": carpeta, "seccions": seccions})
        print("  · %s %s: %d exercicis en %d seccions"
              % (m.group(1), m.group(2), n, len(seccions)))

    os.makedirs(os.path.dirname(SORTIDA), exist_ok=True)
    with open(SORTIDA, "w", encoding="utf-8") as fh:
        json.dump({"temes": temes}, fh, ensure_ascii=False, indent=1)
    total = sum(sum(len(s["exercicis"]) for s in t["seccions"]) for t in temes)
    print("\n  ✓ %d exercicis a assets/exercicis-batx.json" % total)
    for a in avisos:
        print("  ⚠️  " + a)

if __name__ == "__main__":
    main()
