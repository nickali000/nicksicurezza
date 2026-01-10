def vigenere_encrypt_verbose(text, key):
    if not text:
        return {"error": "Missing text"}
    
    if not key:
        return {"error": "Missing key"}
        
    # 1. Clean inputs: Only uppercase letters
    text_clean = "".join([c.upper() for c in text if c.isalpha()])
    key_clean = "".join([c.upper() for c in key if c.isalpha()])
    
    if not text_clean:
         return {"error": "No valid letters in text"}
    if not key_clean:
         return {"error": "No valid letters in key"}
         
    # 2. encryption
    ciphertext = ""
    steps = []
    
    # We want to show the full expanded key
    full_key_display = ""
    
    key_idx = 0
    for i in range(len(text_clean)):
        p_char = text_clean[i]
        k_char = key_clean[key_idx % len(key_clean)]
        full_key_display += k_char
        
        p_val = ord(p_char) - ord('A')
        k_val = ord(k_char) - ord('A')
        
        c_val = (p_val + k_val) % 26
        c_char = chr(c_val + ord('A'))
        
        ciphertext += c_char
        
        steps.append({
            "index": i,
            "p_char": p_char,
            "p_val": p_val,
            "k_char": k_char,
            "k_val": k_val,
            "sum_val": p_val + k_val,
            "c_val": c_val,
            "c_char": c_char
        })
        
        key_idx += 1
        
    return {
        "text": text_clean,
        "key": key_clean,
        "full_key": full_key_display,
        "ciphertext": ciphertext,
        "steps": steps
    }
