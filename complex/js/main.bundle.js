// Synthesia Generative Groovebox Unified Local Browser Bundle
// Generated to bypass file:// browser CORS restrictions and support offline loading perfectly.
//

// --- MODULE: complex/js/math/optimizer.js ---
// Dynamic Programming and Score-based Optimization for Progression Pathways and Voice-Leading Transitions
class GraphOptimizer {
    constructor() {
        this.cache = new Map();
    }

    /**
     * Finds the highest scoring sequence of chords from candidate steps using a dynamic programming lookahead.
     * @param {Array<Array<Object>>} candidateChordsByStep - 2D Array of [stepIndex][candidateChords]
     * @param {Function} transitionScoreFunc - Scoring function matching transition (chordA, chordB) -> float
     * @param {number} lookaheadSteps - Lookahead depth (e.g. 4 bars)
     */
    findOptimalPath(candidateChordsByStep, transitionScoreFunc, lookaheadSteps = 4) {
        const totalSteps = candidateChordsByStep.length;
        if (totalSteps === 0) return [];

        // dp[stepIndex][candidateIndex] = { score, parentIndex }
        const dp = Array.from({ length: totalSteps }, () => []);

        // Step 0 initialization
        for (let i = 0; i < candidateChordsByStep[0].length; i++) {
            dp[0][i] = { score: 1.0, parentIndex: -1 };
        }

        // DP State propagation
        for (let s = 1; s < totalSteps; s++) {
            const currentCandidates = candidateChordsByStep[s];
            const prevCandidates = candidateChordsByStep[s - 1];

            for (let c = 0; c < currentCandidates.length; c++) {
                let maxScore = -Infinity;
                let bestParent = -1;

                for (let p = 0; p < prevCandidates.length; p++) {
                    const transScore = transitionScoreFunc(prevCandidates[p], currentCandidates[c]);
                    const candidateScore = dp[s - 1][p].score + transScore;

                    if (candidateScore > maxScore) {
                        maxScore = candidateScore;
                        bestParent = p;
                    }
                }

                dp[s][c] = { score: maxScore, parentIndex: bestParent };
            }
        }

        // Backtrack from optimal step
        const path = [];
        let maxFinalScore = -Infinity;
        let bestFinalIndex = -1;

        const lastStepIdx = totalSteps - 1;
        for (let i = 0; i < dp[lastStepIdx].length; i++) {
            if (dp[lastStepIdx][i].score > maxFinalScore) {
                maxFinalScore = dp[lastStepIdx][i].score;
                bestFinalIndex = i;
            }
        }

        let currIndex = bestFinalIndex;
        for (let s = lastStepIdx; s >= 0; s--) {
            if (currIndex === -1) break;
            path.unshift(candidateChordsByStep[s][currIndex]);
            currIndex = dp[s][currIndex].parentIndex;
        }

        return path;
    }

    /**
     * Compute voice leading transition distance using Manhattan/Euclidean voice distances
     */
    static computeVoiceLeadingCost(chordANotes, chordBNotes) {
        if (!chordANotes || !chordBNotes) return 1.0;

        // Sort notes to pair voices efficiently
        const sortedA = [...chordANotes].sort((a, b) => a - b);
        const sortedB = [...chordBNotes].sort((a, b) => a - b);

        let cost = 0;
        const voices = Math.min(sortedA.length, sortedB.length);

        for (let v = 0; v < voices; v++) {
            cost += Math.abs(sortedA[v] - sortedB[v]);
        }

        // Return voice-leading fitness score (higher is better, lower cost)
        return 1 / (1 + cost);
    }
}
const graphOptimizer = new GraphOptimizer();




// --- MODULE: complex/js/psycho/roughness.js ---
// Plomp-Levelt roughness (dissonance) approximation models
class Roughness {
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





// --- MODULE: complex/js/psycho/harmonicity.js ---
// Harmonicity metrics calculating common partial overlays and integer purity ratios
class Harmonicity {
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





// --- MODULE: complex/js/psycho/expectation.js ---
// Expectation, tension models and surprise calculations based on transitions
class Expectation {
    constructor() {
        this.history = [];
        this.maxHistory = 8;
    }

    /**
     * Estimates musical surprise (entropy) based on distance from previously active roots
     * @param {Object} currentChord - Currently active chord
     */
    calculateSurprise(currentChord) {
        if (!currentChord) return 0.0;

        if (this.history.length === 0) {
            this.history.push(currentChord.root);
            return 0.0;
        }

        // Surprise is a factor of distance (in semitones) from the moving average root center
        const averageRoot = this.history.reduce((a, b) => a + b, 0) / this.history.length;
        const distance = Math.abs(currentChord.root - averageRoot);

        // Normalize distance: typical max interval step is 12 (octave)
        const surprise = Math.min(1.0, distance / 12.0);

        // Shift history queue
        this.history.push(currentChord.root);
        if (this.history.length > this.maxHistory) {
            this.history.shift();
        }

        return surprise;
    }

    /**
     * Determines subjective chord progression tension
     * @param {number} roughness - Sensory Plomp-Levelt roughness score
     * @param {number} harmonicity - Structural chord harmonicity score
     * @param {string} chordType - Chord metadata classification ('bridge' or 'base')
     */
    static calculateTension(roughness, harmonicity, chordType) {
        // Base tension on sensory roughness coupled with lack of integer purity (harmonicity)
        let baseTension = (roughness * 0.7) + ((1.0 - harmonicity) * 0.3);

        // Extra scale bonus penalty for bridge chords
        if (chordType === "bridge") {
            baseTension = Math.min(1.0, baseTension + 0.25);
        }

        return baseTension;
    }
}





// --- MODULE: complex/js/microtonal/temperament.js ---
// Complete Microtonal and Tuning Subsystem with support for diverse temperaments and Scala import
class TuningSystem {
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

const tuningSystem = new TuningSystem();




// --- MODULE: complex/js/ui/visualizers.js ---
// Canvas-based Tonnetz (Neo-Riemannian grid) and Fast Fourier Transform visualizers
class Visualizers {
    /**
     * Renders a real-time Fast Fourier Transform (FFT) spectrum display
     * @param {HTMLCanvasElement} canvas - Spectrum canvas node
     * @param {AnalyserNode} analyserNode - Web Audio API Analyser instance
     */
    static drawSpectrum(canvas, analyserNode) {
        if (!canvas || !analyserNode) return;
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        const bufferLength = analyserNode.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const draw = () => {
            requestAnimationFrame(draw);
            analyserNode.getByteFrequencyData(dataArray);

            ctx.fillStyle = '#05070a';
            ctx.fillRect(0, 0, width, height);

            const barWidth = (width / bufferLength) * 2.5;
            let barHeight;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                barHeight = dataArray[i] / 2;

                // Color gradient from cyan to pink
                const r = Math.floor(barHeight + 50);
                const g = Math.floor(255 - barHeight);
                const b = 255;

                ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
                ctx.fillRect(x, height - barHeight, barWidth - 1, barHeight);

                x += barWidth + 1;
            }
        };

        draw();
    }

    /**
     * Draws an interactive Neo-Riemannian Tonnetz (triangular pitch space)
     * @param {HTMLCanvasElement} canvas - Target Tonnetz canvas node
     * @param {Array<number>} activeNotes - List of active MIDI notes currently sounding
     */
    static drawTonnetz(canvas, activeNotes = []) {
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        // Clean canvas
        ctx.fillStyle = '#05070a';
        ctx.fillRect(0, 0, width, height);

        const noteNames = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];
        const rows = 4;
        const cols = 8;
        const radius = 16;

        const activeNoteClasses = new Set(activeNotes.map(n => n % 12));

        // Generate Tonnetz layout: Fifth steps on horizontal axes, third steps on vertical
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                // Pitch selection step formula: (row * 4 + col * 7) % 12
                const noteVal = (r * 4 + c * 7) % 12;
                const name = noteNames[noteVal];

                const x = 30 + c * 38;
                const y = 20 + r * 32;

                const isActive = activeNoteClasses.has(noteVal);

                // Draw connecting lines to adjacent triads
                ctx.strokeStyle = '#1e242e';
                ctx.lineWidth = 1;
                if (c < cols - 1) {
                    ctx.beginPath();
                    ctx.moveTo(x, y);
                    ctx.lineTo(x + 38, y);
                    ctx.stroke();
                }
                if (r < rows - 1) {
                    ctx.beginPath();
                    ctx.moveTo(x, y);
                    ctx.lineTo(x, y + 32);
                    ctx.stroke();
                }

                // Draw circle node
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, 2 * Math.PI);
                ctx.fillStyle = isActive ? '#ff0055' : '#14171d';
                ctx.fill();
                ctx.strokeStyle = isActive ? '#00f0ff' : '#2b3342';
                ctx.lineWidth = isActive ? 2 : 1;
                ctx.stroke();

                // Draw note label
                ctx.fillStyle = isActive ? '#ffffff' : '#64748b';
                ctx.font = 'bold 9px monospace';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(name, x, y);
            }
        }
    }
}





// --- MODULE: complex/js/sequencer/pattern.js ---
// Pattern structure mapping 64 steps across drums, bass, arpeggios, and fractal roots
class Pattern {
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





// --- MODULE: complex/js/sequencer/clock.js ---
// High-resolution clock scheduler for precision sequencer timing & swing offset handling
class Clock {
    constructor(callback) {
        this.callback = callback; // Function invoked to schedule a single step
        this.isPlaying = false;

        this.bpm = 110;
        this.swing = 0.0; // 0.0 to 1.0 (percent offset of offbeats)

        this.lookahead = 25.0; // milliseconds between scheduling ticks
        this.scheduleAheadTime = 0.1; // seconds of lookahead buffer
        this.nextStepTime = 0.0;
        this.currentStep = 0; // 0 to 63 steps

        this.timerID = null;
        this.ctx = null;
    }

    start(ctx) {
        if (this.isPlaying) return;
        this.ctx = ctx;
        this.isPlaying = true;
        this.nextStepTime = this.ctx.currentTime + 0.05;
        this.currentStep = 0;
        this.scheduler();
    }

    stop() {
        if (!this.isPlaying) return;
        this.isPlaying = false;
        clearTimeout(this.timerID);
        this.timerID = null;
    }

    setBpm(bpm) {
        this.bpm = Math.max(30, Math.min(300, bpm));
    }

    setSwing(swing) {
        this.swing = Math.max(0.0, Math.min(1.0, swing));
    }

    scheduler() {
        while (this.nextStepTime < this.ctx.currentTime + this.scheduleAheadTime) {
            // Apply human/swing offsets on every alternate 16th step (offbeats: steps 1, 3, 5...)
            let adjustedTime = this.nextStepTime;
            const stepInBeat = this.currentStep % 4;
            const stepDuration = 60.0 / this.bpm / 4; // Length of a 16th note

            if (stepInBeat % 2 !== 0 && this.swing > 0) {
                // Delay offbeats based on swing multiplier (swing up to 1/3 of a step duration)
                const swingDelay = stepDuration * (this.swing * 0.33);
                adjustedTime += swingDelay;
            }

            // Trigger step callback
            this.callback(this.currentStep, adjustedTime);

            // Advance timeline next step position
            this.nextStepTime += stepDuration;

            // Advance overall step counter
            this.currentStep = (this.currentStep + 1) % 64;
        }
        this.timerID = setTimeout(() => this.scheduler(), this.lookahead);
    }
}





// --- MODULE: complex/js/util/storage.js ---
// Persistence utility using IndexedDB for saving and loading complex generative states offline
class Storage {
    constructor(dbName = "SynthesiaGrooveboxDB", storeName = "presets") {
        this.dbName = dbName;
        this.storeName = storeName;
        this.db = null;
    }

