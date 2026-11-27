/** Celda vacía resaltada con `colorVacias` de la definición (tabla por defecto del reporte). */
export function CeldaVacia({ color }: { color: string }) {
  return (
    <span
      className="-mx-2 block rounded px-2 text-center text-muted-foreground"
      style={{ backgroundColor: color }}
    >
      —
    </span>
  );
}
