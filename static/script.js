// --- Animation Controller ---
class AnimationController {
    constructor() {
        this.status = 'idle'; // idle, playing, paused, stopped
        this.pausePromise = null;
        this.pauseResolve = null;
        this.currentControls = null;
    }

    reset() {
        this.status = 'idle';
        this.pausePromise = null;
        this.pauseResolve = null;
        if (this.currentControls) {
            this.currentControls.remove();
            this.currentControls = null;
        }
        document.body.classList.remove('animations-paused');
    }

    start(container, onStopCallback) {
        this.reset();
        this.status = 'playing';
        this.createControls(container, onStopCallback);
    }

    createControls(container, onStopCallback) {
        if (!container) return;

        const controlsDiv = document.createElement('div');
        controlsDiv.className = 'anim-controls';
        controlsDiv.style.display = 'inline-flex';
        controlsDiv.style.gap = '5px';
        controlsDiv.style.marginLeft = '10px';
        controlsDiv.style.alignItems = 'center';

        // Pause/Resume Button
        const pauseBtn = document.createElement('button');
        pauseBtn.textContent = '⏸';
        pauseBtn.className = 'control-btn';
        pauseBtn.title = 'Pausa';
        pauseBtn.onclick = () => this.togglePause(pauseBtn);

        // Stop Button
        const stopBtn = document.createElement('button');
        stopBtn.textContent = '⏹';
        stopBtn.className = 'control-btn stop-btn';
        stopBtn.title = 'Stop (Finisci)';
        stopBtn.onclick = () => {
            this.stop();
            if (onStopCallback) onStopCallback();
        };

        controlsDiv.appendChild(pauseBtn);
        controlsDiv.appendChild(stopBtn);

        // Append to container (usually header)
        // Check if existing controls exist
        const existing = container.querySelector('.anim-controls');
        if (existing) existing.remove();

        container.appendChild(controlsDiv);
        this.currentControls = controlsDiv;
    }

    togglePause(btn) {
        if (this.status === 'playing') {
            this.status = 'paused';
            btn.textContent = '▶';
            btn.title = 'Riprendi';
            document.body.classList.add('animations-paused');
            this.pausePromise = new Promise(res => this.pauseResolve = res);
        } else if (this.status === 'paused') {
            this.status = 'playing';
            btn.textContent = '⏸';
            btn.title = 'Pausa';
            document.body.classList.remove('animations-paused');
            if (this.pauseResolve) this.pauseResolve();
            this.pausePromise = null;
        }
    }

    stop() {
        this.status = 'stopped';
        document.body.classList.remove('animations-paused');
        // Force resume if paused so we can throw exception
        if (this.pauseResolve) this.pauseResolve();
        if (this.currentControls) this.currentControls.remove();

        // Cleanup global flyers
        document.querySelectorAll('.flying-byte, .flying-split, .equation-overlay').forEach(e => e.remove());
        const overlay = document.querySelector('.equation-overlay');
        if (overlay) overlay.style.display = 'none';

        // Throw exception to break loops
    }

    async wait(ms) {
        if (this.status === 'stopped') throw 'STOPPED';

        if (this.status === 'paused') {
            await this.pausePromise;
        }

        if (this.status === 'stopped') throw 'STOPPED';

        // Split wait into chunks to allow quicker reaction to Stop
        const chunk = 50;
        let remaining = ms;
        while (remaining > 0) {
            if (this.status === 'stopped') throw 'STOPPED';
            if (this.status === 'paused') await this.pausePromise;

            await new Promise(r => setTimeout(r, Math.min(chunk, remaining)));
            remaining -= chunk;
        }

        if (this.status === 'stopped') throw 'STOPPED';
        // Wait for animation frame to ensure UI updates
        await new Promise(r => requestAnimationFrame(r));
    }
}

const animCtrl = new AnimationController();