    async init() {
        if (this.db) return this.db;
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 1);
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName, { keyPath: "name" });
                }
            };
            request.onsuccess = (e) => {
                this.db = e.target.result;
                resolve(this.db);
            };
            request.onerror = (e) => {
                reject(e.target.error);
            };
        });
    }

    async savePreset(name, data) {
        await this.init();
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(this.storeName, "readwrite");
            const store = tx.objectStore(this.storeName);
            const request = store.put({ name, data, timestamp: Date.now() });
            request.onsuccess = () => resolve(true);
            request.onerror = (e) => reject(e.target.error);
        });
    }

    async loadPreset(name) {
        await this.init();
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(this.storeName, "readonly");
            const store = tx.objectStore(this.storeName);
            const request = store.get(name);
            request.onsuccess = (e) => resolve(e.target.result ? e.target.result.data : null);
            request.onerror = (e) => reject(e.target.error);
        });
    }

    async listPresets() {
        await this.init();
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(this.storeName, "readonly");
            const store = tx.objectStore(this.storeName);
            const request = store.getAllKeys();
            request.onsuccess = (e) => resolve(e.target.result);
            request.onerror = (e) => reject(e.target.error);
        });
    }

    async deletePreset(name) {
        await this.init();
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(this.storeName, "readwrite");
            const store = tx.objectStore(this.storeName);
            const request = store.delete(name);
            request.onsuccess = () => resolve(true);
            request.onerror = (e) => reject(e.target.error);
        });
    }
}

const storage = new Storage();




// --- MODULE: complex/js/util/random.js ---
// Seedable pseudorandom number generator for reproducible generative structures
class Random {
    constructor(seed = 12345) {
        this.seed = seed;
    }

    // Returns a float between 0 and 1
    next() {
        let x = Math.sin(this.seed++) * 10000;
        return x - Math.floor(x);
    }

    // Returns a float between min and max
    range(min, max) {
        return min + this.next() * (max - min);
    }

    // Returns an integer between min and max (inclusive)
    intRange(min, max) {
        return Math.floor(this.range(min, max + 1));
    }

    // Pick a random element from an array
    choice(arr) {
        if (!arr || arr.length === 0) return null;
        return arr[Math.floor(this.next() * arr.length)];
    }

