// --- Animation Controller (Shared Logic) ---
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

        const pauseBtn = document.createElement('button');
        pauseBtn.textContent = '⏸';
        pauseBtn.className = 'control-btn';
        pauseBtn.onclick = () => this.togglePause(pauseBtn);

        const stopBtn = document.createElement('button');
        stopBtn.textContent = '⏹';
        stopBtn.className = 'control-btn stop-btn';
        stopBtn.onclick = () => {
            this.stop();
            if (onStopCallback) onStopCallback();
        };

        controlsDiv.appendChild(pauseBtn);
        controlsDiv.appendChild(stopBtn);

        const existing = container.querySelector('.anim-controls');
        if (existing) existing.remove();

        container.appendChild(controlsDiv);
        this.currentControls = controlsDiv;
    }

    togglePause(btn) {
        if (this.status === 'playing') {
            this.status = 'paused';
            btn.textContent = '▶';
            document.body.classList.add('animations-paused');
            this.pausePromise = new Promise(res => this.pauseResolve = res);
        } else if (this.status === 'paused') {
            this.status = 'playing';
            btn.textContent = '⏸';
            document.body.classList.remove('animations-paused');
            if (this.pauseResolve) this.pauseResolve();
            this.pausePromise = null;
        }
    }

    stop() {
        this.status = 'stopped';
        document.body.classList.remove('animations-paused');
        if (this.pauseResolve) this.pauseResolve();
        if (this.currentControls) this.currentControls.remove();
        document.querySelectorAll('.flying-byte').forEach(e => e.remove());
    }

    async wait(ms) {
        if (this.status === 'stopped') throw 'STOPPED';
        if (this.status === 'paused') await this.pausePromise;
        if (this.status === 'stopped') throw 'STOPPED';

        const chunk = 50;
        let remaining = ms;
        while (remaining > 0) {
            if (this.status === 'stopped') throw 'STOPPED';
            if (this.status === 'paused') await this.pausePromise;
            await new Promise(r => setTimeout(r, Math.min(chunk, remaining)));
            remaining -= chunk;
        }
    }
}

const animCtrl = new AnimationController();

// --- Logic ---

// Helper: Convert Text to Hex (handling ASCII/Latin1)
function strToHex(str) {
    let hex = '';
    for (let i = 0; i < str.length; i++) {
        const code = str.charCodeAt(i) & 0xFF; // Take low byte
        hex += code.toString(16).padStart(2, '0');
    }
    return hex.toUpperCase();
}

// Helper: Process Input (Auto-detect Hex/Text, Pad/Truncate to 16 chars = 64 bits)
function processInput(raw) {
    if (!raw) return '0000000000000000';

    let val = raw.trim();
    const hexRegex = /^[0-9A-Fa-f]+$/;

    // If it contains non-hex characters, treat as Text
    if (!hexRegex.test(val)) {
        val = strToHex(val);
    }

    // Check length (Target: 16 Hex Chars = 64 Bits)
    if (val.length < 16) {
        // Pad with '0' on the right (like zero-padding a buffer)
        val = val.padEnd(16, '0');
    } else if (val.length > 16) {
        // Truncate
        val = val.substring(0, 16);
    }

    return val.toUpperCase();
}

async function runDesEncryption() {
    const rawText = document.getElementById('plaintext').value;
    const rawKey = document.getElementById('key').value;

    const text = processInput(rawText);
    const key = processInput(rawKey);
    const container = document.getElementById('steps-container');
    const results = document.getElementById('results');

    try {
        const response = await fetch('/encrypt_des', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, key })
        });
        const data = await response.json();

        if (data.error) throw data.error;

        document.getElementById('input-hex').textContent = data.input_hex;
        document.getElementById('key-hex').textContent = data.key_hex;
        results.classList.remove('hidden');

        renderDesSteps(container, data.steps);

        // --- Add Intro Replay Button ---
        if (!document.getElementById('replay-intro-btn')) {
            const btn = document.createElement('button');
            btn.id = 'replay-intro-btn';
            btn.className = 'replay-btn';
            btn.textContent = '▶ Play';
            btn.style.marginLeft = '1rem';
            btn.style.fontSize = '1rem';
            const headerDiv = document.getElementById('input-hex').parentElement.querySelector('h3');
            headerDiv.appendChild(btn);

            btn.addEventListener('click', () => {
                const headerDiv = document.getElementById('input-hex').parentElement.querySelector('h3');
                animCtrl.start(headerDiv, () => {
                    // Stop cleanup
                    const matrices = getIntroMatrices();
                    if (matrices.targetInput && matrices.targetKey) {
                        flyBytes('input-hex', matrices.targetInput, data.input_hex, 0);
                        flyBytes('key-hex', matrices.targetKey, data.key_hex, 0);
                    }
                });
                animateIntro(data.input_hex, data.key_hex).catch(e => {
                    if (e !== 'STOPPED') console.error(e);
                }).finally(() => animCtrl.reset());
            });
        }

        // Auto-run intro
        setTimeout(() => {
            animateIntro(data.input_hex, data.key_hex).catch(() => { });
        }, 100);

    } catch (e) {
        alert(e);
    }
}

function getIntroMatrices() {
    const block = document.querySelector('#steps-container .round-block');
    // First round block is Initialization
    if (!block) return { targetInput: null, targetKey: null };

    // In renderInitBlock, we create 2 matrices.
    // The first is Input Block, second is Master Key.
    const matrices = block.querySelectorAll('.matrix-8, .matrix-4'); // It uses Matrix-8 usually?
    if (matrices.length >= 2) {
        return { targetInput: matrices[0], targetKey: matrices[1] };
    }
    return { targetInput: null, targetKey: null };
}

async function animateIntro(inputHex, keyHex) {
    const { targetInput, targetKey } = getIntroMatrices();
    if (!targetInput || !targetKey) return;

    await Promise.all([
        flyBytes('input-hex', targetInput, inputHex),
        flyBytes('key-hex', targetKey, keyHex)
    ]);
}

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

    // Assuming simple mapping 1-to-1:
    // Input Matrix (8 bytes) -> first 8 bytes of input (Wait, input is 8 bytes for DES!)
    // Hex string is 16 chars -> 8 Bytes.
    // So mapping is direct.

    for (let i = 0; i < Math.min(bytes.length, cells.length); i++) {
        // await animCtrl.wait(10); // Check stop? 

        const sourceSpan = spans[i];
        if (!sourceSpan) continue;
        const sourceRect = sourceSpan.getBoundingClientRect();

        const targetCell = cells[i];
        if (!targetCell) continue;

        targetCell.style.color = 'transparent';

        const flyer = createFlyer(bytes[i], sourceRect);

        flyers.push({ flyer, targetCell });
        await new Promise(r => setTimeout(r, 20)); // Stagger

        const targetRect = targetCell.getBoundingClientRect();

        await new Promise(r => requestAnimationFrame(r)); // Ensure flyer rendered

        flyer.style.transition = 'all 2.0s cubic-bezier(0.25, 1, 0.5, 1)';
        flyer.style.left = (targetRect.left + window.scrollX) + 'px';
        flyer.style.top = (targetRect.top + window.scrollY) + 'px';
        flyer.style.width = targetRect.width + 'px';
        flyer.style.height = targetRect.height + 'px';
    }

    await new Promise(r => setTimeout(r, 2000));

    flyers.forEach(item => {
        item.targetCell.style.color = '';
        item.flyer.remove();
    });
}


