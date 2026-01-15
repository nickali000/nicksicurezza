from flask import Flask, render_template, request, jsonify
from logic.aes_verbose import aes_encrypt_verbose
from logic.des_verbose import des_encrypt_verbose
from logic.row_transposition_verbose import row_transposition_encrypt_verbose
from logic.rail_fence_verbose import rail_fence_encrypt_verbose
from logic.otp_verbose import otp_encrypt_verbose
from logic.vernam_verbose import vernam_encrypt_verbose
from logic.vigenere_verbose import vigenere_encrypt_verbose
from logic.hill_verbose import hill_encrypt_verbose
from logic.playfair_verbose import playfair_encrypt_verbose
from logic.monoalphabetic_verbose import monoalphabetic_encrypt_verbose
from logic.caesar_verbose import caesar_encrypt_verbose
from logic.rsa_verbose import generate_keypair, rsa_encrypt_verbose, rsa_decrypt_verbose
from logic.rsa_verbose import generate_keypair, rsa_encrypt_verbose, rsa_decrypt_verbose
from logic.diffie_hellman_verbose import diffie_hellman_step1_setup, diffie_hellman_step2_keys, diffie_hellman_step3_secret
from logic.elgamal_verbose import generate_keys_elgamal, elgamal_encrypt_verbose, elgamal_decrypt_verbose
from logic.dsa_verbose import dsa_setup_parameters, dsa_generate_keys, dsa_sign_verbose, dsa_verify_verbose
from logic.ecc_verbose import ecc_setup_parameters, ecc_generate_keys, ecc_shared_secret, get_curve_points
from logic.hmac_verbose import hmac_verbose
from logic.prng_verbose import lcg_generate
from logic.trng_verbose import get_system_entropy, process_user_entropy
from logic.ipsec_verbose import get_ipsec_structure

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

# ... existing routes ...

@app.route('/ipsec')
def ipsec_route():
    return render_template('ipsec.html')

@app.route('/ipsec_structure', methods=['POST'])
def ipsec_structure_route():
    data = request.json
    try:
        protocol = data.get('protocol', 'ah')
        mode = data.get('mode', 'transport')
        result = get_ipsec_structure(protocol, mode)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ... existing routes ...

@app.route('/trng')
def trng_route():
    return render_template('trng.html')

@app.route('/trng_system', methods=['POST'])
def trng_system_route():
    try:
        result = get_system_entropy(16)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/trng_mix', methods=['POST'])
def trng_mix_route():
    data = request.json
    mouse_data = data.get('mouse_data', [])
    try:
        result = process_user_entropy(mouse_data)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/prng')
def prng_route():
    return render_template('prng.html')

@app.route('/prng_generate', methods=['POST'])
def prng_generate_route():
    data = request.json
    try:
        m = int(data.get('m'))
        a = int(data.get('a'))
        c = int(data.get('c'))
        seed = int(data.get('seed'))
        n = int(data.get('n', 50))
        
        result = lcg_generate(m, a, c, seed, n)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/hmac')
def hmac_route():
    return render_template('hmac.html')

@app.route('/hash')
def hash_route():
    return render_template('hash.html')

@app.route('/sha512')
def sha512_route():
    return render_template('sha512.html')

@app.route('/x509')
def x509():
    return render_template('x509.html')

@app.route('/kerberos')
def kerberos_route():
    return render_template('kerberos.html')

@app.route('/pgp')
def pgp():
    return render_template('pgp.html')

@app.route('/firewall')
def firewall():
    return render_template('firewall.html')

@app.route('/ssh')
def ssh():
    return render_template('ssh.html')

@app.route('/tls')
def tls_route():
    return render_template('tls.html')

@app.route('/md5')
def md5_route():
    return render_template('md5.html')

@app.route('/hmac_calculate', methods=['POST'])
def hmac_calculate_route():
    data = request.json
    try:
        key = data.get('key', '')
        message = data.get('message', '')
        
        result = hmac_verbose(key, message)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/aes')
def aes():
    return render_template('aes.html')

@app.route('/des')
def des():
    return render_template('des.html')

@app.route('/encrypt', methods=['POST'])
def encrypt():
    data = request.json
    text = data.get('text', '')
    key = data.get('key', '')
    
    if not text or not key:
        return jsonify({"error": "Missing text or key"}), 400
        
    try:
        result = aes_encrypt_verbose(text, key)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/encrypt_des', methods=['POST'])
def encrypt_des():
    data = request.json
    text = data.get('text', '')
    key = data.get('key', '')
    
    if not text or not key:
        return jsonify({"error": "Missing text or key"}), 400
        
    try:
        result = des_encrypt_verbose(text, key)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/row_transposition')
