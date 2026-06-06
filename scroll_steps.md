# Scroll Steps — Uncanny Doubles Prototype

Draft scroll steps for the two-panel scrollytelling prototype. Each step has:
- **Text**: the prose block visible in the left scroll panel (draft, needs Jay's revision)
- **Visual**: what the right sticky panel should show at this step

Text is adapted from Bolter & Engberg, condensed and shifted from academic register. Treat as draft — Jay will revise voice and wording.

Images marked [PUBLIC DOMAIN] are freely usable. Images marked [RIGHTS: PROTOTYPE ONLY] are fine for private testing but not for publication.

---

## Step 1 — The Uncanny Valley

**Text:**
The uncanny valley is a concept from robotics. In the 1970s, roboticist Masahiro Mori observed that as robots become more human-like, people feel more affinity for them — but only up to a point. A robot that is almost, but not quite, human triggers something else: unease, revulsion, the feeling that something is deeply wrong. Mori called this dip in affinity the uncanny valley. Computer graphics artists adopted the term because they face the same problem: a human figure that is almost, but not quite, real becomes disturbing in exactly this way.

**Visual:**
Mori's uncanny valley graph as an animated SVG. X-axis: human likeness. Y-axis: affinity. The curve animates in — rising, dipping into the valley, rising again. The valley is labeled. No media examples plotted yet.

---

## Step 2 — A Long History of Doubles

**Text:**
The discomfort of the almost-human has deep roots. Before robots and computer graphics, there were literary doubles. Poe's William Wilson, who follows the narrator everywhere knowing his secrets. The portrait of Dorian Gray, aging while its subject stays young. Jekyll and Hyde. Dostoevsky's clerk who encounters his own double on the streets of St. Petersburg. Hoffmann's Olimpia — the mechanical doll mistaken for a woman. These doubles share one quality: they are recognizably human and wrong in ways that cannot be rationalized away.

**Visual:**
A period illustration — an engraving of Hoffmann's Olimpia, or a Victorian doppelganger image. Public domain. Dark, slightly aged in treatment. [PUBLIC DOMAIN — Wikimedia Commons has several Hoffmann illustrations]

---

## Step 3 — Film Inherits the Double

**Text:**
Film inherited this tradition — through direct adaptation and through something deeper. Film is itself a technology of doubling. The train arriving at La Ciotat station in 1896 was a shadow of a train, a moving image on a screen. And yet it looked more convincingly real than any painted or photographed image that came before. The audience knew they were watching a projection. And yet.

**Visual:**
A still from the Lumière brothers' *Arrival of a Train at La Ciotat* (1896). The train approaching, platform crowded with figures. [PUBLIC DOMAIN]

---

## Step 4 — The Myth of La Ciotat

**Text:**
The story goes that when the Lumières first projected this film, the audience panicked — convinced the train would burst through the screen and crush them. Film historians now call this the La Ciotat myth. It probably didn't happen. What the story captures is not stupidity but something real: the astonishment of seeing movement reproduced so convincingly that, for a moment, the gap between image and reality seemed to close.

**Visual:**
Same Lumière still, but the uncanny valley graph from Step 1 reappears — now with an arrow or dot placing film on the rising slope of the far side, approaching but not reaching the top.

---

## Step 5 — What Gorky Saw

**Text:**
The Russian writer Maxim Gorky was among the first to see these films, and his reaction was not astonishment but unease. He saw not a train but a shadow of a train. "Before you a life is surging, a life deprived of words and shorn of the living spectrum of colors — the gray, soundless, the bleak and dismal life. It is terrifying to see, but it is the movement of shadows, only of shadows." What Gorky felt was the gap from the other direction: not almost-too-real, but conspicuously drained of the fullness of lived experience.

**Visual:**
The same Lumière still, now fully desaturated — deep grayscale, contrast lowered. The image feels hollow. Same frame, different world.

---

## Step 6 — The La Ciotat Effect

**Text:**
Tom Gunning distinguishes the La Ciotat myth from the La Ciotat effect. The myth says film can reproduce reality. The effect is the experience of the gap — the pleasurable or anxious awareness that it cannot. No audience watching an IMAX film today is fooled. But they can still be astonished. The gap must exist in order to produce the effect. Film's claim to reproduce reality is asymptotic: always approaching, never arriving. This is not a failure. It is the condition that makes film work.

**Visual:**
The uncanny valley graph, now annotated. Film is plotted on the ascending far slope — clearly climbing, but with a dotted asymptotic line showing it never quite reaches the top. Label: "The La Ciotat Effect."

---

## Step 7 — "No Details, No Character"

**Text:**
In *Invasion of the Body Snatchers* (1956), alien pods grow perfect physical replicas of human beings — ready to replace the originals once they sleep. When the doctor Miles examines an unfinished pod, he describes what it lacks: "It has all the features but no details, no character, no lines." The pod is deep in the uncanny valley. His description is almost identical to what critics said about early CGI human figures decades later: technically accurate, but missing whatever makes a face feel inhabited.

**Visual:**
A still from *Invasion of the Body Snatchers* (1956) — the pod examination scene, or an eerily blank "invaded" character. [RIGHTS: PROTOTYPE ONLY] Alternatively: a simple CSS/SVG face — present but blank, features without expression.

---

## Step 8 — Vertigo: The Double Detected

**Text:**
In Hitchcock's *Vertigo* (1958), Scottie follows a woman he believes to be haunted by the ghost of a dead ancestor. When he later encounters Judy — a different woman who resembles her — he becomes obsessed with remaking her into the lost Madeleine. *Vertigo* is a thriller about doubling, replacement, and a detective's compulsion to close the gap. The film resolves its uncanny hesitation rationally: there is an explanation. But the explanation is itself the most disturbing thing of all.

**Visual:**
A still from *Vertigo* — the hotel room transformation scene (Judy becoming Madeleine, green light), or the spiral staircase. [RIGHTS: PROTOTYPE ONLY]

---

## Step 9 — The Uncanny Is a Feature, Not a Bug

**Text:**
Film never crossed the uncanny valley. Neither has CG, VR, or the metaverse — not really. The astonishment of early cinema audiences at La Ciotat has never gone away; it has only changed its object. The uncanny oscillation between illusion and reality is not a problem to be solved. It is what makes these media compelling. Imagine a future in which photorealistic CG achieves perfect human likeness, indistinguishable from the real. Those figures would be more uncanny than ever. We would still know.

**Visual:**
The uncanny valley graph, now fully populated — early film, color/sound film, CG, VR plotted in sequence along the ascending far slope, each a little higher than the last, none reaching the top. The asymptotic line remains. The valley is still there below.

---

## Notes for Implementation

- Step text runs approximately 80–120 words each — aim to keep it in that range
- The graph (Steps 1, 4, 6, 9) is the visual spine of the piece — treat it as a persistent element that evolves across the scroll rather than appearing fresh each time
- Steps 5 and 6 use the same Lumière image in two states (color/desaturated) — this is intentional, a small repetition-with-difference that performs the argument
- Step 7 could use a generated or abstract face if film stills feel too illustrative
- The Lumière footage itself (1896) is fully public domain and also available as video — consider whether the right panel could use a short looping clip rather than a still
