# Guida Modalità Offline (Esame)

Se hai paura che la connessione internet (Render) non funzioni durante l'esame, hai due opzioni solide per far girare tutto in locale.

## Opzione A: Laptop come Server (Consigliata)
Questa è la soluzione più affidabile. Usi il tuo computer per far girare il programma e il Tablet solo come "schermo" per toccare.

### Requisiti
- Il tuo Computer (con il codice scaricato).
- Il Tablet.
- **Hotspot WiFi** (dal telefono o dal computer stesso).

### Procedura
1. **Collega** sia il Laptop che il Tablet alla stessa rete WiFi (es. l'Hotspot del tuo telefono).
2. Sul Laptop, apri il terminale nella cartella del progetto.
3. Trova il tuo indirizzo IP locale:
   - Linux/Mac: Scrivi `ip addr` o `ifconfig` (cerca numeri tipo `192.168.x.x` o `172.20.10.x`).
   - Windows: Scrivi `ipconfig`.
4. Avvia l'app (Docker o Python diretto):
   ```bash
   # Se usi Python diretto (più semplice se non vuoi gestire Docker)
   pip install -r requirements.txt
   python app.py
   ```
5. Ora l'app sta girando su `0.0.0.0:5000`.
6. Prendi il **Tablet**, apri Chrome/Safari.
7. Nella barra indirizzi scrivi: `http://<IL-TUO-IP-LAPTOP>:5000`
   - Esempio: `http://192.168.1.112:5000`

Se vedi il sito sul Tablet, sei **100% Offline** (funziona anche se l'hotspot non ha dati mobili, basta che la rete WiFi esista).

---

## Opzione B: Android Nativo (Pydroid 3 + Git) - Guida Passo Passo
Questa è l'opzione migliore se vuoi essere indipendente dal computer. Scaricheremo tutto direttamente nel Tablet da GitHub.

### 1. Preparazione App
1. Vai su Google Play Store.
2. Cerca e installa **"Pydroid 3 - IDE for Python 3"**.
3. (Opzionale ma consigliato) Installa anche **"Pydroid Repository Plugin"** se te lo chiede.

### 2. Il Terminale
1. Apri Pydroid 3.
2. Tocca l'icona del menu (le tre linee in alto a sinistra).
3. Seleziona **"Terminal"**.
4. Ti si aprirà una schermata nera stile hacker.

### 3. Scaricare il Progetto (Git Clone)
Scrivi questi comandi nel terminale (fai attenzione agli spazi!):

```bash
pkg install git
mkdir esame
cd esame
git clone https://github.com/nickali000/nicksicurezza.git
cd nicksicurezza
```

### 4. Installare le librerie
Ora dobbiamo installare Flask e le altre cose. Sempre nel terminale scrivi:

```bash
pip install flask pycryptodome service_identity
```
*(Se ti dà errori strani, prova: `pip install -r requirements.txt`)*

### 5. Avviare l'App
Sempre nel terminale, scrivi:

```bash
python app.py
```

### 6. Usare l'App
1. Se vedi scritte tipo `Running on http://0.0.0.0:5000`, funziona!
2. Apri il browser del tablet (Chrome).
3. Vai su: `http://localhost:5000` o `http://127.0.0.1:5000`

Tadaaa! 🎉 Hai tutto il progetto nel tablet.
Quando hai finito, per spegnere torna su Pydroid e premi `CTRL+C` (o chiudi l'app).

---

## Opzione C: iPad (iOS)
Su iPad è molto più difficile far girare Python con server Flask (app come *Pythonista* o *a-Shell* hanno limitazioni).
**Consiglio vivamente l'Opzione A per utenti iPad.**
