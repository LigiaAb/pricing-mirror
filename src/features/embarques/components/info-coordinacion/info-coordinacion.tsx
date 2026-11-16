import { asText } from "@/shared/lib/text";
import { cn } from "@/shared/lib/utils";

export interface InfoCoordinacionProps {
  readonly isLoading?: boolean;
  readonly coordinacion?: Record<string, unknown>;
  readonly showGuia?: boolean;
  readonly showId?: boolean;
}

interface DetalleItem {
  label: string;
  value:
    | string
    | {
        codFile?: string;
        id?: string;
        house?: string;
        master?: string;
        origen?: string;
        destino?: string;
      };
}

export function InfoCoordinacion({
  isLoading = false,
  coordinacion = {},
  showGuia = true,
  showId = true,
}: InfoCoordinacionProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-2">
        <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const detallesCoordinacion: DetalleItem[] =
    coordinacion && Object.keys(coordinacion).length > 0
      ? [
          {
            label: "Cod File",
            value: {
              codFile: asText(coordinacion.cod_file ?? coordinacion.codFile),
              id: asText(
                coordinacion.id ??
                  coordinacion.ID ??
                  coordinacion.embarque_id ??
                  coordinacion.EMBARQUE_ID ??
                  coordinacion.embarqueId ??
                  coordinacion.embarqueID,
              ),
            },
          },
          ...(showGuia
            ? [
                {
                  label: "Guía",
                  value: {
                    house: asText(coordinacion.correlativoGuia ?? coordinacion.correlativo_guia),
                    master: asText(
                      coordinacion.correlativoGuiaMaster ?? coordinacion.correlativo_guia_master,
                    ),
                  },
                },
              ]
            : []),
          {
            label: "Origen / Destino",
            value: {
              origen: asText(
                coordinacion.nombre_pais_origen ??
                  coordinacion.pais_origen ??
                  coordinacion.paisOrigen,
              ),
              destino: asText(
                coordinacion.nombre_pais_destino ??
                  coordinacion.pais_destino ??
                  coordinacion.paisDestino,
              ),
            },
          },
          {
            label: "Cliente",
            value: asText(coordinacion.entidad_nombre ?? coordinacion.cliente),
          },
        ]
      : [];

  const renderDetalleValor = (item: DetalleItem) => {
    if (item.label === "Origen / Destino") {
      const val = item.value as { origen?: string; destino?: string };
      return (
        <div className="grid grid-cols-2 gap-2 mt-1">
          <div>
            <span className="text-xs font-semibold text-muted-foreground">Origen:</span>
            <p className="text-sm wrap-break">{val.origen || "-"}</p>
          </div>
          <div>
            <span className="text-xs font-semibold text-muted-foreground">Destino:</span>
            <p className="text-sm wrap-break">{val.destino || "-"}</p>
          </div>
        </div>
      );
    }

    if (item.label === "Guía") {
      const val = item.value as { house?: string; master?: string };
      return (
        <div className="grid grid-cols-2 gap-2 mt-1">
          <div>
            <span className="text-xs font-semibold text-muted-foreground">House:</span>
            <p className="text-sm wrap-break">{val.house || "-"}</p>
          </div>
          <div>
            <span className="text-xs font-semibold text-muted-foreground">Master:</span>
            <p className="text-sm wrap-break">{val.master || "-"}</p>
          </div>
        </div>
      );
    }

    if (item.label === "Cod File") {
      const val = item.value as { codFile?: string; id?: string };
      return (
        <div className="mt-1 wrap-break">
          <div className={cn("grid gap-2", showId ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1")}>
            <div>
              <span className="text-xs font-semibold text-muted-foreground block">Cod File</span>
              <p className="text-sm wrap-break">{val.codFile || "-"}</p>
            </div>
            {showId && (
              <div>
                <span className="text-xs font-semibold text-muted-foreground block">ID</span>
                <p className="text-sm wrap-break">{val.id || "-"}</p>
              </div>
            )}
          </div>
        </div>
      );
    }

    return <p className="mt-1 wrap-break text-sm">{asText(item.value) || "-"}</p>;
  };

  return (
    <div className="mt-0">
      {detallesCoordinacion.length > 0 && (
        <div className="mb-0">
          <div className="grid grid-cols-1 gap-1 sm:grid-cols-2 md:grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
            {detallesCoordinacion.map((item) => (
              <div key={item.label} className="p-3 h-full border border-border rounded-md">
                {item.label !== "Guía" &&
                  item.label !== "Cod File" &&
                  item.label !== "Origen / Destino" && (
                    <span className="text-xs font-semibold text-muted-foreground">
                      {item.label}
                    </span>
                  )}
                {renderDetalleValor(item)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