function renderDesSteps(container, steps) {
    container.innerHTML = '';

    // Init Step
    if (steps.length > 0 && steps[0].step === 'init') {
        renderInitBlock(container, steps[0]);
    }

    // IP Step
    const ipStep = steps.find(s => s.step === 'ip');
    if (ipStep) {
        renderIpBlock(container, ipStep);
    }

    // Rounds
    const rounds = steps.filter(s => s.step === 'round');
    // Limit to Round 1 only for now
    const limitedRounds = rounds.slice(0, 1);
    limitedRounds.forEach(r => renderFeistelRound(container, r));

    // FP (Skip for now as we focus on Round 1)
    // const fpStep = steps.find(s => s.step === 'fp');
    // if (fpStep) renderFpBlock(container, fpStep);
}

function renderInitBlock(container, step) {
    const div = document.createElement('div');
    div.className = 'round-block';
    div.innerHTML = `<div class="round-title">Initialization</div>`;

    const content = document.createElement('div');
    content.className = 'step';
    content.innerHTML = `
        <div class="step-header">
             <span class="step-name">Input & Key</span>
        </div>
        <div class="matrices-container">
             ${renderMatrix(step.input_hex, 'Input Block')}
             ${renderMatrix(step.key_hex, 'Master Key')}
        </div>
    `;
    div.appendChild(content);
    container.appendChild(div);
}

function renderIpBlock(container, step) {
    const div = document.createElement('div');
    div.className = 'round-block';
    div.innerHTML = `<div class="round-title">Initial Permutation</div>`;

    const content = document.createElement('div');
    content.className = 'step';
    content.id = 'ip-block-step';

    content.innerHTML = `
        <div class="step-header">
             <span class="step-name">IP Swap</span>
             <div class="step-header-content">
                  <button id="play-ip-btn" class="replay-btn">▶ Play</button>
             </div>
        </div>
        <div class="matrices-container">
             ${renderMatrix(step.state_hex, 'Permuted State')}
             <div style="width: 20px;"></div>
             ${renderMatrix(step.l_hex, 'L0 (Left)', 'matrix-4')}
             ${renderMatrix(step.r_hex, 'R0 (Right)', 'matrix-4')}
        </div>
        ${renderBitExpansion(step.r_hex)}
    `;
    div.appendChild(content);
    container.appendChild(div);

    // Bind IP Animation
    setTimeout(() => {
        const btn = document.getElementById('play-ip-btn');
        if (btn) {
            btn.addEventListener('click', () => {
                const header = btn.closest('.step-header').querySelector('.step-header-content');
                animCtrl.start(header, () => {
                    // Stop callback
                    const ipBlock = document.getElementById('ip-block-step');
                    ipBlock.querySelectorAll('.cell').forEach(c => c.style.color = '');
                });

                animateIpBlock(step).then(() => {
                    animCtrl.reset();
                    btn.style.display = 'inline-block';
                }).catch(e => { if (e !== 'STOPPED') console.error(e); });

                btn.style.display = 'none';
            });
        }
    }, 0);
}

async function animateIpBlock(step) {
    // 1. Find Source (Input Block from Init)
    const { targetInput } = getIntroMatrices();
    if (!targetInput) return;

    // 2. Find Target (Permuted State)
    const ipBlock = document.getElementById('ip-block-step');
    const permutedMatrix = ipBlock.querySelector('.matrix-8'); // First one
    const l0Matrix = ipBlock.querySelectorAll('.matrix-4')[0];
    const r0Matrix = ipBlock.querySelectorAll('.matrix-4')[1];

    if (!permutedMatrix) return;

    // 1. Fly from Input -> Permuted
    // This is "IP" - bit permutation.
    // Visually: Fly bytes from Input to Permuted. On arrival, they change value?

    const sourceCells = targetInput.querySelectorAll('.cell');
    const targetCells = permutedMatrix.querySelectorAll('.cell');

    targetCells.forEach(c => c.style.color = 'transparent');
    l0Matrix.querySelectorAll('.cell').forEach(c => c.style.color = 'transparent');
    r0Matrix.querySelectorAll('.cell').forEach(c => c.style.color = 'transparent');

    for (let i = 0; i < Math.min(sourceCells.length, targetCells.length); i++) {
        await animCtrl.wait(0);

        const start = sourceCells[i].getBoundingClientRect();
        const end = targetCells[i].getBoundingClientRect();

        const flyer = createFlyer(sourceCells[i].textContent, start);

        await new Promise(r => requestAnimationFrame(r));
        flyer.style.left = end.left + window.scrollX + 'px';
        flyer.style.top = end.top + window.scrollY + 'px';

        await animCtrl.wait(400); // 400ms flight

        flyer.remove();
        targetCells[i].style.color = '';

        // Show that it changed? maybe a quick flash
        targetCells[i].classList.add('xor-flash');
        await animCtrl.wait(100);
    }

    await animCtrl.wait(500);

    // 2. Fly from Permuted -> L0 & R0
    // L0 is first 4 bytes, R0 is next 4 bytes.

    const l0Cells = l0Matrix.querySelectorAll('.cell');
    const r0Cells = r0Matrix.querySelectorAll('.cell');

    const allSplits = [...l0Cells, ...r0Cells];

    for (let i = 0; i < 8; i++) {
        await animCtrl.wait(0);
        const start = targetCells[i].getBoundingClientRect();
        const end = allSplits[i] ? allSplits[i].getBoundingClientRect() : null;

        if (end) {
            const flyer = createFlyer(targetCells[i].textContent, start);
            await new Promise(r => requestAnimationFrame(r));
            flyer.style.left = end.left + window.scrollX + 'px';
            flyer.style.top = end.top + window.scrollY + 'px';

            await animCtrl.wait(300);
            flyer.remove();
            allSplits[i].style.color = '';
        }
    }
}


function renderBitExpansion(hexStr) {
    if (!hexStr) return '';

    let html = `<div class="bit-expansion">`;
    // Loop every 2 chars (1 byte)
    for (let i = 0; i < hexStr.length; i += 2) {
        const byteHex = hexStr.substr(i, 2);
        // hex to bin (8 bits)
        const byteVal = parseInt(byteHex, 16);
        const byteBin = byteVal.toString(2).padStart(8, '0');

        // Split into nibbles
        const nibble1 = byteBin.substr(0, 4);
        const nibble2 = byteBin.substr(4, 4);

        html += `
            <div class="byte-row">
                <span class="byte-hex">${byteHex}</span>
                <span class="byte-arrow">→</span>
                <span class="byte-bits">
                    <span>${nibble1}</span><span>${nibble2}</span>
                </span>
            </div>
        `;
    }
    html += `</div>`;
    return html;
}


function renderMatrix(hexStr, label, cls = 'matrix-8') {
    // 8 bytes horizontal ?
    const bytes = [];
    for (let i = 0; i < hexStr.length; i += 2) bytes.push(hexStr.substr(i, 2));

    // adjust class based on length. 
    // If length is 8 (4 bytes), use matrix-4.
    let gridClass = cls;
    if (bytes.length === 4) gridClass = 'matrix-4';

    let html = `
    <div class="matrix-wrapper">
        <div class="matrix-label">${label}</div>
        <div class="${gridClass}">
    `;
    bytes.forEach(b => {
        html += `<div class="cell">${b}</div>`;
    });
    html += `</div></div>`;
    return html;
}


