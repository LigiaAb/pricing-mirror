import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { setCurrentCategoria, setCurrentMenu, setCurrentModulo, setCurrentUrl } from "../store/slices/menu/menuSlice";

const useVerificarRuta = () => {
  const { catalogo_menus, currentModulo, currentMenu, currentCategoria } = useSelector((state) => state.menu);
  // console.log({ menus });
  const menus = catalogo_menus;
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  // Función para obtener la ruta almacenada de localStorage
  const obtenerRutaAlmacenada = () => {
    const ruta = localStorage.getItem("ruta");
    return ruta || "/"; // Devuelve "/" si no hay ruta almacenada
  };

  // Función para guardar la ruta en localStorage
  const guardarRutaAlmacenada = (ruta) => {
    localStorage.setItem("ruta", ruta);
    dispatch(setCurrentUrl(ruta));
  };

  // Función para dividir la ruta en partes
  const dividirRuta = (ruta) => {
    const partes = ruta.split("/").filter(Boolean);
    const r = partes.filter((i, ind) => ind >= 4);
    return {
      modulo: partes[0] || null,
      menu: partes[1] || null,
      categoria: partes[2] || null,
      id: partes[3] || null,
      resto: r || [], // Elementos adicionales en la URL
    };
  };

  const buscarIdModuloSegunRuta = (ruta) => {
    // console.log({ menus, ruta });
    return (menus || []).find((modulo) => modulo.ruta === `/${ruta}`) || null;
  };

  const buscarIdMenusSegunRuta = (modulo, ruta) => {
    // console.log({ modulo, ruta });
    return modulo?.menus.find((modulo) => modulo.menu_ruta === `${ruta}`) || null;
  };

  const buscarIdCategoriaSegunRuta = (menu, ruta) => {
    // console.log({ menu, ruta });
    return menu?.categorias.find((menu) => menu.ruta_cat === `${ruta}`) || null;
  };

  useEffect(() => {
    if (menus?.length > 0) {
      // Obtener la ruta almacenada (con valor por defecto si no existe)
      const rutaAlmacenada = obtenerRutaAlmacenada();

      // console.log({ rutaAlmacenada });

      // Si no hay ruta almacenada, establecer valores por defecto en Redux
      if (!rutaAlmacenada) {
        dispatch(setCurrentModulo({ modulo: null }));
        dispatch(setCurrentMenu({ menu: null }));
        dispatch(setCurrentCategoria({ categoria: null }));
        return;
      }

      // console.log({ rutaActual: location.pathname, rutaPrevia: rutaAlmacenada });

      // Dividir las rutas actual y almacenada
      const rutaActual = dividirRuta(location.pathname);
      const rutaPrevia = dividirRuta(rutaAlmacenada);

      // Comparar si las rutas han cambiado
      const esDiferente =
        rutaActual.modulo !== rutaPrevia.modulo ||
        rutaActual.menu !== rutaPrevia.menu ||
        rutaActual.categoria !== rutaPrevia.categoria ||
        rutaActual.id !== rutaPrevia.id ||
        rutaActual.resto.join("/") !== rutaPrevia.resto.join("/");

      // Si las rutas son iguales, no hacer nada
      // console.log(esDiferente);

      // console.log(menus, rutaActual);

      const modulo = buscarIdModuloSegunRuta(rutaActual.modulo);

      if ((rutaActual.modulo !== rutaPrevia.modulo && modulo) || (modulo && !currentModulo)) {
        dispatch(setCurrentModulo({ modulo: modulo }));
      }

      const menu = buscarIdMenusSegunRuta(modulo, rutaActual.menu);

      if ((rutaActual.menu !== rutaPrevia.menu && menu) || (menu && !currentMenu)) {
        dispatch(setCurrentMenu({ menu: menu }));
      }

      const categoria = buscarIdCategoriaSegunRuta(menu, rutaActual.categoria);

      if ((rutaActual.categoria !== rutaPrevia.categoria && categoria) || (categoria && !currentCategoria)) {
        dispatch(setCurrentCategoria({ categoria: categoria }));
      }

      // console.log({ modulo, menu, categoria, currentModulo, currentMenu, currentCategoria, esDiferente }, !((!currentModulo && modulo) || (!currentMenu && menu) || (!currentCategoria && categoria)));

      document.title = `ERP CROPA | DSV - ${modulo?.nom_modulo ? `${modulo?.nom_modulo} -` : ""} ${menu?.nom_menu ? `${menu?.nom_menu} -` : ""} ${categoria?.nom_cat ? `${categoria?.nom_cat} ` : ""}`;

      if (!esDiferente) return;

      // Construir la nueva ruta para redirigir
      const nuevaRuta = `${rutaActual.modulo ? `/${rutaActual.modulo}` : ""}${rutaActual.menu ? `/${rutaActual.menu}` : ""}${rutaActual.categoria ? `/${rutaActual.categoria}` : ""}${
        rutaActual.id ? `/${rutaActual.id}` : ""
      }${rutaActual.resto.length === 0 ? "" : `/${rutaActual.resto.join("/")}`}`;

      // console.log({ nuevaRuta });

      // Guardar la nueva ruta en localStorage
      guardarRutaAlmacenada(nuevaRuta);

      // Navegar a la nueva ruta
      // navigate(nuevaRuta);
    }
  }, [menus, currentMenu, currentModulo, location, dispatch, navigate]);
};

export default useVerificarRuta;
