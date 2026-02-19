
import os
import time
import base64
import json
from flask import Flask, request, jsonify, render_template, Response
from flask_cors import CORS
import google.generativeai as genai

app = Flask(__name__, static_folder='.', template_folder='.')
CORS(app)

# Configure Gemini
API_KEY = os.environ.get("API_KEY")
genai.configure(api_key=API_KEY)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/describe-sign-stream', methods=['POST'])
def describe_sign_stream():
    data = request.json
    text = data.get('text')
    language_name = data.get('languageName', 'English')
    
    def generate():
        try:
            model = genai.GenerativeModel('gemini-3-flash-preview')
            prompt = f"Explain briefly (max 15 words) how to sign the {language_name} phrase '{text}' in American Sign Language. Be very descriptive about hand movements."
            response = model.generate_content(prompt, stream=True)
            for chunk in response:
                yield f"data: {json.dumps({'text': chunk.text})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return Response(generate(), mimetype='text/event-stream')

@app.route('/api/generate-sign-image', methods=['POST'])
def generate_image():
    data = request.json
    text = data.get('text')
    language_name = data.get('languageName', 'English')
    
    # Minimalist prompt for fastest inference
    prompt = f'ASL sign for "{text}", 3D icon style, white background, simple colors.'
    
    try:
        model = genai.GenerativeModel('gemini-2.5-flash-image')
        response = model.generate_content(prompt)
        
        for part in response.candidates[0].content.parts:
            if part.inline_data:
                return jsonify({
                    "success": True,
                    "image_data": f"data:image/png;base64,{base64.b64encode(part.inline_data.data).decode('utf-8')}"
                })
        return jsonify({"success": False, "error": "No image generated"}), 500
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/generate-sign-video', methods=['POST'])
def generate_video():
    data = request.json
    text = data.get('text')
    language_name = data.get('languageName', 'English')
    
    prompt = f'Simple 3D character signing "{text}" in ASL.'
    
    try:
        model = genai.GenerativeModel('veo-3.1-fast-generate-preview')
        operation = model.generate_videos(
            prompt=prompt,
            config={"number_of_videos": 1, "resolution": "720p", "aspect_ratio": "16:9"}
        )
        
        # Fast polling
        retries = 0
        while not operation.done() and retries < 15:
            time.sleep(5)
            operation = genai.get_operation(operation.name)
            retries += 1
            
        if not operation.done():
            return jsonify({"success": False, "error": "Still processing in background."}), 202

        video_uri = operation.result().generated_videos[0].video.uri
        return jsonify({"success": True, "video_url": f"{video_uri}&key={API_KEY}"})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/recognize-gesture', methods=['POST'])
def recognize():
    data = request.json
    image_base64 = data.get('image')
    target_lang = data.get('languageName', 'English')
    
    try:
        model = genai.GenerativeModel('gemini-3-flash-preview')
        image_part = {"mime_type": "image/jpeg", "data": base64.b64decode(image_base64)}
        prompt = f"What is this ASL sign? Return only the {target_lang} word."
        response = model.generate_content([prompt, image_part])
        return jsonify({"success": True, "prediction": response.text.strip()})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
