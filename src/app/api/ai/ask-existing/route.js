import { NextResponse } from "next/server";

export async function POST(req) {
  const formData = await req.formData();

  //form data should have query field

  const response = await fetch("http://localhost:8000/ask-existing", {
    method: "POST",
    body: formData,
  });

  const data = await response.json();
  return NextResponse.json(data);
}
