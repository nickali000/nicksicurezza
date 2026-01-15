import os
import hashlib
import time

def get_system_entropy(num_bytes=16):
    """
    Retrieves random bytes from the OS secure random source (e.g. /dev/urandom).
    This is considered a TRNG (or CSPRNG seeded by TRNG) source.
    """
    random_bytes = os.urandom(num_bytes)
    return {
        "hex": random_bytes.hex(),
        "bytes_int": [b for b in random_bytes], # List of integers for visualization
        "source": "OS Random Source (Hardware Noise/Interrupts)"
    }

def process_user_entropy(mouse_data):
    """
    Processes a list of mouse events (x, y, timestamp) to mix into an entropy pool.
    This simulates how a TRNG might harvest entropy from physical events.
    """
    # 1. Serialize input data
    raw_data = ""
    for event in mouse_data:
        raw_data += f"{event['x']},{event['y']},{event['t']}|"
    
    # 2. "Mix" into a pool (Simulated by Hashing)
    # real kernels use LFSRs or other mixing functions, SHA256 is good for demo
    pool_hash = hashlib.sha256(raw_data.encode('utf-8')).hexdigest()
    
    return {
        "entropy_pool_hash": pool_hash,
        "event_count": len(mouse_data),
        "raw_data_sample": raw_data[:50] + "..." if len(raw_data) > 50 else raw_data
    }