async function runEncryption() {
    const text = document.getElementById('plaintext').value;
    const key = document.getElementById('key').value;
    const resultsDiv = document.getElementById('results');
    const inputHex = document.getElementById('input-hex');
    const keyHex = document.getElementById('key-hex');

    if (!text || !key) {
        alert("Inserisci testo e chiave!");
        return;
    }

    try {
        const response = await fetch('/encrypt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, key })
        });

        const data = await response.json();

        if (data.error) {
            alert("Errore: " + data.error);
            return;
        }

        resultsDiv.classList.remove('hidden');
        inputHex.textContent = data.input_hex;
        keyHex.textContent = data.key_hex;

        renderSteps(data.blocks, data.input_hex);

        if (!document.getElementById('replay-intro-btn')) {
            const btn = document.createElement('button');
            btn.id = 'replay-intro-btn';
            btn.className = 'replay-btn';
            btn.textContent = '▶ Play';
            btn.style.marginLeft = '1rem';
            btn.style.fontSize = '1rem';
            const headerDiv = inputHex.parentElement.querySelector('h3');
            headerDiv.appendChild(btn);

            btn.addEventListener('click', () => {
                const headerDiv = inputHex.parentElement.querySelector('h3');
                animCtrl.start(headerDiv, () => {
                    // On Stop: just ensure intro is done? Intro doesn't change state permanently except showing bytes.
                    // Re-render to ensure clean state
                    // Actually flyBytes fills spans.
                    const matrices = document.querySelectorAll('#steps-container .matrix');
                    if (matrices.length > 0) {
                        flyBytes('input-hex', matrices[0], data.input_hex, 0); // Instant
                    }
                });
                animateIntro(data.input_hex, data.key_hex).catch(e => {
                    if (e !== 'STOPPED') console.error(e);
                }).finally(() => animCtrl.reset());
            });
        }

        setTimeout(() => {
            // Auto start intro? May collide with user. Let's not auto-start heavily.
            // Or use controller.
            // animCtrl.start(...);
            animateIntro(data.input_hex, data.key_hex).catch(() => { });
        }, 100);

    } catch (e) {
        alert("Errore di connessione: " + e);
        console.error(e);
    }
}

// --- S-BOX Data ---
const SBOX = [
    0x63, 0x7c, 0x77, 0x7b, 0xf2, 0x6b, 0x6f, 0xc5, 0x30, 0x01, 0x67, 0x2b, 0xfe, 0xd7, 0xab, 0x76,
    0xca, 0x82, 0xc9, 0x7d, 0xfa, 0x59, 0x47, 0xf0, 0xad, 0xd4, 0xa2, 0xaf, 0x9c, 0xa4, 0x72, 0xc0,
    0xb7, 0xfd, 0x93, 0x26, 0x36, 0x3f, 0xf7, 0xcc, 0x34, 0xa5, 0xe5, 0xf1, 0x71, 0xd8, 0x31, 0x15,
    0x04, 0xc7, 0x23, 0xc3, 0x18, 0x96, 0x05, 0x9a, 0x07, 0x12, 0x80, 0xe2, 0xeb, 0x27, 0xb2, 0x75,
    0x09, 0x83, 0x2c, 0x1a, 0x1b, 0x6e, 0x5a, 0xa0, 0x52, 0x3b, 0xd6, 0xb3, 0x29, 0xe3, 0x2f, 0x84,
    0x53, 0xd1, 0x00, 0xed, 0x20, 0xfc, 0xb1, 0x5b, 0x6a, 0xcb, 0xbe, 0x39, 0x4a, 0x4c, 0x58, 0xcf,
    0xd0, 0xef, 0xaa, 0xfb, 0x43, 0x4d, 0x33, 0x85, 0x45, 0xf9, 0x02, 0x7f, 0x50, 0x3c, 0x9f, 0xa8,
    0x51, 0xa3, 0x40, 0x8f, 0x92, 0x9d, 0x38, 0xf5, 0xbc, 0xb6, 0xda, 0x21, 0x10, 0xff, 0xf3, 0xd2,
    0xcd, 0x0c, 0x13, 0xec, 0x5f, 0x97, 0x44, 0x17, 0xc4, 0xa7, 0x7e, 0x3d, 0x64, 0x5d, 0x19, 0x73,
    0x60, 0x81, 0x4f, 0xdc, 0x22, 0x2a, 0x90, 0x88, 0x46, 0xee, 0xb8, 0x14, 0xde, 0x5e, 0x0b, 0xdb,
    0xe0, 0x32, 0x3a, 0x0a, 0x49, 0x06, 0x24, 0x5c, 0xc2, 0xd3, 0xac, 0x62, 0x91, 0x95, 0xe4, 0x79,
    0xe7, 0xc8, 0x37, 0x6d, 0x8d, 0xd5, 0x4e, 0xa9, 0x6c, 0x56, 0xf4, 0xea, 0x65, 0x7a, 0xae, 0x08,
    0xba, 0x78, 0x25, 0x2e, 0x1c, 0xa6, 0xb4, 0xc6, 0xe8, 0xdd, 0x74, 0x1f, 0x4b, 0xbd, 0x8b, 0x8a,
    0x70, 0x3e, 0xb5, 0x66, 0x48, 0x03, 0xf6, 0x0e, 0x61, 0x35, 0x57, 0xb9, 0x86, 0xc1, 0x1d, 0x9e,
    0xe1, 0xf8, 0x98, 0x11, 0x69, 0xd9, 0x8e, 0x94, 0x9b, 0x1e, 0x87, 0xe9, 0xce, 0x55, 0x28, 0xdf,
    0x8c, 0xa1, 0x89, 0x0d, 0xbf, 0xe6, 0x42, 0x68, 0x41, 0x99, 0x2d, 0x0f, 0xb0, 0x54, 0xbb, 0x16
];

