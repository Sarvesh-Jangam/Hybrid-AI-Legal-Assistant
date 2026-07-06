import { NextResponse } from "next/server";

export async function POST(req) {
  const formData = await req.formData();

  // formData should have "query" and "file"
  // file is a File object

  const response = await fetch(`${process.env.FASTAPI_URL}/ask-upload`, {
    method: "POST",
    body: formData,
  });

  const data = await response.json();
  return NextResponse.json(data);
}
