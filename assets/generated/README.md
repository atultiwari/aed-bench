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
