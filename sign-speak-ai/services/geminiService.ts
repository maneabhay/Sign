from flask import Flask, request, jsonify, Response
from flask_cors import CORS
import google.generativeai as genai
import os
import json
import time
import base64

app = Flask(__name__)
CORS(app)

# -----------------------
# Configure Gemini
# -----------------------
API_KEY = os.environ.get("API_KEY")
genai.configure(api_key=API_KEY)

# -----------------------
# Test Route
# -----------------------
@app.route("/")
def home():
    return "Backend Running 🚀"

@app.route("/api/test", methods=["GET"])
def test():
    return jsonify({"message": "Backend connected successfully!"})

# -----------------------
# Describe Sign (Streaming)
# -----------------------
@app.route("/api/describe-sign-stream", methods=["POST"])
def describe_sign_stream():
    data = request.json
    text = data.get("text")
    language = data.get("languageName", "English")

    def generate():
        model = genai.GenerativeModel("gemini-3-flash-preview")
        prompt = f"Explain briefly how to sign '{text}' in ASL."
        response = model.generate_content(prompt, stream=True)

        for chunk in response:
            yield f"data: {json.dumps({'text': chunk.text})}\n\n"

    return Response(generate(), mimetype="text/event-stream")

# -----------------------
# Generate Image
# -----------------------
@app.route("/api/generate-sign-image", methods=["POST"])
def generate_image():
    data = request.json
    text = data.get("text")

    model = genai.GenerativeModel("gemini-2.5-flash-image")
    response = model.generate_content(
        f"ASL sign for '{text}', clean white background."
    )

    for part in response.candidates[0].content.parts:
        if part.inline_data:
            return jsonify({
                "success": True,
                "image_data": f"data:image/png;base64,{base64.b64encode(part.inline_data.data).decode()}"
            })

    return jsonify({"success": False})

# -----------------------
# Recognize Gesture
# -----------------------
@app.route("/api/recognize-gesture", methods=["POST"])
def recognize():
    data = request.json
    image_base64 = data.get("image")

    model = genai.GenerativeModel("gemini-3-flash-preview")
    image_part = {
        "mime_type": "image/jpeg",
        "data": base64.b64decode(image_base64)
    }

    response = model.generate_content(
        ["What sign is this?", image_part]
    )

    return jsonify({
        "success": True,
        "prediction": response.text.strip()
    })

# -----------------------

if __name__ == "__main__":
    app.run(debug=True)
