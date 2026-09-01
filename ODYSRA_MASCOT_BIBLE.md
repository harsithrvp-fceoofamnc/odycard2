# Odysra Mascot — Character Bible

Written from the official render. Everything here describes **that** character, not a similar one.

---

## The one rule that matters

**You already have him. Stop generating him.**

Almost all drift comes from asking a model to invent the character again. From now on he is
only ever *reproduced* from a master file, never re-created from a description.

So:

1. Keep **one ChatGPT conversation** for the mascot. Forever. A new chat is a new person.
2. **Attach the master render** to every single prompt. Every time, without exception.
3. **Paste the character lock** below, unedited.
4. **Never generate one image at a time** — always a full sheet in a single render.

A single render physically cannot drift. Ten separate renders always will. Nearly every
consistency problem is solved by that one habit.

---

## ⭐ THE CHARACTER LOCK — paste unedited into every prompt

```
CHARACTER LOCK — this is an existing, established character. Reproduce him EXACTLY as in the
attached reference. He must read as the SAME person, not a similar person. Treat every detail
below as fixed and non-negotiable.

STYLE: Stylised low-poly 3D. Clearly visible flat polygonal facets across skin, hair and
clothing — faceted, not smooth, not subdivided. Matte surfaces. Soft physically based render.
NO outlines, NO cel shading, NO 2D illustration, NO photorealism, NO high-poly smoothing.

BUILD: Adult male, slim, upright, approximately 7 heads tall. Narrow shoulders, straight
posture, calm and professional bearing. Slender arms and legs. No muscle definition.

HEAD: Softly rounded polygonal skull. Rounded jaw and chin, no sharp cheekbones. Short
straight neck. Small, simple, low-poly ears sitting level with the eyes.

SKIN: Warm light peach-tan. Lit planes are pale peach, shadowed planes a deeper warm tan.
Faceting is clearly visible across the cheeks, jaw and nose.

NOSE: The defining feature. A prominent straight triangular wedge built from flat planes,
projecting noticeably from the face, with a clean angular tip. It casts a distinct hard-edged
shadow down its right side. Do not soften, shrink or round it.

EYES: Small, solid matte black, rounded-oval, slightly taller than wide. No whites, no pupils,
no highlights, no eyelids. Set wide apart with a full eye-width of space between them.

EYEBROWS: Thick, solid matte black, nearly straight with only the faintest arch. They sit
HIGH on the forehead with a clear visible gap between brow and eye. Same width as the eye below.

MOUTH: Closed, gentle, symmetrical upward smile. A soft muted rose-brown line with a subtle
lower-lip plane beneath it. Warm and calm — never a grin, never teeth, never open unless
specified.

HAIR: Dark chocolate brown, matte, sculpted as ONE solid faceted low-poly mass — never
strands, never layers. Short, neat, with a soft side part on HIS right (viewer's left) and a
slight lift at the front. Clean even hairline. Covers the upper half of the ears. Darker
brown in the shadowed facets, warmer mid-brown on the lit ones.

BASE UNIFORM (unless a different outfit is specified):
· Pure white long-sleeved shirt with a standing mandarin/band collar, centre placket, tucked
  in. Faceted fabric folds, white on lit planes, pale grey in shadow.
· Black belt with a plain rectangular polished silver buckle.
· Near-black charcoal straight-leg trousers with a faint centre crease and faceted folds.
· Plain black low-poly shoes with a simple sole.

LIGHTING: Soft studio key from the upper LEFT, gentle fill, soft-edged shadows. Matte
throughout with almost no specular highlight except a small glint on the belt buckle. Even
and calm — never dramatic, never high contrast.

CAMERA: Straight-on front view, eye level, no perspective distortion, no tilt, fully
symmetrical framing. Sharp focus throughout.

NEVER CHANGE: the nose shape, eye size and spacing, eyebrow height and thickness, hair mass
and part direction, skin tone, jaw shape, body build, or head-to-body ratio. These are the
character.
```

---

## Step 1 — make a proper master file first

Your current render is on a **black background**, which is the wrong master. Cutting him out
of black leaves dark fringing exactly where it hurts most: hair edges, trousers, shoes.

Regenerate him once, like this:

```
[CHARACTER LOCK]

Reproduce this exact character, full body, front view, standing straight, arms relaxed at his
sides with hands visible and open.

Background: plain pure WHITE, completely empty, evenly lit, no shadow on the background,
no floor, no props, no text.

Generous even margin on all sides. Ultra sharp, 2048px.
```

