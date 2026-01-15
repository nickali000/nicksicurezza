let globalCurve = null;
let aliceKeys = null;
let bobKeys = null;
let chart = null;

async function setupCurve() {
    try {
        const response = await fetch('/ecc_setup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
        });
        const data = await response.json();

        if (data.error) { alert("Error: " + data.error); return; }

        globalCurve = data;

        document.getElementById('curve-params-display').innerHTML = `
            Modulo Primo p = ${data.p}<br>
            Equazione: y² = x³ + ${data.a}x + ${data.b}<br>
            Punto Generatore G = ${data.G.str}
        `;
        document.getElementById('setup-results').classList.remove('hidden');

        // Fetch all points and draw graph
        await drawCurveGraph(data);

    } catch (e) { alert("Setup Error: " + e); }
}

async function drawCurveGraph(curveData) {
    try {
        const response = await fetch('/ecc_get_points', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(curveData)
        });
        const data = await response.json();
        if (data.error) throw data.error;

        const ctx = document.getElementById('eccChart').getContext('2d');

        // Prepare datasets
        // 1. All integer points on curve
        const scatterData = data.points.map(pt => ({ x: pt.x, y: pt.y }));

        // Destroy old chart if exists
        if (chart) chart.destroy();

        chart = new Chart(ctx, {
            type: 'scatter',
            data: {
                datasets: [{
                    label: 'Punti Curva Ellittica (F_p)',
                    data: scatterData,
                    backgroundColor: '#8b5cf6', // accent color
                    borderColor: '#8b5cf6',
                    pointRadius: 6,
                    pointHoverRadius: 8
                }, {
                    label: 'Generatore G',
                    data: [{ x: curveData.G.x, y: curveData.G.y }],
                    backgroundColor: '#ffffff',
                    borderColor: '#ffffff',
                    pointRadius: 8,
                    pointStyle: 'star',
                    pointHoverRadius: 10
                }]
            },
            options: {
                responsive: true,
                scales: {
                    x: {
                        type: 'linear',
                        position: 'bottom',
                        min: 0,
                        max: curveData.p,
                        grid: { color: '#334155' },
                        ticks: { color: '#94a3b8' }
                    },
                    y: {
                        min: 0,
                        max: curveData.p,
                        grid: { color: '#334155' },
                        ticks: { color: '#94a3b8' }
                    }
                },
                plugins: {
                    legend: { labels: { color: '#f8fafc' } }
                }
            }
        });

    } catch (e) { console.error(e); }
}

function updateGraphHighlights(aliceQ, bobQ, sharedS) {
    if (!chart) return;

    // reset datasets to base 2
    chart.data.datasets = chart.data.datasets.slice(0, 2);

    if (aliceQ) {
        chart.data.datasets.push({
            label: 'Pubblica Alice (Q_A)',
            data: [{ x: aliceQ.x, y: aliceQ.y }],
            backgroundColor: '#fca5a5',
            pointRadius: 8,
            pointStyle: 'rectRot'
        });
    }

    if (bobQ) {
        chart.data.datasets.push({
            label: 'Pubblica Bob (Q_B)',
            data: [{ x: bobQ.x, y: bobQ.y }],
            backgroundColor: '#93c5fd',
            pointRadius: 8,
            pointStyle: 'rectRot'
        });
    }

    if (sharedS) {
        chart.data.datasets.push({
            label: 'Segreto (S)',
            data: [{ x: sharedS.x, y: sharedS.y }],
            backgroundColor: '#fde047', // yellow
            borderColor: '#fde047',
            pointRadius: 10,
            pointStyle: 'circle'
        });
    }

    chart.update();
}

async function generateKeysAlice() {
    if (!globalCurve) { alert("Carica prima la curva."); return; }
    try {
        const response = await fetch('/ecc_generate_keys', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ p: globalCurve.p, a: globalCurve.a, G: globalCurve.G })
        });
        const data = await response.json();

        aliceKeys = data;
        document.getElementById('val-d-alice').textContent = data.private_d;
        document.getElementById('val-Q-alice').textContent = data.public_Q.str;
        document.getElementById('alice-keys').classList.remove('hidden');
        renderSteps(data.steps, 'alice-steps');

        updateGraphHighlights(aliceKeys.public_Q, bobKeys ? bobKeys.public_Q : null, null);

    } catch (e) { alert("Keygen Error: " + e); }
}

