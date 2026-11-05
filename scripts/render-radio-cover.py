"""Render the radio's typographic brand artwork using the site's own fonts.

Development only: pip install pillow fonttools brotli
"""
from io import BytesIO
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parents[1]
SIZE = 1024


def font(name, size):
    face = TTFont(ROOT / 'dist/fonts' / name)
    face.flavor = None
    output = BytesIO()
    face.save(output)
    output.seek(0)
    return ImageFont.truetype(output, size)


art = Image.new('RGB', (SIZE, SIZE))
pixels = art.load()
for y in range(SIZE):
    for x in range(SIZE):
        glow = max(0, 1 - ((x - 900)**2 + (y - 120)**2)**0.5 / 1100)
        pixels[x, y] = (int(4 + glow * 5), int(18 + glow * 42), int(31 + glow * 64))
draw = ImageDraw.Draw(art)
cyan = '#22d3ee'
for radius in [235, 340, 445]:
    draw.ellipse((845-radius, 140-radius, 845+radius, 140+radius), outline='#1c4f70', width=3)
draw.rounded_rectangle((62, 62, 962, 962), radius=44, outline='#286281', width=3)
draw.ellipse((110, 118, 130, 138), fill=cyan)
draw.text((151, 105), 'RADIO / 24·7', font=font('dm-sans.woff2', 32), fill='#c7e8f4')
title = font('barlow-800.woff2', 278)
draw.text((101, 184), 'EL', font=title, fill='#f0f7ff')
draw.text((101, 424), 'OTRO', font=title, fill=cyan)
draw.text((110, 744), 'LADO DE LA COSA', font=font('dm-sans.woff2', 44), fill='#f0f7ff')
draw.line((110, 831, 910, 831), fill='#286281', width=3)
draw.text((110, 867), 'ESTUDIO & RADIO', font=font('dm-sans.woff2', 26), fill='#9db2cc')
for i, height in enumerate([16, 36, 24, 52, 32, 44, 18]):
    x = 758 + i * 23
    draw.rounded_rectangle((x, 890-height//2, x+9, 890+height//2), radius=4, fill=cyan)
for size in [96, 128, 192, 256, 384, 512]:
    art.resize((size, size), Image.Resampling.LANCZOS).save(
        ROOT / f'dist/assets/radio-cover-{size}.png', optimize=True)
