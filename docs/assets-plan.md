# Generated assets: the plan

Status: **proposal for review.** Nothing has been generated yet.

## Blender or Higgsfield?

**Blender** is free and gives full control, but it is not the quickest route here:

- Blender MCP is not connected in this session. It would need Blender, the add-on, and a running bridge.
- Someone still has to model, clothe, rig and pose three people and a heart. Blender with an MCP helps with the steps,
  not with the look.
- Free starting bodies (MakeHuman, Quaternius, all CC0) look realistic or generic. Getting them to the friendly
  "guideline illustration" look you want is days of shading and clothing work.

**Higgsfield** is the faster way to that look:

- An image model draws the stylised people directly.
- Its image-to-3D models (Meshy, with auto-rigging) turn an approved character image into a rigged model for the
  Turntable.

The cost is small against your 7,200 credits (prices checked today):

| Item | Model | Credits each |
|---|---|---|
| A character or heart image (2k) | Nano Banana Pro (keeps a character consistent when given a reference image) | 2 |
| A cheaper draft image | GPT Image 2.5 | 0.25 |
| One rigged, textured 3D character | Meshy 7 image-to-3D with rigging | 44 |

**Estimated total: about 300 credits**, including retries, for 2D people, the heart and three rigged 3D people.

## What we need, in order (one at a time, each shown to you before the next)

| # | Asset | Why | Est. credits |
|---|---|---|---|
| 1 | **Cast reference sheet**: the three people, front and three-quarter views, plain white background, in the ERC guideline illustration style | Fixes the look. Every later image uses it as the reference, so the same three people appear everywhere | 2-6 |
| 2 | **One test pose in the scene's camera angle**: Rescuer A compressing on the patient, from the same isometric corner as our floor | Checks the hardest thing early: the camera angle, the scale, and hands meeting the sternum. If this fails, we change approach before spending more | 2-8 |
| 3 | **The heart window**: a front view of the chest with the heart inside, in the same style. Two states: quivering (VF) and still | Replaces the current heart. Pads, current and blood arrows stay as code overlays, so they can animate and stay accurate | 4-8 |
| 4 | **Pose sprites, one by one** (list below) | The figures for every station | 40-80 |
| 5 | **Turntable models**: one A-pose image per person, then image-to-3D with rigging | Real 3D people for the rotating view, posed by bones in Three.js | 140-180 |

**Pose sprites needed for step 4** (all the same isometric angle, transparent background after cut-out):

- **Patient:**
  - lying on his back, shirt closed;
  - head tilted back;
  - shirt open with the chest bare.
- **Rescuer A:**
  - kneeling upright;
  - shaking the shoulders;
  - head tilt and chin lift;
  - pointing, "Get the AED!";
  - compressing, arms up;
  - compressing, arms down;
  - hands off.
- **Helper B:**
  - standing;
  - running (2 frames);
  - walking in with the AED;
  - kneeling at the AED pressing a button;
  - leaning over placing a pad;
  - "Everyone clear!" sweep.

That is 18 images. Some may come out of one sheet image if the model holds the angle well. Two-frame pairs (up and
down, run) give the movement. The AED, lid, pads, cables, phone and floor stay as they are now: they move, and they must
stay exact.

## What happens after each image (my side, no extra credits)

1. **Cut-out:** Higgsfield's background remover (or a local one), then trim to the figure.
2. **Registration:** for each sprite I mark its anchor points (knees on the floor, hands, head) in a small
   `assets/people/sprites.json`. The code then places every sprite at the right spot, at the right scale, and in the
   right drawing order with the patient and the AED.
3. **Size:** convert to WebP at about 2× display size. Each sprite should be roughly 40-120 KB, so a page loads under
   about 2 MB.
4. **Wiring:**
   - **Sketchbook:** the scene draws sprites where the stick figures were. A light ink filter over everything keeps
     one look.
   - **Working Model:** the same sprites, unless you want a separate cleaner set, decided after step 2.
   - **Turntable:** the rigged models from step 5.
5. **Checks:** the existing device checks and run traces, plus a contact sheet of every station for you to review.
6. **Credit and licence:** a note in the README and `THIRD_PARTY_LICENSES.md` that the images were generated with
   Higgsfield under your plan. Please confirm your plan allows publishing them in a public repo.

## Risks

- **Consistency** between images: the reference sheet (step 1) is passed to every later image, which mostly fixes this.
  Expect a few retries per pose.
- **Isometric angle:** image models drift from an exact 30° view. Step 2 tests this. Small mismatches are hidden by
  placing figures by their anchors, not by the image frame.
- **Animation is frame-swapping, not smooth bending.** Compressions alternate two frames. That is normal for
  illustrated teaching figures, but it is not the continuous motion of the code-drawn figures.

## First generation, if you approve

**Item 1, the cast reference sheet.** Nano Banana Pro, 3:2, 2k, one image, **2 credits**. Prompt:

> Flat vector medical illustration in the style of European Resuscitation Council guideline figures: clean thin
> dark-navy outlines, soft flat colours with gentle shading, natural adult proportions, friendly realistic stylised
> faces. Character reference sheet on a plain white background, no text, no labels. Three adults, each shown twice
> (front view and three-quarter view), full body, standing relaxed, same scale, evenly spaced:
> (1) an Indian man about 50, light-blue short-sleeved button shirt, grey trousers, dark shoes, short grey-black hair,
> medium-brown skin;
> (2) an Indian woman about 30, green short-sleeved top, navy trousers, black hair in a bun, deep-brown skin;
> (3) an Indian man about 25, orange T-shirt, blue jeans, short black hair, light-brown skin.
