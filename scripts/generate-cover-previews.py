"""Rebuild small article-list covers with Pillow. The site itself serves static WebP files."""

import hashlib
import json
from io import BytesIO
from pathlib import Path

from PIL import Image, ImageOps


root = Path(__file__).resolve().parents[1]
public = root / "public"
output = public / "cover-previews"
manifest = root / "src/content/cover-previews.json"


def main():
    records = json.loads((root / "content/editorial.json").read_text())["articles"]
    covers = {
        article["cover"] for article in records
        if article.get("status") == "published" and article.get("cover")
    }
    previous = json.loads(manifest.read_text()) if manifest.exists() else {}
    current = {}
    output.mkdir(exist_ok=True)
    for cover in sorted(covers):
        if not cover.startswith(("/assets/", "/uploads/")):
            continue
        original = (public / cover.lstrip("/")).resolve()
        if not original.is_relative_to(public) or not original.is_file():
            continue
        with Image.open(original) as image:
            oriented = ImageOps.exif_transpose(image)
            # Match the list's centered square cover without upscaling small sources.
            edge = min(320, oriented.width, oriented.height)
            preview = ImageOps.fit(oriented, (edge, edge), method=Image.Resampling.LANCZOS)
            data = BytesIO()
            preview.save(data, format="WEBP", quality=80, method=5)
            encoded = data.getvalue()
        name = hashlib.sha256(encoded).hexdigest()[:16] + ".webp"
        target = output / name
        if not target.exists():
            target.write_bytes(encoded)
        current[cover] = f"/cover-previews/{name}"
    temporary = manifest.with_suffix(".tmp")
    temporary.write_text(json.dumps(current, indent=2, ensure_ascii=False) + "\n")
    temporary.replace(manifest)
    for obsolete in set(previous.values()) - set(current.values()):
        target = (public / obsolete.lstrip("/")).resolve()
        if target.parent == output and target.suffix == ".webp":
            target.unlink(missing_ok=True)
    print(f"{len(current)} covers, {sum(p.stat().st_size for p in output.glob('*.webp')):,} bytes")


if __name__ == "__main__":
    main()
