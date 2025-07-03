# modulo-biometrico/app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
from deepface import DeepFace
import os
import base64
from PIL import Image
from io import BytesIO
import json
from datetime import datetime
import logging
import uuid
import cv2
import numpy as np

app = Flask(__name__)
CORS(app)  # Permitir requisições do frontend

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Diretórios para armazenamento
UPLOAD_FOLDER = 'uploads'
EMBEDDINGS_FOLDER = 'embeddings'
LOGS_FOLDER = 'logs'

# Criar diretórios se não existirem
for folder in [UPLOAD_FOLDER, EMBEDDINGS_FOLDER, LOGS_FOLDER]:
    os.makedirs(folder, exist_ok=True)

# Cache para armazenar comparecimentos temporários
comparecimentos_temp = {}

# Configurar detector de faces
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

@app.route('/health', methods=['GET'])
def health_check():
    """Verificar se o serviço está funcionando"""
    return jsonify({"status": "healthy", "service": "facial-recognition"})

@app.route('/validar-frame', methods=['POST'])
def validar_frame():
    """Validar frame em tempo real para feedback visual"""
    try:
        data = request.json
        image_data = data.get('image')
        
        if not image_data:
            return jsonify({
                "valid": False,
                "message": "Imagem não fornecida",
                "details": {}
            }), 400
        
        # Processar imagem
        if 'base64,' in image_data:
            image_data = image_data.split('base64,')[1]
        
        image_bytes = base64.b64decode(image_data)
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            return jsonify({
                "valid": False,
                "message": "Erro ao decodificar imagem",
                "details": {}
            })
        
        # Converter para escala de cinza
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Detectar faces
        faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(100, 100))
        
        if len(faces) == 0:
            return jsonify({
                "valid": False,
                "message": "Nenhum rosto detectado",
                "details": {
                    "faceCount": 0,
                    "brightness": calculate_brightness(gray),
                    "sharpness": calculate_sharpness(gray)
                }
            })
        
        if len(faces) > 1:
            return jsonify({
                "valid": False,
                "message": "Múltiplos rostos detectados",
                "details": {
                    "faceCount": len(faces),
                    "brightness": calculate_brightness(gray),
                    "sharpness": calculate_sharpness(gray)
                }
            })
        
        # Analisar qualidade
        x, y, w, h = faces[0]
        face_area = w * h
        image_area = img.shape[0] * img.shape[1]
        face_ratio = face_area / image_area
        
        # Verificar tamanho do rosto
        if face_ratio < 0.05:
            return jsonify({
                "valid": False,
                "message": "Rosto muito distante",
                "details": {
                    "faceCount": 1,
                    "faceRatio": round(face_ratio, 3),
                    "brightness": calculate_brightness(gray),
                    "sharpness": calculate_sharpness(gray)
                }
            })
        
        if face_ratio > 0.5:
            return jsonify({
                "valid": False,
                "message": "Rosto muito próximo",
                "details": {
                    "faceCount": 1,
                    "faceRatio": round(face_ratio, 3),
                    "brightness": calculate_brightness(gray),
                    "sharpness": calculate_sharpness(gray)
                }
            })
        
        # Verificar iluminação
        brightness = calculate_brightness(gray)
        if brightness < 50:
            return jsonify({
                "valid": False,
                "message": "Iluminação muito baixa",
                "details": {
                    "faceCount": 1,
                    "faceRatio": round(face_ratio, 3),
                    "brightness": brightness,
                    "sharpness": calculate_sharpness(gray)
                }
            })
        
        if brightness > 200:
            return jsonify({
                "valid": False,
                "message": "Iluminação muito alta",
                "details": {
                    "faceCount": 1,
                    "faceRatio": round(face_ratio, 3),
                    "brightness": brightness,
                    "sharpness": calculate_sharpness(gray)
                }
            })
        
        # Verificar nitidez
        sharpness = calculate_sharpness(gray)
        if sharpness < 50:
            return jsonify({
                "valid": False,
                "message": "Imagem desfocada",
                "details": {
                    "faceCount": 1,
                    "faceRatio": round(face_ratio, 3),
                    "brightness": brightness,
                    "sharpness": sharpness
                }
            })
        
        # Verificar centralização
        face_center_x = x + w/2
        face_center_y = y + h/2
        img_center_x = img.shape[1] / 2
        img_center_y = img.shape[0] / 2
        
        x_offset = abs(face_center_x - img_center_x) / img.shape[1]
        y_offset = abs(face_center_y - img_center_y) / img.shape[0]
        
        if x_offset > 0.2 or y_offset > 0.2:
            return jsonify({
                "valid": False,
                "message": "Centralize o rosto",
                "details": {
                    "faceCount": 1,
                    "faceRatio": round(face_ratio, 3),
                    "brightness": brightness,
                    "sharpness": sharpness,
                    "centered": False
                }
            })
        
        # Tudo OK
        return jsonify({
            "valid": True,
            "message": "Posicionamento perfeito!",
            "details": {
                "faceCount": 1,
                "faceRatio": round(face_ratio, 3),
                "brightness": brightness,
                "sharpness": sharpness,
                "centered": True,
                "faceBox": {
                    "x": int(x),
                    "y": int(y),
                    "width": int(w),
                    "height": int(h)
                }
            }
        })
        
    except Exception as e:
        logger.error(f"Erro ao validar frame: {str(e)}")
        return jsonify({
            "valid": False,
            "message": "Erro ao processar imagem",
            "details": {}
        }), 500

