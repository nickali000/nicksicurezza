import math

def mod_inverse(a, m):
    try:
        return pow(a, -1, m)
    except ValueError:
        return None

def hill_encrypt_verbose(text, key_string):
    if not text:
        return {"error": "Missing text"}
    
    # 1. Clean inputs
    text_clean = "".join([c.upper() for c in text if c.isalpha()])
    key_clean = "".join([c.upper() for c in key_string if c.isalpha()])
    
    if len(key_clean) != 9:
         return {"error": "Key must contain exactly 9 valid letters for a 3x3 matrix"}
         
    # 2. Pad text if not multiple of 3
    pad_len = (3 - len(text_clean) % 3) % 3
    text_clean += "X" * pad_len
        
    # 3. Build Key Matrix 3x3
    k_vals = [ord(c) - ord('A') for c in key_clean]
    matrix = [
        [k_vals[0], k_vals[1], k_vals[2]],
        [k_vals[3], k_vals[4], k_vals[5]],
        [k_vals[6], k_vals[7], k_vals[8]]
    ]
    
    # 4. Calculate Determinant and Inverse (for Decryption info)
    det = (matrix[0][0] * (matrix[1][1] * matrix[2][2] - matrix[1][2] * matrix[2][1]) -
           matrix[0][1] * (matrix[1][0] * matrix[2][2] - matrix[1][2] * matrix[2][0]) +
           matrix[0][2] * (matrix[1][0] * matrix[2][1] - matrix[1][1] * matrix[2][0])) % 26
           
    det_inv = mod_inverse(det, 26)
    
    if det_inv is None:
        return {"error": f"Key Not Invertible! Determinant {det} is not coprime to 26."}
        
    # Calculate Adjugate Matrix to find Inverse
    # Adj = Transpose of Cofactor Matrix
    inverse_matrix = [[0]*3 for _ in range(3)]
    for r in range(3):
        for c in range(3):
            # Minor calculation
            minor_rows = [x for x in range(3) if x != r]
            minor_cols = [x for x in range(3) if x != c]
            
            minor = (matrix[minor_rows[0]][minor_cols[0]] * matrix[minor_rows[1]][minor_cols[1]] -
                     matrix[minor_rows[0]][minor_cols[1]] * matrix[minor_rows[1]][minor_cols[0]])
            
            cofactor = ((-1)**(r+c)) * minor
            # Apply to Transposed position [c][r] immediately for Adjugate
            inverse_matrix[c][r] = (cofactor * det_inv) % 26

    # 5. Process Triplets
    ciphertext = ""
    steps = []
    
    for i in range(0, len(text_clean), 3):
        p_chars = [text_clean[i], text_clean[i+1], text_clean[i+2]]
        p_vals = [ord(c) - ord('A') for c in p_chars]
        
        chunk_calcs = []
        c_chars = []
        
        # Matrix Multiplication (3 rows)
        for r in range(3):
            sum_val = (matrix[r][0] * p_vals[0]) + (matrix[r][1] * p_vals[1]) + (matrix[r][2] * p_vals[2])
            c_val = sum_val % 26
            c_char = chr(c_val + ord('A'))
            c_chars.append(c_char)
            
            chunk_calcs.append({
                "row": r,
                "formula": f"({matrix[r][0]}*{p_vals[0]}) + ({matrix[r][1]}*{p_vals[1]}) + ({matrix[r][2]}*{p_vals[2]})",
                "sum": sum_val,
                "mod": c_val,
                "char": c_char
            })
            
        ciphertext += "".join(c_chars)
        
        steps.append({
            "chunk_idx": i // 3,
            "p_chars": p_chars,
            "p_vals": p_vals,
            "calcs": chunk_calcs
        })
        
    return {
        "text": text_clean,
        "key_matrix": matrix,
        "key_chars": list(key_clean),
        "inverse_matrix": inverse_matrix,
        "ciphertext": ciphertext,
        "steps": steps
    }
