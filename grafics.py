#!/usr/bin/env python3
# ─────────────────────────────────────────────────────────────────────────────
#  grafics.py — converteix els gràfics TikZ/pgfplots de les activitats
#  en imatges SVG per a la web.
#
#  Com funciona:
#    1. genera-exercicis.py li va passant el codi TikZ de cada gràfic
#       (apunta()) i rep una clau curta.
#    2. Al final crida dibuixa_tot(): agafa tots els gràfics que encara no
#       tenen SVG, els posa en un únic document LaTeX (una pàgina per gràfic),
#       el compila una sola vegada i el converteix a SVG amb dvisvgm.
#    3. Els SVG es desen a web/assets/grafics/g-<clau>.svg. Com que la clau
#       és el hash del codi, un gràfic que no ha canviat no es torna a dibuixar.
#
#  Requisits: pdflatex, latex i dvisvgm (venen amb MacTeX i amb MiKTeX/TeX Live).
#  Si dvisvgm no pot llegir el PDF (Ghostscript >= 10.01 sense mutool), es
#  dibuixa per DVI amb el controlador dvisvgm de TikZ.
#  Si no hi són, no passa res: els gràfics es queden amb l'avís "mira'l al PDF".
# ─────────────────────────────────────────────────────────────────────────────
import hashlib, os, re, shutil, subprocess, tempfile

ARREL = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
ESTIL = os.path.join(ARREL, "1BTX_26-27", "0 Estil i plantilles", "estil1btx.sty")
DESTI = os.path.join(os.path.dirname(__file__), "assets", "grafics")

_pendents = {}   # clau → codi LaTeX
avisos = []


# ── Preàmbul: reaprofita els colors i l'estil de gràfiques de estil1btx.sty ──

def _bloc_balancejat(t, i):
    """Retorna el text des de i fins que es tanquen les claus obertes."""
    nivell, j = 0, i
    while j < len(t):
        if t[j] == "{":
            nivell += 1
        elif t[j] == "}":
            nivell -= 1
            if nivell == 0:
                return t[i:j + 1]
        j += 1
    return t[i:]


def preambul():
    extra = []
    if os.path.isfile(ESTIL):
        s = open(ESTIL, encoding="utf-8").read()
        extra += re.findall(r"^\\definecolor\{.*$", s, re.M)
        extra += re.findall(r"^\\usetikzlibrary\{.*$", s, re.M)
        for m in re.finditer(r"\\pgfplotsset\s*\{", s):
            extra.append("\\pgfplotsset" + _bloc_balancejat(s, m.end() - 1))
    return "\n".join([
        r"\documentclass[multi=tikzpicture,border=3pt]{standalone}",
        r"\usepackage[utf8]{inputenc}",
        r"\usepackage[T1]{fontenc}",
        r"\usepackage{amsmath,amssymb}",
        r"\usepackage{helvet}",
        r"\renewcommand{\familydefault}{\sfdefault}",
        r"\usepackage{tikz}",
        r"\usepackage{pgfplots}",
        r"\pgfplotsset{compat=1.18}",
        r"\usetikzlibrary{arrows.meta,calc,patterns,positioning,decorations.pathreplacing}",
    ] + extra)


# ── API per a genera-exercicis.py ───────────────────────────────────────────

def apunta(codi):
    """Registra un gràfic i retorna la seva clau."""
    codi = codi.strip()
    if not codi.startswith("\\begin{tikzpicture}"):
        codi = "\\begin{tikzpicture}\n" + codi + "\n\\end{tikzpicture}"
    clau = hashlib.sha1(codi.encode("utf-8")).hexdigest()[:12]
    _pendents[clau] = codi
    return clau


def cami_relatiu(clau):
    return "assets/grafics/g-%s.svg" % clau


def _fet(clau):
    return os.path.isfile(os.path.join(DESTI, "g-%s.svg" % clau))


