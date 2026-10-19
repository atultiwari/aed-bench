# Generated assets

Images generated with Higgsfield (account of Dr. Atul Tiwari) for AED Bench, following docs/assets-plan.md.
Each file lists its model, prompt summary and job id, so it can be traced and regenerated.

| File | What | Model | Job |
|---|---|---|---|
| 01-cast-sheet.png | Cast reference sheet: the patient, Rescuer A, Helper B (front and three-quarter views) | Nano Banana Pro (served as nano_banana_2), 3:2, 2k | 0aa82b87-17ba-468c-acfd-d5aaaa9598fe |
| 02-test-compress.png | Test pose: Rescuer A compressing on the patient, isometric. Style and angle good; hands too high on the chest and shoulders not over the hands | Nano Banana Pro (served as nano_banana_2), 3:2, 2k, ref 01 | 555b5c87-b987-4aae-8811-408eec1db1a0 |
| 02b-test-compress.png | Retry with corrected wording; the model copied the first try (passed as a reference), so the technique is still wrong. Lesson: never pass a flawed image as a reference | Nano Banana Pro (served as nano_banana_2), 3:2, 2k, refs 01 + 02 | 15223261-c2b2-4992-957f-253f2d86066d |
| 02c-test-compress.png | Third try with our posture-tested pose as the reference: technique right, but the camera became a side view | Nano Banana Pro (served as nano_banana_2), refs 01 + pose ref | 380871c1-3e67-45b5-82dc-85013ecfac11 |
| 02d-test-compress.png | Edit of 02 asking to move only the hands: returned unchanged | Nano Banana Pro (served as nano_banana_2), ref 02 | d6e0b95a-a09c-470b-9f0e-f5cd02f37a7c |
| **02e-test-compress.png** | **Accepted.** Correct technique (arms vertical, shoulders over hands, hands on the lower half of the sternum) at the scene's isometric angle | GPT Image 2.5, high, 2k, refs pose ref + 01 | 55549f39-2994-4379-b72e-c028dedd42e6 |
| pose-ref-compress.png | Our posture-tested compression pose (shared/aed-people.js), rendered as the pose and camera reference | rendered locally | Higgsfield media 10f623c2-d025-4a69-af63-34ba51283a6e |

**What works:** render the pose from the shared skeleton (posture-tested), upload it, and ask GPT Image 2.5 to redraw it
with the cast sheet's people and style. Text-only prompts and edits did not fix the technique.
| **03-heart.png** | Heart alone, anterior view, transparent background: SVC into the right atrium, aorta behind the pulmonary trunk with three arch branches, LAA and pulmonary veins at upper right, LAD to the apex, RCA in the right AV groove, apex down and to the patient's left | GPT Image 2.5, high, 2k, transparent, ref 01 | 21483111-c4a3-495f-93ca-45b206eaaa81 |
| **04-chest.png** | The patient, front view, bare chest, transparent background: collarbones, sternal notch, sternum line, costal margins, nipples, navel; arms out so the mid-axillary line shows. Heart and pads are placed on it by code (in the 1/2-scale preview: heart box 245 px at (338, 392); pad 1 centred near (385, 452), against the right sternal border; pad 2 at (604, 610), left mid-axillary line) | GPT Image 2.5, high, 2k, 4:5, transparent, ref 01 | f3fa1b8f-89f5-432f-8b84-a5feb85abe7b |

## Pose sprites (item 4)

Each sprite: a reference rendered from the posture-tested skeleton by `tools/pose-ref.html?sprite=<id>` (in `refs/`),
redrawn by GPT Image 2.5 with the cast sheet (01), then registered by `tools/register_sprite.py` into
`assets/sprites/<id>.webp` and `assets/sprites/sprites.json`.