def calculate_brightness(gray_image):
    """Calcular brilho médio da imagem"""
    return int(np.mean(gray_image))

def calculate_sharpness(gray_image):
    """Calcular nitidez usando Laplaciano"""
    laplacian = cv2.Laplacian(gray_image, cv2.CV_64F)
    return int(laplacian.var())

@app.route('/salvar-rosto', methods=['POST'])
def salvar_rosto():
    """Salvar foto de referência para um processo"""
    try:
        data = request.json
        processo = data.get('processo')
        image_data = data.get('image')
        
        if not processo or not image_data:
            return jsonify({
                "success": False, 
                "message": "Processo e imagem são obrigatórios"
            }), 400
        
        # Remover prefixo data:image se existir
        if 'base64,' in image_data:
            image_data = image_data.split('base64,')[1]
        
        # Decodificar e salvar imagem
        image_bytes = base64.b64decode(image_data)
        image = Image.open(BytesIO(image_bytes))
        
        # Converter para RGB se necessário
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Salvar imagem original
        filename = f"{processo.replace('/', '-')}.jpg"
        filepath = os.path.join(EMBEDDINGS_FOLDER, filename)
        image.save(filepath, 'JPEG', quality=95)
        
        # Verificar se o rosto foi detectado
        try:
            result = DeepFace.detect_face(filepath, detector_backend='opencv', enforce_detection=True)
            logger.info(f"Rosto detectado e salvo para processo {processo}")
            
            # Registrar no log
            log_entry = {
                "timestamp": datetime.now().isoformat(),
                "processo": processo,
                "action": "cadastro_facial",
                "success": True
            }
            save_log(log_entry)
            
            return jsonify({
                "success": True,
                "message": "Rosto cadastrado com sucesso",
                "path": filepath
            })
            
        except Exception as e:
            # Remover arquivo se não detectou rosto
            os.remove(filepath)
            logger.error(f"Nenhum rosto detectado: {str(e)}")
            return jsonify({
                "success": False,
                "message": "Nenhum rosto foi detectado na imagem. Por favor, tire outra foto."
            }), 400
            
    except Exception as e:
        logger.error(f"Erro ao salvar rosto: {str(e)}")
        return jsonify({
            "success": False,
            "message": f"Erro ao processar imagem: {str(e)}"
        }), 500

@app.route('/verificar-rosto', methods=['POST'])
def verificar_rosto():
    """Verificar se o rosto corresponde ao cadastrado"""
    try:
        data = request.json
        processo = data.get('processo')
        image_data = data.get('image')
        
        if not processo or not image_data:
            return jsonify({
                "success": False,
                "message": "Processo e imagem são obrigatórios"
            }), 400
        
        # Verificar se existe foto de referência
        filename = f"{processo.replace('/', '-')}.jpg"
        reference_path = os.path.join(EMBEDDINGS_FOLDER, filename)
        
        if not os.path.exists(reference_path):
            return jsonify({
                "success": False,
                "message": "Não há foto cadastrada para este processo"
            }), 404
        
        # Processar imagem atual
        if 'base64,' in image_data:
            image_data = image_data.split('base64,')[1]
        
        image_bytes = base64.b64decode(image_data)
        image = Image.open(BytesIO(image_bytes))
        
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Salvar temporariamente para comparação
        temp_filename = f"temp_{uuid.uuid4()}.jpg"
        temp_path = os.path.join(UPLOAD_FOLDER, temp_filename)
        image.save(temp_path, 'JPEG', quality=95)
        
        try:
            # Realizar verificação facial
            result = DeepFace.verify(
                img1_path=temp_path,
                img2_path=reference_path,
                model_name='VGG-Face',
                distance_metric='cosine',
                enforce_detection=True,
                detector_backend='opencv'
            )
            
            # Determinar se passou na verificação
            verified = result['verified']
            distance = result['distance']
            threshold = result['threshold']
            confidence = (1 - distance) * 100  # Converter para porcentagem
            
            # Log da tentativa
            log_entry = {
                "timestamp": datetime.now().isoformat(),
                "processo": processo,
                "action": "verificacao_facial",
                "success": verified,
                "confidence": confidence,
                "distance": distance
            }
            save_log(log_entry)
            
            # Se verificado, registrar comparecimento
            if verified:
                comparecimento_id = str(uuid.uuid4())
                comparecimentos_temp[comparecimento_id] = {
                    "processo": processo,
                    "timestamp": datetime.now().isoformat(),
                    "metodo": "reconhecimento_facial",
                    "confidence": confidence
                }
                
                response = {
                    "success": True,
                    "verified": True,
                    "message": "Identidade confirmada com sucesso!",
                    "confidence": round(confidence, 2),
                    "comparecimento_id": comparecimento_id
                }
            else:
                response = {
                    "success": True,
                    "verified": False,
                    "message": "Rosto não reconhecido. Tente novamente ou procure um atendente.",
                    "confidence": round(confidence, 2)
                }
            
            return jsonify(response)
            
        except Exception as e:
            logger.error(f"Erro na verificação facial: {str(e)}")
            
            # Se não detectou rosto
            if "Face could not be detected" in str(e):
                return jsonify({
                    "success": False,
                    "message": "Nenhum rosto detectado. Posicione-se melhor em frente à câmera."
                }), 400
            
            return jsonify({
                "success": False,
                "message": "Erro na verificação facial. Tente novamente."
            }), 500
            
        finally:
            # Limpar arquivo temporário
            if os.path.exists(temp_path):
                os.remove(temp_path)
                
    except Exception as e:
        logger.error(f"Erro geral na verificação: {str(e)}")
        return jsonify({
            "success": False,
            "message": f"Erro ao processar verificação: {str(e)}"
        }), 500

