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
     * @param {number} root - Base Root MIDI Note Center (e.g. 60 for C)
     * @param {string} style - Stylistic goal configuration
     * @param {number} jazzPerc - Slider value 0-100 indicating jazz density
     * @param {number} outsidePerc - Slider value 0-100 indicating substitution density
     */
    generate(root, style, jazzPerc = 60, outsidePerc = 20) {
        const progression = [];
        const optimizer = new GraphOptimizer();

        // 1. Build a 2D candidates array [barIndex][candidates]
        const candidatesByBar = [];

        for (let b = 0; b < 64; b++) {
            const candidates = [];
            const subBar = b % 4; // loop structures inside a 4-bar unit

            if (subBar === 0) {
                // I chord candidates (Tonic center)
                candidates.push({ root, quality: "maj9", name: `${this.getNoteName(root)}maj9`, type: "tonic" });
                candidates.push({ root, quality: "maj13", name: `${this.getNoteName(root)}maj13`, type: "tonic" });
                // Modal Interchange tonic
                const minRoot = (root + 9) % 12 + 48; // vi relative minor
                candidates.push({ root: minRoot, quality: "min9", name: `${this.getNoteName(minRoot)}min9`, type: "tonic" });
            } else if (subBar === 1) {
                // vi chord candidates
                const viRoot = (root + 9) % 12 + 48;
                candidates.push({ root: viRoot, quality: "min9", name: `${this.getNoteName(viRoot)}min9`, type: "subdominant" });
                candidates.push({ root: viRoot, quality: "min11", name: `${this.getNoteName(viRoot)}min11`, type: "subdominant" });
                // Secondary Dominant of ii
                const secDomRoot = (root + 9) % 12 + 48; // VI7
                candidates.push({ root: secDomRoot, quality: "dom7alt", name: `${this.getNoteName(secDomRoot)}7alt (VI7)`, type: "subdominant" });
            } else if (subBar === 2) {
                // ii chord candidates (Subdominant)
                const iiRoot = (root + 2) % 12 + 48;
                candidates.push({ root: iiRoot, quality: "min7", name: `${this.getNoteName(iiRoot)}min7`, type: "subdominant" });
                candidates.push({ root: iiRoot, quality: "min9", name: `${this.getNoteName(iiRoot)}min9`, type: "subdominant" });
                // IV chord
                const ivRoot = (root + 5) % 12 + 48;
                candidates.push({ root: ivRoot, quality: "maj7sharp11", name: `${this.getNoteName(ivRoot)}maj7#11`, type: "subdominant" });
            } else if (subBar === 3) {
                // V chord candidates (Dominant)
                const vRoot = (root + 7) % 12 + 48;
                candidates.push({ root: vRoot, quality: "dom9", name: `${this.getNoteName(vRoot)}dom9`, type: "dominant" });
                candidates.push({ root: vRoot, quality: "dom13", name: `${this.getNoteName(vRoot)}dom13`, type: "dominant" });

                // Tritone Substitution (bII7alt)
                if (outsidePerc > 15) {
                    const bIIRoot = (root + 1) % 12 + 48;
                    candidates.push({ root: bIIRoot, quality: "dom7alt", name: `${this.getNoteName(bIIRoot)}7alt (Tritone Sub)`, type: "dominant" });
                    candidates.push({ root: bIIRoot, quality: "maj7sharp11", name: `${this.getNoteName(bIIRoot)}7#11 (Tritone)`, type: "dominant" });
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
            const commonBonus = commonTones * 0.15;

            // Tonic-to-Dominant flow alignment bonus
            let syntaxBonus = 0;
            if (chordA.type === "subdominant" && chordB.type === "dominant") syntaxBonus = 0.5;
            if (chordA.type === "dominant" && chordB.type === "tonic") syntaxBonus = 0.6;

            return vlCost + commonBonus + syntaxBonus;
        };

        // 3. Find global path using DP lookahead
        const rawPath = optimizer.findOptimalPath(candidatesByBar, transitionScorer, 4);

        // Map raw chords into progression blocks
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
