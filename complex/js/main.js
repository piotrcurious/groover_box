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

    // Default Patterns (Drums four-on-the-floor, nice default arp syncopation)
    for (let b = 0; b < 4; b++) {
        // Kick on 1, 5, 9, 13
        for (let i = 0; i < 16; i += 4) patternInstance.data[b].kick[i] = true;
        // Snare on 5, 13
        patternInstance.data[b].snare[4] = true;
        patternInstance.data[b].snare[12] = true;
        // Hihat rapid sixteenths
        for (let i = 2; i < 16; i += 4) patternInstance.data[b].hihat[i] = true;

        // Default bass walk trigs
        for (let i = 0; i < 16; i += 4) patternInstance.data[b].bass[i] = true;
        // Default arp trigs
        for (let i = 0; i < 16; i += 3) patternInstance.data[b].arp[i] = true;
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

    activeProgression = jazzProgression.generate(rootKey, style, jazzPerc, outsidePerc);

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

        if (drumCell) drumCell.classList.add("playing");
        if (bassCell) bassCell.classList.add("playing");
        if (arpCell) arpCell.classList.add("playing");
    });

    // 1. Process real-time drum synthesis triggers
    const barPattern = patternInstance.data[activeBarIndex];
    if (barPattern.kick[activeStepInBar]) synth.triggerDrum("kick", time);
    if (barPattern.snare[activeStepInBar]) synth.triggerDrum("snare", time);
    if (barPattern.hihat[activeStepInBar]) synth.triggerDrum("hihat", time);

    // 2. Process walking bass trigger
    if (barPattern.bass[activeStepInBar]) {
        const style = document.getElementById("selectBassStyle").value;
        const bias = parseInt(document.getElementById("sliderBassBias").value);
        const nextChord = activeProgression[(progressionBarIndex + 1) % 64];

        const rawMidi = WalkingBass.generateBassNote(activeChord, nextChord, activeStepInBar, style, bias);
        const tuningFreq = tuningSystem.getFrequencyInfo(rawMidi).frequency;

        synth.triggerPluckedBass(tuningFreq, time, 0.35);

        // Redraw Tonnetz with active bass note
        requestAnimationFrame(() => {
            Visualizers.drawTonnetz(document.getElementById("canvasTonnetz"), [rawMidi]);
            highlightKeyboardKey(rawMidi);
        });
    }

    // 3. Process arpeggiation triggers
    if (barPattern.arp[activeStepInBar]) {
        const order = document.getElementById("selectArpOrder").value;
        const octaves = parseInt(document.getElementById("sliderArpOctaves").value);
        const ghost = parseInt(document.getElementById("sliderGhostChance").value);

        const arpRes = arpGenerator.getNextNote(activeChord, activeStepInBar, order, octaves, ghost);
        const tuningFreq = tuningSystem.getFrequencyInfo(arpRes.note).frequency;

        const soundStyle = document.getElementById("selectArpSound").value;
        if (soundStyle === "fm") {
            synth.triggerFmPluck(tuningFreq, time, 0.22);
        } else if (soundStyle === "subtractive") {
            synth.triggerSubtractivePluck(tuningFreq, time, 0.25);
        } else {
            // Sine simple waves pluck
            synth.triggerFmPluck(tuningFreq * 2.0, time, 0.15);
        }
    }

    // 4. Perform psychoacoustic real-time calculation at each chord boundaries (downbeats)
    if (activeStepInBar === 0 && activeChord !== lastActiveChord) {
        lastActiveChord = activeChord;
        calculatePsychoacousticMeasures(activeChord);
    }
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

        // 3. Render arp rows for Bar index b
        const arpContainer = document.getElementById(`gridArp-${b}`);
        if (arpContainer) {
            arpContainer.innerHTML = "";
            for (let i = 0; i < 16; i++) {
                const cell = document.createElement("div");
                cell.className = `step-cell ${barPattern.arp[i] ? "active-arp" : ""}`;
                cell.id = `arp-step-${b}-${i}`;
                cell.addEventListener("click", () => {
                    barPattern.arp[i] = !barPattern.arp[i];
                    cell.classList.toggle("active-arp");
                });
                arpContainer.appendChild(cell);
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
        { id: "sliderMutationChance", lbl: "lblMutationChance", action: () => {} }
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

    document.getElementById("btnEuclideanGen").addEventListener("click", () => {
        const steps = 16;
        for (let b = 0; b < 4; b++) {
            // Populate interesting Euclidean grids across all 4 bars
            const bassEuclidean = Pattern.generateEuclidean(steps, 5 + b, b);
            const arpEuclidean = Pattern.generateEuclidean(steps, 9 + b, (b + 1) % 4);

            patternInstance.data[b].bass = bassEuclidean;
            patternInstance.data[b].arp = arpEuclidean;
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
                barPattern.arp[i] = Math.random() > 0.7;
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
