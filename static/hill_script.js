document.getElementById('encryptBtn').addEventListener('click', runEncryption);
document.getElementById('resetBtn').addEventListener('click', resetVisualization);

async function runEncryption() {
    const text = document.getElementById('plaintext').value;
    const key = document.getElementById('key').value;

    if (key.length !== 9) {
        alert("La chiave deve essere di esattamente 9 lettere!");
        return;
    }

    try {
        const response = await fetch('/encrypt_hill', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: text, key: key })
        });

        const data = await response.json();

        if (data.error) {
            alert("Errore: " + data.error);
            return;
        }

        visualizeEncryption(data);

    } catch (error) {
        console.error("Errore:", error);
        alert("Errore di connessione.");
    }
}

function resetVisualization() {
    document.getElementById('visualization').classList.add('hidden');
    document.getElementById('hill-feeder').innerHTML = '';
    document.getElementById('key-matrix').innerHTML = '';
    document.getElementById('ciphertext-display').textContent = '';
    document.getElementById('decryption-section').classList.add('hidden');
}

function visualizeEncryption(data) {
    const vizSection = document.getElementById('visualization');
    vizSection.classList.remove('hidden');

    const feeder = document.getElementById('hill-feeder');
    feeder.innerHTML = '';
    document.getElementById('ciphertext-display').textContent = '';

    // 1. Show Key Matrix Conversion (Intro)
    const introDiv = document.createElement('div');
    introDiv.className = 'hill-intro';
    introDiv.innerHTML = `<h3>1. Preparazione Matrice Chiave (K) 3x3</h3>`;

    const keyConversion = document.createElement('div');
    keyConversion.className = 'conversion-box';

    // Key Letters
    const kMatLetters = document.createElement('div');
    kMatLetters.className = 'matrix-box';
    kMatLetters.style.gridTemplateColumns = 'repeat(3, 1fr)';
    data.key_chars.forEach(char => {
        kMatLetters.appendChild(createCell(char, 'char-cell'));
    });

    const arrow = document.createElement('div');
    arrow.className = 'arrow-right';
    arrow.innerText = '→';

    // Key Numbers
    const kMatNums = document.createElement('div');
    kMatNums.className = 'matrix-box';
    kMatNums.id = 'main-key-matrix';
    kMatNums.style.gridTemplateColumns = 'repeat(3, 1fr)';
    data.key_matrix.forEach(row => {
        row.forEach(val => {
            kMatNums.appendChild(createCell(val, 'num-cell'));
        });
    });

    keyConversion.appendChild(kMatLetters);
    keyConversion.appendChild(arrow);
    keyConversion.appendChild(kMatNums);
    introDiv.appendChild(keyConversion);
    feeder.appendChild(introDiv);

    // Update main visualization Key Matrix (just for reference)
    const keyContainer = document.getElementById('key-matrix');
    keyContainer.innerHTML = '';
    data.key_matrix.forEach(row => {
        row.forEach(val => {
            keyContainer.appendChild(createCell(val, 'num-cell'));
        });
    });

    // 2. Encryption Animation
    let delay = 2000;

    data.steps.forEach((step, index) => {
        setTimeout(() => {
            createBlockAnimation(feeder, step, data.key_matrix, index);
        }, delay);
        delay += 9000; // Increased delay for 3 rows
    });

    // 3. Show Decryption Info at the end
    setTimeout(() => {
        showDecryptionInfo(data.inverse_matrix);
    }, delay + 1000);
}

function showDecryptionInfo(invMatrix) {
    const decSection = document.getElementById('decryption-section');
    decSection.classList.remove('hidden');

    const invContainer = document.getElementById('inverse-key-matrix');
    invContainer.innerHTML = '';
    invMatrix.forEach(row => {
        row.forEach(val => {
            invContainer.appendChild(createCell(val, 'num-cell res-cell'));
        });
    });

    decSection.scrollIntoView({ behavior: 'smooth' });
}

function createBlockAnimation(container, step, keyMatrix, index) {
    const stepDiv = document.createElement('div');
    stepDiv.className = 'hill-step';
    stepDiv.innerHTML = `<h3>Blocco ${index + 1}: "${step.p_chars.join('')}"</h3>`;

    const equationContainer = document.createElement('div');
    equationContainer.className = 'equation-container';

    // Key Matrix (Static)
    const kBox = document.createElement('div');
    kBox.className = 'matrix-box secondary';
    kBox.style.gridTemplateColumns = 'repeat(3, 1fr)';
    keyMatrix.forEach((row, rIdx) => {
        row.forEach((val, cIdx) => {
            const cell = createCell(val, 'num-cell');
            cell.dataset.row = rIdx;
            kBox.appendChild(cell);
        });
    });

    const times = document.createElement('div');
    times.innerText = '×';
    times.className = 'operator';

    // Plaintext Vector
    const pBox = document.createElement('div');
    pBox.className = 'vector-box';
    pBox.style.gridTemplateRows = 'repeat(3, 1fr)'; // 3 rows for vector

    step.p_chars.forEach((char, i) => {
        const cell = document.createElement('div');
        cell.className = 'matrix-cell anim-cell';
        cell.innerHTML = `<span class="top">${char}</span><span class="bot">${step.p_vals[i]}</span>`;
        pBox.appendChild(cell);
    });

    const equals = document.createElement('div');
    equals.innerText = '=';
    equals.className = 'operator';

    // Result Vector
    const cBox = document.createElement('div');
    cBox.className = 'vector-box result-box';
    cBox.style.gridTemplateRows = 'repeat(3, 1fr)';

    // Math Log
    const mathLog = document.createElement('div');
    mathLog.className = 'math-log';

    equationContainer.appendChild(kBox);
    equationContainer.appendChild(times);
    equationContainer.appendChild(pBox);
    equationContainer.appendChild(equals);
    equationContainer.appendChild(cBox);

    stepDiv.appendChild(equationContainer);
    stepDiv.appendChild(mathLog);
    container.appendChild(stepDiv);

    // Row Animations
    step.calcs.forEach((calc, rIdx) => {
        setTimeout(() => {
            clearHighlights(kBox);
            highlightRow(kBox, rIdx);
            highlightVector(pBox);

            const rowHTML = `
                <div class="math-entry">
                    <strong>R${rIdx + 1} × P:</strong> ${calc.formula} 
                    = ${calc.sum} <br>
                    ${calc.sum} mod 26 = <strong>${calc.mod} (${calc.char})</strong>
                </div>
            `;
            mathLog.innerHTML += rowHTML;
            cBox.appendChild(createCell(calc.char, 'res-cell'));

            // Update Global Result
            document.getElementById('ciphertext-display').textContent += calc.char;

        }, rIdx * 2500 + 1000);
    });

    // Clear highlights after block
    setTimeout(() => {
        clearHighlights(kBox);
        clearHighlights(pBox);
    }, 8500);
}


function createCell(content, type) {
    const div = document.createElement('div');
    div.className = `matrix-cell ${type}`;
    div.innerHTML = content;
    return div;
}

function highlightRow(matrixBox, rowIdx) {
    const cells = matrixBox.querySelectorAll(`[data-row="${rowIdx}"]`);
    cells.forEach(c => c.classList.add('highlight'));
}

function highlightVector(vectorBox) {
    const cells = vectorBox.querySelectorAll('.matrix-cell');
    cells.forEach(c => c.classList.add('highlight-sec'));
}

function clearHighlights(box) {
    box.querySelectorAll('.highlight').forEach(c => c.classList.remove('highlight'));
}
