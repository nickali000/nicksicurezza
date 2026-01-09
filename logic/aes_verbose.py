
# AES Constants
s_box = (
    0x63, 0x7C, 0x77, 0x7B, 0xF2, 0x6B, 0x6F, 0xC5, 0x30, 0x01, 0x67, 0x2B, 0xFE, 0xD7, 0xAB, 0x76,
    0xCA, 0x82, 0xC9, 0x7D, 0xFA, 0x59, 0x47, 0xF0, 0xAD, 0xD4, 0xA2, 0xAF, 0x9C, 0xA4, 0x72, 0xC0,
    0xB7, 0xFD, 0x93, 0x26, 0x36, 0x3F, 0xF7, 0xCC, 0x34, 0xA5, 0xE5, 0xF1, 0x71, 0xD8, 0x31, 0x15,
    0x04, 0xC7, 0x23, 0xC3, 0x18, 0x96, 0x05, 0x9A, 0x07, 0x12, 0x80, 0xE2, 0xEB, 0x27, 0xB2, 0x75,
    0x09, 0x83, 0x2C, 0x1A, 0x1B, 0x6E, 0x5A, 0xA0, 0x52, 0x3B, 0xD6, 0xB3, 0x29, 0xE3, 0x2F, 0x84,
    0x53, 0xD1, 0x00, 0xED, 0x20, 0xFC, 0xB1, 0x5B, 0x6A, 0xCB, 0xBE, 0x39, 0x4A, 0x4C, 0x58, 0xCF,
    0xD0, 0xEF, 0xAA, 0xFB, 0x43, 0x4D, 0x33, 0x85, 0x45, 0xF9, 0x02, 0x7F, 0x50, 0x3C, 0x9F, 0xA8,
    0x51, 0xA3, 0x40, 0x8F, 0x92, 0x9D, 0x38, 0xF5, 0xBC, 0xB6, 0xDA, 0x21, 0x10, 0xFF, 0xF3, 0xD2,
    0xCD, 0x0C, 0x13, 0xEC, 0x5F, 0x97, 0x44, 0x17, 0xC4, 0xA7, 0x7E, 0x3D, 0x64, 0x5D, 0x19, 0x73,
    0x60, 0x81, 0x4F, 0xDC, 0x22, 0x2A, 0x90, 0x88, 0x46, 0xEE, 0xB8, 0x14, 0xDE, 0x5E, 0x0B, 0xDB,
    0xE0, 0x32, 0x3A, 0x0A, 0x49, 0x06, 0x24, 0x5C, 0xC2, 0xD3, 0xAC, 0x62, 0x91, 0x95, 0xE4, 0x79,
    0xE7, 0xC8, 0x37, 0x6D, 0x8D, 0xD5, 0x4E, 0xA9, 0x6C, 0x56, 0xF4, 0xEA, 0x65, 0x7A, 0xAE, 0x08,
    0xBA, 0x78, 0x25, 0x2E, 0x1C, 0xA6, 0xB4, 0xC6, 0xE8, 0xDD, 0x74, 0x1F, 0x4B, 0xBD, 0x8B, 0x8A,
    0x70, 0x3E, 0xB5, 0x66, 0x48, 0x03, 0xF6, 0x0E, 0x61, 0x35, 0x57, 0xB9, 0x86, 0xC1, 0x1D, 0x9E,
    0xE1, 0xF8, 0x98, 0x11, 0x69, 0xD9, 0x8E, 0x94, 0x9B, 0x1E, 0x87, 0xE9, 0xCE, 0x55, 0x28, 0xDF,
    0x8C, 0xA1, 0x89, 0x0D, 0xBF, 0xE6, 0x42, 0x68, 0x41, 0x99, 0x2D, 0x0F, 0xB0, 0x54, 0xBB, 0x16,
)

r_con = (
    0x00, 0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40,
    0x80, 0x1B, 0x36, 0x6C, 0xD8, 0xAB, 0x4D, 0x9A,
    0x2F, 0x5E, 0xBC, 0x63, 0xC6, 0x97, 0x35, 0x6A,
    0xD4, 0xB3, 0x7D, 0xFA, 0xEF, 0xC5, 0x91, 0x39,
)

