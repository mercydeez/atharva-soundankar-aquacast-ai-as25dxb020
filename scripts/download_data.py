"""Download the raw USDA ERS Weekly Retail Food Sales national file into data/raw/.

The notebook downloads the same file itself; this script is for reproducing the raw input locally.
Usage: python scripts/download_data.py
"""
from pathlib import Path
import urllib.request

URL = "https://www.ers.usda.gov/media/6554/weekly-retail-food-sales-national-total-and-by-product-subcategory.csv"
out = Path(__file__).resolve().parents[1] / "data" / "raw" / "weekly-retail-food-sales-national.csv"
out.parent.mkdir(parents=True, exist_ok=True)
req = urllib.request.Request(URL, headers={"User-Agent": "Mozilla/5.0 (academic project; AQUACAST AI)"})
with urllib.request.urlopen(req, timeout=180) as r:
    out.write_bytes(r.read())
print(f"Saved {out} ({out.stat().st_size / 1e6:.1f} MB)")
