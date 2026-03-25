"use client";

import { createContext, useContext } from "react";

export interface RoleState {
  isAuthenticated: boolean;
  role: "admin" | "user" | null;
  accessCode: string | null;
  isLoading: boolean;
  login: (code: string) => Promise<void>;
  logout: () => void;
}

export const RoleContext = createContext<RoleState>({
  isAuthenticated: false,
  role: null,
  accessCode: null,
  isLoading: true,
  login: async () => {},
  logout: () => {},
});

export function useRole(): RoleState {
  return useContext(RoleContext);
}

export const STORAGE_KEY_CODE = "playground_code";
export const STORAGE_KEY_ROLE = "cournot_role";
