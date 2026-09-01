# Scoop Stacker — Pixar-Style Art Spec

## The idea behind this version

Stacking identical domes looks wrong, because that's not how ice cream behaves. In a real
stack every scoop plays a **different role depending on where it sits**:

- the **top** scoop has nothing pressing down, so it keeps a full rounded crown
- a **middle** scoop is squeezed between two others — flat above, flat below, bulging at the
  sides, with a soft creamy lip pushed out where it's compressed
- the **bottom** scoop drapes over the rim of the cone and spreads

So instead of one dome repeated up the tower, each flavour gets **three shapes**. Stack them
and it reads as one continuous, heavy, soft column of ice cream — not a pile of balls.

Falling and splat states are dropped, as agreed. **Three states × four flavours = 12 scoop
images.**

> **On outlines:** words like *vector*, *illustration*, *cartoon*, *2D* and *game asset* drag
> image models into sticker art, which comes with black outlines built in — and "no outlines"
> won't undo it. This spec never describes a drawing, only a **render**: subsurface
> scattering, softboxes, Redshift, PBR. Those words only exist in 3D, so the model has
> nowhere to land but the Pixar look.

**Generate everything in ONE ChatGPT session** so the style carries across.

---

## ⭐ STYLE BIBLE — paste at the top of every prompt

```
STYLE BIBLE — apply to every asset in this set:

Stylised 3D prop render at Pixar feature-animation quality. The appeal, warmth and material
believability of Pixar production art — think the food props in Inside Out, Ratatouille and
Soul. Materials behave realistically, but forms are gently exaggerated for charm, softness
and instant readability.

RENDERING: Physically based 3D render, Cinema 4D with Redshift / Octane. Ray-traced global
illumination, soft ambient occlusion settling into crevices, accurate soft shadows.
LIGHTING: Warm three-point studio setup — large key softbox from the upper left, a cool
subtle rim light from the back right to separate the silhouette, gentle bounce fill from
below. Appetising and inviting, never harsh, never flat.
MATERIALS: Strong subsurface scattering so light genuinely penetrates and glows through the
body. Fine micro-surface detail. Soft specular roll-off, never hard plastic shine.
FORM: Rounded, generous, tactile, squeezable silhouettes with softly bevelled edges.
Nothing sharp, nothing brittle, nothing geometric, nothing rigid.
CAMERA: Orthographic side-on elevation, lens exactly at the object's mid-height, zero
perspective distortion, sharp focus throughout — no depth-of-field blur.

ABSOLUTELY NOT: line art, ink outlines, black contour strokes, cel shading, toon shader,
flat vector, sticker, clip art, 2D illustration, clay, plasticine, low-poly, pixel art,
text, watermark, logo, background scenery, props, hands, people, plates, bowls.

OUTPUT: One object, centred, pure transparent background, generous even margin, square
canvas, ultra-sharp at 2048px.
```

---

# PART 1 — THE SCOOPS

| State | Where it's used | The shape |
|---|---|---|
| **A · Crown** | The swinging scoop, and whichever scoop is currently on top | Full rounded dome, flat base |
| **B · Middle** | Every scoop with another one resting on it | Flat top and bottom, bulging sides |
| **C · Base** | The single scoop sitting on the cone | Draped and spreading over the rim |

Do **all three strawberry states first**. Only once those look right and match each other
should you move on to the other flavours.

---

### STATE A — Crown

```
[STYLE BIBLE]

SUBJECT: A single scoop of premium ice cream, side-on, resting with nothing on top of it —
the crowning scoop of a stack.

FORM: A full, generously rounded dome, wider than tall, roughly a 5:2 width to height ratio.
The crown is smooth, plump and confident, swelling up and over. The sides curve down and
tuck slightly inward toward the base. The lower edge carries a gentle organic scalloped
ripple where the ice cream has spread softly under its own weight — creamy and rounded,
never spiky. The very bottom edge is flat and level so it seats cleanly on the scoop below.
It should look soft enough to squeeze.

MATERIAL: Dense, freshly churned premium gelato. Strong subsurface scattering so the key
light glows warmly through the upper rim of the dome. Fine creamy churn texture catching
the light across the surface. A whisper of cold sheen, the faintest frost at the base.

COLOUR: STRAWBERRY — a saturated, confident, fruity pink. Deep and rich rather than pale
or pastel, with naturally cooler shadow tones falling to the lower right.
```

---

### STATE B — Middle ⭐ *this is the one that fixes the stacking*

