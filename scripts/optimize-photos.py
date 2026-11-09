"""Build small, content-addressed WebP copies from the retained JPEG originals."""
from pathlib import Path
import hashlib
import re
from PIL import Image, ImageOps

root = Path(__file__).resolve().parent.parent
manifest = root / 'photos/photos.js'
before = after = 0

def convert(match):
    global before, after
    stem = match[1].split('.')[0]
    source = root / 'photos' / (stem + '.jpg')
    image = ImageOps.exif_transpose(Image.open(source)).convert('RGB')
    image.thumbnail((960, 960), Image.Resampling.LANCZOS)
    import io
    data = io.BytesIO()
    image.save(data, 'WEBP', quality=80, method=6)
    content = data.getvalue()
    name = stem + '.' + hashlib.sha256(content).hexdigest()[:10] + '.webp'
    (root / 'photos' / name).write_bytes(content)
    before += source.stat().st_size
    after += len(content)
    print(f'{stem}: {source.stat().st_size:,} -> {len(content):,} bytes')
    return "file:'" + name + "'"

text = re.sub(r"file:'([^']+)'", convert, manifest.read_text(encoding='utf-8'))
manifest.write_text(text, encoding='utf-8')
ready = re.search(r"ready: \{file:'([^']+)'", text)[1]
index = root / 'index.html'
html = index.read_text(encoding='utf-8')
link = f'<link id="phasePhotoPreload" rel="preload" as="image" href="photos/{ready}" fetchpriority="high">'
if 'id="phasePhotoPreload"' in html:
    html = re.sub(r'<link id="phasePhotoPreload"[^>]*>', link, html)
else:
    html = html.replace('</head>', link + '\n</head>')
index.write_text(html, encoding='utf-8')
print(f'Total: {before:,} -> {after:,} bytes ({100*(1-after/before):.1f}% smaller)')
