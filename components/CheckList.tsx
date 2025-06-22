import { CheckCircle2, Circle, AlertTriangle } from 'lucide-react';

export interface ChecklistItemType { // Make sure 'export' is present
  id: string;
  label: string;
  keywords: string[];
  detected: boolean;
  value?: string | number | null;
  validationRegex?: RegExp;
  errorMessage?: string;
}

interface ChecklistProps {
  items: ChecklistItemType[];
}

export default function Checklist({ items }: ChecklistProps) { // Make sure 'export default' is present
  if (!items || items.length === 0) return null;

  return (
    <div className="space-y-3 p-4 border rounded-lg bg-slate-50 dark:bg-slate-800">
      <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">Information Checklist:</h3>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id} className={`flex items-center p-2 rounded ${item.detected ? 'bg-green-100 dark:bg-green-900' : 'bg-slate-100 dark:bg-slate-700'}`}>
            {item.detected ? (
              <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
            ) : (
              <Circle className="h-5 w-5 text-slate-400 dark:text-slate-500 mr-2" />
            )}
            <span className={`flex-grow ${item.detected ? 'text-green-700 dark:text-green-300' : 'text-slate-600 dark:text-slate-300'}`}>
              {item.label}:
            </span>
            {item.value && <span className="text-sm text-blue-600 dark:text-blue-400 ml-2 font-medium">{String(item.value)}</span>}
            {item.errorMessage && (
              <div className="ml-auto flex items-center text-xs text-red-500">
                <AlertTriangle className="h-4 w-4 mr-1" />
                {item.errorMessage}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}