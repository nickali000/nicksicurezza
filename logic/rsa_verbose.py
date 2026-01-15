import random

def gcd(a, b):
    while b:
        a, b = b, a % b
    return a

def multiplicative_inverse(e, phi):
    d = 0
    x1 = 0
    x2 = 1
    y1 = 1
    temp_phi = phi
    
    while e > 0:
        temp1 = temp_phi // e
        temp2 = temp_phi - temp1 * e
        temp_phi = e
        e = temp2
        
        x = x2 - temp1 * x1
        y = d - temp1 * y1
        
        x2 = x1
        x1 = x
        d = y1
        y1 = y
        
    if temp_phi == 1:
        return d + phi
    
def is_prime(num):
    if num < 2:
        return False
    for i in range(2, int(num ** 0.5) + 1):
        if num % i == 0:
            return False
    return True

def generate_keypair(p, q):
    if not (is_prime(p) and is_prime(q)):
        raise ValueError("Both numbers must be prime.")
    elif p == q:
        raise ValueError("p and q cannot be equal.")

    steps = []
    
    # n = pq
    n = p * q
    steps.append({
        "step": "1. Calcolo del Modulo (n)",
        "formula": f"n = p * q = {p} * {q}",
        "result": n,
        "desc": "Il modulo 'n' è il prodotto dei due numeri primi p e q. Sarà utilizzato sia nella chiave pubblica che in quella privata."
    })

    # Phi is the totient of n
    phi = (p - 1) * (q - 1)
    steps.append({
        "step": "2. Calcolo della Funzione di Eulero φ(n)",
        "formula": f"φ(n) = (p - 1) * (q - 1) = {p-1} * {q-1}",
        "result": phi,
        "desc": "φ(n) (phi) rappresenta il numero di interi positivi minori di n che sono coprimi con n. Questo valore è segreto e fondamentale per calcolare la chiave privata."
    })

    # Choose an integer e such that e and phi(n) are coprime
    e = random.randrange(1, phi)

    # Use Euclid's Algorithm to verify that e and phi(n) are coprime
    g = gcd(e, phi)
    while g != 1:
        e = random.randrange(1, phi)
        g = gcd(e, phi)

    steps.append({
        "step": "3. Scelta dell'Esponente Pubblico (e)",
        "formula": f"MCD(e, φ(n)) = MCD({e}, {phi}) = 1",
        "result": e,
        "desc": f"L'esponente pubblico 'e' deve essere un numero intero tale che 1 < e < φ(n) e che sia coprimo con φ(n) (ovvero il loro massimo comune divisore è 1). In questo caso abbiamo scelto casualmente {e}."
    })

    # Use Extended Euclid's Algorithm to generate the private key
    d = multiplicative_inverse(e, phi)
    
    steps.append({
        "step": "4. Calcolo dell'Esponente Privato (d)",
        "formula": f"d * e ≡ 1 (mod φ(n))",
        "result": d,
        "desc": f"L'esponente privato 'd' viene calcolato come l'inverso moltiplicativo modulare di 'e' rispetto a φ(n). Significa che (d * {e}) diviso {phi} deve dare resto 1. Matematicamente: ({d} * {e}) mod {phi} = {(d * e) % phi}."
    })
    
    # Return public and private keypair
    # Public key is (e, n) and private key is (d, n)
    return {
        "public": (e, n),
        "private": (d, n),
        "phi": phi,
        "steps": steps
    }

def rsa_encrypt_verbose(text, public_key):
    try:
        e, n = public_key
        steps = []
        
        # Convert each letter in the plaintext to numbers based on the character using a^b mod m
        cipher = []
        text_numeric = []
        
        steps.append({
            "type": "info",
            "message": f"Cifratura usando la Chiave Pubblica (e={e}, n={n})"
        })
        
        for char in text:
            # Convert char to ASCII/Unicode code
            m = ord(char)
            text_numeric.append(m)
            
            # c = (m ^ e) % n
            c = pow(m, e, n)
            cipher.append(c)
            
            steps.append({
                "type": "step",
                "char": char,
                "m": m,
                "formula": f"{m}^{e} mod {n}",
                "result": c
            })
            
        return {
            "ciphertext": cipher, # List of integers
            "steps": steps
        }
    except Exception as e:
        return {"error": str(e)}

def rsa_decrypt_verbose(cipher, private_key):
    try:
        d, n = private_key
        steps = []
        
        plain = []
        
        steps.append({
            "type": "info",
            "message": f"Decifratura usando la Chiave Privata (d={d}, n={n})"
        })
        
        for char_code in cipher:
            # m = (c ^ d) % n
            m = pow(char_code, d, n)
            
            try:
                char = chr(m)
            except:
                char = "?"
                
            plain.append(char)
            
            steps.append({
                "type": "step",
                "c": char_code,
                "formula": f"{char_code}^{d} mod {n}",
                "result_m": m,
                "result_char": char
            })
            
        return {
            "plaintext": "".join(plain),
            "steps": steps
        }
    except Exception as e:
        return {"error": str(e)}
