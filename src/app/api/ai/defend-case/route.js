import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    let formData;

    // Detect if the request body is JSON or FormData
    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      // Handle JSON body (e.g. from chatbot or text input)
      const body = await request.json();
      formData = new FormData();

      if (body.caseSummary) formData.append("case_summary", body.caseSummary);
      if (body.evidence) formData.append("evidence", body.evidence);
      if (body.charges) formData.append("charges", body.charges);
      if (body.userId) formData.append("user_id", body.userId);
    } else {
      // Handle multipart/form-data (file upload from your Defend Case page)
      formData = await request.formData();
    }

    // Forward to FastAPI backend
    const response = await fetch("http://localhost:8000/defend-case", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to get defense strategy");
    }

    // Normalize AI response
    const aiResponse =
      data.defense_strategy ||
      data.response ||
      data.answer ||
      "No defense strategy generated.";

{/*👉*/}       console.log(aiResponse);
    // Clean and format output
    const formattedResponse = aiResponse
      .replace(/\n{3,}/g, "\n\n")
      .replace(/^\s*[-*+]\s*/gm, "- ")
      .trim();

    return NextResponse.json({
      success: true,
      response: formattedResponse,
    });
  } catch (error) {
    console.error("Defend-case API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}