Two changes from what you have, both deliberate: **white background** so he cuts out cleanly,
and **arms at his sides** instead of behind his back — because hands behind the back can never
hold a cloche, a tiffin tray or a ramen bowl, and your whole concept depends on him holding
things.

Save that file as `mascot_master.png`. It is the source of truth. Attach it to everything.

---

## Step 2 — three sheets, three renders, done

### Sheet A — the outfits

```
[CHARACTER LOCK]

ONE image. This same character shown FOUR times, standing in a row on a plain white
background. Identical face, identical height, identical pose, identical lighting in every
cell. ONLY the layer worn over the base uniform and the held prop change:

1. Deep maroon waistcoat over the white shirt, maroon bow tie. Holding a silver domed cloche.
2. Cream kurta with a gold-bordered angavastram over his left shoulder. Holding a steel
   tiffin tray.
3. Black apron over the white shirt, sleeves rolled to the elbow. Holding a burger basket.
4. Deep green mandarin-collar jacket with red trim. Holding a ramen bowl.

The same man in all four. Do not alter his face, hair, build, height or expression.
```

### Sheet B — the poses (his AI states)

```
[CHARACTER LOCK]

ONE image. This same character in a 3x2 grid on a plain white background, wearing the base
white shirt and black trousers in every cell. Identical face, identical lighting, identical
size and distance in every cell. ONLY the body pose changes:

1. IDLE — standing, right hand raised in a warm wave
2. THINKING — right hand to his chin, eyes glancing upward
3. PRESENTING — one arm extended toward the viewer, palm open, offering
4. APOLOGETIC — small shrug, both palms turned up, slightly sheepish
5. CELEBRATING — both arms raised, delighted
6. POINTING — pointing down and to his right

Same man, same outfit, same lighting throughout. Only the pose differs.
```

### Sheet C — the mouths (for talking)

```
[CHARACTER LOCK]

ONE image. This same character's HEAD AND SHOULDERS ONLY, in a 3x2 grid on a plain white
background. The head must be at the EXACT same position, size, angle and distance in every
cell, as though the camera never moved and only the mouth was re-sculpted:

1. closed, gentle smile
2. slightly open, "ah"
3. wide open, "oh"
4. narrow and stretched, "ee"
5. small and rounded, "oo"
6. closed, warm smile

Do not rotate, shift, rescale or re-light the head between cells.
```

Three renders. That's his entire system.

---

## Step 3 — the crops you'll actually need in the app

From the master and sheets, export:

| Crop | Where it's used | Notes |
|---|---|---|
| Full body | Landing / arrival screen | Transparent PNG |
| Waist up | App hero, greeting | Face reads far bigger on a phone |
| Head + shoulders | Chat avatar beside messages | The workhorse |
| Circular head | Tiny avatar, favicon | 64px |

Full-length figures read as a thin sliver in a 440px phone column with a tiny face. **Waist-up
is what you want on screen most of the time.**

Export everything as WebP, keep the hero under ~150KB, and lazy-load anything below the fold —
your fest crowd will all be on campus 4G at once.

---

## When it still drifts

Correct it *inside the same conversation*, naming the specific failure. This works far better
than starting over:

- *"The nose changed — it must be a prominent straight triangular wedge with a hard-edged
  shadow down its right side. Look at the reference again."*
- *"The eyebrows dropped. They sit high on the forehead with a clear gap above the eyes."*
- *"The hair is wrong — one solid faceted mass parted to his right, not layered strands."*
- *"He's taller in cell 3. Every cell must share the same height and head-to-body ratio."*
- *"Too smooth. The facets must stay clearly visible — low-poly, not subdivided."*

---

## The honest limit

All of this gets you to roughly 90% consistency. Good enough for the fest. Not good enough
forever, if he's going to be Odysra's face across every restaurant you sign.

The permanent fix is to **have him modelled and rigged once** — Blender for 3D, or Rive for
animation. Around ₹5,000–15,000 on Fiverr or Upwork. After that he is identical *by
definition*: pose him infinitely, animate him properly, swap outfits as separate meshes, export
any crop at any resolution, and the files are a fraction of the size.

You already have the perfect reference to hand an artist. The prompts above get you through the
fest; the rig is what turns him into a company asset.

---

## One last thing

**Give him a name.** Right now he's "the mascot" — a graphic. A name makes him a character, and
characters are what people remember, screenshot and talk about. It costs nothing and it's the
difference between a logo and Duolingo's owl.