// Returns HTML string for S-Box Table
function renderSBoxHtml() {
    let html = '<div class="sbox-table" style="display:none;">';
    html += '<div class="sbox-cell sbox-header"></div>';
    for (let i = 0; i < 16; i++) {
        const hHex = i.toString(16).toUpperCase();
        html += `<div class="sbox-cell sbox-header" data-col-header="${hHex}">${hHex}</div>`;
    }
    for (let r = 0; r < 16; r++) {
        const rHex = r.toString(16).toUpperCase();
        html += `<div class="sbox-cell sbox-header" data-row-header="${rHex}">${rHex}</div>`;
        for (let c = 0; c < 16; c++) {
            const val = SBOX[r * 16 + c].toString(16).toUpperCase().padStart(2, '0');
            const rHex = r.toString(16).toUpperCase();
            const cHex = c.toString(16).toUpperCase();
            html += `<div class="sbox-cell" data-row="${rHex}" data-col="${cHex}">${val}</div>`;
        }
    }
    html += '</div>';
    return html;
}

const MIX_MATRIX = [
    [2, 3, 1, 1],
    [1, 2, 3, 1],
    [1, 1, 2, 3],
    [3, 1, 1, 2]
];

function renderMixMatrixHtml() {
    let html = '<div class="mix-matrix">';
    for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
            html += `<div class="mix-cell" data-r="${r}" data-c="${c}">${MIX_MATRIX[r][c]}</div>`;
        }
    }
    html += '</div>';
    return html;
}

// Show Key Expansion Info Modal
function showKeyExpansionInfo() {
    let backdrop = document.querySelector('.info-modal-backdrop');
    if (backdrop) {
        backdrop.style.display = 'flex';
        return;
    }

    backdrop = document.createElement('div');
    backdrop.className = 'info-modal-backdrop';

    backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) backdrop.style.display = 'none';
    });

    const modal = document.createElement('div');
    modal.className = 'info-modal';

    modal.innerHTML = `
        <button class="info-modal-close">×</button>
        <h3>Generazione Round Key (Key Expansion)</h3>
        <div class="info-modal-content">
            <p><strong>PASSO 1: RotWord (Rotazione)</strong><br>
            Esempio: <code>09 CF 4F 3C</code> &rarr; <code>CF 4F 3C 09</code> (4ª colonna)</p>
            
            <p><strong>PASSO 2: SubWord (S-Box)</strong><br>
            Risultato Parziale: <code>8A 84 EB 01</code></p>
            
            <p><strong>PASSO 3: Rcon (Round Constant)</strong><br>
            Valori Rcon: <code>01 00 00 00</code> (Round 1), <code>02 00 00 00</code> (Round 2), <code>04 00 00 00</code>...<br>
            Esempio: <code>8A</code> &oplus; <code>01</code> = <code>8B</code> (gli altri byte restano invariati)</p>
            
            <p><strong>PASSO 4: XOR Finale (Creazione Nuova Colonna)</strong><br>
            (Vecchia Colonna w<sub>0</sub>) &oplus; (Colonna creata)</p>
            
            <p><strong>PASSI SUCCESSIVI XOR</strong><br>
            Vecchia Colonna &oplus; Colonna creata (la colonna creata è quella immediatamente a sinistra di quella che stai calcolando ora).</p>
        </div>
    `;

    modal.querySelector('.info-modal-close').addEventListener('click', () => {
        backdrop.style.display = 'none';
    });

    backdrop.appendChild(modal);
    document.body.appendChild(backdrop);
}

