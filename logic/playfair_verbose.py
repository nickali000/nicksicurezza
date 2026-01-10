def playfair_encrypt_verbose(text, key):
    if not text:
        return {"error": "Missing text"}
    
    # 1. Prepare Key
    cleaned_key = ""
    seen = set()
    key_upper = key.upper().replace("J", "I")
    
    for char in key_upper:
        if char.isalpha() and char not in seen:
            cleaned_key += char
            seen.add(char)
            
    alphabet = "ABCDEFGHIKLMNOPQRSTUVWXYZ"
    for char in alphabet:
        if char not in seen:
            cleaned_key += char
            
    matrix = []
    coord_map = {}
    for r in range(5):
        row = []
        for c in range(5):
            char = cleaned_key[r*5 + c]
            row.append(char)
            coord_map[char] = (r, c)
        matrix.append(row)
        
    # 2. Prepare Text (Digraphs) with Logs
    text_clean = "".join([c.upper() for c in text if c.isalpha()]).replace("J", "I")
    digraphs = []
    preprocessing_steps = [] # New: Log why we formed these pairs
    
    i = 0
    while i < len(text_clean):
        a = text_clean[i]
        b = ''
        note = ""
        
        if i + 1 >= len(text_clean):
            b = 'X' 
            note = f"Padding: '{a}' è sola alla fine -> Aggiunta 'X'"
            i += 1
        else:
            b = text_clean[i+1]
            if a == b:
                b = 'X' 
                note = f"Doppia '{a}' trovata -> Inserita 'X' => '{a}X'"
                i += 1 # Only consume 'a'
            else:
                note = "Coppia standard"
                i += 2 # Consume both
        
        pair = a + b
        digraphs.append(pair)
        if note != "Coppia standard":
             preprocessing_steps.append({"pair": pair, "note": note})
        
    # 3. Encrypt Digraphs
    ciphertext = ""
    steps = []
    
    for pair in digraphs:
        a, b = pair[0], pair[1]
        r1, c1 = coord_map[a]
        r2, c2 = coord_map[b]
        
        rule = ""
        rule_desc = "" # New: Detailed description
        c_a, c_b = "", ""
        
        highlight_coords = [{'r': r1, 'c': c1}, {'r': r2, 'c': c2}]
        result_coords = []
        
        if r1 == r2:
            # Same Row -> Right
            rule = "Stessa Riga"
            rule_desc = "Le lettere sono nella stessa riga: prendi quelle immediatamente a DESTRA (Wrap-around)."
            c1_new = (c1 + 1) % 5
            c2_new = (c2 + 1) % 5
            c_a = matrix[r1][c1_new]
            c_b = matrix[r2][c2_new]
            result_coords = [{'r': r1, 'c': c1_new}, {'r': r2, 'c': c2_new}]
            
        elif c1 == c2:
            # Same Col -> Down
            rule = "Stessa Colonna"
            rule_desc = "Le lettere sono nella stessa colonna: prendi quelle immediatamente SOTTO (Wrap-around)."
            r1_new = (r1 + 1) % 5
            r2_new = (r2 + 1) % 5
            c_a = matrix[r1_new][c1]
            c_b = matrix[r2_new][c2]
            result_coords = [{'r': r1_new, 'c': c1}, {'r': r2_new, 'c': c2}]
            
        else:
            # Rectangle -> Opposite Corners
            rule = "Rettangolo"
            rule_desc = "Le lettere formano un rettangolo: prendi l'angolo opposto nella STESSA RIGA."
            c_a = matrix[r1][c2]
            c_b = matrix[r2][c1]
            result_coords = [{'r': r1, 'c': c2}, {'r': r2, 'c': c1}]
            
        ciphertext += c_a + c_b
        
        steps.append({
            "pair": pair,
            "rule": rule,
            "rule_desc": rule_desc,
            "coords_in": highlight_coords,
            "coords_out": result_coords,
            "result": c_a + c_b
        })
        
    return {
        "text": text,
        "key_string": cleaned_key,
        "matrix": matrix,
        "digraphs": digraphs,
        "preprocessing_steps": preprocessing_steps,
        "ciphertext": ciphertext,
        "steps": steps
    }
