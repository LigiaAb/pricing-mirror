"use client";

import * as PopoverPrimitive from "@radix-ui/react-popover";
import * as React from "react";

import { cn } from "@/shared/lib/utils";

const Popover = PopoverPrimitive.Root;

const PopoverTrigger = PopoverPrimitive.Trigger;

interface PopoverContentProps
  extends React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content> {
  readonly portalled?: boolean;
}

/**
 * Contenedor del portal: el diálogo abierto si hay uno, si no `document.body`.
 *
 * Dentro de un Sheet/Dialog modal, `react-remove-scroll` cancela los eventos de
 * rueda cuyo objetivo cae fuera del diálogo y de los `shards` que Radix declara
 * (el propio `DialogContent`). Un popover porteado a `document.body` queda
 * fuera, así que su lista no scrollea con la rueda. Porteándolo al diálogo entra
 * en ese `shard` y la rueda vuelve a funcionar, sin renunciar al portal: el
 * popover sigue escapando de los contenedores con `overflow` internos.
 *
 * Se resuelve en un efecto, no durante el render: en el render el diálogo que
 * nos contiene todavía no está en el documento. Corre al montar el popover
 * cerrado, así que el contenedor ya está listo cuando se abre; cambiarlo con el
 * contenido abierto lo remontaría y le robaría el foco al buscador.
 */
function usePortalContainer(): HTMLElement | undefined {
  const [container, setContainer] = React.useState<HTMLElement | undefined>(undefined);

  React.useEffect(() => {
    /*
     * El contenido de un popover también lleva `role="dialog"`, así que se
     * descartan los que Radix posiciona con popper (`data-side`): si no, un
     * popover se portearía dentro de otro.
     */
    const dialogos = [
      ...document.querySelectorAll<HTMLElement>(
        '[role="dialog"][data-state="open"]:not([data-side]), [role="alertdialog"][data-state="open"]:not([data-side])',
      ),
    ].filter((dialogo) => dialogo.closest("[data-radix-popper-content-wrapper]") === null);

    setContainer(dialogos[dialogos.length - 1]);
  }, []);

  return container;
}

const PopoverContent = React.forwardRef<
  React.ComponentRef<typeof PopoverPrimitive.Content>,
  PopoverContentProps
>(({ className, align = "center", sideOffset = 4, portalled = true, ...props }, ref) => {
  const container = usePortalContainer();

  const content = (
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(
        "z-90 w-72 rounded-lg border border-border bg-popover p-4 text-popover-foreground shadow-lg outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-popover-content-transform-origin]",
        className,
      )}
      {...props}
    />
  );

  if (!portalled) return content;

  return (
    <PopoverPrimitive.Portal {...(container === undefined ? {} : { container })}>
      {content}
    </PopoverPrimitive.Portal>
  );
});
PopoverContent.displayName = PopoverPrimitive.Content.displayName;

/**
 * Caja para popovers de listado (combobox, multi-select).
 *
 * Ancho: nunca más angosto que su disparador, crece con la opción más larga y
 * topa en 32rem o el viewport. Clavarlo al ancho del disparador parte las
 * etiquetas en campos angostos aunque sobre pantalla; dejarlo libre produce
 * popovers desalineados y erráticos.
 *
 * Alto: topa en el hueco que Radix midió entre el disparador y el borde del
 * viewport. Con un alto fijo, en pantallas bajas o con el teclado virtual
 * abierto el listado se corta y las últimas filas quedan inalcanzables.
 */
const popoverListClassName =
  "w-max min-w-(--radix-popover-trigger-width) max-w-[min(32rem,calc(100vw-2rem))] max-h-(--radix-popover-content-available-height)";

export { Popover, PopoverContent, PopoverTrigger, popoverListClassName };
