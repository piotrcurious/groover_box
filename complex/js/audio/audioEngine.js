// Audio Context Manager supporting state transitions and global node routing
export class AudioEngine {
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

export const audioEngine = new AudioEngine();
