import hashlib

def hmac_verbose(key_str, message_str, hash_algo='sha256'):
    # 1. Setup
    steps = []
    
    # Defaults for SHA-256
    block_size = 64
    
    if hash_algo == 'sha256':
        digest_mod = hashlib.sha256
    elif hash_algo == 'md5':
        digest_mod = hashlib.md5
        block_size = 64
    else:
        digest_mod = hashlib.sha256 # Default
        
    key = key_str.encode('utf-8')
    message = message_str.encode('utf-8')
    
    steps.append({
        "step": "1. Preparazione Chiave",
        "desc": f"Input chiave: '{key_str}'. Algoritmo: {hash_algo}. BlockSize: {block_size} byte."
    })

    # 2. Key Processing
    if len(key) > block_size:
        key = digest_mod(key).digest()
        steps.append({
            "step": "1a. Hushing della Chiave",
            "desc": "La chiave è più lunga del blocco. Viene hashata per ridurla."
        })
    elif len(key) < block_size:
        key = key.ljust(block_size, b'\0')
        steps.append({
            "step": "1b. Padding della Chiave",
            "desc": f"La chiave è più corta del blocco. Viene riempita con {block_size - len(key_str.encode('utf-8'))} zeri (0x00) per raggiungere {block_size} byte."
        })
    
    # 3. Inner Pad (ipad) calculation
    # ipad = 0x36 repeated block_size times
    ipad = bytes((x ^ 0x36) for x in key)
    steps.append({
        "step": "2. Calcolo Inner Pad (Key XOR ipad)",
        "desc": "La chiave (paddata) viene messa in XOR con 0x36 (00110110) per ogni byte.",
    })
    
    # 4. Inner Hash
    inner_data = ipad + message
    inner_hash = digest_mod(inner_data).digest()
    steps.append({
        "step": "3. Inner Hash",
        "desc": "Si calcola H( (K' ^ ipad) || messaggio ).",
        "detail": f"Messaggio interno: {inner_data[:20]}... (troncato)",
        "result": inner_hash.hex()
    })
    
    # 5. Outer Pad (opad) calculation
    # opad = 0x5c repeated block_size times
    opad = bytes((x ^ 0x5c) for x in key)
    steps.append({
        "step": "4. Calcolo Outer Pad (Key XOR opad)",
        "desc": "La chiave (paddata) viene messa in XOR con 0x5c (01011100) per ogni byte.",
    })
    
    # 6. Outer Hash (Final Result)
    outer_data = opad + inner_hash
    final_hash = digest_mod(outer_data).hexdigest()
    steps.append({
        "step": "5. Outer Hash (Risultato Finale)",
        "desc": "Si calcola H( (K' ^ opad) || inner_hash ).",
        "result": final_hash
    })
    
    return {
        "steps": steps,
        "hmac": final_hash
    }
