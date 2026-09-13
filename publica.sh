#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
#  publica.sh — copia els PDF publicables dels repos privats al repo web públic
#
#  Els repos 3ESO_26-27 i 1BTX_26-27 són PRIVATS: la GitHub Page no hi pot
#  accedir. Aquest script copia només els PDF que han de ser públics dins de
#  web/pdf/, que sí que es publica.
#
#  Ús:   ./publica.sh            (copia i mostra el resum)
#        ./publica.sh --dry      (només mostra què copiaria)
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

BASE="$(cd "$(dirname "$0")/.." && pwd)"
WEB="$BASE/web"
DRY=0
[ "${1:-}" = "--dry" ] && DRY=1

# ── Què es publica ───────────────────────────────────────────────────────────
# Afegeix o treu tipus d'aquestes llistes per canviar què surt a la web.
TIPUS_3ESO=("Apunts" "Activitats" "Quadern de classe")
TIPUS_1BTX=("Apunts" "Activitats")
# Posa PUBLICA_SOLUCIONS=1 si vols publicar també els solucionaris.
PUBLICA_SOLUCIONS=0

copiats=0
saltats=0

copia_curs () {
  local repo="$1" destdir="$2"; shift 2
  local tipus=("$@")
  [ -d "$BASE/$repo" ] || { echo "  ⚠️  no trobo $repo"; return; }

  for tema in "$BASE/$repo"/[1-9]*/; do
    [ -d "$tema" ] || continue
    local nom; nom="$(basename "$tema")"
    for t in "${tipus[@]}"; do
      while IFS= read -r -d '' pdf; do
        local out="$WEB/pdf/$destdir/$nom/$(basename "$pdf")"
        if [ $DRY -eq 1 ]; then
          echo "  · $destdir/$nom/$(basename "$pdf")"
        else
          mkdir -p "$(dirname "$out")"
          cp "$pdf" "$out"
        fi
        copiats=$((copiats+1))
      done < <(find "$tema" -maxdepth 3 -name "$t - *.pdf" -not -path "*/original*" -print0)
    done
    if [ "$PUBLICA_SOLUCIONS" = "1" ]; then
      while IFS= read -r -d '' pdf; do
        local out="$WEB/pdf/$destdir/$nom/$(basename "$pdf")"
        [ $DRY -eq 1 ] || { mkdir -p "$(dirname "$out")"; cp "$pdf" "$out"; }
        copiats=$((copiats+1))
      done < <(find "$tema" -maxdepth 3 -name "Solucions - *.pdf" -not -path "*/original*" -print0)
    fi
  done
}

copia_interactives () {
  local repo="$1" destdir="$2"
  [ -d "$BASE/$repo" ] || return
  while IFS= read -r -d '' f; do
    local tema; tema="$(basename "$(dirname "$(dirname "$f")")")"
    local out="$WEB/interactives/$destdir/$tema/$(basename "$f")"
    if [ $DRY -eq 1 ]; then echo "  · interactives/$destdir/$tema/$(basename "$f")"
    else mkdir -p "$(dirname "$out")"; cp "$f" "$out"; fi
    copiats=$((copiats+1))
  done < <(find "$BASE/$repo"/[1-9]*/"8 Activitats interactives" -name "*.html" -print0 2>/dev/null)
}


copia_avaluacio () {
  local repo="$1" destdir="$2"
  [ -d "$BASE/$repo/0 Avaluació" ] || return
  while IFS= read -r -d '' pdf; do
    local out="$WEB/pdf/$destdir/avaluacio/$(basename "$pdf")"
    if [ $DRY -eq 1 ]; then echo "  · $destdir/avaluacio/$(basename "$pdf")"
    else mkdir -p "$(dirname "$out")"; cp "$pdf" "$out"; fi
    copiats=$((copiats+1))
  done < <(find "$BASE/$repo/0 Avaluació" -name "*.pdf" ! -name "main.pdf" -print0)
}

echo "════════════════════════════════════════════════"
echo "  Publicant material → web/"
[ $DRY -eq 1 ] && echo "  (simulació: no es copia res)"
echo "════════════════════════════════════════════════"
echo ""
echo "▸ 3r ESO  (${TIPUS_3ESO[*]})"
copia_curs "3ESO_26-27" "3eso" "${TIPUS_3ESO[@]}"
echo "▸ 1r BTX  (${TIPUS_1BTX[*]})"
copia_curs "1BTX_26-27" "1btx" "${TIPUS_1BTX[@]}"
echo "▸ Criteris d'avaluació"
copia_avaluacio "3ESO_26-27" "3eso"
copia_avaluacio "1BTX_26-27" "1btx"
echo "▸ Activitats interactives"
copia_interactives "3ESO_26-27" "3eso"
echo ""
echo "✓ $copiats fitxers publicats a web/pdf i web/interactives"
[ $DRY -eq 1 ] || echo ""
[ $DRY -eq 1 ] || echo "Ara: cd \"$WEB\" && git add -A && git commit -m 'Actualitza material' && git push"
