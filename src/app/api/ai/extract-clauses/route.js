import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Create FormData to send to Python backend
    const backendFormData = new FormData();
    backendFormData.append('file', file);

    const response = await fetch('http://localhost:8000/extract-clauses', {
      method: 'POST',
      body: backendFormData,
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: data.error || 'Failed to extract clauses' }, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in clause extraction:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
