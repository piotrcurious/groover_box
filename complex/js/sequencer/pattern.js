// Pattern structure mapping 64 steps across drums, bass, arpeggios, and fractal roots
export class Pattern {
    constructor(numBars = 64, stepsPerBar = 64) {
        this.numBars = numBars;
        this.stepsPerBar = stepsPerBar; // 64 high-res slots per bar (or simplified 16 slots per bar for user)

        // 3D grid [barIndex][instrument][stepIndex]
        // We will store 64 bars of patterns.
        // arp elements are now stored as numbers representing tempo multipliers (0 = off, 1 = 1x, 2 = 2x, 3 = 3x, 4 = 4x, 0.5 = half-time)
        this.data = Array.from({ length: numBars }, () => ({
            bass: new Array(16).fill(false),
            arp: new Array(16).fill(0), // 0 represents inactive, positive floats/ints represent tempo multipliers
            kick: new Array(16).fill(false),
            snare: new Array(16).fill(false),
            hihat: new Array(16).fill(false),
            frac: new Array(16).fill(false) // Steps designated as fractal fluency roots/anchors
        }));
    }

    /**
     * Clears all trigger data in a given bar index
     */
    clearBar(barIdx) {
        if (barIdx < 0 || barIdx >= this.numBars) return;
        const b = this.data[barIdx];
        b.bass.fill(false);
        b.arp.fill(0);
        b.kick.fill(false);
        b.snare.fill(false);
        b.hihat.fill(false);
        b.frac.fill(false);
    }

    /**
     * Copies a full bar pattern definition to all other bars
     */
    copyBarToAll(sourceBarIdx) {
        const source = this.data[sourceBarIdx];
        for (let i = 0; i < this.numBars; i++) {
            if (i === sourceBarIdx) continue;
            this.data[i] = {
                bass: [...source.bass],
                arp: [...source.arp],
                kick: [...source.kick],
                snare: [...source.snare],
                hihat: [...source.hihat],
                frac: [...source.frac]
            };
        }
    }

    /**
     * Generates a Euclidean rhythm pattern
     * @param {number} steps - Total steps in pattern sequence loop (typically 16)
     * @param {number} pulses - Active triggers/pulses (density)
     * @param {number} rotation - Shift offset index
     */
    static generateEuclidean(steps, pulses, rotation = 0) {
        if (pulses > steps) pulses = steps;
        if (pulses <= 0) return new Array(steps).fill(false);

        const pattern = [];
        const counts = [];
        const remainders = [];
        let divisor = steps - pulses;
        remainders.push(pulses);
        let level = 0;

        while (true) {
            counts.push(Math.floor(divisor / remainders[level]));
            remainders.push(divisor % remainders[level]);
            divisor = remainders[level];
            level++;
            if (remainders[level] <= 1) break;
        }
        counts.push(divisor);

        const buildPattern = (lvl) => {
            if (lvl === -1) {
                return [false];
            } else if (lvl === -2) {
                return [true];
            } else {
                const subPattern = [];
                for (let i = 0; i < counts[lvl]; i++) {
                    subPattern.push(...buildPattern(lvl - 1));
                }
                if (remainders[lvl] > 0) {
                    subPattern.push(...buildPattern(lvl - 2));
                }
                return subPattern;
            }
        };

        const rawPattern = buildPattern(level);
        // Clean and rotate
        const rotated = new Array(steps).fill(false);
        for (let i = 0; i < steps; i++) {
            const rotIdx = (i + rotation) % steps;
            rotated[rotIdx] = rawPattern[i] || false;
        }
        return rotated;
    }
}

export default Pattern;
