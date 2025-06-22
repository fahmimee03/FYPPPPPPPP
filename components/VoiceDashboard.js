'use client';
import React, { useEffect, useRef, useState } from 'react';

// utility to strip non-ASCII everywhere
function toASCII(str = '') {
  return str.replace(/[^\x00-\x7F]/g, '');
}

export default function VoiceDashboard() {
  const [recording, setRecording]   = useState(false);
  const [interim, setInterim]       = useState('');
  const [transcript, setTranscript] = useState('');
  const [logs, setLogs]             = useState([]);
  const recogRef = useRef(null);

  // 1) init Web Speech Recognition once
  useEffect(() => {
    if (!('webkitSpeechRecognition' in window)) return;
    const SR    = window.webkitSpeechRecognition;
    const recog = new SR();
    recog.continuous     = true;
    recog.interimResults = true;
    recog.lang           = 'en-US';

    recog.onresult = (e) => {
      let interimT = '', finalT = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalT += t + ' ';
        else interimT += t + ' ';
      }
      setInterim(interimT);
      if (finalT) {
        setTranscript(prev => (prev + finalT).trim() + ' ');
      }
    };

    recog.onend = () => {
      // only flip UI state—API call happens in stop()
      setRecording(false);
    };

    recogRef.current = recog;
  }, []);

  // 2) start recording
  const start = () => {
    setTranscript('');
    setInterim('');
    setRecording(true);
    recogRef.current.start();
  };

  // 3) stop recording & send
  const stop = async () => {
    recogRef.current.stop();
    setRecording(false);

    // pick transcript if we got final bits, otherwise interim
    let finalText = transcript.trim() || interim.trim();
    if (!finalText) {
      console.warn('No speech detected to send.');
      return;
    }

    // sanitize then send
    finalText = toASCII(finalText);
    try {
      const res = await fetch('/api/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: finalText })
      });
      if (!res.ok) {
        console.error('API error', await res.text());
        return;
      }
      const { logs } = await res.json();
      setLogs(logs);
    } catch (e) {
      console.error('Network error', e);
    }
  };

  return (
    <div className="p-6 bg-white rounded shadow max-w-xl mx-auto">
      <button
        onClick={recording ? stop : start}
        className={`p-4 rounded-full border-2 ${
          recording ? 'border-red-500 bg-red-100' : 'border-green-500 bg-green-100'
        }`}
      >
        {recording ? '■' : '🎤'}
      </button>

      <p className="mt-4 text-gray-600">
        {recording
          ? `Listening… Interim: ${interim}`
          : 'Click to record a machine report'}
      </p>

      <pre className="bg-gray-100 p-2 mt-2 text-sm">
        {`Full Transcript so far: ${transcript}`}
      </pre>

      <div className="mt-6 overflow-auto">
        <table className="min-w-full table-auto border-collapse">
          <thead>
            <tr className="bg-gray-100">
              {[
                'Date & Time','Machine ID','Department',
                'Complaint','Reporter','Phone','Raw Transcript'
              ].map(h => (
                <th key={h} className="px-4 py-2">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 && (
              <tr>
                <td colSpan={7} className="p-4 text-center text-gray-500">
                  No logs yet.
                </td>
              </tr>
            )}
            {logs.map(log => (
              <tr key={log.id} className="border-t">
                <td className="px-4 py-2">
                  {new Date(log.date_time).toLocaleString()}
                </td>
                <td className="px-4 py-2">{log.machine_id}</td>
                <td className="px-4 py-2">{log.machine_department}</td>
                <td className="px-4 py-2">{log.chief_complaint}</td>
                <td className="px-4 py-2">{log.person_reporting}</td>
                <td className="px-4 py-2">{log.phone_number}</td>
                <td className="px-4 py-2 break-words">{log.raw_transcript}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