// Sequential SubBytes Animation
async function animateSequentialSubBytes(targetStateMatrix, srcStateMatrix) {
    if (!targetStateMatrix || !srcStateMatrix) return;

    // Check initial state
    await animCtrl.wait(0);

    const wrapper = targetStateMatrix.closest('.matrix-wrapper');
    const container = wrapper ? wrapper.parentElement : null;
    const sbox = container ? container.querySelector('.sbox-table') : null;

    if (!sbox) return;

    sbox.style.display = 'grid';

    const targetCells = targetStateMatrix.querySelectorAll('.cell');
    const srcCells = srcStateMatrix.querySelectorAll('.cell');

    targetCells.forEach(c => c.style.color = 'transparent');

    for (let i = 0; i < 16; i++) {
        await animCtrl.wait(0); // Check stop/pause

        const sCell = srcCells[i];
        const tCell = targetCells[i];

        sCell.classList.add('highlight-source');

        const hex = sCell.textContent.trim();
        if (hex.length < 2) continue;
        const rowHex = hex[0];
        const colHex = hex[1];

        const sRect = sCell.getBoundingClientRect();
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const scrollLeft = window.scrollX || document.documentElement.scrollLeft;

        const flyR = document.createElement('div');
        flyR.textContent = rowHex;
        flyR.className = 'flying-split';
        flyR.style.position = 'absolute';
        flyR.style.left = (sRect.left + scrollLeft) + 'px';
        flyR.style.top = (sRect.top + scrollTop) + 'px';
        flyR.style.color = 'var(--accent)';
        flyR.style.zIndex = 200;

        const flyC = document.createElement('div');
        flyC.textContent = colHex;
        flyC.className = 'flying-split';
        flyC.style.position = 'absolute';
        flyC.style.left = (sRect.left + sRect.width / 2 + scrollLeft) + 'px';
        flyC.style.top = (sRect.top + scrollTop) + 'px';
        flyC.style.color = 'var(--accent)';
        flyC.style.zIndex = 200;

        document.body.appendChild(flyR);
        document.body.appendChild(flyC);

        const rowHeader = sbox.querySelector(`[data-row-header="${rowHex}"]`);
        const colHeader = sbox.querySelector(`[data-col-header="${colHex}"]`);

        if (rowHeader && colHeader) {
            await new Promise(r => requestAnimationFrame(r));

            const rRect = rowHeader.getBoundingClientRect();
            const cRect = colHeader.getBoundingClientRect();

            flyR.style.transition = 'all 0.6s ease-out';
            flyC.style.transition = 'all 0.6s ease-out';

            flyR.style.left = (rRect.left + scrollLeft) + 'px';
            flyR.style.top = (rRect.top + scrollTop) + 'px';

            flyC.style.left = (cRect.left + scrollLeft) + 'px';
            flyC.style.top = (cRect.top + scrollTop) + 'px';

            await animCtrl.wait(600);

            rowHeader.classList.add('sbox-header-active');
            colHeader.classList.add('sbox-header-active');
            flyR.remove();
            flyC.remove();

            const rowCells = sbox.querySelectorAll(`[data-row="${rowHex}"]`);
            const colCells = sbox.querySelectorAll(`[data-col="${colHex}"]`);
            rowCells.forEach(c => c.classList.add('sbox-highlight-line'));
            colCells.forEach(c => c.classList.add('sbox-highlight-line'));

            await animCtrl.wait(300);

            const sboxCell = sbox.querySelector(`.sbox-cell[data-row="${rowHex}"][data-col="${colHex}"]`);
            if (sboxCell) {
                sboxCell.classList.add('sbox-active');

                await animCtrl.wait(500);

                const startRect = sboxCell.getBoundingClientRect();
                const targetRect = tCell.getBoundingClientRect();

                const flyer = document.createElement('div');
                flyer.className = 'flying-byte';
                flyer.textContent = sboxCell.textContent;
                flyer.style.backgroundColor = 'var(--accent)';
                flyer.style.left = (startRect.left + scrollLeft) + 'px';
                flyer.style.top = (startRect.top + scrollTop) + 'px';
                flyer.style.width = startRect.width + 'px';
                flyer.style.height = startRect.height + 'px';

                document.body.appendChild(flyer);

                await new Promise(r => requestAnimationFrame(r));
                flyer.style.transition = 'all 0.8s ease-in-out';
                flyer.style.left = (targetRect.left + scrollLeft) + 'px';
                flyer.style.top = (targetRect.top + scrollTop) + 'px';
                flyer.style.width = targetRect.width + 'px';
                flyer.style.height = targetRect.height + 'px';

                await animCtrl.wait(800);

                flyer.remove();
                tCell.textContent = sboxCell.textContent; // Ensure updated
                tCell.style.color = '';

                sboxCell.classList.remove('sbox-active');
            }

            rowHeader.classList.remove('sbox-header-active');
            colHeader.classList.remove('sbox-header-active');
            rowCells.forEach(c => c.classList.remove('sbox-highlight-line'));
            colCells.forEach(c => c.classList.remove('sbox-highlight-line'));
        }

        sCell.classList.remove('highlight-source');
    }
    sbox.style.display = 'none';
}

