import React from "react";
import { centrosCosto, empleadosUsuarios, empresas, estados, tipos } from "@/features/catalogos";
import { useFetchEntidades } from "@/features/entidades";
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
 * Empresa; arranca en la del contexto. La pantalla la agrega a todos los reportes cuando el
 * usuario tiene el permiso "Filtrar Empresa Centro Costo" (`FILTROS_EMPRESA_CC`).
 */
export function filtroEmpresa(label = "Empresa"): FiltroReporte {
  return {
    id: "cod_empresa",
    label,
    useValorInicial: () => {
      const empresa = useContextoOperativoStore((s) => s.currentEmpresa?.cod_empresa);
      return empresa == null ? "" : String(empresa);
    },
    useOpciones: () => {
      const { data, isLoading } = empresas.useLista();
      const opciones = React.useMemo<ComboboxOption[]>(
        () => (data ?? []).map((e) => ({ value: String(e.cod_empresa), label: e.nombre_emp })),
        [data],
      );
      return { opciones, cargando: isLoading };
    },
  };
}

/** Centro de costo de la empresa elegida (sin empresa, todos); arranca en el del contexto. */
export function filtroCentroCosto(label = "Centro de costo"): FiltroReporte {
  return {
    id: "cod_cc",
    label,
    depende: ["cod_empresa"],
    useValorInicial: () => {
      const cc = useContextoOperativoStore((s) => s.currentCentroCosto?.cod_cc);
      return cc == null ? "" : String(cc);
    },
    useOpciones: (valores) => {
      const empresa = valores.cod_empresa;
      const { data, isLoading } = centrosCosto.useLista();
      const opciones = React.useMemo<ComboboxOption[]>(
        () =>
          (data ?? [])
            .filter((cc) => !empresa || String(cc.codEmpresaCc) === empresa)
            .map((cc) => ({ value: String(cc.codCc), label: cc.nombreCc })),
        [data, empresa],
      );
      return { opciones, cargando: isLoading };
    },
  };
}

/** Empresa y centro de costo: los pone la pantalla con el permiso "Filtrar Empresa Centro Costo". */
export const FILTROS_EMPRESA_CC: readonly FiltroReporte[] = [filtroEmpresa(), filtroCentroCosto()];

/**
 * Usuarios (empleados) del CC de la consulta (el elegido o el del contexto); sin CC, todos.
 * `id` = nombre del parámetro que espera el endpoint (ej. `cod_asesor`).
 */
export function filtroUsuario(label = "Usuario", id = "cod_usuario"): FiltroReporte {
  return {
    id,
    label,
    depende: ["cod_cc"],
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
 * Clientes activos (entidades `CLIENTE`, como Seguimiento de cliente de Reportes CRM).
 * `id` = nombre del parámetro que espera el endpoint (ej. `cod_cliente`).
 */
export function filtroCliente(label = "Cliente", id = "cod_cliente"): FiltroReporte {
  return {
    id,
    label,
    useOpciones: () => {
      const { data, isLoading } = useFetchEntidades({ tipo_entidad: "CLIENTE", cod_estado: 1 });
      // Miles de clientes: opciones memoizadas (el Combobox virtualiza más de 1000).
      const opciones = React.useMemo<ComboboxOption[]>(() => {
        const clientes: Array<{ entidad_id: string | number; entidad_nombre: string }> = data ?? [];
        return clientes.map((c) => ({ value: String(c.entidad_id), label: c.entidad_nombre }));
      }, [data]);
      return { opciones, cargando: Boolean(isLoading) };
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
