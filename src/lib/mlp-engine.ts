/**
 * MLP Neural Network inference engine in pure TypeScript.
 * Reimplements scikit-learn's MLPClassifier forward pass.
 * No Python dependencies needed - runs natively on Vercel.
 */

import modelData from "./ml-model.json";

// Types
interface ModelWeights {
  coefs: number[][][];
  intercepts: number[][];
  classes: number[];
  activation: string;
  out_activation: string;
  n_layers: number;
}

interface ScalerParams {
  mean: number[];
  scale: number[];
}

interface FeatureDefaults {
  [key: string]: {
    index: number;
    mean: number;
  };
}

// Load from JSON
const model: ModelWeights = modelData.model;
const scaler: ScalerParams = modelData.scaler;

// --- Activation functions ---

function relu(x: number): number {
  return Math.max(0, x);
}

function sigmoid(x: number): number {
  // Clamp to avoid overflow
  const clamped = Math.max(-500, Math.min(500, x));
  return 1 / (1 + Math.exp(-clamped));
}

// --- Core operations ---

/**
 * Matrix-vector multiply: output[j] = sum(input[i] * weights[i][j]) + bias[j]
 */
function linearForward(
  input: number[],
  weights: number[][],
  bias: number[]
): number[] {
  const outputSize = bias.length;
  const result = new Array(outputSize);

  for (let j = 0; j < outputSize; j++) {
    let sum = bias[j];
    for (let i = 0; i < input.length; i++) {
      sum += input[i] * weights[i][j];
    }
    result[j] = sum;
  }

  return result;
}

/**
 * Apply StandardScaler: (x - mean) / scale
 */
export function standardScale(input: number[]): number[] {
  return input.map((val, i) => (val - scaler.mean[i]) / scaler.scale[i]);
}

/**
 * MLP forward pass - replicates sklearn's MLPClassifier.predict_proba()
 */
export function mlpForward(scaledInput: number[]): number[] {
  let current = scaledInput;

  // Hidden layers (all except the last weight matrix)
  for (let layer = 0; layer < model.coefs.length - 1; layer++) {
    current = linearForward(current, model.coefs[layer], model.intercepts[layer]);
    // Apply activation (relu)
    current = current.map(relu);
  }

  // Output layer
  const lastIdx = model.coefs.length - 1;
  current = linearForward(current, model.coefs[lastIdx], model.intercepts[lastIdx]);

  // Output activation (logistic/sigmoid for binary classification)
  if (model.out_activation === "logistic") {
    // Binary classification: single output neuron with sigmoid
    const probClass1 = sigmoid(current[0]);
    return [1 - probClass1, probClass1]; // [prob_class_0, prob_class_1]
  } else {
    // Softmax for multi-class (not used here but included for completeness)
    const maxVal = Math.max(...current);
    const exps = current.map((v) => Math.exp(v - maxVal));
    const sumExps = exps.reduce((a, b) => a + b, 0);
    return exps.map((v) => v / sumExps);
  }
}

/**
 * Full prediction pipeline: scale → forward pass → diagnosis
 */
export function predict(features30: number[]): {
  diagnosis: "Malignant" | "Benign";
  probability_benign: number;
  probability_malignant: number;
} {
  const scaled = standardScale(features30);
  const probabilities = mlpForward(scaled);

  // classes: [0, 1] → 0 = Malignant, 1 = Benign
  const predClass = probabilities[1] >= 0.5 ? 1 : 0;

  return {
    diagnosis: predClass === 0 ? "Malignant" : "Benign",
    probability_malignant: Math.round(probabilities[0] * 10000) / 10000,
    probability_benign: Math.round(probabilities[1] * 10000) / 10000,
  };
}
