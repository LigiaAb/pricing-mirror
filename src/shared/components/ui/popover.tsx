/* STUB del repo espejo: solo tipos para verificar pricing. NO copiar al proyecto real. */
/* Solo se tipa `onOpenChange` (lo demás queda abierto, como el resto de los stubs `any`). */
import type * as React from "react";

type PropsAbiertas = { [prop: string]: any };

export declare function Popover(
  props: PropsAbiertas & {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    children?: React.ReactNode;
  },
): React.JSX.Element;

export declare function PopoverTrigger(props: PropsAbiertas): React.JSX.Element;

export declare function PopoverContent(props: PropsAbiertas): React.JSX.Element;

export declare const popoverListClassName: string;
