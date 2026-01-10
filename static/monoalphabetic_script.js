document.getElementById('encryptBtn').addEventListener('click', runEncryption);
document.getElementById('resetBtn').addEventListener('click', resetVisualization);

async function runEncryption() {
    const text = document.getElementById('plaintext').value;
    const key = document.getElementById('key').value;

    if (!text) {
        alert("Inserisci del testo!");
        return;
    }

    try {
        const response = await fetch('/encrypt_monoalphabetic', {
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
    document.getElementById('alphabet-container').innerHTML = '';
    document.getElementById('mono-feeder').innerHTML = '';
    document.getElementById('ciphertext-display').textContent = '';
}

function visualizeEncryption(data) {
    const vizSection = document.getElementById('visualization');
    vizSection.classList.remove('hidden');

    // 1. Draw Alphabet Grid
    const container = document.getElementById('alphabet-container');
    container.innerHTML = '';

    // Header Labels (Optional, using grid template)
    // Row 1: Plain
    const pLabel = document.createElement('div');
    pLabel.className = 'row-label';
    pLabel.innerText = 'Chiaro:';
    container.appendChild(pLabel);

    data.standard_alphabet.forEach((char, i) => {
        const cell = document.createElement('div');
        cell.className = 'alpha-cell plain-row';
        cell.innerText = char;
        cell.id = `plain-${char}`;
        container.appendChild(cell);
    });

    // Row 2: Cipher
    const cLabel = document.createElement('div');
    cLabel.className = 'row-label';
    cLabel.innerText = 'Cifrato:';
    container.appendChild(cLabel);

    data.cipher_alphabet.forEach((char, i) => {
        const cell = document.createElement('div');
        cell.className = 'alpha-cell cipher-row';
        cell.innerText = char;
        // Check mapping to find which plain char maps here? 
        // No, visual is aligned by index. Plain[i] -> Cipher[i]
        const plainChar = data.standard_alphabet[i];
        cell.id = `cipher-${plainChar}`; // ID based on corresponding PLAINTEXT value for easy lookup
        container.appendChild(cell);
    });

    // 2. Animate Stream
    const feeder = document.getElementById('mono-feeder');
    feeder.innerHTML = '';
    document.getElementById('ciphertext-display').textContent = '';

    data.steps.forEach((step, index) => {
        // Create Slot
        const box = document.createElement('div');
        box.className = 'char-box';

        const pSpan = document.createElement('span');
        pSpan.className = 'char-plain';
        pSpan.innerText = step.p_char;

        const cSpan = document.createElement('span');
        cSpan.className = 'char-cipher';
        cSpan.id = `res-char-${index}`;
        cSpan.innerText = step.c_char;

        box.appendChild(pSpan);
        box.appendChild(cSpan);
        feeder.appendChild(box);

        // Schedule Animation
        setTimeout(() => {
            animateStep(step, index);
        }, index * 800);
    });
}

function animateStep(step, index) {
    const char = step.p_char;

    // 1. Clear previous highlights
    document.querySelectorAll('.active-input').forEach(el => el.classList.remove('active-input'));
    document.querySelectorAll('.active-output').forEach(el => el.classList.remove('active-output'));

    // 2. Highlight Grid
    const plainCell = document.getElementById(`plain-${char}`);
    const cipherCell = document.getElementById(`cipher-${char}`);

    if (plainCell && cipherCell) {
        plainCell.classList.add('active-input');

        setTimeout(() => {
            cipherCell.classList.add('active-output');
        }, 200);
    }

    // 3. Show Result
    setTimeout(() => {
        const resSpan = document.getElementById(`res-char-${index}`);
        if (resSpan) resSpan.classList.add('visible');
        document.getElementById('ciphertext-display').textContent += step.c_char;
    }, 400);
}
