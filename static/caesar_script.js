document.getElementById('encryptBtn').addEventListener('click', runEncryption);
document.getElementById('resetBtn').addEventListener('click', resetVisualization);

const CELL_WIDTH = 42; // 40px width + 2px gap
const VISIBLE_CELLS = 26;

async function runEncryption() {
    // ...
    const text = document.getElementById('plaintext').value;
    const shift = document.getElementById('shift').value;

    if (!text) {
        alert("Inserisci del testo!");
        return;
    }

    try {
        const response = await fetch('/encrypt_caesar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: text, shift: shift })
        });

        const data = await response.json();

        if (data.error) {
            alert("Errore: " + data.error);
            return;
        }

        visualizeEncryption(data);

    } catch (error) {
        console.error("Errore:", error);
        alert("Errore di connessione.");
    }
}

function resetVisualization() {
    document.getElementById('visualization').classList.add('hidden');
    document.getElementById('ciphertext-display').textContent = '';
    document.getElementById('current-step-display').textContent = '';
}

function visualizeEncryption(data) {
    const vizSection = document.getElementById('visualization');
    vizSection.classList.remove('hidden');

    const plainStrip = document.getElementById('plain-strip');
    const cipherStrip = document.getElementById('cipher-strip');

    plainStrip.innerHTML = '';
    cipherStrip.innerHTML = '';

    // Set explicit width for the wrapper to show exactly 26 cells
    const totalWidth = VISIBLE_CELLS * CELL_WIDTH;
    const wrapper = document.querySelector('.cipher-strip-wrapper');
    if (wrapper) {
        wrapper.style.width = `${totalWidth}px`;
    }

    // 1. Setup Static Plain Strip (A-Z)
    data.std_alphabet.forEach(char => {
        const cell = document.createElement('div');
        cell.className = 'p-cell';
        cell.innerText = char;
        cell.id = `p-${char}`;
        plainStrip.appendChild(cell);
    });

    // 2. Setup Sliding Cipher Strip
    // We render 3 copies of A-Z to handle sliding wrap-around visually if we wanted perfect continuous slide
    // But simplified plan: Just render the *standard* alphabet ordered A-Z, 
    // and then use CSS transform to slide it to the left/right?
    // Wait, the backend returns the *shifted* alphabet mapping (e.g. D,E,F... if shift 3).
    // The "Sliding" effect implies we start aligned (A=A) and then slide until A=D.
    // So both strips should contain A-Z in order initially.

    const doubleAlpha = [...data.std_alphabet, ...data.std_alphabet]; // A-Z A-Z for smooth wrap

    doubleAlpha.forEach((char, i) => {
        const cell = document.createElement('div');
        cell.className = 'c-cell';
        cell.innerText = char;
        // Unique ID might be tricky with duplicates, let's use index
        cell.dataset.char = char;
        cell.dataset.idx = i;
        cipherStrip.appendChild(cell);
    });

    // Initial Position: Aligned (Shift 0)
    // To show Shift K, we need to move the bottom strip to the LEFT by K cells.
    // e.g. Shift 3: A (top) aligns with D (bottom).
    // Wait, if Shift=3, A encrypts to D.
    // Visual:
    // P: A B C D ...
    // C: D E F G ...
    // So the 'D' cell of bottom strip must be under 'A' of top strip.
    // Standard bottom strip: A B C D ...
    // To get D under A, we need to shift the bottom strip LEFT by 3 units.

    const shiftVal = parseInt(data.shift);
    const pixelShift = -(shiftVal * CELL_WIDTH);

    // Reset position first to 0 (no animation) to prevent weird jumps if running multiple times?
    // Or just animate from current state? Let's animate from 0 for now to show the "Action".
    cipherStrip.style.transition = 'none';
    cipherStrip.style.transform = 'translateX(0px)';

    // Force Reflow
    cipherStrip.offsetHeight;

    // Animate to new position
    cipherStrip.style.transition = 'transform 1.0s cubic-bezier(0.25, 0.1, 0.25, 1.0)';
    cipherStrip.style.transform = `translateX(${pixelShift}px)`;

    // 3. Start Character Animation after slide finishes
    document.getElementById('ciphertext-display').textContent = '';

    setTimeout(() => {
        animateSteps(data.steps, 0, shiftVal);
    }, 1200); // Wait for 1s slide + buffer
}

function animateSteps(steps, index, shiftVal) {
    if (index >= steps.length) return;

    const step = steps[index];
    const pChar = step.p_char;
    const cChar = step.c_char;

    // Highlight Parent
    const pCell = document.getElementById(`p-${pChar}`);
    if (pCell) pCell.classList.add('active');

    // Highlight Cipher Child
    // We stepped 'shiftVal' to the left.
    // The cipher strip contains A-Z A-Z.
    // The plain 'A' maps to index 0. 
    // The corresponding cipher cell is at index (0 + shiftVal) in the standard alphabet?
    // No, visually:
    // P-Cell index `idx` (0 for A) is geometrically above C-Cell index `idx + shiftVal`.
    // Example Shift 3. P(A) is at 0px. C-Strip moved -3 units.
    // So the cell at index 3 (D) in C-Strip is now at 0px.
    // So we need to highlight the cell in C-Strip at index `p_idx + shiftVal`.

    const targetIdx = step.p_idx + shiftVal;
    // Find the cell in cipher-strip with this index (visual index in the doubled array)
    // The cipher-strip has children 0..51.
    const cCell = document.querySelector(`.c-cell[data-idx="${targetIdx}"]`);

    if (cCell) cCell.classList.add('active');

    // Show Info
    document.getElementById('current-step-display').innerText = `${pChar} + ${shiftVal} → ${cChar} (${step.formula})`;

    setTimeout(() => {
        document.getElementById('ciphertext-display').textContent += cChar;

        // Remove highlights
        if (pCell) pCell.classList.remove('active');
        if (cCell) cCell.classList.remove('active');

        animateSteps(steps, index + 1, shiftVal);
    }, 800);
}
