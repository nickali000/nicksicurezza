function togglePolicy(policy) {
    const allowBox = document.getElementById('policy-allow');
    const denyBox = document.getElementById('policy-deny');
    const desc = document.getElementById('policy-desc');

    if (policy === 'allow') {
        allowBox.classList.add('selected');
        denyBox.classList.remove('selected');

        allowBox.style.borderColor = '#da3633';
        denyBox.style.borderColor = '#30363d';

        desc.innerHTML = '<span style="color:#da3633; font-weight:bold;">Pericoloso!</span> Tutto passa tranne ciò che blocchi esplicitamente. Se dimentichi una regola, sei fregato. <br><em>(Comodo per chi non vuole rogne, ma pessimo per la sicurezza)</em>';
    } else {
        denyBox.classList.add('selected');
        allowBox.classList.remove('selected');

        denyBox.style.borderColor = '#2ea043';
        allowBox.style.borderColor = '#30363d';

        desc.innerHTML = '<span style="color:#2ea043; font-weight:bold;">Sicuro (Best Practice).</span> Tutto è bloccato a meno che tu non lo apra esplicitamente. <br><em>(Più lavoro di configurazione, ma dormi sonni tranquilli)</em>';
    }
}

// Init
document.addEventListener('DOMContentLoaded', () => {
    togglePolicy('deny');
});
