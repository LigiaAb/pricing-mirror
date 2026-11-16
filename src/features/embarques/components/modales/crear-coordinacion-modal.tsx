"use client";

/**
 * Modal "Crear Coordinación" del detalle CTS (Fase A.3 del plan de paridad):
 * estados info → creando (spinner, texto según servicio) → éxito / error.
 * Primero aplica los cambios pendientes de la carta con el motor de commit;
 * luego, si el servicio es Consolidado (id_servicio 10) asigna la guía con
 * asignar-correlativo-guia-x-criterio (requiere cod_file); para el resto
 * avanza el estado a "coordinación creada" (40) explícitamente. Un error que
 * contenga "sin seguimiento" se tolera como éxito sin guía (regla de negocio
 * del legacy). Al terminar navega a la lista CTS con `?guia=…` / `?creada=1`
 * (contrato del aviso de PR #46).
 */

import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useUpdateCoordinacionEstado } from "@/features/coordinaciones";
import { useAssignCorrelativoGuiaXCriterio } from "@/features/correlativos";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog";
import {
  type CommitContextInput,
  useCommitPendingChanges,
} from "../../hooks/use-commit-pending-changes";
import { assertOk } from "../../lib/commit-engine/helpers";
import { ESTADO_COORDINACION_CREADA, ID_SERVICIO_CONSOLIDADO } from "../../lib/constantes";

type JsonRecord = Record<string, unknown>;

interface CrearCoordinacionModalProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onSuccess?: () => void;
  readonly embarqueData?: JsonRecord;
  readonly embarqueId?: string | number;
  readonly idServicio?: string | number | null;
  readonly commitContext: CommitContextInput;
}

function getFirst(source: JsonRecord | undefined, keys: string[], fallback = ""): string {
  for (const key of keys) {
    const value = source?.[key];
    if (value !== undefined && value !== null && value !== "") {
      return String(value);
    }
  }
  return fallback;
}

const RUTA_LISTA_CTS = "/embarques/embarques/cts";

export function CrearCoordinacionModal({
  open,
  onClose,
  onSuccess,
  embarqueData,
  embarqueId,
  idServicio,
  commitContext,
}: CrearCoordinacionModalProps) {
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const codFile = getFirst(embarqueData, ["cod_file", "COD_FILE", "codFile"], "");
  const esConsolidado = Number(idServicio) === ID_SERVICIO_CONSOLIDADO;
  const { mutateAsync: assignCorrelativo } = useAssignCorrelativoGuiaXCriterio({
    meta: { silent: true },
  });
  const { mutateAsync: updateCoordinacionEstado } = useUpdateCoordinacionEstado({
    meta: { silent: true },
  });
  const { commitPendingChanges } = useCommitPendingChanges(commitContext);
  const queryClient = useQueryClient();
  const router = useRouter();

  useEffect(() => {
    if (open) {
      setErrorMsg("");
      setIsSubmitting(false);
    }
  }, [open]);

  const irALista = (guia: string | null) => {
    // Todo lo que el commit tocó queda invalidado; la lista muestra el aviso.
    queryClient.invalidateQueries({ queryKey: ["coordinaciones"] });
    queryClient.invalidateQueries({ queryKey: ["coordinacion-fecha-mov"] });
    queryClient.invalidateQueries({ queryKey: ["datos-entidad-relacionada-privado"] });
    queryClient.invalidateQueries({ queryKey: ["entidades"] });
    onSuccess?.();
    const params = guia ? `?guia=${encodeURIComponent(guia)}` : "?creada=1";
    router.push(`${RUTA_LISTA_CTS}${params}`);
  };

  const asignarGuiaConsolidado = async (): Promise<string> => {
    if (!codFile) {
      throw new Error("No se encontró el código de file (cod_file) en el embarque.");
    }
    const response = (await assignCorrelativo({
      embarque_id: Number(embarqueId),
      cod_file: codFile,
    })) as JsonRecord;
    assertOk(response, "asignar la guía");
    const inner = (response?.data ?? {}) as JsonRecord;
    return String(
      inner.guia_asignada ?? response?.guia_coordinacion ?? response?.guia_asignada ?? "Asignada",
    );
  };

  const avanzarEstadoCoordinacion = async (): Promise<void> => {
    const estadoActual = getFirst(embarqueData, ["estadoId", "estado_id", "ESTADO_ID"], "");
    const response = await updateCoordinacionEstado({
      embarque_id: Number(embarqueId),
      cod_file: codFile,
      cod_estado_actual: estadoActual,
      cod_estado_siguiente: ESTADO_COORDINACION_CREADA,
    });
    assertOk(response, "actualizar el estado de la coordinación");
  };

  const handleCrear = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setErrorMsg("");
    try {
      await commitPendingChanges();

      let guia: string | null = null;
      if (esConsolidado) {
        guia = await asignarGuiaConsolidado();
      } else {
        await avanzarEstadoCoordinacion();
      }
      irALista(guia);
    } catch (error) {
      const message =
        (error as Error)?.message ||
        "Ocurrió un error al aplicar los cambios pendientes o al asignar el correlativo.";
      // Regla de negocio del legacy: la validación "sin seguimiento" no impide
      // crear la coordinación — se trata como éxito sin guía.
      if (message.toLowerCase().includes("sin seguimiento")) {
        irALista(null);
        return;
      }
      setErrorMsg(message);
      setIsSubmitting(false);
    }
  };

  const alertTipo: "info" | "error" = errorMsg ? "error" : "info";

  // preventDefault: el Action de radix cierra el diálogo al click; debe seguir
  // abierto mostrando el spinner mientras corre el commit.
  const onConfirm = (event: React.MouseEvent) => {
    event.preventDefault();
    if (isSubmitting) return;
    if (alertTipo === "info") {
      handleCrear();
    } else {
      onClose();
    }
  };

  let contenido: React.ReactNode;
  if (isSubmitting) {
    contenido = (
      <div className="flex flex-col items-center gap-3 py-4">
        <Loader2 className="size-12 animate-spin text-primary" />
        <p className="font-medium">Creando coordinación...</p>
        <p className="text-center text-sm text-muted-foreground">
          {esConsolidado
            ? "Aplicando cambios pendientes y asignando la guía. Esto puede tardar unos segundos."
            : "Aplicando cambios pendientes. Esto puede tardar unos segundos."}
        </p>
      </div>
    );
  } else if (alertTipo === "info") {
    contenido = (
      <p>
        {esConsolidado
          ? "Se aplicarán los cambios pendientes de cada sección y se asignará la guía House para crear el embarque."
          : "Se aplicarán los cambios pendientes de cada sección para crear la coordinación."}
      </p>
    );
  } else {
    contenido = <p>{errorMsg}</p>;
  }

  const confirmText = (() => {
    if (alertTipo !== "info") return "Cerrar";
    return isSubmitting ? "Creando..." : "Crear Coordinación";
  })();

  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => !isOpen && !isSubmitting && onClose()}>
      <AlertDialogContent className="max-w-sm">
        <AlertDialogHeader>
          <AlertDialogTitle>
            {alertTipo === "error" ? "Error" : "Crear Coordinación"}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2">{contenido}</div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {alertTipo === "info" && !isSubmitting && (
            <AlertDialogCancel onClick={onClose}>Cancelar</AlertDialogCancel>
          )}
          <AlertDialogAction onClick={onConfirm} disabled={isSubmitting}>
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
