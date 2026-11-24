// src/components/MetaHandler.js
import { useEffect, useMemo } from "react";
import { json, useLocation, useNavigate } from "react-router-dom";
import { decryptId } from "../api/encryptDecrypt";
import { useDispatch, useSelector } from "react-redux";
import { setCurrentCategoria, setCurrentCentroCosto, setCurrentEmpresa, setCurrentMenu, setCurrentModulo, setCurrentPais } from "../store/slices/menu/menuSlice";
import { useFetchCentrosCosto, useFetchEmpresas, useFetchPaises } from "../hooks/Fetch/useFetchCatalog";
import { useFetchCategorias, useFetchJsonUsuario, useFetchMenus, useFetchModulos } from "../hooks/Fetch/useFetchConfiguracion";
import { checkingCurrentToken } from "../store/slices/auth/thunks";
import { redirectToUserHome } from "../store/slices/menu/thunks";
import { apagarCarga, encenderCarga } from "../store/slices/status/statusSlice";

const MetaHandler = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { json, defaultUrl } = useSelector((state) => state.auth);
  const { menus, currentPais, currentEmpresa, currentcentroCosto, currentModulo, currentMenu, currentCategoria } = useSelector((state) => state.menu);
  useEffect(() => {
    dispatch(encenderCarga());
    dispatch(checkingCurrentToken());
  }, []);
  useEffect(() => {
    // console.log("MetaHandler useEffect");
    const searchParams = new URLSearchParams(location.search);

    if (searchParams.has("meta")) {
      // 1. Obtener y analizar el valor de meta
      const metaValueDecrypt = decryptId(searchParams.get("meta") || "{}");

      // 2. Obtener los valores de meta
      const metaValue = JSON.parse(metaValueDecrypt);
      const json = menus;
      const pais = metaValue.pais ? json.find((p) => p.cod_pais === metaValue.pais) : null;
      const empresa = pais && metaValue.empresa ? pais.empresas?.find((e) => e.cod_empresa === metaValue.empresa) : null;
      const centroCosto = empresa && metaValue.centroCosto ? empresa.centrosCosto.find((c) => c.cod_cc === metaValue.centroCosto) : null;
      const modulo = centroCosto && metaValue.modulo ? centroCosto.modulos.find((m) => m.cod_modulo === metaValue.modulo) : null;
      const menu = modulo && metaValue.menu ? modulo.menus.find((m) => m.cod_menu === metaValue.menu && m.cod_cc === centroCosto.cod_cc) : null;
      const categoria = menu && metaValue.categoria ? menu.categorias.find((c) => c.cod_categoria === metaValue.categoria) : null;

      console.log("Valores de meta encontrados:", { metaValue, json, pais, empresa, centroCosto, modulo, menu, categoria });
      // 3. Guardar en sessionStorage (visible en todas las pestañas del mismo dominio)
      if (pais) dispatch(setCurrentPais(pais));
      if (empresa) dispatch(setCurrentEmpresa(empresa));
      if (centroCosto) dispatch(setCurrentCentroCosto(centroCosto));
      if (modulo) dispatch(setCurrentModulo({ modulo: modulo }));
      if (menu) dispatch(setCurrentMenu({ menu: menu }));
      if (categoria) dispatch(setCurrentCategoria({ categoria: categoria }));

      // 4. Eliminar el parámetro meta
      searchParams.delete("meta");

      // 5. Construir nueva URL
      const newUrl = `${location.pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}${location.hash || ""}`;

      if (metaValue.pais && pais && metaValue.empresa && empresa && metaValue.centroCosto && centroCosto && metaValue.modulo && modulo && metaValue.menu && menu && metaValue.categoria && categoria)
        // 6. Redirigir sin recargar la página
        navigate(newUrl, { replace: true });
    } else dispatch(redirectToUserHome(true, window.location?.pathname));

    dispatch(apagarCarga());
  }, [menus, location.pathname, location.search, location.hash, dispatch, navigate]);

  return null; // Componente invisible
};

export default MetaHandler;