async function getSystemEntropy() {
    try {
        const response = await fetch('/trng_system', { method: 'POST' });
        const data = await response.json();

        if (data.error) { alert("Errore: " + data.error); return; }

        const bytesHex = data.hex.match(/.{1,2}/g).join(' '); // Format xx xx xx
        document.getElementById('system-bytes').textContent = bytesHex;
        document.getElementById('system-source').textContent = "Sorgente: " + data.source;
        document.getElementById('system-result').classList.remove('hidden');

    } catch (e) { console.error(e); alert("Errore di connessione"); }
}

// --- Entropy Collection ---

const REQUIRED_EVENTS = 100; // Require 100 mouse events to fill pool
let capturedEvents = [];
let isCollecting = true;

const canvas = document.getElementById('noiseCanvas');
const ctx = canvas.getContext('2d');
let width, height;

function resizeCanvas() {
    width = canvas.parentElement.clientWidth;
    height = canvas.parentElement.clientHeight;
    canvas.width = width;
    canvas.height = height;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Handle Mouse Move
canvas.addEventListener('mousemove', (e) => {
    if (!isCollecting || capturedEvents.length >= REQUIRED_EVENTS) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const t = Date.now();

    // Add to pool
    capturedEvents.push({ x, y, t });

    // Draw "Noise"
    ctx.fillStyle = `hsl(${Math.random() * 360}, 100%, 50%)`;
    ctx.beginPath();
    ctx.arc(x, y, 2, 0, Math.PI * 2);
    ctx.fill();

    // Draw extra random properties to simulate chaos
    if (Math.random() > 0.5) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x + (Math.random() * 10 - 5), y + (Math.random() * 10 - 5), 1, 1);
    }

    updateProgress();
});

function updateProgress() {
    const percent = Math.min(100, Math.floor((capturedEvents.length / REQUIRED_EVENTS) * 100));
    document.getElementById('entropy-progress').style.width = percent + '%';
    document.getElementById('entropy-percent').textContent = percent + '% Entropia';

    if (percent >= 100) {
        document.querySelector('.instruction').textContent = "Piscina di entropia piena! Premi il pulsante sotto.";
        document.querySelector('.instruction').style.color = '#4ade80';
        document.querySelector('.instruction').style.fontWeight = 'bold';
        document.getElementById('mix-btn').disabled = false;
        isCollecting = false;
    }
}

async function mixEntropy() {
    if (capturedEvents.length < REQUIRED_EVENTS) return;

    try {
        const response = await fetch('/trng_mix', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mouse_data: capturedEvents })
        });
        const data = await response.json();

        if (data.error) { alert("Errore: " + data.error); return; }

        document.getElementById('user-hash').textContent = data.entropy_pool_hash;
        document.getElementById('event-count').textContent = data.event_count;
        document.getElementById('raw-sample').textContent = data.raw_data_sample;
        document.getElementById('user-result').classList.remove('hidden');

        // Reset pool partially visualization?
        // Let's allow user to restart by reloading, simple for now.
        document.getElementById('mix-btn').textContent = "Chiave Generata";
        document.getElementById('mix-btn').disabled = true;

    } catch (e) { console.error(e); alert("Errore di connessione"); }
}
