// Complex, syncopated and velocity-mutated arpeggiator engine
export class ArpGenerator {
    constructor() {
        this.index = 0;
    }

    /**
     * Determines next arpeggiator note and velocity based on rhythm settings
     * @param {Object} chord - Current chord configuration
     * @param {number} step - Current bar step index
     * @param {string} order - Arp note arrangement rule ('updown', 'funky', 'brownian')
     * @param {number} octaves - Range of octave displacement (1-4)
     * @param {number} ghostChance - Percentage probability of triggering quiet ghost note (0-100)
     */
    getNextNote(chord, step, order = "updown", octaves = 2, ghostChance = 20) {
        if (!chord || !chord.notes || chord.notes.length === 0) return { note: 60, velocity: 0 };

        const notes = chord.notes;
        let noteIdx = 0;

        if (order === "updown") {
            const cycle = (notes.length * 2) - 2;
            const pos = this.index % Math.max(1, cycle);
            noteIdx = pos < notes.length ? pos : cycle - pos;
        } else if (order === "brownian") {
            // Random step walk +/- 1 index
            const stepChange = Math.random() > 0.5 ? 1 : -1;
            noteIdx = Math.abs((this.index + stepChange) % notes.length);
            this.index = noteIdx;
        } else if (order === "funky") {
            // Skips indexes on 16th boundaries
            noteIdx = (this.index * 3) % notes.length;
        }

        let targetNote = notes[noteIdx];

        // Displace note octave based on step boundaries
        const octOffset = Math.floor(step / 4) % octaves;
        targetNote += octOffset * 12;

        // Accent modeling & syncopated velocity calculation
        let velocity = 100;
        let isGhost = false;

        if (step % 4 === 0) {
            velocity = 127; // Structural accents
        } else if (step % 2 !== 0) {
            // Check for potential ghost note placement on syncopated off-beats
            if (Math.random() * 100 < ghostChance) {
                velocity = Math.floor(15 + Math.random() * 25);
                isGhost = true;
            } else {
                velocity = 80;
            }
        } else {
            velocity = 95;
        }

        this.index++;
        return {
            note: targetNote,
            velocity,
            isGhost
        };
    }
}

export const arpGenerator = new ArpGenerator();
export default arpGenerator;