function renderFeistelRound(container, step) {
    const r = step.details;
    const div = document.createElement('div');
    div.className = 'round-block';
    div.innerHTML = `<div class="round-title">Round ${step.round_num} - Expansion</div>`;

    const content = document.createElement('div');
    content.className = 'step';
    content.id = `round-${step.round_num}-expansion`;

    content.innerHTML = `
        <div class="step-header">
             <span class="step-name">Expansion (32 bits → 48 bits)</span>
             <div class="step-header-content">
                  <button id="play-expansion-btn-${step.round_num}" class="replay-btn">▶ Play</button>
             </div>
        </div>
        <div class="expansion-container">
             <div class="expansion-row">
                 <span class="label">R(prev) [32 bits]</span>
                 ${renderMatrix(r.r_prev, '', 'matrix-4')}
                 ${renderR0Bits(r.r_prev)}
             </div>
             
             <div class="expansion-arrow">⬇ Expansion Permutation (E) ⬇</div>

             <div class="expansion-row">
                 <span class="label">Expanded [48 bits = 8 x 6 bits]</span>
                 ${renderExpansionBits(r.expansion)}
             </div>
        </div>

        <div class="step-header" style="margin-top: 2rem; border-top: 1px solid var(--border); padding-top: 1rem;">
             <span class="step-name">Key Schedule (56 bits → 48 bits)</span>
             <div class="step-header-content">
                  <button id="play-key-btn-${step.round_num}" class="replay-btn">▶ Play Key Schedule</button>
             </div>
        </div>
        <div id="key-schedule-${step.round_num}" class="key-schedule-container">
            ${renderKeyScheduleHTML(r.key_schedule)}
        </div>

        <div class="step-header" style="margin-top: 2rem; border-top: 1px solid var(--border); padding-top: 1rem;">
             <span class="step-name">XOR (Expansion ⊕ Key)</span>
             <div class="step-header-content">
                  <button id="play-xor-btn-${step.round_num}" class="replay-btn">▶ Play XOR</button>
             </div>
        </div>
        <div id="xor-section-${step.round_num}" class="xor-container">
            ${renderXorSectionHTML(step, r.expansion, r.key_round, r.xor_key)}
        </div>

        <div class="step-header" style="margin-top: 2rem; border-top: 1px solid var(--border); padding-top: 1rem;">
             <span class="step-name">Substitution (S-Boxes)</span>
             <div class="step-header-content">
                  <button id="play-sbox-btn-${step.round_num}" class="replay-btn">▶ Play S-Box</button>
             </div>
        </div>
        <div id="sbox-section-${step.round_num}" class="sbox-container">
            ${renderSBoxSectionHTML(step, r.sbox_in, r.sbox_out)}
        </div>

        <div class="step-header" style="margin-top: 2rem; border-top: 1px solid var(--border); padding-top: 1rem;">
             <span class="step-name">Permutation (P)</span>
             <div class="step-header-content">
                  <button id="play-pperm-btn-${step.round_num}" class="replay-btn">▶ Play Permutation</button>
             </div>
        </div>
        <div id="pperm-section-${step.round_num}" class="pperm-container">
            ${renderPPermutationHTML(step, r.sbox_out, r.p_perm)}
        </div>

        <div class="step-header" style="margin-top: 2rem; border-top: 1px solid var(--border); padding-top: 1rem;">
             <span class="step-name">Final XOR (L_prev ⊕ P_Perm)</span>
             <div class="step-header-content">
                  <button id="play-fxor-btn-${step.round_num}" class="replay-btn">▶ Play Final XOR</button>
             </div>
        </div>
        <div id="fxor-section-${step.round_num}" class="xor-container" style="flex-direction: column; align-items: center;">
            ${renderFinalXorSectionHTML(step, r.l_prev, r.p_perm, r.r_new)}
        </div>
    `;

    div.appendChild(content);
    container.appendChild(div);

    // Bind Animation
    setTimeout(() => {
        // ... (Existing Bindings) ...

        // S-Box Animation Binding
        const btnSbox = document.getElementById(`play-sbox-btn-${step.round_num}`);
        if (btnSbox) {
            btnSbox.addEventListener('click', () => {
                const header = btnSbox.closest('.step-header').querySelector('.step-header-content');
                animCtrl.start(header, () => {
                    // Cleanup
                    const container = document.getElementById(`sbox-section-${step.round_num}`);
                    if (container) {
                        const targets = container.querySelectorAll('.sbox-output-bit');
                        targets.forEach(t => t.style.color = '');
                    }
                });

                animateSBoxSection(step).then(() => {
                    animCtrl.reset();
                    btnSbox.style.display = 'inline-block';
                }).catch(e => { if (e !== 'STOPPED') console.error(e); });

                btnSbox.style.display = 'none';
            });
        }

        // P-Permutation Animation Binding
        const btnPerm = document.getElementById(`play-pperm-btn-${step.round_num}`);
        if (btnPerm) {
            btnPerm.addEventListener('click', () => {
                const header = btnPerm.closest('.step-header').querySelector('.step-header-content');
                animCtrl.start(header, () => {
                    // Cleanup
                    const container = document.getElementById(`pperm-section-${step.round_num}`);
                    if (container) {
                        const targets = container.querySelectorAll('.pperm-bit-out');
                        targets.forEach(t => t.style.color = '');
                    }
                });

                animatePPermutation(step).then(() => {
                    animCtrl.reset();
                    btnPerm.style.display = 'inline-block';
                }).catch(e => { if (e !== 'STOPPED') console.error(e); });

                btnPerm.style.display = 'none';
            });
        }

        // Final XOR Animation Binding
        const btnFxor = document.getElementById(`play-fxor-btn-${step.round_num}`);
        if (btnFxor) {
            btnFxor.addEventListener('click', () => {
                const header = btnFxor.closest('.step-header').querySelector('.step-header-content');
                animCtrl.start(header, () => {
                    // Cleanup
                    const container = document.getElementById(`fxor-section-${step.round_num}`);
                    if (container) {
                        const targets = container.querySelectorAll('.fxor-target');
                        targets.forEach(t => t.style.color = '');
                    }
                });

                animateFinalXor(step).then(() => {
                    animCtrl.reset();
                    btnFxor.style.display = 'inline-block';
                }).catch(e => { if (e !== 'STOPPED') console.error(e); });

                btnFxor.style.display = 'none';
            });
        }

    }, 0);
}

function renderExpansionBits(hexStr) {
    if (!hexStr) return '';
    let binStr = "";
    for (let i = 0; i < hexStr.length; i++) {
        binStr += parseInt(hexStr[i], 16).toString(2).padStart(4, '0');
    }

    let html = `<div class="sbox-input-group">`;
    for (let i = 0; i < 8; i++) {
        const chunk = binStr.substr(i * 6, 6);
        html += `<div class="bit-group-6">
                    <span class="group-label">B${i + 1}</span>
                    <span class="bits">`;

        for (let j = 0; j < 6; j++) {
            let globalIdx = i * 6 + j;
            html += `<span id="exp-target-${globalIdx}" class="expanded-bit">${chunk[j]}</span>`;
        }

        html += `</span>
                 </div>`;
    }
    html += `</div>`;
    return html;
}



function htmlForBytes(hex) {
    let html = '';
    for (let i = 0; i < hex.length; i += 2) {
        html += `<div class="cell">${hex.substr(i, 2)}</div>`;
    }
    return html;
}

