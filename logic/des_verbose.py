
# DES Implementation with Verbose Logging

# --- Constants (Permutation Tables and S-Boxes) ---

# Initial Permutation Table
IP = [
    58, 50, 42, 34, 26, 18, 10, 2,
    60, 52, 44, 36, 28, 20, 12, 4,
    62, 54, 46, 38, 30, 22, 14, 6,
    64, 56, 48, 40, 32, 24, 16, 8,
    57, 49, 41, 33, 25, 17, 9, 1,
    59, 51, 43, 35, 27, 19, 11, 3,
    61, 53, 45, 37, 29, 21, 13, 5,
    63, 55, 47, 39, 31, 23, 15, 7
]

# Final Permutation Table (Inverse of IP)
FP = [
    40, 8, 48, 16, 56, 24, 64, 32,
    39, 7, 47, 15, 55, 23, 63, 31,
    38, 6, 46, 14, 54, 22, 62, 30,
    37, 5, 45, 13, 53, 21, 61, 29,
    36, 4, 44, 12, 52, 20, 60, 28,
    35, 3, 43, 11, 51, 19, 59, 27,
    34, 2, 42, 10, 50, 18, 58, 26,
    33, 1, 41, 9, 49, 17, 57, 25
]

# Expansion Table (32 -> 48 bits)
E = [
    32, 1, 2, 3, 4, 5,
    4, 5, 6, 7, 8, 9,
    8, 9, 10, 11, 12, 13,
    12, 13, 14, 15, 16, 17,
    16, 17, 18, 19, 20, 21,
    20, 21, 22, 23, 24, 25,
    24, 25, 26, 27, 28, 29,
    28, 29, 30, 31, 32, 1
]

# Permutation Table (32 -> 32 bits after S-Boxes)
P = [
    16, 7, 20, 21,
    29, 12, 28, 17,
    1, 15, 23, 26,
    5, 18, 31, 10,
    2, 8, 24, 14,
    32, 27, 3, 9,
    19, 13, 30, 6,
    22, 11, 4, 25
]

# PC1 (Permuted Choice 1 for Key Schedule: 64 -> 56 bits)
PC1 = [
    57, 49, 41, 33, 25, 17, 9,
    1, 58, 50, 42, 34, 26, 18,
    10, 2, 59, 51, 43, 35, 27,
    19, 11, 3, 60, 52, 44, 36,
    63, 55, 47, 39, 31, 23, 15,
    7, 62, 54, 46, 38, 30, 22,
    14, 6, 61, 53, 45, 37, 29,
    21, 13, 5, 28, 20, 12, 4
]

# PC2 (Permuted Choice 2 for Key Schedule: 56 -> 48 bits)
PC2 = [
    14, 17, 11, 24, 1, 5,
    3, 28, 15, 6, 21, 10,
    23, 19, 12, 4, 26, 8,
    16, 7, 27, 20, 13, 2,
    41, 52, 31, 37, 47, 55,
    30, 40, 51, 45, 33, 48,
    44, 49, 39, 56, 34, 53,
    46, 42, 50, 36, 29, 32
]

# Key Shift Schedule
SHIFTS = [1, 1, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 1]

