import random

# Simple Point class for better representation
class Point:
    def __init__(self, x, y):
        self.x = x
        self.y = y
    
    def __repr__(self):
        if self.x is None:
            return "O (Infinito)"
        return f"({self.x}, {self.y})"
        
    def to_dict(self):
        if self.x is None:
            return {"x": None, "y": None, "str": "O"}
        return {"x": self.x, "y": self.y, "str": f"({self.x}, {self.y})"}

def mod_inverse(a, m):
    if a == 0:
        return 0
    lm, hm = 1, 0
    low, high = a % m, m
    while low > 1:
        ratio = high // low
        nm, new = hm - ratio * lm, high - ratio * low
        lm, low, hm, high = nm, new, lm, low
    return lm % m

def ecc_setup_parameters():
    # Use a small curve for educational purposes
    # y^2 = x^3 + ax + b mod p
    # Curve: secp256k1 is too big.
    # Let's use a small one: y^2 = x^3 + 2x + 2 mod 17
    # Calculations:
    # x=5: 125 + 10 + 2 = 137. 137 % 17 = 1. y^2=1 -> y=1, 16. Points (5,1), (5,16)
    
    p = 17
    a = 2
    b = 2
    
    # Generator point
    Gx = 5
    Gy = 1
    
    return {
        "p": p,
        "a": a,
        "b": b,
        "G": {"x": Gx, "y": Gy, "str": f"({Gx}, {Gy})"}
    }

def get_curve_points(p, a, b):
    points = []
    # Brute force check for all x in 0..p-1
    for x in range(p):
        rhs = (x**3 + a*x + b) % p
        # Check if rhs is a quadratic residue (y^2 = rhs)
        for y in range(p):
            if (y**2) % p == rhs:
                points.append({"x": x, "y": y})
    return points
    
def point_add(P, Q, a, p):
    # Returns R = P + Q and a step description
    if P.x is None: return Q, "P è infinito, risultato Q"
    if Q.x is None: return P, "Q è infinito, risultato P"
    
    if P.x == Q.x and P.y != Q.y:
        return Point(None, None), "P e Q sono opposti, risultato Infinito"
        
    if P.x == Q.x and P.y == Q.y:
        # Point doubling
        if P.y == 0:
            return Point(None, None), "Tangente verticale, risultato Infinito"
            
        # lambda = (3x^2 + a) * (2y)^-1 mod p
        num = (3 * P.x**2 + a)
        den = (2 * P.y)
        inv = mod_inverse(den, p)
        lam = (num * inv) % p
        desc = f"Raddoppio: λ = ({num} * {inv}) mod {p} = {lam}"
    else:
        # Point addition
        # lambda = (y2 - y1) * (x2 - x1)^-1 mod p
        num = (Q.y - P.y)
        den = (Q.x - P.x)
        inv = mod_inverse(den % p, p)
        lam = (num * inv) % p
        desc = f"Addizione: λ = ({num} * {inv}) mod {p} = {lam}"
        
    x3 = (lam**2 - P.x - Q.x) % p
    y3 = (lam * (P.x - x3) - P.y) % p
    
    return Point(x3, y3), desc

def scalar_multiply_verbose(k, G_dict, a, p):
    G = Point(G_dict['x'], G_dict['y'])
    current = G
    result = Point(None, None) # Infinity
    
    steps = []
    
    # Double and Add algorithm visualization
    # Or simple addition loop for small k to be clearer for beginners?
    # For k ~ 100, simple loop is too long. Double and add is better standard.
    # But for educational, showing G+G = 2G, +G = 3G might be intuitive.
    # Let's use simple iterative adding for k < 20, or Double-and-Add generally.
    # Let's stick to simple addition for visual clarity: P, 2P, 3P...
    
    steps.append({
        "step": "Inizio",
        "description": f"Calcolo {k} * G. Partiamo da G = {G}."
    })
    
    # Binary expansion (Double and Add) implementation
    # R0 = Infinity, R1 = P.
    # This is more efficient but harder to visualize linearly 1G, 2G, 3G
    
    # Let's do simple naive addition for k up to 10 for demo clarity
    # If k is large, we just show start and end?
    # Let's effectively force k to be small in generation or handle it.
    
    temp_result = Point(None, None)
    
    # Standard Double-and-Add Logic matching binary string
    bin_k = bin(k)[2:] # e.g. '101' for 5
    steps.append({"step": "Conversione Binaria", "description": f"k = {k} in binario è {bin_k}"})
    
    temp_pt = G
    
    for i, bit in enumerate(reversed(bin_k)):
        # If bit is 1, add temp_pt to result
        if bit == '1':
            old_res = temp_result
            temp_result, desc = point_add(temp_result, temp_pt, a, p)
            steps.append({
                "step": f"Bit {i} è 1: Aggiungi",
                "description": f"Risultato = Risultato + {temp_pt}. {desc} -> {temp_result}"
            })
        
        # Double temp_pt for next bit
        old_pt = temp_pt
        temp_pt, desc = point_add(temp_pt, temp_pt, a, p)
        if i < len(bin_k) - 1: # Don't need to double on last step strictly speaking but good for completeness
             steps.append({
                "step": f"Raddoppio Base (2^{i}->2^{i+1})",
                "description": f"Base = {old_pt} + {old_pt}. {desc} -> {temp_pt}"
            })
            
    final_point = temp_result
    
    return {
        "result": final_point.to_dict(),
        "steps": steps
    }

def ecc_generate_keys(p, a, G_dict):
    # Choose random private key d
    # Order of G in our small curve might be small. 
    # For safety in this demo, let's keep d small (< 20)
    d = random.randint(2, 16)
    
    res = scalar_multiply_verbose(d, G_dict, a, p)
    
    return {
        "private_d": d,
        "public_Q": res['result'],
        "steps": res['steps']
    }

def ecc_shared_secret(private_d, public_Q_dict, p, a):
    # S = d * Q
    res = scalar_multiply_verbose(private_d, public_Q_dict, a, p)
    
    return {
        "shared_S": res['result'],
        "steps": res['steps']
    }
