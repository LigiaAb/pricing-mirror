import { useSelector } from "react-redux";

const jsonAArray = (json, cpais, cempresa, ccc, cmodulo, cmenu, ccategoria) => {
  return {
    paises: Object.keys(json?.paises || {}).map((kpais) => {
      if (Number(kpais) === Number(cpais)) {
        let pais = json.paises[kpais];
        let empresas = Object.keys(pais.empresas).map((kempresa) => {
          if (Number(kempresa) === Number(cempresa)) {
            let empresa = pais.empresas[kempresa];
            let centrosCosto = Object.keys(empresa.centrosCosto).map((kcc) => {
              if (Number(kcc) === Number(ccc)) {
                let cc = empresa.centrosCosto[kcc];
                let modulos = Object.keys(cc.modulos).map((kmodulo) => {
                  if (Number(kmodulo) === Number(cmodulo)) {
                    let modulo = cc.modulos[kmodulo];
                    let menus = Object.keys(modulo.menus).map((kmenu) => {
                      if (Number(kmenu) === Number(cmenu)) {
                        let menu = modulo.menus[kmenu];
                        let categorias = Object.keys(menu.categorias).map((kcategoria) => {
                          if (ccategoria) {
                            if (Number(kcategoria) === Number(ccategoria)) {
                              let categoria = menu.categorias[kcategoria];
                              let opciones = Object.values(categoria.opciones).map((opcion) => {
                                let acciones = Object.values(opcion.acciones).map((i) => i);
                                return { ...opcion, acciones };
                              });
                              return { ...categoria, opciones };
                            }
                          } else {
                            let opciones = Object.values(menu.categorias[kcategoria].opciones).map((opcion) => {
                              let acciones = Object.values(opcion.acciones).map((i) => i);
                              return { ...opcion, acciones };
                            });
                            return { ...menu.categorias[kcategoria], opciones };
                          }
                        });
                        return { ...menu, categorias: categorias.filter((i) => i) };
                      }
                    });
                    return { ...modulo, menus: menus.filter((i) => i) };
                  }
                });
                return { ...cc, modulos: modulos.filter((i) => i) };
              }
            });
            return { ...empresa, centrosCosto: centrosCosto.filter((i) => i) };
          }
        });
        return { ...pais, empresas: empresas.filter((i) => i) };
      }
    }),
  };
};

const arrayAJson = (array, cpais, cempresa, ccc, cmodulo, cmenu, ccategoria, copcion) => {
  let json = {};

  array
    .find((i) => Number(i.cod_pais) === Number(cpais))
    ?.empresas.find((i) => Number(i.cod_empresa) === Number(cempresa))
    ?.centrosCosto.find((i) => Number(i.cod_cc) === Number(ccc))
    ?.modulos.find((i) => Number(i.cod_modulo) === Number(cmodulo))
    ?.menus.find((i) => Number(i.cod_menu) === Number(cmenu))
    ?.categorias.find((i) => (ccategoria ? Number(i.cod_categoria) === Number(ccategoria) : true))
    ?.opciones.map((o) => {
      if (!json[o.cod_opcion]) json[o.cod_opcion] = { ...o, acciones: {} };

      o.acciones.map((a) => {
        if (!json[o.cod_opcion]["acciones"][a.cod_accion]) json[o.cod_opcion]["acciones"][a.cod_accion] = { ...a };
      });

      return o;
    });

  return json;
};

const useObtenerOpcionesAcciones = (opcion) => {
  const { json: jsonData } = useSelector((state) => state.auth);
  const { currentPais, currentEmpresa, currentCentroCosto, currentMenu, currentCategoria, currentModulo, menus: catalogo_menus } = useSelector((state) => state.menu);

  let permisosArray = currentCategoria?.opciones;

  let catalogoArray = catalogo_menus
    ?.find((i) => i.cod_pais === currentPais?.cod_pais)
    ?.empresas.find((i) => i.cod_empresa === currentEmpresa?.cod_empresa)
    ?.centrosCosto.find((i) => i.cod_cc === currentCentroCosto?.cod_cc)
    ?.modulos.find((i) => i.cod_modulo === currentModulo?.cod_modulo)
    ?.menus.find((i) => i.cod_menu === currentMenu?.cod_menu)
    ?.categorias.find((i) => i.cod_categoria === currentCategoria?.cod_categoria)?.opciones;

  let permisosObj =
    jsonData?.permisos?.paises[`${currentPais?.cod_pais}`]?.empresas[`${currentEmpresa?.cod_empresa}`]?.centrosCosto[currentCentroCosto?.cod_cc]?.modulos[currentModulo?.cod_modulo]?.menus[
      currentMenu?.cod_menu
    ]?.categorias[currentCategoria?.cod_categoria]?.opciones;

  let catalogoObj = arrayAJson(
    catalogo_menus,
    currentPais?.cod_pais,
    currentEmpresa?.cod_empresa,
    currentCentroCosto?.cod_cc,
    currentModulo?.cod_modulo,
    currentMenu?.cod_menu,
    currentCategoria?.cod_categoria
  );

  return {
    permisosArray: Object.values(permisosObj || {}).map((i) => ({ ...i, acciones: Object.values(i.acciones) })) || [],
    catalogoArray: catalogoArray || [],
    permisosObj: permisosObj || {},
    catalogoObj: catalogoObj || {},
  };
};

