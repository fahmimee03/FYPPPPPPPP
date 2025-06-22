// src/app/api/troubleshoot/route.js
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(request) {
  try {
    const { machineId, defects, report } = await request.json();
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const chat = await openai.chat.completions.create({
      model: 'ft:gpt-4o-mini-2024-07-18:fahmi:aoi-maint-v1:Bc7HnRL5',
      messages: [
        { role: 'system', content: 'You are an AOI maintenance assistant.' },
        { role: 'user', content: `Machine ${machineId} report: ${report}` },
      ],
    });

    return NextResponse.json({ steps: chat.choices[0].message.content });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
