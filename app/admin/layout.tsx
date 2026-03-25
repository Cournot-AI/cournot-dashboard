"use client";

import { useRole } from "@/lib/role";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";
import { ShieldAlert } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, role, isLoading } = useRole();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast.error("Please enter your access code first");
      router.push("/");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Redirecting
  }

  if (role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <ShieldAlert className="h-12 w-12 text-muted-foreground" />
        <h2 className="text-lg font-semibold">Access Denied</h2>
        <p className="text-sm text-muted-foreground">
          You need admin access to view this page.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
