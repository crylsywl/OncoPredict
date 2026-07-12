import { NextRequest, NextResponse } from "next/server";
import { predict } from "@/lib/mlp-engine";
import _featureDefaults from "@/lib/feature_defaults.json";

const featureDefaults = _featureDefaults as Record<string, { index: number; mean: number }>;

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // Validate required fields
    const required = [
      "mean_radius",
      "mean_texture",
      "mean_perimeter",
      "mean_area",
      "mean_smoothness",
    ];
    for (const field of required) {
      if (data[field] === undefined || data[field] === null) {
        return NextResponse.json(
          { detail: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Build 30-feature vector, filling with defaults
    const x = new Array(30).fill(0);
    for (const [name, info] of Object.entries(featureDefaults)) {
      const feat = info as { index: number; mean: number };
      x[feat.index] = feat.mean;
    }

    // Override first 5 with user input
    x[0] = Number(data.mean_radius);
    x[1] = Number(data.mean_texture);
    x[2] = Number(data.mean_perimeter);
    x[3] = Number(data.mean_area);
    x[4] = Number(data.mean_smoothness);

    // Run prediction
    const result = predict(x);

    return NextResponse.json({
      status: "success",
      diagnosis: result.diagnosis,
      probability_benign: result.probability_benign,
      probability_malignant: result.probability_malignant,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { detail: `Prediction failed: ${message}` },
      { status: 500 }
    );
  }
}
