document.addEventListener('DOMContentLoaded', () => {
    const rc4 = new MiniRC4();
    rc4.init();
});

class MiniRC4 {
    constructor() {
        this.N = 8; // Size of the state array (Mini-RC4)
        this.S = [];
        this.K = [];
        this.i = 0;
        this.j = 0;
        this.currentStep = 'init'; // init, ksa, prga
        this.ksaIndex = 0;
        this.keyStr = "1 2 3"; // Default key
    }

    init() {
        this.bindEvents();
        this.reset();
    }

    bindEvents() {
        document.getElementById('initBtn').addEventListener('click', () => this.reset());
        document.getElementById('ksaStepBtn').addEventListener('click', () => this.ksaStep());
        document.getElementById('prgaByteBtn').addEventListener('click', () => this.prgaStep());
        document.getElementById('runKsaBtn').addEventListener('click', () => this.runFullKSA());
    }

    reset() {
        // Read Key
        const keyInput = document.getElementById('keyInput').value.trim();
        this.keyStr = keyInput || "1 2 3";
        this.K = this.keyStr.split(/\s+/).map(x => parseInt(x) || 0);

        // Initialize S
        this.S = [];
        for (let k = 0; k < this.N; k++) this.S[k] = k;

        this.i = 0;
        this.j = 0;
        this.ksaIndex = 0;
        this.currentStep = 'ksa';

        this.updateLog("Inizializzato S = [0, 1, ... 7]. Chiave caricata.");
        this.render();

        // Disable/Enable buttons
        this.setButtonState('ksa');
    }

    async ksaStep() {
        if (this.ksaIndex >= this.N) {
            this.updateLog("KSA terminato. Pronto per PRGA.");
            this.currentStep = 'prga';
            this.setButtonState('prga');
            this.i = 0;
            this.j = 0;
            this.render(); // Clear pointers
            return;
        }

        const i = this.ksaIndex;
        // j = (j + S[i] + K[i % key_len]) % N
        const s_i = this.S[i];
        const k_val = this.K[i % this.K.length];
        const next_j = (this.j + s_i + k_val) % this.N;

        this.highlight(i, next_j, 'calc'); // Highlight current i and NEXT j (target swap)
        this.updateLog(`KSA i=${i}: j = (${this.j} + S[${i}](${s_i}) + K[${i % this.K.length}](${k_val})) % 8 = <strong>${next_j}</strong>`);

        await this.wait(1000);

        this.j = next_j;
        // Ready to swap
        await this.wait(500);

        // Swap S[i] and S[j]
        [this.S[i], this.S[this.j]] = [this.S[this.j], this.S[i]];
        this.updateLog(`Scambio S[${i}] e S[${this.j}]`);
        this.render();
        this.highlight(i, this.j, 'swapped');

        await this.wait(1000);

        this.ksaIndex++;
        this.render(); // Cleanup highlights

        if (this.ksaIndex >= this.N) {
            this.updateLog("<strong>KSA Completato!</strong> Il vettore S è mescolato.");
            this.currentStep = 'prga';
            this.setButtonState('prga');
            this.i = 0;
            this.j = 0;
        }
    }

    async runFullKSA() {
        while (this.currentStep === 'ksa' && this.ksaIndex < this.N) {
            await this.ksaStep();
            await this.wait(100); // Faster
        }
    }

    async prgaStep() {
        // i = (i + 1) % N
        this.i = (this.i + 1) % this.N;

        // j = (j + S[i]) % N
        const s_i = this.S[this.i];
        const next_j = (this.j + s_i) % this.N;

        this.updateLog(`PRGA: i=${this.i}, Calcolo new j...`);
        this.highlight(this.i, next_j, 'calc');
        await this.wait(1000);

        this.j = next_j;
        this.updateLog(`j = (j + S[${this.i}]) % 8 = ${this.j}. Scambio S[${this.i}] e S[${this.j}].`);

        // Swap
        [this.S[this.i], this.S[this.j]] = [this.S[this.j], this.S[this.i]];
        this.render();
        this.highlight(this.i, this.j, 'swapped');
        await this.wait(800);

        // Output
        const t = (this.S[this.i] + this.S[this.j]) % this.N;
        const K_out = this.S[t];
        this.updateLog(`t = (S[i]+S[j])%8 = ${t}. <strong>KeyByte = S[${t}] = ${K_out}</strong>`);

        this.addOutput(K_out);
        this.render(); // Clear and update
    }

    render() {
        const container = document.getElementById('rc4-state');
        container.innerHTML = '';

        this.S.forEach((val, idx) => {
            const cell = document.createElement('div');
            cell.className = 'rc4-cell';
            cell.innerHTML = `
                <div class="idx">${idx}</div>
                <div class="val">${val}</div>
            `;

            if (this.currentStep === 'ksa' && idx === this.ksaIndex) cell.classList.add('ptr-i');
            if (this.currentStep === 'prga' && idx === this.i) cell.classList.add('ptr-i');
            if (idx === this.j) cell.classList.add('ptr-j');

            container.appendChild(cell);
        });
    }

    highlight(idx1, idx2, type) {
        const cells = document.querySelectorAll('.rc4-cell');
        if (cells[idx1]) cells[idx1].classList.add(type);
        if (cells[idx2]) cells[idx2].classList.add(type);
    }

    updateLog(msg) {
        const log = document.getElementById('rc4-log');
        log.innerHTML = `<div>${msg}</div>`; // overwrite for cleanliness
    }

    addOutput(val) {
        const outBox = document.getElementById('rc4-output');
        const span = document.createElement('span');
        span.className = 'out-byte';
        span.innerText = val;
        outBox.appendChild(span);
    }

    setButtonState(phase) {
        document.getElementById('ksaStepBtn').disabled = (phase !== 'ksa');
        document.getElementById('runKsaBtn').disabled = (phase !== 'ksa');
        document.getElementById('prgaByteBtn').disabled = (phase !== 'prga');
    }

    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
