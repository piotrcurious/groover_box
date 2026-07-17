// Highly expressive, multi-algorithm generative arpeggiator engine
// Upgraded with resolution-independent virtual steps, velocity randomness,
// interval spread, syncopated rhythmic complexity modes, strict pitch bounds,
// advanced bass conflict modes, dynamic gate length randomness, and Fractal Fluency (1/f self-similarity).
export class ArpGenerator {
    constructor() {
        this.index = 0;

        // Voss-McCartney Pink Noise (1/f) generator state variables for fractal fluency
        this.numPinkGens = 8;
        this.pinkKeys = new Array(this.numPinkGens).fill(0).map(() => Math.random());
        this.pinkRunningSum = this.pinkKeys.reduce((a, b) => a + b, 0);
    }

    /**
     * Voss-McCartney pink noise algorithm (1/f spectrum) to generate fractal self-similarity.
     * Generates a value in [0, 1] with long-range correlative memory.
     */
    getFractalNoise() {
        // Find which generators are updated at this index tick (using binary counting)
        const count = this.index + 1;
        let diffSum = 0;

        for (let i = 0; i < this.numPinkGens; i++) {
            if ((count & (1 << i)) !== 0) {
                const oldVal = this.pinkKeys[i];
                const newVal = Math.random();
                this.pinkKeys[i] = newVal;
                diffSum += (newVal - oldVal);
            }
        }

        this.pinkRunningSum += diffSum;
        // Normalize sum of generators back to [0, 1] range
        let normVal = this.pinkRunningSum / this.numPinkGens;
        if (normVal < 0) normVal = 0;
        if (normVal > 1) normVal = 1;
        return normVal;
    }

