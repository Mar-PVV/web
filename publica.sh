#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
#  publica.sh — prepara la web pública a partir dels repositoris privats
#
#  Els repos 3ESO_26-27 i 1BTX_26-27 són PRIVATS: una GitHub Page no hi pot
#  accedir. Aquest script hi busca els PDF publicables, els copia a web/pdf/
#  i genera web/assets/dades.js, que és el que fa servir la web per muntar
#  la llista de temes. Si afegeixes un document nou, torna a executar-lo.
#
#  Ús:  ./publica.sh          copia i genera
#       ./publica.sh --dry    mostra què faria, sense tocar res
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

BASE="$(cd "$(dirname "$0")/.." && pwd)"
WEB="$BASE/web"
DRY=0; [ "${1:-}" = "--dry" ] && DRY=1

# ── Què es publica ───────────────────────────────────────────────────────────
# Afegeix o treu tipus de document d'aquestes llistes. L'ordre és el que
# sortirà a la web. Tot el que no hi surti es queda als repositoris privats.
TIPUS_3ESO=("Apunts" "Activitats" "Activitats amb solucions" "Quadern de classe")
TIPUS_BATX=("Apunts" "Activitats")

echo "▸ Exercicis en línia (1r BTX)"
if [ $DRY -eq 0 ]; then python3 "$(dirname "$0")/genera-exercicis.py"; fi
echo ""
echo "▸ PDF per tema"

python3 - "$BASE" "$WEB" "$DRY" "${#TIPUS_3ESO[@]}" "${TIPUS_3ESO[@]}" "${TIPUS_BATX[@]}" <<'PY'
import json, os, re, shutil, sys
from datetime import date

base, web, dry, n3 = sys.argv[1], sys.argv[2], sys.argv[3] == "1", int(sys.argv[4])
tipus = {"3eso": sys.argv[5:5 + n3], "batx": sys.argv[5 + n3:]}

CURSOS = {
    "3eso": {"repo": "3ESO_26-27", "nom": "3r d'ESO"},
    "batx": {"repo": "1BTX_26-27", "nom": "1r de batxillerat"},
}
COLORS = ["#A8CEFA", "#FFE2FF", "#FFAC78", "#7AD5CC", "#FFD576",
          "#CAE8C8", "#E8E2FF", "#F99EB5", "#FFD6C9"]

def mida(n):
    return f"{n/1048576:.1f} MB".replace(".", ",") if n >= 1048576 else f"{max(1, round(n/1024))} kB"

# neteja els PDF antics (noms de tema que ja no existeixen)
if not dry:
    import shutil as _sh
    for c in CURSOS:
        d = os.path.join(web, "pdf", c)
        if os.path.isdir(d):
            _sh.rmtree(d)

dades = {"generat": date.today().strftime("%d/%m/%Y"), "cursos": {}}
total = 0

# quins temes tenen exercicis en línia (els genera genera-exercicis.py)
enLinia = {}
ex_json = os.path.join(web, "assets", "exercicis-batx.json")
if os.path.isfile(ex_json):
    with open(ex_json, encoding="utf-8") as fh:
        for t in json.load(fh)["temes"]:
            enLinia[("batx", t["num"])] = sum(len(x["exercicis"]) for x in t["seccions"])

for clau, info in CURSOS.items():
    arrel = os.path.join(base, info["repo"])
    temes = []
    if not os.path.isdir(arrel):
        print(f"  ⚠️  no trobo {info['repo']}")
        dades["cursos"][clau] = {"nom": info["nom"], "temes": temes}
        continue

    for carpeta in sorted(os.listdir(arrel)):
        m = re.match(r"^([1-9])\s+(.+)$", carpeta)
        if not m or not os.path.isdir(os.path.join(arrel, carpeta)):
            continue
        num, nom = int(m.group(1)), m.group(2)

        # tots els PDF del tema, indexats pel tipus (el text abans del primer " - ")
        trobats = {}
        for dirpath, dirnames, filenames in os.walk(os.path.join(arrel, carpeta)):
            dirnames[:] = [d for d in dirnames if not d.startswith("original")]
            for f in filenames:
                if not f.endswith(".pdf") or " - " not in f:
                    continue
                trobats.setdefault(f.split(" - ")[0], os.path.join(dirpath, f))

        docs = []
        for t in tipus[clau]:
            src = trobats.get(t)
            if not src:
                continue
            rel = f"pdf/{clau}/{carpeta}/{os.path.basename(src)}"
            dst = os.path.join(web, rel)
            if not dry:
                os.makedirs(os.path.dirname(dst), exist_ok=True)
                shutil.copy2(src, dst)
            etiqueta = "Activitats" if t == "Activitats amb solucions" else t
            docs.append({"tipus": etiqueta, "fitxer": rel, "mida": mida(os.path.getsize(src))})
            total += 1

        tema = {"num": num, "nom": nom,
                "color": COLORS[(num - 1) % len(COLORS)], "docs": docs}
        if enLinia.get((clau, num)):
            tema["enLinia"] = enLinia[(clau, num)]
        temes.append(tema)
        estat = ", ".join(d["tipus"] for d in docs) or "sense material publicable"
        print(f"  · {num} {nom}: {estat}")

    dades["cursos"][clau] = {"nom": info["nom"], "temes": temes}

js = "/* Generat per publica.sh — no editar a mà */\nwindow.DADES = " + \
     json.dumps(dades, ensure_ascii=False, indent=2) + ";\n"
if not dry:
    os.makedirs(os.path.join(web, "assets"), exist_ok=True)
    with open(os.path.join(web, "assets", "dades.js"), "w", encoding="utf-8") as fh:
        fh.write(js)

print()
print(f"✓ {total} PDF publicats" + (" (simulació: no s'ha copiat res)" if dry else ""))
PY

echo ""
[ $DRY -eq 1 ] || echo "Ara:  cd \"$WEB\" && git add -A && git commit -m 'Actualitza material' && git push"
