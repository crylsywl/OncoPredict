"""Health check endpoint for OncoPredict API."""
import os
import sys
import json
from http.server import BaseHTTPRequestHandler

# Add the api directory to Python path so _utils can be imported
api_dir = os.path.dirname(os.path.abspath(__file__))
if api_dir not in sys.path:
    sys.path.insert(0, api_dir)


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
