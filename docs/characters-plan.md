# Better characters: the plan

Status: **proposal for review.** Nothing below is built yet.

## 1. What is wrong now

Looking at the current figures in all three styles:

| Problem | Where | Why it matters |
|---|---|---|
| Limbs are rods of one thickness with ball joints; no neck; ball heads | all three | They read as wooden mannequins, not people |
| The patient's torso is a box and his legs are square bars | Sketchbook, Working Model | No chest shape, so pad positions and "bare the chest" don't read |
| No faces, no hair shapes, no clothing (sleeves, collars, cuffs, shoes) | all three | Characters have no identity; A and B differ only by shirt colour |
| Hands are balls | all three | The key teaching detail, interlaced fingers on the lower sternum, cannot be shown |
| **The compressing rescuer's elbows are bent and her shoulders are not over her hands** | Turntable | **A teaching error.** ERC 2025 Fig. 7: "keep your arms straight; position yourself vertically above the victim's chest" |
| Kneeling upright looks like standing; the legs vanish behind the body | Sketchbook | The pose is wrong at a glance |
| Each style built its own people separately | all three | They don't look like the same three people across the styles |

## 2. The target look

Follow the **figure language of the ERC 2025 guideline's own illustrations** (Resuscitation 2025;215:110771, Figs. 8a–8o).
We use them as a style reference only and copy no artwork.

- **Proportions:** natural adults, about 6.5–7 heads tall, lightly stylised. There is a neck, the shoulders are wider
  than the hips, and limbs taper from shoulder to wrist and from hip to ankle. Joints are hidden inside the shapes,
  never drawn as balls.
- **Flat colour with one outline:** two or three tones per surface and one ink outline, heavier on the silhouette.
  This already matches the Sketchbook and Working Model looks.
- **Faces:** minimal, but each person has one. Closed-eye curves or dots, a brow line, a nose line. The patient has
  closed eyes and a slack mouth.
- **Hair:** one solid shape per person, with a strong outline (bun, short crop, side parting).
- **Clothes:** short-sleeved or rolled-sleeve tops with a collar line, trousers with a waistband, simple shoes. The
  patient's shirt really opens: two halves fold back, and the bare chest shows a sternum line and nipples as pad
  landmarks, as in ERC Figs. 8f–8g.
- **Hands:**
  - mittens with a separate thumb in general;
  - compression hands as a dedicated drawn shape: heel of one hand on the lower half of the sternum, the other on top,
    fingers interlaced (ERC Fig. 7, Fig. 8g);
  - hands lifted clear with open palms at "hands off", as in ERC Fig. 8n.
- **Who they are:** an India-relevant cast, with skin tones varied across the three people, chosen from the
  Fitzpatrick 3–5 range and shaded in three bands each.

| Person | Look (proposal) |
|---|---|
| Patient | Middle-aged man (most out-of-hospital arrests), light-blue button shirt, grey trousers, short grey-black hair |
| Rescuer A (compressions) | Woman, green top, hair in a bun |
| Helper B (AED) | Young man, orange T-shirt, short hair |

## 3. How we build them: one skeleton, three renderers

The main cause of the inconsistency is that each style invented its own people. The fix is to make the people data.

**`shared/aed-people.js`** (new, read by every style, like `aed-spec.js`):

1. **The cast:**
   - each person's body measurements (segment lengths and widths at each joint, head size);
   - colours (skin, hair, top, trousers, shoes);
   - hair style and face type.
2. **A skeleton** of about 17 joints in world cm: pelvis, spine, chest, neck, head, and both shoulders, elbows,
   wrists, hips, knees and ankles.
3. **A pose library**, one entry per action in `docs/scene.md`:
   - kneel upright;
   - compress (down and up), breath pause, hands off;
   - shake shoulders, head tilt and chin lift, point;
   - stand, run cycle (4 keys), carry the AED, kneel down;
   - reach to the lid, ON, the pad packet, pad 1, pad 2, the plug and SHOCK;
   - the "Everyone clear!" sweep, swap.

   For the patient: supine, head tilted, shirt open, the shock jerk.
4. **Two-bone arm and leg IK with limits**, so hands land exactly on targets (sternum, buttons, pads) while elbows and
   knees bend naturally. A "locked elbows" constraint applies during compressions.
