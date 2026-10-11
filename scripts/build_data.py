#!/usr/bin/env python3
"""Build static map data for CoolHK.

Downloads from OpenStreetMap (Overpass API), simplifies and writes:
  data/mtr_lines.geojson  real MTR track shapes (instead of straight lines between stations)
  data/shade.geojson      covered walkways, covered footbridges, pedestrian subways and indoor links

GitHub Actions runs this every week (.github/workflows/update-data.yml).

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
DATA = pathlib.Path(__file__).resolve().parent.parent / "data"
OUT = DATA / "mtr_lines.geojson"
SHADE_OUT = DATA / "shade.geojson"
WALK = "footway|pedestrian|path|steps|corridor"
SHADE_QUERY = (
    "[out:json][timeout:240];("
    f'way["highway"~"^({WALK})$"]["covered"~"^(yes|arcade|colonnade|roof)$"]({BBOX});'
    f'way["highway"~"^({WALK})$"]["tunnel"~"^(yes|building_passage)$"]({BBOX});'
    f'way["highway"="corridor"]({BBOX});'
    ");out geom;"
)
MIN_LENGTH_M = 10  # drop tiny scraps


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


def length_m(pts):
    """Approximate length in metres of a [(lon, lat), ...] line in Hong Kong."""
    kx, ky = 111320 * math.cos(math.radians(22.32)), 110540
    return sum(math.hypot((x2 - x1) * kx, (y2 - y1) * ky) for (x1, y1), (x2, y2) in zip(pts, pts[1:]))


def build_shade(data):
    """Covered or indoor walking links. kind = "indoor" for subways and corridors, else "covered"."""
    features, seen = [], set()
    for way in data.get("elements", []):
        if way.get("type") != "way" or way["id"] in seen or not way.get("geometry"):
            continue
        seen.add(way["id"])
        tags = way.get("tags", {})
        pts = [(p["lon"], p["lat"]) for p in way["geometry"] if p]
        if len(pts) < 2 or length_m(pts) < MIN_LENGTH_M:
            continue
        indoor = tags.get("highway") == "corridor" or tags.get("tunnel") in ("yes", "building_passage") or tags.get("indoor") in ("yes", "corridor")
        props = {"kind": "indoor" if indoor else "covered"}
        en, zh = tags.get("name:en") or "", tags.get("name:zh") or tags.get("name:zh-Hant") or ""
        if not en and tags.get("name", "").isascii():
            en = tags.get("name", "")
        elif not zh and tags.get("name"):
            zh = tags["name"]
        if en:
            props["en"] = en
        if zh:
            props["zh"] = zh
        coords = [[round(x, 5), round(y, 5)] for x, y in simplify(pts, TOLERANCE * 0.7)]
        features.append({"type": "Feature", "properties": props, "geometry": {"type": "LineString", "coordinates": coords}})
    return features


def write(path, features, label):
    path.parent.mkdir(exist_ok=True)
    geojson = {"type": "FeatureCollection", "attribution": "© OpenStreetMap contributors, ODbL 1.0", "features": features}
    path.write_text(json.dumps(geojson, separators=(",", ":"), ensure_ascii=False), encoding="utf-8")
    print(f"Wrote {path.relative_to(DATA.parent)}: {len(features)} {label}, {path.stat().st_size // 1024} KB")


def update_mtr():
    print("Downloading MTR lines from OpenStreetMap…")
    features = build(overpass(QUERY))
    found = {f["properties"]["ref"] for f in features}
    if len(found) < 8:
        sys.exit(f"Only found {sorted(found)}; keeping the existing MTR file.")
    write(OUT, features, f"MTR lines (missing: {sorted(LINE_CODES - found) or 'none'})")


def update_shade():
    print("Downloading covered walkways from OpenStreetMap…")
    features = build_shade(overpass(SHADE_QUERY))
    if len(features) < 200:
        sys.exit(f"Only found {len(features)} covered links; keeping the existing shade file.")
    kinds = {k: sum(f["properties"]["kind"] == k for f in features) for k in ("covered", "indoor")}
    write(SHADE_OUT, features, f"covered/indoor links {kinds}")


def main():
    """Each dataset is independent: if one download fails, the other is still updated."""
    done = 0
    for step in (update_mtr, update_shade):
        try:
            step()
            done += 1
        except SystemExit as err:
            print(f"  skipped: {err}", file=sys.stderr)
    if not done:
        sys.exit(1)


if __name__ == "__main__":
    main()
