// Highly expressive, multi-algorithm generative arpeggiator engine
export class ArpGenerator {
    constructor() {
        this.index = 0;
    }

    /**
     * Determines next arpeggiator note, velocity, and timing trigger parameters.
     * @param {Object} chord - Current chord configuration
     * @param {number} step - Current bar step index (0-15)
     * @param {string} order - Arp note arrangement rule ('updown', 'funky', 'brownian', 'converge', 'retrograde', 'enclosure')
     * @param {number} octaves - Range of octave displacement (1-4)
     * @param {number} ghostChance - Percentage probability of triggering quiet ghost note (0-100)
     * @param {number} density - Trigger density percentage (0-100)
     * @param {number} accentLevel - Impact scaling of structural accents (0-100)
     * @param {number} mutationRate - Probability of mutating a note to a dynamic passing/outside tone (0-100)
     * @param {string} octStyle - Octave jumping style ('linear', 'alternate', 'random', 'fixed')
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
        octStyle = "linear"
    ) {
        // Density filter: if random threshold is not met, do not trigger an active note event
        if (Math.random() * 100 > density) {
            return { note: 60, velocity: 0, isGhost: false, trigger: false };
        }

        if (!chord || !chord.notes || chord.notes.length === 0) {
            return { note: 60, velocity: 0, isGhost: false, trigger: false };
        }

        const notes = chord.notes;
        const len = notes.length;
        let noteIdx = 0;

        // 1. Core Pattern/Arrangement Ordering Algorithms
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

        // 2. Chromatic / Bebop Passing Enclosures
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

        // 3. Dynamic Octave Jumping Styles
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

        // 4. Passing Tone Mutation Generator (Dynamic Melodic Tension)
        let isMutated = false;
        if (Math.random() * 100 < mutationRate) {
            // Mutate note by +/- 1 or 2 semitones to introduce jazz passing tones
            const mutationInterval = Math.random() > 0.5 ? 2 : -1;
            targetNote += mutationInterval;
            isMutated = true;
        }

        // 5. Advanced Accent & Velocity Modeling
        let velocity = 85;
        let isGhost = false;

        // Base velocity range influenced by chord tension parameters
        const isTense = chord.quality.includes("alt") || chord.quality.includes("sharp11") || chord.quality.includes("dim");
        const tensionMultiplier = isTense ? 1.15 : 1.00;

        const isStructuralAccent = (step % 4 === 0);
        const isOffbeat = (step % 2 !== 0);

        if (isStructuralAccent) {
            // Accent modeling using the custom accentLevel slider coefficient
            const accentBoost = (accentLevel / 100) * 30;
            velocity = Math.floor((100 + accentBoost) * tensionMultiplier);
        } else if (isOffbeat && (Math.random() * 100 < ghostChance)) {
            // Ghost note triggered on offbeats
            velocity = Math.floor((15 + Math.random() * 20) * tensionMultiplier);
            isGhost = true;
        } else {
            // Normal intermediate step
            const normalBase = 80 + (1.0 - (accentLevel / 100)) * 10;
            velocity = Math.floor(normalBase * tensionMultiplier);
        }

        // Add small humanizing velocity jitter
        velocity += Math.floor((Math.random() - 0.5) * 12);
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
