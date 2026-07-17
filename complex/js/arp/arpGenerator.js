// Highly expressive, multi-algorithm generative arpeggiator engine
// Upgraded with resolution-independent virtual steps, velocity randomness,
// interval spread, syncopated rhythmic complexity modes, strict pitch bounds,
// advanced bass conflict modes, and dynamic gate length randomness.
export class ArpGenerator {
    constructor() {
        this.index = 0;
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
        gateRandomness = 0
    ) {
        // 1. Rhythm complexity filters
        let skipTrigger = false;
        let isForcedAccent = false;
        let isForcedGhost = false;

        if (rhythmMode === "syncopated") {
            // Accent the offbeats, occasionally drop the downbeats
            const isDownbeat = (step % 4 === 0);
            if (isDownbeat && Math.random() < 0.25) {
                // 25% chance of dropping downbeats for syncopation
                skipTrigger = true;
            } else if (!isDownbeat && (step % 2 !== 0) && Math.random() < 0.8) {
                // High offbeat accentuation
                isForcedAccent = true;
            }
        } else if (rhythmMode === "dotted") {
            // Emulate dotted pattern feel (accenting/triggering on 3s, skipping others or turning them into ghosts)
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
            // Add a burst of speed and intensity on subdivision patterns
            if (step % 8 === 0 || step % 8 === 1) {
                isForcedAccent = true;
            } else if (step % 4 === 2 && Math.random() < 0.3) {
                skipTrigger = true;
            }
        }

        // Density filter: if random threshold is not met or skipTrigger is active, do not play
        if (skipTrigger || (Math.random() * 100 > density)) {
            this.index++; // Keep advancing the index so we don't stagnate on the same note
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
            // Random step walk +/- 1 index
            const stepChange = Math.random() > 0.5 ? 1 : -1;
            noteIdx = Math.abs((this.index + stepChange) % len);
            this.index = noteIdx;
        } else if (order === "funky") {
            // Syncopated jumps mapping chord tones dynamically
            noteIdx = (this.index * 3 + (step % 3)) % len;
        } else if (order === "converge") {
            // Starts from extremes (lowest, highest, second lowest, second highest...)
            const cycleIdx = this.index % len;
            if (cycleIdx % 2 === 0) {
                noteIdx = Math.floor(cycleIdx / 2);
            } else {
                noteIdx = len - 1 - Math.floor(cycleIdx / 2);
            }
        } else if (order === "retrograde") {
            // Exact reversed playback of chord tones
            noteIdx = (len - 1 - (this.index % len)) % len;
        } else if (order === "enclosure") {
            // Cycles standard indexes but resolves using dynamic enclosure
            noteIdx = this.index % len;
        }

        let targetNote = notes[noteIdx] || notes[0];

        // 3. Chromatic / Bebop Passing Enclosures
        if (order === "enclosure" && len > 1) {
            // Wrap the target note using a 3-step chromatic enclosure
            const encStep = step % 3;
            if (encStep === 0) {
                targetNote += 1; // Upper chromatic neighbor
            } else if (encStep === 1) {
                targetNote -= 1; // Lower chromatic neighbor
            }
            // encStep === 2 resolves perfectly to the chord tone
        }

        // 4. Open Voicing Interval Spread Transpositions
        // 0 = Closed (no transpose), 1 = Fifth alternate (+7 on odd indices), 2 = Octave alternate (+12 on odd indices), 3 = Wide Fifth-Octave (+19 on odd, +7 on even indexes)
        if (spread === 1) {
            if (noteIdx % 2 !== 0) {
                targetNote += 7;
            }
        } else if (spread === 2) {
            if (noteIdx % 2 !== 0) {
                targetNote += 12;
            }
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
                // Ensure arpeggio stays at least 1 octave higher than active bass register
                while (targetNote <= bassNote + 12) {
                    targetNote += 12;
                }
            } else if (bassConflictMode === "resolve-consonant") {
                // Shift or snap clashing intervals (minor seconds, tritones) to pleasant chord degrees
                const intervalDiff = diff % 12;
                if (intervalDiff === 1) {
                    targetNote += 1; // major second
                } else if (intervalDiff === 6) {
                    targetNote += 1; // perfect fifth
                } else if (intervalDiff === 11) {
                    targetNote += 1; // perfect octave
                }
            } else if (bassConflictMode === "drop-note") {
                // Drop trigger if notes are physically within major/minor second or octave boundary clashes
                const intervalDiff = diff % 12;
                if (diff < 12 || intervalDiff === 1 || intervalDiff === 2) {
                    this.index++;
                    return { note: 60, velocity: 0, isGhost: false, trigger: false, gateModifier: 1.0 };
                }
            }
        }

        // 7. Strict Pitch Limits Clamping
        // Ensure note is bounds-aligned. Transpose by octave up/down rather than flat clipping to preserve pitch class
        while (targetNote < minPitch) {
            targetNote += 12;
        }
        while (targetNote > maxPitch) {
            targetNote -= 12;
        }

        // Double check bounds to clamp safely in case minPitch/maxPitch is extremely narrow
        targetNote = Math.max(minPitch, Math.min(maxPitch, targetNote));

        // 8. Passing Tone Mutation Generator (Dynamic Melodic Tension)
        let isMutated = false;
        if (Math.random() * 100 < mutationRate) {
            // Mutate note by +/- 1 or 2 semitones to introduce jazz passing tones
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

        // Base velocity range influenced by chord tension parameters
        const isTense = chord.quality.includes("alt") || chord.quality.includes("sharp11") || chord.quality.includes("dim");
        const tensionMultiplier = isTense ? 1.15 : 1.00;

        const isStructuralAccent = (step % 4 === 0) || isForcedAccent;
        const isOffbeat = (step % 2 !== 0);

        if (isStructuralAccent && !isForcedGhost) {
            // Accent modeling using the custom accentLevel slider coefficient
            const accentBoost = (accentLevel / 100) * 35;
            velocity = Math.floor((100 + accentBoost) * tensionMultiplier);
        } else if (isForcedGhost || (isOffbeat && (Math.random() * 100 < ghostChance))) {
            // Ghost note triggered
            velocity = Math.floor((15 + Math.random() * 20) * tensionMultiplier);
            isGhost = true;
        } else {
            // Normal intermediate step
            const normalBase = 80 + (1.0 - (accentLevel / 100)) * 10;
            velocity = Math.floor(normalBase * tensionMultiplier);
        }

        // Custom Velocity Randomness Slider Influence
        if (velocityRandomness > 0) {
            const maxJitter = (velocityRandomness / 100) * 45;
            const jitter = Math.floor((Math.random() - 0.5) * 2 * maxJitter);
            velocity += jitter;
        }

        velocity = Math.max(5, Math.min(127, velocity));

        // 10. Gate Randomness Scale Calculation
        let gateModifier = 1.0;
        if (gateRandomness > 0) {
            const maxGateJitter = (gateRandomness / 100) * 0.5; // up to 50% change
            gateModifier = 1.0 + (Math.random() - 0.5) * 2 * maxGateJitter;
            gateModifier = Math.max(0.1, Math.min(2.0, gateModifier));
        }

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
