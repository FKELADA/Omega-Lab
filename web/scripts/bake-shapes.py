"""Adds full mode shapes to src/data/g2elin/modes.json.

The G2ELin API returns the mode shape of the top five states only. This script
uses G2ELin's own Python core (run it with G2ELin's virtual environment) to
read the right eigenvector of each mode at every unit's angle state
(theta_{SM_i}, theta_{GFM_i}, theta_pll_{GFL_i}), so lesson 8.8 can draw who
swings against whom on the whole network.

Usage, from web/:
  ../../G2ELin/python/.venv/Scripts/python.exe scripts/bake-shapes.py
"""

import json
import math
import re
from pathlib import Path

from g2elin_api.analysis import build_modal_from_network
from g2elin_api.main import _resolve_preset_network
from g2elin_core.network.breakers import default_labels

DATA = Path(__file__).resolve().parent.parent / "src" / "data" / "g2elin" / "modes.json"
ANGLE = re.compile(r"^theta(?:_pll)?_\{((?:SM|GFM|GFL)_\d+)\}$")


def main() -> None:
    data = json.loads(DATA.read_text(encoding="utf-8"))
    for preset, entry in data.items():
        network = _resolve_preset_network(preset)
        _, modal = build_modal_from_network(network)
        # Unit label (SM_1, GFM_1, …) → the bus it is connected to.
        labels = default_labels(network).der
        entry["unit_bus"] = {labels[d.id]: d.bus for d in network.der_units if d.id in labels}
        names = list(modal.state_names)
        angle_idx = {m.group(1): i for i, s in enumerate(names) if (m := ANGLE.match(s))}
        shapes = {}
        for mode in entry["modes"]:
            j = mode["mode"]
            v = modal.right_eigenvectors[:, j]
            comps = {u: complex(v[i]) for u, i in angle_idx.items()}
            big = max(comps.values(), key=abs)
            if abs(big) == 0:
                continue
            ref = big / abs(big)
            shapes[str(j)] = {
                u: [round(abs(c) / abs(big), 4), round(math.degrees(math.atan2((c / ref).imag, (c / ref).real)), 1)]
                for u, c in comps.items()
            }
        entry["shapes"] = shapes
        print(preset, len(shapes), "mode shapes")
    DATA.write_text(json.dumps(data, separators=(",", ":")), encoding="utf-8")


if __name__ == "__main__":
    main()
