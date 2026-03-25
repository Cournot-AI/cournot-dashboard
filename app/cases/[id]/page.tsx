import { CaseDetailClient } from "@/components/cases/case-detail-client";

// Enable dynamic rendering (requires output: "standalone", not "export")
export const dynamic = "force-dynamic";

export default function CaseDetailPage({ params }: { params: { id: string } }) {
  return <CaseDetailClient eventId={params.id} />;
}
