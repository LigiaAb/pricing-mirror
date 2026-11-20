"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import { env } from "@/shared/config/env";
import { asText } from "@/shared/lib/text";
import { useAuthStore } from "@/shared/stores/auth-store";
import { useNavegacionActual } from "../hooks/use-navegacion-actual";
import { useContextoOperativoStore } from "../stores/contexto-operativo-store";

/**
 * Componente que sincroniza reactivamente el estado de autenticación,
 * el usuario y las selecciones de contexto (país, empresa, centro de costo)
 * con el SDK global de Sentry en el cliente.
 *
 * Solo activo en producción.
 */
function SentryEffects() {
  const user = useAuthStore((state) => state.user);
  const currentPais = useContextoOperativoStore((state) => state.currentPais);
  const currentEmpresa = useContextoOperativoStore((state) => state.currentEmpresa);
  const currentCentroCosto = useContextoOperativoStore((state) => state.currentCentroCosto);
  const {
    modulo: currentModulo,
    menu: currentMenu,
    categoria: currentCategoria,
  } = useNavegacionActual();

  useEffect(() => {
    const buildId = env.NEXT_PUBLIC_APP_BUILD_ID ?? "unknown";
    Sentry.setTag("build_id", buildId);
  }, []);

  useEffect(() => {
    if (user) {
      Sentry.setUser({
        id: asText(user.cod_usuario ?? user.id),
        email: user.email || "",
        username: asText(user.nombre_usuario || user.user_name || user.email),
      });
    } else {
      Sentry.setUser(null);
    }
  }, [user]);

  useEffect(() => {
    Sentry.setTag("pais_nombre", currentPais?.nombre_pais ?? "none");
    Sentry.setTag(
      "empresa_nombre",
      currentEmpresa?.nombre_emp ?? currentEmpresa?.nom_emp ?? "none",
    );
    Sentry.setTag(
      "centro_costo_nombre",
      currentCentroCosto?.nombre_cc ?? currentCentroCosto?.nom_cc ?? "none",
    );
  }, [currentPais, currentEmpresa, currentCentroCosto]);

  useEffect(() => {
    Sentry.setContext("erp_navigation", {
      pais: currentPais
        ? { cod_pais: currentPais.cod_pais, nombre_pais: currentPais.nombre_pais }
        : null,
      empresa: currentEmpresa
        ? {
            cod_empresa: currentEmpresa.cod_empresa,
            nombre_emp: currentEmpresa.nombre_emp ?? currentEmpresa.nom_emp,
          }
        : null,
      centro_costo: currentCentroCosto
        ? {
            cod_cc: currentCentroCosto.cod_cc,
            nombre_cc: currentCentroCosto.nombre_cc ?? currentCentroCosto.nom_cc,
          }
        : null,
      modulo: currentModulo
        ? {
            cod_modulo: currentModulo.cod_modulo,
            nom_modulo: currentModulo.nom_modulo,
            modulo_ruta: currentModulo.modulo_ruta,
          }
        : null,
      menu: currentMenu
        ? {
            cod_menu: currentMenu.cod_menu,
            nom_menu: currentMenu.nom_menu,
            menu_ruta: currentMenu.menu_ruta,
          }
        : null,
      categoria: currentCategoria
        ? {
            cod_categoria: currentCategoria.cod_categoria,
            nom_cat: currentCategoria.nom_cat,
            ruta_cat: currentCategoria.ruta_cat,
          }
        : null,
    });
  }, [
    currentPais,
    currentEmpresa,
    currentCentroCosto,
    currentModulo,
    currentMenu,
    currentCategoria,
  ]);

  return null;
}

export function SentryContextTracker() {
  if (env.NODE_ENV !== "production") {
    return null;
  }
  return <SentryEffects />;
}
