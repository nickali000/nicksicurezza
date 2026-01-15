let publicKey = null;
let privateKey = null; // In real world never expose this client side easily but for demo ok
let currentCiphertext = null;

async function generateKeys() {
    const p = document.getElementById('p').value;
    const q = document.getElementById('q').value;

    if (!p || !q) {
        alert("Inserisci entrambi i numeri primi p e q.");
        return;
    }

    try {
        const response = await fetch('/rsa_generate_keys', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ p: p, q: q })
        });

        const data = await response.json();

        if (data.error) {
            alert("Error: " + data.error);
            return;
        }

        publicKey = data.public_key;
        privateKey = data.private_key;

        // Update UI
        document.getElementById('public-key-display').textContent = `(e=${publicKey[0]}, n=${publicKey[1]})`;
        document.getElementById('private-key-display').textContent = `(d=${privateKey[0]}, n=${privateKey[1]})`;
        document.getElementById('n-val').textContent = publicKey[1];
        document.getElementById('phi-val').textContent = data.phi;

        renderKeyGenSteps(data.steps, 'key-generation-steps');

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

    const text = document.getElementById('plaintext').value;
    if (!text) {
        alert("Inserisci un messaggio.");
        return;
    }

    try {
        const response = await fetch('/rsa_encrypt', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                text: text,
                e: publicKey[0],
                n: publicKey[1]
            })
        });

        const data = await response.json();

        if (data.error) {
            alert("Error: " + data.error);
            return;
        }

        currentCiphertext = data.ciphertext;
        renderSteps(data.steps, 'encryption-steps');
        document.getElementById('ciphertext-display').textContent = data.ciphertext.join(', ');
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
        alert("Devi prima cifrare un messaggio.");
        return;
    }

    try {
        const response = await fetch('/rsa_decrypt', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ciphertext: currentCiphertext,
                d: privateKey[0],
                n: privateKey[1]
            })
        });

        const data = await response.json();

        if (data.error) {
            alert("Error: " + data.error);
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

        if (step.type === 'info') {
            div.textContent = step.message;
            div.style.borderLeftColor = '#a855f7';
        } else if (step.type === 'step') {
            if (step.char) {
                // Encryption step
                div.innerHTML = `
                    <span>Carattere: <strong>${step.char}</strong> (ASCII: ${step.m})</span><br>
                    <span>Calcolo: ${step.formula} = <strong>${step.result}</strong></span>
                `;
            } else {
                // Decryption step
                div.innerHTML = `
                    <span>Intero Cifrato: <strong>${step.c}</strong></span><br>
                    <span>Calcolo: ${step.formula} = <strong>${step.result_m}</strong> (ASCII)</span><br>
                    <span>Carattere Risultante: <strong>${step.result_char}</strong></span>
                `;
            }
        }

        container.appendChild(div);
    });
}

function renderKeyGenSteps(steps, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';

    steps.forEach(step => {
        const div = document.createElement('div');
        div.className = 'step-item';
        div.style.borderLeftColor = '#10b981'; // Green for generation

        div.innerHTML = `
            <span><strong>${step.step}</strong></span><br>
            <span>Math: ${step.formula}</span><br>
            <span class="step-info">${step.desc}</span>
        `;

        container.appendChild(div);
    });
}