@app.route('/confirmar-comparecimento/<comparecimento_id>', methods=['POST'])
def confirmar_comparecimento(comparecimento_id):
    """Confirmar o comparecimento após verificação"""
    if comparecimento_id in comparecimentos_temp:
        comparecimento = comparecimentos_temp[comparecimento_id]
        
        # Aqui você salvaria no banco de dados real
        # Por enquanto, apenas registramos no log
        log_entry = {
            "timestamp": datetime.now().isoformat(),
            "processo": comparecimento['processo'],
            "action": "comparecimento_confirmado",
            "metodo": comparecimento['metodo'],
            "comparecimento_id": comparecimento_id
        }
        save_log(log_entry)
        
        # Remover do cache temporário
        del comparecimentos_temp[comparecimento_id]
        
        return jsonify({
            "success": True,
            "message": "Comparecimento registrado com sucesso!"
        })
    else:
        return jsonify({
            "success": False,
            "message": "Comparecimento não encontrado ou expirado"
        }), 404

@app.route('/listar-cadastros', methods=['GET'])
def listar_cadastros():
    """Listar todos os processos com foto cadastrada"""
    try:
        cadastros = []
        for filename in os.listdir(EMBEDDINGS_FOLDER):
            if filename.endswith('.jpg'):
                processo = filename.replace('.jpg', '').replace('-', '/')
                filepath = os.path.join(EMBEDDINGS_FOLDER, filename)
                cadastros.append({
                    "processo": processo,
                    "cadastrado_em": datetime.fromtimestamp(os.path.getctime(filepath)).isoformat()
                })
        
        return jsonify({
            "success": True,
            "total": len(cadastros),
            "cadastros": cadastros
        })
    except Exception as e:
        logger.error(f"Erro ao listar cadastros: {str(e)}")
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

@app.route('/deletar-cadastro/<processo>', methods=['DELETE'])
def deletar_cadastro(processo):
    """Deletar foto cadastrada de um processo"""
    try:
        filename = f"{processo.replace('/', '-')}.jpg"
        filepath = os.path.join(EMBEDDINGS_FOLDER, filename)
        
        if os.path.exists(filepath):
            os.remove(filepath)
            
            log_entry = {
                "timestamp": datetime.now().isoformat(),
                "processo": processo,
                "action": "cadastro_deletado"
            }
            save_log(log_entry)
            
            return jsonify({
                "success": True,
                "message": "Cadastro facial removido com sucesso"
            })
        else:
            return jsonify({
                "success": False,
                "message": "Cadastro não encontrado"
            }), 404
            
    except Exception as e:
        logger.error(f"Erro ao deletar cadastro: {str(e)}")
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

def save_log(entry):
    """Salvar entrada no log"""
    try:
        log_file = os.path.join(LOGS_FOLDER, f"facial_recognition_{datetime.now().strftime('%Y%m%d')}.json")
        
        # Ler logs existentes ou criar lista vazia
        if os.path.exists(log_file):
            with open(log_file, 'r') as f:
                logs = json.load(f)
        else:
            logs = []
        
        # Adicionar nova entrada
        logs.append(entry)
        
        # Salvar de volta
        with open(log_file, 'w') as f:
            json.dump(logs, f, indent=2)
            
    except Exception as e:
        logger.error(f"Erro ao salvar log: {str(e)}")

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)