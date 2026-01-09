from flask import Flask, render_template, request, jsonify
from logic.aes_verbose import aes_encrypt_verbose
from logic.des_verbose import des_encrypt_verbose

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

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

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
