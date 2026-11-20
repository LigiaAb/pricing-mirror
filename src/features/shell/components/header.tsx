"use client";

import { PanelLeft, User } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import * as React from "react";
import { CropaLogo } from "@/shared/components/cropa-logo";
import { Button } from "@/shared/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { useSidebar } from "@/shared/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";
import { useMediaQuery } from "@/shared/hooks/use-media-query";
import { asText } from "@/shared/lib/text";
import { cn } from "@/shared/lib/utils";
import { useOpcionesContextoOperativo } from "../hooks/use-contexto-operativo-opciones";
import { useContextoOperativoStore } from "../stores/contexto-operativo-store";

// Configuración de acciones rápidas del header
const quickActions = [{ id: "profile", icon: User, label: "Perfil", href: "/perfil" }];

// Componente reutilizable para botones del header con tooltip
interface HeaderButtonProps {
  icon: React.ElementType;
  tooltip: string;
  onClick?: () => void;
  badge?: number;
  isActive?: boolean;
  className?: string;
}

const HeaderButton: React.FC<HeaderButtonProps> = ({
  icon: Icon,
  tooltip,
  onClick,
  badge = 0,
  isActive = false,
  className = "",
}) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <div className="relative inline-block">
        <button
          type="button"
          onClick={onClick}
          aria-label={tooltip}
          className={cn(
            "relative w-10 h-10 flex items-center justify-center rounded-full transition-all duration-300 ease-out",
            "active:scale-95 text-white/80 hover:text-white hover:bg-white/10",
            isActive && "bg-white/20 text-white",
            className,
          )}
        >
          <Icon size={18} className="transition-transform duration-200" />
        </button>
        {badge > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1.5 flex items-center justify-center text-xs font-semibold bg-linear-to-r from-destructive to-rose-500 text-white rounded-full animate-pulse pointer-events-none z-10">
            {badge > 99 ? "99+" : badge}
          </span>
        )}
      </div>
    </TooltipTrigger>
    <TooltipContent side="bottom" className="text-xs">
      {tooltip}
    </TooltipContent>
  </Tooltip>
);

