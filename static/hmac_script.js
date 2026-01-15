async function calculateHMAC() {
    const key = document.getElementById('hmac-key').value;
    const msg = document.getElementById('hmac-msg').value;

    if (!key || !msg) { alert("Inserisci chiave e messaggio."); return; }

    try {
        const response = await fetch('/hmac_calculate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: key, message: msg })
        });
        const data = await response.json();

        if (data.error) { alert("Errore: " + data.error); return; }

        document.getElementById('hmac-output').textContent = data.hmac;
        renderSteps(data.steps, 'hmac-steps');
        document.getElementById('results-area').classList.remove('hidden');

    } catch (e) { console.error(e); alert("Errore di connessione"); }
}

function renderSteps(steps, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';

    steps.forEach(step => {
        const div = document.createElement('div');
        div.className = 'step-item';

        let html = `<strong>${step.step}</strong><br><span class="step-desc">${step.desc}</span>`;
        if (step.detail) {
            html += `<br><code class="step-val">Dettaglio: ${step.detail}</code>`;
        }
        if (step.result) {
            html += `<br><code class="step-val">=> ${step.result}</code>`;
        }

        div.innerHTML = html;
        container.appendChild(div);
    });
}
