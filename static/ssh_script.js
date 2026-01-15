// TOFU Terminal Logic
let hasConnected = false;
const termTarget = document.getElementById('term-content');

function typeWriter(text, element, speed = 30) {
    let i = 0;
    return new Promise(resolve => {
        function type() {
            if (i < text.length) {
                element.innerHTML += text.charAt(i);
                i++;
                setTimeout(type, speed);
            } else {
                resolve();
            }
        }
        type();
    });
}

async function startTofu(choice) {
    const outputDiv = document.getElementById('term-output');
    outputDiv.innerHTML = ''; // Clear previous

    if (!hasConnected) {
        // First time scenario
        const cmdLine = document.createElement('div');
        cmdLine.innerHTML = '<span style="color:#2ea043">user@local:~$</span> ssh admin@server.com';
        outputDiv.appendChild(cmdLine);

        await new Promise(r => setTimeout(r, 500));

        const msg = document.createElement('div');
        msg.className = 'term-output';
        outputDiv.appendChild(msg);

        const text = `The authenticity of host 'server.com (192.168.1.50)' can't be established.\nECDSA key fingerprint is SHA256:ROizW1.../u8j+a.\nAre you sure you want to continue connecting (yes/no/[fingerprint])? `;
        await typeWriter(text, msg, 20);

        // Wait for user interaction via buttons
        if (choice === 'yes') {
            msg.innerHTML += ' <span style="color:#c9d1d9">yes</span>';
            await new Promise(r => setTimeout(r, 400));
            const response = document.createElement('div');
            response.className = 'term-output';
            response.innerHTML = `Warning: Permanently added 'server.com' (ECDSA) to the list of known hosts.\nadmin@server.com's password: `;
            outputDiv.appendChild(response);
            hasConnected = true;
            document.getElementById('status-msg').innerText = "Host aggiunto a known_hosts! Ora ci fidiamo.";
            document.getElementById('status-msg').style.color = "#2ea043";
        } else if (choice === 'no') {
            msg.innerHTML += ' <span style="color:#c9d1d9">no</span>';
            await new Promise(r => setTimeout(r, 400));
            const response = document.createElement('div');
            response.className = 'term-output';
            response.innerHTML = `Host key verification failed.\nBasic logic: If you don't trust, you don't connect.`;
            outputDiv.appendChild(response);
        }
    } else {
        // Subsequent connection scenario (Trusted)
        const cmdLine = document.createElement('div');
        cmdLine.innerHTML = '<span style="color:#2ea043">user@local:~$</span> ssh admin@server.com';
        outputDiv.appendChild(cmdLine);

        await new Promise(r => setTimeout(r, 500));

        const response = document.createElement('div');
        response.className = 'term-output';
        response.style.color = '#c9d1d9';
        // Simulate immediate prompt
        response.innerHTML = `admin@server.com's password: `;
        outputDiv.appendChild(response);

        document.getElementById('status-msg').innerText = "Nessun avviso! Conosciamo già questo server.";
        document.getElementById('status-msg').style.color = "#58a6ff";
    }
}

function resetTofu() {
    hasConnected = false;
    document.getElementById('term-output').innerHTML = '';
    document.getElementById('status-msg').innerText = "Stato: Mai connesso";
    document.getElementById('status-msg').style.color = "#8b949e";
}


// Tunnel Animation
function runTunnel() {
    const packet = document.getElementById('packet');
    const startPos = 10;
    const endPos = 90;

    // Reset
    packet.style.left = startPos + '%';
    packet.style.transition = 'none';

    setTimeout(() => {
        packet.style.transition = 'left 2s linear';
        packet.style.left = endPos + '%';
    }, 100);
}
