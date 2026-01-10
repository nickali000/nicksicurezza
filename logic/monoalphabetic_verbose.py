def monoalphabetic_encrypt_verbose(text, key):
    if not text:
        return {"error": "Missing text"}
    
    # 1. Generate Cipher Alphabet from Key
    key_upper = key.upper()
    cipher_alphabet = ""
    seen = set()
    
    # Add unique key chars
    for char in key_upper:
        if char.isalpha() and char not in seen:
            cipher_alphabet += char
            seen.add(char)
            
    # Fill remaining
    standard_alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    for char in standard_alphabet:
        if char not in seen:
            cipher_alphabet += char
            
    if len(cipher_alphabet) != 26:
        # Should not happen given logic, but sanity check
        return {"error": "Failed to generate alphabet"}
        
    # 2. Build Mapping
    mapping = {}
    for i, std_char in enumerate(standard_alphabet):
        mapping[std_char] = cipher_alphabet[i]
        
    # 3. Encrypt
    text_clean = "".join([c.upper() for c in text if c.isalpha()])
    ciphertext = ""
    steps = []
    
    for i, char in enumerate(text_clean):
        c_char = mapping.get(char, char) # Should always map if alpha
        ciphertext += c_char
        
        steps.append({
            "index": i,
            "p_char": char,
            "c_char": c_char
        })
        
    return {
        "text": text_clean,
        "key_keyword": key_upper,
        "standard_alphabet": list(standard_alphabet),
        "cipher_alphabet": list(cipher_alphabet),
        "ciphertext": ciphertext,
        "steps": steps
    }