    // Shuffle an array in-place and return it
    shuffle(arr) {
        const result = [...arr];
        for (let i = result.length - 1; i > 0; i--) {
            const j = Math.floor(this.next() * (i + 1));
            [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
    }
}

const random = new Random();




// --- MODULE: complex/js/util/midi.js ---
// Web MIDI API wrapper for sending real-time microtonal performances to external gear with pitch bend
class MidiManager {
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

const midiManager = new MidiManager();




// --- MODULE: complex/js/arp/arpGenerator.js ---
// Highly expressive, multi-algorithm generative arpeggiator engine.
// Features a structurally authentic Fractal Fluency Engine that computes pitch and velocity
// self-similarity based on the active/future layers of the Main Bass Progression and dynamic
// user-defined Fractal Roots, propagating cleanly across musical resolution targets.
// Upgraded with classic jazz arpeggio shapes, strict/modal scale constraints, and
// dynamic Voice History & Interdependence tracking to ensure proper voice leading and collision avoidance.

class ArpGenerator {
    constructor() {
        this.index = 0;
        this.playedHistory = []; // Tracks played arpeggio notes as { note, step } for sensory memory decay
    }

    /**
     * Determines next arpeggiator note, velocity, and timing trigger parameters.
     * Computes proper Fractal Fluency based on the main bass progression at multiple structural resolutions.
     * Incorporates rolling pitch history buffer variables to handle polyphonic voice interdependence.
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
     * @param {number} spread - Interval spread voicing mode (0-3)
     * @param {string} rhythmMode - Complexity modes ('standard', 'syncopated', 'dotted', 'ratchet')
     * @param {number} minPitch - Lower MIDI bound (36-127)
     * @param {number} maxPitch - Upper MIDI bound (36-127)
     * @param {string} bassConflictMode - Action style on register clashing ('ignore', 'shift-octave', 'resolve-consonant', 'drop-note')
     * @param {number} gateRandomness - Percent variation in note duration (0-100)
     * @param {number} fractalIntensity - Intensity of fractal scaling adjustments (0-100)
     * @param {number} fractalScale - Multi-scale division base for fractal resolution computations (1-16)
     * @param {number} fractalResolutions - Number of nested fractal layers/resolutions to sample (1-4)
     * @param {Array<boolean>} fractalRoots - 16-step boolean array indicating which rhythm steps act as fractal anchors
     * @param {Array<number>} fullBassProgression - Raw MIDI values representing the 64-bar bass progression
     * @param {number} globalSequencerStep - Total absolute step of the running sequencer (0-1023)
     * @param {string} jazzShape - Classic jazz arpeggio degree mappings ('none', '1-3-5-7', '7-5-3-1', '3-5-7-9', '9-7-5-3', '1-5-3-7', 'full-stack')
     * @param {string} melodicConstraint - Strictly filters output tones ('strict', 'scale-diatonic', 'chromatic')
     * @param {Array<number>} bassHistory - Array of recently triggered bass MIDI pitches
     * @param {Array<number>} arpHistory - Array of recently triggered arpeggiator MIDI pitches
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
        fractalIntensity = 0,
        fractalScale = 4,
        fractalResolutions = 3,
        fractalRoots = [],
        fullBassProgression = [],
        globalSequencerStep = 0,
        jazzShape = "none",
        melodicConstraint = "scale-diatonic",
        bassHistory = [],
        arpHistory = [],
        perceptualMode = "off",
        targetTension = 0.40,
        sensoryDecay = 5.0
    ) {
        // --- Structural Fractal Fluency Calculation ---
        let fractalFluencyOffset = 0;
        let fractalFluencyVelocityMod = 0;

        if (fractalIntensity > 0 && fullBassProgression && fullBassProgression.length > 0) {
            const stepInBar = globalSequencerStep % 16;
            let anchorStep = -1;
            let minDistance = 999;
            const checkRoots = (fractalRoots && fractalRoots.length === 16) ? fractalRoots : [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false];

            for (let i = 0; i < 16; i++) {
                if (checkRoots[i]) {
                    const dist = Math.abs(stepInBar - i);
                    if (dist < minDistance) {
                        minDistance = dist;
                        anchorStep = i;
                    }
                }
            }
            if (anchorStep === -1) anchorStep = 0;

            const absoluteAnchorIndex = globalSequencerStep - stepInBar + anchorStep;

            let combinedDeviation = 0;
            let totalWeight = 0;

            const scaleFactor = Math.max(1, Math.floor(fractalScale));
            const numResolutions = Math.max(1, Math.min(4, fractalResolutions));

            for (let r = 0; r < numResolutions; r++) {
                const windowSize = Math.pow(scaleFactor, r);
                const weight = 1.0 / (r + 1);

                const sampleIdx1 = Math.max(0, Math.min(fullBassProgression.length - 1, absoluteAnchorIndex - windowSize));
                const sampleIdx2 = Math.max(0, Math.min(fullBassProgression.length - 1, absoluteAnchorIndex + windowSize));

                const val1 = fullBassProgression[sampleIdx1] || 36;
                const val2 = fullBassProgression[sampleIdx2] || 36;
                const valAnchor = fullBassProgression[Math.max(0, Math.min(fullBassProgression.length - 1, absoluteAnchorIndex))] || 36;

                const dev = ((val1 + val2) / 2.0) - valAnchor;
                combinedDeviation += dev * weight;
                totalWeight += weight;
            }

            const normalizedDeviation = totalWeight > 0 ? (combinedDeviation / totalWeight) : 0;
            const intensityCoeff = fractalIntensity / 100.0;

            fractalFluencyOffset = Math.round(normalizedDeviation * intensityCoeff);
            fractalFluencyVelocityMod = Math.round(normalizedDeviation * 15 * intensityCoeff);
        }

        // 1. Fractal-influenced density filter
        let adjustedDensity = density;
        if (fractalIntensity > 0) {
            const densityMod = (fractalFluencyOffset % 3) * 10;
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

        // Density check
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
        let targetNote = notes[0];

        // --- Algorithmic Scale/Mode Construction for Dynamic Arpeggio Shapes ---
        const chordRoot = notes[0];
        const isMinor = chord.quality.includes("min") || chord.quality.includes("m7b5") || chord.quality.includes("dim");
        const isDominant = chord.quality.includes("dom") || chord.quality.includes("7");
        const isAltered = chord.quality.includes("alt") || chord.quality.includes("sharp11");

        let scaleIntervals = [0, 2, 4, 5, 7, 9, 11]; // Major default
        if (isAltered) {
            scaleIntervals = [0, 1, 3, 4, 6, 8, 10]; // Super Locrian / Altered
        } else if (chord.quality.includes("m7b5")) {
            scaleIntervals = [0, 1, 3, 5, 6, 8, 10]; // Locrian
        } else if (chord.quality.includes("dim")) {
            scaleIntervals = [0, 2, 3, 5, 6, 8, 9, 11]; // Diminished HW
        } else if (isMinor) {
            scaleIntervals = [0, 2, 3, 5, 7, 9, 10]; // Dorian minor
        } else if (isDominant) {
            scaleIntervals = [0, 2, 4, 5, 7, 9, 10]; // Mixolydian
        }

        const getScaleDegreePitch = (deg) => {
            const scaleDegreeZeroIndexed = deg - 1;
            const octaveShift = Math.floor(scaleDegreeZeroIndexed / scaleIntervals.length);
            const scaleIndex = scaleDegreeZeroIndexed % scaleIntervals.length;
            const interval = scaleIntervals[scaleIndex];
            return chordRoot + (octaveShift * 12) + interval;
        };

        if (perceptualMode === "psychoacoustic") {
            // --- ITERATIVE PSYCHOACOUSTIC RESOLUTION ENGINE (TIME DOMAIN) ---
            const basePitches = new Set();
            notes.forEach(n => basePitches.add(n % 12));

            // Diatonic scale degrees
            [1, 3, 5, 7, 9, 11, 13].forEach(deg => {
                const pitch = getScaleDegreePitch(deg);
                basePitches.add(pitch % 12);
            });

            // Chromatic outside tones for rich perceptual tension targets
            for (let pc = 0; pc < 12; pc++) {
                if (Math.random() < 0.2) {
                    basePitches.add(pc);
                }
            }

            // Expand base pitch classes to all octaves inside limits
            const candidates = [];
            basePitches.forEach(pc => {
                for (let m = pc; m <= 127; m += 12) {
                    if (m >= minPitch && m <= maxPitch) {
                        candidates.push(m);
                    }
                }
            });

            if (candidates.length === 0) {
                notes.forEach(n => candidates.push(n));
            }

            let bestCandidate = candidates[0] || 60;
            let lowestDev = 999;

            const bassFreq = tuningSystem.getFrequencyInfo(bassNote).frequency;
            const lastArpNote = arpHistory.length > 0 ? arpHistory[arpHistory.length - 1] : null;

            candidates.forEach(cand => {
                const candFreq = tuningSystem.getFrequencyInfo(cand).frequency;

                // Plomp-Levelt Critical Band sensory roughness against active Bass
                const bassFriction = Roughness.plompLevelt(candFreq, bassFreq);

                // Sensory roughness against rolling sensory memory with exponential decay in steps
                let totalHistRoughness = 0.0;
                let totalWeight = 0.0;

                this.playedHistory.forEach(hist => {
                    const deltaSteps = globalSequencerStep - hist.step;
                    if (deltaSteps >= 0) {
                        const decayWeight = Math.exp(-deltaSteps / Math.max(0.1, sensoryDecay));
                        const histFreq = tuningSystem.getFrequencyInfo(hist.note).frequency;
                        const friction = Roughness.plompLevelt(candFreq, histFreq);
                        totalHistRoughness += friction * decayWeight;
                        totalWeight += decayWeight;
                    }
                });

                const normHistRoughness = totalWeight > 0 ? (totalHistRoughness / totalWeight) : 0.0;

                // Perceptual blend of active and historical sensory friction
                const sensoryFriction = (bassFriction * 0.6) + (normHistRoughness * 0.4);

                // Chordal Harmonicity consonance
                const combinedNotes = [cand, ...notes];
                const consonance = Harmonicity.calculate(combinedNotes);
                const harmonicTension = 1.0 - consonance;

                // Voice leading jump cost
                let jumpCost = 0.0;
                if (lastArpNote !== null) {
                    jumpCost = Math.abs(cand - lastArpNote) / 12.0;
                }

                // Perceived tension combination
                const perceivedTension = (sensoryFriction * 0.5) + (harmonicTension * 0.4) + (jumpCost * 0.1);

                // Difference relative to user target tension
                const scoreDev = Math.abs(perceivedTension - targetTension);

                if (scoreDev < lowestDev) {
                    lowestDev = scoreDev;
                    bestCandidate = cand;
                }
            });

            targetNote = bestCandidate;
        } else {
            // Standard arpeggiator ordering and jazz shapes
            let degreeIndices = null;
            if (jazzShape === "1-3-5-7") {
                degreeIndices = [1, 3, 5, 7];
            } else if (jazzShape === "7-5-3-1") {
                degreeIndices = [7, 5, 3, 1];
            } else if (jazzShape === "3-5-7-9") {
                degreeIndices = [3, 5, 7, 9];
            } else if (jazzShape === "9-7-5-3") {
                degreeIndices = [9, 7, 5, 3];
            } else if (jazzShape === "1-5-3-7") {
                degreeIndices = [1, 5, 3, 7];
            } else if (jazzShape === "full-stack") {
                degreeIndices = [1, 3, 5, 7, 9, 11, 13];
            }

            if (degreeIndices) {
                const shapePos = this.index % degreeIndices.length;
                targetNote = getScaleDegreePitch(degreeIndices[shapePos]);
            } else {
                // Core Pattern/Arrangement Ordering Algorithms (if jazzShape is "none")
                let noteIdx = 0;
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
                targetNote = notes[noteIdx] || notes[0];
            }

            // Apply our proper Fractal Fluency pitch transpositions!
            if (fractalIntensity > 0) {
                targetNote += fractalFluencyOffset;
            }
        }

        // --- POLYPHONIC INTERDEPENDENCE & VOICE HISTORY RESOLUTION ---
        if (bassHistory && bassHistory.length > 0) {
            const lastBass = bassHistory[bassHistory.length - 1];

            // A. Voice Crossing Avoidance
            // If the arpeggiator's register starts dipping below the active bass pitch,
            // shift it up by octaves to maintain proper polyphonic voice register separation.
            while (targetNote <= lastBass + 2) {
                targetNote += 12;
            }

            // B. Unison & Collision Avoidance
            // If the arpeggio target matches the exact pitch of the recently played bass,
            // shift the arpeggiator to a beautiful upper extension of the scale (9th, 11th, or 13th)
            if (targetNote === lastBass || (targetNote % 12 === lastBass % 12)) {
                // Snap up to the nearest diatonic 9th (index 4 of scale) or 11th (index 5)
                const extensionDegree = notes.length >= 5 ? 9 : 5;
                targetNote = getScaleDegreePitch(extensionDegree);
                while (targetNote <= lastBass) {
                    targetNote += 12;
                }
            }
        }

        if (arpHistory && arpHistory.length > 0) {
            const lastArp = arpHistory[arpHistory.length - 1];

            // C. Smooth Conjunct Motion & Voice Attraction
            // If the arpeggio note jumps too wide compared to the previous arpeggiator voice output (e.g. > 15 semitones),
            // pull it towards the previous octave to establish seamless, fluid conjunct voice leading.
            const jumpDist = targetNote - lastArp;
            if (Math.abs(jumpDist) > 15) {
                const octaveShift = Math.round(jumpDist / 12) * 12;
                const shiftedNote = targetNote - octaveShift;
                if (shiftedNote >= minPitch && shiftedNote <= maxPitch) {
                    targetNote = shiftedNote;
                }
            }
        }

        // 3. Chromatic / Bebop Passing Enclosures
        if (order === "enclosure" && len > 1 && !degreeIndices) {
            const encStep = step % 3;
            if (encStep === 0) {
                targetNote += 1;
            } else if (encStep === 1) {
                targetNote -= 1;
            }
        }

        // 4. Open Voicing Interval Spread Transpositions
        if (spread === 1) {
            if (this.index % 2 !== 0) targetNote += 7;
        } else if (spread === 2) {
            if (this.index % 2 !== 0) targetNote += 12;
        } else if (spread === 3) {
            if (this.index % 2 !== 0) {
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

        // 8. Melodic Constraint Snap Strategies
        if (melodicConstraint === "strict" && notes.length > 0) {
            let closestNote = notes[0];
            let closestDist = 999;
            for (let i = 0; i < 4; i++) {
                const octShift = (i - 1) * 12;
                for (let k = 0; k < notes.length; k++) {
                    const candidate = notes[k] + octShift;
                    const d = Math.abs(targetNote - candidate);
                    if (d < closestDist) {
                        closestDist = d;
                        closestNote = candidate;
                    }
                }
            }
            targetNote = closestNote;
        } else if (melodicConstraint === "scale-diatonic" && notes.length > 0) {
            const currentPitchClass = targetNote % 12;
            let bestSnap = scaleIntervals[0];
            let bestDist = 999;
            for (let j = 0; j < scaleIntervals.length; j++) {
                const candidateClass = (chordRoot + scaleIntervals[j]) % 12;
                let d = Math.abs(currentPitchClass - candidateClass);
                if (d > 6) d = 12 - d;
                if (d < bestDist) {
                    bestDist = d;
                    bestSnap = candidateClass;
                }
            }
            const octaveOffset = Math.floor(targetNote / 12) * 12;
            targetNote = octaveOffset + bestSnap;
        }

        // 9. Passing Tone Mutation Generator (Dynamic Melodic Tension)
        let isMutated = false;
        if (melodicConstraint === "chromatic" && Math.random() * 100 < mutationRate) {
            const mutationInterval = Math.random() > 0.5 ? 2 : -1;
            const mutatedCandidate = targetNote + mutationInterval;
            if (mutatedCandidate >= minPitch && mutatedCandidate <= maxPitch) {
                targetNote = mutatedCandidate;
                isMutated = true;
            }
        }

        // 10. Advanced Accent & Velocity Modeling
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

        // Apply our proper Fractal Fluency dynamic velocity changes
        if (fractalIntensity > 0) {
            velocity += fractalFluencyVelocityMod;
        }

        // Custom Velocity Randomness Slider Influence
        if (velocityRandomness > 0) {
            const maxJitter = (velocityRandomness / 100) * 45;
            const jitter = Math.floor((Math.random() - 0.5) * 2 * maxJitter);
            velocity += jitter;
        }

        velocity = Math.max(5, Math.min(127, velocity));

        // 11. Gate Randomness and Fractal Gate Modulation
        let gateModifier = 1.0;
        if (gateRandomness > 0) {
            const maxGateJitter = (gateRandomness / 100) * 0.5;
            gateModifier = 1.0 + (Math.random() - 0.5) * 2 * maxGateJitter;
        }

        // Swell gate modification by the fractal fluency offset values
        if (fractalIntensity > 0) {
            const fractalGateSwell = (fractalFluencyOffset % 3) * 0.15;
            gateModifier += fractalGateSwell;
        }

        gateModifier = Math.max(0.1, Math.min(2.0, gateModifier));

        this.index++;

        // Add note and step coordinates to the time-domain sensory memory rolling buffer
        if (targetNote >= minPitch && targetNote <= maxPitch) {
            this.playedHistory.push({ note: targetNote, step: globalSequencerStep });
            if (this.playedHistory.length > 32) {
                this.playedHistory.shift();
            }
        }

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

const arpGenerator = new ArpGenerator();




// --- MODULE: complex/js/audio/audioEngine.js ---
// Audio Context Manager supporting state transitions and global node routing
class AudioEngine {
    constructor() {
        this.ctx = null;
        this.masterVolume = 0.7;
        this.isInitialized = false;
        this.analyser = null;
    }

    async init() {
        if (this.isInitialized) return this.ctx;

        // Setup modern Web Audio API context
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContextClass();

        // Fast Fourier Transform analyzer for visual spectral feedback
        this.analyser = this.ctx.createAnalyser();
        this.analyser.fftSize = 256;

        this.isInitialized = true;
        return this.ctx;
    }

    get currentTime() {
        if (!this.ctx) return 0;
        return this.ctx.currentTime;
    }

    setMasterVolume(val) {
        this.masterVolume = Math.max(0, Math.min(1, val));
    }

    async resume() {
        if (this.ctx && this.ctx.state === "suspended") {
            await this.ctx.resume();
        }
    }

    async suspend() {
        if (this.ctx && this.ctx.state === "running") {
            await this.ctx.suspend();
        }
    }
}

const audioEngine = new AudioEngine();




// --- MODULE: complex/js/audio/effects.js ---
// Audio effects DSP processors including custom WaveShaper distortion, Haas expander and delay lines
class EffectsEngine {
    constructor() {
        this.ctx = null;
        this.delayL = null;
        this.delayR = null;
        this.shaper = null;
        this.reverbNode = null;
        this.chorusNode = null;
        this.merger = null;
        this.splitter = null;
        this.masterGain = null;
    }

    setup(ctx, inputNode, destinationNode) {
        this.ctx = ctx;

        // Create routing nodes
        this.masterGain = ctx.createGain();
        this.masterGain.gain.setValueAtTime(0.7, ctx.currentTime);

        // Saturation Waveshaper (Chebyshev curve for harmonic saturation)
        this.shaper = ctx.createWaveShaper();
        this.shaper.curve = this.makeDistortionCurve(20);
        this.shaper.oversample = "4x";

        // Haas stereo expander split routing
        this.splitter = ctx.createChannelSplitter(2);
        this.merger = ctx.createChannelMerger(2);

        this.delayL = ctx.createDelay(1.0);
        this.delayR = ctx.createDelay(1.0);

        // Default delays for stereo Haas expansion (12ms left, 35ms right)
        this.delayL.delayTime.setValueAtTime(0.012, ctx.currentTime);
        this.delayR.delayTime.setValueAtTime(0.035, ctx.currentTime);

        // Reverb / Delay feedback line
        this.feedbackDelay = ctx.createDelay(2.0);
        this.feedbackGain = ctx.createGain();
        this.feedbackDelay.delayTime.setValueAtTime(0.35, ctx.currentTime); // dotted eighth-ish
        this.feedbackGain.gain.setValueAtTime(0.3, ctx.currentTime);

        // Routing path
        inputNode.connect(this.shaper);
        this.shaper.connect(this.feedbackDelay);

        // Delay loop back
        this.feedbackDelay.connect(this.feedbackGain);
        this.feedbackGain.connect(this.feedbackDelay);
        this.feedbackGain.connect(this.masterGain);

        // Haas split from the saturator
        this.shaper.connect(this.splitter);
        this.splitter.connect(this.delayL, 0);
        this.splitter.connect(this.delayR, 1);

        this.delayL.connect(this.merger, 0, 0);
        this.delayR.connect(this.merger, 0, 1);

        this.merger.connect(this.masterGain);
        this.masterGain.connect(destinationNode);
    }

    setMasterVolume(val) {
        if (this.masterGain) {
            this.masterGain.gain.setTargetAtTime(val, this.ctx.currentTime, 0.05);
        }
    }

    setSaturation(amount) {
        if (this.shaper) {
            this.shaper.curve = this.makeDistortionCurve(amount * 5);
        }
    }

    setDelayDryWet(amount) {
        if (this.feedbackGain) {
            this.feedbackGain.gain.setTargetAtTime(amount * 0.6, this.ctx.currentTime, 0.05);
        }
    }

    setHaasWidth(amount) {
        if (this.delayR) {
            // Delay R between 10ms and 50ms based on width slider
            const targetDelay = 0.010 + amount * 0.040;
            this.delayR.delayTime.setTargetAtTime(targetDelay, this.ctx.currentTime, 0.05);
        }
    }

    makeDistortionCurve(amount) {
        const k = typeof amount === 'number' ? amount : 50;
        const n_samples = 44100;
        const curve = new Float32Array(n_samples);
        const deg = Math.PI / 180;
        for (let i = 0; i < n_samples; ++i) {
            const x = (i * 2) / n_samples - 1;
            curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
        }
        return curve;
    }
}

const effectsEngine = new EffectsEngine();




// --- MODULE: complex/js/audio/synthesizer.js ---
// Self-contained subtractive synth, FM synth and physical pluck sound generators
// Upgraded to dynamically modulate DSP filters and envelopes using real-time psychoacoustic coefficients.
class Synthesizer {
    constructor(ctx, destination) {
        this.ctx = ctx;
        this.destination = destination;
        this.bassSubLevel = 0.5;
        this.activeNodes = [];
    }

    /**
     * Synthesizes an analog-style plucked note using sub-oscillators and multi-mode filtering
     * @param {number} frequency - Target frequency of the note
     * @param {number} time - AudioContext timeline schedule moment
     * @param {number} dynamicGain - Dynamic gain scalar based on velocity (0.0 - 1.0)
     * @param {number} durationMultiplier - Length modification coefficient
     * @param {number} roughness - Real-time sensory roughness coefficient (0.0 - 1.0)
     * @param {number} harmonicity - Real-time chordal harmonicity coefficient (0.0 - 1.0)
     */
    triggerSubtractivePluck(frequency, time, dynamicGain = 0.25, durationMultiplier = 1.0, roughness = 0.1, harmonicity = 0.8) {
        // Modulate decay/duration based on the harmonicity clarity level
        const duration = (0.25 + (harmonicity * 0.15)) * durationMultiplier;
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();
        const filterNode = this.ctx.createBiquadFilter();

        osc1.type = "sawtooth";
        osc1.frequency.setValueAtTime(frequency, time);

        osc2.type = "square";
        osc2.frequency.setValueAtTime(frequency * 1.006, time);

        filterNode.type = "lowpass";
        // High roughness (sensory dissonance) drives up lowpass filter resonance for a biting, sharp, resonant timbre!
        const adjustedQ = 3.0 + (roughness * 12.0);
        filterNode.Q.setValueAtTime(adjustedQ, time);

        // Envelope sweeping the lowpass frequency downwards quickly
        filterNode.frequency.setValueAtTime(150, time);
        filterNode.frequency.exponentialRampToValueAtTime(3500, time + 0.02);
        filterNode.frequency.exponentialRampToValueAtTime(300, time + duration);

        gainNode.gain.setValueAtTime(0.001, time);
        gainNode.gain.linearRampToValueAtTime(dynamicGain, time + 0.005);
        gainNode.gain.exponentialRampToValueAtTime(0.001, time + duration);

        osc1.connect(filterNode);
        osc2.connect(filterNode);
        filterNode.connect(gainNode);
        gainNode.connect(this.destination);

        osc1.start(time);
        osc2.start(time);
        osc1.stop(time + duration);
        osc2.stop(time + duration);
    }

    /**
     * Synthesizes a frequency-modulation (FM) pluck with sharp attack
     * @param {number} frequency - Target frequency of the note
     * @param {number} time - AudioContext timeline schedule moment
     * @param {number} dynamicGain - Dynamic gain scalar based on velocity (0.0 - 1.0)
     * @param {number} durationMultiplier - Length modification coefficient
     * @param {number} roughness - Real-time sensory roughness coefficient (0.0 - 1.0)
     * @param {number} harmonicity - Real-time chordal harmonicity coefficient (0.0 - 1.0)
     */
    triggerFmPluck(frequency, time, dynamicGain = 0.22, durationMultiplier = 1.0, roughness = 0.1, harmonicity = 0.8) {
        // High harmonicity extends the decay duration of the FM bell-like pluck for long organic tails
        const duration = (0.20 + (harmonicity * 0.18)) * durationMultiplier;
        const carrier = this.ctx.createOscillator();
        const modulator = this.ctx.createOscillator();
        const carrierGain = this.ctx.createGain();
        const modGain = this.ctx.createGain();

        carrier.type = "sine";
        carrier.frequency.setValueAtTime(frequency, time);

        modulator.type = "sine";
        modulator.frequency.setValueAtTime(frequency * 3.5, time);

        // FM index envelope: high roughness dramatically increases index peak to trigger raw metallic dissonance!
        const maxIndex = frequency * (4 + (roughness * 15));
        modGain.gain.setValueAtTime(maxIndex, time);
        modGain.gain.exponentialRampToValueAtTime(10, time + duration);

        carrierGain.gain.setValueAtTime(0.001, time);
        carrierGain.gain.linearRampToValueAtTime(dynamicGain, time + 0.005);
        carrierGain.gain.exponentialRampToValueAtTime(0.001, time + duration);

        modulator.connect(modGain);
        modGain.connect(carrier.frequency);
        carrier.connect(carrierGain);
        carrierGain.connect(this.destination);

        carrier.start(time);
        modulator.start(time);
        carrier.stop(time + duration);
        modulator.stop(time + duration);
    }

    /**
     * Plucks a bass note using a hybrid physical model and subtractive lowpass filters
     */
    triggerPluckedBass(frequency, time, duration = 0.4) {
        const osc = this.ctx.createOscillator();
        const subOsc = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();
        const filterNode = this.ctx.createBiquadFilter();

        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(frequency, time);

        // Sine sub bass oscillator tuned 1 octave lower
        subOsc.type = "sine";
        subOsc.frequency.setValueAtTime(frequency * 0.5, time);

        const subGain = this.ctx.createGain();
        subGain.gain.setValueAtTime(this.bassSubLevel * 0.5, time);

        filterNode.type = "lowpass";
        filterNode.Q.setValueAtTime(3, time);
        // Heavy decay lowpass filter envelope to shape walking bass notes
        filterNode.frequency.setValueAtTime(800, time);
        filterNode.frequency.exponentialRampToValueAtTime(80, time + duration);

        gainNode.gain.setValueAtTime(0.001, time);
        gainNode.gain.linearRampToValueAtTime(0.6, time + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, time + duration);

        osc.connect(filterNode);
        subOsc.connect(subGain);
        subGain.connect(filterNode);

        filterNode.connect(gainNode);
        gainNode.connect(this.destination);

        osc.start(time);
        subOsc.start(time);
        osc.stop(time + duration);
        subOsc.stop(time + duration);
    }

    /**
     * Synthesizes drum-machine style instruments: Kick, Snare, Hihat
     */
    triggerDrum(type, time) {
        if (type === "kick") {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = "sine";
            // Classic pitch sweep kick drum
            osc.frequency.setValueAtTime(150, time);
            osc.frequency.exponentialRampToValueAtTime(45, time + 0.08);

            gain.gain.setValueAtTime(0.001, time);
            gain.gain.linearRampToValueAtTime(0.8, time + 0.002);
            gain.gain.exponentialRampToValueAtTime(0.001, time + 0.25);

            osc.connect(gain);
            gain.connect(this.destination);

            osc.start(time);
            osc.stop(time + 0.25);
        } else if (type === "snare") {
            // Snare uses white noise coupled with a fundamental oscillator
            const osc = this.ctx.createOscillator();
            const oscGain = this.ctx.createGain();
            const noise = this.ctx.createBufferSource();
            const noiseGain = this.ctx.createGain();
            const noiseFilter = this.ctx.createBiquadFilter();

            // Fundamental snare body tone
            osc.type = "triangle";
            osc.frequency.setValueAtTime(180, time);
            oscGain.gain.setValueAtTime(0.4, time);
            oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

            // Buffer noise generation
            const bufferSize = this.ctx.sampleRate * 0.2; // 200ms
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }
            noise.buffer = buffer;

            noiseFilter.type = "bandpass";
            noiseFilter.frequency.setValueAtTime(1000, time);

            noiseGain.gain.setValueAtTime(0.6, time);
            noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);

            osc.connect(oscGain);
            oscGain.connect(this.destination);

            noise.connect(noiseFilter);
            noiseFilter.connect(noiseGain);
            noiseGain.connect(this.destination);

            osc.start(time);
            noise.start(time);
            osc.stop(time + 0.15);
            noise.stop(time + 0.2);
        } else if (type === "hihat") {
            // White noise highpass band filter simulation
            const noise = this.ctx.createBufferSource();
            const filter = this.ctx.createBiquadFilter();
            const gain = this.ctx.createGain();

            const bufferSize = this.ctx.sampleRate * 0.05; // 50ms quick decay
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }
            noise.buffer = buffer;

            filter.type = "highpass";
            filter.frequency.setValueAtTime(7000, time);

            gain.gain.setValueAtTime(0.12, time);
            gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(this.destination);

            noise.start(time);
            noise.stop(time + 0.05);
        }
    }
}