function renderFpBlock(container, step) {
    const div = document.createElement('div');
    div.className = 'round-block';
    div.innerHTML = `<div class="round-title">Final Permutation</div>`;

    div.innerHTML += `
        <div class="step">
            <div class="step-header"><span class="step-name">Output</span></div>
            <div class="matrices-container">
                 ${renderMatrix(step.ciphertext_hex, 'Ciphertext')}
            </div>
        </div>
    `;
    container.appendChild(div);
}

// Feistel Animation
async function animateFeistelRound(roundNum, data) {
    const container = document.getElementById(`container-r${roundNum}`);
    if (!container) return;

    await animCtrl.wait(200);

    const lPrev = container.querySelectorAll('.matrix-4')[0];
    const rPrev = container.querySelectorAll('.matrix-4')[1];
    const key = container.querySelector('.matrix-8');

    const lNew = container.querySelectorAll('.matrix-4')[2]; // L_new is index 2 (matrix-4 #3)
    const rNew = container.querySelectorAll('.matrix-4')[3]; // R_new is index 3 

    // 1. Animate R(prev) -> L(new) (Simple copy)
    const rCells = rPrev.querySelectorAll('.cell');
    const lNewCells = lNew.querySelectorAll('.cell');

    lNewCells.forEach(c => c.style.color = 'transparent');

    for (let i = 0; i < 4; i++) {
        await animCtrl.wait(0);

        const start = rCells[i].getBoundingClientRect();
        const end = lNewCells[i].getBoundingClientRect();

        const flyer = createFlyer(rCells[i].textContent, start);

        await new Promise(r => requestAnimationFrame(r));
        flyer.style.left = end.left + window.scrollX + 'px';
        flyer.style.top = end.top + window.scrollY + 'px';

        await animCtrl.wait(600);
        flyer.remove();
        lNewCells[i].style.color = '';
    }

    // 2. Animate f(R,K) + L(prev) -> R(new)
    // Simplification: Flash R(prev) and Key, then fly "Energy" to R(new), then XOR logic

    await animCtrl.wait(500);

    rPrev.classList.add('highlight-source'); // Defined in main CSS, hope we have it or need to add it?
    // Actually des_style.css doesn't have highlight-source, let's just use inline or standard
    rPrev.style.boxShadow = '0 0 10px var(--accent)';
    key.style.boxShadow = '0 0 10px var(--highlight)';

    await animCtrl.wait(800);

    rPrev.style.boxShadow = '';
    key.style.boxShadow = '';

    // Now fly generic bytes from L(prev) to R(new) to represent the base value being XORed
    const lPrevCells = lPrev.querySelectorAll('.cell');
    const rNewCells = rNew.querySelectorAll('.cell');

    rNewCells.forEach(c => c.style.color = 'transparent');

    for (let i = 0; i < 4; i++) {
        await animCtrl.wait(0);

        const start = lPrevCells[i].getBoundingClientRect();
        const end = rNewCells[i].getBoundingClientRect();

        const flyer = createFlyer(lPrevCells[i].textContent, start);
        // Color distinction?
        flyer.style.backgroundColor = 'var(--text-secondary)';

        await new Promise(r => requestAnimationFrame(r));
        flyer.style.left = end.left + window.scrollX + 'px';
        flyer.style.top = end.top + window.scrollY + 'px';

        await animCtrl.wait(500);
        flyer.remove();

        // Simulation of XOR arrival from function
        const fFlyer = createFlyer("f", start); // Just dummy start pos? 
        // Maybe start from R_Prev center?
        const rRect = rPrev.getBoundingClientRect();
        fFlyer.style.left = rRect.left + rRect.width / 2 + window.scrollX + 'px';
        fFlyer.style.top = rRect.top + rRect.height / 2 + window.scrollY + 'px';
        fFlyer.style.backgroundColor = 'var(--highlight)';
        fFlyer.style.width = '20px';
        fFlyer.style.height = '20px';
        fFlyer.textContent = '⊕';

        await new Promise(r => requestAnimationFrame(r));
        fFlyer.style.left = end.left + window.scrollX + 'px';
        fFlyer.style.top = end.top + window.scrollY + 'px';

        await animCtrl.wait(500);
        fFlyer.remove();

        rNewCells[i].style.color = '';
        rNewCells[i].classList.add('xor-flash');

        await animCtrl.wait(100);
    }
}

function createFlyer(text, rect) {
    const flyer = document.createElement('div');
    flyer.className = 'flying-byte';
    flyer.textContent = text;
    flyer.style.left = rect.left + window.scrollX + 'px';
    flyer.style.top = rect.top + window.scrollY + 'px';
    flyer.style.width = rect.width + 'px';
    flyer.style.height = rect.height + 'px';
    document.body.appendChild(flyer);
    // Force reflow
    void flyer.offsetWidth;
    return flyer;
}

// ... (Existing S-Box Logic) ...

// P-Permutation Animation Logic
function renderPPermutationHTML(step, sboxOutHex, pPermHex) {
    if (!sboxOutHex || !pPermHex) return '<div class="error">Missing P-Perm Data</div>';

    // 32 bits In -> Shuffle -> 32 bits Out
    const inBin = parseIntStr(sboxOutHex, 32);
    const outBin = parseIntStr(pPermHex, 32);

    return `
        <div class="pperm-section">
            <div class="pperm-row">
                <div class="label">P-Perm Input (S-Box Out)</div>
                ${renderBits1D(inBin, 'pperm-in', 'pperm-bit-in')}
            </div>
            
            <div class="pperm-arrow">⬇ P-Permutation (Shuffle) ⬇</div>
            
            <div class="pperm-row">
                <div class="label">P-Perm Output</div>
                ${renderBits1D(outBin, 'pperm-out', 'pperm-bit-out', true)}
            </div>
        </div>
    `;
}

async function animatePPermutation(step) {
    // P-Table (1-based index)
    const P = [
        16, 7, 20, 21,
        29, 12, 28, 17,
        1, 15, 23, 26,
        5, 18, 31, 10,
        2, 8, 24, 14,
        32, 27, 3, 9,
        19, 13, 30, 6,
        22, 11, 4, 25
    ];

    const inBits = document.querySelectorAll('.pperm-bit-in');
    const outBits = document.querySelectorAll('.pperm-bit-out');

    // Clear targets
    outBits.forEach(b => {
        b.innerText = b.dataset.val;
        b.style.color = 'transparent';
    });

    const animations = [];

    for (let k = 0; k < 32; k++) {
        // Output at index k comes from Input at index P[k]-1
        const sourceIdx = P[k] - 1;
        const targetIdx = k;

        const s = inBits[sourceIdx];
        const t = outBits[targetIdx];

        if (s && t) {
            const start = s.getBoundingClientRect();
            const end = t.getBoundingClientRect();

            const flyer = createFlyer(s.textContent, start);
            flyer.style.backgroundColor = 'var(--text-secondary)';

            // Stagger
            await animCtrl.wait(20);

            const flight = async () => {
                await new Promise(r => requestAnimationFrame(r));
                flyer.style.transition = 'all 1.0s ease-in-out';
                flyer.style.left = end.left + window.scrollX + 'px';
                flyer.style.top = end.top + window.scrollY + 'px';

                await animCtrl.wait(1000);
                flyer.remove();
                t.style.color = '';
                t.style.backgroundColor = 'var(--highlight)'; // Highlight result
                setTimeout(() => t.style.backgroundColor = '', 500);
            };
            animations.push(flight());
        }
    }

    await Promise.all(animations);
    await animCtrl.wait(500);
}

