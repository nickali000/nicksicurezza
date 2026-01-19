let currentAnimationInterval = null;
let activeTimeouts = [];

function runScenario(type) {
    const packet = document.getElementById('packet');
    const log = document.getElementById('scenario-log');

    // Reset positions and states
    resetSimulation();

    if (type === 'no-hmac') {
        startNoHMAC(packet, log);
    } else {
        startHMAC(packet, log);
    }
}

function resetSimulation() {
    // 1. Clear any running animation interval
    if (currentAnimationInterval) {
        clearInterval(currentAnimationInterval);
        currentAnimationInterval = null;
    }

    // 2. Clear any pending timeouts from previous runs
    activeTimeouts.forEach(id => clearTimeout(id));
    activeTimeouts = [];

    const actors = ['alice', 'mallory', 'bob'];
    actors.forEach(a => {
        const el = document.getElementById(`${a}-status`);
        if (el) {
            el.innerText = "In attesa...";
            el.style.borderColor = "#555";
            el.style.color = "#fff";
        }
    });

    const packet = document.getElementById('packet');
    if (packet) {
        packet.classList.add('hidden');
        packet.classList.remove('tampered', 'valid');
        packet.style.left = '100px'; // Alice pos
        packet.style.top = '120px'; // Approx center vertically
    }
}

// Helper to track timeouts so we can clear them on reset
function scheduleTask(callback, delay) {
    const id = setTimeout(callback, delay);
    activeTimeouts.push(id);
    return id;
}

function startNoHMAC(packet, log) {
    log.innerText = "Scenario 1: Senza HMAC. Nessuna chiave segreta.";

    // 1. Alice sends
    updateStatus('alice', 'Invio "Ciao" + Hash("Ciao")');
    packet.classList.remove('hidden');

    movePacket(packet, 10, 50, () => {
        // 2. Mallory intercepts
        updateStatus('mallory', 'Intercettato "Ciao"');
        log.innerText = "Mallory intercetta il pacchetto...";

        scheduleTask(() => {
            // 3. Mallory modifies
            updateStatus('mallory', 'Modifico in "Soldi"', '#ef4444');
            packet.classList.add('tampered'); // Red packet
            log.innerText = "Mallory cambia il messaggio e ricalcola l'Hash (facile senza chiave!).";

            scheduleTask(() => {
                // 4. Mallory forwards
                movePacket(packet, 50, 90, () => {
                    // 5. Bob receives
                    updateStatus('bob', 'Ricevo "Soldi" + Hash("Soldi")');

                    scheduleTask(() => {
                        // 6. Bob checks
                        updateStatus('bob', 'Hash Calcolato == Hash Ricevuto. OK!', '#ef4444');
                        log.innerHTML = "<span style='color: #ef4444; font-weight: bold;'>ATTACCO RIUSCITO! Bob ha accettato il messaggio falso.</span>";
                    }, 1000);
                });
            }, 1500);
        }, 1000);
    });
}

function startHMAC(packet, log) {
    log.innerText = "Scenario 2: Con HMAC. C'è una Chiave Segreta condivisa (K).";

    // 1. Alice sends
    updateStatus('alice', 'Invio "Ciao" + HMAC(K, "Ciao")');
    packet.classList.remove('hidden');
    packet.classList.add('valid'); // Green packet initially

    movePacket(packet, 10, 50, () => {
        // 2. Mallory intercepts
        updateStatus('mallory', 'Intercettato "Ciao"');
        log.innerText = "Mallory intercetta il pacchetto...";

        scheduleTask(() => {
            // 3. Mallory modifies
            updateStatus('mallory', 'Modifico in "Soldi"', '#ef4444');
            packet.classList.add('tampered');
            log.innerText = "Mallory cambia il messaggio MA non ha la chiave K per ricalcolare l'HMAC.";

            scheduleTask(() => {
                // 4. Mallory forwards (with FAKE HMAC)
                updateStatus('mallory', 'Invio con HMAC Falso');

                movePacket(packet, 50, 90, () => {
                    // 5. Bob receives
                    updateStatus('bob', 'Ricevo "Soldi" + HMAC Falso');

                    scheduleTask(() => {
                        // 6. Bob checks
                        updateStatus('bob', 'HMAC(K, "Soldi") != HMAC Falso. RIFIUTATO!', '#4ec9b0');
                        log.innerHTML = "<span style='color: #4ec9b0; font-weight: bold;'>ATTACCO FALLITO! Bob si accorge della manomissione.</span>";
                    }, 1000);
                });
            }, 1500);
        }, 1000);
    });
}

function movePacket(el, startPercent, endPercent, callback) {
    let current = startPercent;
    el.style.left = startPercent + '%';

    // Clear any existing interval (double safety, though resetSimulation calls it too)
    if (currentAnimationInterval) clearInterval(currentAnimationInterval);

    currentAnimationInterval = setInterval(() => {
        current += 1;
        el.style.left = current + '%';
        if (current >= endPercent) {
            clearInterval(currentAnimationInterval);
            currentAnimationInterval = null;
            if (callback) callback();
        }
    }, 20); // Speed
}

function updateStatus(actor, text, color = null) {
    const el = document.getElementById(`${actor}-status`);
    if (el) {
        el.innerText = text;
        if (color) {
            el.style.borderColor = color;
            el.style.color = color;
        }
    }
}

