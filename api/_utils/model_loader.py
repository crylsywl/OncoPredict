"""Shared model loader for Vercel Python Serverless Functions."""
import os
import json
import joblib
import numpy as np

# Cache loaded assets in module-level variables (persists across warm invocations)
_model = None
_scaler = None
_feature_defaults = None
_feature_names_ordered = None


def _get_model_dir():
    """Get the path to the model directory."""
    # In Vercel, the working directory is the project root
    # Try multiple possible paths
    candidates = [
        os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "model"),
        os.path.join(os.getcwd(), "model"),
    ]
    for path in candidates:
        if os.path.isdir(path):
            return path
    raise RuntimeError(f"Model directory not found. Tried: {candidates}")


def load_assets():
    """Load model, scaler, and feature defaults. Uses module-level caching."""
    global _model, _scaler, _feature_defaults, _feature_names_ordered

    if _model is not None and _scaler is not None and _feature_defaults is not None:
        return _model, _scaler, _feature_defaults, _feature_names_ordered

    model_dir = _get_model_dir()
    model_path = os.path.join(model_dir, "model_mlp.pkl")
    scaler_path = os.path.join(model_dir, "scaler.pkl")
    defaults_path = os.path.join(model_dir, "feature_defaults.json")

    for path in [model_path, scaler_path, defaults_path]:
        if not os.path.exists(path):
            raise RuntimeError(f"Required file not found: {path}")

    _model = joblib.load(model_path)
    _scaler = joblib.load(scaler_path)

    with open(defaults_path, "r") as f:
        _feature_defaults = json.load(f)

    sorted_features = sorted(_feature_defaults.items(), key=lambda item: item[1]["index"])
    _feature_names_ordered = [name for name, info in sorted_features]

    return _model, _scaler, _feature_defaults, _feature_names_ordered
