// Highly expressive, multi-algorithm generative arpeggiator engine
// Upgraded with resolution-independent virtual steps, velocity randomness,
// interval spread, and syncopated rhythmic complexity modes.
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
        rhythmMode = "standard"
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
            return { note: 60, velocity: 0, isGhost: false, trigger: false };
        }

        if (!chord || !chord.notes || chord.notes.length === 0) {
            this.index++;
            return { note: 60, velocity: 0, isGhost: false, trigger: false };
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

        // 6. Bass-Contextual Harmonic Filtering (Avoid muddy frequencies & minor second interval clashes)
        if (bassNote > 0) {
            // Shift arpeggio up by octaves if it gets too close to the bass range (within 12 semitones)
            while (targetNote <= bassNote + 12) {
                targetNote += 12;
            }

            // Resolve minor second clashing intervals against the bass note (e.g. adjust to nearest third or perfect fourth)
            const intervalDiff = Math.abs(targetNote - bassNote) % 12;
            if (intervalDiff === 1) {
                targetNote += 1; // Shift half-step up to make it a major second
            } else if (intervalDiff === 11) {
                targetNote += 1; // Resolve minor seventh clashing boundaries upwards
            }
        }

        // 7. Passing Tone Mutation Generator (Dynamic Melodic Tension)
        let isMutated = false;
        if (Math.random() * 100 < mutationRate) {
            // Mutate note by +/- 1 or 2 semitones to introduce jazz passing tones
            const mutationInterval = Math.random() > 0.5 ? 2 : -1;
            targetNote += mutationInterval;
            isMutated = true;
        }

        // 8. Advanced Accent & Velocity Modeling
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

        // 9. Custom Velocity Randomness Slider Influence
        if (velocityRandomness > 0) {
            const maxJitter = (velocityRandomness / 100) * 45;
            const jitter = Math.floor((Math.random() - 0.5) * 2 * maxJitter);
            velocity += jitter;
        }

        velocity = Math.max(5, Math.min(127, velocity));

        this.index++;

        return {
            note: targetNote,
            velocity,
            isGhost,
            isMutated,
            trigger: true
        };
    }
}

export const arpGenerator = new ArpGenerator();
export default arpGenerator;
