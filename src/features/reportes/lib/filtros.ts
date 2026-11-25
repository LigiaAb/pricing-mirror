import React from "react";
import { centrosCosto, empleadosUsuarios, tipos } from "@/features/catalogos";
import { useContextoOperativoStore } from "@/features/shell";
import type { ComboboxOption } from "@/shared/components/ui/combobox";
import type { FiltroReporte } from "./definir-reporte";

/**
 * ATAJOS DE FILTROS
 *
 * Cada reporte elige sus filtros en `filtros: [...]`. Si un filtro no está aquí,
 * `filtroLista` (opciones fijas) o un objeto `FiltroReporte` propio.
 */

/** Centro de costo de la empresa del contexto; arranca en el CC del contexto. */
export function filtroCentroCosto(label = "Centro de costo"): FiltroReporte {
  return {
    id: "cod_cc",
    label,
    limpia: ["cod_usuario"],
    useValorInicial: () => {
      const cc = useContextoOperativoStore((s) => s.currentCentroCosto?.cod_cc);
      return cc == null ? "" : String(cc);
    },
    useOpciones: () => {
      const empresa = useContextoOperativoStore((s) => s.currentEmpresa?.cod_empresa);
      const { data, isLoading } = centrosCosto.useLista();
      const opciones = React.useMemo<ComboboxOption[]>(
        () =>
          (data ?? [])
            .filter((cc) => String(cc.codEmpresaCc) === String(empresa))
            .map((cc) => ({ value: String(cc.codCc), label: cc.nombreCc })),
        [data, empresa],
      );
      return { opciones, cargando: isLoading };
    },
  };
}

/** Usuarios (empleados) del CC elegido en `filtroCentroCosto`; sin CC, todos. */
export function filtroUsuario(label = "Usuario"): FiltroReporte {
  return {
    id: "cod_usuario",
    label,
    useOpciones: (valores) => {
      const codCc = valores.cod_cc || undefined;
      const { data, isLoading } = empleadosUsuarios.useLista({ cod_cc: codCc });
      const opciones = React.useMemo<ComboboxOption[]>(() => {
        // Un usuario puede venir repetido (varios puestos): se deja el primero.
        const vistos = new Set<string>();
        const lista: ComboboxOption[] = [];
        for (const u of data ?? []) {
          const value = String(u.codUsuario);
          if (vistos.has(value)) continue;
          vistos.add(value);
          lista.push({ value, label: u.nombreCompleto });
        }
        return lista;
      }, [data]);
      return { opciones, cargando: isLoading };
    },
  };
}

/** Tipos de una tabla del catálogo `TIPO` (ej. `filtroTipo("PAGO", "cod_tipo_pago", "Tipo de pago")`). */
export function filtroTipo(tipoTabla: string, id: string, label: string): FiltroReporte {
  return {
    id,
    label,
    useOpciones: () => {
      const { data, isLoading } = tipos.useLista({ tipo_tabla: tipoTabla });
      const opciones = React.useMemo<ComboboxOption[]>(
        () => (data ?? []).map((t) => ({ value: String(t.codTipo), label: t.nomTipo })),
        [data],
      );
      return { opciones, cargando: isLoading };
    },
  };
}

/** Opciones fijas. */
export function filtroLista(
  id: string,
  label: string,
  opciones: readonly ComboboxOption[],
): FiltroReporte {
  return { id, label, useOpciones: () => ({ opciones }) };
}
