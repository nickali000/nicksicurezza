let chart = null;

async function generateSequence() {
    const m = document.getElementById('val-m').value;
    const a = document.getElementById('val-a').value;
    const c = document.getElementById('val-c').value;
    const seed = document.getElementById('val-seed').value;
    const n = document.getElementById('val-n').value;

    try {
        const response = await fetch('/prng_generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ m: m, a: a, c: c, seed: seed, n: n })
        });
        const data = await response.json();

        if (data.error) { alert("Errore: " + data.error); return; }

        renderResults(data);
        document.getElementById('results-area').classList.remove('hidden');

    } catch (e) { console.error(e); alert("Errore connessione"); }
}

function renderResults(data) {
    // 1. Render Chart
    const ctx = document.getElementById('prngChart').getContext('2d');
    const plotData = data.sequence.map((val, idx) => ({ x: idx, y: val }));

    if (chart) chart.destroy();

    chart = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Sequenza Generata',
                data: plotData,
                backgroundColor: '#f59e0b',
                borderColor: '#f59e0b',
                pointRadius: 4,
                showLine: true,
                borderWidth: 1,
                tension: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom',
                    title: { display: true, text: 'Indice (n)', color: '#94a3b8' },
                    grid: { color: '#334155' },
                    ticks: { color: '#94a3b8' }
                },
                y: {
                    title: { display: true, text: 'Valore (Xn)', color: '#94a3b8' },
                    grid: { color: '#334155' },
                    ticks: { color: '#94a3b8' }
                }
            },
            plugins: {
                legend: { labels: { color: '#f8fafc' } }
            }
        }
    });

    // 2. Render Steps
    const container = document.getElementById('prng-steps');
    container.innerHTML = '';

    data.steps.forEach(step => {
        const div = document.createElement('div');
        div.className = 'step-item';

        if (step.step === "Ciclo Rilevato") {
            div.classList.add('cycle-detected');
            div.innerHTML = `<span>⚠️ <strong>${step.step}</strong></span> <span>${step.desc}</span>`;
        } else if (step.formula) {
            div.innerHTML = `
                <span><strong>${step.step}</strong></span>
                <span class="step-formula">${step.formula} = ${step.calc}</span>
                <span class="step-res">➜ ${step.result}</span>
            `;
        } else {
            div.innerHTML = `<strong>${step.step}</strong>: ${step.desc}`;
        }

        container.appendChild(div);
    });
}

function setPreset(m, a, c, seed) {
    document.getElementById('val-m').value = m;
    document.getElementById('val-a').value = a;
    document.getElementById('val-c').value = c;
    document.getElementById('val-seed').value = seed;
    generateSequence();
}
