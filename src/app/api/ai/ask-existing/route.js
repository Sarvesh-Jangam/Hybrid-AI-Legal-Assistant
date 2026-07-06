import { NextResponse } from "next/server";

export async function POST(req) {
  const formData = await req.formData();

  //form data should have query field

  const response = await fetch(`${process.env.FASTAPI_URL}/ask-existing`, {
    method: "POST",
    body: formData,
  });

  const data = await response.json();
  return NextResponse.json(data);
}
