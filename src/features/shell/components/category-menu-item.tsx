"use client";

import { useRouter } from "next/navigation";
import { SidebarMenuButton, SidebarMenuItem } from "@/shared/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/components/ui/tooltip";
import { getIconForName } from "@/shared/lib/icons";
import { cn } from "@/shared/lib/utils";
import { construirRutaCategoria } from "../lib/rutas";

interface Category {
  cod_categoria: number;
  nom_cat: string;
  ruta_cat?: string;
  categoria_icono?: string;
}

interface Menu {
  menu_ruta: string;
  nom_menu: string;
}

interface Modulo {
  modulo_ruta: string;
}

interface CategoryMenuItemProps {
  readonly category: Category;
  readonly currentModulo: Modulo;
  readonly currentMenu: Menu;
  readonly isCollapsed: boolean;
  readonly isActive: boolean;
}

export function CategoryMenuItem({
  category,
  currentModulo,
  currentMenu,
  isCollapsed,
  isActive,
}: Readonly<CategoryMenuItemProps>) {
  const router = useRouter();
  const CategoryIcon = getIconForName(category.categoria_icono || category.nom_cat);

  const handleClick = () => {
    if (!category.ruta_cat) return;

    router.push(
      construirRutaCategoria(currentModulo.modulo_ruta, currentMenu.menu_ruta, category.ruta_cat),
    );
  };

  const button = (
    <SidebarMenuItem>
      <SidebarMenuButton
        onClick={handleClick}
        className={cn(
          "rounded-xl transition-all duration-200",
          isActive
            ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-sm"
            : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sidebar-foreground",
          isCollapsed && "justify-center",
        )}
        tooltip={category.nom_cat}
      >
        <div className={cn("flex items-center", isCollapsed ? "justify-center gap-0" : "gap-3")}>
          <CategoryIcon
            className={cn("size-4 shrink-0", isActive && "text-primary font-semibold")}
          />
          {!isCollapsed && (
            <span className={cn("text-sm truncate", isActive ? "font-semibold" : "font-medium")}>
              {category.nom_cat}
            </span>
          )}
        </div>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );

  // En modo colapsado, envolver con Tooltip para mostrar el nombre
  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent side="right" className="text-sm">
          {category.nom_cat}
        </TooltipContent>
      </Tooltip>
    );
  }

  return button;
}
