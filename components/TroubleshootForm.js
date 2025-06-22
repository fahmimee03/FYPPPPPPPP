import { useState } from "react";

export default function TroubleshootForm() {
  const [machineId, setMachineId] = useState("");
  const [defects, setDefects] = useState("");
  const [report, setReport] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setResult("");

    try {
      const res = await fetch("/api/troubleshoot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          machineId,
          defects: defects.split(",").map((d) => d.trim()),
          report,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data.steps);
    } catch (err) {
      setResult("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4">
      <div>
        <label className="block font-semibold">Machine ID</label>
        <input
          type="text"
          value={machineId}
          onChange={(e) => setMachineId(e.target.value)}
          className="border p-2 w-full"
          required
        />
      </div>
      <div>
        <label className="block font-semibold">Defects (comma-sep)</label>
        <input
          type="text"
          value={defects}
          onChange={(e) => setDefects(e.target.value)}
          className="border p-2 w-full"
          placeholder="misaligned_camera, clogged_nozzle"
          required
        />
      </div>
      <div>
        <label className="block font-semibold">Operator Report</label>
        <textarea
          value={report}
          onChange={(e) => setReport(e.target.value)}
          className="border p-2 w-full"
          rows={3}
          required
        />
      </div>
      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded"
        disabled={loading}
      >
        {loading ? "Working…" : "Get Troubleshooting Steps"}
      </button>

      {result && (
        <pre className="bg-gray-100 p-4 mt-4 whitespace-pre-wrap">
          {result}
        </pre>
      )}
    </form>
  );
}
