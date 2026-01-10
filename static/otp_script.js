document.getElementById('encryptBtn').addEventListener('click', runEncryption);
document.getElementById('genKeyBtn').addEventListener('click', generateKey);
document.getElementById('resetBtn').addEventListener('click', resetVisualization);

function generateKey() {
    // Generate random string of same length as plaintext? or just some random chars?
    // Let's generate a random hex string or random alpha
    // User probably wants characters they can read?
    // Let's perform a simple random generation
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const len = document.getElementById('plaintext').value.length || 16;
    let result = '';
    for (let i = 0; i < len; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    document.getElementById('key').value = result;
}

async function runEncryption() {
    const text = document.getElementById('plaintext').value;
    const key = document.getElementById('key').value;

    if (!text) {
        alert("Inserisci del testo!");
        return;
    }

    try {
        const response = await fetch('/encrypt_otp', {
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
        if (data.generated_key) {
            // Show generated key in input to avoid confusion?
            // Actually API returns it but formatted?
            // Backend returns key_used. 
            // If it was bytes generated? 
            // The backend returns hex of bytes if generated?
            // "key_used" in backend is hex string if generated.
            // Let's check backend logic: key = key_bytes.hex().
            // So we can display it.
            if (document.getElementById('key').value === '') {
                document.getElementById('key').value = "(Generated Hex) " + data.key_used;
            }
        }

    } catch (error) {
        console.error("Errore:", error);
        alert("Errore di connessione.");
    }
}

function resetVisualization() {
    document.getElementById('visualization').classList.add('hidden');
    document.getElementById('otp-container').innerHTML = '';
    document.getElementById('ciphertext-display').textContent = '';
}

function visualizeEncryption(data) {
    const vizSection = document.getElementById('visualization');
    vizSection.classList.remove('hidden');

    const container = document.getElementById('otp-container');
    container.innerHTML = '';

    // Display Hex string as primary output
    document.getElementById('ciphertext-display').innerHTML = `
        <div style="margin-bottom: 5px;"><strong>Hex:</strong> <span style="font-family: monospace;">${data.ciphertext_hex}</span></div>
        <div style="font-size: 0.8em; color: #888;">(ASCII: ${data.ciphertext_text})</div>
    `;

    data.steps.forEach((step, index) => {
        // Create a block for each character
        const block = document.createElement('div');
        block.className = 'otp-block';

        // Plaintext
        const pDiv = document.createElement('div');
        pDiv.innerHTML = `
            <span class="otp-char" title="Char Code: ${step.char_code}">${step.char}</span>
            <div class="otp-row"><span class="otp-label">Bin:</span> <span class="otp-bits">${step.char_bin}</span></div>
        `;
        block.appendChild(pDiv);

        // XOR Operator
        const op = document.createElement('div');
        op.className = 'xor-operator';
        op.innerText = "XOR (⊕)";
        block.appendChild(op);

        // Key
        const kDiv = document.createElement('div');
        kDiv.innerHTML = `
            <span class="otp-char" title="Key Code: ${step.key_code}" style="color: #ff9900;">${step.key_char}</span>
            <div class="otp-row"><span class="otp-label">Bin:</span> <span class="otp-bits key">${step.key_bin}</span></div>
        `;
        block.appendChild(kDiv);

        // Result
        const rDiv = document.createElement('div');
        // Always show Hex as primary, and ASCII if available
        const asciiDisplay = step.result_char ? `<span style="font-size:0.6em; color:#888;">('${step.result_char}')</span>` : '';

        rDiv.innerHTML = `
            <div class="otp-row" style="margin-top:5px; border-top:1px solid #555"><span class="otp-label">Res:</span> <span class="otp-bits result">${step.result_bin}</span></div>
            <div class="otp-row"><span class="otp-label">Hex:</span> <span style="color:#00bfff; font-size:1.2em">0x${step.result_hex} ${asciiDisplay}</span></div>
        `;
        block.appendChild(rDiv);

        // Fade in animation
        block.style.opacity = 0;
        container.appendChild(block);

        setTimeout(() => {
            block.style.transition = 'opacity 0.5s';
            block.style.opacity = 1;
        }, index * 100);
    });
}
