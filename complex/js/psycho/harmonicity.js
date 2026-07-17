// Harmonicity metrics calculating common partial overlays and integer purity ratios
export class Harmonicity {
    /**
     * Scores a chord's overall integer-ratio purity and consonance
     * @param {Array<number>} notes - List of standard MIDI pitch numbers
     */
    static calculate(notes) {
        if (!notes || notes.length < 2) return 1.0;

        const baseMidi = notes[0];
        let ratioPurity = 0;

        for (let i = 1; i < notes.length; i++) {
            const interval = Math.abs(notes[i] - baseMidi) % 12;

            // Pure consonant intervals score highest (Perfect 5th, Perfect 4th, Major 3rd)
            if (interval === 7) ratioPurity += 1.0; // P5
            else if (interval === 5) ratioPurity += 0.8; // P4
            else if (interval === 4) ratioPurity += 0.7; // M3
            else if (interval === 9) ratioPurity += 0.6; // M6
            else if (interval === 3) ratioPurity += 0.5; // m3
            else if (interval === 10) ratioPurity += 0.4; // m7
            else if (interval === 11) ratioPurity += 0.1; // M7 (tense)
            else if (interval === 6) ratioPurity += 0.05; // Tritone (very tense)
            else ratioPurity += 0.2;
        }

        const score = ratioPurity / (notes.length - 1);
        return Math.max(0, Math.min(1.0, score));
    }
}

export default Harmonicity;