# S-Boxes (8 boxes, each maps 6 bits -> 4 bits)
S_BOX = [
    # S1
    [
        [14, 4, 13, 1, 2, 15, 11, 8, 3, 10, 6, 12, 5, 9, 0, 7],
        [0, 15, 7, 4, 14, 2, 13, 1, 10, 6, 12, 11, 9, 5, 3, 8],
        [4, 1, 14, 8, 13, 6, 2, 11, 15, 12, 9, 7, 3, 10, 5, 0],
        [15, 12, 8, 2, 4, 9, 1, 7, 5, 11, 3, 14, 10, 0, 6, 13]
    ],
    # S2
    [
        [15, 1, 8, 14, 6, 11, 3, 4, 9, 7, 2, 13, 12, 0, 5, 10],
        [3, 13, 4, 7, 15, 2, 8, 14, 12, 0, 1, 10, 6, 9, 11, 5],
        [0, 14, 7, 11, 10, 4, 13, 1, 5, 8, 12, 6, 9, 3, 2, 15],
        [13, 8, 10, 1, 3, 15, 4, 2, 11, 6, 7, 12, 0, 5, 14, 9]
    ],
    # S3
    [
        [10, 0, 9, 14, 6, 3, 15, 5, 1, 13, 12, 7, 11, 4, 2, 8],
        [13, 7, 0, 9, 3, 4, 6, 10, 2, 8, 5, 14, 12, 11, 15, 1],
        [13, 6, 4, 9, 8, 15, 3, 0, 11, 1, 2, 12, 5, 10, 14, 7],
        [1, 10, 13, 0, 6, 9, 8, 7, 4, 15, 14, 3, 11, 5, 2, 12]
    ],
    # S4
    [
        [7, 13, 14, 3, 0, 6, 9, 10, 1, 2, 8, 5, 11, 12, 4, 15],
        [13, 8, 11, 5, 6, 15, 0, 3, 4, 7, 2, 12, 1, 10, 14, 9],
        [10, 6, 9, 0, 12, 11, 7, 13, 15, 1, 3, 14, 5, 2, 8, 4],
        [3, 15, 0, 6, 10, 1, 13, 8, 9, 4, 5, 11, 12, 7, 2, 14]
    ],
    # S5
    [
        [2, 12, 4, 1, 7, 10, 11, 6, 8, 5, 3, 15, 13, 0, 14, 9],
        [14, 11, 2, 12, 4, 7, 13, 1, 5, 0, 15, 10, 3, 9, 8, 6],
        [4, 2, 1, 11, 10, 13, 7, 8, 15, 9, 12, 5, 6, 3, 0, 14],
        [11, 8, 12, 7, 1, 14, 2, 13, 6, 15, 0, 9, 10, 4, 5, 3]
    ],
    # S6
    [
        [12, 1, 10, 15, 9, 2, 6, 8, 0, 13, 3, 4, 14, 7, 5, 11],
        [10, 15, 4, 2, 7, 12, 9, 5, 6, 1, 13, 14, 0, 11, 3, 8],
        [9, 14, 15, 5, 2, 8, 12, 3, 7, 0, 4, 10, 1, 13, 11, 6],
        [4, 3, 2, 12, 9, 5, 15, 10, 11, 14, 1, 7, 6, 0, 8, 13]
    ],
    # S7
    [
        [4, 11, 2, 14, 15, 0, 8, 13, 3, 12, 9, 7, 5, 10, 6, 1],
        [13, 0, 11, 7, 4, 9, 1, 10, 14, 3, 5, 12, 2, 15, 8, 6],
        [1, 4, 11, 13, 12, 3, 7, 14, 10, 15, 6, 8, 0, 5, 9, 2],
        [6, 11, 13, 8, 1, 4, 10, 7, 9, 5, 0, 15, 14, 2, 3, 12]
    ],
    # S8
    [
        [13, 2, 8, 4, 6, 15, 11, 1, 10, 9, 3, 14, 5, 0, 12, 7],
        [1, 15, 13, 8, 10, 3, 7, 4, 12, 5, 6, 11, 0, 14, 9, 2],
        [7, 11, 4, 1, 9, 12, 14, 2, 0, 6, 10, 13, 15, 3, 5, 8],
        [2, 1, 14, 7, 4, 10, 8, 13, 15, 12, 9, 0, 3, 5, 6, 11]
    ]
]

# --- Helper Functions ---

def hex_to_bin(hex_str):
    """Converts hex string to binary string (padded to length * 4)."""
    scale = 16 
    num_of_bits = len(hex_str) * 4
    return bin(int(hex_str, scale))[2:].zfill(num_of_bits)

