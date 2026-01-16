async function updateView() {
    // Get Selected Values
    const protocol = document.querySelector('input[name="protocol"]:checked').value;
    const mode = document.querySelector('input[name="mode"]:checked').value;

    // Update Scenario Description
    updateScenarioText(protocol, mode);

    // Fetch Structure from Backend
    try {
        const response = await fetch('/ipsec_structure', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ protocol, mode })
        });
        const structure = await response.json();

        if (structure.error) { console.error(structure.error); return; }

        renderPacket(structure, protocol);

    } catch (e) { console.error(e); }
}

function updateScenarioText(protocol, mode) {
    const box = document.getElementById('scenario-desc');
    let text = "";

    // Mode Text
    if (mode === 'transport') {
        text += "<strong>Transport Mode (Host-to-Host):</strong> L'header IP originale è mantenuto. Protegge solo il payload. Usato per comunicazioni end-to-end fra due client.";
    } else {
        text += "<strong>Tunnel Mode (Gateway-to-Gateway):</strong> L'intero pacchetto originale è incapsulato. Viene aggiunto un Nuovo Header IP (es. IPs dei Firewall VPN). Nasconde chi sta parlando con chi.";
    }

    text += "<br><br>";

    // Protocol Text
    if (protocol === 'ah') {
        text += "<strong>AH (Authentication Header):</strong> Fornisce Integrità e Autenticazione. <span style='color:#ef4444'>Tutto il pacchetto è firmato</span>, ma i dati rimangono <strong>in chiaro</strong> (leggibili).";
    } else {
        text += "<strong>ESP (Encapsulating Security Payload):</strong> Fornisce Confidenzialità (Cifratura), Integrità e Autenticazione. <span style='color:#3b82f6'>I dati sono cifrati</span> (illeggibili).";
    }

    box.innerHTML = text;
}

function renderPacket(structure, protocol) {
    const container = document.getElementById('packet-transformed');
    container.innerHTML = '';

    let isEncryptedZone = false;

    structure.forEach(item => {
        // Handle Logic Markers
        if (item.type === 'marker-enc-start') { isEncryptedZone = true; return; }
        if (item.type === 'marker-enc-end') { isEncryptedZone = false; return; }

        const div = document.createElement('div');
        div.className = `block ${item.type}`;

        // Special styling for encrypted payload in ESP
        if (isEncryptedZone && (item.type === 'payload' || item.type === 'header-transport' || item.type === 'header-ip')) {
            div.classList.add('is-encrypted');
            div.innerHTML = `<span style="opacity:0.3">${item.label}</span>`;
        } else {
            div.innerHTML = `${item.label}`;
            if (item.desc) {
                div.innerHTML += `<div class="desc">${item.desc}</div>`;
            }
        }

        container.appendChild(div);
    });
}

// Init
window.addEventListener('load', updateView);

// --- Anti-Replay Sliding Window Logic ---

let windowStart = 6; // Window starts at 6 [6, 7, 8, 9]
const windowSize = 4;
let receivedPackets = new Set();
let animationRunning = false;
let isPaused = false;

// User Scenario:
// 1. Packet 5: Old (Left of 6) -> Reject
// 2. Packet 10: "Discard" (User requested rejection, maybe simulated drop or out of window policy)
// 3. Packet 7: Duplicate (Already in window) -> Reject
// 4. Packet 6: Valid -> Insert -> Then Shift Window by 2 (User logic: "Sposti la finestra di 2 posti")
const packetsSequence = [
    { seq: 5, type: 'old' },
    { seq: 10, type: 'force-reject' },
    { seq: 7, type: 'dup' },
    { seq: 6, type: 'new-shift-2' }
];

function initSlidingWindow() {
    const track = document.getElementById('shelf-track');
    track.innerHTML = '';
    receivedPackets.clear();

    for (let i = 0; i < 20; i++) {
        const seq = i + 1;
        const slot = document.createElement('div');
        slot.className = 'shelf-slot';
        slot.dataset.seq = seq;
        slot.id = `slot-${seq}`;
        track.appendChild(slot);

        // Pre-fill history: 1-5 received.
        if (seq <= 5) {
            receivedPackets.add(seq);
            slot.style.background = '#2e4c45';
            slot.style.color = '#aaa';
            slot.style.borderColor = '#4ec9b0';
            slot.innerText = "✔";
        }

        // Pre-fill 7 (Inside window)
        if (seq === 7) {
            receivedPackets.add(seq);
            slot.style.background = '#2e4c45';
            slot.style.color = '#aaa';
            slot.style.borderColor = '#4ec9b0';
            slot.innerText = "✔";
        }
    }

    windowStart = 6;
    updateWindowPosition();
}