def text2matrix(text):
    matrix = []
    for i in range(16):
        byte = (text >> (8 * (15 - i))) & 0xFF
        if i % 4 == 0:
            matrix.append([byte])
        else:
            matrix[i // 4].append(byte)
    return matrix

def matrix2text(matrix):
    text = 0
    for i in range(4):
        for j in range(4):
            text |= (matrix[i][j] << (120 - 8 * (4 * i + j)))
    return text

def pad(text_bytes):
    padding_len = 16 - (len(text_bytes) % 16)
    return text_bytes + bytes([padding_len] * padding_len)

def sub_bytes(s):
    for i in range(4):
        for j in range(4):
            s[i][j] = s_box[s[i][j]]

def shift_rows(s):
    s[0][1], s[1][1], s[2][1], s[3][1] = s[1][1], s[2][1], s[3][1], s[0][1]
    s[0][2], s[1][2], s[2][2], s[3][2] = s[2][2], s[3][2], s[0][2], s[1][2]
    s[0][3], s[1][3], s[2][3], s[3][3] = s[3][3], s[0][3], s[1][3], s[2][3]

def mix_single_column(a):
    # Galois Field (2^8) Multiplication of two Bytes
    def gmul(a, b):
        p = 0
        for i in range(8):
            if b & 1:
                p ^= a
            hi_bit_set = a & 0x80
            a <<= 1
            if hi_bit_set:
                a ^= 0x1B
            b >>= 1
        return p & 0xFF

    t = a[0] ^ a[1] ^ a[2] ^ a[3]
    u = a[0]
    a[0] ^= t ^ gmul(a[0] ^ a[1], 2)
    a[1] ^= t ^ gmul(a[1] ^ a[2], 2)
    a[2] ^= t ^ gmul(a[2] ^ a[3], 2)
    a[3] ^= t ^ gmul(a[3] ^ u, 2)

def mix_columns(s):
    for i in range(4):
        mix_single_column(s[i])

def add_round_key(s, k):
    for i in range(4):
        for j in range(4):
            s[i][j] ^= k[i][j]

def expand_key(master_key):
    # This example assumes 128-bit key
    key_columns = text2matrix(master_key)
    i = 1
    while len(key_columns) < 44:
        word = list(key_columns[-1])
        if len(key_columns) % 4 == 0:
            word.append(word.pop(0))  # RotWord
            word = [s_box[b] for b in word]  # SubWord
            word[0] ^= r_con[i]
            i += 1
        
        last_word = key_columns[-4]
        new_word = []
        for x in range(4):
            new_word.append(last_word[x] ^ word[x])
        key_columns.append(new_word)
    return key_columns

def bytes_to_matrix(text_bytes):
    # Takes 16 bytes and makes a 4x4 matrix (column-major order usually in AES papers, 
    # but here let's stick to standard convenient representation: row-major or matching key expansion)
    # Standard FIPS 197 says:
    # "The input state is... 4x4 array of bytes."
    # Input: in0, in1, ... in15
    # State:
    # in0  in4  in8   in12
    # in1  in5  in9   in13
    # in2  in6  in10  in14
    # in3  in7  in11  in15
    
    matrix = [[0]*4 for _ in range(4)]
    for i in range(16):
        matrix[i % 4][i // 4] = text_bytes[i]
    return matrix

def matrix_to_hex(matrix):
    # Convert state matrix back to linear hex string for display
    # Inverse of bytes_to_matrix
    out = []
    for c in range(4):
        for r in range(4):
            out.append(matrix[r][c])
    return out

def copy_state(s):
    return [row[:] for row in s]

def encrypt_block_verbose(block_bytes, key_schedule):
    # block_bytes should be 16 bytes
    # key_schedule should be list of 44 words (each word is list of 4 bytes)
    # But `expand_key` returns 44 columns.
    
    steps = []
    
    state = bytes_to_matrix(block_bytes)
    
    # helper to get round key matrix
    def get_round_key(round_idx):
        # 4 columns per round
        start = round_idx * 4
        # key_schedule is 44 columns [col0, col1, ...]
        # We need to pivot to 4x4
        # col0: [r0, r1, r2, r3]
        # matrix:
        # c0r0 c1r0 c2r0 c3r0
        k = [[0]*4 for _ in range(4)]
        for c in range(4):
            col = key_schedule[start + c]
            for r in range(4):
                k[r][c] = col[r]
        return k

    round_key = get_round_key(0)
    
    steps.append({
        "round": 0,
        "step": "init",
        "description": "Initial State",
        "state": copy_state(state),
        "key": copy_state(round_key)
    })
    
    add_round_key(state, round_key)
    
    steps.append({
        "round": 0,
        "step": "add_round_key",
        "description": "Add Round Key (Round 0)",
        "state": copy_state(state),
        "key": copy_state(round_key)
    })
    
    for round_num in range(1, 10):
        sub_bytes(state)
        steps.append({"round": round_num, "step": "sub_bytes", "state": copy_state(state)})
        
        shift_rows(state)
        steps.append({"round": round_num, "step": "shift_rows", "state": copy_state(state)})
        
        mix_columns(state)
        steps.append({"round": round_num, "step": "mix_columns", "state": copy_state(state)})
        
        round_key = get_round_key(round_num)
        add_round_key(state, round_key)
        steps.append({"round": round_num, "step": "add_round_key", "state": copy_state(state), "key": copy_state(round_key)})

    # Final Round
    sub_bytes(state)
    steps.append({"round": 10, "step": "sub_bytes", "state": copy_state(state)})
    
    shift_rows(state)
    steps.append({"round": 10, "step": "shift_rows", "state": copy_state(state)})
    
    round_key = get_round_key(10)
    add_round_key(state, round_key)
    steps.append({"round": 10, "step": "add_round_key", "state": copy_state(state), "key": copy_state(round_key)})
    
    return steps

def aes_encrypt_verbose(plaintext_str, key_str):
    # Prepare key
    # Simple logic: pad or truncate key to 16 bytes
    key_bytes = key_str.encode('utf-8')
    if len(key_bytes) > 16:
        key_bytes = key_bytes[:16]
    elif len(key_bytes) < 16:
        key_bytes = pad(key_bytes)[:16]
        
    # Prepare plaintext (handle multiple blocks?)
    # For demo, let's just do the first block or single block.
    # The prompt says "inserendo i dati di ingresso testo... esegue tutti i passi"
    # Usually visualized on one block.
    input_bytes = plaintext_str.encode('utf-8')
    # Pad to 16 bytes (or multiple)
    input_bytes = pad(input_bytes)
    
    # Run key expansion
    # We need master key as integer or handle bytes properly
    # text2matrix takes int? No, the original helper was a bit weird.
    # Let's rewrite expand_key to handle bytes directly more cleanly or adapt.
    
    # Adapting expand_key input:
    # Need to convert key_bytes to int per byte logic if we use that existing expand_key?
    # Actually, `text2matrix` expects a large integer `text`.
    # Let's just fix `expand_key` to take `key_bytes` directly.
    
    # Fix in expand_key call:
    key_int = int.from_bytes(key_bytes, byteorder='big')
    key_schedule = expand_key(key_int) 
    
    # Process blocks
    all_blocks_steps = []
    
    # Just take first block for the visualizer? Or do all?
    # User might input short text.
    # Let's do all blocks.
    
    num_blocks = len(input_bytes) // 16
    for i in range(num_blocks):
        block = input_bytes[i*16 : (i+1)*16]
        block_steps = encrypt_block_verbose(block, key_schedule)
        all_blocks_steps.append(block_steps)
        
    return {
        "key_hex": key_bytes.hex(),
        "input_hex": input_bytes.hex(),
        "blocks": all_blocks_steps
    }