// --- MODULE: complex/js/harmony/chordDictionary.js ---
// Complete Jazz and Modal Chord Dictionary representing roots, qualities and extensions
const chordDictionary = {
    "maj7": [0, 4, 7, 11],
    "maj9": [0, 4, 7, 11, 14],
    "maj13": [0, 4, 7, 11, 14, 21],
    "min7": [0, 3, 7, 10],
    "min9": [0, 3, 7, 10, 14],
    "min11": [0, 3, 7, 10, 14, 17],
    "dom7": [0, 4, 7, 10],
    "dom9": [0, 4, 7, 10, 14],
    "dom13": [0, 4, 7, 10, 14, 21],
    "dom7alt": [0, 4, 8, 10, 13, 15, 20], // Altered dominant with flat/sharp extensions
    "dom9b5": [0, 4, 6, 10, 14],
    "m7b5": [0, 3, 6, 10], // Half-diminished
    "dim7": [0, 3, 6, 9],  // Fully diminished
    "maj7sharp11": [0, 4, 7, 11, 14, 18] // Lydian sound
};

/**
 * Returns MIDI note numbers matching a given root and chord type
 * @param {number} root - MIDI note number representing the chord root
 * @param {string} quality - Chord quality string (e.g., 'maj9')
 * @returns {Array<number>} Array of MIDI note numbers
 */
function buildChord(root, quality) {
    const offsets = chordDictionary[quality] || [0, 4, 7];
    return offsets.map(offset => root + offset);
}





// --- MODULE: complex/js/bass/walkingBass.js ---
// Generative walking basslines using chromatic enclosures, passing tones, and bebop scales
class WalkingBass {
    /**
     * Calculates the walking bass note for a specific step in a bar
     * @param {Object} chord - Current active chord { notes: [root, 3rd, 5th, 7th], root: MIDI }
     * @param {Object} nextChord - Next chord on deck for resolution
     * @param {number} step - Current step inside the bar (0 to 15)
     * @param {string} style - Walking stylistic profile ('enclosure', 'bebop', 'diminished', 'tritone')
     * @param {number} rootBias - Percentage representing weight of staying close to chord root (0 to 100)
     */
    static generateBassNote(chord, nextChord, step, style = "enclosure", rootBias = 60) {
        if (!chord || !chord.notes || chord.notes.length === 0) return 36; // Default standard C1

        const chordNotes = chord.notes;
        const root = chordNotes[0];

        // Define octave drop for walking bass ranges
        const bassRoot = root - 24;

        // On the downbeat (step 0), always establish structural roots
        if (step === 0) {
            return bassRoot;
        }

        // On step 8 (halfway), establish the perfect fifth or active root
        if (step === 8) {
            const fifth = chordNotes[2] ? chordNotes[2] - 24 : bassRoot + 7;
            return Math.random() * 100 < rootBias ? fifth : bassRoot;
        }

        // Final step of bar (step 15): solve transition to next chord's root with chromatic enclosure
        if (step === 15 && nextChord && nextChord.notes) {
            const targetRoot = nextChord.notes[0] - 24;

            if (style === "enclosure") {
                // Return a half-step above or below the target root (chromatic enclosure)
                return Math.random() > 0.5 ? targetRoot + 1 : targetRoot - 1;
            } else if (style === "tritone") {
                // Approaching via tritone interval (b5 resolution)
                return targetRoot + 6;
            } else {
                // Standard leading tone (half-step below)
                return targetRoot - 1;
            }
        }

        // Mid-beats steps: traverse chord scales using chosen stylistic algorithms
        if (style === "bebop") {
            // Bebop scale walking: construct steps relative to chord's root, moving up/down dynamically
            const bebopOffsets = [0, 2, 4, 5, 7, 8, 9, 11];
            // Walk up or down based on step number
            const dir = (step % 8 < 4) ? 1 : -1;
            const offsetIdx = Math.floor(step * 1.5) % bebopOffsets.length;
            const note = bassRoot + (dir * bebopOffsets[offsetIdx]);

            // Constrain bass note to realistic frequency range (midi 28 to 52)
            return Math.max(28, Math.min(52, note));
        }

        if (style === "diminished") {
            // Half-whole diminished: 0, 1, 3, 4, 6, 7, 9, 10
            const dimOffsets = [0, 1, 3, 4, 6, 7, 9, 10];
            const dir = (step % 6 < 3) ? 1 : -1;
            const offsetIdx = step % dimOffsets.length;
            const note = bassRoot + (dir * dimOffsets[offsetIdx]);
            return Math.max(28, Math.min(52, note));
        }

        // Fallback default: select chord notes walk (root, third, fifth, seventh) with small octave shifts
        const noteIdx = Math.floor((step / 4) % chordNotes.length);
        const selectedNote = chordNotes[noteIdx] - 24;

        return selectedNote;
    }
}





