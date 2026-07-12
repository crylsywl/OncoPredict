"""CSV bulk prediction endpoint for OncoPredict API."""
import os
import sys
import json
import io
import numpy as np
import pandas as pd
from http.server import BaseHTTPRequestHandler

# Add the api directory to Python path so _utils can be imported
api_dir = os.path.dirname(os.path.abspath(__file__))
if api_dir not in sys.path:
    sys.path.insert(0, api_dir)


def normalize_name(n):
    """Normalize feature name for flexible column matching."""
    return str(n).lower().strip().replace("_", " ").replace("-", " ")


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
            model, scaler, feature_defaults, feature_names_ordered = load_assets()
        except Exception as e:
            self._send_json(503, {"detail": f"Model not loaded: {str(e)}"})
            return

        try:
            content_type = self.headers.get("Content-Type", "")
            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length)

            # Parse multipart form data to extract CSV file
            csv_data = None
            if "multipart/form-data" in content_type:
                boundary = content_type.split("boundary=")[-1].strip()
                csv_data = self._extract_csv_from_multipart(body, boundary)
            else:
                csv_data = body.decode("utf-8")

            if csv_data is None:
                self._send_json(400, {"detail": "No CSV data found in request"})
                return

            # Parse CSV
            df = pd.read_csv(io.StringIO(csv_data) if isinstance(csv_data, str) else io.BytesIO(csv_data))

            if df.empty:
                self._send_json(400, {"detail": "The uploaded CSV file is empty."})
                return

            # Map columns to features
            normalized_defaults = {normalize_name(k): k for k in feature_defaults.keys()}
            X_df = pd.DataFrame(index=df.index)

            mapped_count = 0
            for norm_name, original_name in normalized_defaults.items():
                found_col = None
                for col in df.columns:
                    if normalize_name(col) == norm_name:
                        found_col = col
                        break

                if found_col is not None:
                    X_df[original_name] = df[found_col]
                    mapped_count += 1
                else:
                    X_df[original_name] = feature_defaults[original_name]["mean"]

            if mapped_count < 5 and df.shape[1] == 30:
                X_df = pd.DataFrame(df.values, columns=feature_names_ordered)
            elif mapped_count == 0:
                self._send_json(400, {
                    "detail": "CSV columns do not match Wisconsin dataset features."
                })
                return

            X_df = X_df.apply(pd.to_numeric, errors="coerce").fillna(0.0)
            X_df = X_df[feature_names_ordered]

            X_matrix = X_df.values
            X_scaled = scaler.transform(X_matrix)
            predictions = model.predict(X_scaled)
            probabilities = model.predict_proba(X_scaled)

            result_predictions = []
            malignant_count = 0
            benign_count = 0

            for idx in range(len(df)):
                pred_class = int(predictions[idx])
                prob_mal = float(probabilities[idx][0])
                prob_ben = float(probabilities[idx][1])
                diagnosis = "Malignant" if pred_class == 0 else "Benign"

                if pred_class == 0:
                    malignant_count += 1
                else:
                    benign_count += 1

                row_features = {
                    "mean radius": float(X_df.iloc[idx]["mean radius"]),
                    "mean texture": float(X_df.iloc[idx]["mean texture"]),
                    "mean perimeter": float(X_df.iloc[idx]["mean perimeter"]),
                    "mean area": float(X_df.iloc[idx]["mean area"]),
                    "mean smoothness": float(X_df.iloc[idx]["mean smoothness"]),
                }

                result_predictions.append({
                    "id": idx + 1,
                    "diagnosis": diagnosis,
                    "probability_benign": round(prob_ben, 4),
                    "probability_malignant": round(prob_mal, 4),
                    "features": row_features,
                })

            result = {
                "status": "success",
                "summary": {
                    "total": len(df),
                    "malignant": malignant_count,
                    "benign": benign_count,
                },
                "predictions": result_predictions,
            }
            self._send_json(200, result)

        except Exception as e:
            self._send_json(500, {"detail": f"CSV processing failed: {str(e)}"})

    def _extract_csv_from_multipart(self, body, boundary):
        """Extract CSV file content from multipart form data."""
        try:
            boundary_bytes = boundary.encode() if isinstance(boundary, str) else boundary
            parts = body.split(b"--" + boundary_bytes)

            for part in parts:
                if b"filename=" in part and (b".csv" in part.lower()):
                    header_end = part.find(b"\r\n\r\n")
                    if header_end != -1:
                        content = part[header_end + 4:]
                        if content.endswith(b"\r\n"):
                            content = content[:-2]
                        if content.endswith(b"--"):
                            content = content[:-2]
                        if content.endswith(b"\r\n"):
                            content = content[:-2]
                        return content.decode("utf-8")
        except Exception:
            pass
        return None

    def _send_json(self, status_code, data):
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())
