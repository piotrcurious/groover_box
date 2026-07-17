// Plomp-Levelt roughness (dissonance) approximation models
export class Roughness {
    /**
     * Approximates Plomp-Levelt sensory roughness for a set of frequencies
     * @param {Array<number>} frequencies - List of active chord frequencies
     */
    static calculate(frequencies) {
        if (!frequencies || frequencies.length < 2) return 0.0;

        let totalRoughness = 0.0;
        let pairs = 0;

        // Compare all frequency pairs to map sensory friction/dissonance
        for (let i = 0; i < frequencies.length; i++) {
            for (let j = i + 1; j < frequencies.length; j++) {
                totalRoughness += this.plompLevelt(frequencies[i], frequencies[j]);
                pairs++;
            }
        }

        return pairs > 0 ? Math.min(1.0, totalRoughness / pairs) : 0.0;
    }

    /**
     * Mathematical curve approximating critical band sensory roughness (Plomp & Levelt, 1965)
     */
    static plompLevelt(f1, f2) {
        const minF = Math.min(f1, f2);
        const maxF = Math.max(f1, f2);

        const fd = maxF - minF;
        if (fd === 0) return 0.0;

        // Critical bandwidth approximation standard formula parameters
        const b1 = 3.5;
        const b2 = 5.75;
        const s = 0.24 / (0.0207 * minF + 4.0);

        const x = s * fd;
        const roughness = Math.exp(-b1 * x) - Math.exp(-b2 * x);

        return Math.max(0, roughness);
    }
}

export default Roughness;
