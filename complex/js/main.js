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
import { ArpGenerator } from "./arp/arpGenerator.js";
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

let currentSelectedBar = 0; // Bar editing index (0 to 63)
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

    // 2. Initialize Core instances
    patternInstance = new Pattern();
    expectationInstance = new Expectation();

    // Default Patterns (Drums four-on-the-floor, nice default arp syncopation)
    for (let b = 0; b < 64; b++) {
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
    const barIndex = Math.floor(clock.currentStep / 16); // High-res clock cycles 64 steps total
    const barStep = stepIndex % 16;

    // Grab currently active progression chord
    const activeChord = activeProgression[barIndex] || activeProgression[0];

    // Real-time synchronization back to UI displays
    requestAnimationFrame(() => {
        document.getElementById("dispBar").innerText = String(barIndex + 1).padStart(2, "0");
        document.getElementById("dispBeat").innerText = String(Math.floor(barStep / 4) + 1).padStart(2, "0");
        document.getElementById("dispStep").innerText = String(barStep + 1).padStart(2, "0");

        // Highlight playing timeline slot
        document.querySelectorAll(".timeline-chord").forEach(el => el.classList.remove("current-playing"));
        const slotEl = document.getElementById(`timeline-slot-${barIndex}`);
        if (slotEl) {
            slotEl.classList.add("current-playing");
            slotEl.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
        }

        document.getElementById("lblActiveChord").innerText = `Active: ${activeChord.name}`;

        // Highlight playing step cell if currently looking at this edit bar
        if (barIndex === currentSelectedBar) {
            document.querySelectorAll(".step-cell").forEach(el => el.classList.remove("playing"));

            const drumCell = document.getElementById(`drum-step-${barStep}`);
            const bassCell = document.getElementById(`bass-step-${barStep}`);
            const arpCell = document.getElementById(`arp-step-${barStep}`);

            if (drumCell) drumCell.classList.add("playing");
            if (bassCell) bassCell.classList.add("playing");
            if (arpCell) arpCell.classList.add("playing");
        }
    });

    // 1. Process real-time drum synthesis triggers
    const barPattern = patternInstance.data[barIndex];
    if (barPattern.kick[barStep]) synth.triggerDrum("kick", time);
    if (barPattern.snare[barStep]) synth.triggerDrum("snare", time);
    if (barPattern.hihat[barStep]) synth.triggerDrum("hihat", time);

    // 2. Process walking bass trigger
    if (barPattern.bass[barStep]) {
        const style = document.getElementById("selectBassStyle").value;
        const bias = parseInt(document.getElementById("sliderBassBias").value);
        const nextChord = activeProgression[(barIndex + 1) % 64];

        const rawMidi = WalkingBass.generateBassNote(activeChord, nextChord, barStep, style, bias);
        const tuningFreq = tuningSystem.getFrequencyInfo(rawMidi).frequency;

        synth.triggerPluckedBass(tuningFreq, time, 0.35);

        // Redraw Tonnetz with active bass note
        requestAnimationFrame(() => {
            Visualizers.drawTonnetz(document.getElementById("canvasTonnetz"), [rawMidi]);
            highlightKeyboardKey(rawMidi);
        });
    }

    // 3. Process arpeggiation triggers
    if (barPattern.arp[barStep]) {
        const order = document.getElementById("selectArpOrder").value;
        const octaves = parseInt(document.getElementById("sliderArpOctaves").value);
        const ghost = parseInt(document.getElementById("sliderGhostChance").value);

        const arpRes = arpGenerator.getNextNote(activeChord, barStep, order, octaves, ghost);
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
    if (barStep === 0 && activeChord !== lastActiveChord) {
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
            currentSelectedBar = idx;
            document.getElementById("lblSelectedBar").innerText = `BAR ${String(currentSelectedBar + 1).padStart(2, "0")}`;
            renderGrids();
        });
        container.appendChild(cell);
    });
}

function renderGrids() {
    const barPattern = patternInstance.data[currentSelectedBar];

    // 1. Render drums rows (Kick mixed with Hihat on a single row view for UX simplicity)
    const drumContainer = document.getElementById("gridDrum");
    drumContainer.innerHTML = "";
    for (let i = 0; i < 16; i++) {
        const cell = document.createElement("div");
        cell.className = `step-cell ${barPattern.kick[i] ? "active-drum" : ""}`;
        cell.id = `drum-step-${i}`;
        cell.addEventListener("click", () => {
            barPattern.kick[i] = !barPattern.kick[i];
            cell.classList.toggle("active-drum");
        });
        drumContainer.appendChild(cell);
    }

    // 2. Render bass row grid
    const bassContainer = document.getElementById("gridBass");
    bassContainer.innerHTML = "";
    for (let i = 0; i < 16; i++) {
        const cell = document.createElement("div");
        cell.className = `step-cell ${barPattern.bass[i] ? "active-bass" : ""}`;
        cell.id = `bass-step-${i}`;
        cell.addEventListener("click", () => {
            barPattern.bass[i] = !barPattern.bass[i];
            cell.classList.toggle("active-bass");
        });
        bassContainer.appendChild(cell);
    }

    // 3. Render arpeggiator row grid
    const arpContainer = document.getElementById("gridArp");
    arpContainer.innerHTML = "";
    for (let i = 0; i < 16; i++) {
        const cell = document.createElement("div");
        cell.className = `step-cell ${barPattern.arp[i] ? "active-arp" : ""}`;
        cell.id = `arp-step-${i}`;
        cell.addEventListener("click", () => {
            barPattern.arp[i] = !barPattern.arp[i];
            cell.classList.toggle("active-arp");
        });
        arpContainer.appendChild(cell);
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

    // 3. Navigation Controls
    document.getElementById("btnPrevBar").addEventListener("click", () => {
        if (currentSelectedBar > 0) {
            currentSelectedBar--;
            document.getElementById("lblSelectedBar").innerText = `BAR ${String(currentSelectedBar + 1).padStart(2, "0")}`;
            renderGrids();
        }
    });

    document.getElementById("btnNextBar").addEventListener("click", () => {
        if (currentSelectedBar < 63) {
            currentSelectedBar++;
            document.getElementById("lblSelectedBar").innerText = `BAR ${String(currentSelectedBar + 1).padStart(2, "0")}`;
            renderGrids();
        }
    });

    document.getElementById("btnCopyBar").addEventListener("click", () => {
        patternInstance.copyBarToAll(currentSelectedBar);
        alert("Copied current bar settings to all 64 steps!");
    });

    document.getElementById("btnEuclideanGen").addEventListener("click", () => {
        const steps = 16;
        // Generate nice rhythmic density
        const bassEuclidean = Pattern.generateEuclidean(steps, 6, 0);
        const arpEuclidean = Pattern.generateEuclidean(steps, 10, 2);

        patternInstance.data[currentSelectedBar].bass = bassEuclidean;
        patternInstance.data[currentSelectedBar].arp = arpEuclidean;
        renderGrids();
    });

    document.getElementById("btnRandomizePattern").addEventListener("click", () => {
        const barPattern = patternInstance.data[currentSelectedBar];
        for (let i = 0; i < 16; i++) {
            barPattern.kick[i] = Math.random() > 0.75;
            barPattern.snare[i] = Math.random() > 0.85;
            barPattern.hihat[i] = Math.random() > 0.6;
            barPattern.bass[i] = Math.random() > 0.7;
            barPattern.arp[i] = Math.random() > 0.65;
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