// Final XOR Animation Logic (L_prev ^ P_Perm -> R_new)
function renderFinalXorSectionHTML(step, lPrevHex, pPermHex, rNewHex) {
    if (!lPrevHex || !pPermHex || !rNewHex) return '<div class="error">Missing Final XOR Data</div>';

    // 32 bits each
    const lPrevBin = parseIntStr(lPrevHex, 32);
    const pPermBin = parseIntStr(pPermHex, 32);
    const rNewBin = parseIntStr(rNewHex, 32);

    return `
        <div class="xor-layout">
            <div class="xor-column">
                <div class="label">L(prev) [32 bits]</div>
                ${renderBits1D(lPrevBin, 'fxor-lprev', 'fxor-src-l')}
            </div>
            <div class="xor-symbol-column">
                <div class="xor-op-symbol">⊕</div>
            </div>
            <div class="xor-column">
                <div class="label">P-Perm Output [32 bits]</div>
                ${renderBits1D(pPermBin, 'fxor-pperm', 'fxor-src-p')}
            </div>
            <div class="xor-arrow-column">
                <div class="xor-result-arrow">➡</div>
            </div>
            <div class="xor-column">
                <div class="label">R(new) [32 bits]</div>
                ${renderBits1D(rNewBin, 'fxor-res', 'fxor-target', true)}
            </div>
        </div>
        
        <div class="round-note">
            <div class="note-icon">ℹ</div>
            <div class="note-text">
                <strong>Standard DES:</strong> Questo processo del round di Feistel si ripete per <strong>16 round</strong> utilizzando diverse sottochiavi per garantire la sicurezza. 
                <br>(Qui viene visualizzato solo il Round 1 per chiarezza).
            </div>
        </div>
    `;
}

async function animateFinalXor(step) {
    const srcL = document.querySelectorAll('.fxor-src-l');
    const srcP = document.querySelectorAll('.fxor-src-p');
    const target = document.querySelectorAll('.fxor-target');

    // Clear targets
    target.forEach(t => {
        t.innerText = t.dataset.val;
        t.style.color = 'transparent';
    });

    const animations = [];

    // 32 bits straight mapping i -> i
    for (let i = 0; i < 32; i++) {
        const s1 = srcL[i];
        const s2 = srcP[i];
        const t = target[i];

        if (s1 && s2 && t) {
            const start1 = s1.getBoundingClientRect();
            const start2 = s2.getBoundingClientRect();
            const end = t.getBoundingClientRect();

            const f1 = createFlyer(s1.textContent, start1);
            const f2 = createFlyer(s2.textContent, start2);

            f1.style.backgroundColor = 'var(--text-secondary)';
            f2.style.backgroundColor = 'var(--highlight)';

            await animCtrl.wait(10);

            const flight = async () => {
                await new Promise(r => requestAnimationFrame(r));
                f1.style.transition = 'all 1.0s ease-in-out';
                f2.style.transition = 'all 1.0s ease-in-out';

                f1.style.left = end.left + window.scrollX + 'px';
                f1.style.top = end.top + window.scrollY + 'px';

                f2.style.left = end.left + window.scrollX + 'px';
                f2.style.top = end.top + window.scrollY + 'px';

                await animCtrl.wait(1000);
                f1.remove();
                f2.remove();

                t.style.color = '';
                t.textContent = t.dataset.val;
                t.classList.add('xor-flash');
            };
            animations.push(flight());
        }
    }
    await Promise.all(animations);
    await animCtrl.wait(500);
}


// ... (Existing Key Schedule, XOR, S-Box Logic) ...


// ... (Existing Key Schedule & XOR Logic) ...

// S-Box Animation Logic
function renderSBoxSectionHTML(step, sboxInHex, sboxOutHex) {
    if (!sboxInHex || !sboxOutHex) return '<div class="error">Missing S-Box Data</div>';

    // Input: 48 bits (8 groups of 6)
    // Output: 32 bits (8 groups of 4)

    const inBin = parseIntStr(sboxInHex, 48);
    const outBin = parseIntStr(sboxOutHex, 32);

    return `
        <div class="sbox-section">
            <div class="sbox-row">
                <div class="label">S-Box Input (48 bits)</div>
                <div class="sbox-groups-container">
                    ${renderSBoxGroups(inBin, 6, 'sbox-in', 'sbox-input-bit')}
                </div>
            </div>
            
            <div class="sbox-middle-row">
                ${renderSBoxes()}
            </div>
            
            <div class="sbox-row">
                <div class="label">S-Box Output (32 bits)</div>
                <div class="sbox-groups-container">
                    ${renderSBoxGroups(outBin, 4, 'sbox-out', 'sbox-output-bit', true)}
                </div>
            </div>
        </div>
    `;
}

function renderSBoxGroups(binStr, groupSize, idPrefix, cls, empty = false) {
    let html = '';
    const groups = binStr.length / groupSize;

    for (let i = 0; i < groups; i++) {
        const chunk = binStr.substr(i * groupSize, groupSize);
        html += `<div class="sbox-group-wrapper">`;
        html += `<div class="sbox-group-label">G${i + 1}</div>`;
        html += `<div class="sbox-group-bits">`;
        for (let j = 0; j < groupSize; j++) {
            let val = chunk[j];
            let style = empty ? 'color: transparent;' : '';
            html += `<span id="${idPrefix}-${i}-${j}" class="${cls}" style="${style}" data-val="${val}">${val}</span>`;
        }
        html += `</div></div>`;
    }
    return html;
}

function renderSBoxes() {
    let html = '';
    for (let i = 1; i <= 8; i++) {
        html += `<div id="sbox-module-${i}" class="sbox-module">
                    <div class="sbox-title">S${i}</div>
                    <div class="sbox-anim-target"></div>
                 </div>`;
    }
    return html;
}


async function animateSBoxSection(step) {
    // 8 Groups.
    // Group i of 6 bits -> SBox i -> Group i of 4 bits.

    const sboxModules = [];
    for (let i = 1; i <= 8; i++) sboxModules.push(document.getElementById(`sbox-module-${i}`));

    const outGroups = []; // We need target groups?

    for (let i = 0; i < 8; i++) {
        // Group i

        // 1. Gather input bits
        const inputs = [];
        for (let j = 0; j < 6; j++) {
            inputs.push(document.getElementById(`sbox-in-${i}-${j}`));
        }

        // 2. Identify SBox target
        const sbox = sboxModules[i];

        // 3. Identify output bits
        const outputs = [];
        for (let j = 0; j < 4; j++) {
            const el = document.getElementById(`sbox-out-${i}-${j}`);
            if (el) {
                el.innerText = el.dataset.val; // ensure text
                el.style.color = 'transparent';
                outputs.push(el);
            }
        }

        if (sbox && inputs.length === 6 && outputs.length === 4) {
            // Animate Inputs -> SBox
            const inAnims = inputs.map(el => {
                const start = el.getBoundingClientRect();
                const end = sbox.getBoundingClientRect(); // Center of box?
                // Refine end to specific point in box

                const flyer = createFlyer(el.textContent, start);
                flyer.style.backgroundColor = 'var(--text-secondary)';

                const flight = async () => {
                    await new Promise(r => requestAnimationFrame(r));
                    flyer.style.transition = 'all 0.8s ease-in';
                    // Aim for center of sbox
                    flyer.style.left = (end.left + end.width / 2 - 10) + window.scrollX + 'px';
                    flyer.style.top = (end.top + end.height / 2 - 10) + window.scrollY + 'px';

                    await animCtrl.wait(800);
                    flyer.remove();
                };
                return flight();
            });

            await Promise.all(inAnims);

            // Pulse SBox
            sbox.classList.add('sbox-active');
            await animCtrl.wait(400);
            sbox.classList.remove('sbox-active');

            // Animate SBox -> Output
            const outAnims = outputs.map((el, idx) => {
                const start = sbox.getBoundingClientRect();
                const end = el.getBoundingClientRect();

                const flyer = createFlyer(el.dataset.val, start);
                // Start from center
                flyer.style.left = (start.left + start.width / 2 - 10) + window.scrollX + 'px';
                flyer.style.top = (start.top + start.height / 2 - 10) + window.scrollY + 'px';
                flyer.style.width = '20px';
                flyer.style.height = '20px';

                flyer.style.backgroundColor = 'var(--accent)';

                const flight = async () => {
                    await new Promise(r => requestAnimationFrame(r));
                    flyer.style.transition = 'all 0.8s ease-out';
                    flyer.style.left = end.left + window.scrollX + 'px';
                    flyer.style.top = end.top + window.scrollY + 'px';

                    await animCtrl.wait(800);
                    flyer.remove();
                    el.style.color = '';
                };
                return flight();
            });

            await Promise.all(outAnims);
            await animCtrl.wait(200); // Small pause between groups
        }
    }
}


