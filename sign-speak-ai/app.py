from flask import Flask, request, jsonify
import json
import os

app = Flask(__name__)
app.secret_key = 'xerox_pay_enterprise_v8_cloud_secure'

DATA_FILE = 'data.json'


# -------------------------
# Utility functions
# -------------------------

def load_data():
    if not os.path.exists(DATA_FILE):
        initial_data = {"owners": []}
        save_data(initial_data)
        return initial_data

    with open(DATA_FILE, 'r') as f:
        try:
            return json.load(f)
        except:
            return {"owners": []}


def save_data(data):
    with open(DATA_FILE, 'w') as f:
        json.dump(data, f, indent=4)


# -------------------------
# ROUTES
# -------------------------

@app.route("/")
def home():
    return "Backend Running 🚀"


@app.route("/api/test", methods=["GET"])
def test():
    return jsonify({"message": "Backend connected successfully!"})


@app.route('/api/data', methods=['GET'])
def get_all_data():
    return jsonify(load_data())


@app.route('/api/update', methods=['POST'])
def update_data():
    new_data = request.json
    save_data(new_data)
    return jsonify({"status": "success"})


@app.route('/api/login', methods=['POST'])
def login():
    req = request.json
    role = req.get('role')
    user_id = req.get('userId', '').upper()
    data = load_data()

    if role == 'OWNER':
        owner = next((o for o in data['owners'] if o['id'] == user_id), None)
        if owner:
            return jsonify({"status": "success", "role": "OWNER", "user": owner})
        return jsonify({"status": "error", "message": "Terminal ID not recognized."}), 404

    return jsonify({"status": "error", "message": "Method not supported."}), 400


# -------------------------

if __name__ == '__main__':
    app.run(debug=True)
