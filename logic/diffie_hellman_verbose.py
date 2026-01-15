import random

def is_prime(num):
    if num < 2:
        return False
    for i in range(2, int(num ** 0.5) + 1):
        if num % i == 0:
            return False
    return True

def generate_parameters():
    # For demonstration, pick a small prime, e.g., 23
    # In reality, this would be huge.
    primes = [23, 47, 59, 83, 107, 167, 263, 359, 479, 599, 719, 839]
    p = random.choice(primes)
    
    # Primitive root modulo p (a generator)
    # Finding a generator: simplistic approach for small primes
    g = 2
    while True:
        # Check if g is a primitive root
        # Order of g must be p-1
        powers = set()
        for i in range(1, p):
            powers.add(pow(g, i, p))
        if len(powers) == p - 1:
            break
        g += 1
        
    return p, g

def diffie_hellman_step1_setup(p=None, g=None):
    if p is None or g is None:
        p, g = generate_parameters()
    
    steps = []
    steps.append({
        "step": "1. Definizione Parametri Pubblici",
        "description": f"Alice e Bob concordano di usare un numero primo <strong>p = {p}</strong> e una base (generatore) <strong>g = {g}</strong>.",
        "math": f"p = {p}, g = {g}",
        "note": "Questi numeri non sono segreti. Chiunque può vederli."
    })
    
    return {
        "p": p,
        "g": g,
        "steps": steps
    }

def diffie_hellman_step2_keys(p, g, private_a=None, private_b=None):
    # If privates not provided, generate random
    if private_a is None:
        private_a = random.randint(2, p-2)
    if private_b is None:
        private_b = random.randint(2, p-2)
        
    # Calculate Public Keys
    # A = g^a mod p
    public_a = pow(g, private_a, p)
    
    # B = g^b mod p
    public_b = pow(g, private_b, p)
    
    steps = []
    steps.append({
        "step": "2. Generazione Chiavi Private (Segrete)",
        "description": "Alice e Bob scelgono ciascuno un numero segreto casuale.",
        "alice": f"Alice sceglie <strong>a = {private_a}</strong> (Segreto)",
        "bob": f"Bob sceglie <strong>b = {private_b}</strong> (Segreto)",
        "note": "Questi valori NON vengono mai scambiati."
    })
    
    steps.append({
        "step": "3. Calcolo Chiavi Pubbliche",
        "description": "Ciascuno calcola la propria chiave pubblica usando g, p e la propria chiave privata.",
        "math_alice": f"A = g^a mod p = {g}^{private_a} mod {p} = <strong>{public_a}</strong>",
        "math_bob": f"B = g^b mod p = {g}^{private_b} mod {p} = <strong>{public_b}</strong>",
        "result_alice": f"Chiave Pubblica Alice A = {public_a}",
        "result_bob": f"Chiave Pubblica Bob B = {public_b}"
    })
    
    steps.append({
        "step": "4. Scambio Chiavi Pubbliche",
        "description": "Alice invia A a Bob. Bob invia B ad Alice. Ora il canale conosce A e B.",
        "exchange": f"Alice --> A({public_a}) --> Bob<br>Bob --> B({public_b}) --> Alice"
    })
    
    return {
        "private_a": private_a,
        "private_b": private_b,
        "public_a": public_a,
        "public_b": public_b,
        "steps": steps
    }

def diffie_hellman_step3_secret(p, private_a, public_b, private_b, public_a):
    # Alice calculates s = B^a mod p
    secret_alice = pow(public_b, private_a, p)
    
    # Bob calculates s = A^b mod p
    secret_bob = pow(public_a, private_b, p)
    
    steps = []
    
    steps.append({
        "step": "5. Calcolo del Segreto Condiviso",
        "description": "Entrambi usano la chiave pubblica dell'altro e la propria chiave privata per calcolare lo stesso numero.",
        "alice_calc": f"S = B^a mod p = {public_b}^{private_a} mod {p} = <strong>{secret_alice}</strong>",
        "bob_calc": f"S = A^b mod p = {public_a}^{private_b} mod {p} = <strong>{secret_bob}</strong>",
        "result": "I due segreti coincidono!",
        "note": f"Ora Alice e Bob condividono il segreto <strong>{secret_alice}</strong> che nessun altro può calcolare facilmente."
    })
    
    return {
        "secret_alice": secret_alice,
        "secret_bob": secret_bob,
        "match": secret_alice == secret_bob,
        "steps": steps
    }
