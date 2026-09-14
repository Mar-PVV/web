#!/usr/bin/env python3
"""Genera les icones de la web.

iOS NO fa servir el <link rel="icon"> per a la icona de la pantalla d'inici:
necessita un apple-touch-icon quadrat, en PNG i sense transparència (el que
sigui transparent li surt negre). El logo del centre és rectangular, per això
no en sortia cap.

Ús:  python3 genera-icones.py [1|2|3]     (1 = blau, 2 = aquarel·les, 3 = crema)
"""
import os, random, sys
from PIL import Image, ImageDraw, ImageFont, ImageFilter

AQUI = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.join(AQUI, "assets")
POPPINS = "/usr/share/fonts/truetype/google-fonts/Poppins-Bold.ttf"
for alt in ("/Library/Fonts/Poppins-Bold.ttf",
            os.path.expanduser("~/Library/Fonts/Poppins-Bold.ttf")):
    if not os.path.isfile(POPPINS) and os.path.isfile(alt):
        POPPINS = alt

S = 512
BLAU = (57, 105, 140)
CREMA = (248, 247, 244)
PALETA = ["#A8CEFA", "#FFE2FF", "#FFAC78", "#7AD5CC", "#FFD576",
          "#CAE8C8", "#E8E2FF", "#F99EB5", "#FFD6C9"]
LLETRA = "M"

def hx(c):
    return tuple(int(c[i:i + 2], 16) for i in (1, 3, 5))

def centra(d, txt, font, color, y_off=0):
    x0, y0, x1, y1 = d.textbbox((0, 0), txt, font=font)
    d.text(((S - (x1 - x0)) / 2 - x0, (S - (y1 - y0)) / 2 - y0 + y_off),
           txt, font=font, fill=color)

def opcio(n):
    if n == 1:
        im = Image.new("RGB", (S, S), BLAU)
        centra(ImageDraw.Draw(im), LLETRA, ImageFont.truetype(POPPINS, 340),
               (255, 255, 255), -14)
        return im
    if n == 2:
        im = Image.new("RGB", (S, S), CREMA)
        d = ImageDraw.Draw(im)
        random.seed(7)
        for i, (cx, cy) in enumerate([(x, y) for y in range(3) for x in range(3)]):
            x = cx * S / 3 - 18 + random.randint(-10, 10)
            y = cy * S / 3 - 18 + random.randint(-10, 10)
            d.rounded_rectangle((x, y, x + S / 3 + 36, y + S / 3 + 36),
                                radius=26, fill=hx(PALETA[i]))
        im = im.filter(ImageFilter.GaussianBlur(17))
        im = Image.alpha_composite(im.convert("RGBA"),
                                   Image.new("RGBA", (S, S), (43, 43, 43, 54))).convert("RGB")
        centra(ImageDraw.Draw(im), LLETRA, ImageFont.truetype(POPPINS, 330),
               (255, 255, 255), -12)
        return im
    im = Image.new("RGB", (S, S), CREMA)
    d = ImageDraw.Draw(im)
    centra(d, LLETRA, ImageFont.truetype(POPPINS, 300), BLAU, -34)
    d.rounded_rectangle((S * 0.30, S * 0.745, S * 0.70, S * 0.745 + 14), radius=7, fill=BLAU)
    return im

def main():
    n = int(sys.argv[1]) if len(sys.argv) > 1 else 1
    base = opcio(n)
    os.makedirs(ASSETS, exist_ok=True)
    for mida, nom in ((180, "icona-180.png"),   # apple-touch-icon (iOS/iPadOS)
                      (192, "icona-192.png"),   # Android / Chrome
                      (512, "icona-512.png"),   # Android / Chrome, pantalla de càrrega
                      (32,  "icona-32.png")):   # pestanya del navegador
        base.resize((mida, mida), Image.LANCZOS).save(os.path.join(ASSETS, nom))
        print("  · assets/%s" % nom)
    print("\n  Icona %d generada. Recorda: si ja la tenies a la pantalla d'inici," % n)
    print("  esborra-la i torna-la a afegir — iOS es guarda la icona antiga.")

if __name__ == "__main__":
    main()
