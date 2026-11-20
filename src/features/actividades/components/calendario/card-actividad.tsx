import { format } from "date-fns";
import type { Actividad } from "../../api/actividades";
import { colorActividad } from "../../lib/actividad-colores";

interface CardActividadProps {
  actividad: Actividad;
  onClick?: (() => void) | undefined;
}

export function CardActividad({ actividad, onClick }: Readonly<CardActividadProps>) {
  const hora = new Date(actividad.fecha_programada);
  const horaValida = !Number.isNaN(hora.getTime());
  const color = colorActividad(actividad.cod_tipo);

  const colores: Record<string, string> = {
    blue: "before:bg-primary",
    emerald: "before:bg-emerald-500",
    violet: "before:bg-violet-500",
    amber: "before:bg-amber-500",
    rose: "before:bg-rose-500",
    cyan: "before:bg-cyan-500",
  };
  const contenido = (
    <>
      <p className="truncate font-semibold">{actividad.asunto || "Sin asunto"}</p>
      <p className="mt-0.5 truncate text-[0.7rem] text-muted-foreground">
        {horaValida ? format(hora, "HH:mm") : "Sin hora"} · {actividad.nom_tipo || "Actividad"}
      </p>
    </>
  );
  if (onClick) {
    return (
      <button
        aria-label={`Ver actividad ${actividad.asunto || actividad.cod_actividad}`}
        className={`relative w-full overflow-hidden rounded-xl border border-border/60 bg-card px-3 py-2 text-left text-xs shadow-xs transition-all before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded-full hover:-translate-y-px hover:shadow-sm ${colores[color] ?? "before:bg-primary"}`}
        onClick={onClick}
        type="button"
      >
        {contenido}
      </button>
    );
  }
  return (
    <article
      className={`relative overflow-hidden rounded-xl border border-border/60 bg-card px-3 py-2 text-xs shadow-xs before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded-full ${colores[color] ?? "before:bg-primary"}`}
    >
      {contenido}
    </article>
  );
}
