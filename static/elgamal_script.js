let privateKey = null;
let publicKey = null;
let currentCiphertext = null;

async function generateKeys() {
    const p = document.getElementById('p').value;
    const g = document.getElementById('g').value;

    if (!p || !g) {
        alert("Inserisci p e g.");
        return;
    }

    try {
        const response = await fetch('/elgamal_generate_keys', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ p: p, g: g })
        });
        const data = await response.json();

        if (data.error) {
            alert("Errore: " + data.error);
            return;
        }

        privateKey = data.x;
        publicKey = { p: data.p, g: data.g, y: data.y };

        document.getElementById('private-key-display').textContent = `x = ${privateKey}`;
        document.getElementById('public-key-display').textContent = `(p=${data.p}, g=${data.g}, y=${data.y})`;

        renderSteps(data.steps, 'keygen-steps');
        document.getElementById('key-results').classList.remove('hidden');

    } catch (error) {
        alert("Richiesta fallita: " + error);
    }
}

async function encryptMessage() {
    if (!publicKey) {
        alert("Genera prima le chiavi!");
        return;
    }

    const message = document.getElementById('plaintext').value;
    if (!message) {
        alert("Inserisci un messaggio.");
        return;
    }

    try {
        const response = await fetch('/elgamal_encrypt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: message,
                p: publicKey.p,
                g: publicKey.g,
                y: publicKey.y
            })
        });
        const data = await response.json();

        if (data.error) {
            alert("Errore: " + data.error);
            return;
        }

        currentCiphertext = data.ciphertext;
        renderSteps(data.steps, 'encryption-steps');

        // Format ciphertext for display
        const display = data.ciphertext.map(pair => `(${pair.a}, ${pair.b})`).join(', ');
        document.getElementById('ciphertext-display').textContent = display;

        document.getElementById('encryption-results').classList.remove('hidden');

    } catch (error) {
        alert("Cifratura fallita: " + error);
    }
}

async function decryptMessage() {
    if (!privateKey) {
        alert("Genera prima le chiavi!");
        return;
    }
    if (!currentCiphertext) {
        alert("Nessun messaggio cifrato da decifrare.");
        return;
    }

    try {
        const response = await fetch('/elgamal_decrypt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ciphertext: currentCiphertext,
                p: publicKey.p,
                x: privateKey
            })
        });
        const data = await response.json();

        if (data.error) {
            alert("Errore: " + data.error);
            return;
        }

        renderSteps(data.steps, 'decryption-steps');
        document.getElementById('decrypted-text-display').textContent = data.plaintext;
        document.getElementById('decryption-results').classList.remove('hidden');

    } catch (error) {
        alert("Decifratura fallita: " + error);
    }
}

function renderSteps(steps, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';

    steps.forEach(step => {
        const div = document.createElement('div');
        div.className = 'step-item';

        if (step.step) {
            // General steps
            div.innerHTML = `<strong>${step.step}</strong><br>${step.description}<br><code style="display:block;margin-top:5px">${step.math}</code>`;
        } else if (step.type === 'info') {
            div.innerHTML = `<em>${step.message}</em>`;
            div.style.borderLeftColor = '#94a3b8';
        } else if (step.type === 'step') {
            if (step.calc_a) {
                // Encryption step
                div.innerHTML = `
                    <span>Carattere: <strong>${step.char}</strong> (ASCII: ${step.m})</span><br>
                    <span>k (random): ${step.k}</span><br>
                    <span>${step.calc_a}</span><br>
                    <span>${step.calc_b}</span>
                `;
            } else if (step.calc_s) {
                // Decryption step
                div.innerHTML = `
                    <span>Coppia: ${step.pair}</span><br>
                    <span>${step.calc_s}</span><br>
                    <span>${step.calc_m}</span><br>
                    <span>Carattere: <strong>${step.result_char}</strong></span>
                 `;
            }
        }

        container.appendChild(div);
    });
}
