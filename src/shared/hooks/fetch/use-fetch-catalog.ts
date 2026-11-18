"use client";

import { createDataHook } from "./use-data-hook";

export const useFetchUsuarios = createDataHook(["usuario"], "/api/appweb/listausuario", (i) => ({
  ...i,
  value: i.cod_usuario ?? i.COD_USUARIO,
  label: i.usuario ?? i.USUARIO,
}));