// --- MODULE: complex/js/harmony/pentatonicBridge.js ---
// Pentatonic Bridge Generator inserting rapid transition bridges (e.g., minor pentatonic scale runs)

class PentatonicBridge {
    /**
     * Injects transient pentatonic bridge scale notes on specific offbeat sixteenth steps
     * @param {Object} currentChord - The base chord currently active in the bar
     * @param {Object} nextChord - The incoming target chord
     * @param {number} length - Slider value specifying length of bridge in steps
     * @returns {Array<number>} Scale notes matching the bridging minor/major pentatonic scale
     */
    static getBridgeNotes(currentChord, nextChord, length = 1) {
        if (!currentChord || !nextChord || length <= 0) return null;

        // Formulate minor/major pentatonic bridge a tritone or perfect fifth away
        // to build harmonic expectation and tension
        const root = currentChord.root;
        const bridgeRoot = (root + 6) % 12 + 60; // Tritone shift

        // Minor Pentatonic scale intervals: 0, 3, 5, 7, 10
        const scaleOffsets = [0, 3, 5, 7, 10];
        const bridgeScale = scaleOffsets.map(offset => bridgeRoot + offset);

        return bridgeScale;
    }
}





// --- MODULE: complex/js/harmony/jazzProgression.js ---
// Generative Jazz progression engine with dynamic path-finding lookahead

class JazzProgression {
    constructor() {
        this.noteNames = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];
    }

    getNoteName(midiVal) {
        return this.noteNames[midiVal % 12];
    }

    /**
     * Dynamically plans and generates a full 64-bar jazz chord progression
     * with long-range structural planning (modulation, tension arcs, and turnarounds).
     * @param {number} root - Base Root MIDI Note Center (e.g. 60 for C)
     * @param {string} style - Stylistic goal configuration
     * @param {number} jazzPerc - Slider value 0-100 indicating jazz density
     * @param {number} outsidePerc - Slider value 0-100 indicating substitution density
     * @param {Object|null} inputChord - Optional fixed initial chord {root: number, quality: string}
     * @param {Object|null} outputChord - Optional subsequent target chord {root: number, quality: string}
     */
    generate(root, style, jazzPerc = 60, outsidePerc = 20, inputChord = null, outputChord = null) {
        const progression = [];
        const optimizer = new GraphOptimizer();

        // 1. Build a 2D candidates array [barIndex][candidates]
        const candidatesByBar = [];

        for (let b = 0; b < 64; b++) {
            const candidates = [];
            const subBar = b % 4; // micro-structure loop inside a 4-bar unit
            const section = Math.floor(b / 16); // 0: A1 (Exposition), 1: A2 (Modulation), 2: B (Outside/Modal), 3: A3 (Turnaround/Resolution)

            // Calculate section-specific base keys
            let localRoot = root;
            if (section === 1) {
                // Modulate up a perfect fourth (Subdominant modulation - classic jazz/pop standard structure)
                localRoot = (root + 5) % 12 + 48;
            } else if (section === 2) {
                // Modulate to the relative minor / modal shift (Darker section)
                localRoot = (root + 9) % 12 + 48;
            }

            if (b === 0 && inputChord) {
                candidates.push({
                    root: inputChord.root,
                    quality: inputChord.quality,
                    name: `${this.getNoteName(inputChord.root)}${inputChord.quality} (Input)`,
                    type: "tonic"
                });
            } else if (subBar === 0) {
                // I chord candidates (Tonic center)
                candidates.push({ root: localRoot, quality: "maj9", name: `${this.getNoteName(localRoot)}maj9`, type: "tonic" });
                candidates.push({ root: localRoot, quality: "maj13", name: `${this.getNoteName(localRoot)}maj13`, type: "tonic" });

                if (jazzPerc > 50) {
                    candidates.push({ root: localRoot, quality: "maj7sharp11", name: `${this.getNoteName(localRoot)}maj7#11 (Lydian)`, type: "tonic" });
                }

                // Modal Interchange tonic from parallel minor
                if (style === "dark" || outsidePerc > 30) {
                    const minRoot = localRoot;
                    candidates.push({ root: minRoot, quality: "min9", name: `${this.getNoteName(minRoot)}min9 (Parallel Minor)`, type: "tonic" });
                }
            } else if (subBar === 1) {
                // vi / secondary dominant candidates (Tension building)
                const viRoot = (localRoot + 9) % 12 + 48;
                candidates.push({ root: viRoot, quality: "min9", name: `${this.getNoteName(viRoot)}min9 (vi)`, type: "subdominant" });
                candidates.push({ root: viRoot, quality: "min11", name: `${this.getNoteName(viRoot)}min11`, type: "subdominant" });

                // Secondary Dominant of ii (VI7alt)
                if (jazzPerc > 40) {
                    const secDomRoot = (localRoot + 9) % 12 + 48; // VI7
                    candidates.push({ root: secDomRoot, quality: "dom7alt", name: `${this.getNoteName(secDomRoot)}7alt (VI7)`, type: "subdominant" });
                }
            } else if (subBar === 2) {
                // ii chord candidates (Subdominant)
                const iiRoot = (localRoot + 2) % 12 + 48;
                candidates.push({ root: iiRoot, quality: "min7", name: `${this.getNoteName(iiRoot)}min7 (ii)`, type: "subdominant" });
                candidates.push({ root: iiRoot, quality: "min9", name: `${this.getNoteName(iiRoot)}min9 (ii)`, type: "subdominant" });

                // half-diminished ii chord for minor-mode jazz flavor
                if (style === "dark" || jazzPerc > 60) {
                    candidates.push({ root: iiRoot, quality: "m7b5", name: `${this.getNoteName(iiRoot)}m7b5 (iiø)`, type: "subdominant" });
                }

                // IV chord
                const ivRoot = (localRoot + 5) % 12 + 48;
                candidates.push({ root: ivRoot, quality: "maj7sharp11", name: `${this.getNoteName(ivRoot)}maj7#11 (IV)`, type: "subdominant" });
            } else if (subBar === 3) {
                // V chord candidates (Dominant)
                const vRoot = (localRoot + 7) % 12 + 48;

                // Traditional or Altered Dominant
                if (outsidePerc > 40 || style === "progressive" || style === "experimental") {
                    candidates.push({ root: vRoot, quality: "dom7alt", name: `${this.getNoteName(vRoot)}7alt (V7alt)`, type: "dominant" });
                    candidates.push({ root: vRoot, quality: "dom9b5", name: `${this.getNoteName(vRoot)}9b5 (V7b5)`, type: "dominant" });
                } else {
                    candidates.push({ root: vRoot, quality: "dom9", name: `${this.getNoteName(vRoot)}dom9 (V9)`, type: "dominant" });
                    candidates.push({ root: vRoot, quality: "dom13", name: `${this.getNoteName(vRoot)}dom13 (V13)`, type: "dominant" });
                }

                // Tritone Substitution (bII7alt)
                if (outsidePerc > 15 || style === "progressive" || style === "experimental") {
                    const bIIRoot = (localRoot + 1) % 12 + 48;
                    candidates.push({ root: bIIRoot, quality: "dom7alt", name: `${this.getNoteName(bIIRoot)}7alt (bII7 Tritone)`, type: "dominant" });
                    candidates.push({ root: bIIRoot, quality: "maj7sharp11", name: `${this.getNoteName(bIIRoot)}7#11 (bII)`, type: "dominant" });
                }

                // End of progression (Bar 64): High tension turnaround chord to loop back to the start root
                if (b === 63) {
                    const turnaroundRoot = (root + 11) % 12 + 48; // bVII or viio
                    candidates.push({ root: turnaroundRoot, quality: "dim7", name: `${this.getNoteName(turnaroundRoot)}dim7 (Turnaround)`, type: "dominant" });
                }
            }

            candidatesByBar.push(candidates);
        }

        // 2. Score transitions: Optimize for voice leading distances & shared pitches
        const transitionScorer = (chordA, chordB) => {
            const notesA = buildChord(chordA.root, chordA.quality);
            const notesB = buildChord(chordB.root, chordB.quality);

            // Voice leading distance cost mapping
            const vlCost = GraphOptimizer.computeVoiceLeadingCost(notesA, notesB);

            // Common tone multiplier bonus
            let commonTones = 0;
            const setA = new Set(notesA.map(n => n % 12));
            for (const n of notesB) {
                if (setA.has(n % 12)) commonTones++;
            }
            const commonBonus = commonTones * 0.25; // Boosted common-tone weight

            // Tonic-to-Dominant flow alignment bonus
            let syntaxBonus = 0;
            if (chordA.type === "subdominant" && chordB.type === "dominant") syntaxBonus = 0.6;
            if (chordA.type === "dominant" && chordB.type === "tonic") syntaxBonus = 0.8;

            return vlCost + commonBonus + syntaxBonus;
        };

        // If outputChord is provided, append as 65th target node to guide transition voice leading
        if (outputChord) {
            candidatesByBar.push([{
                root: outputChord.root,
                quality: outputChord.quality,
                name: `${this.getNoteName(outputChord.root)}${outputChord.quality} (Output Target)`,
                type: "tonic"
            }]);
        }

        // 3. Find global path using DP lookahead
        const rawPath = optimizer.findOptimalPath(candidatesByBar, transitionScorer, 4);

        // Map raw chords into progression blocks (only take the first 64 elements)
        for (let b = 0; b < 64; b++) {
            const chordMeta = rawPath[b] || candidatesByBar[b][0];
            const notes = buildChord(chordMeta.root, chordMeta.quality);

            progression.push({
                root: chordMeta.root,
                quality: chordMeta.quality,
                name: chordMeta.name,
                notes: notes,
                type: "base"
            });
        }

        return progression;
    }
}

const jazzProgression = new JazzProgression();




// --- MODULE: complex/js/main.js ---
// Global Orchestrator mapping, sequencing and binding Audio / Theory modules together

// Global Application Core State
let clock;
let synth;
let activeProgression = [];
let preRenderedBassNotes = [];
let playedBassHistory = [];
let playedArpHistory = [];
let patternInstance;
let expectationInstance;

let currentSelectedBar = 0; // Highlights/Selection editing index
let lastActiveChord = null;

