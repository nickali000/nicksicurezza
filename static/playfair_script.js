document.getElementById('encryptBtn').addEventListener('click', runEncryption);
document.getElementById('resetBtn').addEventListener('click', resetVisualization);

async function runEncryption() {
    const text = document.getElementById('plaintext').value;
    const key = document.getElementById('key').value;

    if (!text || !key) {
        alert("Inserisci testo e chiave!");
        return;
    }

    try {
        const response = await fetch('/encrypt_playfair', {
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
    document.getElementById('playfair-grid').innerHTML = '';
    document.getElementById('digraph-stream').innerHTML = '';
    document.getElementById('ciphertext-display').textContent = '';
    document.getElementById('current-rule').textContent = '';
    document.getElementById('rule-description').textContent = '';
    document.getElementById('preprocessing-log').classList.add('hidden');
}

function visualizeEncryption(data) {
    const vizSection = document.getElementById('visualization');
    vizSection.classList.remove('hidden');

    // 0. Preprocessing Logs
    const prepContainer = document.getElementById('preprocessing-log');
    const prepList = document.getElementById('prep-list');
    prepList.innerHTML = '';

    if (data.preprocessing_steps && data.preprocessing_steps.length > 0) {
        prepContainer.classList.remove('hidden');
        data.preprocessing_steps.forEach(item => {
            const li = document.createElement('li');
            li.innerHTML = `<strong>${item.pair}</strong>: ${item.note}`;
            prepList.appendChild(li);
        });
    } else {
        prepContainer.classList.add('hidden');
    }

    // 1. Draw Grid
    const grid = document.getElementById('playfair-grid');
    grid.innerHTML = '';
    data.matrix.forEach((row, r) => {
        row.forEach((char, c) => {
            const cell = document.createElement('div');
            cell.className = 'pf-cell';
            cell.innerText = char;
            cell.id = `cell-${r}-${c}`;
            grid.appendChild(cell);
        });
    });

    // 2. Setup Digraph Stream
    const stream = document.getElementById('digraph-stream');
    stream.innerHTML = '';
    const outputDisplay = document.getElementById('ciphertext-display');
    outputDisplay.textContent = '';
    document.getElementById('current-rule').textContent = '';
    document.getElementById('rule-description').textContent = '';

    const pairElements = [];

    data.steps.forEach((step, index) => {
        const box = document.createElement('div');
        box.className = 'digraph-box';

        const inSpan = document.createElement('span');
        inSpan.className = 'digraph-in';
        inSpan.innerText = step.pair;

        const arrow = document.createElement('span');
        arrow.innerText = '↓';
        arrow.style.fontSize = '0.8em';
        arrow.style.color = '#555';

        const outSpan = document.createElement('span');
        outSpan.className = 'digraph-out';
        outSpan.innerText = step.result;

        box.appendChild(inSpan);
        box.appendChild(arrow);
        box.appendChild(outSpan);

        stream.appendChild(box);
        pairElements.push({ box, outSpan, step });
    });

    // 3. Animate Steps
    animatePlayfair(pairElements, 0);
}

let isPaused = false;
let pauseResolve = null;

document.getElementById('pauseBtn').addEventListener('click', togglePause);

function togglePause() {
    isPaused = !isPaused;
    const btn = document.getElementById('pauseBtn');
    if (isPaused) {
        btn.textContent = "Riprendi";
        btn.style.backgroundColor = "#10b981"; // Green for Resume
    } else {
        btn.textContent = "Pausa";
        btn.style.backgroundColor = "#f59e0b"; // Orange for Pause
        if (pauseResolve) {
            pauseResolve();
            pauseResolve = null;
        }
    }
}

async function animatePlayfair(entries, index) {
    if (index >= entries.length) {
        document.getElementById('pauseBtn').style.display = 'none';
        return;
    }

    // Show button on first step
    if (index === 0) {
        document.getElementById('pauseBtn').style.display = 'inline-block';
        isPaused = false;
        const btn = document.getElementById('pauseBtn');
        btn.textContent = "Pausa";
        btn.style.backgroundColor = "#f59e0b";
    }

    // Check Pause
    if (isPaused) {
        await new Promise(resolve => pauseResolve = resolve);
    }

    const { box, outSpan, step } = entries[index];
    const ruleLabel = document.getElementById('current-rule');
    const ruleDesc = document.getElementById('rule-description');

    // Scroll into view if needed
    box.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });

    // Activate Box
    entries.forEach(e => e.box.classList.remove('active'));
    box.classList.add('active');

    // Show Rule & Description
    ruleLabel.textContent = `(${step.rule})`;
    ruleDesc.textContent = step.rule_desc;

    // Highlight Grid Input
    clearHighlights();

    step.coords_in.forEach(coord => {
        const cell = document.getElementById(`cell-${coord.r}-${coord.c}`);
        if (cell) cell.classList.add('highlight-input');
    });

    // Check Pause before waiting
    if (isPaused) await new Promise(resolve => pauseResolve = resolve);

    await new Promise(r => setTimeout(r, 1000));

    // Check Pause mid-step
    if (isPaused) await new Promise(resolve => pauseResolve = resolve);

    // Highlight resulting cells
    step.coords_out.forEach(coord => {
        const cell = document.getElementById(`cell-${coord.r}-${coord.c}`);
        if (cell) cell.classList.add('highlight-output');
    });

    // Show result text
    outSpan.classList.add('visible');
    document.getElementById('ciphertext-display').textContent += step.result + " ";

    // Wait before next
    await new Promise(r => setTimeout(r, 2000)); // 2s per step wait

    animatePlayfair(entries, index + 1);
}

function clearHighlights() {
    document.querySelectorAll('.highlight-input').forEach(el => el.classList.remove('highlight-input'));
    document.querySelectorAll('.highlight-output').forEach(el => el.classList.remove('highlight-output'));
}
