// Expectation, tension models and surprise calculations based on transitions
export class Expectation {
    constructor() {
        this.history = [];
        this.maxHistory = 8;
    }

    /**
     * Estimates musical surprise (entropy) based on distance from previously active roots
     * @param {Object} currentChord - Currently active chord
     */
    calculateSurprise(currentChord) {
        if (!currentChord) return 0.0;

        if (this.history.length === 0) {
            this.history.push(currentChord.root);
            return 0.0;
        }

        // Surprise is a factor of distance (in semitones) from the moving average root center
        const averageRoot = this.history.reduce((a, b) => a + b, 0) / this.history.length;
        const distance = Math.abs(currentChord.root - averageRoot);

        // Normalize distance: typical max interval step is 12 (octave)
        const surprise = Math.min(1.0, distance / 12.0);

        // Shift history queue
        this.history.push(currentChord.root);
        if (this.history.length > this.maxHistory) {
            this.history.shift();
        }

        return surprise;
    }

    /**
     * Determines subjective chord progression tension
     * @param {number} roughness - Sensory Plomp-Levelt roughness score
     * @param {number} harmonicity - Structural chord harmonicity score
     * @param {string} chordType - Chord metadata classification ('bridge' or 'base')
     */
    static calculateTension(roughness, harmonicity, chordType) {
        // Base tension on sensory roughness coupled with lack of integer purity (harmonicity)
        let baseTension = (roughness * 0.7) + ((1.0 - harmonicity) * 0.3);

        // Extra scale bonus penalty for bridge chords
        if (chordType === "bridge") {
            baseTension = Math.min(1.0, baseTension + 0.25);
        }

        return baseTension;
    }
}

export default Expectation;
