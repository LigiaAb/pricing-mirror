import Sqids from "sqids";
import { env } from "@/shared/config/env";

const alphabet = env.NEXT_PUBLIC_SQIDS_ALPHABET;

const sqids = new Sqids({
  minLength: 8,
  ...(alphabet ? { alphabet } : {}),
});

export function encodeId(id: number): string {
  return sqids.encode([id]);
}

export function encodeIds(...ids: number[]): string {
  return sqids.encode(ids);
}

export function decodeId(sqid: string): number | null {
  if (!sqid) return null;
  const decoded = sqids.decode(sqid);
  return decoded?.[0] ?? null;
}

export function decodeIds(sqid: string): number[] {
  if (!sqid) return [];
  return sqids.decode(sqid);
}

export { sqids };
