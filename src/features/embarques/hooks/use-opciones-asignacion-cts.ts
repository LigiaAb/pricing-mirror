"use client";

import { centrosCosto, empleadosUsuarios, empresas, estados, tipos } from "@/features/catalogos";

export function useOpcionesAsignacionCts(codEmpresa: string, codCc: string) {
  const empresasQuery = empresas.useLista();
  const centrosQuery = centrosCosto.useLista();
  const empleadosQuery = empleadosUsuarios.useLista();
  const tiposQuery = tipos.useLista({ tipo_tabla: "TRANSPORTE" });
  const estadosQuery = estados.useLista();
  const usuarios = new Map<string, string>();
  for (const empleado of empleadosQuery.data ?? []) {
    if (String(empleado.codCc) !== codCc || !codCc) continue;
    usuarios.set(String(empleado.codUsuario), empleado.nombreCompleto);
  }
  return {
    empresas: (empresasQuery.data ?? []).map((e) => ({
      value: String(e.cod_empresa),
      label: e.nombre_emp,
    })),
    centros: (centrosQuery.data ?? [])
      .filter((c) => String(c.codEmpresaCc) === codEmpresa)
      .map((c) => ({ value: String(c.codCc), label: c.nombreCc })),
    empleados: [...usuarios].map(([value, label]) => ({ value, label })),
    tipos: (tiposQuery.data ?? [])
      .filter((t) => t.tipoTabla === "TRANSPORTE")
      .map((t) => ({ value: String(t.codTipo), label: t.nomTipo })),
    estados: (estadosQuery.data ?? [])
      .filter((e) => e.nom_tipo === "GLOBAL")
      .map((e) => ({ value: String(e.cod_estado), label: e.estado_desc })),
  };
}
