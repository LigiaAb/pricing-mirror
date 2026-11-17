import { z } from "zod";
import { zId, zNumNull, zStrNullOpt } from "@/shared/lib/zod-scalars";
import { createCatalogo, createCatalogoMutation } from "./create-catalogo";

export const usuarioSchema = z.object({
  cod_usuario: zId,
  usuario: z.string(),
  cod_estado: zId,
  cod_cambio_pass: zId,
  ultima_conexion: zStrNullOpt,
  json: zStrNullOpt,
  ruta_inicial: zStrNullOpt,
  cod_cropa: zStrNullOpt,
  tipo_id: zNumNull.optional(),
});

export interface Usuario {
  codUsuario: string | number;
  usuario: string;
  codEstado: string | number;
  codCambioPass: string | number;
  ultimaConexion: string | undefined | null;
  json: string | undefined | null;
  rutaInicial: string | undefined | null;
  codCropa: string | undefined | null;
  tipo_id: number | null | undefined;
  value: string | number;
  label: string;
}

export const usuarios = createCatalogo({
  nombre: "listausuario",
  schema: usuarioSchema,
  endpoints: {
    lista: "/api/appweb/listausuario",
    insertar: "/api/appweb/insertarusuario",
    actualizar: "/api/appweb/actualizarusuario",
  },
  map: (raw): Usuario => ({
    codUsuario: raw.cod_usuario,
    usuario: raw.usuario,
    codEstado: raw.cod_estado,
    codCambioPass: raw.cod_cambio_pass,
    ultimaConexion: raw.ultima_conexion,
    json: raw.json,
    rutaInicial: raw.ruta_inicial,
    codCropa: raw.cod_cropa,
    tipo_id: raw.tipo_id,
    value: raw.cod_usuario,
    label: raw.usuario,
  }),
});

/** Reinicio de contraseña: fuera del molde CRUD del factory (§3 plan de personal). */
export const useActualizarUsuarioPass = createCatalogoMutation(
  usuarios.keys.all,
  "/api/appweb/actualizarusuariopass",
);
