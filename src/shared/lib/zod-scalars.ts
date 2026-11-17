/* STUB del repo espejo: solo tipos para verificar pricing. NO copiar al proyecto real. */
import { z } from "zod";
export declare const zId: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
export declare const zIdNullOpt: z.ZodOptional<z.ZodNullable<z.ZodUnion<[z.ZodString, z.ZodNumber]>>>;
export declare const zBoolOpt: z.ZodOptional<z.ZodNullable<z.ZodBoolean>>;
export declare const zIdNull: z.ZodNullable<z.ZodUnion<[z.ZodString, z.ZodNumber]>>;
export declare const zBool: z.ZodBoolean;
export declare const zStr: z.ZodString;
export declare const zStrNull: z.ZodNullable<z.ZodString>;
export declare const zStrNullOpt: z.ZodOptional<z.ZodNullable<z.ZodString>>;
export declare const zNum: z.ZodNumber;
export declare const zNumNull: z.ZodNullable<z.ZodNumber>;