// Initialization routine
async function initApp() {
    // Populate all 6 loop length dropdowns dynamically with options from 64 down to 1 steps, defaulting to 64
    const loopLengthDropdowns = ["selectKickLength", "selectSnareLength", "selectHihatLength", "selectBassLength", "selectArpLength", "selectFracLength"];
    loopLengthDropdowns.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.innerHTML = "";
            for (let steps = 64; steps >= 1; steps--) {
                const opt = document.createElement("option");
                opt.value = steps;
                opt.innerText = `${steps} Steps ${steps === 64 ? "(Default / 4-Bar)" : steps === 16 ? "(1-Bar)" : ""}`;
                if (steps === 64) opt.selected = true;
                el.appendChild(opt);
            }
        }
    });

    // 1. Setup Audio & effects
    const ctx = await audioEngine.init();

    // Route synthesizer nodes into effects block
    const preFxNode = ctx.createGain();
    synth = new Synthesizer(ctx, preFxNode);
    effectsEngine.setup(ctx, preFxNode, audioEngine.analyser);
    audioEngine.analyser.connect(ctx.destination);

    // 2. Initialize Core instances (we map 4 bars of pattern data)
    patternInstance = new Pattern(4, 16);
    expectationInstance = new Expectation();

    // Default Patterns (Set up structurally authentic classical jazz and fractal test pattern)
    for (let b = 0; b < 4; b++) {
        // Drums
        for (let i = 0; i < 16; i += 4) patternInstance.data[b].kick[i] = true;
        patternInstance.data[b].snare[4] = true;
        patternInstance.data[b].snare[12] = true;
        for (let i = 2; i < 16; i += 4) patternInstance.data[b].hihat[i] = true;

        // One walking bass note trigger at step 0 only
        patternInstance.data[b].bass[0] = true;
        for (let i = 1; i < 16; i++) patternInstance.data[b].bass[i] = false;

        // One fractal root trigger at step 0 (coinciding with the bass note)
        patternInstance.data[b].frac[0] = true;
        for (let i = 1; i < 16; i++) patternInstance.data[b].frac[i] = false;

        // Arpeggiator active on EVERY step (0 to 15) with 1x multiplier
        for (let i = 0; i < 16; i++) {
            patternInstance.data[b].arp[i] = 1;
        }
    }

    // 3. Generate initial Jazz Progression
    generateProgression();

    // 4. Setup Sequencer Scheduler Clock
    clock = new Clock((stepIndex, time) => {
        scheduleStep(stepIndex, time);
    });

    // 5. Connect UI bindings
    bindUIEvents();
    renderTimeline();
    renderGrids();
    renderKeyboard();

    // 6. Connect Canvas Visualizations
    Visualizers.drawSpectrum(document.getElementById("canvasSpectrum"), audioEngine.analyser);
    Visualizers.drawTonnetz(document.getElementById("canvasTonnetz"));
}

function generateProgression() {
    const rootKey = parseInt(document.getElementById("selectRootKey").value);
    const style = document.getElementById("selectProgStyle").value;
    const jazzPerc = parseInt(document.getElementById("sliderJazzPerc").value);
    const outsidePerc = parseInt(document.getElementById("sliderOutsidePerc").value);

    // Dynamic optional input and output chords from external integration panels
    const enableInput = document.getElementById("checkEnableInputChord").checked;
    const enableOutput = document.getElementById("checkEnableOutputChord").checked;

    const inputChord = enableInput ? {
        root: parseInt(document.getElementById("selectInputRoot").value),
        quality: document.getElementById("selectInputQuality").value
    } : null;

    const outputChord = enableOutput ? {
        root: parseInt(document.getElementById("selectOutputRoot").value),
        quality: document.getElementById("selectOutputQuality").value
    } : null;

    activeProgression = jazzProgression.generate(rootKey, style, jazzPerc, outsidePerc, inputChord, outputChord);

    // Add brief bridges if configured
    const bridgeLen = parseInt(document.getElementById("sliderBridgeLength").value);
    if (bridgeLen > 0) {
        for (let b = 0; b < 64; b++) {
            if ((b + 1) % 4 === 0 && b < 63) {
                // Insert pentatonic bridges dynamically inside timeline slots
                const bridgeNotes = PentatonicBridge.getBridgeNotes(activeProgression[b], activeProgression[b + 1], bridgeLen);
                if (bridgeNotes) {
                    activeProgression[b].notes = bridgeNotes;
                    activeProgression[b].name += " [Bridge]";
                    activeProgression[b].type = "bridge";
                }
            }
        }
    }

    // Pre-calculate/pre-render complete 1024-step walking bass MIDI progression for structural Fractal Fluency analysis
    const bassStyle = document.getElementById("selectBassStyle") ? document.getElementById("selectBassStyle").value : "enclosure";
    const bassBias = document.getElementById("sliderBassBias") ? parseInt(document.getElementById("sliderBassBias").value) : 60;
    preRenderedBassNotes = [];
    for (let bar = 0; bar < 64; bar++) {
        const chord = activeProgression[bar];
        const nextChord = activeProgression[(bar + 1) % 64];
        for (let step = 0; step < 16; step++) {
            const note = WalkingBass.generateBassNote(chord, nextChord, step, bassStyle, bassBias);
            preRenderedBassNotes.push(note);
        }
    }

    renderTimeline();
}

function scheduleStep(stepIndex, time) {
    // Retrieve individual polymetric track loop lengths from UI
    const kickLen = parseInt(document.getElementById("selectKickLength")?.value || "16");
    const snareLen = parseInt(document.getElementById("selectSnareLength")?.value || "16");
    const hihatLen = parseInt(document.getElementById("selectHihatLength")?.value || "16");
    const bassLen = parseInt(document.getElementById("selectBassLength")?.value || "16");
    const arpLen = parseInt(document.getElementById("selectArpLength")?.value || "16");
    const fracLen = parseInt(document.getElementById("selectFracLength")?.value || "16");

    // clock.currentStep cycles from 0 to 63 steps (representing 4 bars)
    const currentGlobalStep = clock.currentStep;
    const activeStepInBar = currentGlobalStep % 16;

    // Calculate loop-bound step index for each polymetric lane
    const kickStepGlobal = currentGlobalStep % kickLen;
    const snareStepGlobal = currentGlobalStep % snareLen;
    const hihatStepGlobal = currentGlobalStep % hihatLen;
    const bassStepGlobal = currentGlobalStep % bassLen;
    const arpStepGlobal = currentGlobalStep % arpLen;
    const fracStepGlobal = currentGlobalStep % fracLen;

    const kickBar = Math.floor(kickStepGlobal / 16);
    const kickStep = kickStepGlobal % 16;
    const snareBar = Math.floor(snareStepGlobal / 16);
    const snareStep = snareStepGlobal % 16;
    const hihatBar = Math.floor(hihatStepGlobal / 16);
    const hihatStep = hihatStepGlobal % 16;
    const bassBar = Math.floor(bassStepGlobal / 16);
    const bassStep = bassStepGlobal % 16;
    const arpBar = Math.floor(arpStepGlobal / 16);
    const arpStep = arpStepGlobal % 16;
    const fracBar = Math.floor(fracStepGlobal / 16);
    const fracStep = fracStepGlobal % 16;

    const kickActive = patternInstance.data[kickBar]?.kick[kickStep] || false;
    const snareActive = patternInstance.data[snareBar]?.snare[snareStep] || false;
    const hihatActive = patternInstance.data[hihatBar]?.hihat[hihatStep] || false;
    const bassActive = patternInstance.data[bassBar]?.bass[bassStep] || false;
    const arpTempoMultiplier = patternInstance.data[arpBar]?.arp[arpStep] || 0;

    // Construct temporary active fractal roots array based on frac loop length
    const fractalRoots = new Array(16).fill(false);
    for (let i = 0; i < fracLen; i++) {
        const fBar = Math.floor(i / 16);
        const fStep = i % 16;
        fractalRoots[i] = patternInstance.data[fBar]?.frac[fStep] || false;
    }

    // Map current bar index to progression timelines (looping chord evolution over 64 bars)
    // We can track a progressive timeline index
    const progressionBarIndex = Math.floor(audioEngine.currentTime * (clock.bpm / 60) / 4) % 64;
    const activeChord = activeProgression[progressionBarIndex] || activeProgression[0];

    // Real-time synchronization back to UI displays
    requestAnimationFrame(() => {
        document.getElementById("dispBar").innerText = String(progressionBarIndex + 1).padStart(2, "0");
        document.getElementById("dispBeat").innerText = String(Math.floor(activeStepInBar / 4) + 1).padStart(2, "0");
        document.getElementById("dispStep").innerText = String(activeStepInBar + 1).padStart(2, "0");

        // Highlight playing timeline slot
        document.querySelectorAll(".timeline-chord").forEach(el => el.classList.remove("current-playing"));
        const container = document.getElementById("timelineContainer");
        const slotEl = document.getElementById(`timeline-slot-${progressionBarIndex}`);
        if (slotEl && container) {
            slotEl.classList.add("current-playing");
            // Locally center the active slot in the timeline container horizontally without window scrolling
            const containerWidth = container.clientWidth;
            const slotOffsetLeft = slotEl.offsetLeft;
            const slotWidth = slotEl.clientWidth;
            container.scrollLeft = slotOffsetLeft - (containerWidth / 2) + (slotWidth / 2);
        }

        document.getElementById("lblActiveChord").innerText = `Active: ${activeChord.name}`;

        // Highlight active playhead step cell in all 4 stacked grids individually based on loop step
        document.querySelectorAll(".step-cell").forEach(el => el.classList.remove("playing"));

        const drumCell = document.getElementById(`drum-step-${kickBar}-${kickStep}`);
        const bassCell = document.getElementById(`bass-step-${bassBar}-${bassStep}`);
        const arpCell = document.getElementById(`arp-step-${arpBar}-${arpStep}`);
        const fracCell = document.getElementById(`frac-step-${fracBar}-${fracStep}`);

        if (drumCell) drumCell.classList.add("playing");
        if (bassCell) bassCell.classList.add("playing");
        if (arpCell) arpCell.classList.add("playing");
        if (fracCell) fracCell.classList.add("playing");
    });

    // 1. Process real-time drum synthesis triggers
    if (kickActive) synth.triggerDrum("kick", time);
    if (snareActive) synth.triggerDrum("snare", time);
    if (hihatActive) synth.triggerDrum("hihat", time);

    // 2. Compute and process walking bass trigger
    let activeBassMidi = 36; // Default active reference bass note
    if (bassActive) {
        const style = document.getElementById("selectBassStyle").value;
        const bias = parseInt(document.getElementById("sliderBassBias").value);
        const nextChord = activeProgression[(progressionBarIndex + 1) % 64];

        activeBassMidi = WalkingBass.generateBassNote(activeChord, nextChord, bassStep, style, bias);

        // Log voice history
        playedBassHistory.push(activeBassMidi);
        if (playedBassHistory.length > 16) playedBassHistory.shift();

        const tuningFreq = tuningSystem.getFrequencyInfo(activeBassMidi).frequency;

        synth.triggerPluckedBass(tuningFreq, time, 0.35);

        // Redraw Tonnetz with active bass note
        requestAnimationFrame(() => {
            Visualizers.drawTonnetz(document.getElementById("canvasTonnetz"), [activeBassMidi]);
            highlightKeyboardKey(activeBassMidi);
        });
    } else {
        // Approximate a baseline note for the current step if not triggered explicitly
        const style = document.getElementById("selectBassStyle").value;
        const bias = parseInt(document.getElementById("sliderBassBias").value);
        const nextChord = activeProgression[(progressionBarIndex + 1) % 64];
        activeBassMidi = WalkingBass.generateBassNote(activeChord, nextChord, bassStep, style, bias);
    }

    // 3. Process arpeggiation triggers with variable tempo multipliers and bass context tracking

    // Position half-time early skip logic before executing any generator index steps
    let shouldSkipArp = false;
    if (arpTempoMultiplier === 0.5 && arpStep % 2 !== 0) {
        shouldSkipArp = true;
    }

    if (arpTempoMultiplier > 0 && !shouldSkipArp) {
        const order = document.getElementById("selectArpOrder").value;
        const octaves = parseInt(document.getElementById("sliderArpOctaves").value);
        const ghost = parseInt(document.getElementById("sliderGhostChance").value);

        // Fetch advanced generative arpeggiator parameter values including the new ones
        const density = parseInt(document.getElementById("sliderArpDensity").value);
        const accentLevel = parseInt(document.getElementById("sliderAccentScaling").value);
        const mutationRate = parseInt(document.getElementById("sliderArpMutation").value);
        const humanizeMs = parseInt(document.getElementById("sliderArpHumanize").value);
        const gatePerc = parseInt(document.getElementById("sliderArpGate").value);
        const octStyle = document.getElementById("selectOctaveStyle").value;

        const velocityRandomness = parseInt(document.getElementById("sliderArpVelocityRand").value || "15");
        const spread = parseInt(document.getElementById("selectArpSpread").value || "0");
        const rhythmMode = document.getElementById("selectArpRhythmMode").value || "standard";

        // Extract new advanced boundaries and resolution strategies
        const minPitch = parseInt(document.getElementById("sliderArpMinPitch").value || "48");
        const maxPitch = parseInt(document.getElementById("sliderArpMaxPitch").value || "96");
        const bassConflictMode = document.getElementById("selectArpBassConflict").value || "resolve-consonant";
        const gateRandomness = parseInt(document.getElementById("sliderArpGateRand").value || "0");

        // Fetch new perceptual engine mode, target tension, and decay values
        const perceptualMode = document.getElementById("selectArpPerceptualMode")?.value || "off";
        const targetTension = parseFloat(document.getElementById("sliderArpTargetTension")?.value || "40") / 100.0;
        const sensoryDecay = parseFloat(document.getElementById("sliderArpSensoryDecay")?.value || "5");

        // Number of sub-notes to schedule based on our tempo multiplier
        // An arpTempoMultiplier of 1 trigger plays 1 note. 2 plays 2 notes, 3 plays 3, etc. 0.5 plays half-time.
        const numSubdivisions = arpTempoMultiplier >= 1 ? Math.floor(arpTempoMultiplier) : 1;

        // Calculate the base duration of a single step based on sequencer clock
        // Steps occur at (60 / bpm) / 4 (representing a 16th note step)
        const stepDurationSeconds = (60.0 / clock.bpm) / 4.0;

        // Calculate time subdivision spacer
        const subdivisionSpacer = stepDurationSeconds / numSubdivisions;

        for (let sub = 0; sub < numSubdivisions; sub++) {
            // Resolution-independent virtual step index scales sequence parameters correctly
            const virtualStep = (arpStep * numSubdivisions) + sub;

            // Predict the progression of the bass note into the next micro-intervals
            // Pass the activeBassMidi directly so the arpeggio maintains melodic synchronization with the bass!
            const fractalIntensity = parseInt(document.getElementById("sliderArpFractalIntensity").value || "0");
            const fractalScale = parseInt(document.getElementById("sliderArpFractalScale").value || "4");
            const fractalResolutions = parseInt(document.getElementById("sliderArpFractalResolutions").value || "3");
            const globalStepIndex = (progressionBarIndex * 16) + activeStepInBar;

            const jazzShape = document.getElementById("selectArpJazzShape").value || "none";
            const melodicConstraint = document.getElementById("selectArpConstraint").value || "scale-diatonic";

            const arpRes = arpGenerator.getNextNote(
                activeChord,
                virtualStep,
                order,
                octaves,
                ghost,
                density,
                accentLevel,
                mutationRate,
                octStyle,
                activeBassMidi,
                velocityRandomness,
                spread,
                rhythmMode,
                minPitch,
                maxPitch,
                bassConflictMode,
                gateRandomness,
                fractalIntensity,
                fractalScale,
                fractalResolutions,
                fractalRoots,
                preRenderedBassNotes,
                globalStepIndex,
                jazzShape,
                melodicConstraint,
                playedBassHistory,
                playedArpHistory,
                perceptualMode,
                targetTension,
                sensoryDecay
            );

            if (arpRes.trigger) {
                // Log arpeggio voice history
                playedArpHistory.push(arpRes.note);
                if (playedArpHistory.length > 16) playedArpHistory.shift();

                const tuningFreq = tuningSystem.getFrequencyInfo(arpRes.note).frequency;
                const soundStyle = document.getElementById("selectArpSound").value;

                // Compute humanized micro-timing delay (seconds)
                const humanizedDelay = (Math.random() * humanizeMs) / 1000.0;

                // Position subdivisions sequentially inside the step timeframe boundaries
                const triggerTime = time + (sub * subdivisionSpacer) + humanizedDelay;

                // Scale duration multiplier based on division rate & gate ratio settings, applying our dynamic gateRandomness modifier
                const arpGateModifier = (arpRes.gateModifier !== undefined) ? arpRes.gateModifier : 1.0;
                const gateMultiplier = ((gatePerc / 100.0) / numSubdivisions) * arpGateModifier;

                // Trigger voices with dynamic velocity and gate parameters
                const dynamicGain = (arpRes.velocity / 127.0) * 0.3;

                // Real-time psychoacoustic parameters to modulate the pluck synthesis elements
                const chordFrequencies = activeChord.notes.map(note => tuningSystem.getFrequencyInfo(note).frequency);
                const roughnessVal = Roughness.calculate(chordFrequencies);
                const harmonicityVal = Harmonicity.calculate(activeChord.notes);

                if (soundStyle === "fm") {
                    synth.triggerFmPluck(tuningFreq, triggerTime, dynamicGain, gateMultiplier, roughnessVal, harmonicityVal);
                } else if (soundStyle === "subtractive") {
                    synth.triggerSubtractivePluck(tuningFreq, triggerTime, dynamicGain, gateMultiplier, roughnessVal, harmonicityVal);
                } else {
                    // Sine simple waves pluck
                    synth.triggerFmPluck(tuningFreq * 2.0, triggerTime, dynamicGain * 0.7, gateMultiplier, roughnessVal, harmonicityVal);
                }
            }
        }
    }

    // 4. Perform real-time psychoacoustic calculations on every step to update dashboard meters
    calculatePsychoacousticMeasures(activeChord);
}

