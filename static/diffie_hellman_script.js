let globalP = null;
let globalG = null;
let privateA = null;
let privateB = null;
let publicA = null;
let publicB = null;

async function step1Setup() {
    try {
        const response = await fetch('/dh_step1_setup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({})
        });
        const data = await response.json();

        if (data.error) { alert(data.error); return; }

        globalP = data.p;
        globalG = data.g;

        document.getElementById('p-val').textContent = globalP;
        document.getElementById('g-val').textContent = globalG;
        document.getElementById('step1-results').classList.remove('hidden');
        document.getElementById('main-exchange-area').classList.remove('hidden');

        renderSteps(data.steps, 'step1-log');

    } catch (e) { console.error(e); alert("Errore connessione"); }
}

async function step2Keys() {
    if (!globalP) { alert("Prima esegui step 1"); return; }

    try {
        const response = await fetch('/dh_step2_keys', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ p: globalP, g: globalG })
        });
        const data = await response.json();

        if (data.error) { alert(data.error); return; }

        privateA = data.private_a;
        privateB = data.private_b;
        publicA = data.public_a;
        publicB = data.public_b;

        // Show secrets
        document.getElementById('val-a').textContent = privateA;
        document.getElementById('alice-private').classList.remove('hidden');

        document.getElementById('val-b').textContent = privateB;
        document.getElementById('bob-private').classList.remove('hidden');

        // Show Publics
        document.getElementById('val-A').textContent = publicA;
        document.getElementById('alice-public').classList.remove('hidden');

        document.getElementById('val-B').textContent = publicB;
        document.getElementById('bob-public').classList.remove('hidden');

        renderSteps(data.steps, 'step2-log');

        document.getElementById('btn-step2').classList.add('hidden');
        document.getElementById('btn-step3').classList.remove('hidden');

    } catch (e) { console.error(e); alert("Errore connessione"); }
}

async function step3Secret() {
    try {
        const response = await fetch('/dh_step3_secret', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                p: globalP,
                private_a: privateA,
                public_b: publicB,
                private_b: privateB,
                public_a: publicA
            })
        });
        const data = await response.json();

        if (data.error) { alert(data.error); return; }

        document.getElementById('val-S-alice').textContent = data.secret_alice;
        document.getElementById('alice-secret').classList.remove('hidden');

        document.getElementById('val-S-bob').textContent = data.secret_bob;
        document.getElementById('bob-secret').classList.remove('hidden');

        renderSteps(data.steps, 'step3-log');
        document.getElementById('btn-step3').classList.add('hidden');

    } catch (e) { console.error(e); alert("Errore connessione"); }
}

function renderSteps(steps, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';

    steps.forEach(step => {
        const div = document.createElement('div');
        div.className = 'step-item';
        let html = `<strong>${step.step}</strong><br>${step.description}`;

        if (step.math) html += `<br><code style="display:block;margin-top:5px">${step.math}</code>`;

        // Specific for key exchange step
        if (step.math_alice) {
            html += `<br>Alice: <code>${step.math_alice}</code>`;
            html += `<br>Bob: <code>${step.math_bob}</code>`;
        }

        if (step.exchange) html += `<br><div style="text-align:center; margin:5px 0; font-family:monospace">${step.exchange}</div>`;

        if (step.alice_calc) {
            html += `<br>Alice: <code>${step.alice_calc}</code>`;
            html += `<br>Bob: <code>${step.bob_calc}</code>`;
        }

        if (step.note) html += `<br><em style="color:#94a3b8; font-size:0.8em">${step.note}</em>`;

        div.innerHTML = html;
        container.appendChild(div);
    });
}