// Sequential ShiftRows Animation
async function animateSequentialShiftRows(targetStateMatrix, srcStateMatrix) {
    if (!targetStateMatrix || !srcStateMatrix) return;

    await animCtrl.wait(0);

    const tCells = targetStateMatrix.querySelectorAll('.cell');
    const sCells = srcStateMatrix.querySelectorAll('.cell');

    tCells.forEach(c => c.style.color = 'transparent');

    const cols = [0, 1, 2, 3];
    const shifts = [0, 1, 2, 3];

    for (const c of cols) {
        await animCtrl.wait(0);

        for (let r = 0; r < 4; r++) {
            sCells[r * 4 + c].classList.add('highlight-source');
        }

        await animCtrl.wait(300);

        const shift = shifts[c];
        const flyers = [];

        for (let r = 0; r < 4; r++) {
            const sCell = sCells[r * 4 + c];
            const sRect = sCell.getBoundingClientRect();
            const scrollTop = window.scrollY || document.documentElement.scrollTop;
            const scrollLeft = window.scrollX || document.documentElement.scrollLeft;

            const flyer = document.createElement('div');
            flyer.className = 'flying-byte';
            flyer.textContent = sCell.textContent;
            flyer.style.left = (sRect.left + scrollLeft) + 'px';
            flyer.style.top = (sRect.top + scrollTop) + 'px';
            flyer.style.width = sRect.width + 'px';
            flyer.style.height = sRect.height + 'px';
            flyer.style.backgroundColor = 'var(--accent)';
            document.body.appendChild(flyer);

            const r_new = (r - shift + 4) % 4;
            const tCell = tCells[r_new * 4 + c];

            flyers.push({ flyer, tCell });
        }

        await new Promise(res => requestAnimationFrame(res));

        flyers.forEach(obj => {
            const tRect = obj.tCell.getBoundingClientRect();
            const scrollTop = window.scrollY || document.documentElement.scrollTop;
            const scrollLeft = window.scrollX || document.documentElement.scrollLeft;

            obj.flyer.style.transition = 'all 1.0s ease-in-out';
            obj.flyer.style.left = (tRect.left + scrollLeft) + 'px';
            obj.flyer.style.top = (tRect.top + scrollTop) + 'px';
        });

        await animCtrl.wait(1000);

        flyers.forEach(obj => {
            obj.flyer.remove();
            obj.tCell.style.color = '';
            obj.tCell.classList.add('xor-flash');
        });

        for (let r = 0; r < 4; r++) {
            sCells[r * 4 + c].classList.remove('highlight-source');
        }

        await animCtrl.wait(300);
    }
}

// MIX COLUMNS ANIMATION
async function animateSequentialMixColumns(targetStateMatrix, srcStateMatrix) {
    if (!targetStateMatrix || !srcStateMatrix) return;

    await animCtrl.wait(0);

    const wrapper = targetStateMatrix.closest('.matrix-wrapper');
    const container = wrapper ? wrapper.parentElement : null;
    const mixMatrix = container ? container.querySelector('.mix-matrix') : null;

    if (!mixMatrix) return;

    let overlay = document.querySelector('.equation-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'equation-overlay';
        document.body.appendChild(overlay);
    }

    const tCells = targetStateMatrix.querySelectorAll('.cell');
    const sCells = srcStateMatrix.querySelectorAll('.cell');

    tCells.forEach(c => c.style.color = 'transparent');

    for (let c = 0; c < 4; c++) {
        await animCtrl.wait(0);

        const colCells = [];
        for (let r = 0; r < 4; r++) {
            const cell = sCells[r * 4 + c];
            cell.classList.add('highlight-source');
            colCells.push(cell.textContent);
        }

        for (let r = 0; r < 4; r++) {
            await animCtrl.wait(0); // Check stop within inner loop

            const targetCell = tCells[r * 4 + c];

            const matrixCells = [];
            for (let k = 0; k < 4; k++) {
                const mc = mixMatrix.querySelector(`[data-r="${r}"][data-c="${k}"]`);
                if (mc) {
                    mc.classList.add('highlight-mix-row');
                    matrixCells.push(mc.textContent);
                }
            }

            let eqHtml = `<div>NuovoByte<sub>${r}</sub> = </div>`;
            for (let k = 0; k < 4; k++) {
                eqHtml += `<div class="equation-part" style="animation-delay: ${k * 0.1}s">(${matrixCells[k]} &sdot; ${colCells[k]})</div>`;
                if (k < 3) eqHtml += `<div class="equation-part xor-symbol" style="animation-delay: ${k * 0.1}s">&oplus;</div>`;
            }

            overlay.innerHTML = eqHtml;
            overlay.style.display = 'block';

            await animCtrl.wait(2000); // Read EQ

            const startRect = overlay.getBoundingClientRect();
            const targetRect = targetCell.getBoundingClientRect();
            const scrollTop = window.scrollY || document.documentElement.scrollTop;
            const scrollLeft = window.scrollX || document.documentElement.scrollLeft;

            const flyer = document.createElement('div');
            flyer.className = 'flying-byte';
            flyer.textContent = targetCell.textContent;
            flyer.style.backgroundColor = 'var(--accent)';
            flyer.style.left = (startRect.left + startRect.width / 2 + scrollLeft) + 'px';
            flyer.style.top = (startRect.top + startRect.height / 2 + scrollTop) + 'px';
            flyer.style.width = '4rem';
            flyer.style.height = '2rem';
            flyer.style.zIndex = 2000;
            document.body.appendChild(flyer);

            await new Promise(res => requestAnimationFrame(res));

            flyer.style.transition = 'all 1.0s ease-in-out';
            flyer.style.left = (targetRect.left + scrollLeft) + 'px';
            flyer.style.top = (targetRect.top + scrollTop) + 'px';
            flyer.style.width = targetRect.width + 'px';
            flyer.style.height = targetRect.height + 'px';

            await animCtrl.wait(1000);

            flyer.remove();
            targetCell.style.color = '';
            targetCell.classList.add('xor-flash');

            for (let k = 0; k < 4; k++) {
                const mc = mixMatrix.querySelector(`[data-r="${r}"][data-c="${k}"]`);
                if (mc) mc.classList.remove('highlight-mix-row');
            }

            overlay.style.display = 'none';
            await animCtrl.wait(200);
        }

        for (let r = 0; r < 4; r++) {
            sCells[r * 4 + c].classList.remove('highlight-source');
        }
        await animCtrl.wait(300);
    }
    if (overlay) overlay.style.display = 'none';
}