async function generateKeysBob() {
    if (!globalCurve) { alert("Carica prima la curva."); return; }
    try {
        const response = await fetch('/ecc_generate_keys', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ p: globalCurve.p, a: globalCurve.a, G: globalCurve.G })
        });
        const data = await response.json();

        bobKeys = data;
        document.getElementById('val-d-bob').textContent = data.private_d;
        document.getElementById('val-Q-bob').textContent = data.public_Q.str;
        document.getElementById('bob-keys').classList.remove('hidden');
        renderSteps(data.steps, 'bob-steps');

        updateGraphHighlights(aliceKeys ? aliceKeys.public_Q : null, bobKeys.public_Q, null);

    } catch (e) { alert("Keygen Error: " + e); }
}

async function calcSharedSecret() {
    if (!aliceKeys || !bobKeys) { alert("Alice e Bob devono generare le chiavi."); return; }

    try {
        // Alice calculates using Bob's Public Key
        const responseA = await fetch('/ecc_shared_secret', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                private_d: aliceKeys.private_d,
                public_Q: bobKeys.public_Q,
                p: globalCurve.p,
                a: globalCurve.a
            })
        });
        const dataA = await responseA.json();

        // Bob calculates using Alice's Public Key
        const responseB = await fetch('/ecc_shared_secret', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                private_d: bobKeys.private_d,
                public_Q: aliceKeys.public_Q,
                p: globalCurve.p,
                a: globalCurve.a
            })
        });
        const dataB = await responseB.json();

        document.getElementById('secret-alice-display').textContent = dataA.shared_S.str;
        document.getElementById('secret-bob-display').textContent = dataB.shared_S.str;

        renderSteps(dataA.steps, 'secret-steps'); // Show Alice's perspective steps

        const statusBox = document.getElementById('match-status');
        if (dataA.shared_S.x === dataB.shared_S.x && dataA.shared_S.y === dataB.shared_S.y) {
            statusBox.textContent = "SEGRETO CONDIVISO CORRISPONDE!";
            statusBox.className = 'status-box status-valid';
        } else {
            statusBox.textContent = "ERRORE: I segreti non corrispondono.";
            statusBox.className = 'status-box status-invalid';
        }

        document.getElementById('secret-results').classList.remove('hidden');

        updateGraphHighlights(aliceKeys.public_Q, bobKeys.public_Q, dataA.shared_S);

    } catch (e) { alert("Secret Error: " + e); }
}

function renderSteps(steps, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';

    steps.forEach(step => {
        const div = document.createElement('div');
        div.className = 'step-item';
        div.innerHTML = `<strong>${step.step}</strong><br>${step.description}`;
        container.appendChild(div);
    });
}

// --- Real Curve Visualization ---
let realChart = null;
const realA = -3;
const realB = 5;
const minX = -3.0; // Adjusted for visual layout
const maxX = 3.0;
const step = 0.05;

function f(x) { return x * x * x + realA * x + realB; }

async function initRealCurve() {
    const ctx = document.getElementById('realCurveChart').getContext('2d');

    // Generate smooth curve points
    const pointsUpper = [];
    const pointsLower = [];

    // Theoretical range for y^2 = x^3 -3x + 5
    // Roots of x^3 -3x + 5 = 0 are roughly -2.2
    for (let x = -2.3; x <= 3.5; x += 0.05) {
        const val = f(x);
        if (val >= 0) {
            const y = Math.sqrt(val);
            pointsUpper.push({ x: x, y: y });
            pointsLower.push({ x: x, y: -y });
        }
    }

    if (realChart) realChart.destroy();

    realChart = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [
                {
                    label: 'Curva (+y)',
                    data: pointsUpper,
                    showLine: true,
                    borderColor: '#22c55e',
                    backgroundColor: 'rgba(0,0,0,0)',
                    pointRadius: 0,
                    borderWidth: 2,
                    tension: 0.4
                },
                {
                    label: 'Curva (-y)',
                    data: pointsLower,
                    showLine: true,
                    borderColor: '#22c55e',
                    backgroundColor: 'rgba(0,0,0,0)',
                    pointRadius: 0,
                    borderWidth: 2,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom',
                    grid: { color: '#334155' },
                    ticks: { color: '#94a3b8' },
                    min: -4, max: 4
                },
                y: {
                    grid: { color: '#334155' },
                    ticks: { color: '#94a3b8' },
                    min: -4, max: 4
                }
            },
            plugins: {
                legend: { labels: { color: '#f8fafc' } }
            }
        }
    });
}

