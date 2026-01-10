def caesar_encrypt_verbose(text, shift):
    if not text:
        return {"error": "Missing text"}
    
    try:
        shift_val = int(shift)
        shift_val = shift_val % 26
    except ValueError:
        return {"error": "Invalid shift value"}

    alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    
    # Generate Cipher Alphabet
    # Slicing: [shift:] + [:shift]
    cipher_alphabet = alphabet[shift_val:] + alphabet[:shift_val]
    
    matrix_map = {}
    for i, char in enumerate(alphabet):
        matrix_map[char] = cipher_alphabet[i]
        
    text_clean = "".join([c.upper() for c in text if c.isalpha()])
    ciphertext = ""
    steps = []
    
    for i, p_char in enumerate(text_clean):
        c_char = matrix_map[p_char]
        
        # Calculate indices for detailed view
        p_idx = ord(p_char) - ord('A')
        c_idx = (p_idx + shift_val) % 26 # or just find in cipher_alphabet
        
        ciphertext += c_char
        steps.append({
            "index": i,
            "p_char": p_char,
            "p_idx": p_idx,
            "c_char": c_char,
            "c_idx": c_idx,
            "formula": f"({p_idx} + {shift_val}) % 26 = {c_idx}"
        })
        
    return {
        "text": text_clean,
        "shift": shift_val,
        "std_alphabet": list(alphabet),
        "cipher_alphabet": list(cipher_alphabet),
        "ciphertext": ciphertext,
        "steps": steps
    }
