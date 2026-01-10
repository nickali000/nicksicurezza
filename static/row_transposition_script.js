document.getElementById('encryptBtn').addEventListener('click', runEncryption);
document.getElementById('resetBtn').addEventListener('click', resetVisualization);

async function runEncryption() {
    const text = document.getElementById('plaintext').value;
    const key = document.getElementById('key').value;

    if (!text || !key) {
        alert("Inserisci testo e chiave!");
        return;
    }

    if (!/^\d+$/.test(key)) {
        alert("La chiave deve contenere solo numeri!");
        return;
    }

    try {
        const response = await fetch('/encrypt_row_transposition', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text: text, key: key })
        });

        const data = await response.json();

        if (data.error) {
            alert("Errore: " + data.error);
            return;
        }

        visualizeEncryption(data);

    } catch (error) {
        console.error("Errore nella richiesta:", error);
        alert("Errore di connessione al server.");
    }
}

function resetVisualization() {
    document.getElementById('visualization').classList.add('hidden');
    document.getElementById('grid-container').innerHTML = '';
    document.getElementById('ciphertext-display').textContent = '';
    document.getElementById('log-list').innerHTML = '';
}

function visualizeEncryption(data) {
    const vizSection = document.getElementById('visualization');
    vizSection.classList.remove('hidden');

    const gridContainer = document.getElementById('grid-container');
    const ciphertextDisplay = document.getElementById('ciphertext-display');
    const logList = document.getElementById('log-list');

    // Clear previous
    gridContainer.innerHTML = '';
    ciphertextDisplay.textContent = '';
    logList.innerHTML = '';

    // Create Grid
    const numCols = data.key.length; // Assume cleaned key from backend if needed, but here we use data.algo_col_order.length really? No, grid rows have length.
    // Actually, backend returns grid so we can inspect grid[0].length
    const gridRows = data.grid.length;
    const gridCols = data.grid[0].length;

    // Setup CSS Grid
    const gridEl = document.createElement('div');
    gridEl.className = 'cipher-grid';
    gridEl.style.gridTemplateColumns = `repeat(${gridCols}, 1fr)`;

    // Header Row (Key Indices / Values)
    // We want to show the original key characters or their order?
    // Let's show the key characters first.
    // And maybe below them, the order index (1, 2, 3...)

    // Let's just show key characters for now.
    // But we need to know the *read order* visually.
    // The backend `algo_col_order` tells us which index is read 1st, 2nd, etc.
    // Example: Key ZEBRA. Order [4, 2, 1, 3, 0] (indices).
    // It means: Read col 4 first. Read col 2 second.
    // Let's deduce the rank of each column to display it.
    // If algo_col_order is [4, 2, 1, 3, 0]
    // Col 0 is read 5th. Col 1 is 3rd. Col 2 is 2nd. Col 3 is 4th. Col 4 is 1st.
    // Ranks: 5, 3, 2, 4, 1.

    const ranks = new Array(gridCols).fill(0);
    data.algo_col_order.forEach((colIdx, i) => {
        ranks[colIdx] = i + 1;
    });

    // Create Header Cells
    for (let c = 0; c < gridCols; c++) {
        const cell = document.createElement('div');
        cell.className = 'grid-cell grid-header';
        // Display Key Char + Rank
        // Assuming key length matches numCols.
        // data.key might differ if backend cleaned it? Backend returns original key usually.
        // Let's use data.key[c], but handle digits vs chars.
        let label = (data.key[c] || '?') + "\n(" + ranks[c] + ")";
        cell.innerText = label;
        cell.style.fontSize = "0.8em";
        cell.style.whiteSpace = "pre";
        cell.id = `header-${c}`;
        gridEl.appendChild(cell);
    }

    // Create Grid Content
    for (let r = 0; r < gridRows; r++) {
        for (let c = 0; c < gridCols; c++) {
            const cell = document.createElement('div');
            cell.className = 'grid-cell grid-char';
            cell.innerText = data.grid[r][c];
            cell.id = `cell-${r}-${c}`;
            gridEl.appendChild(cell);
        }
    }

    gridContainer.appendChild(gridEl);

    // Animate Steps
    animateSteps(data.steps, data.algo_col_order, gridRows);
}

async function animateSteps(steps, colOrder, numRows) {
    const logList = document.getElementById('log-list');
    const ciphertextDisplay = document.getElementById('ciphertext-display');

    // Filter steps to those that read columns? 
    // The backend returns steps for "Read column X".
    let stepIndex = 0;

    // Delay helper
    const delay = ms => new Promise(res => setTimeout(res, ms));

    for (const step of steps) {
        if (!step.highlight_col && step.highlight_col !== 0) continue; // Skip initialization step

        await delay(800);

        // Highlight Column
        const colIdx = step.highlight_col;

        // Add Log
        const li = document.createElement('li');
        li.innerHTML = `${step.description} -> <span class="chunk">${step.chunk}</span>`;
        logList.appendChild(li);
        li.scrollIntoView({ behavior: "smooth" });

        // Update Ciphertext
        ciphertextDisplay.textContent = step.ciphertext_so_far;

        // Highlight Cells
        const highlightClass = 'highlight';
        const readClass = 'read';

        // Highlight header
        const header = document.getElementById(`header-${colIdx}`);
        if (header) header.classList.add(highlightClass);

        for (let r = 0; r < numRows; r++) {
            const cell = document.getElementById(`cell-${r}-${colIdx}`);
            if (cell) cell.classList.add(highlightClass);
            await delay(100); // Falling effect
        }

        await delay(500);

        // Mark as read (remove highlight, add read)
        if (header) {
            header.classList.remove(highlightClass);
            header.classList.add(readClass);
        }
        for (let r = 0; r < numRows; r++) {
            const cell = document.getElementById(`cell-${r}-${colIdx}`);
            if (cell) {
                cell.classList.remove(highlightClass);
                cell.classList.add(readClass);
            }
        }
    }
}