async function animateIntro(inputHexString, keyHexString) {
    // Intro handling
    const block1 = document.querySelector('#steps-container .round-block');
    if (!block1) return;

    const matrices = block1.querySelectorAll('.matrix');
    if (matrices.length < 2) {
        if (matrices.length > 0) {
            await flyBytes('input-hex', matrices[0], inputHexString);
        }
    } else {
        await Promise.all([
            flyBytes('input-hex', matrices[0], inputHexString),
            flyBytes('key-hex', matrices[1], keyHexString)
        ]);
    }
}

// Generalized function for flying bytes
async function flyBytes(sourceId, targetMatrix, hexString, durationOverride) {
    const sourceEl = document.getElementById(sourceId);
    if (!sourceEl || !targetMatrix) return;

    // Reset source
    sourceEl.innerHTML = '';
    const bytes = [];
    if (typeof hexString !== 'string') hexString = "";

    for (let i = 0; i < hexString.length; i += 2) {
        bytes.push(hexString.substr(i, 2));
    }

    bytes.forEach(b => {
        const span = document.createElement('span');
        span.textContent = b;
        span.className = 'input-byte-span';
        span.style.display = 'inline-block';
        span.style.padding = '2px';
        sourceEl.appendChild(span);
    });

    // If override = 0, just fill target and return (Instant)
    if (durationOverride === 0) {
        const cells = targetMatrix.querySelectorAll('.cell');
        cells.forEach((c, i) => {
            if (i < bytes.length) {
                c.textContent = bytes[i];
                c.style.color = '';
            }
        });
        return;
    }

    const cells = targetMatrix.querySelectorAll('.cell');
    const spans = sourceEl.querySelectorAll('span');
    const flyers = [];

    for (let i = 0; i < Math.min(bytes.length, 16); i++) {
        // await animCtrl.wait(10); // Check stop? 
        // Note: Intro is usually auto-run and hard to stop mid-flow. 
        // But let's try to support it if user clicked Play.

        const sourceSpan = spans[i];
        if (!sourceSpan) continue;
        const sourceRect = sourceSpan.getBoundingClientRect();

        const row = i % 4;
        const col = Math.floor(i / 4);
        const cellIndex = row * 4 + col;

        const targetCell = cells[cellIndex];
        if (!targetCell) continue;

        targetCell.style.color = 'transparent';

        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const scrollLeft = window.scrollX || document.documentElement.scrollLeft;

        const flyer = document.createElement('div');
        flyer.className = 'flying-byte';
        flyer.textContent = bytes[i];
        flyer.style.left = (sourceRect.left + scrollLeft) + 'px';
        flyer.style.top = (sourceRect.top + scrollTop) + 'px';
        flyer.style.width = sourceRect.width + 'px';
        flyer.style.height = sourceRect.height + 'px';

        document.body.appendChild(flyer);
        flyers.push({ flyer, targetCell });
        await new Promise(r => setTimeout(r, 10)); // Intro is fast sync

        const targetRect = targetCell.getBoundingClientRect();
        flyer.style.left = (targetRect.left + scrollLeft) + 'px';
        flyer.style.top = (targetRect.top + scrollTop) + 'px';
        flyer.style.width = targetRect.width + 'px';
        flyer.style.height = targetRect.height + 'px';
    }

    await new Promise(r => setTimeout(r, 2500));

    flyers.forEach(item => {
        item.targetCell.style.color = '';
        item.flyer.remove();
    });
}

