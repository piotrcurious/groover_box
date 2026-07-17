// Complete Microtonal and Tuning Subsystem with support for diverse temperaments and Scala import
export class TuningSystem {
    constructor() {
        this.system = "12tet";
        this.baseFreq = 440.0;
        this.baseMidi = 69; // A4
        this.customScala = null;
    }

    setSystem(system) {
        this.system = system;
    }

    setBaseFrequency(freq, midi = 69) {
        this.baseFreq = freq;
        this.baseMidi = midi;
    }

    /**
     * Parses a Scala scale definition (.scl format) string and loads it.
     * @param {string} sclText - Scala text payload
     */
    importScala(sclText) {
        try {
            const lines = sclText.split('\n').map(l => l.trim()).filter(l => l.length > 0 && !l.startsWith('!'));
            if (lines.length < 2) throw new Error("Invalid Scala format: Missing header");

            const description = lines[0];
            const size = parseInt(lines[1], 10);
            const intervals = [];

            for (let i = 2; i < lines.length && intervals.length < size; i++) {
                const line = lines[i].split(/\s+/)[0]; // get the first token
                if (line.includes('.')) {
                    // It is a cent value (e.g. 1200.0)
                    intervals.push({ type: 'cents', value: parseFloat(line) });
                } else if (line.includes('/')) {
                    // It is a ratio (e.g. 3/2)
                    const parts = line.split('/');
                    intervals.push({ type: 'ratio', value: parseInt(parts[0]) / parseInt(parts[1]) });
                } else {
                    // Integer representing cent value or ratio
                    const val = parseInt(line, 10);
                    if (val < 0) continue;
                    intervals.push({ type: 'ratio', value: val });
                }
            }

            this.customScala = {
                description,
                size,
                intervals: [{ type: 'ratio', value: 1.0 }, ...intervals] // Include octave/unison root
            };
            this.system = "scala";
            return true;
        } catch (e) {
            console.error("Scala parse failed:", e);
            return false;
        }
    }

    /**
     * Translates a MIDI note number into absolute frequency and microtonal pitch bends
     * @param {number} midiNote - Standard MIDI Note Number
     * @returns {Object} { frequency, pitchBendCents, rootMidi }
     */
    getFrequencyInfo(midiNote) {
        const standardFreq = 440 * Math.pow(2, (midiNote - 69) / 12);
        let actualFreq = standardFreq;

        switch (this.system) {
            case "12tet":
                actualFreq = standardFreq;
                break;

            case "19tet": {
                // 19-TET Equal Temperament mapping
                const stepsFromA = midiNote - 69;
                actualFreq = 440 * Math.pow(2, stepsFromA / 19);
                break;
            }

            case "24tet": {
                // Quarter-tone 24-TET Equal Temperament mapping
                const stepsFromA = midiNote - 69;
                actualFreq = 440 * Math.pow(2, stepsFromA / 24);
                break;
            }

            case "31tet": {
                // Fokker 31-TET mapping
                const stepsFromA = midiNote - 69;
                actualFreq = 440 * Math.pow(2, stepsFromA / 31);
                break;
            }

            case "53tet": {
                // Mercator's 53-TET mapping
                const stepsFromA = midiNote - 69;
                actualFreq = 440 * Math.pow(2, stepsFromA / 53);
                break;
            }

            case "22shruti": {
                // Classic Indian 22 Shruti division of 12-TET octave
                const ratioMap = [
                    1/1, 256/243, 16/15, 10/9, 9/8, 32/27, 6/5, 5/4, 81/64, 4/3, 27/20,
                    45/32, 729/512, 3/2, 128/81, 8/5, 5/3, 27/16, 16/9, 9/5, 15/8, 243/128
                ];
                const relativeC = midiNote - 60; // relative to middle C
                const octave = Math.floor(relativeC / 12);
                let noteInOctave = relativeC % 12;
                if (noteInOctave < 0) noteInOctave += 12;

                // Map standard 12 steps into Shruti ratios (rough matching)
                const shrutiMapping = [0, 2, 4, 6, 7, 9, 11, 13, 15, 16, 18, 20];
                const shrutiIdx = shrutiMapping[noteInOctave];
                const ratio = ratioMap[shrutiIdx] || 1.0;

                const cFreq = 261.63; // Standard C4
                actualFreq = cFreq * ratio * Math.pow(2, octave);
                break;
            }

            case "just": {
                // Pure Just Intonation harmonic ratios centered on Middle C
                const ratios = [
                    1/1, 16/15, 9/8, 6/5, 5/4, 4/3, 45/32, 3/2, 8/5, 5/3, 9/5, 15/8
                ];
                const relativeC = midiNote - 60; // relative to middle C
                const octave = Math.floor(relativeC / 12);
                let noteInOctave = relativeC % 12;
                if (noteInOctave < 0) noteInOctave += 12;

                const cFreq = 261.63; // C4 root
                const ratio = ratios[noteInOctave];
                actualFreq = cFreq * ratio * Math.pow(2, octave);
                break;
            }

            case "pythagorean": {
                // Pythagorean tuning centered on C
                const ratios = [
                    1/1, 256/243, 9/8, 32/27, 81/64, 4/3, 1024/729, 3/2, 128/81, 27/16, 16/9, 243/128
                ];
                const relativeC = midiNote - 60;
                const octave = Math.floor(relativeC / 12);
                let noteInOctave = relativeC % 12;
                if (noteInOctave < 0) noteInOctave += 12;

                const cFreq = 261.63;
                const ratio = ratios[noteInOctave];
                actualFreq = cFreq * ratio * Math.pow(2, octave);
                break;
            }

            case "scala": {
                if (this.customScala) {
                    const scaleSize = this.customScala.size;
                    const relativeC = midiNote - 60;
                    const octave = Math.floor(relativeC / scaleSize);
                    let noteInScale = relativeC % scaleSize;
                    if (noteInScale < 0) noteInScale += scaleSize;

                    const cFreq = 261.63;
                    const interval = this.customScala.intervals[noteInScale];
                    let ratio = 1.0;

                    if (interval.type === 'cents') {
                        ratio = Math.pow(2, interval.value / 1200);
                    } else if (interval.type === 'ratio') {
                        ratio = interval.value;
                    }

                    actualFreq = cFreq * ratio * Math.pow(2, octave);
                }
                break;
            }
        }

        // Calculate pitch deviation (cents) relative to standard 12-TET frequency
        const centsDeviation = Math.round(1200 * Math.log2(actualFreq / standardFreq) * 100) / 100;

        return {
            frequency: actualFreq,
            pitchBendCents: centsDeviation,
            rootMidi: midiNote
        };
    }
}

export const tuningSystem = new TuningSystem();
export default tuningSystem;
