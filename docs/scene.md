# The scene: what every style draws

All numbers, names, times and notes come from `shared/aed-spec.js` (`window.AED`), which mirrors `docs/spec.md`.
Never retype a station name, time or note in a page: read it from `AED`. Positions below are in `AED.WORLD` (cm;
x = depth toward viewer-right, y = width toward viewer-left, z = up).

## On the floor

A floor patch (a soft grey-green exercise mat on a warm wooden floor works well), seen from the usual isometric corner.

| Thing | Where | Look |
|---|---|---|
| **The person** | supine along y, head at +y (`WORLD.body`) | blue shirt `#5b7fb5`, dark trousers `#4a4f5a`, skin `#c98f6a`, dark hair. Arms along the sides, legs straight. Head turned up |
| **Rescuer A** (compressor) | kneels on the **far** side (x ≈ 56), level with the chest | green top `#4f9a6a`. Faces the viewer. Arms reach to whatever A is doing |
| **Helper B** (AED operator) | stands at the back-right corner at the start; runs off at HELPER; comes back with the AED and kneels on the far side beyond the head (`helperB.kneel`) | orange top `#e08a3a` |
| **AED** | on the floor beyond the head, far side (`WORLD.aed`), arrives with B | green case `#2f9e5b`, white heart-and-lightning mark on the lid, lid hinged at the far edge. Top panel dark grey: a small screen (text from the station's `screen`), round green **ON** button, round orange **SHOCK** button with a lightning mark, a socket for the pad cable |
| **Pads** | in a packet in the lid until BARE CHEST; then `padRight`, `padLeft` | white rectangles with a small grey body pictogram, one grey/orange cable each to the plug |
| **Phone** | on the floor near the head, near side (`WORLD.phone`) | dark slate phone, screen reads **108 / 112** with a speaker mark when the call is on |

Rescuers are simple, friendly figures (no faces needed): rounded bodies, rods or capsules for limbs. Nothing floats:
knees on the floor, hands on what they hold.

## Labels

Each station's `lines` are printed **on its part**: a tape label on the AED's front face for LID, ON, PLUG, SHOCK,
ANALYSING (the AED parts); a small flag or floor tag for SAFE?, HELPER, CALL 108/112, START, NEXT CHECK; a label on the
mat beside the body for SHOULDERS, HEAD + CHIN, CHEST, BARE CHEST, PAD 1, PAD 2, STAND CLEAR (or wherever it reads best
without covering the action). Each has its number badge (`num`). The active one lights up in the accent colour. Both
CHEST stations (7 and 17) are separate stations with their own badges: put them side by side on the mat (7 on the near
side of the chest, 17 just past it), never one label for both.

## What moves, station by station

| Station | Action |
|---|---|
| SAFE? | A's head turns; a dashed scan arc sweeps round the scene |
| SHOULDERS | A's hands on the shoulders, a small shake; speech bubble "Are you all right?" |
| CALL 108/112 | the phone screen lights "108 / 112" with speaker waves; bubble "Ambulance please: collapsed, not breathing normally" |
| HEAD + CHIN | one hand on the forehead, two fingers under the chin, the head tilts back a little; a 10 s ring counts down; bubble "Gasping is not normal breathing" |
| HELPER | B gets a bubble "Get the AED!" and runs off the floor |
| CHEST (7) | A's hands on the lower sternum, arms straight; the chest dips 5-6 cm (draw it visibly, about a third of the chest height) at the rate, with a counter 1-30, then a short "2 breaths" puff at the mouth (or no pause in compressions-only mode). The clock runs faster than real time; show the speed |
| LID | B kneels with the AED (B arrives at the start of this station); the lid swings open |
| ON | the ON button glows; the screen lights; voice bubble from the AED "Attach pads to the patient's bare chest" |
| BARE CHEST | the shirt opens over the chest (skin shows); the pad packet opens. A keeps pushing |
| PAD 1, PAD 2 | each pad travels from the packet to its place; its cable follows |
| PLUG | the connector goes into the socket |
| ANALYSING | A's hands lift clear (a "hands off" mark); the screen reads the station's `screen`; a progress bar fills |
| STAND CLEAR | B's arm sweeps along the body; bubble "Everyone clear!"; the SHOCK button flashes |
| SHOCK | B presses SHOCK; a bright flash runs between the pads; the body gives a small jerk |
| CHEST (17) | straight back to compressions; a 2:00 countdown on the AED screen |
| NEXT CHECK | AED bubble "Stop CPR. Analysing."; A lifts hands; a small swap arrow between A and B |

## The window (right panel)

Two linked parts, drawn from the station's `heart` and `strip` values (blend between states as a step runs):

- **The heart**, front view, cut away: `vf` = chaotic purple-red ripples, no squeeze; `vf+cpr` = the same ripples but
  the heart is squeezed with each push and red/blue blood arrows pulse; `paused-vf` = ripples, arrows fade; `current` =
  a bright yellow band of current along the pad-to-pad line through the whole heart, ripples stop; `stunned+cpr` = a
  still, smooth heart squeezed by pushes, arrows pulse; `stunned` = still. Pads drawn on a faint chest outline
  around the heart once they are on (from PAD 1 / PAD 2), with a dashed pad-to-pad line.
- **The AED strip**, labelled "What the AED is reading": `none` = no AED yet (a muted "AED not here yet"); `blank` =
  flat line; `cpr` = big regular bumps (compression artefact); `vf` = a fine chaotic wiggle; `charge` = vf plus a
  filling charge bar; `spike` = one tall shock spike, then flat; `reading` (NEXT CHECK) = a quiet, low line labelled "analysing again": the figure does not say what the next rhythm is.
- Never draw a normal heartbeat or a pulse returning: the shock stops the chaos; CPR keeps blood moving.

## Readouts every page shows

Scenario clock (`AED.clockAt`, mm:ss of `AED.TOTAL` = 4:37), step n / 7, the active card (number, full `name`, time
in this station "0:42 of 1:30"), compressions given (`AED.compressionsIn`), hands-off time once CPR has started
(`AED.handsOffUntil`). The big idea (`AED.SITE.bigIdea`) and the safety line (`AED.SITE.safety`) sit under the notes;
the sources (`AED.SITE.sources`) behind a small "Sources" disclosure. Each step's `clinician` line shows under its
note, smaller, labelled "For clinicians"; step 5's `more` shows behind More.

## Wrong-order presses

`AED.WHY_NOT[n]` when step n is pressed early. Tapping the chest during ANALYSING shows `AED.HANDS_OFF`.
