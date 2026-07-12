"""Single prediction endpoint for OncoPredict API."""
import os
import sys
import json
import numpy as np
from http.server import BaseHTTPRequestHandler

# Add the api directory to Python path so _utils can be imported
api_dir = os.path.dirname(os.path.abspath(__file__))
if api_dir not in sys.path:
    sys.path.insert(0, api_dir)


class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_POST(self):
        try:
            from _utils.model_loader import load_assets
            model, scaler, feature_defaults, _ = load_assets()
        except Exception as e:
            self._send_json(503, {"detail": f"Model not loaded: {str(e)}"})
            return

        try:
            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length)
            data = json.loads(body)

            # Validate required fields
            required = ["mean_radius", "mean_texture", "mean_perimeter", "mean_area", "mean_smoothness"]
            for field in required:
                if field not in data:
                    self._send_json(400, {"detail": f"Missing required field: {field}"})
                    return

            # Initialize 30-feature vector with default means
            x_vector = np.zeros(30)
            for name, info in feature_defaults.items():
                x_vector[info["index"]] = info["mean"]

            # Override first 5 features with user input
            x_vector[0] = float(data["mean_radius"])
            x_vector[1] = float(data["mean_texture"])
            x_vector[2] = float(data["mean_perimeter"])
            x_vector[3] = float(data["mean_area"])
            x_vector[4] = float(data["mean_smoothness"])

            # Scale and predict
            x_input = x_vector.reshape(1, -1)
            x_scaled = scaler.transform(x_input)
            prediction = model.predict(x_scaled)[0]
            probabilities = model.predict_proba(x_scaled)[0]

            diagnosis = "Malignant" if prediction == 0 else "Benign"

            result = {
                "status": "success",
                "diagnosis": diagnosis,
                "probability_benign": round(float(probabilities[1]), 4),
                "probability_malignant": round(float(probabilities[0]), 4),
            }
            self._send_json(200, result)

        except json.JSONDecodeError:
            self._send_json(400, {"detail": "Invalid JSON body"})
        except Exception as e:
            self._send_json(500, {"detail": f"Prediction failed: {str(e)}"})

    def _send_json(self, status_code, data):
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())
