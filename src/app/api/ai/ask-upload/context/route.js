import { NextResponse } from "next/server";

export async function POST(req) {
  const formData = await req.formData();

  // formData should contain "query" and "file_id" file_id is returned from ask-upload

  const response = await fetch(`${process.env.FASTAPI_URL}/ask-context`, {
    method: "POST",
    body: formData,
  });

  const data = await response.json();
  return NextResponse.json(data);
}
