# AED Bench

**An interactive guide to using an AED.** Step by step, from finding an adult collapsed on the floor to opening the
AED, attaching the pads, standing clear for the shock and going straight back to CPR.

For medical students and nurses, and for lay people at a CPR workshop.

## Three versions of the same steps

Switch between them with the bar at the top of every page.

| Version | What it is |
|---|---|
| **Sketchbook** | A hand-drawn isometric floor scene. Tap the steps, the parts or the station tapes; the heart and the AED's reading change with each step. |
| **Turntable** | The same scene in 3D. Drag to turn it, pinch to zoom, view it from any side or full screen. |
| **Working Model** | A precise isometric scene where every number on screen (scenario clock, compressions, hands-off time, compression fraction) comes from one small model of the 18 stations. |

All three share one spec and one data file, so the stations, names and times never drift apart: 7 steps, 18 stations,
a scenario clock of 4 min 37 s. A "30:2 / Compressions only" switch shows the difference between trained and
untrained rescuers, and each step has a short "For clinicians" note. Pages work on laptops and phones; on a phone the
view follows the action up close.

## Sources

> **European Resuscitation Council Guidelines 2025: Adult Basic Life Support.** Smyth MA, van Goor S, Hansen CM, et al.
> *Resuscitation* 2025;215:110771. Fig. 7 "BLS step by step", "Using an AED", "Positioning of defibrillation pads".
>
> **European Resuscitation Council Guidelines 2025: Adult Advanced Life Support.** Soar J, Böttiger BW, et al.
> *Resuscitation* 2025;215:110769. "Defibrillation strategy", "Energy levels".
>
> **Part 7: Adult Basic Life Support.** 2025 American Heart Association Guidelines for CPR and ECC. *Circulation* 2025.
> doi:10.1161/CIR.0000000000001369.

Every step, station and number is cited in [docs/spec.md](docs/spec.md). Values neither guideline gives (how long an
AED takes to analyse or charge, set-up times) are marked "typical". The emergency numbers shown are 108 and 112
(India; 112 is also the European number).

**A teaching figure, not a substitute for a CPR course.** In a real emergency, call your emergency number and follow
the AED's voice.

## Files

| Path | What |
|---|---|
| `docs/spec.md` | The approved spec: steps, stations, times, sources |
| `docs/scene.md` | What every style draws, station by station |
| `shared/aed-spec.js` | The spec as data, read by all three pages |
| `sketchbook/`, `turntable/`, `working-model/` | One folder per style |

## Run it

```bash
python3 -m http.server 8000             # from this folder, then open http://localhost:8000/
node working-model/src/build.mjs        # rebuilds working-model/index.html after editing working-model/src
node --test working-model/src/*.test.mjs
```

Built with the Pradarshan skill. Three.js is loaded from jsDelivr (pinned to 0.160.0).

## Credits

Made with ♥ and a passion for teaching medicine · Dr. Atul Tiwari · https://atultiwari.com/

Code: MIT ([LICENSE](LICENSE)). The drawing engines carry their own MIT notices in
[THIRD_PARTY_LICENSES.md](THIRD_PARTY_LICENSES.md).
