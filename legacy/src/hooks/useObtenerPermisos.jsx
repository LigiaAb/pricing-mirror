import { useSelector } from "react-redux";

const filtrarJerarquia = (data, ...criterios) => {
  // Caso base: si no hay criterios o no hay datos, retornar datos originales
  if (criterios.length === 0 || !data) return data;

  // Extraer el primer par de criterio (campo y valor)
  const [campo, valor, ...restoCriterios] = criterios;

  // Si es un array: filtrar elementos que cumplan el criterio actual
  if (Array.isArray(data)) {
    return data
      .filter((item) => {
        // Convertir a minúsculas para búsqueda insensible a mayúsculas
        const itemValor = String(item[campo] || "").toLowerCase();
        const valorBusqueda = String(valor || "").toLowerCase();
        return itemValor.includes(valorBusqueda);
      })
      .map((item) => ({
        ...item,
        // Aplicar recursivamente a propiedades anidadas
        ...(restoCriterios.length > 0 && Object.fromEntries(Object.entries(item).map(([key, value]) => [key, filtrarJerarquia(value, ...restoCriterios)]))),
      }));
  }

  // Si es un objeto: aplicar recursivamente a sus propiedades
  if (typeof data === "object" && data !== null) {
    return Object.fromEntries(Object.entries(data).map(([key, val]) => [key, filtrarJerarquia(val, ...criterios)]));
  }

  // Para otros tipos (string, number, etc.) retornar sin cambios
  return data;
};

// Función específica para tu estructura transformada
const buscarPorValor = (data, ...criterios) => {
  if (!data?.paises) return [];
  return filtrarJerarquia(data.paises, ...criterios) || [];
};
// const buscarPorValor = (data, columna, valor) => {
//   const resultado = data.filter((item) => item[columna] === valor);
//   return resultado;
// };

const buscarPorValorAnidado = (data, ...rutas) => {
  let current = data;

  for (let i = 0; i < rutas.length; i += 2) {
    const propiedad = rutas[i];
    const valorBuscado = rutas[i + 1];

    if (!current[propiedad]) return {};

    // Buscar en objetos anidados
    const coleccion = current[propiedad];
    const nodo = Object.values(coleccion).find((item) => item && item.codigo === valorBuscado);

    if (!nodo) return {};
    current = nodo;
  }

  return current;
};

const transformObjectToArray = (data, config) => {
  if (!data || typeof data !== "object") return data;

  // Si es array, procesamos cada elemento
  if (Array.isArray(data)) {
    return data.map((item) => transformObjectToArray(item, config));
  }

  // Creamos nuevo objeto/array
  const newObj = {};

  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      const value = data[key];

      if (config[key] === true) {
        // Convertir objeto en array de valores transformados
        newObj[key] = Object.values(value || {}).map((item) => transformObjectToArray(item, config));
      } else if (config[key]) {
        // Usar configuración específica para esta propiedad
        newObj[key] = transformObjectToArray(value, config[key]);
      } else {
        // Propiedades sin transformación especial
        newObj[key] = transformObjectToArray(value, config);
      }
    }
  }

  return newObj;
};

// Configuración para tu estructura específica
const transformJSON = (jsonData) => {
  if (!jsonData) return { paises: [] };

  const parseSafe = (data) => {
    try {
      return typeof data === "string" ? JSON.parse(data) : data;
    } catch (e) {
      return null;
    }
  };
  const j = parseSafe(jsonData);

  if (!j?.permisos) return { paises: [] };

  const incluir = { paises: true, empresas: true, centrosCosto: true, modulos: true, menus: true, categorias: true, opciones: true, acciones: true };

  return transformObjectToArray(j?.permisos, incluir) || { paises: [] };
};

const useObtenerPaises = () => {
  const { json } = useSelector((state) => state.auth);
  return buscarPorValor(transformJSON(json));
};

const useObtenerEmpresasPorPais = (codPais) => {
  const { json } = useSelector((state) => state.auth);
  const empresas = buscarPorValor(transformJSON(json), "cod_pais", codPais)[0]?.empresas || [];
  return empresas;
};

const useObtenerCentrosCostoPorEmpresa = (codPais, codEmpresa) => {
  const { json } = useSelector((state) => state.auth);
  const centrosCosto = buscarPorValor(transformJSON(json), "cod_pais", codPais, "cod_empresa", codEmpresa)[0]?.empresas[0]?.centrosCosto || [];
  return centrosCosto;
};

const useObtenerModuloPorCentroCosto = (codPais, codEmpresa, codCc) => {
  const { json } = useSelector((state) => state.auth);
  const modulo = buscarPorValor(transformJSON(json), "cod_pais", codPais, "cod_empresa", codEmpresa, "cod_cc", codCc)[0]?.empresas[0]?.centrosCosto[0]?.modulos || [];
  return modulo;
};

