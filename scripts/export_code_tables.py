import json
import sys
from pathlib import Path

sys.path.insert(0, "dashboard")
import code_tables as ct  # noqa: E402

NAMES = [
    "MARITAL_STATUS", "APPLICATION_MODE", "COURSE", "PREVIOUS_QUALIFICATION",
    "NATIONALITY", "MOTHER_QUALIFICATION", "FATHER_QUALIFICATION",
    "MOTHER_OCCUPATION", "FATHER_OCCUPATION", "GENDER",
]
out = {n: [{"code": k, "label": v} for k, v in getattr(ct, n).items()] for n in NAMES}

dest = Path("web/src/data")
dest.mkdir(parents=True, exist_ok=True)
(dest / "codeTables.json").write_text(
    json.dumps(out, indent=1, ensure_ascii=False), encoding="utf-8"
)
print("Wrote", dest / "codeTables.json", {n: len(v) for n, v in out.items()})