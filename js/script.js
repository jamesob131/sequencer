const synth = new Tone.PolySynth(Tone.Synth).toDestination();
const notes = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'];
let sequencer = Array(16).fill().map(() => Array(8).fill(false));
let isPlaying = false;

function createSequencerUI() {
    const sequencerElement = document.getElementById('sequencer');
    for (let step = 0; step < 16; step++) {
        for (let row = 0; row < 8; row++) {
            const button = document.createElement('div');
            button.className = 'step';
            button.onclick = () => toggleStep(step, row);
            sequencerElement.appendChild(button);
        }
    }
}

function toggleStep(step, row) {
    sequencer[step][row] = !sequencer[step][row];
    updateSequencerUI();
}

function updateSequencerUI() {
    const steps = document.querySelectorAll('.step');
    sequencer.forEach((step, stepIndex) => {
        step.forEach((isActive, rowIndex) => {
            const index = stepIndex * 8 + rowIndex;
            steps[index].classList.toggle('active', isActive);
        });
    });
}

function playSequence() {
    const seq = new Tone.Sequence((time, step) => {
        for (let row = 0; row < 8; row++) {
            if (sequencer[step][row]) {
                synth.triggerAttackRelease(notes[row], '8n', time);
            }
        }
    }, Array.from({length: 16}, (_, i) => i), '16n');

    seq.start(0);
    Tone.Transport.start();
}

document.getElementById('playBtn').addEventListener('click', () => {
    if (!isPlaying) {
        Tone.start();
        playSequence();
        isPlaying = true;
    } else {
        Tone.Transport.toggle();
    }
});

document.getElementById('stopBtn').addEventListener('click', () => {
    Tone.Transport.stop();
    isPlaying = false;
});

document.getElementById('tempoSlider').addEventListener('input', (e) => {
    const tempo = e.target.value;
    Tone.Transport.bpm.value = tempo;
    document.getElementById('tempoValue').textContent = `${tempo} BPM`;
});

// New functions to interact with the Worker

async function saveSequence() {
    try {
        const response = await fetch('/api/save', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ sequencer }),
        });
        const result = await response.json();
        if (result.success) {
            alert('Sequence saved successfully!');
        } else {
            throw new Error('Failed to save sequence');
        }
    } catch (error) {
        console.error('Error saving sequence:', error);
        alert('Failed to save sequence. Please try again.');
    }
}

async function loadSequence() {
    try {
        const response = await fetch('/api/load');
        if (response.ok) {
            const data = await response.json();
            sequencer = data.sequencer;
            updateSequencerUI();
            alert('Sequence loaded successfully!');
        } else if (response.status === 404) {
            alert('No saved sequence found.');
        } else {
            throw new Error('Failed to load sequence');
        }
    } catch (error) {
        console.error('Error loading sequence:', error);
        alert('Failed to load sequence. Please try again.');
    }
}

// Add event listeners for save and load buttons
document.getElementById('saveBtn').addEventListener('click', saveSequence);
document.getElementById('loadBtn').addEventListener('click', loadSequence);

createSequencerUI();
