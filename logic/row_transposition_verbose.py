
def get_column_order(key):
    """
    Determines the column reading order based on the key.
    If key is numerical (e.g., "312"), it's treated as direct permuation (1-based).
    If key is a word (e.g., "ZEBRA"), it's sorted alphabetically to determine order.
    """
    # Check if key is all digits
    if key.isdigit():
        # User entered digits.
        # We assume 1-based indices (standard in crypto problems usually).
        # "312" -> Read column 3 first? No, usually "312" means assign 3 to first col, 1 to second..
        # Wait, if key is "312", typically it means:
        # Col 0 is labeled 3
        # Col 1 is labeled 1
        # Col 2 is labeled 2
        # Then we read in order of labels: 1, 2, 3.
        # So we read Col 1, then Col 2, then Col 0.
        try:
            order = [int(k) for k in key]
            # Verify if it's a valid permutation of 1..N
            n = len(order)
            sorted_order = sorted(order)
            if sorted_order == list(range(1, n + 1)):
                # It is valid 1-based permutation
                # We need to return indices of the columns in the order they should be read.
                # Key: [3, 1, 2]
                # Pairs: (3, 0), (1, 1), (2, 2)  (val, original_index)
                # Sort by val: (1, 1), (2, 2), (3, 0)
                # Result indices: [1, 2, 0]
                indexed_key = list(enumerate(order))
                sorted_key = sorted(indexed_key, key=lambda x: x[1])
                return [x[0] for x in sorted_key]
        except:
            pass # Fallback to string handling

    # String handling (keyword)
    # Key: "ZEBRA"
    # Indices: 0 1 2 3 4
    # Chars:   Z E B R A
    # Sort Chars: A(4), B(2), E(1), R(3), Z(0)
    # Order: [4, 2, 1, 3, 0]
    indexed_key = list(enumerate(key))
    # Stable sort is better if duplicate letters exist (usually Left-to-Right)
    sorted_key = sorted(indexed_key, key=lambda x: x[1])
    return [x[0] for x in sorted_key]

def row_transposition_encrypt_verbose(plaintext, key):
    # 1. Clean key/plaintext? usually spaces are kept or removed. Let's keep them but maybe replace with placeholder if needed.
    # For visualization, spaces are good to see.
    
    # 2. Determine Column Order
    col_order = get_column_order(key)
    num_cols = len(key)
    
    # 3. Pad plaintext
    text_len = len(plaintext)
    num_rows = (text_len + num_cols - 1) // num_cols
    padding_len = (num_rows * num_cols) - text_len
    
    padded_text = plaintext + ("_" * padding_len) # Using _ for visibility of padding
    
    # 4. Fill Matrix
    grid = []
    for r in range(num_rows):
        row = list(padded_text[r * num_cols : (r + 1) * num_cols])
        grid.append(row)
        
    # 5. Read Columns
    ciphertext = ""
    steps = []
    
    # Record step: Intial Grid
    steps.append({
        "description": "Grid filled row by row",
        "grid": [row[:] for row in grid],
        "ciphertext_so_far": ""
    })
    
    for col_idx in col_order:
        col_chars = []
        for row in grid:
            col_chars.append(row[col_idx])
        
        chunk = "".join(col_chars)
        ciphertext += chunk
        
        steps.append({
            "description": f"Read column {col_idx + 1} (Key val: {key[col_idx]})",
            "highlight_col": col_idx,
            "chunk": chunk,
            "ciphertext_so_far": ciphertext
        })
        
    return {
        "key": key,
        "input": plaintext,
        "algo_col_order": col_order, # Indices of columns in order
        "grid": grid,
        "ciphertext": ciphertext,
        "steps": steps
    }
