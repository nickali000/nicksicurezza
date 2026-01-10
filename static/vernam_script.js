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
        const response = await fetch('/encrypt_vernam', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: text, key: key })
        });

        const data = await response.json();

        if (data.error) {
            alert("Errore: " + data.error);
            return;
        }

        // Populate generated key if needed
        if (data.generated_key && document.getElementById('key').value === '') {
            document.getElementById('key').value = "(Generata) " + data.key_used;
        }

        visualizeEncryption(data);

    } catch (error) {
        console.error("Errore:", error);
        alert("Errore di connessione.");
    }
}

function resetVisualization() {
    document.getElementById('visualization').classList.add('hidden');
    document.getElementById('vernam-container').innerHTML = '';
    document.getElementById('ciphertext-display').textContent = '';
}

function visualizeEncryption(data) {
    const vizSection = document.getElementById('visualization');
    vizSection.classList.remove('hidden');

    const container = document.getElementById('vernam-container');
    container.innerHTML = '';
    document.getElementById('ciphertext-display').textContent = data.ciphertext;

    data.steps.forEach((step, index) => {
        // Create Column
        const col = document.createElement('div');
        col.className = 'vernam-col';

        // Plaintext
        const pCell = createCell(step.p_char, step.p_idx, '#444');
        col.appendChild(pCell);

        // Plus
        const plus = document.createElement('div');
        plus.className = 'vernam-op';
        plus.innerText = '+';
        col.appendChild(plus);

        // Key
        const kCell = createCell(step.k_char, step.k_idx, '#444');
        col.appendChild(kCell);

        // Math
        const math = document.createElement('div');
        math.className = 'math-detail';
        math.innerText = `${step.p_idx} + ${step.k_idx} = ${step.sum_val}`;
        col.appendChild(math);

        const mod = document.createElement('div');
        mod.className = 'math-detail';
        mod.innerText = `mod 26 = ${step.c_idx}`;
        col.appendChild(mod);

        // Result
        const rCell = createCell(step.c_char, step.c_idx, '#007bff');
        rCell.classList.add('vernam-result');
        col.appendChild(rCell);

        container.appendChild(col);

        // Animate
        setTimeout(() => {
            pCell.classList.add('visible');
            kCell.classList.add('visible');
            rCell.classList.add('visible');
        }, index * 200);
    });
}

function createCell(char, idx, bgColor) {
    const cell = document.createElement('div');
    cell.className = 'vernam-cell';
    // cell.style.backgroundColor = bgColor; // CSS class handles result color
    cell.innerHTML = `<span class="char">${char}</span><span class="idx">${idx}</span>`;
    return cell;
}