// ... (Existing Key Schedule & XOR Logic) ...

// S-Box Animation Logic
function renderSBoxSectionHTML(step, sboxInHex, sboxOutHex) {
    if (!sboxInHex || !sboxOutHex) return '<div class="error">Missing S-Box Data</div>';

    // Input: 48 bits (8 groups of 6)
    // Output: 32 bits (8 groups of 4)

    const inBin = parseIntStr(sboxInHex, 48);
    const outBin = parseIntStr(sboxOutHex, 32);

    return `
        <div class="sbox-section">
            <div class="sbox-row">
                <div class="label">S-Box Input (48 bits)</div>
                <div class="sbox-groups-container">
                    ${renderSBoxGroups(inBin, 6, 'sbox-in', 'sbox-input-bit')}
                </div>
            </div>
            
            <div class="sbox-middle-row">
                ${renderSBoxes()}
            </div>
            
            <div class="sbox-row">
                <div class="label">S-Box Output (32 bits)</div>
                <div class="sbox-groups-container">
                    ${renderSBoxGroups(outBin, 4, 'sbox-out', 'sbox-output-bit', true)}
                </div>
            </div>
        </div>
    `;
}

function renderSBoxGroups(binStr, groupSize, idPrefix, cls, empty = false) {
    let html = '';
    const groups = binStr.length / groupSize;

    for (let i = 0; i < groups; i++) {
        const chunk = binStr.substr(i * groupSize, groupSize);
        html += `<div class="sbox-group-wrapper">`;
        html += `<div class="sbox-group-label">G${i + 1}</div>`;
        html += `<div class="sbox-group-bits">`;
        for (let j = 0; j < groupSize; j++) {
            let val = chunk[j];
            let style = empty ? 'color: transparent;' : '';
            html += `<span id="${idPrefix}-${i}-${j}" class="${cls}" style="${style}" data-val="${val}">${val}</span>`;
        }
        html += `</div></div>`;
    }
    return html;
}

function renderSBoxes() {
    let html = '';
    for (let i = 1; i <= 8; i++) {
        html += `<div id="sbox-module-${i}" class="sbox-module">
                    <div class="sbox-title">S${i}</div>
                    <div class="sbox-anim-target"></div>
                 </div>`;
    }
    return html;
}


async function animateSBoxSection(step) {
    // 8 Groups.
    // Group i of 6 bits -> SBox i -> Group i of 4 bits.

    const sboxModules = [];
    for (let i = 1; i <= 8; i++) sboxModules.push(document.getElementById(`sbox-module-${i}`));

    const outGroups = []; // We need target groups?

    for (let i = 0; i < 8; i++) {
        // Group i

        // 1. Gather input bits
        const inputs = [];
        for (let j = 0; j < 6; j++) {
            inputs.push(document.getElementById(`sbox-in-${i}-${j}`));
        }

        // 2. Identify SBox target
        const sbox = sboxModules[i];

        // 3. Identify output bits
        const outputs = [];
        for (let j = 0; j < 4; j++) {
            const el = document.getElementById(`sbox-out-${i}-${j}`);
            if (el) {
                el.innerText = el.dataset.val; // ensure text
                el.style.color = 'transparent';
                outputs.push(el);
            }
        }

        if (sbox && inputs.length === 6 && outputs.length === 4) {
            // Animate Inputs -> SBox
            const inAnims = inputs.map(el => {
                const start = el.getBoundingClientRect();
                const end = sbox.getBoundingClientRect(); // Center of box?
                // Refine end to specific point in box

                const flyer = createFlyer(el.textContent, start);
                flyer.style.backgroundColor = 'var(--text-secondary)';

                const flight = async () => {
                    await new Promise(r => requestAnimationFrame(r));
                    flyer.style.transition = 'all 0.8s ease-in';
                    // Aim for center of sbox
                    flyer.style.left = (end.left + end.width / 2 - 10) + window.scrollX + 'px';
                    flyer.style.top = (end.top + end.height / 2 - 10) + window.scrollY + 'px';

                    await animCtrl.wait(800);
                    flyer.remove();
                };
                return flight();
            });

            await Promise.all(inAnims);

            // Pulse SBox
            sbox.classList.add('sbox-active');
            await animCtrl.wait(400);
            sbox.classList.remove('sbox-active');

            // Animate SBox -> Output
            const outAnims = outputs.map((el, idx) => {
                const start = sbox.getBoundingClientRect();
                const end = el.getBoundingClientRect();

                const flyer = createFlyer(el.dataset.val, start);
                // Start from center
                flyer.style.left = (start.left + start.width / 2 - 10) + window.scrollX + 'px';
                flyer.style.top = (start.top + start.height / 2 - 10) + window.scrollY + 'px';
                flyer.style.width = '20px';
                flyer.style.height = '20px';

                flyer.style.backgroundColor = 'var(--accent)';

                const flight = async () => {
                    await new Promise(r => requestAnimationFrame(r));
                    flyer.style.transition = 'all 0.8s ease-out';
                    flyer.style.left = end.left + window.scrollX + 'px';
                    flyer.style.top = end.top + window.scrollY + 'px';

                    await animCtrl.wait(800);
                    flyer.remove();
                    el.style.color = '';
                };
                return flight();
            });

            await Promise.all(outAnims);
            await animCtrl.wait(200); // Small pause between groups
        }
    }
}


// ... (Existing Expansion Logic) ...

// XOR Animation Logic
function renderXorSectionHTML(step, expandedHex, keyHex, xorResultHex) {
    if (!expandedHex || !keyHex || !xorResultHex) return '<div class="error">Missing XOR Data</div>';

    // We need 48 bits for each.
    // Expand hex to binary strings.
    const expBin = parseIntStr(expandedHex, 48);
    const keyBin = parseIntStr(keyHex, 48);
    const resBin = parseIntStr(xorResultHex, 48);

    return `
        <div class="xor-layout">
            <div class="xor-column">
                <div class="label">Expanded R(prev) (48 bits)</div>
                ${renderBitsVertical(expBin, 'xor-exp', 'xor-source-exp')}
            </div>
            <div class="xor-symbol-column">
                <div class="xor-op-symbol">⊕</div>
            </div>
            <div class="xor-column">
                <div class="label">Round Key (48 bits)</div>
                ${renderBitsVertical(keyBin, 'xor-key', 'xor-source-key')}
            </div>
            <div class="xor-arrow-column">
                <div class="xor-result-arrow">➡</div>
            </div>
            <div class="xor-column">
                <div class="label">Result (48 bits)</div>
                ${renderBitsVertical(resBin, 'xor-res', 'xor-target-res', true)} 
            </div>
        </div>
    `;
}

