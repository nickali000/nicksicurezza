document.getElementById('encryptBtn').addEventListener('click', runEncryption);
document.getElementById('resetBtn').addEventListener('click', resetVisualization);

// Global grid references
let letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

// Initialize Grid on Load
document.addEventListener('DOMContentLoaded', () => {
    createTabulaRecta();
});

function createTabulaRecta() {
    const grid = document.getElementById('tabula-recta');
    grid.innerHTML = '';

    // Top-Left Corner
    const corner = document.createElement('div');
    corner.className = 'tr-cell tr-header-corner';
    grid.appendChild(corner);

    // Top Header Row (A-Z)
    for (let i = 0; i < 26; i++) {
        const cell = document.createElement('div');
        cell.className = 'tr-cell tr-header-row';
        cell.innerText = letters[i];
        cell.dataset.colChar = letters[i];
        grid.appendChild(cell);
    }

    // Rows
    for (let r = 0; r < 26; r++) {
        // Row Header (Key)
        const rowHeader = document.createElement('div');
        rowHeader.className = 'tr-cell tr-header-col';
        rowHeader.innerText = letters[r];
        rowHeader.dataset.rowChar = letters[r];
        grid.appendChild(rowHeader);

        // Cells
        for (let c = 0; c < 26; c++) {
            const shift = (r + c) % 26;
            const char = letters[shift];
            const cell = document.createElement('div');
            cell.className = 'tr-cell';
            cell.innerText = char;
            cell.id = `cell-${letters[r]}-${letters[c]}`; // e.g., cell-L-A
            grid.appendChild(cell);
        }
    }
}


async function runEncryption() {
    const text = document.getElementById('plaintext').value;
    const key = document.getElementById('key').value;

    if (!text || !key) {
        alert("Inserisci testo e chiave!");
        return;
    }

    try {
        const response = await fetch('/encrypt_vigenere', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: text, key: key })
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
    document.getElementById('vigenere-container').innerHTML = '';
    document.getElementById('ciphertext-display').textContent = '';
    clearHighlights();
}

function clearHighlights() {
    document.querySelectorAll('.highlight-row').forEach(el => el.classList.remove('highlight-row'));
    document.querySelectorAll('.highlight-col').forEach(el => el.classList.remove('highlight-col'));
    document.querySelectorAll('.highlight-intersection').forEach(el => el.classList.remove('highlight-intersection'));
    document.querySelectorAll('.vigenere-col.active').forEach(el => el.classList.remove('active'));
}

function visualizeEncryption(data) {
    const vizSection = document.getElementById('visualization');
    vizSection.classList.remove('hidden');

    const container = document.getElementById('vigenere-container');
    container.innerHTML = '';
    document.getElementById('ciphertext-display').textContent = data.ciphertext;

    // Build steps container first
    const colElements = [];
    data.steps.forEach((step) => {
        const col = document.createElement('div');
        col.className = 'vigenere-col';

        const pCell = createCell(step.p_char, step.p_val);
        col.appendChild(pCell);

        const plus = document.createElement('div');
        plus.className = 'vigenere-op';
        plus.innerText = '+';
        col.appendChild(plus);

        const kCell = createCell(step.k_char, step.k_val);
        kCell.classList.add('key-cell');
        col.appendChild(kCell);

        const rCell = createCell(step.c_char, step.c_val);
        rCell.classList.add('vigenere-result');
        col.appendChild(rCell);

        container.appendChild(col);
        colElements.push({ col, step });

        // Show cells immediately
        pCell.classList.add('visible');
        kCell.classList.add('visible');
        rCell.classList.add('visible');
    });

    // Animate Tabula Recta Interaction
    animateSequence(colElements, 0);
}

function animateSequence(steps, index) {
    if (index >= steps.length) return;

    const { col, step } = steps[index];

    // 1. Highlight Step Column in Result View
    steps.forEach(s => s.col.classList.remove('active')); // clear previus
    col.classList.add('active');

    // 2. Clear previous grid highlights
    clearHighlights();

    const keyChar = step.k_char;
    const textChar = step.p_char;

    // 3. Highlight Row (Key) and Col (Text) on Grid
    // Highlight Row Header
    const rowHeader = document.querySelector(`[data-row-char="${keyChar}"]`);
    if (rowHeader) rowHeader.classList.add('highlight-row');

    // Highlight all cells in row
    letters.split('').forEach(l => {
        const cell = document.getElementById(`cell-${keyChar}-${l}`);
        if (cell) cell.classList.add('highlight-row');
    });

    // Highlight Col Header
    const colHeader = document.querySelector(`[data-col-char="${textChar}"]`);
    if (colHeader) colHeader.classList.add('highlight-col');

    // Highlight all cells in col
    letters.split('').forEach(l => {
        const cell = document.getElementById(`cell-${l}-${textChar}`);
        if (cell) cell.classList.add('highlight-col');
    });

    // 4. Highlight Intersection
    const intersection = document.getElementById(`cell-${keyChar}-${textChar}`);
    if (intersection) {
        intersection.classList.add('highlight-intersection');
        intersection.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    }

    // Next step
    setTimeout(() => {
        animateSequence(steps, index + 1);
    }, 1000); // 1.0s per step
}


function createCell(char, idx) {
    const cell = document.createElement('div');
    cell.className = 'vigenere-cell';
    cell.innerHTML = `<span class="char">${char}</span><span class="idx">${idx}</span>`;
    return cell;
}