// Sequential XOR Animation
async function animateSequentialXor(targetStateMatrix, srcStateMatrix, srcKeyMatrix) {
    if (!targetStateMatrix || !srcStateMatrix || !srcKeyMatrix) return;

    await animCtrl.wait(0);

    const targetCells = targetStateMatrix.querySelectorAll('.cell');
    const srcStateCells = srcStateMatrix.querySelectorAll('.cell');
    const srcKeyCells = srcKeyMatrix.querySelectorAll('.cell');

    const finalValues = [];
    targetCells.forEach(c => {
        finalValues.push(c.textContent);
        c.style.color = 'transparent';
    });

    for (let i = 0; i < 16; i++) {
        await animCtrl.wait(0);

        const sCell = srcStateCells[i];
        const kCell = srcKeyCells[i];
        const tCell = targetCells[i];

        if (!sCell || !kCell || !tCell) continue;

        sCell.classList.add('highlight-source');
        kCell.classList.add('highlight-source');

        const sRect = sCell.getBoundingClientRect();
        const kRect = kCell.getBoundingClientRect();
        const tRect = tCell.getBoundingClientRect();

        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const scrollLeft = window.scrollX || document.documentElement.scrollLeft;

        const flyerS = document.createElement('div');
        flyerS.className = 'flying-byte';
        flyerS.textContent = sCell.textContent;
        flyerS.style.left = (sRect.left + scrollLeft) + 'px';
        flyerS.style.top = (sRect.top + scrollTop) + 'px';
        flyerS.style.width = sRect.width + 'px';
        flyerS.style.height = sRect.height + 'px';
        flyerS.style.backgroundColor = 'var(--accent)';

        const flyerK = document.createElement('div');
        flyerK.className = 'flying-byte';
        flyerK.textContent = kCell.textContent;
        flyerK.style.left = (kRect.left + scrollLeft) + 'px';
        flyerK.style.top = (kRect.top + scrollTop) + 'px';
        flyerK.style.width = kRect.width + 'px';
        flyerK.style.height = kRect.height + 'px';
        flyerK.style.backgroundColor = '#ec4899';

        document.body.appendChild(flyerS);
        document.body.appendChild(flyerK);

        await new Promise(r => setTimeout(r, 200));
        await new Promise(r => requestAnimationFrame(r));

        const duration = 1.5;
        flyerS.style.transition = `all ${duration}s ease-in-out`;
        flyerK.style.transition = `all ${duration}s ease-in-out`;

        flyerS.style.left = (tRect.left + scrollLeft) + 'px';
        flyerS.style.top = (tRect.top + scrollTop) + 'px';

        flyerK.style.left = (tRect.left + scrollLeft) + 'px';
        flyerK.style.top = (tRect.top + scrollTop) + 'px';

        await animCtrl.wait(duration * 1000);

        flyerS.remove();
        flyerK.remove();
        sCell.classList.remove('highlight-source');
        kCell.classList.remove('highlight-source');

        tCell.textContent = finalValues[i];
        tCell.style.color = '';
        tCell.classList.add('xor-flash');
        setTimeout(() => tCell.classList.remove('xor-flash'), 300);

        await animCtrl.wait(100);
    }
}

function renderSteps(blocks, inputHex) {
    const container = document.getElementById('steps-container');
    container.innerHTML = '';

    blocks.forEach((blockSteps, blockIndex) => {
        const rounds = {};
        blockSteps.forEach(step => {
            if (!rounds[step.round]) rounds[step.round] = [];
            rounds[step.round].push(step);
        });

        const blockDiv = document.createElement('div');
        blockDiv.innerHTML = `<h2>Blocco ${blockIndex + 1}</h2>`;
        container.appendChild(blockDiv);

        const roundNumbers = Object.keys(rounds).sort((a, b) => a - b).map(Number);
        const initialRounds = roundNumbers.filter(r => r <= 1);
        initialRounds.forEach(r => renderRound(container, r, rounds[r], inputHex));

        const maxRound = Math.max(...roundNumbers);
        const middleRounds = roundNumbers.filter(r => r > 1 && r < maxRound);

        if (middleRounds.length > 0) {
            const repeatDiv = document.createElement('div');
            repeatDiv.className = 'repeat-block';
            repeatDiv.innerHTML = `
                <h3>... Ripeti per ${middleRounds.length} round (Round ${middleRounds[0]} - ${middleRounds[middleRounds.length - 1]}) ...</h3>
                <p>In questi round vengono ripetute le operazioni: SubBytes, ShiftRows, MixColumns, AddRoundKey.</p>
            `;
            container.appendChild(repeatDiv);
        }

        if (maxRound > 1) {
            renderRound(container, maxRound, rounds[maxRound], inputHex);
        }
    });
}

function findPreviousStateMatrix(currentStepDiv) {
    let prev = currentStepDiv.previousElementSibling;
    if (prev && prev.classList.contains('step')) {
        const ms = prev.querySelectorAll('.matrix');
        if (ms.length > 0) return ms[0];
    }
    const currentRound = currentStepDiv.closest('.round-block');
    if (!currentRound) return null;
    let prevRound = currentRound.previousElementSibling;
    while (prevRound && !prevRound.classList.contains('round-block')) {
        prevRound = prevRound.previousElementSibling;
    }
    if (prevRound) {
        const steps = prevRound.querySelectorAll('.step');
        if (steps.length > 0) {
            const lastStep = steps[steps.length - 1];
            const ms = lastStep.querySelectorAll('.matrix');
            if (ms.length > 0) return ms[0];
        }
    }
    return null;
}