5. **Posture tests** (`node --test`), so the teaching points are checked, not hoped for:
   - compressing: shoulders within 3 cm horizontally of the hands, and elbow angle ≥ 170° (straight);
   - hands on the lower half of the sternum;
   - knees and shins on the floor when kneeling;
   - nobody touching the patient during ANALYSING, STAND CLEAR and SHOCK;
   - no limb passing through the patient or the AED.

Each style then only draws, or "skins", the shared skeleton:

| Style | How it skins the skeleton |
|---|---|
| **Sketchbook** (2D sketch engine) | Limbs as tapered capsules: two projected end-circles joined by their outer tangents, filled in three tones, inked. Torso, pelvis and head as designed Bezier outlines (a front, side and back variant chosen by facing, then projected). Hair, face, collar, cuffs and shoes are layered shapes. Hands are drawn shapes for mitten, interlaced and open palm. About 400 lines of new code. |
| **Working Model** (iso engine) | Two new solids in the engine: a tapered frustum and an ellipsoid. The torso is a lofted solid with chest and waist cross-sections. Shaded by normal into the four tones. The same pose data. |
| **Turntable** (Three.js) | Procedural: tapered `LatheGeometry` segments parented to `Object3D` joints driven by the same pose data, toon material, inverted-hull outlines, the face as a small CanvasTexture decal, hair as its own mesh. No downloads, and it matches the 2D looks. Fallback if it still looks crude: a CC0 base body (MakeHuman export or Quaternius), posed with bones and `CCDIKSolver`. That costs more (file size, a realistic look that clashes with the 2D styles, rig fiddling), so it is plan B only. |

Assets we will **not** use: unDraw (licence forbids redistribution), Mixamo (raw files can't be redistributed),
Blush (licence varies), Ready Player Me (shut down). Open Peeps and Humaaans (CC0) are front and side views only, so
they are useful as proportion references but cannot be used in the isometric scenes.

## 4. Order of work, with a checkpoint at each stage

Last time the characters were drawn straight into the scenes and never reviewed on their own. This time:

1. **Character sheet first (checkpoint 1).** A standalone page, `docs/characters.html`, showing the three people in
   the Sketchbook style:
   - front, side and isometric turnarounds;
   - the five key poses: supine, kneel upright, compress, hands off, kneel and reach.

   You approve the look (faces, hair, clothes, proportions, skin tones) before anything goes into the scenes.
2. **Sketchbook prototype (checkpoint 2).** Swap the new people into the Sketchbook only. Show it beside the current
   version at the same three moments (Check and call, CPR, Shock). Run the posture tests.
3. **Roll out.**
   - Working Model and Turntable skin the same skeleton. These two can run in parallel, because the data is shared.
   - Turntable's compression posture is fixed by construction.
4. **Full review.** Check every station in all three styles, plus phone close-ups (faces and hands must read when the
   view zooms in), using the existing device checks and run traces. Commit at each checkpoint so every step is in git.

## 5. Decisions for you

1. **Style target:** the ERC 2025 figure language described above (recommended), or something else (rounder and more
   cartoon-like, or more realistic)?
2. **The cast** in the table above: keep it, or change who the three people are?
3. **Turntable:** procedural people that match the 2D styles (recommended), or try a CC0 3D body first?

## Sources

- ERC Guidelines 2025: Adult Basic Life Support. Smyth MA et al. Resuscitation 2025;215:110771: Fig. 7 (posture
  wording), Figs. 8f–8o (figure style, hand position, hands off).
- Shape language and proportion: https://madegooddesigns.com/character-design-basics/ ;
  https://e-university.tu-sofia.bg/e-publ/files/13435_KIN%2723_Ivelina_Daulova_doklad_EN.pdf
- Line of action and posing: https://blog.animschool.edu/?p=75 ;
  https://courses.cs.washington.edu/courses/cse459/10wi/reading/posing.pdf
- Skin tone range: Unicode TR51 (Fitzpatrick modifiers), https://unicode.org/reports/tr51/
- Licences: https://www.openpeeps.com/ (CC0), https://www.humaaans.com/ (CC0), https://undraw.co/license,
  https://quaternius.itch.io/universal-base-characters (CC0),
  https://static.makehumancommunity.org/oldsite/faq/can_i_sell_models_created_with_makehuman.html (CC0 exports)
- Three.js IK: https://threejs.org/docs/pages/CCDIKSolver.html
- The 6.5–7-heads proportion is a judgement from the ERC figures, not a sourced rule.
