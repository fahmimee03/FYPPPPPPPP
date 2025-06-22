// src/app/page.tsx


"use client";

import { useState, FormEvent } from "react";

import VoiceDashboard from "../../components/VoiceDashboard";

export default function HomePage() {
    // ───── your existing PCB‐Inspector state ─────
  const [file, setFile]           = useState<File | null>(null);
  const [imgSrc, setImgSrc]       = useState<string | null>(null);
  const [defects, setDefects]     = useState<{class:string,confidence:number}[]>([]);
  const [metrics, setMetrics]     = useState<Record<string, number>>({});
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);



    // ───── your existing PCB‐Inspector submit handler ─────
  async function handleSubmit(e: FormEvent) {
  e.preventDefault();
  console.log("👆 handleSubmit fired");

  if (!file) {
    console.log("⚠️ No file selected, aborting upload");
    setError("Please choose a file first.");
    return;
  }

  console.log("📦 File ready for upload:", file.name, file.size, "bytes");
  setError(null);
  setLoading(true);
  setImgSrc(null);
  setDefects([]);
  setMetrics({});

  const formData = new FormData();
  formData.append("file", file);

  try {
    console.log("🚀 POSTing to http://localhost:8000/detect/");
    const res = await fetch("http://localhost:8000/detect/", {
      method: "POST",
      body: formData,
    });
    console.log(`⬅️ Received response: ${res.status} ${res.statusText}`);

    if (!res.ok) {
      const txt = await res.text();
      console.error("❌ Server returned error:", txt);
      throw new Error(txt || res.statusText);
    }

    const json = await res.json();
    console.log("✅ Parsed JSON response:", json);

    // build absolute URL for the image
    const imageURL = `http://localhost:8000${json.annotated_url}`;
    console.log("🖼️ Annotated image URL:", imageURL);
    setImgSrc(imageURL);

    console.log("🔍 Defect list:", json.defects);
    setDefects(json.defects);

    console.log("📊 Model metrics:", json.metrics);
    setMetrics(json.metrics);
  } catch (err: any) {
    console.error("🔥 handleSubmit caught error:", err);
    setError(err.message || "Upload failed");
  } finally {
    console.log("🔄 handleSubmit complete, clearing loading state");
    setLoading(false);
  }
}


  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-8 space-y-16">
      {/* PCB Defect Inspector */}
      <section className="w-full max-w-md space-y-4">
        <h1 className="text-4xl font-bold text-gray-800 text-center">
          PCB Defect Inspector
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className=" block w-full bg-gray-800 hover:bg-gray-700 text-white font-semibold py-2 px-3 rounded-md cursor-pointer"
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 rounded ${
              loading
                ? "bg-gray-500 cursor-not-allowed"
                : "bg-gray-800 hover:bg-gray-700"
            } text-white font-semibold uppercase tracking-wide`}
          >
            {loading ? "Inspecting…" : "Upload & Inspect"}
          </button>
        </form>
      </section>

      {/* Annotated Image with Floating Panels */}
      {imgSrc && (
        <div className="w-full max-w-3xl mx-auto">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800 text-center">
            Annotated Result
          </h2>
          <div className="relative">
            <img
              src={imgSrc}
              alt="Annotated PCB"
              className="w-full rounded-lg shadow-xl border-4 border-gray-300"
            />

            {/* Detected Defects Panel */}
            <div className="absolute top-4 right-4 bg-gray-900 bg-opacity-80 text-white p-4 rounded-lg shadow-2xl w-64">
              <h3 className="text-lg font-bold mb-2">Detected Defects</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {defects.map((d, i) => (
                  <li key={i}>
                    {d.class} — {(d.confidence * 100).toFixed(1)}%
                  </li>
                ))}
              </ul>
            </div>

            {/* Validation Metrics Panel */}
            <div className="absolute bottom-4 right-4 bg-gray-900 bg-opacity-80 text-white p-4 rounded-lg shadow-2xl w-64">
              <h3 className="text-lg font-bold mb-2">Validation Metrics</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {Object.entries(metrics).map(([k, v]) => (
                  <li key={k}>
                    {k}: {(v * 100).toFixed(1)}%
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* AOI Maintenance Assistant */}
      <section className="w-full max-w-md space-y-6">
        <h1 className="text-3xl font-semibold text-center text-gray-800">
          AOI Maintenance Assistant
        </h1>
        
      
      </section>
    </div>
  );
}