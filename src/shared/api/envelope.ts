/* STUB del repo espejo: solo tipos para verificar pricing. NO copiar al proyecto real. */
import type { z } from "zod";
export declare function parseEnvelope<S extends z.ZodType>(raw: unknown, schema: S, nombre?: string): Array<z.output<S>>;
