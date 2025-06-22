// src/app/maintenance-logs/page.tsx
import { supabase } from '../../../lib/supabaseClient';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/card';

export default async function MaintenanceLogsPage() {
  const { data: logs, error } = await supabase
    .from('pcb')
    .select('*')
    .order('date_time', { ascending: false });

  if (error) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Error Loading Logs</CardTitle>
            <CardDescription>{error.message}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">Maintenance Logs</CardTitle>
          <CardDescription>All reported machine issues, newest first</CardDescription>
        </CardHeader>
        <CardContent className="overflow-auto">
          <table className="min-w-full table-auto border-collapse">
            <thead>
              <tr className="bg-gray-100 dark:bg-slate-800">
                <th className="px-4 py-2 text-left">Date &amp; Time</th>
                <th className="px-4 py-2 text-left">Machine ID</th>
                <th className="px-4 py-2 text-left">Department</th>
                <th className="px-4 py-2 text-left">Complaint</th>
                <th className="px-4 py-2 text-left">Reporter</th>
                <th className="px-4 py-2 text-left">Phone</th>
                <th className="px-4 py-2 text-left">Raw Transcript</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                    No maintenance logs found.
                  </td>
                </tr>
              ) : (
                logs.map((entry) => (
                  <tr key={entry.id} className="border-t dark:border-slate-700">
                    <td className="px-4 py-2 whitespace-nowrap">
                      {new Date(entry.date_time).toLocaleString()}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">{entry.machine_id}</td>
                    <td className="px-4 py-2 whitespace-nowrap">{entry.machine_department}</td>
                    <td className="px-4 py-2">{entry.chief_complaint}</td>
                    <td className="px-4 py-2 whitespace-nowrap">{entry.person_reporting}</td>
                    <td className="px-4 py-2 whitespace-nowrap">{entry.phone_number}</td>
                    <td className="px-4 py-2 break-words">{entry.raw_transcript}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
