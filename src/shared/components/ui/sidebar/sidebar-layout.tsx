"use client";

import * as React from "react";
import { cn } from "@/shared/lib/utils";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "../sheet";
import { SIDEBAR_WIDTH_MOBILE, useSidebar } from "./sidebar-provider";

export const Sidebar = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    side?: "left" | "right";
    variant?: "sidebar" | "floating" | "inset";
    collapsible?: "offcanvas" | "icon" | "none";
  }
>(
  (
    {
      side = "left",
      variant = "sidebar",
      collapsible = "offcanvas",
      className,
      children,
      ...props
    },
    ref,
  ) => {
    const { isMobile, state, openMobile, setOpenMobile } = useSidebar();

    if (collapsible === "none") {
      return (
        <div
          className={cn(
            "flex h-full w-(--sidebar-width) flex-col bg-sidebar text-sidebar-foreground",
            className,
          )}
          ref={ref}
          {...props}
        >
          {children}
        </div>
      );
    }

    if (isMobile) {
      const mobileSidebarStyle: React.CSSProperties & {
        "--sidebar-width": string;
      } = {
        "--sidebar-width": SIDEBAR_WIDTH_MOBILE,
        backgroundColor: "hsl(var(--sidebar))",
      };

      return (
        <Sheet open={openMobile} onOpenChange={setOpenMobile} {...props}>
          <SheetContent
            data-sidebar="sidebar"
            data-mobile="true"
            side={side}
            className="w-(--sidebar-width) bg-sidebar! text-sidebar-foreground p-0 [&>button]:hidden border-r border-sidebar-border shadow-2xl"
            style={mobileSidebarStyle}
          >
            <SheetTitle className="sr-only">Navegación</SheetTitle>
            <SheetDescription className="sr-only">Menú de navegación principal</SheetDescription>
            <div
              className="flex h-full w-full flex-col bg-sidebar!"
              style={{ backgroundColor: "hsl(var(--sidebar))" }}
            >
              {children}
            </div>
          </SheetContent>
        </Sheet>
      );
    }

    return (
      <div
        ref={ref}
        className="group peer hidden md:block text-sidebar-foreground"
        data-state={state}
        data-collapsible={state === "collapsed" ? collapsible : ""}
        data-variant={variant}
        data-side={side}
      >
        {/*
                    Sidebar fijo - se posiciona a la izquierda debajo del header
                    El espaciado del contenido se maneja via CSS variable --sidebar-offset
                    en SidebarInset y AppHeader
        */}
        <div
          className={cn(
            "duration-200 fixed inset-y-0 z-20 hidden max-h-[calc(100svh-var(--header-height))] w-(--sidebar-width) transition-[left,right,width] ease-linear md:flex md:top-(--header-height) md:bottom-0",
            side === "left"
              ? "left-0 group-data-[collapible=offcanvas]:-left-(--sidebar-width)"
              : "right-0 group-data-[collapsible=offcanvas]:-right-(--sidebar-width)",
            // Adjust the padding for floating and inset variants.
            variant === "floating" || variant === "inset"
              ? "group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4))+2px)]"
              : "group-data-[collapsible=icon]:w-(--sidebar-width-icon) group-data-[side=left]:border-r group-data-[side=left]:border-sidebar-border group-data-[side=right]:border-l group-data-[side=right]:border-sidebar-border",
            className,
          )}
          {...props}
        >
          <div
            data-sidebar="sidebar"
            className="flex h-full w-full flex-col bg-sidebar group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:border group-data-[variant=floating]:border-sidebar-border group-data-[variant=floating]:shadow"
          >
            {children}
          </div>
        </div>
      </div>
    );
  },
);
Sidebar.displayName = "Sidebar";

export const SidebarRail = React.forwardRef<HTMLButtonElement, React.ComponentProps<"button">>(
  ({ className, ...props }, ref) => {
    const { toggleSidebar } = useSidebar();

    return (
      <button
        ref={ref}
        data-sidebar="rail"
        aria-label="Toggle Sidebar"
        tabIndex={-1}
        onClick={toggleSidebar}
        title="Toggle Sidebar"
        className={cn(
          "absolute inset-y-0 z-20 hidden w-4 -translate-x-1/2 transition-all ease-linear after:absolute after:inset-y-0 after:left-1/2 after:w-0.5 hover:after:bg-sidebar-border group-data-[side=left]:-right-4 group-data-[side=right]:left-0 sm:flex",
          "in-data-[side=left]:cursor-w-resize in-data-[side=right]:cursor-e-resize",
          "[[data-side=left][data-state=collapsed]_&]:cursor-e-resize [[data-side=right][data-state=collapsed]_&]:cursor-w-resize",
          "group-data-[collapsible=offcanvas]:translate-x-0 group-data-[collapsible=offcanvas]:after:left-full group-data-[collapsible=offcanvas]:hover:bg-sidebar",
          "[[data-side=left][data-collapsible=offcanvas]_&]:-right-2",
          "[[data-side=right][data-collapsible=offcanvas]_&]:-left-2",
          className,
        )}
        {...props}
      />
    );
  },
);
SidebarRail.displayName = "SidebarRail";

export const SidebarInset = React.forwardRef<HTMLDivElement, React.ComponentProps<"main">>(
  ({ className, ...props }, ref) => {
    return (
      <main
        ref={ref}
        className={cn(
          // Base: posición relativa, flex, altura y fondo
          "relative flex min-h-[calc(100svh-var(--header-height))] flex-col bg-background",
          // Margen superior para el header fijo
          "mt-(--header-height)",
          // Margen izquierdo dinámico usando la CSS variable --sidebar-offset
          "ml-(--sidebar-offset)",
          // Prevenir que haga overflow restringiendo su ancho máximo
          "w-[calc(100%-var(--sidebar-offset))] max-w-[calc(100%-var(--sidebar-offset))]",
          // Transición suave cuando el sidebar cambia de estado
          "transition-[margin-left,width,max-width] duration-200 ease-linear",
          // Variante inset (opcional, para estilos especiales)
          "peer-data-[variant=inset]:min-h-[calc(100svh-(--spacing(4)))] md:peer-data-[variant=inset]:m-2 md:peer-data-[state=collapsed]:peer-data-[variant=inset]:ml-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow",
          className,
        )}
        {...props}
      />
    );
  },
);
SidebarInset.displayName = "SidebarInset";