def dibuixa_tot():
    """Dibuixa els gràfics que falten. Retorna el conjunt de claus disponibles."""
    os.makedirs(DESTI, exist_ok=True)
    _neteja_orfes()
    falten = [c for c in _pendents if not _fet(c)]
    if not falten:
        return {c for c in _pendents if _fet(c)}

    if not (shutil.which("pdflatex") and shutil.which("dvisvgm")):
        avisos.append("no trobo pdflatex i/o dvisvgm: els gràfics es deixen "
                      "amb l'avís «mira'l al PDF»")
        return set()

    print("  · dibuixant %d gràfic(s)…" % len(falten))
    # 1r intent: pdflatex + dvisvgm --pdf (el de sempre). dvisvgm necessita
    # Ghostscript < 10.01 o mutool per llegir PDF; amb un Ghostscript més nou
    # no converteix res. Per això, el que no surti es torna a provar per DVI
    # (latex + controlador dvisvgm de TikZ), que no necessita cap de les dues.
    _dibuixa(falten, "pdf")
    queden = [c for c in falten if not _fet(c)]
    if queden:
        _dibuixa(queden, "dvi")
    n = len([c for c in falten if not _fet(c)])
    if n:
        avisos.append("%d gràfic(s) no s'han pogut dibuixar" % n)
    return {c for c in _pendents if _fet(c)}


def _dibuixa(claus, via):
    """Compila els gràfics de claus (una pàgina per gràfic) i en desa els SVG."""
    with tempfile.TemporaryDirectory() as tmp:
        cos = "\n".join(_pendents[c] for c in claus)
        cap = "\\def\\pgfsysdriver{pgfsys-dvisvgm.def}\n" if via == "dvi" else ""
        tex = cap + preambul() + "\n\\begin{document}\n" + cos + "\n\\end{document}\n"
        open(os.path.join(tmp, "g.tex"), "w", encoding="utf-8").write(tex)
        motor = "pdflatex" if via == "pdf" else "latex"
        if not shutil.which(motor):
            return
        subprocess.run([motor, "-interaction=nonstopmode", "g.tex"],
                       cwd=tmp, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        doc = os.path.join(tmp, "g." + via)
        if not os.path.isfile(doc):
            errors = [l.rstrip() for l in open(os.path.join(tmp, "g.log"),
                      encoding="utf-8", errors="replace") if l.startswith("!")]
            avisos.append("el document dels gràfics (%s) no compila: %s"
                          % (motor, "; ".join(errors[:3]) or "mira el .log"))
            return
        ordre = ["dvisvgm"] + (["--pdf"] if via == "pdf" else []) + [
                 "--page=1-", "--no-fonts", "--optimize", "--output=%f-%p", "g." + via]
        r = subprocess.run(ordre, cwd=tmp, stdout=subprocess.DEVNULL,
                           stderr=subprocess.PIPE, text=True, errors="replace")
        for i, clau in enumerate(claus, start=1):
            amp = "g-%0*d.svg" % (len(str(len(claus))), i)
            orig = os.path.join(tmp, amp)
            if not os.path.isfile(orig):
                orig = os.path.join(tmp, "g-%d.svg" % i)
            if os.path.isfile(orig):
                shutil.move(orig, os.path.join(DESTI, "g-%s.svg" % clau))
        if via == "pdf" and any(not _fet(c) for c in claus):
            err = [l for l in r.stderr.splitlines() if l.strip()]
            if err:
                print("  · dvisvgm --pdf no ha pogut (%s); provo per DVI" % err[0].strip())


def _neteja_orfes():
    """Esborra els SVG de gràfics que ja no existeixen en cap exercici."""
    if not os.path.isdir(DESTI):
        return
    for f in os.listdir(DESTI):
        m = re.match(r"^g-([0-9a-f]{12})\.svg$", f)
        if m and m.group(1) not in _pendents:
            os.remove(os.path.join(DESTI, f))
