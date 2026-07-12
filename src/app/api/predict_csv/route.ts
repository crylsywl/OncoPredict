import { NextRequest, NextResponse } from "next/server";
import { predict } from "@/lib/mlp-engine";
import _featureDefaults from "@/lib/feature_defaults.json";

const featureDefaults = _featureDefaults as Record<string, { index: number; mean: number }>;

// Feature names in correct order
const featureNamesOrdered = Object.entries(featureDefaults)
  .sort(([, a], [, b]) => (a as { index: number }).index - (b as { index: number }).index)
  .map(([name]) => name);

function normalizeName(n: string): string {
  return n.toLowerCase().trim().replace(/_/g, " ").replace(/-/g, " ");
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { detail: "No file uploaded" },
        { status: 400 }
      );
    }

    if (!file.name.endsWith(".csv")) {
      return NextResponse.json(
        { detail: "Only CSV files are allowed." },
        { status: 400 }
      );
    }

    const text = await file.text();
    const rows = parseCSV(text);

    if (rows.length === 0) {
      return NextResponse.json(
        { detail: "The uploaded CSV file is empty." },
        { status: 400 }
      );
    }

    const headers = rows[0];
    const dataRows = rows.slice(1);

    if (dataRows.length === 0) {
      return NextResponse.json(
        { detail: "CSV has headers but no data rows." },
        { status: 400 }
      );
    }

    // Map CSV columns to feature indices
    const normalizedDefaults: Record<string, string> = {};
    for (const key of Object.keys(featureDefaults)) {
      normalizedDefaults[normalizeName(key)] = key;
    }

    // Try to match columns by name
    const columnMap: Record<number, number> = {}; // csvColIdx -> featureIdx
    let mappedCount = 0;

    for (let ci = 0; ci < headers.length; ci++) {
      const normHeader = normalizeName(headers[ci]);
      if (normalizedDefaults[normHeader]) {
        const originalName = normalizedDefaults[normHeader];
        const feat = featureDefaults[originalName] as { index: number; mean: number };
        columnMap[ci] = feat.index;
        mappedCount++;
      }
    }

    // Process each row
    const predictions = [];
    let malignantCount = 0;
    let benignCount = 0;

    for (let ri = 0; ri < dataRows.length; ri++) {
      const row = dataRows[ri];

      // Build 30-feature vector with defaults
      const x = new Array(30).fill(0);
      for (const [, info] of Object.entries(featureDefaults)) {
        const feat = info as { index: number; mean: number };
        x[feat.index] = feat.mean;
      }

      if (mappedCount >= 5) {
        // Use column mapping
        for (const [ciStr, featIdx] of Object.entries(columnMap)) {
          const ci = parseInt(ciStr);
          const val = parseFloat(row[ci]);
          if (!isNaN(val)) {
            x[featIdx] = val;
          }
        }
      } else if (headers.length === 30) {
        // Fallback: use column order directly
        for (let ci = 0; ci < 30 && ci < row.length; ci++) {
          const val = parseFloat(row[ci]);
          if (!isNaN(val)) {
            x[ci] = val;
          }
        }
      } else if (mappedCount === 0) {
        return NextResponse.json(
          {
            detail:
              "CSV columns do not match Wisconsin dataset features. Please provide columns like 'mean radius', etc. or exactly 30 ordered feature columns.",
          },
          { status: 400 }
        );
      }

      const result = predict(x);

      if (result.diagnosis === "Malignant") {
        malignantCount++;
      } else {
        benignCount++;
      }

      predictions.push({
        id: ri + 1,
        diagnosis: result.diagnosis,
        probability_benign: result.probability_benign,
        probability_malignant: result.probability_malignant,
        features: {
          "mean radius": x[0],
          "mean texture": x[1],
          "mean perimeter": x[2],
          "mean area": x[3],
          "mean smoothness": x[4],
        },
      });
    }

    return NextResponse.json({
      status: "success",
      summary: {
        total: dataRows.length,
        malignant: malignantCount,
        benign: benignCount,
      },
      predictions,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { detail: `CSV processing failed: ${message}` },
      { status: 500 }
    );
  }
}

/**
 * Simple CSV parser that handles quoted fields with commas.
 */
function parseCSV(text: string): string[][] {
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  return lines.map((line) => {
    const fields: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        fields.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    fields.push(current.trim());
    return fields;
  });
}