def row_transposition():
    return render_template('row_transposition.html')

@app.route('/encrypt_row_transposition', methods=['POST'])
def encrypt_row_transposition():
    data = request.json
    text = data.get('text', '')
    key = data.get('key', '')
    
    if not text or not key:
        return jsonify({"error": "Missing text or key"}), 400
        
    try:
        result = row_transposition_encrypt_verbose(text, key)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/rail_fence')
def rail_fence():
    return render_template('rail_fence.html')

@app.route('/encrypt_rail_fence', methods=['POST'])
def encrypt_rail_fence():
    data = request.json
    text = data.get('text', '')
    rails = data.get('rails', 3)
    
    if not text:
        return jsonify({"error": "Missing text"}), 400
        
    try:
        result = rail_fence_encrypt_verbose(text, rails)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/otp')
def otp():
    return render_template('otp.html')

@app.route('/encrypt_otp', methods=['POST'])
def encrypt_otp():
    data = request.json
    text = data.get('text', '')
    key = data.get('key', '')
    
    if not text:
        return jsonify({"error": "Missing text"}), 400
        
    try:
        result = otp_encrypt_verbose(text, key)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/vernam')
def vernam():
    return render_template('vernam.html')

@app.route('/encrypt_vernam', methods=['POST'])
def encrypt_vernam():
    data = request.json
    text = data.get('text', '')
    key = data.get('key', '')
    
    if not text:
        return jsonify({"error": "Missing text"}), 400
        
    try:
        result = vernam_encrypt_verbose(text, key)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/vigenere')
def vigenere():
    return render_template('vigenere.html')

@app.route('/encrypt_vigenere', methods=['POST'])
def encrypt_vigenere():
    data = request.json
    text = data.get('text', '')
    key = data.get('key', '')
    
    if not text or not key:
        return jsonify({"error": "Missing text or key"}), 400
        
    try:
        result = vigenere_encrypt_verbose(text, key)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/hill')
def hill():
    return render_template('hill.html')

@app.route('/encrypt_hill', methods=['POST'])
def encrypt_hill():
    data = request.json
    text = data.get('text', '')
    key = data.get('key', '')
    
    if not text or not key:
        return jsonify({"error": "Missing text or key"}), 400
        
    try:
        result = hill_encrypt_verbose(text, key)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/playfair')
def playfair():
    return render_template('playfair.html')

@app.route('/encrypt_playfair', methods=['POST'])
def encrypt_playfair():
    data = request.json
    text = data.get('text', '')
    key = data.get('key', '')
    
    if not text or not key:
        return jsonify({"error": "Missing text or key"}), 400
        
    try:
        result = playfair_encrypt_verbose(text, key)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/monoalphabetic')
def monoalphabetic():
    return render_template('monoalphabetic.html')

@app.route('/encrypt_monoalphabetic', methods=['POST'])
def encrypt_monoalphabetic():
    data = request.json
    text = data.get('text', '')
    key = data.get('key', '') # Optional, defaults to empty in logic if needed, but logic expects key for keyword mix
    
    try:
        result = monoalphabetic_encrypt_verbose(text, key)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/caesar')
def caesar():
    return render_template('caesar.html')

@app.route('/encrypt_caesar', methods=['POST'])
def encrypt_caesar():
    data = request.json
    text = data.get('text', '')
    shift = data.get('shift', 3) # Default shift 3
    
    try:
        result = caesar_encrypt_verbose(text, shift)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/rsa')
def rsa():
    return render_template('rsa.html')

@app.route('/rsa_generate_keys', methods=['POST'])
def rsa_generate_keys():
    data = request.json
    try:
        p = int(data.get('p'))
        q = int(data.get('q'))
        key_data = generate_keypair(p, q)
        return jsonify({
            "public_key": key_data['public'],
            "private_key": key_data['private'],
            "phi": key_data['phi'],
            "steps": key_data['steps']
        })
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/rsa_encrypt', methods=['POST'])
def rsa_encrypt_route():
    data = request.json
    text = data.get('text', '')
    e_val = int(data.get('e'))
    n_val = int(data.get('n'))
    
    if not text:
        return jsonify({"error": "Missing text"}), 400
        
    try:
        result = rsa_encrypt_verbose(text, (e_val, n_val))
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/rsa_decrypt', methods=['POST'])
def rsa_decrypt_route():
    data = request.json
    ciphertext = data.get('ciphertext') # List of ints
    d_val = int(data.get('d'))
    n_val = int(data.get('n'))
    
    if not ciphertext:
        return jsonify({"error": "Missing ciphertext"}), 400
        
    try:
        result = rsa_decrypt_verbose(ciphertext, (d_val, n_val))
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/diffie_hellman')
def diffie_hellman():
    return render_template('diffie_hellman.html')

