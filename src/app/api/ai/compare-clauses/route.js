import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file1 = formData.get('file1');
    const file2 = formData.get('file2');

    if (!file1 || !file2) {
      return NextResponse.json({ error: 'Two files are required for comparison' }, { status: 400 });
    }

    // Create FormData to send to Python backend
    const backendFormData = new FormData();
    backendFormData.append('file1', file1);
    backendFormData.append('file2', file2);

    const response = await fetch('http://localhost:8000/compare-clauses', {
      method: 'POST',
      body: backendFormData,
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: data.error || 'Failed to compare clauses' }, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in clause comparison:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
