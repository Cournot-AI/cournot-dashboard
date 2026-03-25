import { AlertTriangle, XCircle } from "lucide-react";

export function ErrorCallout({ errors }: { errors: string[] }) {
  if (errors.length === 0) return null;
  return (
    <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
      <div className="flex items-center gap-2 mb-2">
        <XCircle className="h-4 w-4 text-red-400" />
        <span className="text-sm font-semibold text-red-400">
          {errors.length} Error{errors.length > 1 ? "s" : ""}
        </span>
      </div>
      <ul className="space-y-1.5">
        {errors.map((err, i) => (
          <li key={i} className="text-xs text-red-300/80 font-mono leading-relaxed pl-6">
            {err}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ParseFailedBanner({ error }: { error: string }) {
  return (
    <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle className="h-4 w-4 text-amber-400" />
        <span className="text-sm font-semibold text-amber-400">Parse Failed</span>
      </div>
      <p className="text-xs text-amber-300/80 font-mono leading-relaxed pl-6">{error}</p>
    </div>
  );
}