@app.route('/dh_step1_setup', methods=['POST'])
def dh_step1_setup():
    # Optional parameters p and g from body
    data = request.json or {}
    p = data.get('p') # Optional
    g = data.get('g') # Optional
    if p: p = int(p)
    if g: g = int(g)
    
    try:
        result = diffie_hellman_step1_setup(p, g)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/dh_step2_keys', methods=['POST'])
def dh_step2_keys():
    data = request.json
    try:
        p = int(data.get('p'))
        g = int(data.get('g'))
        private_a = data.get('private_a')
        private_b = data.get('private_b')
        if private_a: private_a = int(private_a)
        if private_b: private_b = int(private_b)
        
        result = diffie_hellman_step2_keys(p, g, private_a, private_b)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/dh_step3_secret', methods=['POST'])
def dh_step3_secret():
    data = request.json
    try:
        p = int(data.get('p'))
        private_a = int(data.get('private_a'))
        public_b = int(data.get('public_b'))
        private_b = int(data.get('private_b'))
        public_a = int(data.get('public_a'))
        
        result = diffie_hellman_step3_secret(p, private_a, public_b, private_b, public_a)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/elgamal')
def elgamal():
    return render_template('elgamal.html')

@app.route('/elgamal_generate_keys', methods=['POST'])
def elgamal_generate_keys():
    data = request.json
    try:
        p = int(data.get('p'))
        g = int(data.get('g'))
        
        result = generate_keys_elgamal(p, g)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/elgamal_encrypt', methods=['POST'])
def elgamal_encrypt():
    data = request.json
    try:
        message = data.get('message')
        p = int(data.get('p'))
        g = int(data.get('g'))
        y = int(data.get('y'))
        
        result = elgamal_encrypt_verbose(message, p, g, y)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/elgamal_decrypt', methods=['POST'])
def elgamal_decrypt():
    data = request.json
    try:
        ciphertext = data.get('ciphertext')
        p = int(data.get('p'))
        x = int(data.get('x'))
        
        result = elgamal_decrypt_verbose(ciphertext, p, x)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/dsa')
def dsa():
    return render_template('dsa.html')

@app.route('/dsa_setup', methods=['POST'])
def dsa_setup():
    try:
        result = dsa_setup_parameters()
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/dsa_generate_keys', methods=['POST'])
def dsa_generate_keys_route():
    data = request.json
    try:
        p = int(data.get('p'))
        q = int(data.get('q'))
        g = int(data.get('g'))
        
        result = dsa_generate_keys(p, q, g)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/dsa_sign', methods=['POST'])
def dsa_sign_route():
    data = request.json
    try:
        message = data.get('message')
        p = int(data.get('p'))
        q = int(data.get('q'))
        g = int(data.get('g'))
        x = int(data.get('x'))
        
        result = dsa_sign_verbose(message, p, q, g, x)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/dsa_verify', methods=['POST'])
def dsa_verify_route():
    data = request.json
    try:
        message = data.get('message')
        r = int(data.get('r'))
        s = int(data.get('s'))
        p = int(data.get('p'))
        q = int(data.get('q'))
        g = int(data.get('g'))
        y = int(data.get('y'))
        
        result = dsa_verify_verbose(message, r, s, p, q, g, y)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/ecc')
def ecc():
    return render_template('ecc.html')

@app.route('/ecc_setup', methods=['POST'])
def ecc_setup():
    try:
        result = ecc_setup_parameters()
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/ecc_generate_keys', methods=['POST'])
def ecc_generate_keys_route():
    data = request.json
    try:
        p = int(data.get('p'))
        a = int(data.get('a'))
        G = data.get('G') # dict with x, y
        
        result = ecc_generate_keys(p, a, G)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/ecc_shared_secret', methods=['POST'])
def ecc_shared_secret_route():
    data = request.json
    try:
        private_d = int(data.get('private_d'))
        public_Q = data.get('public_Q')
        p = int(data.get('p'))
        a = int(data.get('a'))
        
        result = ecc_shared_secret(private_d, public_Q, p, a)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/ecc_get_points', methods=['POST'])
def ecc_get_points_route():
    data = request.json
    try:
        p = int(data.get('p'))
        a = int(data.get('a'))
        b = int(data.get('b'))
        
        points = get_curve_points(p, a, b)
        return jsonify({"points": points})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
