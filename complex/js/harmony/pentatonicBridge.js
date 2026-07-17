// Pentatonic Bridge Generator inserting rapid transition bridges (e.g., minor pentatonic scale runs)
import { buildChord } from "./chordDictionary.js";

export class PentatonicBridge {
    /**
     * Injects transient pentatonic bridge scale notes on specific offbeat sixteenth steps
     * @param {Object} currentChord - The base chord currently active in the bar
     * @param {Object} nextChord - The incoming target chord
     * @param {number} length - Slider value specifying length of bridge in steps
     * @returns {Array<number>} Scale notes matching the bridging minor/major pentatonic scale
     */
    static getBridgeNotes(currentChord, nextChord, length = 1) {
        if (!currentChord || !nextChord || length <= 0) return null;

        // Formulate minor/major pentatonic bridge a tritone or perfect fifth away
        // to build harmonic expectation and tension
        const root = currentChord.root;
        const bridgeRoot = (root + 6) % 12 + 60; // Tritone shift

        // Minor Pentatonic scale intervals: 0, 3, 5, 7, 10
        const scaleOffsets = [0, 3, 5, 7, 10];
        const bridgeScale = scaleOffsets.map(offset => bridgeRoot + offset);

        return bridgeScale;
    }
}

export default PentatonicBridge;
