import { NextResponse } from 'next/server';
import { geminiFlash2 } from '../../../../lib/gemini';
import { getSupabaseAdmin } from '../../../../lib/supabaseClient';
import { z } from 'zod';

const LogDataSchema = z.object({
  machine_id: z.number().int().nullable(),
  machine_department: z.string().nullable(),
  chief_complaint: z.string().nullable(),
  person_reporting: z.string().nullable(),
  phone_number: z.string().nullable(),
});

const RequestBodySchema = z.object({
  rawTranscript: z.string().min(1, 'Transcript cannot be empty'),
});

export async function POST(request) {
  try {
    const body = await request.json();
    const validation = RequestBodySchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validation.error.format() },
        { status: 400 }
      );
    }

    const { rawTranscript } = validation.data;

    const prompt = [
      'Extract the following information from the provided transcript.',
      'Format the output as a JSON object with the specified keys.',
      'If a piece of information is not found or unclear, use null for its value.',
      '',
      'Keys to extract:',
      '- machine_id (integer, e.g., 123, 4005)',
      '- machine_department (text, e.g., "ER", "Cardiology", "Floor 3 West")',
      '- chief_complaint (text, e.g., "Screen is blank", "Making a loud noise", "Error code E55")',
      '- person_reporting (text, e.g., "Nurse Sarah", "Dr. John Smith", "Tech David")',
      '- phone_number (text, e.g., "555-1234", "+14155552671", "x7890")',
      '',
      'Transcript:',
      `"${rawTranscript}"`,
      '',
      'JSON Output:',
    ].join('\n');

    const result = await geminiFlash2.generateContent(prompt);
    const responseText = result.response.text();

    let extracted;
    try {
      const match = responseText.match(/```json\n([\s\S]*?)\n```/);
      extracted = match ? JSON.parse(match[1]) : JSON.parse(responseText);
    } catch (err) {
      console.error('Gemini output parsing error:', err, 'Raw:', responseText);
      return NextResponse.json(
        { error: 'Failed to parse AI response.' },
        { status: 500 }
      );
    }

    const parsed = LogDataSchema.safeParse(extracted);
    if (!parsed.success) {
      console.error('Validation error:', parsed.error.format(), 'Data:', extracted);
      return NextResponse.json(
        { error: 'AI response validation failed', details: parsed.error.format() },
        { status: 500 }
      );
    }

    const toInsert = {
      ...parsed.data,
      raw_transcript: rawTranscript,
      date_time: new Date().toISOString(),
    };

    const supabaseAdmin = getSupabaseAdmin();
    const { data: dbData, error: dbErr } = await supabaseAdmin
      .from('pcb')
      .insert(toInsert)
      .select()
      .single();

    if (dbErr) {
      console.error('Supabase error:', dbErr);
      return NextResponse.json(
        { error: `Database error: ${dbErr.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Log submitted successfully', data: dbData, extractedData: parsed.data },
      { status: 201 }
    );
  } catch (err) {
    console.error('API Error:', err);
    return NextResponse.json(
      { error: `Internal server error: ${err.message}` },
      { status: 500 }
    );
  }
}
