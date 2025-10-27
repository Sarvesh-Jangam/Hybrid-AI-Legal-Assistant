import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { document_text } = await request.json();

    if (!document_text || !document_text.trim()) {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 });
    }

    // Create FormData to send to Python backend
    const formData = new FormData();
    formData.append('document_text', document_text);

    const response = await fetch('http://localhost:8000/extract-clauses-from-text', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: data.error || 'Failed to extract clauses from text' }, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in text clause extraction:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
