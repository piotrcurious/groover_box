// Web MIDI API wrapper for sending real-time microtonal performances to external gear with pitch bend
export class MidiManager {
    constructor() {
        this.midiAccess = null;
        this.outputs = [];
        this.selectedOutput = null;
    }

    async init() {
        if (!navigator.requestMIDIAccess) {
            console.warn("Web MIDI API not supported in this browser.");
            return false;
        }
        try {
            this.midiAccess = await navigator.requestMIDIAccess();
            this.updateOutputs();
            this.midiAccess.onstatechange = () => this.updateOutputs();
            return true;
        } catch (e) {
            console.error("Failed to access MIDI hardware:", e);
            return false;
        }
    }

    updateOutputs() {
        this.outputs = [];
        if (!this.midiAccess) return;
        const outputsIter = this.midiAccess.outputs.values();
        for (let output = outputsIter.next(); output && !output.done; output = outputsIter.next()) {
            this.outputs.push(output.value);
        }
        if (this.outputs.length > 0 && !this.selectedOutput) {
            this.selectedOutput = this.outputs[0];
        }
    }

    selectOutput(id) {
        this.selectedOutput = this.outputs.find(out => out.id === id) || null;
    }

    sendNoteOn(midiNote, velocity = 127, channel = 0, pitchBendCents = 0) {
        if (!this.selectedOutput) return;
        const chan = channel & 0x0F;

        // Apply pitch bend for microtonal tuning if pitchBendCents is supplied
        if (pitchBendCents !== 0) {
            // MIDI Pitch Bend ranges from 0 to 16383, where 8192 is center
            // Assume external synth has default range of +/- 2 semitones (+/- 200 cents)
            const bendRangeCents = 200;
            const normalizedBend = Math.max(-1, Math.min(1, pitchBendCents / bendRangeCents));
            const bendValue = Math.floor(8192 + normalizedBend * 8191);

            const lsb = bendValue & 0x7F;
            const msb = (bendValue >> 7) & 0x7F;
            this.selectedOutput.send([0xE0 | chan, lsb, msb]); // Pitch Bend event
        }

        this.selectedOutput.send([0x90 | chan, midiNote & 0x7F, velocity & 0x7F]);
    }

    sendNoteOff(midiNote, channel = 0) {
        if (!this.selectedOutput) return;
        const chan = channel & 0x0F;
        this.selectedOutput.send([0x80 | chan, midiNote & 0x7F, 0]);
    }
}

export const midiManager = new MidiManager();
