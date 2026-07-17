// Canvas-based Tonnetz (Neo-Riemannian grid) and Fast Fourier Transform visualizers
export class Visualizers {
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

export default Visualizers;
