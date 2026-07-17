// High-resolution clock scheduler for precision sequencer timing & swing offset handling
export class Clock {
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

export default Clock;
