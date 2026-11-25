import React from "react";
import { centrosCosto, empleadosUsuarios, estados, tipos } from "@/features/catalogos";
import { useContextoOperativoStore } from "@/features/shell";
import type { ComboboxOption } from "@/shared/components/ui/combobox";
import type { FiltroReporte } from "./definir-reporte";

/**
 * ATAJOS DE FILTROS
 *
 * Cada reporte elige sus filtros en `filtros: [...]`. Si un filtro no está aquí,
 * `filtroLista` (opciones fijas) o un objeto `FiltroReporte` propio.
 */

/**
 * Centro de costo de la empresa del contexto; arranca en el CC del contexto. Al cambiar,
 * limpia los filtros de `limpia` (por defecto el usuario, que depende del CC).
 */
export function filtroCentroCosto(
  label = "Centro de costo",
  limpia: readonly string[] = ["cod_usuario"],
): FiltroReporte {
  return {
    id: "cod_cc",
    label,
    limpia,
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

/**
 * Usuarios (empleados) del CC elegido en `filtroCentroCosto`; sin CC, todos. `id` = nombre
 * del parámetro que espera el endpoint (ej. `cod_asesor`).
 */
export function filtroUsuario(label = "Usuario", id = "cod_usuario"): FiltroReporte {
  return {
    id,
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

/**
 * Tipos de una tabla del catálogo `TIPO` (ej. `filtroTipo("PAGO", "cod_tipo_pago", "Tipo de pago")`).
 * `solo`: nombres permitidos (sin esto, todos los de la tabla).
 */
export function filtroTipo(
  tipoTabla: string,
  id: string,
  label: string,
  solo?: readonly string[],
): FiltroReporte {
  return {
    id,
    label,
    useOpciones: () => {
      const { data, isLoading } = tipos.useLista({ tipo_tabla: tipoTabla });
      const opciones = React.useMemo<ComboboxOption[]>(
        () =>
          (data ?? [])
            .filter((t) => !solo || solo.includes(t.nomTipo))
            .map((t) => ({ value: String(t.codTipo), label: t.nomTipo })),
        [data],
      );
      return { opciones, cargando: isLoading };
    },
  };
}

/** Estados del catálogo de un tipo (ej. `filtroEstado("ACTIVIDAD", "cod_estado")`). */
export function filtroEstado(nomTipo: string, id: string, label = "Estado"): FiltroReporte {
  return {
    id,
    label,
    useOpciones: () => {
      const { data, isLoading } = estados.useLista();
      const opciones = React.useMemo<ComboboxOption[]>(
        () =>
          (data ?? [])
            .filter((e) => e.nom_tipo === nomTipo)
            .map((e) => ({ value: String(e.cod_estado), label: e.estado_desc })),
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
