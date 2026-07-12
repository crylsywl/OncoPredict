"""Health check endpoint for OncoPredict API."""
from http.server import BaseHTTPRequestHandler
import json


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            from _utils.model_loader import load_assets
            model, scaler, _, _ = load_assets()

            if model is not None and scaler is not None:
                response = {"status": "healthy", "message": "OncoPredict API is fully operational"}
                self.send_response(200)
            else:
                response = {"status": "unhealthy", "message": "Model not loaded"}
                self.send_response(503)
        except Exception as e:
            response = {"status": "unhealthy", "message": str(e)}
            self.send_response(503)

        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(json.dumps(response).encode())