| Sprite | What | Job |
|---|---|---|
| P1 | The patient on his back, shirt closed (base layer) | f5aea166-4162-4abd-bf3e-50015ba8e285 (ref media c2b91684-a813-4a61-b84a-3cdeb00c0d08) |
| P2 | Head tilt and chin lift: head back, neck extended, chin up, mouth open; body aligned to P1 (overlap 0.96) | 575acc46-9dbc-4297-998c-b7c419daa40d (refs P1 job + media 272164a0-2c1d-4f2c-b965-f82f0908aa48) |
| P3 | Shirt fully open, chest bare from collarbones to belt and to the left lateral chest (pad 2 site); sternum, nipples, rib margin, navel; aligned to P1 | 92a6209f-ed5d-44cf-8cda-20c7ab6e0b57 (refs P1 job, media 5c6e0ffc-2af3-4be4-aad6-ba2e12887fee, chest 04) |
| A1 | Rescuer A kneeling upright beside the chest (far side), hands on thighs, looking at him | 8f558a86-94df-4990-a753-d266543ae195 (ref media 1913ef85-5b0a-4bb4-95ff-34624d89b64a) |
| A2 (first try, separate) | Rescuer A generated alone (with a grey placeholder patient): drawn too upright, so once placed she knelt on his head. **Rejected.** Lesson: anyone who touches the patient must be generated together with him | 7c34d582-7573-49f6-844b-b5ccaba4d4fb |
| **A2c → A2** | Patient and Rescuer A together, shaking the shoulders (ERC Fig. 7 "Response"). Used whole as the station's people layer, replacing P1, aligned to P1 by the legs (overlap 0.89) | 5db1c8c2-1cb4-4ab4-aeb3-f83cd44821ca (ref media 49c5adaa-9756-45c0-ba41-337cfb9e6fa4) |
| A3c-try1 | Head tilt and chin lift, first try: forehead hand lay across his eyes. **Rejected** | f7ae6b65-2de3-499d-8174-dc2e53a9c6e1 |
| **A3c → A3** | Head tilt and chin lift (ERC Fig. 7 "Airway"): hand flat on the forehead at the hairline, fingertips under the point of the chin, head back, mouth open; she bends to his mouth to check breathing. Whole two-person layer, aligned to P1 | e34c504b-719f-45fb-87ba-698040ced12a (ref media e7c39bc7-b7d4-43f2-9a68-857f890ec070) |
| **A4c → A4** | "Get the AED!": kneeling beside the chest, turned toward the patient's feet, pointing at the helper and calling out (ERC Fig. 7 "Send for AED"). Whole two-person layer, aligned to P1. Helper B will stand where she points (upper right of the scene) | 94ee02c3-0a7d-4f37-8585-5db7b0eb3250 (ref media d367e56b-8c69-4c24-aa0c-028f9f2543bb) |
| **A5** (from 02e) | Compressing, arms up: the accepted 02e image, background removed, aligned to P1 by the legs | 55549f39-2994-4379-b72e-c028dedd42e6 |
| **A6** (code) | Compressing, pushed down: A5 with her shoulders lowered 38 px (about 5.5 cm) over hands that stay on the chest, by `tools/make_push_frame.py`; no credits | - |
| **A7c → A7** | Rescue breath (ERC Fig. 7 "Combine rescue breathing"): head tilt kept, nose pinched, chin lifted, lips sealed over his mouth. Edited from A3 so the pose matches; aligned to P1 | 00577086-8ac2-4b16-8f64-3642bc8788de (refs A3 job, media e7c39bc7-b7d4-43f2-9a68-857f890ec070) |
| **A8c → A8** | Hands off while the AED analyses (ERC 2025 "Using an AED": nobody touches the person): kneeling upright, palms raised clear; shirt open, pads drawn by code. Aligned to P3 | 8f36b3d9-27d3-4ede-9ca6-b39c3fb14acf (ref media 3aeb511e-ccb2-4e97-ade2-c092758cf0de) |
| **B1** | Helper B standing beyond the patient's feet, where Rescuer A points in A4, turned to face her | 5e1e9dc6-e1db-42e7-9a6b-62b0da69ba6e (ref media 7a910375-bc98-45a3-913c-dc7a910cd2c5) |
| **B2** | Running off to fetch the AED, frame 1 (stride, seen from behind, heading to the upper right) | fd2c443b-289e-4dcf-aa92-1a4fe4173ac5 (ref media 05c2148f-0b79-40fd-81ee-bf915f029f5c) |
| B3-try1 | Run frame 2, first try: copied B2's stride. **Rejected** | 97b70a21-13c3-40fe-8647-93771743d4be |
| **B3** | Run frame 2 (passing phase, arms swapped); alternates with B2 | d1afa95d-1017-4209-b5e4-b4a254f0019f (ref media 0ad90468-806f-4c61-89f6-01b2bd62ea38) |
| **B4** | Helper B walking back in with the AED (green case, white heart-and-lightning mark, carried by the handle), heading right toward his kneeling spot | a713d8ee-75e1-48d6-94ca-ef4efe91db5a (ref media 288d204f-4f6e-468b-a9dd-65aafc8d16fe) |
| **B5** | Helper B kneeling at the open AED (case, panel, ON and SHOCK buttons, lid open on the floor), fingertip on the orange shock button. The AED is part of this sprite; the page overlays the screen text and button glow | 5caa2f67-0fcf-4a51-aa5a-02f28d26404f (ref media f196872b-6ea2-470b-8985-5c7cf96333cb) |
| **B6c → B6** | Pad 1 placed below the right collarbone while compressions continue (ERC 2025: continue CPR while pads are attached): three people, aligned to P3 | 6f172760-c1c2-4534-a24f-646f7151aaed (ref media 1ba42c2b-e9a3-4ee2-8b2d-64b72ae56d22) |
| **B6d** (code) | B6 with Rescuer A's shoulders pushed down 34 px over fixed hands: the compression frame during pad placement | - |
| **B7c → B7** | Pad 2 placed on the left mid-axillary line below the armpit, helper on the patient's left side, compressions continuing; pad 1 already on. Aligned to P3. Note: Rescuer A's shoes came out as sneakers here | e5a1bc2c-2a39-48e2-a6bf-f50019556e86 (ref media e61f5ae0-b4a2-453f-ab93-8742b04cb667) |
| **B7d** (code) | B7 with Rescuer A's shoulders pushed down 30 px over fixed hands | - |
| **B8** | "Everyone clear!": Helper B kneeling upright at the AED (shock button lit, not yet pressed), palm out toward the patient, calling out and looking along the body. Pairs with A8 (hands off) | 8c4550d6-fc1a-48ed-9eb5-21d37d035c6a (ref media 715b836a-8f80-4de1-aca6-11af4f7b6422) |
| AED (cut) | The open AED cut out of B8 (no helper), drawn when nobody kneels at it; its shock button is covered dark until "shock advised" | from 8c4550d6-fc1a-48ed-9eb5-21d37d035c6a |
| chest.webp, heart.webp | The window images, cropped from 04-chest and 03-heart | - |
| **C17c → C17** | Station 17, CPR resumed after the shock: bare chest, both pads on, hands centred between them, arms straight. Aligned to P3 | f9549058-0254-49a9-a494-ef7c23619e11 (ref media 949b1297-f996-471d-935c-069122029fa0) |
| **C17d** (code) | C17 with her shoulders pushed down 32 px over fixed hands | - |