```
[Same session, so the look carries over]

Exactly the same strawberry scoop — identical material, lighting, camera and colour — but
now compressed in the MIDDLE of a stack, bearing the full weight of the scoops above it.

FORM — this is the important part:
· Squashed vertically to roughly 72% of the crown's height, and spread wider to compensate,
  so it clearly reads as the same volume of ice cream being squeezed, not a smaller scoop.
· The TOP surface is broad and flat, with a shallow saucer-like depression across the middle
  — the soft cradle the scoop above nestles down into. No dome on top at all.
· The BOTTOM surface is equally broad and flat, seating solidly on the scoop beneath.
· The SIDES bulge convincingly outward — the displaced volume has to go somewhere. Widest
  at the mid-height, curving gently back in toward both the top and bottom edges.
· A soft creamy lip flares out all the way around the upper edge, where the ice cream has
  been squeezed out sideways under the pressure.
· The lower edge keeps its gentle scalloped ripple, now pushed wider and flatter.

It must read as heavy, cold, soft and genuinely compressed — a squeezed cushion of ice
cream, not a disc. Still one clean object on a transparent background.
```

---

### STATE C — Base

```
Exactly the same strawberry scoop again — identical material, lighting, camera and colour —
now sitting as the lowest scoop, pressed down onto the rim of a waffle cone.

FORM:
· Compressed vertically to roughly 78% of the crown's height.
· The TOP surface is broad and flat with the same shallow saucer depression for the scoop
  above to nestle into.
· The BOTTOM is where it differs: the ice cream drapes softly down and outward over the
  cone's rim, with a gentle rounded skirt flaring out all the way around, as though it has
  been pressed down and has slumped over the edge.
· The sides bulge outward, widest low down, near the skirt.
· Two or three soft creamy drips begin to run down from the underside of the skirt — short,
  rounded, just starting, not long runs.

Warm, generous, and appetising — the moment ice cream settles onto a fresh cone.
```

---

### Now the other three flavours

Once all three strawberry states look right, send these **one message at a time**:

```
Re-render all three states — Crown, Middle and Base — keeping the form, lighting, camera
and material absolutely identical. Change ONLY the flavour to:

VANILLA — warm ivory cream, softly golden and buttery, with fine vanilla bean flecks
scattered through the body.
```

Then, separately:

```
CHOCOLATE — deep glossy cocoa brown, dark and rich, with warm reddish undertones glowing
through where the key light scatters into the surface.
```

```
MANGO — vivid sunny mango orange, tropical and luminous, glowing warmly where the light
passes through, like ripe Alphonso pulp.
```

> **Check as you go.** At the end, ask:
> *"Show me all four flavours in the Middle state side by side in one image."*
> They must look like the same scoop in four colours. Re-roll any that drift.

---

### Optional but worth it — a second Middle variant

If every middle scoop is pixel-identical, a tall tower starts to look mechanical. One extra
shape per flavour breaks it up nicely:

```
Another Middle-state scoop, same flavour, same compression and lighting — but vary the
silhouette slightly: shift the scalloped ripple to a different rhythm, make one side bulge a
touch more than the other, and offset the creamy lip so it flares more on the left. Same
volume, same height, just a different natural variation.
```

I'll alternate between the two as the tower builds.

---

# PART 2 — THE CONE

```
[STYLE BIBLE]

SUBJECT: An empty waffle cone, side-on, tapering downward to a softly rounded point,
standing as the foundation of a stack.

FORM: A clean tapering cone — sturdy and slightly stout rather than long and elegant, so it
reads as a stable base — with a softly rounded tip. The top rim is level and finished with
a gently rolled, thickened lip for the base scoop to press down onto.

MATERIAL: Real baked waffle cone. A crisp diagonal lattice pressed into the surface, the
grid following the taper and genuinely embossed — raised ridges catching the key light,
soft ambient occlusion settling into the recesses. Subtle irregular baking variation, a
touch darker and toastier where the edges caught more heat. Slightly porous, crisp,
appetising.

COLOUR: Warm golden-brown, honeyed and freshly baked, deepening toward the tip.

PROPORTION: About 3:4 width to height.
```

---

# PART 3 — THE REST

### Cherry (crown for a high score)

```
[STYLE BIBLE]

SUBJECT: A single glossy maraschino cherry with a slender curved stem, side-on.

FORM: A plump, appealing sphere with a soft dimple where the stem meets the fruit. The stem
curves elegantly upward with a natural bend.

MATERIAL: Wet, glossy, candied surface with a sharp specular highlight upper-left and rich
subsurface scattering glowing deep red through the body. The stem is matte and fibrous.

COLOUR: Deep glossy crimson, jewel-like. Stem in muted natural green-brown.

The base sits flat so it seats cleanly on top of a scoop.
```

