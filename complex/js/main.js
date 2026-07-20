// Global Orchestrator mapping, sequencing and binding Audio / Theory modules together
import { audioEngine } from "./audio/audioEngine.js";
import { Synthesizer } from "./audio/synthesizer.js";
import { effectsEngine } from "./audio/effects.js";
import { Clock } from "./sequencer/clock.js";
import { Pattern } from "./sequencer/pattern.js";
import { jazzProgression } from "./harmony/jazzProgression.js";
import { PentatonicBridge } from "./harmony/pentatonicBridge.js";
import { tuningSystem } from "./microtonal/temperament.js";
import { WalkingBass } from "./bass/walkingBass.js";
import { arpGenerator } from "./arp/arpGenerator.js";
import { Roughness } from "./psycho/roughness.js";
import { Harmonicity } from "./psycho/harmonicity.js";
import { Expectation } from "./psycho/expectation.js";
import { Visualizers } from "./ui/visualizers.js";

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
    // clock.currentStep cycles from 0 to 63 steps (representing 4 bars)
    const currentGlobalStep = clock.currentStep;
    const activeBarIndex = Math.floor(currentGlobalStep / 16); // 0 to 3
    const activeStepInBar = currentGlobalStep % 16;             // 0 to 15

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
        const slotEl = document.getElementById(`timeline-slot-${progressionBarIndex}`);
        if (slotEl) {
            slotEl.classList.add("current-playing");
            slotEl.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
        }

        document.getElementById("lblActiveChord").innerText = `Active: ${activeChord.name}`;

        // Highlight active playhead step cell in all 4 stacked grids
        document.querySelectorAll(".step-cell").forEach(el => el.classList.remove("playing"));

        const drumCell = document.getElementById(`drum-step-${activeBarIndex}-${activeStepInBar}`);
        const bassCell = document.getElementById(`bass-step-${activeBarIndex}-${activeStepInBar}`);
        const arpCell = document.getElementById(`arp-step-${activeBarIndex}-${activeStepInBar}`);
        const fracCell = document.getElementById(`frac-step-${activeBarIndex}-${activeStepInBar}`);

        if (drumCell) drumCell.classList.add("playing");
        if (bassCell) bassCell.classList.add("playing");
        if (arpCell) arpCell.classList.add("playing");
        if (fracCell) fracCell.classList.add("playing");
    });

    // 1. Process real-time drum synthesis triggers
    const barPattern = patternInstance.data[activeBarIndex];
    if (barPattern.kick[activeStepInBar]) synth.triggerDrum("kick", time);
    if (barPattern.snare[activeStepInBar]) synth.triggerDrum("snare", time);
    if (barPattern.hihat[activeStepInBar]) synth.triggerDrum("hihat", time);

    // 2. Compute and process walking bass trigger
    let activeBassMidi = 36; // Default active reference bass note
    if (barPattern.bass[activeStepInBar]) {
        const style = document.getElementById("selectBassStyle").value;
        const bias = parseInt(document.getElementById("sliderBassBias").value);
        const nextChord = activeProgression[(progressionBarIndex + 1) % 64];

        activeBassMidi = WalkingBass.generateBassNote(activeChord, nextChord, activeStepInBar, style, bias);

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
        activeBassMidi = WalkingBass.generateBassNote(activeChord, nextChord, activeStepInBar, style, bias);
    }

    // 3. Process arpeggiation triggers with variable tempo multipliers and bass context tracking
    const arpTempoMultiplier = barPattern.arp[activeStepInBar] || 0;

    // Position half-time early skip logic before executing any generator index steps
    let shouldSkipArp = false;
    if (arpTempoMultiplier === 0.5 && activeStepInBar % 2 !== 0) {
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
            const virtualStep = (activeStepInBar * numSubdivisions) + sub;

            // Predict the progression of the bass note into the next micro-intervals
            // Pass the activeBassMidi directly so the arpeggio maintains melodic synchronization with the bass!
            const fractalIntensity = parseInt(document.getElementById("sliderArpFractalIntensity").value || "0");
            const fractalScale = parseInt(document.getElementById("sliderArpFractalScale").value || "4");
            const fractalResolutions = parseInt(document.getElementById("sliderArpFractalResolutions").value || "3");
            const fractalRoots = barPattern.frac || new Array(16).fill(false);
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
                playedArpHistory
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
    // Simultaneously render all 4 bar editor stacks
    for (let b = 0; b < 4; b++) {
        const barPattern = patternInstance.data[b];

        // 1. Render drums rows for Bar index b
        const drumContainer = document.getElementById(`gridDrum-${b}`);
        if (drumContainer) {
            drumContainer.innerHTML = "";
            for (let i = 0; i < 16; i++) {
                const cell = document.createElement("div");
                cell.className = `step-cell ${barPattern.kick[i] ? "active-drum" : ""}`;
                cell.id = `drum-step-${b}-${i}`;
                cell.addEventListener("click", () => {
                    barPattern.kick[i] = !barPattern.kick[i];
                    cell.classList.toggle("active-drum");
                });
                drumContainer.appendChild(cell);
            }
        }

        // 2. Render bass rows for Bar index b
        const bassContainer = document.getElementById(`gridBass-${b}`);
        if (bassContainer) {
            bassContainer.innerHTML = "";
            for (let i = 0; i < 16; i++) {
                const cell = document.createElement("div");
                cell.className = `step-cell ${barPattern.bass[i] ? "active-bass" : ""}`;
                cell.id = `bass-step-${b}-${i}`;
                cell.addEventListener("click", () => {
                    barPattern.bass[i] = !barPattern.bass[i];
                    cell.classList.toggle("active-bass");
                });
                bassContainer.appendChild(cell);
            }
        }

        // 3. Render arp rows for Bar index b with custom tempo multipliers cycler (0 -> 1 -> 2 -> 3 -> 4 -> 0.5)
        const arpContainer = document.getElementById(`gridArp-${b}`);
        if (arpContainer) {
            arpContainer.innerHTML = "";
            for (let i = 0; i < 16; i++) {
                const cell = document.createElement("div");
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
                cell.className = `step-cell ${barPattern.frac[i] ? "active-frac" : ""}`;
                cell.id = `frac-step-${b}-${i}`;
                cell.addEventListener("click", () => {
                    barPattern.frac[i] = !barPattern.frac[i];
                    cell.classList.toggle("active-frac");
                });
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
        { id: "sliderArpFractalResolutions", lbl: "lblArpFractalResolutions", action: () => {} }
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
