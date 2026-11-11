/* STUB del repo espejo: solo tipos para verificar pricing. NO copiar al proyecto real. */
import { z } from "zod";
export declare const zId: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
export declare const zIdNullOpt: z.ZodOptional<z.ZodNullable<z.ZodUnion<[z.ZodString, z.ZodNumber]>>>;
export declare const zBoolOpt: z.ZodOptional<z.ZodNullable<z.ZodBoolean>>;
