import { Clock, FileSearch, AlertCircle } from "lucide-react";

type EmptyType = "pending" | "not_found" | "no_data";

const config: Record<EmptyType, { icon: typeof Clock; title: string; desc: string }> = {
  pending: {
    icon: Clock,
    title: "Awaiting Resolution",
    desc: "This case has not been processed yet. The oracle will run once the resolution window opens.",
  },
  not_found: {
    icon: FileSearch,
    title: "Not Found",
    desc: "The requested market case could not be found.",
  },
  no_data: {
    icon: AlertCircle,
    title: "No Data Available",
    desc: "No data is available for this section yet.",
  },
};

export function EmptyState({ type = "no_data" }: { type?: EmptyType }) {
  const c = config[type];
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
        <c.icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="text-sm font-semibold">{c.title}</h3>
      <p className="mt-1 max-w-xs text-xs text-muted-foreground">{c.desc}</p>
    </div>
  );
}
