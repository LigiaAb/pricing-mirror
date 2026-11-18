import { useAuthStore } from "@/shared/stores/auth-store";

export function getToken(): string | null {
  return useAuthStore.getState().token;
}

export function clearSession(): void {
  useAuthStore.getState().logout();
}
