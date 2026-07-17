// Generative walking basslines using chromatic enclosures, passing tones, and bebop scales
export class WalkingBass {
    /**
     * Calculates the walking bass note for a specific step in a bar
     * @param {Object} chord - Current active chord { notes: [root, 3rd, 5th, 7th], root: MIDI }
     * @param {Object} nextChord - Next chord on deck for resolution
     * @param {number} step - Current step inside the bar (0 to 15)
     * @param {string} style - Walking stylistic profile ('enclosure', 'bebop', 'diminished', 'tritone')
     * @param {number} rootBias - Percentage representing weight of staying close to chord root (0 to 100)
     */
    static generateBassNote(chord, nextChord, step, style = "enclosure", rootBias = 60) {
        if (!chord || !chord.notes || chord.notes.length === 0) return 36; // Default standard C1

        const chordNotes = chord.notes;
        const root = chordNotes[0];

        // Define octave drop for walking bass ranges
        const bassRoot = root - 24;

        // On the downbeat (step 0), always establish structural roots
        if (step === 0) {
            return bassRoot;
        }

        // On step 8 (halfway), establish the perfect fifth or active root
        if (step === 8) {
            const fifth = chordNotes[2] ? chordNotes[2] - 24 : bassRoot + 7;
            return Math.random() * 100 < rootBias ? fifth : bassRoot;
        }

        // Final step of bar (step 15): solve transition to next chord's root with chromatic enclosure
        if (step === 15 && nextChord && nextChord.notes) {
            const targetRoot = nextChord.notes[0] - 24;

            if (style === "enclosure") {
                // Return a half-step above or below the target root (chromatic enclosure)
                return Math.random() > 0.5 ? targetRoot + 1 : targetRoot - 1;
            } else if (style === "tritone") {
                // Approaching via tritone interval (b5 resolution)
                return targetRoot + 6;
            }
        }

        // Mid-beats steps: traverse chord scales using chosen stylistic algorithms
        if (style === "bebop") {
            // Bebop Major scale interval: 0, 2, 4, 5, 7, 8, 9, 11
            const bebopOffsets = [0, 2, 4, 5, 7, 8, 9, 11];
            const stepOffset = bebopOffsets[step % bebopOffsets.length];
            return bassRoot + stepOffset;
        }

        if (style === "diminished") {
            // Half-whole diminished: 0, 1, 3, 4, 6, 7, 9, 10
            const dimOffsets = [0, 1, 3, 4, 6, 7, 9, 10];
            const stepOffset = dimOffsets[step % dimOffsets.length];
            return bassRoot + stepOffset;
        }

        // Fallback default: select chord notes walk (root, third, fifth, seventh)
        const noteIdx = Math.floor((step / 4) % chordNotes.length);
        const selectedNote = chordNotes[noteIdx] - 24;

        return selectedNote;
    }
}

export default WalkingBass;
