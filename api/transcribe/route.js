// src/app/api/transcribe/route.js
import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import clientPromise from '../../../../lib/mongodb';


export async function POST(request) {
  try {
    const blob = await request.blob();
    const buffer = Buffer.from(await blob.arrayBuffer());
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const transcription = await openai.audio.transcriptions.create({
      file: buffer,
      model: 'ft:gpt-4o-mini-2024-07-18:fahmi:aoi-maint-v1:Bc7HnRL5',
      response_format: 'json',
    });

    return NextResponse.json({ text: transcription.text });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}