### Sprinkles (the "Perfect!" celebration burst)

```
[STYLE BIBLE]

SUBJECT: Twelve individual sugar sprinkles arranged in a loose grid on a transparent
background, each clearly separated with empty space around it.

FORM: Small elongated capsules with softly rounded ends at varied natural angles, plus a
few small spheres. Slightly irregular, as real sprinkles are.

MATERIAL: Glossy candy shell, bright specular highlight on each, soft subsurface glow.

COLOURS: A cheerful mix — strawberry pink, golden caramel, pistachio green, sky blue,
cream, crimson.

Each must stay crisp and readable when scaled down to 24 pixels.
```

### Background

```
[STYLE BIBLE — except this asset is full-bleed, NOT transparent]

SUBJECT: A vertical 1080x1920 background for an ice cream stacking game.

An infinite soft studio backdrop — a seamless cyclorama with no horizon line, no corners,
no visible surfaces. A smooth warm gradient from pale blush pink at the top down to a
deeper dusty rose at the bottom. Soft volumetric light falling from the upper left, a very
gentle warm vignette at the edges, a faint dreamy bloom.

CRITICAL: this sits behind the gameplay tower, so the central vertical third must stay
almost empty, soft and low-contrast so brightly coloured scoops read clearly against it.
Atmospheric and premium, never busy. No objects, no scenery, no pattern, no texture noise.
```

### App / share icon

```
[STYLE BIBLE]

SUBJECT: A mobile game app icon, 1024x1024, on a rounded-square canvas filled with a smooth
diagonal gradient from deep maroon to lighter raspberry.

CENTRED: A stack of three ice cream scoops — strawberry pink, vanilla cream, chocolate
brown — balanced on a golden waffle cone, topped with a single glossy cherry.

The tower leans very slightly off-vertical, playfully, suggesting balance and delicious
risk. Dramatic warm key light from the upper left, a soft contact shadow grounding the
stack, a gentle glow behind it.

Generous padding around the mark. No text anywhere. Instantly readable at 48 pixels.
```

---

## Checklist — 16 images

**Scoops (12)**

- [ ] Strawberry — Crown, Middle, Base
- [ ] Vanilla — Crown, Middle, Base
- [ ] Chocolate — Crown, Middle, Base
- [ ] Mango — Crown, Middle, Base

**Everything else (4)**

- [ ] Waffle cone
- [ ] Cherry
- [ ] Sprinkle sheet
- [ ] Background
- [ ] App icon

*(Optional: a second Middle variant per flavour — 4 more.)*

**File names** — makes wiring them up instant:

```
scoop_strawberry_crown.png    scoop_strawberry_middle.png    scoop_strawberry_base.png
scoop_vanilla_crown.png       scoop_vanilla_middle.png       scoop_vanilla_base.png
scoop_chocolate_crown.png     scoop_chocolate_middle.png     scoop_chocolate_base.png
scoop_mango_crown.png         scoop_mango_middle.png         scoop_mango_base.png
cone.png    cherry.png    sprinkles.png    bg.png    icon.png
```

---

## Fixing bad output

- **An outline appeared** →
  *"There's a dark contour line around the edge. Remove it completely — this is a 3D render
  lit by studio softboxes, so edges must be defined by light and shadow falloff alone, never
  by a drawn line."*
- **The Middle state still looks domed** →
  *"The top is still rounded. It must be completely flat and broad with a shallow dish in the
  centre — another scoop is resting on it and pressing it down."*
- **It went flat or cartoonish** →
  *"Too illustrative. Push it toward a physically based 3D render — real subsurface
  scattering, real soft shadows, real material response. Pixar prop quality."*
- **The states don't match** →
  *"This doesn't match the previous scoop. Same form, lighting, camera and material — change
  only the compression."*
- **Background came out white instead of transparent** → send it anyway, I'll cut it out.

---

## What I'll do in code once you send these

**Swap states automatically.** The moment a scoop stops being the top of the tower it
switches from Crown to Middle, and the bottom one uses Base on the cone. You'll never see two
domes stacked.

**Overlap the joins.** I'll seat each scoop a few pixels into the one below so the seam reads
as continuous ice cream rather than a visible gap.

**Handle trimming.** As the tower narrows, scoops get trimmed to arbitrary widths — a fixed
image would visibly stretch. I'll slice each scoop into a left cap, a repeating middle and a
right cap so it squeezes to any width without distorting. Just keep them wide (5:2) and don't
crop them tight.