const useObtenerMenusPorModulo = (codPais, codEmpresa, codCc, codModulo) => {
  const { json } = useSelector((state) => state.auth);
  const menus = buscarPorValor(transformJSON(json), "cod_pais", codPais, "cod_empresa", codEmpresa, "cod_cc", codCc, "cod_modulo", codModulo);
  return menus;
};

const useObtenerCategoriasPorMenu = (codPais, codEmpresa, codCc, codModulo, codMenu) => {
  const { json } = useSelector((state) => state.auth);
  const categorias = buscarPorValor(transformJSON(json), "cod_pais", codPais, "cod_empresa", codEmpresa, "cod_cc", codCc, "cod_modulo", codModulo, "cod_menu", codMenu);
  return categorias;
};

const useObtenerOpcionesPorCategoria = (codPais, codEmpresa, codCc, codModulo, codMenu, codCategoria) => {
  const { json } = useSelector((state) => state.auth);
  const ruta = ["cod_pais", codPais, "cod_empresa", codEmpresa, "cod_cc", codCc, "cod_modulo", codModulo, "cod_menu", codMenu, "cod_categoria", codCategoria];
  const opciones = buscarPorValor(transformJSON(json), ...ruta);
  return opciones;
};

const useObtenerAccionesPorOpcion = (codPais, codEmpresa, codCc, codModulo, codMenu, codCategoria, codOpcion) => {
  const { json } = useSelector((state) => state.auth);
  const ruta = ["cod_pais", codPais, "cod_empresa", codEmpresa, "cod_cc", codCc, "cod_modulo", codModulo, "cod_menu", codMenu, "cod_categoria", codCategoria, "cod_opcion", codOpcion];
  const acciones = buscarPorValor(transformJSON(json), ...ruta);
  return acciones;
};

// obtener permisos basados en valores current

const useObtenerEmpresasPorPaisActual = () => {
  const { currentPais, currentEmpresa } = useSelector((state) => state.menu);
  return useObtenerEmpresasPorPais(currentPais?.cod_pais);
};

const useObtenerCentrosCostoPorEmpresaActual = () => {
  const { currentPais, currentEmpresa, currentCentroCosto } = useSelector((state) => state.menu);
  return useObtenerCentrosCostoPorEmpresa(currentPais?.cod_pais, currentEmpresa?.cod_empresa);
};

const useObtenerModuloPorCentroCostoActual = () => {
  const { currentPais, currentEmpresa, currentCentroCosto, currentModulo } = useSelector((state) => state.menu);
  return useObtenerModuloPorCentroCosto(currentPais?.cod_pais, currentEmpresa?.cod_empresa, currentCentroCosto?.cod_cc);
};

const useObtenerMenusPorModuloActual = () => {
  const { currentPais, currentEmpresa, currentCentroCosto, currentModulo } = useSelector((state) => state.menu);
  return useObtenerMenusPorModulo(currentPais?.cod_pais, currentEmpresa?.cod_empresa, currentCentroCosto?.cod_cc, currentModulo?.cod_modulo);
};

const useObtenerCategoriasPorMenuActual = () => {
  const { currentPais, currentEmpresa, currentCentroCosto, currentModulo, currentMenu } = useSelector((state) => state.menu);
  return useObtenerCategoriasPorMenu(currentPais?.cod_pais, currentEmpresa?.cod_empresa, currentCentroCosto?.cod_cc, currentModulo?.cod_modulo, currentMenu?.cod_menu);
};

const useObtenerOpcionesPorCategoriaActual = () => {
  const { currentPais, currentEmpresa, currentCentroCosto, currentModulo, currentMenu, currentCategoria } = useSelector((state) => state.menu);
  return useObtenerOpcionesPorCategoria(
    currentPais?.cod_pais,
    currentEmpresa?.cod_empresa,
    currentCentroCosto?.cod_cc,
    currentModulo?.cod_modulo,
    currentMenu?.cod_menu,
    currentCategoria?.cod_categoria
  );
};

const useObtenerAccionesPorOpcionActual = (nOpcion) => {
  const { currentPais, currentEmpresa, currentCentroCosto, currentModulo, currentMenu, currentCategoria } = useSelector((state) => state.menu);
  return useObtenerAccionesPorOpcion(
    currentPais?.cod_pais,
    currentEmpresa?.cod_empresa,
    currentCentroCosto?.cod_cc,
    currentModulo?.cod_modulo,
    currentMenu?.cod_menu,
    currentCategoria?.cod_categoria,
    nOpcion
  );
};

export {
  useObtenerPaises,
  useObtenerEmpresasPorPaisActual,
  useObtenerCentrosCostoPorEmpresaActual,
  useObtenerModuloPorCentroCostoActual,
  useObtenerMenusPorModuloActual,
  useObtenerCategoriasPorMenuActual,
  useObtenerOpcionesPorCategoriaActual,
  useObtenerAccionesPorOpcionActual,
};
