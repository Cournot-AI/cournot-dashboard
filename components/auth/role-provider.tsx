"use client";

import { useState, useEffect, useCallback, type ReactNode } from "react";
import { toast } from "sonner";
import { RoleContext, STORAGE_KEY_CODE, STORAGE_KEY_ROLE } from "@/lib/role";

const TEST_AUTH = process.env.NEXT_PUBLIC_ENABLE_TEST_AUTH === "true";
const TEST_CODE = "__test_admin_code__";

async function fetchRole(code: string): Promise<"admin" | "user"> {
  const res = await fetch("/api/proxy/markets/is_admin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const json = await res.json();
      if (json.msg) msg = json.msg;
      else if (json.detail) msg = json.detail;
    } catch { /* ignore */ }
    throw new Error(msg);
  }
  const json = await res.json();
  // Backend error envelope: { code: 4100, msg: "invalid code" }
  if (json.code && json.code !== 0) {
    throw new Error(json.msg || json.detail || "Invalid code");
  }
  const isAdmin = json.data?.is_admin ?? json.is_admin ?? false;
  return isAdmin ? "admin" : "user";
}

export function RoleProvider({ children }: { children: ReactNode }) {
  const [accessCode, setAccessCode] = useState<string | null>(null);
  const [role, setRole] = useState<"admin" | "user" | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore from localStorage on mount
  useEffect(() => {
    async function restore() {
      if (TEST_AUTH) {
        localStorage.setItem(STORAGE_KEY_CODE, TEST_CODE);
        localStorage.setItem(STORAGE_KEY_ROLE, "admin");
        setAccessCode(TEST_CODE);
        setRole("admin");
        setIsLoading(false);
        return;
      }
      const storedCode = localStorage.getItem(STORAGE_KEY_CODE);
      if (!storedCode) {
        setIsLoading(false);
        return;
      }
      try {
        const r = await fetchRole(storedCode);
        setAccessCode(storedCode);
        setRole(r);
        localStorage.setItem(STORAGE_KEY_ROLE, r);
      } catch {
        // Code is invalid or expired — clear it
        localStorage.removeItem(STORAGE_KEY_CODE);
        localStorage.removeItem(STORAGE_KEY_ROLE);
      }
      setIsLoading(false);
    }
    restore();
  }, []);

  const login = useCallback(async (code: string) => {
    setIsLoading(true);
    try {
      const r = await fetchRole(code);
      localStorage.setItem(STORAGE_KEY_CODE, code);
      localStorage.setItem(STORAGE_KEY_ROLE, r);
      setAccessCode(code);
      setRole(r);
      toast.success(`Logged in as ${r}`);
    } catch (err) {
      toast.error("Invalid access code", {
        description: err instanceof Error ? err.message : "Please check your code.",
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY_CODE);
    localStorage.removeItem(STORAGE_KEY_ROLE);
    setAccessCode(null);
    setRole(null);
    toast("Logged out");
  }, []);

  return (
    <RoleContext.Provider
      value={{
        isAuthenticated: accessCode !== null && role !== null,
        role,
        accessCode,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </RoleContext.Provider>
  );
}