function parseIntStr(hex, bits) {
    let bin = "";
    for (let i = 0; i < hex.length; i++) {
        bin += parseInt(hex[i], 16).toString(2).padStart(4, '0');
    }
    return bin.substring(0, bits); // Should match exactly if logic correct
}


function renderBitsVertical(binStr, idPrefix, cls, empty = false) {
    // 48 bits vertical? That's too tall.
    // User asked for "48 bit text left and 48 bit key... fill new 48 bit".
    // Maybe grid of 8x6?
    // Let's do 8 rows of 6 bits.

    let html = `<div class="xor-grid-container">`;
    for (let i = 0; i < 8; i++) {
        html += `<div class="xor-grid-row">`;
        for (let j = 0; j < 6; j++) {
            let idx = i * 6 + j;
            let val = binStr[idx];
            let content = empty ? '' : val;
            let style = empty ? 'color: transparent;' : '';
            html += `<span id="${idPrefix}-${idx}" class="xor-bit ${cls}" style="${style}" data-val="${val}">${val}</span>`;
        }
        html += `</div>`;
    }
    html += `</div>`;
    return html;
}

async function animateXorSection(step) {
    // Indices 0..47
    const count = 48;

    const expBits = document.querySelectorAll('.xor-source-exp');
    const keyBits = document.querySelectorAll('.xor-source-key');
    const resBits = document.querySelectorAll('.xor-target-res');

    // Clear result
    resBits.forEach(b => b.textContent = b.dataset.val); // Ensure text is there
    resBits.forEach(b => b.style.color = 'transparent');

    // Iterate 8 groups of 6? Or straight 48?
    // "Take each bit left and right and fill new".
    // Let's do it row by row (8 rows) to be systematic.

    for (let i = 0; i < 8; i++) {
        // Process row i (bits i*6 to i*6+5)
        const anims = [];

        for (let j = 0; j < 6; j++) {
            let idx = i * 6 + j;

            const s1 = expBits[idx];
            const s2 = keyBits[idx];
            const t = resBits[idx];

            if (s1 && s2 && t) {
                // Fly from s1 -> t
                // Fly from s2 -> t
                // Then reveal t

                const start1 = s1.getBoundingClientRect();
                const start2 = s2.getBoundingClientRect();
                const end = t.getBoundingClientRect();

                const f1 = createFlyer(s1.textContent, start1);
                const f2 = createFlyer(s2.textContent, start2);

                // Color?
                f1.classList.add('xor-flyer-exp'); // CSS can style
                f2.classList.add('xor-flyer-key');

                // Slight stagger within row?
                await animCtrl.wait(20);

                const flight = async () => {
                    await new Promise(r => requestAnimationFrame(r));

                    // Converge
                    f1.style.transition = 'all 1.0s ease-in-out';
                    f2.style.transition = 'all 1.0s ease-in-out';

                    f1.style.left = end.left + window.scrollX + 'px';
                    f1.style.top = end.top + window.scrollY + 'px';

                    f2.style.left = end.left + window.scrollX + 'px';
                    f2.style.top = end.top + window.scrollY + 'px';

                    await animCtrl.wait(1000);
                    f1.remove();
                    f2.remove();

                    // Flash result
                    t.style.color = '';
                    t.classList.add('xor-flash');

                    // Optional: Visual logic 0+0=0 etc.
                    // But speed is key? 
                };
                anims.push(flight());
            }
        }
        await Promise.all(anims);
        await animCtrl.wait(300); // Pause between rows
    }
}


// ... (Existing Expansion Logic) ...

// Key Schedule Logic
function renderKeyScheduleHTML(ks) {
    if (!ks) return '<div class="error">No Key Schedule Data</div>';

    // C_prev, D_prev (28 bits each)
    // C_new, D_new (28 bits each)
    // Final Key (48 bits)

    return `
        <div class="key-stage" id="ks-stage-prev">
            <div class="register-block">
                <span class="label">C${ks.round - 1} (28 bits)</span>
                ${renderBits1D(ks.c_prev, 'c-prev', 'key-bit-c')}
            </div>
            <div class="register-block">
                <span class="label">D${ks.round - 1} (28 bits)</span>
                ${renderBits1D(ks.d_prev, 'd-prev', 'key-bit-d')}
            </div>
        </div>
        
        <div class="ks-arrow">⬇ Left Shift by ${ks.shift} ⬇</div>
        
        <div class="key-stage" id="ks-stage-new">
            <div class="register-block">
                <span class="label">C${ks.round}</span>
                ${renderBits1D(ks.c_new, 'c-new', 'key-bit-c-new')}
            </div>
            <div class="register-block">
                <span class="label">D${ks.round}</span>
                ${renderBits1D(ks.d_new, 'd-new', 'key-bit-d-new')}
            </div>
        </div>
        
        <div class="ks-arrow">⬇ Merge & PC2 Permutation ⬇</div>
        
        <div class="key-stage" id="ks-stage-final">
            <div class="register-block">
                <span class="label">Round Key (48 bits)</span>
                ${renderBits1D(ks.k_bin, 'k-final', 'key-final-bit')}
            </div>
        </div>
    `;
}

function renderBits1D(binStr, idPrefix, cls) {
    let html = `<div class="bits-row-flex">`;
    for (let i = 0; i < binStr.length; i++) {
        html += `<span id="${idPrefix}-${i}" class="key-bit ${cls}" data-val="${binStr[i]}">${binStr[i]}</span>`;
    }
    html += `</div>`;
    return html;
}

