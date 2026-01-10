import secrets

def otp_encrypt_verbose(text, key, decrypt=False):
    if not text:
        return {"error": "Missing text"}
    
    # 1. Convert text to bytes
    text_bytes = text.encode('utf-8')
    
    # 2. Handle Key
    if not key:
        key_bytes = secrets.token_bytes(len(text_bytes))
        key = key_bytes.hex() # For display
        generated = True
    else:
        key_bytes = key.encode('utf-8')
        generated = False

    # Adjust key length
    if len(key_bytes) < len(text_bytes):
        repetitions = (len(text_bytes) // len(key_bytes)) + 1
        key_bytes = (key_bytes * repetitions)[:len(text_bytes)]
        
    elif len(key_bytes) > len(text_bytes):
        key_bytes = key_bytes[:len(text_bytes)]
        
    # 3. XOR
    result_bytes = bytearray()
    steps = []
    ciphertext_chars = ""
    
    for i in range(len(text_bytes)):
        t_byte = text_bytes[i]
        k_byte = key_bytes[i]
        r_byte = t_byte ^ k_byte
        result_bytes.append(r_byte)
        
        # Determine display character for result
        # If printable ASCII
        if 32 <= r_byte <= 126:
            r_char = chr(r_byte)
        else:
            # For unprintable, we might use a symbol for the string
            # But the user asked for "the message".
            # Let's return a special placeholder for display, but keep the code visible
            r_char = '' 
            
        ciphertext_chars += r_char
        
        steps.append({
            "index": i,
            "char": chr(t_byte) if 32 <= t_byte <= 126 else '.',
            "char_code": t_byte,
            "char_bin": format(t_byte, '08b'),
            "key_char": chr(k_byte) if 32 <= k_byte <= 126 else '.',
            "key_code": k_byte,
            "key_bin": format(k_byte, '08b'),
            "result_code": r_byte,
            "result_bin": format(r_byte, '08b'),
            "result_hex": format(r_byte, '02x'),
            "result_char": r_char
        })
        
    return {
        "text": text,
        "key_used": key,
        "key_bytes_hex": key_bytes.hex(),
        "generated_key": generated,
        "ciphertext_hex": result_bytes.hex(),
        "ciphertext_text": ciphertext_chars,
        "steps": steps
    }