function calculatePsychoacousticMeasures(chord) {
    const chordFrequencies = chord.notes.map(note => tuningSystem.getFrequencyInfo(note).frequency);

    // Calculate Roughness & Harmonicity indexes
    const roughnessScore = Roughness.calculate(chordFrequencies);
    const harmonicityScore = Harmonicity.calculate(chord.notes);
    const surpriseScore = expectationInstance.calculateSurprise(chord);
    const tensionScore = Expectation.calculateTension(roughnessScore, harmonicityScore, chord.type);

    // Update real-time meters smoothly
    requestAnimationFrame(() => {
        document.getElementById("lblRoughnessVal").innerText = roughnessScore.toFixed(2);
        document.getElementById("lblHarmonicityVal").innerText = harmonicityScore.toFixed(2);
        document.getElementById("lblTensionVal").innerText = tensionScore.toFixed(2);
        document.getElementById("lblExpectationVal").innerText = surpriseScore.toFixed(2);

        document.getElementById("meterRoughness").style.width = `${roughnessScore * 100}%`;
        document.getElementById("meterHarmonicity").style.width = `${harmonicityScore * 100}%`;
        document.getElementById("meterTension").style.width = `${tensionScore * 100}%`;
        document.getElementById("meterExpectation").style.width = `${surpriseScore * 100}%`;
    });
}

// Render dynamic UI components
function renderTimeline() {
    const container = document.getElementById("timelineContainer");
    if (!container) return;
    container.innerHTML = "";

    activeProgression.forEach((chord, idx) => {
        const cell = document.createElement("div");
        cell.className = `timeline-chord ${chord.type === "bridge" ? "bridge" : ""}`;
        cell.id = `timeline-slot-${idx}`;
        cell.innerHTML = `
            <div class="chord-name">${chord.name}</div>
            <div class="chord-info">Bar ${idx + 1}</div>
        `;
        cell.addEventListener("click", () => {
            currentSelectedBar = idx % 4; // Map timeline click to highlighted bar stack editing
        });
        container.appendChild(cell);
    });
}

function renderGrids() {
    // Retrieve track loop lengths
    const kickLen = parseInt(document.getElementById("selectKickLength")?.value || "16");
    const snareLen = parseInt(document.getElementById("selectSnareLength")?.value || "16");
    const hihatLen = parseInt(document.getElementById("selectHihatLength")?.value || "16");
    const bassLen = parseInt(document.getElementById("selectBassLength")?.value || "16");
    const arpLen = parseInt(document.getElementById("selectArpLength")?.value || "16");
    const fracLen = parseInt(document.getElementById("selectFracLength")?.value || "16");

    // Simultaneously render all 4 bar editor stacks
    for (let b = 0; b < 4; b++) {
        const barPattern = patternInstance.data[b];

        // 1. Render drums rows for Bar index b
        const drumContainer = document.getElementById(`gridDrum-${b}`);
        if (drumContainer) {
            drumContainer.innerHTML = "";
            for (let i = 0; i < 16; i++) {
                const cell = document.createElement("div");
                const globalIdx = (b * 16) + i;

                // Determine if out-of-bounds polymetrically (using kick length for UI row representation)
                if (globalIdx >= kickLen) {
                    cell.className = "step-cell disabled-step";
                } else {
                    cell.className = `step-cell ${barPattern.kick[i] ? "active-drum" : ""}`;
                    cell.addEventListener("click", () => {
                        barPattern.kick[i] = !barPattern.kick[i];
                        cell.classList.toggle("active-drum");
                    });
                }
                cell.id = `drum-step-${b}-${i}`;
                drumContainer.appendChild(cell);
            }
        }

        // 2. Render bass rows for Bar index b
        const bassContainer = document.getElementById(`gridBass-${b}`);
        if (bassContainer) {
            bassContainer.innerHTML = "";
            for (let i = 0; i < 16; i++) {
                const cell = document.createElement("div");
                const globalIdx = (b * 16) + i;

                if (globalIdx >= bassLen) {
                    cell.className = "step-cell disabled-step";
                } else {
                    cell.className = `step-cell ${barPattern.bass[i] ? "active-bass" : ""}`;
                    cell.addEventListener("click", () => {
                        barPattern.bass[i] = !barPattern.bass[i];
                        cell.classList.toggle("active-bass");
                    });
                }
                cell.id = `bass-step-${b}-${i}`;
                bassContainer.appendChild(cell);
            }
        }

        // 3. Render arp rows for Bar index b with custom tempo multipliers cycler (0 -> 1 -> 2 -> 3 -> 4 -> 0.5)
        const arpContainer = document.getElementById(`gridArp-${b}`);
        if (arpContainer) {
            arpContainer.innerHTML = "";
            for (let i = 0; i < 16; i++) {
                const cell = document.createElement("div");
                const globalIdx = (b * 16) + i;

                if (globalIdx >= arpLen) {
                    cell.className = "step-cell disabled-step";
                    cell.id = `arp-step-${b}-${i}`;
                    arpContainer.appendChild(cell);
                    continue;
                }

                const mult = barPattern.arp[i] || 0;
                cell.className = "step-cell";
                cell.id = `arp-step-${b}-${i}`;

                // Set color class based on the selected multiplier value
                if (mult > 0) {
                    cell.classList.add("active-arp");
                    cell.setAttribute("data-mult", mult);
                    if (mult === 0.5) {
                        cell.style.background = "var(--accent-purple)";
                    } else if (mult === 2) {
                        cell.style.background = "var(--accent-pink)";
                    } else if (mult === 3) {
                        cell.style.background = "var(--accent-yellow)";
                    } else if (mult === 4) {
                        cell.style.background = "#ff5722"; // Bright Orange
                    } else {
                        cell.style.background = "var(--accent-cyan)"; // Standard 1x
                    }
                    cell.innerText = mult + "x";
                    cell.style.fontSize = "0.55rem";
                    cell.style.fontWeight = "bold";
                    cell.style.color = "#000";
                    cell.style.display = "flex";
                    cell.style.alignItems = "center";
                    cell.style.justifyContent = "center";
                } else {
                    cell.innerText = "";
                    cell.style.background = "";
                }

                cell.addEventListener("click", () => {
                    // Cycle: 0 -> 1 -> 2 -> 3 -> 4 -> 0.5 -> 0
                    const cycle = [0, 1, 2, 3, 4, 0.5];
                    const currIdx = cycle.indexOf(barPattern.arp[i]);
                    const nextVal = cycle[(currIdx + 1) % cycle.length];
                    barPattern.arp[i] = nextVal;

                    if (nextVal > 0) {
                        cell.classList.add("active-arp");
                        cell.setAttribute("data-mult", nextVal);
                        if (nextVal === 0.5) {
                            cell.style.background = "var(--accent-purple)";
                        } else if (nextVal === 2) {
                            cell.style.background = "var(--accent-pink)";
                        } else if (nextVal === 3) {
                            cell.style.background = "var(--accent-yellow)";
                        } else if (nextVal === 4) {
                            cell.style.background = "#ff5722";
                        } else {
                            cell.style.background = "var(--accent-cyan)";
                        }
                        cell.innerText = nextVal + "x";
                        cell.style.fontSize = "0.55rem";
                        cell.style.fontWeight = "bold";
                        cell.style.color = "#000";
                        cell.style.display = "flex";
                        cell.style.alignItems = "center";
                        cell.style.justifyContent = "center";
                    } else {
                        cell.classList.remove("active-arp");
                        cell.removeAttribute("data-mult");
                        cell.style.background = "";
                        cell.innerText = "";
                    }
                });
                arpContainer.appendChild(cell);
            }
        }

        // 4. Render fractal roots rows for Bar index b (FRAC RT)
        const fracContainer = document.getElementById(`gridFrac-${b}`);
        if (fracContainer) {
            fracContainer.innerHTML = "";
            for (let i = 0; i < 16; i++) {
                const cell = document.createElement("div");
                const globalIdx = (b * 16) + i;

                if (globalIdx >= fracLen) {
                    cell.className = "step-cell disabled-step";
                } else {
                    cell.className = `step-cell ${barPattern.frac[i] ? "active-frac" : ""}`;
                    cell.addEventListener("click", () => {
                        barPattern.frac[i] = !barPattern.frac[i];
                        cell.classList.toggle("active-frac");
                    });
                }
                cell.id = `frac-step-${b}-${i}`;
                fracContainer.appendChild(cell);
            }
        }
    }
}

