"use client";

import * as React from "react";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import { cn } from "@/shared/lib/utils";
import { TooltipProvider } from "../tooltip";

const SIDEBAR_STORAGE_KEY = "sidebar:open";
const SIDEBAR_WIDTH = "14rem";
export const SIDEBAR_WIDTH_MOBILE = "18rem";
const SIDEBAR_WIDTH_ICON = "3rem";
const SIDEBAR_KEYBOARD_SHORTCUT = "b";

type SidebarContext = {
  state: "expanded" | "collapsed";
  open: boolean;
  setOpen: (open: boolean) => void;
  openMobile: boolean;
  setOpenMobile: (open: boolean) => void;
  isMobile: boolean;
  toggleSidebar: () => void;
};

const SidebarContext = React.createContext<SidebarContext | null>(null);

export function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.");
  }
  return context;
}

export const SidebarProvider = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    defaultOpen?: boolean;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
  }
>(
  (
    {
      defaultOpen = true,
      open: openProp,
      onOpenChange: setOpenProp,
      className,
      style,
      children,
      ...props
    },
    ref,
  ) => {
    const isMobile = useIsMobile();
    const [openMobile, setOpenMobile] = React.useState(false);

    // This is the internal state of the sidebar.
    // We use openProp and setOpenProp for control from outside the component.
    const [_open, _setOpen] = React.useState(defaultOpen);
    const open = openProp ?? _open;

    // Restore persisted state after hydration to avoid SSR mismatch
    React.useEffect(() => {
      if (globalThis.window === undefined) return;
      const stored = globalThis.window.localStorage.getItem(SIDEBAR_STORAGE_KEY);
      if (stored !== null && (stored === "true") !== open) {
        _setOpen(stored === "true");
      }
    }, [open]);
    const setOpen = (value: boolean | ((value: boolean) => boolean)) => {
      const openState = typeof value === "function" ? value(open) : value;
      if (setOpenProp) {
        setOpenProp(openState);
      } else {
        _setOpen(openState);
      }

      if (globalThis.window !== undefined) {
        globalThis.window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(openState));
      }
    };

    const toggleSidebar = () => {
      return isMobile ? setOpenMobile((prev) => !prev) : setOpen((prev) => !prev);
    };

    // Adds a keyboard shortcut to toggle the sidebar.
    React.useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === SIDEBAR_KEYBOARD_SHORTCUT && (event.metaKey || event.ctrlKey)) {
          event.preventDefault();
          toggleSidebar();
        }
      };

      globalThis.addEventListener("keydown", handleKeyDown);
      return () => globalThis.removeEventListener("keydown", handleKeyDown);
      // biome-ignore lint/correctness/useExhaustiveDependencies: React Compiler memoizes automatically
    }, [toggleSidebar]);

    const state = open ? "expanded" : "collapsed";

    // Calcular el offset del sidebar según el estado y si es móvil
    const desktopOffset = state === "collapsed" ? SIDEBAR_WIDTH_ICON : SIDEBAR_WIDTH;
    const sidebarOffset = isMobile ? "0px" : desktopOffset;

    // biome-ignore lint/correctness/useExhaustiveDependencies: React Compiler memoizes automatically
    const contextValue: SidebarContext = React.useMemo(
      () => ({
        state,
        open,
        setOpen,
        isMobile,
        openMobile,
        setOpenMobile,
        toggleSidebar,
      }),
      [state, open, isMobile, openMobile],
    );

    const sidebarStyle = {
      "--sidebar-width": SIDEBAR_WIDTH,
      "--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
      // Variable dinámica: ancho actual del sidebar según estado
      "--sidebar-offset": sidebarOffset,
      ...style,
    } as React.CSSProperties;

    return (
      <SidebarContext.Provider value={contextValue}>
        <TooltipProvider delayDuration={0}>
          <div
            data-sidebar-state={state}
            style={sidebarStyle}
            className={cn(
              "group/sidebar-wrapper flex min-h-screen w-full has-data-[variant=inset]:bg-sidebar",
              className,
            )}
            ref={ref}
            {...props}
          >
            {children}
          </div>
        </TooltipProvider>
      </SidebarContext.Provider>
    );
  },
);
SidebarProvider.displayName = "SidebarProvider";
