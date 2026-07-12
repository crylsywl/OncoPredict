"""Shared model loader for Vercel Python Serverless Functions."""
import os
import sys
import json
import joblib
import numpy as np

# Cache loaded assets in module-level variables (persists across warm invocations)
_model = None
_scaler = None
_feature_defaults = None
_feature_names_ordered = None


def _find_model_dir():
    """Find the model directory by searching multiple possible locations."""
    # Get the directory of this file (api/_utils/)
    this_dir = os.path.dirname(os.path.abspath(__file__))
    # Project root is two levels up from api/_utils/
    project_root = os.path.dirname(os.path.dirname(this_dir))

    candidates = [
        os.path.join(project_root, "model"),
        os.path.join(os.getcwd(), "model"),
        # Vercel sometimes uses /var/task as the working directory
        "/var/task/model",
    ]

    for path in candidates:
        model_file = os.path.join(path, "model_mlp.pkl")
        if os.path.exists(model_file):
            return path

    raise RuntimeError(
        f"Model directory not found. Searched: {candidates}. "
        f"CWD: {os.getcwd()}, __file__: {__file__}"
    )


def load_assets():
    """Load model, scaler, and feature defaults. Uses module-level caching."""
    global _model, _scaler, _feature_defaults, _feature_names_ordered

    if _model is not None and _scaler is not None and _feature_defaults is not None:
        return _model, _scaler, _feature_defaults, _feature_names_ordered

    model_dir = _find_model_dir()
    model_path = os.path.join(model_dir, "model_mlp.pkl")
    scaler_path = os.path.join(model_dir, "scaler.pkl")
    defaults_path = os.path.join(model_dir, "feature_defaults.json")

    _model = joblib.load(model_path)
    _scaler = joblib.load(scaler_path)

    with open(defaults_path, "r") as f:
        _feature_defaults = json.load(f)

    sorted_features = sorted(_feature_defaults.items(), key=lambda item: item[1]["index"])
    _feature_names_ordered = [name for name, info in sorted_features]

    return _model, _scaler, _feature_defaults, _feature_names_ordered
