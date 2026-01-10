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

app = Flask(__name__)

@app.route('/')
def home():
    return render_template('index.html')

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

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