def bin_to_hex(bin_str):
    """Converts binary string to hex string."""
    num = int(bin_str, 2)
    hex_str = hex(num)[2:].upper()
    return hex_str.zfill(len(bin_str) // 4)

def permute(bits, table, n):
    """Permutes bits using table. n is output length."""
    res = ""
    for i in range(n):
        res += bits[table[i] - 1]
    return res

def xor(bits1, bits2):
    """XOR two binary strings of same length."""
    res = ""
    for i in range(len(bits1)):
        res += "1" if bits1[i] != bits2[i] else "0"
    return res

def left_shift(bits, n):
    """Circular left shift."""
    return bits[n:] + bits[:n]

def generate_keys_detailed(key_hex):
    """Generates 16 round keys with detailed steps."""
    key_bin = hex_to_bin(key_hex)
    key_bin = key_bin.ljust(64, '0')[:64]
    
    # 1. PC1 Permutation
    key_56 = permute(key_bin, PC1, 56)
    
    # 2. Split into C and D
    c = key_56[:28]
    d = key_56[28:]
    
    schedule = []
    
    for i in range(16):
        c_prev = c
        d_prev = d
        
        # 3. Left Shift
        shift = SHIFTS[i]
        c = left_shift(c, shift)
        d = left_shift(d, shift)
        
        # 4. PC2 Permutation
        cd = c + d
        k = permute(cd, PC2, 48)
        
        schedule.append({
            'round': i + 1,
            'c_prev': c_prev,
            'd_prev': d_prev,
            'shift': shift,
            'c_new': c,
            'd_new': d,
            'k_bin': k,
            'k_hex': bin_to_hex(k)
        })
        
    return schedule

# --- DES Encrypt Verbose ---

def des_encrypt_verbose(plaintext, key):
    steps = []
    
    # 1. Prepare Input
    # Ensure plaintext is 16 hex chars (64 bits). 
    # For this demo, we assume inputs are sanitized or single block.
    # In real EC, we'd pad. Here we just pad with 0s if short.
    pt_hex = plaintext.replace(" ", "").upper().ljust(16, '0')[:16]
    key_hex = key.replace(" ", "").upper().ljust(16, '0')[:16]
    
    pt_bin = hex_to_bin(pt_hex)
    key_schedule = generate_keys_detailed(key_hex)
    round_keys_bin = [s['k_bin'] for s in key_schedule]
    
    steps.append({
        'step': 'init',
        'description': 'Stato Iniziale e Generazione Chiavi',
        'input_bin': pt_bin,
        'input_hex': pt_hex,
        'key_hex': key_hex,
        'round_keys_hex': [bin_to_hex(k) for k in round_keys_bin]
    })
    
    # 2. Initial Permutation (IP)
    ip_res = permute(pt_bin, IP, 64)
    l = ip_res[:32]
    r = ip_res[32:]
    
    steps.append({
        'step': 'ip',
        'description': 'Initial Permutation (IP)',
        'state_hex': bin_to_hex(ip_res),
        'l_bin': l,
        'r_bin': r,
        'l_hex': bin_to_hex(l),
        'r_hex': bin_to_hex(r)
    })
    
    # 3. Rounds
    for i in range(16):
        round_steps = {}
        
        prev_l = l
        prev_r = r
        
        # Expansion
        r_expanded = permute(r, E, 48)
        
        # XOR with Key
        k = round_keys_bin[i]
        xor_res = xor(r_expanded, k)
        
        # S-Box Substitution
        sbox_out_bin = ""
        sbox_details = []
        
        for j in range(8):
            chunk = xor_res[j*6 : (j+1)*6]
            row_bin = chunk[0] + chunk[5]
            col_bin = chunk[1:5]
            
            row = int(row_bin, 2)
            col = int(col_bin, 2)
            
            val = S_BOX[j][row][col]
            val_bin = bin(val)[2:].zfill(4)
            sbox_out_bin += val_bin
            
            sbox_details.append({
                'box': j+1,
                'input': chunk,
                'row': row,
                'col': col,
                'output': val_bin
            })
            
        # Permutation P
        f_res = permute(sbox_out_bin, P, 32)
        
        # XOR with L
        new_r = xor(prev_l, f_res)
        new_l = prev_r # Standard Feistel: L(i) = R(i-1)
        
        round_steps = {
            'round': i + 1,
            'l_prev': bin_to_hex(prev_l),
            'r_prev': bin_to_hex(prev_r),
            'key_round': bin_to_hex(k),
            'expansion': bin_to_hex(r_expanded),
            'xor_key': bin_to_hex(xor_res),
            'sbox_in': bin_to_hex(xor_res),
            'sbox_details': sbox_details,
            'sbox_out': bin_to_hex(sbox_out_bin),
            'p_perm': bin_to_hex(f_res),
            'l_new': bin_to_hex(new_l),
            'r_new': bin_to_hex(new_r),
            'key_schedule': key_schedule[i]
        }
        
        steps.append({
            'step': 'round',
            'round_num': i + 1,
            'details': round_steps
        })
        
        l = new_l
        r = new_r
        
    # 4. Final Swap (Standard DES swaps L and R after last round before FP, 
    # but strictly speaking R16 becomes L(out) and L16 becomes R(out) which is actually a swap compared to Li=Ri-1 formula.
    # In standard description: Pre-output = R16 L16.
    
    final_res_pre_fp = r + l # R16 L16
    
    # 5. Final Permutation (FP)
    ciphertext_bin = permute(final_res_pre_fp, FP, 64)
    ciphertext_hex = bin_to_hex(ciphertext_bin)
    
    steps.append({
        'step': 'fp',
        'description': 'Final Permutation (FP)',
        'pre_fp_hex': bin_to_hex(final_res_pre_fp),
        'ciphertext_hex': ciphertext_hex,
        'ciphertext_bin': ciphertext_bin
    })
    
    return {
        'input_hex': pt_hex,
        'key_hex': key_hex,
        'final_hex': ciphertext_hex,
        'steps': steps
    }
