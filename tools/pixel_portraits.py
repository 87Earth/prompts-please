import json
import os
import sys
import tempfile
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
CHAR_DIR = os.environ.get("PP_CHAR_DIR")
OUT = ROOT / "assets" / "sprites" / "portraits"
MODELS = ["claude", "gpt", "gemini", "grok", "deepseek", "qwen", "kimi", "minimax", "seed"]


def remove_background(img, tol):
    rgb = np.asarray(img.convert("RGB")).astype(np.int16)
    h, w, _ = rgb.shape
    bg = np.median(np.concatenate([rgb[0:4, 0:40].reshape(-1, 3), rgb[0:4, w - 40:w].reshape(-1, 3)]), axis=0)
    close = np.abs(rgb - bg).sum(axis=2) <= tol
    mask = np.zeros((h, w), dtype=bool)
    q = deque()
    border = [(0, x) for x in range(w)] + [(h - 1, x) for x in range(w)] + [(y, 0) for y in range(h)] + [(y, w - 1) for y in range(h)]
    for y, x in border:
        if close[y, x] and not mask[y, x]:
            mask[y, x] = True
            q.append((y, x))
    while q:
        y, x = q.popleft()
        for ny, nx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
            if 0 <= ny < h and 0 <= nx < w and not mask[ny, nx] and close[ny, nx]:
                mask[ny, nx] = True
                q.append((ny, nx))
    rgba = np.dstack([rgb.astype(np.uint8), np.where(mask, 0, 255).astype(np.uint8)])
    return Image.fromarray(rgba)


def pixelate(img, size, colors):
    small = img.resize((size, size), Image.BOX)
    arr = np.asarray(small).copy()
    alpha = arr[:, :, 3] >= 110
    rgb = Image.fromarray(np.ascontiguousarray(arr[:, :, :3]))
    pal = rgb.quantize(colors=colors, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).convert("RGB")
    out = np.dstack([np.asarray(pal), np.where(alpha, 255, 0).astype(np.uint8)])
    edge = np.zeros_like(alpha)
    edge[1:, :] |= alpha[:-1, :]
    edge[:-1, :] |= alpha[1:, :]
    edge[:, 1:] |= alpha[:, :-1]
    edge[:, :-1] |= alpha[:, 1:]
    outline = edge & ~alpha
    out[outline] = [26, 20, 24, 255]
    return Image.fromarray(out.astype(np.uint8))


def main():
    if not CHAR_DIR:
        sys.exit("請用環境變數 PP_CHAR_DIR 指定角色圖資料夾：每個模型一個子資料夾（claude、gpt……），裡面放半身圖 close.png")
    cfg = json.loads(sys.argv[1]) if len(sys.argv) > 1 else {}
    size = cfg.get("size", 64)
    colors = cfg.get("colors", 14)
    tol = cfg.get("tol", 40)
    OUT.mkdir(parents=True, exist_ok=True)
    preview = Image.new("RGBA", (len(MODELS) * size * 3, size * 3), (60, 64, 80, 255))
    for i, m in enumerate(MODELS):
        src = Image.open(Path(CHAR_DIR) / m / "close.png")
        crop = cfg.get("crops", {}).get(m, cfg.get("crop", [150, 20, 874, 744]))
        head = remove_background(src, tol).crop(tuple(crop))
        px = pixelate(head, size, colors)
        px.save(OUT / f"{m}.png")
        preview.alpha_composite(px.resize((size * 3, size * 3), Image.NEAREST), (i * size * 3, 0))
    prev_dir = Path(tempfile.gettempdir()) / "prompts-please"
    prev_dir.mkdir(parents=True, exist_ok=True)
    preview.save(prev_dir / f"portraits_{size}.png")
    print(prev_dir / f"portraits_{size}.png")


if __name__ == "__main__":
    main()
