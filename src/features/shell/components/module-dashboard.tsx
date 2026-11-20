"use client";

import { ArrowUpRight, ChevronDown, ChevronRight, Grid2X2, Package, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import type { MenuPermission, ModulePermission } from "@/features/permisos";
import { DynamicIcon } from "@/shared/components/dynamic-icon";
import { Input } from "@/shared/components/ui/input";
import { cn } from "@/shared/lib/utils";
import { useObtenerModulos } from "../hooks/use-permisos-actuales";

const NOOP = () => {};

type Module = ModulePermission;
type Menu = MenuPermission;

interface ModuleCardProps {
  module: Module;
  iconName: string;
  menuCount: number;
  isActive?: boolean;
  isExpanded?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

const ModuleCard = React.memo<ModuleCardProps>(function ModuleCard({
  module,
  iconName,
  menuCount,
  isActive = false,
  isExpanded = false,
  onClick = NOOP,
}) {
  const isSelected = isExpanded || isActive;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={isExpanded}
      className={cn(
        "group relative h-full min-h-40 w-full overflow-hidden rounded-xl border text-left transition-[background-color,border-color,box-shadow] duration-200 ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2",
        isSelected
          ? "border-primary/35 bg-brand-50 shadow-sm"
          : "border-border bg-card shadow-xs hover:border-primary/25 hover:bg-surface-2 hover:shadow-sm",
      )}
    >
      <div
        className={cn(
          "absolute inset-y-4 left-0 w-0.5 rounded-r-full bg-primary transition-opacity duration-200",
          isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100",
        )}
      />

      <div className="relative flex h-full flex-col p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div
            className={cn(
              "flex size-11 shrink-0 items-center justify-center rounded-md transition-colors duration-200 ease-standard sm:size-12",
              isSelected
                ? "bg-primary text-primary-foreground"
                : "bg-brand-100 text-primary group-hover:bg-primary group-hover:text-primary-foreground",
            )}
          >
            <DynamicIcon name={iconName} size={21} className="sm:size-6" strokeWidth={1.8} />
          </div>
          <span className="rounded-full border border-border bg-card px-2.5 py-1 text-xs font-semibold tracking-wide text-muted-foreground">
            {menuCount} {menuCount === 1 ? "MENÚ" : "MENÚS"}
          </span>
        </div>

        <div className="mt-5 min-w-0">
          <h3
            className={cn(
              "truncate text-base font-semibold tracking-[-0.02em] transition-colors sm:text-xl",
              isSelected ? "text-primary" : "text-foreground group-hover:text-primary",
            )}
          >
            {module.nom_modulo}
          </h3>
        </div>

        <div className="mt-auto flex items-center justify-between pt-4 text-xs font-medium text-muted-foreground">
          <span>{isExpanded ? "Ocultar opciones" : "Explorar módulo"}</span>
          {isExpanded ? (
            <ChevronDown className="size-4 shrink-0 text-primary" />
          ) : (
            <ArrowUpRight className="size-4 shrink-0 transition-colors duration-200 group-hover:text-primary" />
          )}
        </div>
      </div>
    </button>
  );
});

interface MenuCardProps {
  menu: Menu;
  iconName: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

const MenuCard = React.memo<MenuCardProps>(function MenuCard({ menu, iconName, onClick = NOOP }) {
  const categoryCount = menu.categorias?.length || 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative w-full rounded-lg border border-border bg-card text-left transition-colors duration-200 ease-standard hover:border-primary/25 hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 active:bg-brand-100"
    >
      <div className="flex items-center gap-3 p-3.5 sm:p-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-brand-100 text-primary transition-colors duration-200 ease-standard group-hover:bg-primary group-hover:text-primary-foreground sm:size-11">
          <DynamicIcon name={iconName} size={18} className="sm:size-5" strokeWidth={1.8} />
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
            {menu.nom_menu}
          </h3>
          <p className="mt-1 truncate text-xs text-muted-foreground">
            {categoryCount} {categoryCount === 1 ? "categoría" : "categorías"}
          </p>
        </div>

        <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-all group-hover:translate-x-1 group-hover:text-primary" />
      </div>
    </button>
  );
});

const ExpandedMenuSection = React.memo<{
  menus: Menu[];
  modulo: Module;
  onMenuClick: (e: React.MouseEvent, menu: Menu, modulo: Module) => void;
}>(function ExpandedMenuSection({ menus, modulo, onMenuClick }) {
  return (
    <section className="animate-expand col-span-full" aria-label={`Menús de ${modulo.nom_modulo}`}>
      <div className="relative overflow-hidden rounded-xl border border-border bg-surface-2 p-4 sm:p-5">
        <div className="relative mb-4 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Grid2X2 className="size-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{modulo.nom_modulo}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Selecciona el área donde deseas trabajar
              </p>
            </div>
          </div>
          <span className="hidden rounded-full border border-border bg-card px-2.5 py-1 text-xs font-semibold text-primary sm:block">
            {menus.length} {menus.length === 1 ? "opción" : "opciones"}
          </span>
        </div>

        {menus.length > 0 ? (
          <div className="relative grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {menus.map((menu) => (
              <MenuCard
                key={menu.cod_menu}
                menu={menu}
                iconName={menu.menu_icono || menu.nom_menu}
                onClick={(e) => onMenuClick(e, menu, modulo)}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border bg-card px-4 py-6 text-center text-sm text-muted-foreground">
            No hay menús disponibles para este módulo.
          </div>
        )}
      </div>
    </section>
  );
});

export const ModuleDashboard: React.FC = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedModuleId, setExpandedModuleId] = useState<number | null>(null);
  const allModules = useObtenerModulos();
  const filteredModules = allModules
    .filter((module) => module.nom_modulo.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => a.nom_modulo.localeCompare(b.nom_modulo));
  const openRoute = (e: React.MouseEvent, route: string) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      window.open(route, "_blank");
      return;
    }
    router.push(route);
  };

  const handleModuleClick = (e: React.MouseEvent, modulo: Module) => {
    if (modulo.cod_modulo === -1 && modulo.modulo_ruta) {
      openRoute(e, modulo.modulo_ruta);
      return;
    }
    if (expandedModuleId === modulo.cod_modulo) {
      setExpandedModuleId(null);
      return;
    }

    setExpandedModuleId(modulo.cod_modulo);
    document.title = `ERP CROPA | DSV - ${modulo.nom_modulo}`;
  };

  const handleMenuClick = (e: React.MouseEvent, menu: Menu, modulo: Module) => {
    const moduloRuta = modulo.modulo_ruta.replace(/\/$/, "");
    const menuRuta = menu.menu_ruta.startsWith("/") ? menu.menu_ruta : `/${menu.menu_ruta}`;
    const firstCategory = menu.categorias?.[0];
    const categoryRuta = firstCategory?.ruta_cat
      ? firstCategory.ruta_cat.startsWith("/")
        ? firstCategory.ruta_cat
        : `/${firstCategory.ruta_cat}`
      : "";
    openRoute(e, `${moduloRuta}${menuRuta}${categoryRuta}`);
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-1 pb-8">
      {/* Hero: única mancha grande de azul corporativo sobre el lienzo blanco */}
      <section className="relative isolate overflow-hidden rounded-2xl bg-brand-900 px-5 py-6 text-white shadow-md sm:px-7 sm:py-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <div className="mb-3 flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.16em] text-white">
              <span className="flex size-7 items-center justify-center rounded-md bg-white/12">
                <Grid2X2 size={14} />
              </span>
              MODULOS
            </div>
            <p className="mt-2 text-sm text-white/75">
              {expandedModuleId
                ? "Selecciona un menú para continuar."
                : "Selecciona un módulo para ver sus opciones."}
            </p>
          </div>
          <div className="relative w-full shrink-0 sm:w-80">
            <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-white/60" />
            <Input
              placeholder="Buscar módulo..."
              aria-label="Buscar módulo"
              className="h-11 w-full rounded-lg border-white/15 bg-white/10 pl-10 pr-4 text-sm text-white placeholder:text-white/55 focus-visible:border-white/40 focus-visible:ring-white/25"
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </section>

      <div className="mt-5 grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredModules.map((modulo) => {
          const isExpanded = expandedModuleId === modulo.cod_modulo;
          const menus = modulo.menus ?? [];

          return (
            <React.Fragment key={modulo.cod_modulo}>
              <div className="min-w-0">
                <ModuleCard
                  module={modulo}
                  iconName={modulo.modulo_icono || modulo.nom_modulo}
                  menuCount={menus.length}
                  isActive={isExpanded}
                  isExpanded={isExpanded}
                  onClick={(e) => handleModuleClick(e, modulo)}
                />
              </div>
              {isExpanded && (
                <ExpandedMenuSection
                  menus={menus}
                  modulo={modulo}
                  onMenuClick={(e, menu) => handleMenuClick(e, menu, modulo)}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {filteredModules.length === 0 && (
        <div className="flex flex-col items-center justify-center px-4 py-12 text-center sm:py-20">
          <div className="mb-4 flex size-20 items-center justify-center rounded-xl bg-brand-100 text-primary sm:mb-6 sm:size-24">
            <Package size={32} className="sm:size-10" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-foreground sm:mb-3 sm:text-xl">
            No hay módulos disponibles
          </h3>
          <p className="max-w-md px-4 text-xs text-muted-foreground sm:text-sm">
            {searchQuery
              ? "No se encontraron módulos que coincidan con tu búsqueda."
              : "No tienes acceso a ningún módulo."}
          </p>
        </div>
      )}
    </div>
  );
};