export const useObtenerPermisosDeOpcion = (nombre_opcion) => {
  const { json } = useSelector((state) => state.auth);
  const { currentPais, currentEmpresa, currentCentroCosto, currentMenu, currentCategoria, currentModulo } = useSelector((state) => state.menu);

  const listaOpciones =
    json.permisos.paises[`${currentPais?.cod_pais}`]?.empresas[`${currentEmpresa?.cod_empresa}`]?.centrosCosto[currentCentroCosto?.cod_cc]?.modulos[currentModulo?.cod_modulo]?.menus[
      currentMenu?.cod_menu
    ]?.categorias[currentCategoria?.cod_categoria]?.opciones || {};

  if (nombre_opcion) {
    const id_opcion = Object.keys(listaOpciones).find((key) => listaOpciones[key].nom_opcion === nombre_opcion);

    return listaOpciones[id_opcion] || {};
  } else return listaOpciones || {};
};

export const useObtenerPermisosDeMenuActual = () => {
  const { json } = useSelector((state) => state.auth);
  const { currentPais, currentEmpresa, currentCentroCosto, currentMenu, currentCategoria, currentModulo } = useSelector((state) => state.menu);

  if (!json?.permisos?.paises) return {};

  const listaOpciones =
    json.permisos.paises[`${currentPais?.cod_pais}`]?.empresas[`${currentEmpresa?.cod_empresa}`]?.centrosCosto[currentCentroCosto?.cod_cc]?.modulos[currentModulo?.cod_modulo]?.menus[
      currentMenu?.cod_menu
    ]?.categorias || {};

  return listaOpciones || {};
};

export const useObtenerCategoriasActivas = (opcion) => {
  const { json: jsonData } = useSelector((state) => state.auth);
  const { currentEmpresa, currentCentroCosto, currentMenu, currentCategoria, catalogo_menus } = useSelector((state) => state.menu);

  let permisosArray = jsonData?.permisos
    ? jsonAArray(jsonData.permisos, currentEmpresa?.pais_emp, currentEmpresa?.cod_empresa, currentCentroCosto?.cod_cc, currentMenu?.cod_modulo, currentMenu?.cod_menu)?.paises?.[0]
      ?.empresas?.[0]?.centrosCosto?.[0]?.modulos?.[0]?.menus?.[0]
    : null;

  let catalogoArray = catalogo_menus?.paises
    ?.find((i) => i.cod_pais === currentEmpresa?.pais_emp)
    ?.empresas?.find((i) => i.cod_empresa === currentEmpresa?.cod_empresa)
    ?.centrosCosto?.find((i) => i.cod_cc === currentCentroCosto?.cod_cc)
    ?.modulos?.find((i) => i.cod_modulo === currentMenu?.cod_modulo)
    ?.menus?.find((i) => i.cod_menu === currentMenu?.cod_menu);

  let permisosObj = jsonData?.permisos?.paises
    ? jsonData.permisos.paises[`${currentEmpresa?.pais_emp}`]?.empresas?.[`${currentEmpresa?.cod_empresa}`]?.centrosCosto?.[currentCentroCosto?.cod_cc]?.modulos?.[currentMenu?.cod_modulo]?.menus?.[
        currentMenu?.cod_menu
      ]
    : null;

  let catalogoObj = arrayAJson(catalogo_menus, currentEmpresa?.pais_emp, currentEmpresa?.cod_empresa, currentCentroCosto?.cod_cc, currentMenu?.cod_modulo, currentMenu?.cod_menu);

  return {
    permisosArray: permisosArray || [],
    catalogoArray: catalogoArray || [],
    permisosObj: permisosObj || {},
    catalogoObj: catalogoObj || {},
  };
};

export default useObtenerOpcionesAcciones;
