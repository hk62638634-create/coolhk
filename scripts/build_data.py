#!/usr/bin/env python3
"""Build static map data for CoolHK.

Downloads the real MTR track shapes from OpenStreetMap (Overpass API), simplifies them
and writes data/mtr_lines.geojson, which the website loads instead of drawing straight
lines between stations. GitHub Actions runs this every week (.github/workflows/update-data.yml).

Uses only the Python standard library. If OpenStreetMap is busy or returns too little,
the script stops without touching the existing data file, so the website keeps working.
"""
import json
import math
import pathlib
import sys
import time
import urllib.parse
import urllib.request

MIRRORS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass.private.coffee/api/interpreter",
]
BBOX = "22.13,113.82,22.57,114.45"  # Hong Kong
LINE_CODES = {"ISL", "TWL", "KTL", "TKL", "SIL", "TCL", "AEL", "DRL", "EAL", "TML"}
QUERY = (
    '[out:json][timeout:180];'
    f'relation["route"~"^(subway|train)$"]["network"~"MTR"]({BBOX});'
    'out geom;'
)
TOLERANCE = 0.00003  # about 3 m: keeps curves, drops redundant points
OUT = pathlib.Path(__file__).resolve().parent.parent / "data" / "mtr_lines.geojson"


def overpass(query):
    body = urllib.parse.urlencode({"data": query}).encode()
    headers = {"User-Agent": "CoolHK data builder (https://github.com/hk62638634-create/coolhk)"}
    for attempt in range(3):
        for url in MIRRORS:
            try:
                req = urllib.request.Request(url, data=body, headers=headers)
                with urllib.request.urlopen(req, timeout=240) as resp:
                    return json.load(resp)
            except Exception as err:  # busy server, timeout, HTML error page...
                print(f"  {url} failed: {err}", file=sys.stderr)
        time.sleep(30 * (attempt + 1))
    sys.exit("OpenStreetMap is unavailable right now; keeping the existing data file.")


def simplify(points, tol):
    """Ramer-Douglas-Peucker line simplification (iterative, coordinates in degrees)."""
    if len(points) < 3:
        return points
    keep = [False] * len(points)
    keep[0] = keep[-1] = True
    stack = [(0, len(points) - 1)]
    while stack:
        a, b = stack.pop()
        (x1, y1), (x2, y2) = points[a], points[b]
        dx, dy = x2 - x1, y2 - y1
        length = math.hypot(dx, dy) or 1e-12
        best, best_d = None, tol
        for i in range(a + 1, b):
            x, y = points[i]
            d = abs(dy * x - dx * y + x2 * y1 - y2 * x1) / length
            if d > best_d:
                best, best_d = i, d
        if best is not None:
            keep[best] = True
            stack += [(a, best), (best, b)]
    return [p for p, k in zip(points, keep) if k]


def build(data):
    """Group track ways by line code; each OSM way is kept once even if both directions use it."""
    lines = {}
    for rel in data.get("elements", []):
        code = rel.get("tags", {}).get("ref", "")
        if code not in LINE_CODES:
            continue
        for m in rel.get("members", []):
            if m.get("type") != "way" or m.get("role", "") != "" or not m.get("geometry"):
                continue
            pts = [(p["lon"], p["lat"]) for p in m["geometry"] if p]
            if len(pts) >= 2:
                lines.setdefault(code, {})[m["ref"]] = pts
    features = []
    for code in sorted(lines):
        paths = [[[round(x, 5), round(y, 5)] for x, y in simplify(p, TOLERANCE)] for p in lines[code].values()]
        features.append({"type": "Feature", "properties": {"ref": code},
                         "geometry": {"type": "MultiLineString", "coordinates": paths}})
    return features


def main():
    print("Downloading MTR lines from OpenStreetMap…")
    features = build(overpass(QUERY))
    found = {f["properties"]["ref"] for f in features}
    if len(found) < 8:
        sys.exit(f"Only found {sorted(found)}; keeping the existing data file.")
    OUT.parent.mkdir(exist_ok=True)
    geojson = {"type": "FeatureCollection",
               "attribution": "© OpenStreetMap contributors, ODbL 1.0",
               "features": features}
    OUT.write_text(json.dumps(geojson, separators=(",", ":"), ensure_ascii=False), encoding="utf-8")
    n_paths = sum(len(f["geometry"]["coordinates"]) for f in features)
    print(f"Wrote {OUT.relative_to(OUT.parent.parent)}: {len(features)} lines, {n_paths} track pieces, "
          f"{OUT.stat().st_size // 1024} KB. Missing: {sorted(LINE_CODES - found) or 'none'}")


if __name__ == "__main__":
    main()
