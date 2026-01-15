import random

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

def generate_keys_elgamal(p, g, private_key=None):
    # p must be a large prime
    # g must be a primitive root mod p
    # For demo we will trust the inputs or default to small ones if logic elsewhere calls this without inputs
    
    if private_key is None:
        # Choose random private key x such that 1 < x < p-1
        private_key = random.randint(2, p - 2)
        
    # Calculate Public Key component y = g^x mod p
    y = pow(g, private_key, p)
    
    steps = []
    steps.append({
        "step": "1. Scelta Chiave Privata",
        "description": f"Scegliamo un numero casuale <strong>x = {private_key}</strong> (dove 1 < x < p-1).",
        "math": f"x = {private_key}"
    })
    
    steps.append({
        "step": "2. Calcolo Chiave Pubblica",
        "description": f"Calcoliamo y = g^x mod p.",
        "math": f"y = {g}^{private_key} mod {p} = <strong>{y}</strong>"
    })
    
    return {
        "x": private_key,
        "y": y,
        "p": p,
        "g": g,
        "steps": steps
    }

def elgamal_encrypt_verbose(message, p, g, y):
    # message is a string, we treat it char by char
    try:
        steps = []
        ciphertext = []
        
        steps.append({
            "type": "info",
            "message": f"Cifratura con Chiave Pubblica (p={p}, g={g}, y={y})"
        })
        
        # We need a random k for each block, or one for the whole message.
        # Usually one per block is safer, but for visualization one per message is clearer or per char.
        # Let's do per char to be consistent with RSA visualization style
        
        for char in message:
            m = ord(char)
            # Choose random k, gcd(k, p-1)=1 usually required for signing, for encryption k just needs to be in range
            k = random.randint(2, p - 2)
            
            # Calculate a = g^k mod p
            a = pow(g, k, p)
            
            # Calculate b = (y^k * m) mod p
            # First s = y^k mod p (Shared secret part)
            s = pow(y, k, p)
            b = (s * m) % p
            
            ciphertext.append({'a': a, 'b': b})
            
            steps.append({
                "type": "step",
                "char": char,
                "m": m,
                "k": k,
                "calc_a": f"a = g^k mod p = {g}^{k} mod {p} = <strong>{a}</strong>",
                "calc_s": f"s = y^k mod p = {y}^{k} mod {p} = {s}",
                "calc_b": f"b = (s * m) mod p = ({s} * {m}) mod {p} = <strong>{b}</strong>",
                "result": f"Coppia cifrata: ({a}, {b})"
            })
            
        return {
            "ciphertext": ciphertext,
            "steps": steps
        }
    except Exception as e:
        return {"error": str(e)}

def elgamal_decrypt_verbose(ciphertext_list, p, x):
    try:
        steps = []
        plaintext = ""
        
        steps.append({
            "type": "info",
            "message": f"Decifratura con Chiave Privata x={x}"
        })
        
        for pair in ciphertext_list:
            a = pair['a']
            b = pair['b']
            
            # Calculate s = a^x mod p
            s = pow(a, x, p)
            
            # Calculate modular inverse of s
            s_inv = multiplicative_inverse(s, p)
            
            # Message m = b * s^-1 mod p
            m = (b * s_inv) % p
            
            try:
                char = chr(m)
            except:
                char = "?"
            plaintext += char
            
            steps.append({
                "type": "step",
                "pair": f"({a}, {b})",
                "calc_s": f"s = a^x mod p = {a}^{x} mod {p} = <strong>{s}</strong>",
                "calc_m": f"m = b * s^(-1) mod p = {b} * {s_inv} mod {p} = <strong>{m}</strong>",
                "result_char": char
            })
            
        return {
            "plaintext": plaintext,
            "steps": steps
        }
    except Exception as e:
        return {"error": str(e)}
