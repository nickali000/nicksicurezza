const steps = [
    { text: "Messaggio", class: "", label: "0. Testo in Chiaro" },
    { text: "Messaggio + Firma", class: "layer-sign", label: "1. Autenticazione: Hash + Firma (Privata Alice)" },
    { text: "[ ZIP [ Msg + Firma ] ]", class: "layer-zip", label: "2. Compressione: Riduce dimensione e aumenta entropia" },
    { text: "010110... (Cifrato)", class: "layer-enc", label: "3. Confidenzialità: Cifratura Simmetrica + Session Key" },
    { text: "-----BEGIN PGP MESSAGE-----", class: "layer-radix", label: "4. Compatibilità: Radix-64 (ASCII Armor)" }
];

let currentStep = 0;

function nextStep() {
    if (currentStep < steps.length - 1) {
        currentStep++;
        updateFlow();
    }
}

function prevStep() {
    if (currentStep > 0) {
        currentStep--;
        updateFlow();
    }
}

function resetFlow() {
    currentStep = 0;
    updateFlow();
}

function updateFlow() {
    const box = document.getElementById('msg-box');
    const label = document.getElementById('step-label');
    const stepData = steps[currentStep];

    box.innerText = stepData.text;
    box.className = 'message-box ' + stepData.class;
    label.innerText = stepData.label;

    // Simple visual feedback for Signature
    if (currentStep === 1) {
        box.innerHTML = 'Messaggio <span style="font-size:0.8em; background:#db6d28; color:white; padding:2px; border-radius:2px;">[Firma]</span>';
    }
}
