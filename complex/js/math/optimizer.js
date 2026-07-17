// Dynamic Programming and Score-based Optimization for Progression Pathways and Voice-Leading Transitions
export class GraphOptimizer {
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
export const graphOptimizer = new GraphOptimizer();
