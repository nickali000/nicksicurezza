def rail_fence_encrypt_verbose(text, rails):
    if not text:
        return {"error": "Missing text"}
    
    rails = int(rails)
    if rails < 2:
        return {"error": "Rails must be at least 2"}

    # Initialize the fence (matrix) with None
    # We can visualize it as a list of lists strings, or coordinate tuples
    # Let's map each character to a (row, col) coordinate
    
    fence_grid = [['' for _ in range(len(text))] for _ in range(rails)]
    
    row, col = 0, 0
    direction_down = False
    
    coords = [] # List of (row, col, char)
    
    # Place char on rails
    for char in text:
        # Check if we need to change direction
        if row == 0 or row == rails - 1:
            direction_down = not direction_down
            
        fence_grid[row][col] = char
        coords.append({'row': row, 'col': col, 'char': char})
        
        col += 1
        
        if direction_down:
            row += 1
        else:
            row -= 1
            
    # Read the fence
    ciphertext = ""
    steps = []
    
    # Step 1: Initialization
    steps.append({
        "description": "Placed characters on rails in zigzag pattern",
        "grid": [r[:] for r in fence_grid], # Copy
        "ciphertext_so_far": ""
    })
    
    # Read row by row
    for r in range(rails):
        row_chars = []
        for c in range(len(text)):
            char = fence_grid[r][c]
            if char != '':
                row_chars.append(char)
                ciphertext += char
                
                steps.append({
                    "description": f"Read character '{char}' from Rail {r+1}",
                    "highlight_cell": {"row": r, "col": c},
                    "chunk": char,
                    "ciphertext_so_far": ciphertext
                })
                
    return {
        "text": text,
        "rails": rails,
        "grid": fence_grid,
        "coords": coords, # Initial zigzag placement order
        "ciphertext": ciphertext,
        "steps": steps
    }
