# AED Bench

**An interactive guide to using an AED.** Live at **https://atultiwari.github.io/aed-bench/**

 Step by step, from finding an adult collapsed on the floor to opening the
AED, attaching the pads, standing clear for the shock and going straight back to CPR.

For medical students and nurses, and for lay people at a CPR workshop.

## What it shows

An illustrated floor scene: an adult collapsed on a mat, a rescuer and a helper. Seven steps take them through 18
stations: check and call, CPR, opening and switching on the AED, attaching the pads, hands off while it analyses,
"Everyone clear!" and the shock, then straight back to CPR. Press Play, press a step, or tap the next part of the
scene.

- A window beside the scene shows the heart behind the chest: quivering in ventricular fibrillation, squeezed by
  each push, and crossed by the current at the shock. Under it is a strip of what the AED is reading.
- The scenario clock runs to 4 min 37 s, with counters for compressions and hands-off time.
- A "30:2 / Compressions only" switch shows the difference between trained and untrained rescuers.
- Each step has a short "For clinicians" note.
- It works on laptops and phones; on a phone the view follows the action up close.

The people, the AED and the heart are illustrations generated with Higgsfield (GPT Image 2.5 and Nano Banana Pro).
Each pose was first drawn from a skeleton checked against the ERC 2025 technique (shoulders over the hands, arms
straight, hands on the lower half of the sternum), then redrawn in the illustration style and reviewed. Every image,
its prompt reference and its job id are listed in [assets/generated/README.md](assets/generated/README.md).

**In progress, not yet published:** a rotatable 3D version (`turntable/`) and a model-driven version
(`working-model/`). Their pages currently redirect to the main page; open them with `?preview=1` to see the
unfinished state.

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
| `docs/scene.md` | What the scene shows, station by station |
| `shared/aed-spec.js` | The spec as data |
| `shared/aed-people.js`, `tests/` | The posture-tested skeleton used to pose every illustration |
| `sketchbook/` | The page |
| `assets/sprites/`, `assets/generated/` | The illustrations, and the record of how each was made |
| `tools/` | Pose references, sprite registration, edge cleaning |
| `turntable/`, `working-model/` | In progress, not linked |

## Run it

```bash
python3 -m http.server 8000             # from this folder, then open http://localhost:8000/
node --test tests/*.test.mjs            # posture tests for the skeleton
```

Built with the Pradarshan skill.

## Credits

Made with ♥ and a passion for teaching medicine · Dr. Atul Tiwari · https://atultiwari.com/

Code: MIT ([LICENSE](LICENSE)). The drawing engines carry their own MIT notices in
[THIRD_PARTY_LICENSES.md](THIRD_PARTY_LICENSES.md).
