#!/usr/bin/env python3
"""Genera les icones de la web a partir de assets/icona-mestra.png.

iOS NO fa servir el <link rel="icon"> per a la icona de la pantalla d'inici:
necessita un apple-touch-icon quadrat, en PNG i SENSE transparència (el que
sigui transparent li surt negre). Per això aquí s'aplana l'alfa sobre el fons
crema de la marca.

Ús:  python3 genera-icones.py
"""
import os, sys
from PIL import Image

AQUI = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.join(AQUI, "assets")
MESTRA = os.path.join(ASSETS, "icona-mestra.png")
CREMA = (248, 247, 244)

MIDES = [
    (180, "icona-180.png"),   # apple-touch-icon (iPhone i iPad)
    (192, "icona-192.png"),   # Android / Chrome
    (512, "icona-512.png"),   # Android / Chrome i pantalla de càrrega
    (32,  "icona-32.png"),    # pestanya del navegador
]

def main():
    if not os.path.isfile(MESTRA):
        print("✗ no trobo assets/icona-mestra.png")
        sys.exit(1)

    im = Image.open(MESTRA)
    if im.width != im.height:
        print("⚠️  la mestra no és quadrada (%dx%d): iOS la deformarà."
              % (im.width, im.height))

    # Sense transparència: l'aplanem sobre el crema de la marca
    if im.mode in ("RGBA", "LA", "P"):
        im = im.convert("RGBA")
        fons = Image.new("RGBA", im.size, CREMA + (255,))
        im = Image.alpha_composite(fons, im)
    im = im.convert("RGB")

    for mida, nom in MIDES:
        im.resize((mida, mida), Image.LANCZOS).save(os.path.join(ASSETS, nom))
        print("  · assets/%s" % nom)

    print("\n  Fet. Si ja tenies la web desada a la pantalla d'inici de l'iPad,")
    print("  esborra la drecera i torna-la a afegir: iOS es queda la icona antiga.")

if __name__ == "__main__":
    main()
