// Highly expressive, multi-algorithm generative arpeggiator engine.
// Features a structurally authentic Fractal Fluency Engine that computes pitch and velocity
// self-similarity based on the active/future layers of the Main Bass Progression and dynamic
// user-defined Fractal Roots, propagating cleanly across musical resolution targets.
// Upgraded with classic jazz arpeggio shapes, strict/modal scale constraints, and
// dynamic Voice History & Interdependence tracking to ensure proper voice leading and collision avoidance.
export class ArpGenerator {
    constructor() {
        this.index = 0;
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
        arpHistory = []
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

export const arpGenerator = new ArpGenerator();
export default arpGenerator;
