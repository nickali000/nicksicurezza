document.getElementById('encryptBtn').addEventListener('click', runEncryption);
document.getElementById('resetBtn').addEventListener('click', resetVisualization);

async function runEncryption() {
    const text = document.getElementById('plaintext').value;
    const rails = document.getElementById('rails').value;

    if (!text) {
        alert("Inserisci del testo!");
        return;
    }

    try {
        const response = await fetch('/encrypt_rail_fence', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: text, rails: rails })
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
    document.getElementById('rail-container').innerHTML = '';
    document.getElementById('ciphertext-display').textContent = '';
    document.getElementById('log-list').innerHTML = '';
}

function visualizeEncryption(data) {
    const vizSection = document.getElementById('visualization');
    vizSection.classList.remove('hidden');

    const container = document.getElementById('rail-container');
    container.innerHTML = '';
    document.getElementById('ciphertext-display').textContent = '';
    document.getElementById('log-list').innerHTML = '';

    const rails = data.rails;
    const textLen = data.text.length;

    // Set container height relative to rails?
    // Each rail 50px high + spacing
    container.style.height = (rails * 50 + 40) + 'px';
    container.style.position = 'relative';

    // Create Cell Elements (hidden initially)
    // We use absolute positioning.
    // X step = maybe 40px
    const xStep = 40;
    container.style.width = (textLen * xStep + 40) + 'px'; // Ensure scroll

    data.coords.forEach((coord, index) => {
        const cell = document.createElement('div');
        cell.className = 'rail-cell';
        cell.innerText = coord.char;
        cell.id = `cell-${coord.row}-${coord.col}`;

        // Position
        // Top: row * 50
        // Left: col * xStep
        cell.style.top = (coord.row * 50) + 'px';
        cell.style.left = (coord.col * xStep) + 'px';

        container.appendChild(cell);
    });

    animateSteps(data.steps, data.coords);
}

async function animateSteps(steps, placingOrder) {
    const logList = document.getElementById('log-list');
    const ciphertextDisplay = document.getElementById('ciphertext-display');
    const delay = ms => new Promise(res => setTimeout(res, ms));

    // Phase 1: Show placement (Zig Zag)
    // placingOrder is list of {row, col, char} in order of input text
    for (const item of placingOrder) {
        const cell = document.getElementById(`cell-${item.row}-${item.col}`);
        if (cell) {
            cell.classList.add('visible');
            await delay(200); // 200ms per char placement
        }
    }

    await delay(500);

    // Phase 2: Read Rows
    for (const step of steps) {
        if (!step.highlight_cell) continue; // Skip setup steps that don't highlight

        const r = step.highlight_cell.row;
        const c = step.highlight_cell.col;

        const cell = document.getElementById(`cell-${r}-${c}`);
        if (cell) {
            cell.classList.add('highlight');
        }

        // Log
        const li = document.createElement('li');
        li.innerHTML = `${step.description} -> <span class="chunk">${step.chunk}</span>`;
        logList.appendChild(li);
        li.scrollIntoView({ behavior: "smooth" });

        ciphertextDisplay.textContent = step.ciphertext_so_far;

        await delay(400);

        if (cell) {
            cell.classList.remove('highlight');
            cell.classList.add('read');
        }
    }
}
