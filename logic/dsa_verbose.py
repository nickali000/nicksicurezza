import random
import hashlib

def mod_inverse(a, m):
    m0 = m
    y = 0
    x = 1
    if m == 1:
        return 0
    while a > 1:
        # q is quotient
        q = a // m
        t = m
        # m is remainder now, process same as Euclid's algo
        m = a % m
        a = t
        t = y
        # Update y and x
        y = x - q * y
        x = t
    if x < 0:
        x = x + m0
    return x

def dsa_setup_parameters():
    # Pre-calculated small primes for demonstration purposes
    # q must be a prime divisor of (p-1)
    # g must be of order q mod p, i.e., g^q mod p = 1
    
    # Example set 1
    # q = 11
    # p = 23 (2*11 + 1)
    # g: h=2, g = h^((p-1)/q) mod p = 2^2 mod 23 = 4. 4^11 mod 23 = 1. OK.
    
    # Example set 2 (Larger)
    # q = 101
    # p = 1213 (12 * 101 + 1) -> 1213 is prime?
    # Let's check primality of 1213: sqrt(1213) ~ 34. Divisors? No.
    # h = 2. g = 2^12 mod 1213 = 4096 mod 1213 = 457.
    # 457^101 mod 1213 ? 
    
    # Provide a few sets
    params_options = [
        {"p": 23, "q": 11, "g": 4},
        {"p": 67, "q": 11, "g": 9},  # 6*11+1. h=2. g=2^6=64. 64^11 mod 67 = 1 ?? 64 = -3. (-3)^11 mod 67.
        {"p": 1223, "q": 47, "g": 725} # Pre-validated or calculated
    ]
    
    # Let's calculate one dynamically to be robust or pick random valid one
    # Simple generation:
    # 1. Pick prime q
    # 2. Find p such that p = k*q + 1 is prime
    # 3. Pick h, g = h^k mod p > 1
    
    q_candidates = [11, 23, 47, 59, 83]
    q = random.choice(q_candidates)
    
    k = 2
    p = 0
    while True:
        p_candidate = k * q + 1
        if all(p_candidate % i != 0 for i in range(2, int(p_candidate**0.5) + 1)):
            p = p_candidate
            break
        k += 1
        
    # Find g
    h = 2
    g = 0
    while True:
        g = pow(h, (p-1)//q, p)
        if g > 1:
            break
        h += 1
        
    return {"p": p, "q": q, "g": g}

def dsa_generate_keys(p, q, g, private_key=None):
    if private_key is None:
        # x random in [1, q-1]
        private_key = random.randint(1, q - 1)
        
    # y = g^x mod p
    y = pow(g, private_key, p)
    
    steps = []
    steps.append({
        "step": "Generazione Chiavi",
        "description": f"Scegliamo un segreto x e calcoliamo la chiave pubblica y.",
        "math_x": f"x = {private_key} (Privata, casuale < q)",
        "math_y": f"y = g^x mod p = {g}^{private_key} mod {p} = <strong>{y}</strong> (Pubblica)"
    })
    
    return {
        "x": private_key,
        "y": y,
        "p": p, 
        "q": q, 
        "g": g,
        "steps": steps
    }

def dsa_sign_verbose(message, p, q, g, x):
    # 1. H(m)
    # Simple hash: sum of ASCII or real SHA
    # For visualization, simple hash number is better but let's use a truncated SHA-1/256 to fit q?
    # To keep it visualizable, let's use a custom visual hash or small real hash
    
    # Using SHA-256 but represented as int mod q for valid arithmetic
    hash_obj = hashlib.sha256(message.encode())
    hash_hex = hash_obj.hexdigest()
    hash_int = int(hash_hex, 16)
    
    # H(m) should be taken as integer
    hm = hash_int
    
    # 2. Choose k
    k = random.randint(1, q - 1)
    
    # 3. Calculate r = (g^k mod p) mod q
    r = pow(g, k, p) % q
    
    # 4. Calculate s = (k^-1 * (H(m) + x*r)) mod q
    k_inv = mod_inverse(k, q)
    s = (k_inv * (hm + x * r)) % q
    
    steps = []
    
    steps.append({
        "step": "1. Hashing del Messaggio",
        "description": "Calcoliamo l'hash H(m) del messaggio e lo trattiamo come numero.",
        "math": f"H('{message}') = ...{hash_hex[:6]}... -> int: {hm} (usato mod q)"
    })
    
    steps.append({
        "step": "2. Scelta numero casuale k",
        "description": "Scegliamo un numero segreto 'k' per questa firma.",
        "math": f"k = {k} (1 < k < q)"
    })
    
    steps.append({
        "step": "3. Calcolo di r",
        "description": "r dipende dai parametri globali e da k.",
        "math": f"r = (g^k mod p) mod q = ({g}^{k} mod {p}) mod {q} = <strong>{r}</strong>"
    })
    
    steps.append({
        "step": "4. Calcolo di s",
        "description": "s lega il messaggio, la chiave privata x e r.",
        "math": f"s = (k^(-1) * (H(m) + x*r)) mod q<br>s = ({k_inv} * ({hm} + {x}*{r})) mod {q} = <strong>{s}</strong>"
    })
    
    # If s=0 start over, technically required but rare with large q. With small q possible.
    if r == 0 or s == 0:
        return dsa_sign_verbose(message, p, q, g, x) # Retry
    
    return {
        "r": r,
        "s": s,
        "hm": hm,
        "k": k, # exposed for teaching purposes
        "steps": steps
    }

def dsa_verify_verbose(message, r, s, p, q, g, y):
    steps = []
    
    # 1. Verify ranges
    if not (0 < r < q) or not (0 < s < q):
        steps.append({"step": "Check Range", "description": "Firma non valida (r o s fuori range).", "valid": False})
        return {"valid": False, "steps": steps}
        
    # 2. Hash message
    hash_obj = hashlib.sha256(message.encode())
    hm = int(hash_obj.hexdigest(), 16)
    
    steps.append({
        "step": "1. Hashing del Messaggio (Verifica)",
        "description": "Chi verifica calcola l'hash dello stesso messaggio.",
        "math": f"H(m) = {hm}"
    })
    
    # 3. w = s^-1 mod q
    w = mod_inverse(s, q)
    
    steps.append({
        "step": "2. Calcolo Chiave Ausiliaria w",
        "description": "Calcoliamo l'inverso di s modulo q.",
        "math": f"w = s^(-1) mod q = {s}^(-1) mod {q} = <strong>{w}</strong>"
    })
    
    # 4. u1 = (H(m) * w) mod q
    u1 = (hm * w) % q
    
    # 5. u2 = (r * w) mod q
    u2 = (r * w) % q
    
    steps.append({
        "step": "3. Calcolo Componenti u1 e u2",
        "description": "Calcoliamo due valori intermedi.",
        "math_u1": f"u1 = (H(m) * w) mod q = ({hm} * {w}) mod {q} = <strong>{u1}</strong>",
        "math_u2": f"u2 = (r * w) mod q = ({r} * {w}) mod {q} = <strong>{u2}</strong>"
    })
    
    # 6. v = ((g^u1 * y^u2) mod p) mod q
    val1 = pow(g, u1, p)
    val2 = pow(y, u2, p)
    v = (val1 * val2) % p % q
    
    match = (v == r)
    
    steps.append({
        "step": "4. Calcolo Finale v e Verifica",
        "description": "Calcoliamo v e controlliamo se è uguale a r.",
        "math_v": f"v = ((g^u1 * y^u2) mod p) mod q<br>v = (({g}^{u1} * {y}^{u2}) mod {p}) mod {q} = <strong>{v}</strong>",
        "result": "v == r ?"
    })
    
    if match:
         steps.append({"step": "Risultato", "description": "L'uguaglianza è vera. La firma è <strong>VALIDA</strong>.", "valid": True})
    else:
         steps.append({"step": "Risultato", "description": f"v ({v}) != r ({r}). La firma è <strong>NON VALIDA</strong>.", "valid": False})
    
    return {
        "valid": match,
        "v": v,
        "steps": steps
    }