function resetRealCurve() {
    initRealCurve();
}

function drawLine(p1, p2, color = '#f59e0b', extend = true) {
    let data = [p1, p2];

    if (extend && p1.x !== p2.x) {
        const m = (p2.y - p1.y) / (p2.x - p1.x);
        const c = p1.y - m * p1.x;

        const xStart = -4;
        const yStart = m * xStart + c;
        const xEnd = 4;
        const yEnd = m * xEnd + c;

        data = [{ x: xStart, y: yStart }, { x: xEnd, y: yEnd }];
    }

    realChart.data.datasets.push({
        label: 'Linea',
        data: data,
        showLine: true,
        borderColor: color,
        borderWidth: 1,
        pointRadius: 0,
        borderDash: [5, 5]
    });
}

function drawPoint(p, label, color = '#f8fafc') {
    realChart.data.datasets.push({
        label: label,
        data: [p],
        backgroundColor: color,
        borderColor: color,
        pointRadius: 6,
        type: 'scatter'
    });
}

function visualizeAddition() {
    initRealCurve();

    // Pick P near x=-2
    let xP = -2.0;
    let yP = Math.sqrt(f(xP));
    let P = { x: xP, y: yP };

    // Pick Q near x=0.5
    let xQ = 0.5;
    let yQ = Math.sqrt(f(xQ));
    let Q = { x: xQ, y: yQ };

    drawPoint(P, 'P', '#fca5a5');
    drawPoint(Q, 'Q', '#93c5fd');

    const m = (Q.y - P.y) / (Q.x - P.x);
    const c = P.y - m * P.x;

    // Curve: x^3 -3x + 5. Line: mx+c
    // (mx+c)^2 = x^3 -3x + 5
    // x^3 - m^2x^2 + ...
    // Sum of roots x1+x2+x3 = m^2
    // x3 = m^2 - x1 - x2

    const xR_neg = m * m - P.x - Q.x;
    // Calculate y on line:
    const yR_neg = m * xR_neg + c;

    let R_neg = { x: xR_neg, y: yR_neg };
    drawPoint(R_neg, '-R', '#94a3b8');

    drawLine(P, Q, '#f59e0b', true);

    let R = { x: xR_neg, y: -yR_neg };
    drawPoint(R, 'R (Risultato)', '#fde047');

    realChart.data.datasets.push({
        label: 'Riflessione',
        data: [R_neg, R],
        showLine: true,
        borderColor: '#64748b',
        borderDash: [2, 2],
        pointRadius: 0
    });
    realChart.update();
}

function visualizeDoubling() {
    initRealCurve();

    // Pick P near x=-1
    let xP = -1.0;
    let yP = Math.sqrt(f(xP));
    let P = { x: xP, y: yP };

    drawPoint(P, 'P', '#fca5a5');

    // m = (3x^2 + a) / 2y
    const m = (3 * P.x * P.x + realA) / (2 * P.y);
    const c = P.y - m * P.x;

    const xR_neg = m * m - 2 * P.x;
    const yR_neg = m * xR_neg + c;

    let R_neg = { x: xR_neg, y: yR_neg };
    drawPoint(R_neg, '-R', '#94a3b8');

    // Draw Tangent (Line P to -R)
    drawLine(P, R_neg, '#f59e0b', true);

    let R = { x: xR_neg, y: -yR_neg };
    drawPoint(R, 'R (Risultato)', '#fde047');

    realChart.data.datasets.push({
        label: 'Riflessione',
        data: [R_neg, R],
        showLine: true,
        borderColor: '#64748b',
        borderDash: [2, 2],
        pointRadius: 0
    });
    realChart.update();
}

// Init on load
window.addEventListener('load', () => {
    if (document.getElementById('realCurveChart')) initRealCurve();
    if (document.getElementById('eccChart')) setupCurve(); // Ensure original chart also loads if configured
});