    /**
     * Determines next arpeggiator note, velocity, and timing trigger parameters.
     * Includes harmonic check against upcoming bass note to ensure beautiful spacing.
     * @param {Object} chord - Current chord configuration
     * @param {number} step - Resolution-independent virtual step index
     * @param {string} order - Arp note arrangement rule
     * @param {number} octaves - Range of octave displacement (1-4)
     * @param {number} ghostChance - Percentage probability of triggering quiet ghost note (0-100)
     * @param {number} density - Trigger density percentage (0-100)
     * @param {number} accentLevel - Impact scaling of structural accents (0-100)
     * @param {number} mutationRate - Probability of mutating a note to a dynamic passing/outside tone (0-100)
     * @param {string} octStyle - Octave jumping style ('linear', 'alternate', 'random', 'fixed')
     * @param {number} bassNote - Active or upcoming bass note (MIDI value)
     * @param {number} velocityRandomness - Variance in dynamic range (0-100)
     * @param {number} spread - Interval spread voicing mode (0 = Closed, 1 = Fifth alternate, 2 = Octave alternate, 3 = Wide fifth-octave alternate)
     * @param {string} rhythmMode - Complexity modes ('standard', 'syncopated', 'dotted', 'ratchet')
     * @param {number} minPitch - Lower MIDI bound (36-127)
     * @param {number} maxPitch - Upper MIDI bound (36-127)
     * @param {string} bassConflictMode - Action style on register clashing ('ignore', 'shift-octave', 'resolve-consonant', 'drop-note')
     * @param {number} gateRandomness - Percent variation in note duration (0-100)
     * @param {number} fractalFluency - Fractal influence level (0-100)
     * @param {number} fractalDim - Fractal spectral dimension index alpha (0.0 to 2.0)
     */
    getNextNote(
        chord,
        step,
        order = "updown",
        octaves = 2,
        ghostChance = 20,
        density = 100,
        accentLevel = 50,
        mutationRate = 15,
        octStyle = "linear",
        bassNote = 36,
        velocityRandomness = 15,
        spread = 0,
        rhythmMode = "standard",
        minPitch = 48,
        maxPitch = 96,
        bassConflictMode = "resolve-consonant",
        gateRandomness = 0,
        fractalFluency = 0,
        fractalDim = 1.0
    ) {
        // Generate our primary 1/f self-similar pink noise value
        const fNoise = this.getFractalNoise();

        // Transform the noise using our spectral exponent dimension (alpha)
        // alpha near 0 = White noise, 1.0 = Pink noise (organic/fluent), 2.0 = Brownian (smooth walk)
        let alphaNoise = fNoise;
        if (fractalDim !== 1.0) {
            // Apply exponential scaling mapping to modify spectral behavior
            alphaNoise = Math.pow(fNoise, fractalDim);
        }

        const fluencyCoeff = fractalFluency / 100.0;

        // 1. Fractal-influenced density filter
        let adjustedDensity = density;
        if (fractalFluency > 0) {
            // Modulate density by fractal noise, creating beautiful long-term patterns of sparseness/density
            const densityMod = (alphaNoise - 0.5) * 50 * fluencyCoeff;
            adjustedDensity = Math.max(10, Math.min(100, density + densityMod));
        }

        // Rhythm complexity filters
        let skipTrigger = false;
        let isForcedAccent = false;
        let isForcedGhost = false;

        if (rhythmMode === "syncopated") {
            const isDownbeat = (step % 4 === 0);
            if (isDownbeat && Math.random() < 0.25) {
                skipTrigger = true;
            } else if (!isDownbeat && (step % 2 !== 0) && Math.random() < 0.8) {
                isForcedAccent = true;
            }
        } else if (rhythmMode === "dotted") {
            if (step % 3 !== 0) {
                if (Math.random() < 0.6) {
                    skipTrigger = true;
                } else {
                    isForcedGhost = true;
                }
            } else {
                isForcedAccent = true;
            }
        } else if (rhythmMode === "ratchet") {
            if (step % 8 === 0 || step % 8 === 1) {
                isForcedAccent = true;
            } else if (step % 4 === 2 && Math.random() < 0.3) {
                skipTrigger = true;
            }
        }

        // Density filter
        if (skipTrigger || (Math.random() * 100 > adjustedDensity)) {
            this.index++;
            return { note: 60, velocity: 0, isGhost: false, trigger: false, gateModifier: 1.0 };
        }

        if (!chord || !chord.notes || chord.notes.length === 0) {
            this.index++;
            return { note: 60, velocity: 0, isGhost: false, trigger: false, gateModifier: 1.0 };
        }

        const notes = chord.notes;
        const len = notes.length;
        let noteIdx = 0;

        // 2. Core Pattern/Arrangement Ordering Algorithms
        if (order === "updown") {
            const cycle = (len * 2) - 2;
            const pos = this.index % Math.max(1, cycle);
            noteIdx = pos < len ? pos : cycle - pos;
        } else if (order === "brownian") {
            const stepChange = Math.random() > 0.5 ? 1 : -1;
            noteIdx = Math.abs((this.index + stepChange) % len);
            this.index = noteIdx;
        } else if (order === "funky") {
            noteIdx = (this.index * 3 + (step % 3)) % len;
        } else if (order === "converge") {
            const cycleIdx = this.index % len;
            if (cycleIdx % 2 === 0) {
                noteIdx = Math.floor(cycleIdx / 2);
            } else {
                noteIdx = len - 1 - Math.floor(cycleIdx / 2);
            }
        } else if (order === "retrograde") {
            noteIdx = (len - 1 - (this.index % len)) % len;
        } else if (order === "enclosure") {
            noteIdx = this.index % len;
        }

        // Apply a small fractal offset jump to note indices to create self-similar intervals
        if (fractalFluency > 0 && len > 2) {
            const indexShift = Math.floor((alphaNoise - 0.5) * len * fluencyCoeff);
            noteIdx = Math.abs((noteIdx + indexShift) % len);
        }

        let targetNote = notes[noteIdx] || notes[0];

        // 3. Chromatic / Bebop Passing Enclosures
        if (order === "enclosure" && len > 1) {
            const encStep = step % 3;
            if (encStep === 0) {
                targetNote += 1;
            } else if (encStep === 1) {
                targetNote -= 1;
            }
        }

        // 4. Open Voicing Interval Spread Transpositions
        if (spread === 1) {
            if (noteIdx % 2 !== 0) targetNote += 7;
        } else if (spread === 2) {
            if (noteIdx % 2 !== 0) targetNote += 12;
        } else if (spread === 3) {
            if (noteIdx % 2 !== 0) {
                targetNote += 19;
            } else {
                targetNote += 7;
            }
        }

        // 5. Dynamic Octave Jumping Styles
        let octOffset = 0;
        const maxOct = Math.max(1, octaves);
        if (octStyle === "linear") {
            octOffset = Math.floor(step / 4) % maxOct;
        } else if (octStyle === "alternate") {
            octOffset = (step % 2 === 0) ? 0 : (maxOct - 1);
        } else if (octStyle === "random") {
            octOffset = Math.floor(Math.random() * maxOct);
        } else if (octStyle === "fixed") {
            octOffset = 0;
        }

        targetNote += octOffset * 12;

        // 6. Bass-Contextual Harmonic Filtering & Advanced Conflict Resolution Strategies
        if (bassNote > 0 && bassConflictMode !== "ignore") {
            const diff = Math.abs(targetNote - bassNote);

            if (bassConflictMode === "shift-octave") {
                while (targetNote <= bassNote + 12) {
                    targetNote += 12;
                }
            } else if (bassConflictMode === "resolve-consonant") {
                const intervalDiff = diff % 12;
                if (intervalDiff === 1) {
                    targetNote += 1;
                } else if (intervalDiff === 6) {
                    targetNote += 1;
                } else if (intervalDiff === 11) {
                    targetNote += 1;
                }
            } else if (bassConflictMode === "drop-note") {
                const intervalDiff = diff % 12;
                if (diff < 12 || intervalDiff === 1 || intervalDiff === 2) {
                    this.index++;
                    return { note: 60, velocity: 0, isGhost: false, trigger: false, gateModifier: 1.0 };
                }
            }
        }

        // 7. Strict Pitch Limits Clamping
        while (targetNote < minPitch) {
            targetNote += 12;
        }
        while (targetNote > maxPitch) {
            targetNote -= 12;
        }
        targetNote = Math.max(minPitch, Math.min(maxPitch, targetNote));

        // 8. Passing Tone Mutation Generator (Dynamic Melodic Tension)
        let isMutated = false;
        let adjustedMutationRate = mutationRate;
        if (fractalFluency > 0) {
            // Modulate mutation rate fractally (giving waves of organic outside tones)
            const mutationMod = (alphaNoise - 0.5) * 30 * fluencyCoeff;
            adjustedMutationRate = Math.max(0, Math.min(100, mutationRate + mutationMod));
        }

        if (Math.random() * 100 < adjustedMutationRate) {
            const mutationInterval = Math.random() > 0.5 ? 2 : -1;
            const mutatedCandidate = targetNote + mutationInterval;
            if (mutatedCandidate >= minPitch && mutatedCandidate <= maxPitch) {
                targetNote = mutatedCandidate;
                isMutated = true;
            }
        }

        // 9. Advanced Accent & Velocity Modeling
        let velocity = 85;
        let isGhost = false;

        const isTense = chord.quality.includes("alt") || chord.quality.includes("sharp11") || chord.quality.includes("dim");
        const tensionMultiplier = isTense ? 1.15 : 1.00;

        const isStructuralAccent = (step % 4 === 0) || isForcedAccent;
        const isOffbeat = (step % 2 !== 0);

        if (isStructuralAccent && !isForcedGhost) {
            const accentBoost = (accentLevel / 100) * 35;
            velocity = Math.floor((100 + accentBoost) * tensionMultiplier);
        } else if (isForcedGhost || (isOffbeat && (Math.random() * 100 < ghostChance))) {
            velocity = Math.floor((15 + Math.random() * 20) * tensionMultiplier);
            isGhost = true;
        } else {
            const normalBase = 80 + (1.0 - (accentLevel / 100)) * 10;
            velocity = Math.floor(normalBase * tensionMultiplier);
        }

        // Fractal velocity modulation
        if (fractalFluency > 0) {
            // Create long-term dynamic rises and falls of volume
            const velocityMod = Math.floor((alphaNoise - 0.5) * 45 * fluencyCoeff);
            velocity += velocityMod;
        }

        // Custom Velocity Randomness Slider Influence
        if (velocityRandomness > 0) {
            const maxJitter = (velocityRandomness / 100) * 45;
            const jitter = Math.floor((Math.random() - 0.5) * 2 * maxJitter);
            velocity += jitter;
        }

        velocity = Math.max(5, Math.min(127, velocity));

        // 10. Gate Randomness and Fractal Gate Modulation
        let gateModifier = 1.0;
        let adjustedGateRand = gateRandomness;

        if (fractalFluency > 0) {
            // Mutate gate randomness fractally
            const gateRandMod = (alphaNoise - 0.5) * 25 * fluencyCoeff;
            adjustedGateRand = Math.max(0, Math.min(100, gateRandomness + gateRandMod));
        }

        if (adjustedGateRand > 0) {
            const maxGateJitter = (adjustedGateRand / 100) * 0.5;
            gateModifier = 1.0 + (Math.random() - 0.5) * 2 * maxGateJitter;
        }

        // Additionally apply long-term fractal gate swelling/shortening
        if (fractalFluency > 0) {
            const fractalGateSwell = (alphaNoise - 0.5) * 0.4 * fluencyCoeff;
            gateModifier += fractalGateSwell;
        }

        gateModifier = Math.max(0.1, Math.min(2.0, gateModifier));

        this.index++;

        return {
            note: targetNote,
            velocity,
            isGhost,
            isMutated,
            trigger: true,
            gateModifier
        };
    }
}

export const arpGenerator = new ArpGenerator();
export default arpGenerator;