export function AppHeader() {
  const router = useRouter();
  const pathname = usePathname();
  // En móvil el sidebar es un sheet fuera de pantalla y necesita un disparador externo;
  // en escritorio el botón vive dentro del propio sidebar (ver sidebar.tsx).
  const { toggleSidebar, isMobile: isSidebarMobile } = useSidebar();
  const isMobile = useMediaQuery("(max-width: 768px)");

  const { paises, empresas, centrosCosto } = useOpcionesContextoOperativo();

  const {
    currentPais,
    setCurrentPais,
    currentEmpresa,
    setCurrentEmpresa,
    currentCentroCosto,
    setCurrentCentroCosto,
  } = useContextoOperativoStore();
  const isHomePage = pathname === "/" || (pathname?.split("/").length ?? 0) === 2;

  // Auto-seleccionar primer país (o re-seleccionar si el persistido ya no existe)
  React.useEffect(() => {
    if (paises.length === 0) {
      return;
    }
    if (!currentPais || !paises.some((p) => p.cod_pais === currentPais.cod_pais)) {
      setCurrentPais(paises[0] ?? null);
    }
  }, [paises, currentPais, setCurrentPais]);

  // Auto-seleccionar primera empresa (o re-seleccionar si el persistido ya no existe)
  React.useEffect(() => {
    if (empresas.length === 0 || !currentPais) {
      return;
    }
    if (!currentEmpresa || !empresas.some((e) => e.cod_empresa === currentEmpresa.cod_empresa)) {
      setCurrentEmpresa(empresas[0] ?? null);
    }
  }, [empresas, currentPais, currentEmpresa, setCurrentEmpresa]);

  // Preferir el centro marcado por el API como DEFAULT al inicializar o corregir uno persistido.
  React.useEffect(() => {
    if (centrosCosto.length === 0 || !currentEmpresa) {
      return;
    }
    if (
      !currentCentroCosto ||
      !centrosCosto.some((cc) => cc.cod_cc === currentCentroCosto.cod_cc)
    ) {
      setCurrentCentroCosto(centrosCosto.find((cc) => cc.esDefault) ?? centrosCosto[0] ?? null);
    }
  }, [centrosCosto, currentEmpresa, currentCentroCosto, setCurrentCentroCosto]);

  const handleGoHome = () => {
    document.title = `ERP CROPA | DSV`;
    router.push("/");
  };

  const handlePaisChange = (val: string) => {
    const p = paises.find((p) => p.cod_pais === Number.parseInt(val, 10));
    if (p) {
      setCurrentPais(p);
      setCurrentEmpresa(null);
      setCurrentCentroCosto(null);
    }
  };

  const handleEmpresaChange = (val: string) => {
    const e = empresas.find((e) => e.cod_empresa === Number.parseInt(val, 10));
    if (e) {
      setCurrentEmpresa(e);
      setCurrentCentroCosto(null);
    }
  };

  const handleCCChange = (val: string) => {
    const cc = centrosCosto.find((cc) => cc.cod_cc === Number.parseInt(val, 10));
    if (cc) {
      setCurrentCentroCosto(cc);
    }
  };

  // Se eliminó la barra de breadcrumbs según solicitud del usuario

  return (
    <TooltipProvider delayDuration={0}>
      <header className="fixed top-0 left-0 right-0 z-50 w-full">
        {/* Barra principal: material plano translúcido (ver globals.css) */}
        <div className="header-premium">
          <div className="flex items-center h-14 px-4">
            {isSidebarMobile && (
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                aria-label="Abrir barra lateral"
                className="text-white/80 hover:text-white hover:bg-white/10 mr-2"
              >
                <PanelLeft size={20} />
              </Button>
            )}

            {/* Logo */}
            <button
              type="button"
              onClick={handleGoHome}
              aria-label="Cropa Logo"
              className="flex items-center gap-2 p-1 rounded-lg hover:bg-white/5 transition-all"
            >
              <CropaLogo className="h-10 md:h-12 w-auto text-white" />
            </button>

            {/* Content: Desktop o Mobile */}
            {isMobile ? (
              // Mobile: Layout compacto
              <>
                <div className="flex-1" />
                <div className="flex items-center gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Abrir menú de usuario"
                        className="text-white/80 hover:text-white hover:bg-white/10"
                      >
                        <User size={20} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="mt-2 w-56 rounded-xl border-white/10 bg-brand-950/95 shadow-lg backdrop-blur-xl"
                    >
                      <div className="p-2 border-b border-white/10">
                        <p className="text-xs font-semibold text-white/50 uppercase tracking-wider px-2 py-1">
                          Usuario
                        </p>
                      </div>
                      <DropdownMenuItem
                        onClick={() => router.push("/perfil")}
                        className="text-white/80 focus:bg-white/10 focus:text-white cursor-pointer"
                      >
                        <User className="mr-2 h-4 w-4" />
                        <span>Mi Perfil</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </>
            ) : (
              // Desktop: Layout completo
              <>
                {/* Spacer */}
                <div className="flex-1" />

                {/* Context Selectors - País / Empresa / Centro Costo */}
                <div className="flex items-center gap-2 mr-4">
                  {isHomePage ? (
                    <>
                      <Select
                        value={asText(currentPais?.cod_pais)}
                        onValueChange={handlePaisChange}
                      >
                        <SelectTrigger
                          aria-label="Seleccionar país"
                          className="w-35 h-8 bg-white/10 border-white/20 text-white hover:bg-white/15 transition-colors focus:ring-0 focus:ring-offset-0"
                        >
                          <SelectValue placeholder="País" />
                        </SelectTrigger>
                        <SelectContent className="border-white/10 bg-brand-950/95 text-white backdrop-blur-xl">
                          {paises.map((p) => (
                            <SelectItem
                              key={p.cod_pais}
                              value={asText(p.cod_pais)}
                              className="focus:bg-white/10 focus:text-white text-white/90"
                            >
                              {p.nombre_pais}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <span className="text-white/40">•</span>

                      <Select
                        value={asText(currentEmpresa?.cod_empresa)}
                        onValueChange={handleEmpresaChange}
                        disabled={!empresas.length}
                      >
                        <SelectTrigger
                          aria-label="Seleccionar empresa"
                          className="w-45 h-8 bg-white/10 border-white/20 text-white hover:bg-white/15 transition-colors focus:ring-0 focus:ring-offset-0 disabled:opacity-50"
                        >
                          <SelectValue placeholder="Empresa" />
                        </SelectTrigger>
                        <SelectContent className="border-white/10 bg-brand-950/95 text-white backdrop-blur-xl">
                          {empresas.map((e) => (
                            <SelectItem
                              key={e.cod_empresa}
                              value={asText(e.cod_empresa)}
                              className="focus:bg-white/10 focus:text-white text-white/90"
                            >
                              {e.nombre_emp}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <span className="text-white/40">•</span>

                      <Select
                        value={asText(currentCentroCosto?.cod_cc)}
                        onValueChange={handleCCChange}
                        disabled={!centrosCosto.length}
                      >
                        <SelectTrigger
                          aria-label="Seleccionar centro de costo"
                          className="w-50 h-8 bg-white/10 border-white/20 text-white hover:bg-white/15 transition-colors focus:ring-0 focus:ring-offset-0 disabled:opacity-50"
                        >
                          <SelectValue placeholder="Centro de Costo" />
                        </SelectTrigger>
                        <SelectContent className="border-white/10 bg-brand-950/95 text-white backdrop-blur-xl">
                          {centrosCosto.map((cc) => (
                            <SelectItem
                              key={cc.cod_cc}
                              value={cc.cod_cc.toString()}
                              className="focus:bg-white/10 focus:text-white text-white/90"
                            >
                              {cc.nombre_cc}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </>
                  ) : (
                    <div className="flex items-center gap-2 text-white/80 text-sm">
                      <span>{currentPais?.nombre_pais}</span>
                      <span className="text-white/40">•</span>
                      <span>{currentEmpresa?.nombre_emp}</span>
                      <span className="text-white/40">•</span>
                      <span>{currentCentroCosto?.nombre_cc}</span>
                    </div>
                  )}
                </div>

                {/* Divider */}
                <div className="w-px h-6 bg-white/20 mx-2" />

                {/* Quick Actions */}
                <div className="flex items-center gap-0.5">
                  {quickActions.map((action) => (
                    <HeaderButton
                      key={action.id}
                      icon={action.icon}
                      tooltip={action.label}
                      onClick={() => router.push(action.href)}
                    />
                  ))}
                </div>

                {/* Divider */}
                <div className="w-px h-6 bg-white/20 mx-2" />
              </>
            )}
          </div>
        </div>
      </header>
    </TooltipProvider>
  );
}
