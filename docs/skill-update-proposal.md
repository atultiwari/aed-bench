# Proposed updates to the Pradarshan skill (for review)

Lessons from building AED Bench. **Nothing has been applied to the skill yet.** Mark each item keep / change / drop.

## 1. `SKILL.md` and `references/spec.md`: check people before scenes

- If the figure has people, add a step between the spec and the build: a character sheet (cast and key poses) that
  the user approves first. Last time the characters were rejected only after all three pages were built.
- Say plainly that code-drawn people (tubes and balls, even with faces and clothes) don't reach a teaching-illustration
  standard. Machines and benches are fine in code; people are not.

## 2. Choose the image source at the start (new)

Everything before and after generation stays the same; only the generate step changes. Ask once per project:

| Source | Who presses "generate" | Cost |
|---|---|---|
| Paid tool connected to Claude (e.g. Higgsfield) | Claude | Credits; check the price before each image |
| Manual, free (ChatGPT, Gemini or any image chat) | The user | Free, within those apps' daily limits |
| Code-drawn | Nobody | Free; lower quality for people |

- **A prompt pack is always written first**, one folder per image (`assets/generated/requests/<id>/`):
  - `ref.png`: the pose reference;
  - `cast.png`: the approved cast sheet;
  - `prompt.txt`: the exact prompt;
  - `README.txt`: which app to use, the 3:2 aspect ratio, a plain white background, and the path to save the result
    to (`assets/generated/<id>.png`).

  With a paid tool the pack is sent automatically. With the manual route the user pastes it in, downloads the result
  and says "<id> is in". Switching source mid-project costs nothing.
- **Background removal always runs:**
  - white-key flood fill from the edges;
  - a pass that removes large enclosed white areas (the gap between arms);
  - edge clean-up.

  Ask every source for a plain white background, because Gemini cannot make transparent images.
- **Alignment fits by outline**, so the image size from any app doesn't matter.
- **Consistency:** attach the cast sheet every time. Expect more retries with Gemini on faces.
- **Log:** record the source app, date and prompt. Record the job id too when there is one.
- **Effort, for about 25 images:**
  - manual: 1–2 minutes of the user's time per image, so 45–60 minutes;
  - Higgsfield: about 75 credits (about 2.75 per high-quality image, about 3 per pose with retries).

## 3. New guide, `references/illustrated-people.md`: the method that worked

- Draw each pose from a posture-tested skeleton (`shared/aed-people.js` and its tests), render it in the scene camera
  as the pose reference, then have the model redraw it in the cast sheet's style. Text-only prompts and "edit just
  the hands" did not fix the technique.
- Anyone touching the patient is generated together with them. The rescuer alone ended up kneeling on his head.
  The two-person image replaces the patient sprite for that station and is aligned by his legs.
- Never pass a flawed image as a reference; the model copies the flaw.
- Generate one image at a time and check each against the guideline before showing it. Real errors were caught three
  times: hands too high on the chest, a hand over the eyes, and a run frame copied from the previous one.
- Use a fixed 3:2 frame per sprite, so the image maps back to the scene by scale alone.
- Make small motions in code: the compression "down" frame compresses the upper body over fixed hands; no second
  generation.
- Make small variants by editing an approved image (B5 to ON-press to idle) so pose and framing stay identical.

## 4. `references/review.md`: new checklist items

- Every overlay (station ring, bubble, pads, shock flash, cables, timer) is anchored to points measured on the
  picture itself (sprite grid), never to an older code model. Otherwise the pads end up on the head.
- No enclosed background inside a sprite, no light halos at its edges.
- Every button press is the right button for that station (the helper pressed SHOCK at "switch on").
- Device states fit the moment (the AED screen was lit before switch-on).
- On phones, the close-up follows the same focus point as the ring, and the ring keeps a readable minimum size.
- Review every station at several moments, zoomed in. Device checks and run traces pass even when the picture is
  wrong.

## 5. Engine fixes

- `sketchbook-engine.js`: keep the paper-grain filter inside drawn shapes. As it is, it puts a pale halo around
  embedded images.
- Rename or document the engine's one-letter globals (`S`, `P`, `C`, `L`): they clash with page and tool scripts.

## 6. New scripts in `scripts/`

- `pose-ref.html`: renders pose references, with fixed or fitted frames, a mask mode and props.
- `register_sprite.py`: registers single figures (uniform scale, feet on the floor, or alignment to another sprite).
- `extract_layer.py`: registers two-person images, aligned by the legs.
- `make_push_frame.py`: makes the compression frame.
- `defringe.py` plus the enclosed-white cleanup.
- `sprite_grid.py`: grids a sprite in scene units for measuring anchor points.
- `trace-run.mjs`: a forward-only trace of the active station over a full run.

## 7. Process notes

- For clinical figures, medical accuracy comes first: regenerate as often as needed, and show a result only after
  checking it against the guideline.
- If guideline sites block scripted downloads, use official PDF mirrors and cite figure and section numbers.

## 8. Worked example

- Add AED Bench as a second example next to H&E. It covers people, the two-person method, the illustrated window and
  medically checked poses.
