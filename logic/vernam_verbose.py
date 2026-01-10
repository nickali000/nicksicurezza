import secrets

def vernam_encrypt_verbose(text, key):
    if not text:
        return {"error": "Missing text"}
    
    # 1. Clean inputs: Only uppercase letters
    text_clean = "".join([c.upper() for c in text if c.isalpha()])
    
    if not text_clean:
         return {"error": "No valid letters in text"}
    
    # 2. Handle Key
    if not key:
        # Generate random key (A-Z)
        chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
        key_clean = "".join(secrets.choice(chars) for _ in range(len(text_clean)))
        key = key_clean 
        generated = True
    else:
        key_clean = "".join([c.upper() for c in key if c.isalpha()])
        if not key_clean:
             return {"error": "No valid letters in key"}
        generated = False

    # Adjust key length (Loop or truncate)
    if len(key_clean) < len(text_clean):
        repetitions = (len(text_clean) // len(key_clean)) + 1
        key_clean = (key_clean * repetitions)[:len(text_clean)]
    elif len(key_clean) > len(text_clean):
        key_clean = key_clean[:len(text_clean)]
        
    # 3. Modular Addition
    ciphertext = ""
    steps = []
    
    for i in range(len(text_clean)):
        p_char = text_clean[i]
        k_char = key_clean[i]
        
        p_idx = ord(p_char) - ord('A')
        k_idx = ord(k_char) - ord('A')
        
        # (P + K) % 26
        sum_idx = p_idx + k_idx
        c_idx = sum_idx % 26
        
        c_char = chr(c_idx + ord('A'))
        ciphertext += c_char
        
        steps.append({
            "index": i,
            "p_char": p_char,
            "p_idx": p_idx,
            "k_char": k_char,
            "k_idx": k_idx,
            "sum_val": sum_idx, # Useful to show wrapping
            "c_idx": c_idx,
            "c_char": c_char
        })
        
    return {
        "text": text_clean, # Return processed input
        "key_used": key_clean, # Return processed key
        "generated_key": generated,
        "ciphertext": ciphertext,
        "steps": steps
    }