async function animateKeySchedule(step) {
    const ks = step.details.key_schedule;
    if (!ks) return;

    // Elements
    // C_prev, D_prev are inputs.
    // C_new, D_new are targets for Shift.
    // K_final is target for PC2.

    const cPrevBits = document.querySelectorAll('.key-bit-c');
    const dPrevBits = document.querySelectorAll('.key-bit-d');
    const cNewBits = document.querySelectorAll('.key-bit-c-new');
    const dNewBits = document.querySelectorAll('.key-bit-d-new');
    const kFinalBits = document.querySelectorAll('.key-final-bit');

    // Clear targets
    cNewBits.forEach(b => b.style.color = 'transparent');
    dNewBits.forEach(b => b.style.color = 'transparent');
    kFinalBits.forEach(b => b.style.color = 'transparent');

    // 1. Animate Shift
    // C_prev -> C_new (Left Shift)
    // D_prev -> D_new (Left Shift)
    const shift = ks.shift;

    await animCtrl.wait(200);

    const animateShiftBlock = async (sourceBits, targetBits) => {
        const anims = [];
        for (let i = 0; i < 28; i++) {
            // Source index i
            // New index (i - shift + 28) % 28 ? No.
            // visual: index i maps to index (i - shift) ?
            // Let's look at value map.
            // C_new[j] comes from C_prev[(j + shift) % 28] ?
            // No, Left shift means: C_new[0] = C_prev[shift]
            // So Target j comes from Source (j + shift) % 28

            // We want to fly FROM source TO target.
            // Source i goes to Target (i - shift + 28) % 28

            const targetIdx = (i - shift + 28) % 28;

            const s = sourceBits[i];
            const t = targetBits[targetIdx];

            if (s && t) {
                const start = s.getBoundingClientRect();
                const end = t.getBoundingClientRect();

                const flyer = createFlyer(s.textContent, start);
                flyer.style.backgroundColor = 'var(--text-secondary)';
                if (i < shift) {
                    flyer.style.backgroundColor = 'var(--highlight)'; // Wrapping bits
                }

                const flight = async () => {
                    await new Promise(r => requestAnimationFrame(r));
                    flyer.style.transition = 'all 1.0s ease-in-out';
                    flyer.style.left = end.left + window.scrollX + 'px';
                    flyer.style.top = end.top + window.scrollY + 'px';

                    await animCtrl.wait(1000);
                    flyer.remove();
                    t.style.color = '';
                };
                anims.push(flight());
            }
        }
        await Promise.all(anims);
    };

    await Promise.all([
        animateShiftBlock(cPrevBits, cNewBits),
        animateShiftBlock(dPrevBits, dNewBits)
    ]);

    await animCtrl.wait(500);

    // 2. Animate Conversion to Key (PC2)
    // PC2 selects 48 bits from the concatenates C_new + D_new (56 bits).
    // Mapping:
    // PC2 table in code (starts with 14, 17...).
    // Index 1-28 is C, 29-56 is D.

    // We need the PC2 table. It's constant.
    const PC2 = [
        14, 17, 11, 24, 1, 5, 3, 28, 15, 6, 21, 10,
        23, 19, 12, 4, 26, 8, 16, 7, 27, 20, 13, 2,
        41, 52, 31, 37, 47, 55, 30, 40, 51, 45, 33, 48,
        44, 49, 39, 56, 34, 53, 46, 42, 50, 36, 29, 32
    ];

    // We fly from C_new/D_new to K_final.
    // Iterate K_final indices (0..47)

    const flightAnims = [];

    for (let k = 0; k < 48; k++) {
        // Output positon k.
        // Input bit index: sourceVal = PC2[k] (1-based)
        const sourceVal = PC2[k];
        let sourceEl = null;

        if (sourceVal <= 28) {
            // comes from C_new
            // index 0-based: sourceVal - 1
            sourceEl = cNewBits[sourceVal - 1];
        } else {
            // comes from D_new
            // index 0-based: (sourceVal - 28) - 1 => sourceVal - 29
            sourceEl = dNewBits[sourceVal - 29];
        }

        const targetEl = kFinalBits[k];

        if (sourceEl && targetEl) {
            const start = sourceEl.getBoundingClientRect();
            const end = targetEl.getBoundingClientRect();

            // Stagger slightly?
            await animCtrl.wait(10);

            const flyer = createFlyer(sourceEl.textContent, start);
            // Color distinction based on source C or D?
            if (sourceVal <= 28) flyer.style.backgroundColor = '#10b981'; // Greenish for C
            else flyer.style.backgroundColor = '#f59e0b'; // Orange for D

            const flight = async () => {
                await new Promise(r => requestAnimationFrame(r));
                flyer.style.transition = 'all 1.5s cubic-bezier(0.25, 1, 0.5, 1)';
                flyer.style.left = end.left + window.scrollX + 'px';
                flyer.style.top = end.top + window.scrollY + 'px';

                await animCtrl.wait(1500);
                flyer.remove();
                targetEl.style.color = '';
            };
            flightAnims.push(flight());
        }
    }

    await Promise.all(flightAnims);
    await animCtrl.wait(500);
}


// Expansion Animation Logic
function renderR0Bits(hexStr) {
    // 32 bits from hex
    let binStr = "";
    for (let i = 0; i < hexStr.length; i++) {
        binStr += parseInt(hexStr[i], 16).toString(2).padStart(4, '0');
    }

    // Display as 8 groups of 4 bits (matching hex nibbles)
    let html = '<div class="r0-bits-container" style="display: flex; gap: 10px; justify-content: center; margin-top: 10px;">';
    for (let i = 0; i < 8; i++) {
        let chunk = binStr.substr(i * 4, 4);
        html += `<div class="nibble-group">`;
        for (let j = 0; j < 4; j++) {
            let globalIdx = i * 4 + j;
            html += `<span id="r0-bit-${globalIdx}" class="bit-source">${chunk[j]}</span>`;
        }
        html += `</div>`;
    }
    html += '</div>';
    return html;
}

async function animateExpansion(step) {
    const r0BitsContainer = document.querySelector('.r0-bits-container'); // Ensure this is unique per round if we have multiple
    // Actually we only render one round.
    if (!r0BitsContainer) return;

    const expansionContainer = document.querySelector('.expansion-container');
    const targetBits = expansionContainer.querySelectorAll('.expanded-bit');

    // 48 target bits.
    // Logic: E-Table expansion.
    // 8 groups of 6 bits.
    // Group k (0..7):
    //   Bit 0: Source (4k - 1) % 32
    //   Bit 1: Source (4k + 0)
    //   Bit 2: Source (4k + 1)
    //   Bit 3: Source (4k + 2)
    //   Bit 4: Source (4k + 3)
    //   Bit 5: Source (4k + 4) % 32

    const groups = 8;

    // Clear targets
    targetBits.forEach(b => b.style.color = 'transparent');

    const animations = [];

    for (let k = 0; k < groups; k++) {
        // Indices for this group of 6
        const indices = [
            (4 * k - 1 + 32) % 32, // Wrap around
            4 * k + 0,
            4 * k + 1,
            4 * k + 2,
            4 * k + 3,
            (4 * k + 4) % 32      // Wrap around
        ];

        // We process each group
        await animCtrl.wait(0);

        for (let pos = 0; pos < 6; pos++) {
            const sourceIdx = indices[pos];
            const targetIdx = k * 6 + pos;

            const sourceEl = document.getElementById(`r0-bit-${sourceIdx}`);
            const targetEl = document.getElementById(`exp-target-${targetIdx}`);

            if (sourceEl && targetEl) {
                const start = sourceEl.getBoundingClientRect();
                const end = targetEl.getBoundingClientRect();

                const flyer = createFlyer(sourceEl.textContent, start);
                // Highlight duplication/neighbor logic
                // Middle 4 are direct copy (white?)
                // Outer 2 are neighbors (accent color?)
                if (pos === 0 || pos === 5) {
                    flyer.style.color = 'var(--accent)'; // Highlight neighbors
                    flyer.style.fontWeight = 'bold';
                }

                // Animate
                const flight = async () => {
                    await new Promise(r => requestAnimationFrame(r));

                    // Slower transition
                    flyer.style.transition = 'all 1.5s cubic-bezier(0.25, 1, 0.5, 1)';

                    flyer.style.left = end.left + window.scrollX + 'px';
                    flyer.style.top = end.top + window.scrollY + 'px';

                    await animCtrl.wait(1500);
                    flyer.remove();
                    targetEl.style.color = '';
                    if (pos === 0 || pos === 5) {
                        targetEl.style.color = 'var(--accent)';
                    }
                };
                animations.push(flight());
            }
        }
        await Promise.all(animations);
        animations.length = 0; // Clear
        await animCtrl.wait(800); // Standardize wait
    }
}

