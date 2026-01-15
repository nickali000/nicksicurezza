let globalParams = null;
let keyPair = null;
let lastSignature = null;

async function setupParameters() {
    try {
        const response = await fetch('/dsa_setup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
        });
        const data = await response.json();
        if (data.error) { alert("Error: " + data.error); return; }

        globalParams = data;
        document.getElementById('params-display').innerHTML = `
            p = ${data.p}<br>
            q = ${data.q}<br>
            g = ${data.g}
        `;
        document.getElementById('setup-results').classList.remove('hidden');
    } catch (e) {
        alert("Errore setup: " + e);
    }
}

async function generateKeys() {
    if (!globalParams) { alert("Esegui prima Setup Parametri."); return; }
    try {
        const response = await fetch('/dsa_generate_keys', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(globalParams)
        });
        const data = await response.json();
        if (data.error) { alert("Error: " + data.error); return; }

        keyPair = data;
        document.getElementById('keys-display').innerHTML = `
            Privata (x) = ${data.x}<br>
            Pubblica (y) = ${data.y}
        `;

        renderSteps(data.steps, 'keygen-steps');
        document.getElementById('key-results').classList.remove('hidden');
    } catch (e) {
        alert("Errore generazione chiavi: " + e);
    }
}

async function signMessage() {
    const msg = document.getElementById('message-sign').value;
    if (!msg) { alert("Inserisci un messaggio."); return; }
    if (!keyPair) { alert("Genera prima le chiavi."); return; }

    try {
        const response = await fetch('/dsa_sign', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: msg,
                p: globalParams.p,
                q: globalParams.q,
                g: globalParams.g,
                x: keyPair.x
            })
        });
        const data = await response.json();
        if (data.error) { alert("Error: " + data.error); return; }

        lastSignature = { r: data.r, s: data.s, message: msg };

        document.getElementById('signature-display').innerHTML = `(r=${data.r}, s=${data.s})`;
        renderSteps(data.steps, 'sign-steps');
        document.getElementById('sign-results').classList.remove('hidden');

        // Populate verify fields for convenience
        document.getElementById('message-verify').value = msg;
        document.getElementById('r-verify').value = data.r;
        document.getElementById('s-verify').value = data.s;

    } catch (e) {
        alert("Errore firma: " + e);
    }
}

async function verifySignature() {
    const msg = document.getElementById('message-verify').value;
    const r = document.getElementById('r-verify').value;
    const s = document.getElementById('s-verify').value;

    if (!msg || !r || !s) { alert("Dati mancanti."); return; }
    if (!keyPair) { alert("Chiavi mancanti."); return; }

    try {
        const response = await fetch('/dsa_verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: msg,
                r: r,
                s: s,
                p: globalParams.p,
                q: globalParams.q,
                g: globalParams.g,
                y: keyPair.y
            })
        });
        const data = await response.json();
        if (data.error) { alert("Error: " + data.error); return; }

        const statusBox = document.getElementById('verify-status');
        if (data.valid) {
            statusBox.textContent = "FIRMA VALIDA";
            statusBox.className = "status-box status-valid";
        } else {
            statusBox.textContent = "FIRMA NON VALIDA";
            statusBox.className = "status-box status-invalid";
        }

        renderSteps(data.steps, 'verify-steps');
        document.getElementById('verify-results').classList.remove('hidden');

    } catch (e) {
        alert("Errore verifica: " + e);
    }
}

function renderSteps(steps, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';

    steps.forEach(step => {
        const div = document.createElement('div');
        div.className = 'step-item';

        let html = `<strong>${step.step}</strong><br>${step.description}`;

        // Render any math field present
        const mathFields = Object.keys(step).filter(k => k.startsWith('math'));
        mathFields.forEach(k => {
            html += `<br><code style="display:block;margin-top:5px">${step[k]}</code>`;
        });

        div.innerHTML = html;
        container.appendChild(div);
    });
}
