// Self-contained subtractive synth, FM synth and physical pluck sound generators
// Upgraded to dynamically modulate DSP filters and envelopes using real-time psychoacoustic coefficients.
export class Synthesizer {
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
export default Synthesizer;
