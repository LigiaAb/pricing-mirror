"use client";

import {
  ChevronRight,
  Home,
  LogOut,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  ShieldCheck,
  Sun,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import * as React from "react";
import { removeAuthTokenCookie } from "@/features/auth";
import type { MenuPermission } from "@/features/permisos";
import { Input } from "@/shared/components/ui/input";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/shared/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";
import { getIconForName } from "@/shared/lib/icons";
import { cn } from "@/shared/lib/utils";
import { useAuthStore } from "@/shared/stores/auth-store";
import { useNavegacionActual } from "../hooks/use-navegacion-actual";
import { construirRutaCategoria, construirRutaMenu, rutaContienePathname } from "../lib/rutas";
import { useContextoOperativoStore } from "../stores/contexto-operativo-store";
import { CategoryMenuItem } from "./category-menu-item";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = React.useState("");
  const { state: sidebarState, isMobile, setOpenMobile, toggleSidebar } = useSidebar();
  const isCollapsed = sidebarState === "collapsed";

  const { modulo: currentModulo, menu: currentMenu, resuelta } = useNavegacionActual();
  const menus = currentModulo?.menus ?? [];

  const currentCentroCosto = useContextoOperativoStore((s) => s.currentCentroCosto);

  const { logout } = useAuthStore();

  const isInformaticaCC = (() => {
    const ccName = currentCentroCosto?.nombre_cc || currentCentroCosto?.nom_cc || "";
    return (
      ccName.toLowerCase().includes("informatica") || ccName.toLowerCase().includes("informática")
    );
  })();

  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = theme === "dark";

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark");
  };

  // Auto-redirect to first category when at menu root
  React.useEffect(() => {
    if (!currentMenu || !currentModulo) return;

    const fullMenuPath = construirRutaMenu(currentModulo.modulo_ruta, currentMenu.menu_ruta);

    if (pathname !== fullMenuPath && pathname !== `${fullMenuPath}/`) return;

    const firstCat = currentMenu.categorias?.[0];
    if (!firstCat?.ruta_cat) return;

    router.replace(
      construirRutaCategoria(currentModulo.modulo_ruta, currentMenu.menu_ruta, firstCat.ruta_cat),
    );
  }, [pathname, currentMenu, currentModulo, router]);

  const handleMenuClick = (menu: MenuPermission) => {
    if (!currentModulo) return;
    router.push(construirRutaMenu(currentModulo.modulo_ruta, menu.menu_ruta));
  };

  const handleLogout = async () => {
    logout();
    await removeAuthTokenCookie();
    router.push("/login");
    if (isMobile) setOpenMobile(false);
  };

  const getViewState = () => {
    // Sin permisos todavía no se sabe dónde estamos: mostrar el esqueleto evita
    // parpadear "Sin categorías" en cada recarga mientras carga getPermisosxRol.
    if (!resuelta) return "loading";
    if (currentMenu) return "categories";
    if (currentModulo) return "menus";
    return "modules";
  };
  const viewState: "loading" | "modules" | "menus" | "categories" = getViewState();

  const filteredMenus = menus.filter(
    (m) => !searchQuery || m.nom_menu.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const filteredCategories =
    currentMenu?.categorias.filter(
      (cat) => !searchQuery || cat.nom_cat.toLowerCase().includes(searchQuery.toLowerCase()),
    ) ?? [];

  const themeLabel = isDark ? "Cambiar a tema Claro" : "Cambiar a tema Oscuro";
  const themeTooltip = mounted ? themeLabel : "Cambiar tema";

  return (
    <TooltipProvider delayDuration={0}>
      <Sidebar
        collapsible="icon"
        className="border-r border-sidebar-border bg-[hsl(var(--sidebar))] text-[hsl(var(--sidebar-foreground))] transition-all duration-300"
        {...props}
      >
        {/* Header */}
        <SidebarHeader className="border-b border-sidebar-border p-4 bg-[hsl(var(--sidebar))] group-data-[collapsible=icon]:p-2">
          {/* En móvil el sheet se cierra con el overlay; el disparador vive en el header. */}
          {!isMobile && (
            <div className="flex justify-end mb-2 group-data-[collapsible=icon]:justify-center">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label={isCollapsed ? "Expandir barra lateral" : "Colapsar barra lateral"}
                    aria-expanded={!isCollapsed}
                    onClick={toggleSidebar}
                    className="h-8 w-8 rounded-xl flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-200 shrink-0"
                  >
                    {isCollapsed ? (
                      <PanelLeftOpen className="size-4" />
                    ) : (
                      <PanelLeftClose className="size-4" />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  {isCollapsed ? "Expandir" : "Colapsar"}
                  <kbd className="ml-2 text-[10px] opacity-70">Ctrl+B</kbd>
                </TooltipContent>
              </Tooltip>
            </div>
          )}
          {/* Breadcrumb / Brand */}
          <div className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
            {/* Home icon — always shows, navigates to root */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label="Inicio"
                  onClick={() => router.push("/")}
                  className="h-8 w-8 rounded-xl flex items-center justify-center border border-sidebar-border/30 hover:bg-primary/10 hover:border-primary/30 transition-all duration-200 shrink-0"
                >
                  <Home className="size-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Inicio</TooltipContent>
            </Tooltip>

            {!isCollapsed && (
              <div className="flex items-center gap-1 min-w-0 animate-fade-in">
                {currentMenu || currentModulo ? (
                  <span className="text-sm font-semibold text-primary truncate">
                    {currentMenu?.nom_menu ?? currentModulo?.nom_modulo}
                  </span>
                ) : (
                  <span className="font-semibold text-foreground">ERP CROPA</span>
                )}
              </div>
            )}
          </div>

          {/* Search */}
          {!isCollapsed && (
            <div className="mt-3 relative group animate-fade-in">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/70 group-focus-within:text-primary transition-colors duration-200" />
              <Input
                placeholder="Buscar..."
                className="h-9 pl-10 bg-card/65 border border-sidebar-border focus:bg-card focus:ring-2 focus:ring-primary/30 focus:border-primary/40 rounded-xl transition-all duration-200 text-sm text-[hsl(var(--sidebar-foreground))] placeholder:text-muted-foreground/60"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          )}
        </SidebarHeader>

        {/* Main Content */}
        <SidebarContent className="py-4 px-2 bg-[hsl(var(--sidebar))] group-data-[collapsible=icon]:px-1">
          <nav aria-label="Navegación principal">
            <SidebarGroup className="bg-[hsl(var(--sidebar))] group-data-[collapsible=icon]:p-0">
              {/* LOADING VIEW — permisos en vuelo, todavía no se sabe qué mostrar */}
              {viewState === "loading" && (
                <SidebarGroupContent>
                  <div className="space-y-2 px-1" aria-hidden="true">
                    {["a", "b", "c", "d"].map((id) => (
                      <div key={id} className="h-8 rounded-xl bg-sidebar-accent/40 animate-pulse" />
                    ))}
                  </div>
                </SidebarGroupContent>
              )}

              {/* MODULES VIEW — empty at root/dashboard */}
              {viewState === "modules" && <SidebarGroupContent />}

              {/* MENUS VIEW */}
              {viewState === "menus" && currentModulo && (
                <div className="space-y-1 animate-fade-in">
                  {!isCollapsed && (
                    <SidebarGroupLabel className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                      {(() => {
                        const ModIcon = getIconForName(
                          currentModulo.modulo_icono || currentModulo.nom_modulo,
                        );
                        return <ModIcon className="size-3.5" />;
                      })()}
                      Menús
                    </SidebarGroupLabel>
                  )}
                  <SidebarGroupContent>
                    <SidebarMenu className="space-y-1">
                      {filteredMenus.length === 0 && !isCollapsed && (
                        <SidebarMenuItem className="px-3 py-8 text-center">
                          <p className="text-xs text-muted-foreground italic">Sin menús</p>
                        </SidebarMenuItem>
                      )}
                      {filteredMenus.map((menu) => {
                        const MenuIcon = getIconForName(menu.menu_icono || menu.nom_menu);
                        const btn = (
                          <SidebarMenuItem key={menu.cod_menu}>
                            <SidebarMenuButton
                              onClick={() => handleMenuClick(menu)}
                              className={cn(
                                "rounded-xl transition-all duration-200",
                                "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                                isCollapsed && "justify-center",
                              )}
                              tooltip={menu.nom_menu}
                            >
                              <div
                                className={cn(
                                  "flex items-center",
                                  isCollapsed ? "justify-center" : "gap-3",
                                )}
                              >
                                <MenuIcon className="size-4 shrink-0" />
                                {!isCollapsed && (
                                  <span className="text-sm font-medium truncate">
                                    {menu.nom_menu}
                                  </span>
                                )}
                                {!isCollapsed && menu.categorias && menu.categorias.length > 0 && (
                                  <ChevronRight className="size-3.5 ml-auto shrink-0 text-muted-foreground/50" />
                                )}
                              </div>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        );

                        if (isCollapsed) {
                          return (
                            <Tooltip key={menu.cod_menu}>
                              <TooltipTrigger asChild>{btn}</TooltipTrigger>
                              <TooltipContent side="right">{menu.nom_menu}</TooltipContent>
                            </Tooltip>
                          );
                        }
                        return btn;
                      })}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </div>
              )}

              {/* CATEGORIES VIEW */}
              {viewState === "categories" && currentMenu && currentModulo && (
                <div className="space-y-1 animate-fade-in">
                  <SidebarGroupContent>
                    <SidebarMenu className="space-y-1">
                      {filteredCategories.length === 0 && !isCollapsed && (
                        <SidebarMenuItem className="px-3 py-8 text-center">
                          <p className="text-xs text-muted-foreground italic">Sin categorías</p>
                        </SidebarMenuItem>
                      )}
                      {filteredCategories.map((cat) => (
                        <CategoryMenuItem
                          key={cat.cod_categoria}
                          category={cat}
                          currentModulo={currentModulo}
                          currentMenu={currentMenu}
                          isCollapsed={isCollapsed}
                          isActive={rutaContienePathname(
                            construirRutaCategoria(
                              currentModulo.modulo_ruta,
                              currentMenu.menu_ruta,
                              cat.ruta_cat,
                            ),
                            pathname ?? "",
                          )}
                        />
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </div>
              )}
            </SidebarGroup>
          </nav>
        </SidebarContent>

        {/* Footer */}
        <SidebarFooter className="border-t border-sidebar-border p-3 bg-[hsl(var(--sidebar))]! text-[hsl(var(--sidebar-foreground))] group-data-[collapsible=icon]:p-2">
          <SidebarMenu className="space-y-1 bg-[hsl(var(--sidebar))]">
            {isInformaticaCC && (
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => router.push("/admin")}
                  className="rounded-xl hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-200"
                  tooltip="Admin Tools"
                >
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="size-4 text-primary" />
                    {!isCollapsed && <span className="text-sm font-medium">Admin Tools</span>}
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}

            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={toggleTheme}
                className="rounded-xl hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-200"
                tooltip={themeTooltip}
              >
                <div className="flex items-center gap-3">
                  {(() => {
                    if (!mounted || !isDark)
                      return <Sun className="size-4" suppressHydrationWarning />;
                    return <Moon className="size-4" suppressHydrationWarning />;
                  })()}
                  {!isCollapsed && <span className="text-sm font-medium">Tema</span>}
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={handleLogout}
                className="rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
                tooltip="Cerrar Sesión"
              >
                <div className="flex items-center gap-3">
                  <LogOut className="size-4" />
                  {!isCollapsed && <span className="text-sm font-medium">Cerrar Sesión</span>}
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>

        <SidebarRail className="hover:bg-primary/10 transition-colors" />
      </Sidebar>
    </TooltipProvider>
  );
}
