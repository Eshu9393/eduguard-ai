import io
import zipfile
from pathlib import Path

import httpx

URL = ("https://archive.ics.uci.edu/static/public/697/"
       "predict+students+dropout+and+academic+success.zip")
DEST = Path("data/raw/data.csv")


def main():
    if DEST.exists():
        print(f"{DEST} already exists, nothing to do.")
        return
    DEST.parent.mkdir(parents=True, exist_ok=True)
    print("Downloading dataset from the UCI repository...")
    r = httpx.get(URL, timeout=60, follow_redirects=True)
    r.raise_for_status()
    with zipfile.ZipFile(io.BytesIO(r.content)) as z:
        csvs = [n for n in z.namelist() if n.lower().endswith(".csv")]
        if not csvs:
            raise SystemExit(f"No CSV found in the archive. Contents: {z.namelist()}")
        DEST.write_bytes(z.read(csvs[0]))
    print(f"Saved {DEST} ({DEST.stat().st_size / 1024:.0f} KB)")


if __name__ == "__main__":
    main()