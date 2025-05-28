from flask import Flask, request, jsonify
from deepface import DeepFace
import os, base64
from PIL import Image
from io import BytesIO

app = Flask(__name__)

@app.route('/salvar-rosto', methods=['POST'])
def salvar_rosto():
    data = request.json
    processo = data['processo']
    image_data = data['image'].replace('data:image/jpeg;base64,', '')
    image = Image.open(BytesIO(base64.b64decode(image_data)))
    os.makedirs('embeddings', exist_ok=True)
    path = f'embeddings/{processo}.jpg'
    image.save(path)
    return jsonify({"status": "salvo", "path": path})

@app.route('/verificar-rosto', methods=['POST'])
def verificar_rosto():
    data = request.json
    processo = data['processo']
    image_data = data['image'].replace('data:image/jpeg;base64,', '')
    current_path = f'embeddings/temp_{processo}.jpg'
    base_path = f'embeddings/{processo}.jpg'

    if not os.path.exists(base_path):
        return jsonify({"success": False, "message": "Imagem base não encontrada"})

    with open(current_path, 'wb') as f:
        f.write(base64.b64decode(image_data))

    result = DeepFace.verify(current_path, base_path, enforce_detection=False)
    os.remove(current_path)
    return jsonify({"success": result["verified"], "distance": result["distance"]})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
