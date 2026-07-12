import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Just verify the model data can be loaded
    const modelData = await import("@/lib/ml-model.json");
    const hasModel = modelData.model && modelData.scaler;

    if (hasModel) {
      return NextResponse.json({
        status: "healthy",
        message: "OncoPredict API is fully operational",
      });
    } else {
      return NextResponse.json(
        { status: "unhealthy", message: "Model data incomplete" },
        { status: 503 }
      );
    }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { status: "unhealthy", message },
      { status: 503 }
    );
  }
}
