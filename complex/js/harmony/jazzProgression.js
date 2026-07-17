// Generative Jazz progression engine with dynamic path-finding lookahead
import { buildChord } from "./chordDictionary.js";
import { GraphOptimizer } from "../math/optimizer.js";

export class JazzProgression {
    constructor() {
        this.noteNames = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];
    }

    getNoteName(midiVal) {
        return this.noteNames[midiVal % 12];
    }

    /**
     * Dynamically plans and generates a full 64-bar jazz chord progression
     * with long-range structural planning (modulation, tension arcs, and turnarounds).
     * @param {number} root - Base Root MIDI Note Center (e.g. 60 for C)
     * @param {string} style - Stylistic goal configuration
     * @param {number} jazzPerc - Slider value 0-100 indicating jazz density
     * @param {number} outsidePerc - Slider value 0-100 indicating substitution density
     * @param {Object|null} inputChord - Optional fixed initial chord {root: number, quality: string}
     * @param {Object|null} outputChord - Optional subsequent target chord {root: number, quality: string}
     */
    generate(root, style, jazzPerc = 60, outsidePerc = 20, inputChord = null, outputChord = null) {
        const progression = [];
        const optimizer = new GraphOptimizer();

        // 1. Build a 2D candidates array [barIndex][candidates]
        const candidatesByBar = [];

        for (let b = 0; b < 64; b++) {
            const candidates = [];
            const subBar = b % 4; // micro-structure loop inside a 4-bar unit
            const section = Math.floor(b / 16); // 0: A1 (Exposition), 1: A2 (Modulation), 2: B (Outside/Modal), 3: A3 (Turnaround/Resolution)

            // Calculate section-specific base keys
            let localRoot = root;
            if (section === 1) {
                // Modulate up a perfect fourth (Subdominant modulation - classic jazz/pop standard structure)
                localRoot = (root + 5) % 12 + 48;
            } else if (section === 2) {
                // Modulate to the relative minor / modal shift (Darker section)
                localRoot = (root + 9) % 12 + 48;
            }

            if (b === 0 && inputChord) {
                candidates.push({
                    root: inputChord.root,
                    quality: inputChord.quality,
                    name: `${this.getNoteName(inputChord.root)}${inputChord.quality} (Input)`,
                    type: "tonic"
                });
            } else if (subBar === 0) {
                // I chord candidates (Tonic center)
                candidates.push({ root: localRoot, quality: "maj9", name: `${this.getNoteName(localRoot)}maj9`, type: "tonic" });
                candidates.push({ root: localRoot, quality: "maj13", name: `${this.getNoteName(localRoot)}maj13`, type: "tonic" });

                if (jazzPerc > 50) {
                    candidates.push({ root: localRoot, quality: "maj7sharp11", name: `${this.getNoteName(localRoot)}maj7#11 (Lydian)`, type: "tonic" });
                }

                // Modal Interchange tonic from parallel minor
                if (style === "dark" || outsidePerc > 30) {
                    const minRoot = localRoot;
                    candidates.push({ root: minRoot, quality: "min9", name: `${this.getNoteName(minRoot)}min9 (Parallel Minor)`, type: "tonic" });
                }
            } else if (subBar === 1) {
                // vi / secondary dominant candidates (Tension building)
                const viRoot = (localRoot + 9) % 12 + 48;
                candidates.push({ root: viRoot, quality: "min9", name: `${this.getNoteName(viRoot)}min9 (vi)`, type: "subdominant" });
                candidates.push({ root: viRoot, quality: "min11", name: `${this.getNoteName(viRoot)}min11`, type: "subdominant" });

                // Secondary Dominant of ii (VI7alt)
                if (jazzPerc > 40) {
                    const secDomRoot = (localRoot + 9) % 12 + 48; // VI7
                    candidates.push({ root: secDomRoot, quality: "dom7alt", name: `${this.getNoteName(secDomRoot)}7alt (VI7)`, type: "subdominant" });
                }
            } else if (subBar === 2) {
                // ii chord candidates (Subdominant)
                const iiRoot = (localRoot + 2) % 12 + 48;
                candidates.push({ root: iiRoot, quality: "min7", name: `${this.getNoteName(iiRoot)}min7 (ii)`, type: "subdominant" });
                candidates.push({ root: iiRoot, quality: "min9", name: `${this.getNoteName(iiRoot)}min9 (ii)`, type: "subdominant" });

                // half-diminished ii chord for minor-mode jazz flavor
                if (style === "dark" || jazzPerc > 60) {
                    candidates.push({ root: iiRoot, quality: "m7b5", name: `${this.getNoteName(iiRoot)}m7b5 (iiø)`, type: "subdominant" });
                }

                // IV chord
                const ivRoot = (localRoot + 5) % 12 + 48;
                candidates.push({ root: ivRoot, quality: "maj7sharp11", name: `${this.getNoteName(ivRoot)}maj7#11 (IV)`, type: "subdominant" });
            } else if (subBar === 3) {
                // V chord candidates (Dominant)
                const vRoot = (localRoot + 7) % 12 + 48;

                // Traditional or Altered Dominant
                if (outsidePerc > 40 || style === "progressive" || style === "experimental") {
                    candidates.push({ root: vRoot, quality: "dom7alt", name: `${this.getNoteName(vRoot)}7alt (V7alt)`, type: "dominant" });
                    candidates.push({ root: vRoot, quality: "dom9b5", name: `${this.getNoteName(vRoot)}9b5 (V7b5)`, type: "dominant" });
                } else {
                    candidates.push({ root: vRoot, quality: "dom9", name: `${this.getNoteName(vRoot)}dom9 (V9)`, type: "dominant" });
                    candidates.push({ root: vRoot, quality: "dom13", name: `${this.getNoteName(vRoot)}dom13 (V13)`, type: "dominant" });
                }

                // Tritone Substitution (bII7alt)
                if (outsidePerc > 15 || style === "progressive" || style === "experimental") {
                    const bIIRoot = (localRoot + 1) % 12 + 48;
                    candidates.push({ root: bIIRoot, quality: "dom7alt", name: `${this.getNoteName(bIIRoot)}7alt (bII7 Tritone)`, type: "dominant" });
                    candidates.push({ root: bIIRoot, quality: "maj7sharp11", name: `${this.getNoteName(bIIRoot)}7#11 (bII)`, type: "dominant" });
                }

                // End of progression (Bar 64): High tension turnaround chord to loop back to the start root
                if (b === 63) {
                    const turnaroundRoot = (root + 11) % 12 + 48; // bVII or viio
                    candidates.push({ root: turnaroundRoot, quality: "dim7", name: `${this.getNoteName(turnaroundRoot)}dim7 (Turnaround)`, type: "dominant" });
                }
            }

            candidatesByBar.push(candidates);
        }

        // 2. Score transitions: Optimize for voice leading distances & shared pitches
        const transitionScorer = (chordA, chordB) => {
            const notesA = buildChord(chordA.root, chordA.quality);
            const notesB = buildChord(chordB.root, chordB.quality);

            // Voice leading distance cost mapping
            const vlCost = GraphOptimizer.computeVoiceLeadingCost(notesA, notesB);

            // Common tone multiplier bonus
            let commonTones = 0;
            const setA = new Set(notesA.map(n => n % 12));
            for (const n of notesB) {
                if (setA.has(n % 12)) commonTones++;
            }
            const commonBonus = commonTones * 0.25; // Boosted common-tone weight

            // Tonic-to-Dominant flow alignment bonus
            let syntaxBonus = 0;
            if (chordA.type === "subdominant" && chordB.type === "dominant") syntaxBonus = 0.6;
            if (chordA.type === "dominant" && chordB.type === "tonic") syntaxBonus = 0.8;

            return vlCost + commonBonus + syntaxBonus;
        };

        // If outputChord is provided, append as 65th target node to guide transition voice leading
        if (outputChord) {
            candidatesByBar.push([{
                root: outputChord.root,
                quality: outputChord.quality,
                name: `${this.getNoteName(outputChord.root)}${outputChord.quality} (Output Target)`,
                type: "tonic"
            }]);
        }

        // 3. Find global path using DP lookahead
        const rawPath = optimizer.findOptimalPath(candidatesByBar, transitionScorer, 4);

        // Map raw chords into progression blocks (only take the first 64 elements)
        for (let b = 0; b < 64; b++) {
            const chordMeta = rawPath[b] || candidatesByBar[b][0];
            const notes = buildChord(chordMeta.root, chordMeta.quality);

            progression.push({
                root: chordMeta.root,
                quality: chordMeta.quality,
                name: chordMeta.name,
                notes: notes,
                type: "base"
            });
        }

        return progression;
    }
}

export const jazzProgression = new JazzProgression();
export default jazzProgression;