function renderRound(container, roundNum, roundSteps, inputHex) {
    const roundDiv = document.createElement('div');
    roundDiv.className = 'round-block';
    roundDiv.innerHTML = `<div class="round-title">Round ${roundNum}</div>`;

    roundSteps.forEach(step => {
        const stepDiv = document.createElement('div');
        const animClass = `anim-${step.step}`;
        stepDiv.className = `step ${animClass}`;

        const btnId = `replay-btn-${roundNum}-${step.step}`;

        let matricesHtml = `
            <div class="matrix-wrapper">
                <div class="matrix-label">State</div>
                ${renderMatrix(step.state)}
            </div>
        `;

        if (step.key && !(step.step === 'add_round_key' && roundNum === 0)) {
            const infoIconHtml = `<span class="info-icon" title="Spiegazione Key Expansion" onclick="showKeyExpansionInfo()">i</span>`;

            matricesHtml += `
                <div class="matrix-wrapper">
                    <div class="matrix-label">Round Key ${infoIconHtml}</div>
                    ${renderMatrix(step.key)}
                </div>
            `;
        }

        if (step.step === 'sub_bytes') {
            matricesHtml += renderSBoxHtml();
        }

        if (step.step === 'mix_columns') {
            matricesHtml += renderMixMatrixHtml();
        }

        const showReplay = step.step !== 'init';
        const buttonHtml = showReplay ? `<button id="${btnId}" class="replay-btn" title="Avvia animazione">▶ Play</button>` : '';

        stepDiv.innerHTML = `
            <div class="step-header">
                <div class="step-header-content">
                    <span class="step-name">${step.description || step.step.replace(/_/g, ' ')}</span>
                    ${buttonHtml}
                </div>
            </div>
            <div class="matrices-container">
                ${matricesHtml}
            </div>
        `;
        roundDiv.appendChild(stepDiv);

        if (showReplay) {
            const btn = stepDiv.querySelector(`#${btnId}`);
            if (btn) {
                btn.addEventListener('click', () => {
                    // Start Animation Controller
                    const headerContent = stepDiv.querySelector('.step-header-content');

                    // Callback for STOP: Ensure target matrix is fully visible
                    const onStop = () => {
                        const targetMatrices = stepDiv.querySelectorAll('.matrix');
                        const targetState = targetMatrices[0];
                        if (targetState) {
                            targetState.querySelectorAll('.cell').forEach(c => c.style.color = '');
                        }
                    };

                    animCtrl.start(headerContent, onStop);

                    // Run Animation
                    const run = async () => {
                        const targetMatrices = stepDiv.querySelectorAll('.matrix');
                        const targetState = targetMatrices[0];
                        const srcState = findPreviousStateMatrix(stepDiv);

                        if (!targetState || !srcState) {
                            stepDiv.classList.remove(animClass);
                            void stepDiv.offsetWidth;
                            stepDiv.classList.add(animClass);
                            return;
                        }

                        // Hide play button during run (controls are added by animCtrl)
                        btn.style.display = 'none';

                        if (step.step === 'add_round_key') {
                            let srcKey = null;
                            const prevStepDiv = stepDiv.previousElementSibling;
                            if (prevStepDiv && prevStepDiv.classList.contains('step') && prevStepDiv.classList.contains('anim-init')) {
                                const prevMs = prevStepDiv.querySelectorAll('.matrix');
                                if (prevMs.length > 1) srcKey = prevMs[1];
                            }
                            if (!srcKey && targetMatrices.length > 1) srcKey = targetMatrices[1];

                            if (srcKey) {
                                await animateSequentialXor(targetState, srcState, srcKey);
                            }
                        } else if (step.step === 'sub_bytes') {
                            await animateSequentialSubBytes(targetState, srcState);
                        } else if (step.step === 'shift_rows') {
                            await animateSequentialShiftRows(targetState, srcState);
                        } else if (step.step === 'mix_columns') {
                            await animateSequentialMixColumns(targetState, srcState);
                        } else {
                            stepDiv.classList.remove(animClass);
                            void stepDiv.offsetWidth;
                            stepDiv.classList.add(animClass);
                        }
                    };

                    run()
                        .catch(e => {
                            if (e === 'STOPPED') {
                                console.log("Animation Stopped by user");
                            } else {
                                console.error(e);
                            }
                        })
                        .finally(() => {
                            animCtrl.reset();
                            btn.style.display = 'inline-block'; // Show play again
                            onStop(); // Ensure clean state
                        });
                });
            }
        }
    });
    container.appendChild(roundDiv);
}

function renderMatrix(matrix) {
    let html = '<div class="matrix">';
    for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
            const val = matrix[r][c];
            const hex = val.toString(16).toUpperCase().padStart(2, '0');
            html += `<div class="cell">${hex}</div>`;
        }
    }
    html += '</div>';
    return html;
}