function renderKeyboard() {
    const keyboard = document.getElementById("pianoKeyboard");
    if (!keyboard) return;
    keyboard.innerHTML = "";

    // Generate 2 octaves ribbon centered around standard pitch
    const scaleBase = 60; // C4
    const semitones = 24;

    for (let i = 0; i < semitones; i++) {
        const midi = scaleBase + i;
        const noteClass = midi % 12;
        const isBlack = [1, 3, 6, 8, 10].includes(noteClass);

        const key = document.createElement("div");
        key.className = `piano-key ${isBlack ? "black" : ""}`;
        key.id = `piano-key-${midi}`;

        // Label white notes
        if (!isBlack) {
            const label = document.createElement("span");
            label.className = "key-label";
            label.innerText = tuningSystem.getFrequencyInfo(midi).frequency.toFixed(0);
            key.appendChild(label);
        }

        key.addEventListener("click", () => {
            const freq = tuningSystem.getFrequencyInfo(midi).frequency;
            if (synth) synth.triggerSubtractivePluck(freq, audioEngine.currentTime, 0.4);
            highlightKeyboardKey(midi);
        });

        keyboard.appendChild(key);
    }
}

function highlightKeyboardKey(midiNote) {
    document.querySelectorAll(".piano-key").forEach(el => el.classList.remove("active"));
    const key = document.getElementById(`piano-key-${midiNote}`);
    if (key) {
        key.classList.add("active");
        setTimeout(() => key.classList.remove("active"), 300);
    }
}

function bindUIEvents() {
    // Toggle input/output chord controls state based on checkbox
    const checkEnableInput = document.getElementById("checkEnableInputChord");
    const checkEnableOutput = document.getElementById("checkEnableOutputChord");

    const toggleInputControls = () => {
        const ctrl = document.getElementById("inputChordControls");
        if (checkEnableInput.checked) {
            ctrl.style.opacity = "1";
            ctrl.style.pointerEvents = "auto";
        } else {
            ctrl.style.opacity = "0.5";
            ctrl.style.pointerEvents = "none";
        }
    };

    const toggleOutputControls = () => {
        const ctrl = document.getElementById("outputChordControls");
        if (checkEnableOutput.checked) {
            ctrl.style.opacity = "1";
            ctrl.style.pointerEvents = "auto";
        } else {
            ctrl.style.opacity = "0.5";
            ctrl.style.pointerEvents = "none";
        }
    };

    checkEnableInput.addEventListener("change", () => {
        toggleInputControls();
        generateProgression();
    });
    checkEnableOutput.addEventListener("change", () => {
        toggleOutputControls();
        generateProgression();
    });

    document.getElementById("selectInputRoot").addEventListener("change", () => generateProgression());
    document.getElementById("selectInputQuality").addEventListener("change", () => generateProgression());
    document.getElementById("selectOutputRoot").addEventListener("change", () => generateProgression());
    document.getElementById("selectOutputQuality").addEventListener("change", () => generateProgression());

    // 1. Play / Pause Control
    const btnPlay = document.getElementById("btnPlay");
    btnPlay.addEventListener("click", async () => {
        await audioEngine.init();
        if (clock.isPlaying) {
            clock.stop();
            audioEngine.suspend();
            btnPlay.innerText = "Start Engine";
            btnPlay.classList.remove("btn-accent");
            btnPlay.classList.add("btn-primary");
        } else {
            audioEngine.resume();
            clock.start(audioEngine.ctx);
            btnPlay.innerText = "Stop Engine";
            btnPlay.classList.remove("btn-primary");
            btnPlay.classList.add("btn-accent");
        }
    });

    // 2. Progression & Parameter Sliders
    document.getElementById("btnGenerateProgression").addEventListener("click", () => {
        generateProgression();
    });

    document.getElementById("selectRootKey").addEventListener("change", () => generateProgression());
    document.getElementById("selectProgStyle").addEventListener("change", () => generateProgression());

    // Sliders
    const slidersMap = [
        { id: "sliderBpm", lbl: "lblBpm", action: (val) => clock.setBpm(val) },
        { id: "sliderSwing", lbl: "lblSwing", action: (val) => clock.setSwing(val / 100) },
        { id: "sliderJazzPerc", lbl: "lblJazzPerc", action: () => {} },
        { id: "sliderOutsidePerc", lbl: "lblOutsidePerc", action: () => {} },
        { id: "sliderBridgeLength", lbl: "lblBridgeLength", action: () => {} },
        { id: "sliderTensionThreshold", lbl: "lblTensionThreshold", action: () => {} },
        { id: "sliderMasterVol", lbl: "lblMasterVol", action: (val) => effectsEngine.setMasterVolume(val / 100) },
        { id: "sliderDelayWet", lbl: "lblDelayWet", action: (val) => effectsEngine.setDelayDryWet(val / 100) },
        { id: "sliderSaturation", lbl: "lblSaturation", action: (val) => effectsEngine.setSaturation(val) },
        { id: "sliderReverbSpace", lbl: "lblReverbSpace", action: (val) => effectsEngine.setHaasWidth(val / 100) },
        { id: "sliderBassSub", lbl: "lblBassSub", action: (val) => { if (synth) synth.bassSubLevel = val / 100; } },
        { id: "sliderBassBias", lbl: "lblBassBias", action: () => {} },
        { id: "sliderArpOctaves", lbl: "lblArpOctaves", action: () => {} },
        { id: "sliderGhostChance", lbl: "lblGhostChance", action: () => {} },
        { id: "sliderMutationChance", lbl: "lblMutationChance", action: () => {} },
        { id: "sliderArpDensity", lbl: "lblArpDensity", action: () => {} },
        { id: "sliderAccentScaling", lbl: "lblAccentScaling", action: () => {} },
        { id: "sliderArpMutation", lbl: "lblArpMutation", action: () => {} },
        { id: "sliderArpHumanize", lbl: "lblArpHumanize", action: () => {} },
        { id: "sliderArpGate", lbl: "lblArpGate", action: () => {} },
        { id: "sliderArpVelocityRand", lbl: "lblArpVelocityRand", action: () => {} },
        { id: "sliderArpMinPitch", lbl: "lblArpMinPitch", action: () => {} },
        { id: "sliderArpMaxPitch", lbl: "lblArpMaxPitch", action: () => {} },
        { id: "sliderArpGateRand", lbl: "lblArpGateRand", action: () => {} },
        { id: "sliderArpFractalIntensity", lbl: "lblArpFractalIntensity", action: () => {} },
        { id: "sliderArpFractalScale", lbl: "lblArpFractalScale", action: () => {} },
        { id: "sliderArpFractalResolutions", lbl: "lblArpFractalResolutions", action: () => {} },
        { id: "sliderArpTargetTension", lbl: "lblArpTargetTension", action: () => {} },
        { id: "sliderArpSensoryDecay", lbl: "lblArpSensoryDecay", action: () => {} }
    ];

    slidersMap.forEach(slider => {
        const input = document.getElementById(slider.id);
        const label = document.getElementById(slider.lbl);
        if (input) {
            input.addEventListener("input", (e) => {
                const val = e.target.value;
                if (label) label.innerText = val;
                slider.action(parseFloat(val));
            });
        }
    });

    // 3. Global Actions
    document.getElementById("btnCopyBar1").addEventListener("click", () => {
        patternInstance.copyBarToAll(0); // Copy Bar 1 pattern to Bars 2, 3, 4
        renderGrids();
        alert("Copied Bar 1 pattern to all bars.");
    });

    document.getElementById("btnLoadJazzTestPattern").addEventListener("click", () => {
        for (let b = 0; b < 4; b++) {
            // One walking bass note trigger at step 0 only
            patternInstance.data[b].bass[0] = true;
            for (let i = 1; i < 16; i++) patternInstance.data[b].bass[i] = false;

            // One fractal root trigger at step 0 (coinciding with the bass note)
            patternInstance.data[b].frac[0] = true;
            for (let i = 1; i < 16; i++) patternInstance.data[b].frac[i] = false;

            // Arpeggiator active on EVERY step (0 to 15) with 1x multiplier
            for (let i = 0; i < 16; i++) {
                patternInstance.data[b].arp[i] = 1;
            }
        }
        renderGrids();
        alert("Loaded classical jazz & fractal fluency test pattern.");
    });

    document.getElementById("btnEuclideanGen").addEventListener("click", () => {
        const steps = 16;
        for (let b = 0; b < 4; b++) {
            // Populate interesting Euclidean grids across all 4 bars
            const bassEuclidean = Pattern.generateEuclidean(steps, 5 + b, b);
            const arpEuclideanRaw = Pattern.generateEuclidean(steps, 9 + b, (b + 1) % 4);

            patternInstance.data[b].bass = bassEuclidean;

            // Default downbeats for fractal fluency roots
            patternInstance.data[b].frac = [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false];

            // Convert boolean Euclidean trigger states to valid arpeggiator numerical multipliers [1, 2, 3, 4, 0.5]
            const multChoices = [1, 1, 2, 0.5];
            patternInstance.data[b].arp = arpEuclideanRaw.map((trigger, idx) => {
                if (trigger) {
                    return multChoices[(idx + b) % multChoices.length];
                }
                return 0;
            });
        }
        renderGrids();
    });

    document.getElementById("btnRandomizePattern").addEventListener("click", () => {
        for (let b = 0; b < 4; b++) {
            const barPattern = patternInstance.data[b];
            for (let i = 0; i < 16; i++) {
                barPattern.kick[i] = Math.random() > 0.8;
                barPattern.snare[i] = Math.random() > 0.85;
                barPattern.hihat[i] = Math.random() > 0.65;
                barPattern.bass[i] = Math.random() > 0.75;
                barPattern.frac[i] = (i % 4 === 0); // Default downbeats as roots

                // Randomly choose from tempo multipliers instead of a boolean value
                if (Math.random() > 0.7) {
                    const multChoices = [1, 1, 2, 3, 4, 0.5];
                    barPattern.arp[i] = multChoices[Math.floor(Math.random() * multChoices.length)];
                } else {
                    barPattern.arp[i] = 0;
                }
            }
        }
        renderGrids();
    });

    // 3.5 Polymetric Track Length Selectors Integration
    const trackSelectors = ["selectKickLength", "selectSnareLength", "selectHihatLength", "selectBassLength", "selectArpLength", "selectFracLength"];
    trackSelectors.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener("change", () => {
                renderGrids();
            });
        }
    });

    // 4. Tuning Select & Scala Input Integration
    document.getElementById("selectTuning").addEventListener("change", (e) => {
        tuningSystem.setSystem(e.target.value);
        renderKeyboard(); // Re-render labeled keyboard ribbon values
    });

    document.getElementById("btnApplyScala").addEventListener("click", () => {
        const sclText = document.getElementById("txtScala").value;
        const success = tuningSystem.importScala(sclText);
        if (success) {
            document.getElementById("selectTuning").value = "scala";
            renderKeyboard();
            alert("Custom Scala scale file successfully applied!");
        } else {
            alert("Failed to parse Scala file. Ensure correct format lines.");
        }
    });
}

// Document Load entry
window.addEventListener("DOMContentLoaded", () => {
    initApp();
});