function updateWindowPosition() {
    const win = document.getElementById('sliding-window');
    const slotWidth = 70;
    const startOffset = 50;
    const currentLeft = startOffset + (windowStart - 1) * slotWidth;

    win.style.left = `${currentLeft - 5}px`;
    win.style.width = `${(windowSize * slotWidth) - 10 + 10}px`;
}

// === Pause/Resume Logic ===
function togglePause() {
    isPaused = !isPaused;
    const btn = document.getElementById('btn-pause-sim');
    if (isPaused) {
        btn.innerHTML = '▶ Riprendi';
        btn.style.background = '#48bb78'; // Green for resume
    } else {
        btn.innerHTML = '⏸ Pausa';
        btn.style.background = '#e3b341'; // Yellow for pause
    }
}

async function wait(ms) {
    // Loop while paused
    while (isPaused) {
        await new Promise(r => setTimeout(r, 100));
    }
    // Then wait the actual time
    await new Promise(r => setTimeout(r, ms));
}

async function startSlidingWindowDemo() {
    if (animationRunning) return;
    animationRunning = true;
    isPaused = false; // Reset pause state

    // UI Update
    document.getElementById('btn-start-sim').disabled = true;
    const pauseBtn = document.getElementById('btn-pause-sim');
    pauseBtn.style.display = 'inline-block';
    pauseBtn.innerHTML = '⏸ Pausa';
    pauseBtn.style.background = '#e3b341';

    initSlidingWindow();

    const status = document.getElementById('replay-status');
    status.innerText = "Avvio sequenza pacchetti...";

    for (let pkt of packetsSequence) {
        await processPacket(pkt);
        await wait(1000);
    }

    status.innerText = "Simulazione Completata.";
    animationRunning = false;

    // Reset UI
    document.getElementById('btn-start-sim').disabled = false;
    pauseBtn.style.display = 'none';
}

async function processPacket(pkt) {
    const seq = pkt.seq;
    const status = document.getElementById('replay-status');
    const container = document.querySelector('.window-container');

    const box = document.createElement('div');
    box.className = 'packet-box';
    box.innerText = seq;
    container.appendChild(box);

    const slotWidth = 70;
    const startOffset = 50;
    const slotLeft = startOffset + (seq - 1) * slotWidth;

    box.style.left = `${slotLeft}px`;

    await wait(50);
    box.style.top = '5px';
    await wait(600);

    const windowEnd = windowStart + windowSize - 1;

    // Custom Demo Logic per user request
    if (pkt.type === 'force-reject') {
        status.innerText = `Pacchetto ${seq}: SCARTATO (Simulazione Drop / Policy)`;
        box.classList.add('rejected');
    } else if (seq < windowStart) {
        status.innerText = `Pacchetto ${seq}: SCARTATO (Troppo Vecchio)`;
        box.classList.add('rejected');
    } else if (receivedPackets.has(seq)) {
        status.innerText = `Pacchetto ${seq}: SCARTATO (Duplicato)`;
        box.classList.add('duplicate');
    } else {
        // Valid
        status.innerText = `Pacchetto ${seq}: ACCETTATO (Valido)`;
        box.classList.add('accepted');
        receivedPackets.add(seq);

        const slot = document.getElementById(`slot-${seq}`);
        if (slot) {
            slot.style.background = '#4ec9b0';
            slot.style.color = '#000';
            slot.style.borderColor = '#4ec9b0';
        }

        if (pkt.type === 'new-shift-2') {
            status.innerText += ` -> Completamento sequenza, Avanza di 2`;
            await wait(500);
            windowStart += 2;
            updateWindowPosition();
        } else if (seq > windowEnd) {
            // Standard behavior if not custom type
            const shiftAmount = seq - windowEnd;
            status.innerText += ` -> Finestra Scorrevole Avanza di ${shiftAmount}`;
            await wait(500);
            windowStart += shiftAmount;
            updateWindowPosition();
        }
    }

    await wait(1000);
    box.style.opacity = '0';
    setTimeout(() => box.remove(), 500); // UI cleanup doesn't need to wait for pause
}
