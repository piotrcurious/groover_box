// Complete Jazz and Modal Chord Dictionary representing roots, qualities and extensions
export const chordDictionary = {
    "maj7": [0, 4, 7, 11],
    "maj9": [0, 4, 7, 11, 14],
    "maj13": [0, 4, 7, 11, 14, 21],
    "min7": [0, 3, 7, 10],
    "min9": [0, 3, 7, 10, 14],
    "min11": [0, 3, 7, 10, 14, 17],
    "dom7": [0, 4, 7, 10],
    "dom9": [0, 4, 7, 10, 14],
    "dom13": [0, 4, 7, 10, 14, 21],
    "dom7alt": [0, 4, 8, 10, 13, 15, 20], // Altered dominant with flat/sharp extensions
    "dom9b5": [0, 4, 6, 10, 14],
    "m7b5": [0, 3, 6, 10], // Half-diminished
    "dim7": [0, 3, 6, 9],  // Fully diminished
    "maj7sharp11": [0, 4, 7, 11, 14, 18] // Lydian sound
};

import { tuningSystem } from "../microtonal/temperament.js";

/**
 * Returns MIDI note numbers matching a given root and chord type
 * @param {number} root - MIDI note number representing the chord root
 * @param {string} quality - Chord quality string (e.g., 'maj9')
 * @returns {Array<number>} Array of MIDI note numbers
 */
export function buildChord(root, quality) {
    const offsets = chordDictionary[quality] || [0, 4, 7];
    const stepsPerOctave = tuningSystem.getStepsPerOctave();

    // Scale standard 12-TET offsets dynamically to the active temperament's native steps
    return offsets.map(offset => {
        const microtonalOffset = Math.round((offset / 12.0) * stepsPerOctave);
        return root + microtonalOffset;
    });
}

export default chordDictionary;
