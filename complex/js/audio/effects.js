// Audio effects DSP processors including custom WaveShaper distortion, Haas expander and delay lines
export class EffectsEngine {
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

export const effectsEngine = new EffectsEngine();
export default effectsEngine;
