import { setDashboardAccessGranted } from "../auth/authSlice";
import {
  removeCurrentCategoria,
  removeCurrentMenu,
  removeCurrentModulo,
  setCurrentCategoria,
  setCurrentCentroCosto,
  setCurrentEmpresa,
  setCurrentMenu,
  setCurrentModulo,
  setCurrentPais,
  setMenus,
} from "./menuSlice";

/**
 * `menu/thunks.js`
 *
 * Este archivo contiene helpers y thunks para:
 * - Construir el árbol de menús a partir del JSON recibido desde backend (`generatemenuTree`).
 * - Mantener en Redux/sessionStorage el “contexto” de navegación:
 *   país, empresa, centro de costo, módulo, menú y categoría.
 * - Resolver redirecciones a la URL de inicio del usuario preservando segmentos extra (IDs, etc).
 *
 * Nota clave de permisos por defecto:
 * - El `puesto_default` (pais/empresa/cc) **solo** se aplica cuando el usuario tiene `defaultUrl`.
 *   Si no hay ruta default, el contexto debe quedarse en `null` hasta que el usuario lo seleccione.
 */
export const setCurrentFromRoute = (location) => async (dispatch) => {};
export const getMenus = () => async (dispatch) => {};
export const getCurrentMen = () => async (dispatch) => {};
export const getCurrentModul = () => async (dispatch) => {};
export const getCurrentCategori = () => async (dispatch) => {};
export const setMenu = () => async (dispatch) => {};

const transformToArray = (rawData) => {
  // Extraer los objetos principales
  const {
    paises: paisesMap = {},
    empresas: empresasMap = {},
    centrosCosto: centrosCostoMap = {},
    modulos: modulosMap = {},
    menus: menusMap = {},
    categorias: categoriasMap = {},
    opciones: opcionesMap = {},
    acciones: accionesMap = {},
  } = rawData;

  // Función para mapear IDs a objetos
  const resolveReferences = (ids, source) => (ids || []).map((id) => source[id]).filter(Boolean);

  // Construir la estructura como array
  return Object.values(paisesMap).map((pais) => ({
    ...pais,
    empresas: resolveReferences(pais.empresas, empresasMap).map((empresa) => ({
      ...empresa,
      centrosCosto: resolveReferences(empresa.centrosCosto, centrosCostoMap).map((cc) => ({
        ...cc,
        modulos: resolveReferences(cc.modulos, modulosMap).map((modulo) => ({
          ...modulo,
          menus: resolveReferences(modulo.menus, menusMap).map((menu) => ({
            ...menu,
            categorias: resolveReferences(menu.categorias, categoriasMap).map((categoria) => ({
              ...categoria,
              opciones: resolveReferences(categoria.opciones, opcionesMap).map((opcion) => ({
                ...opcion,
                acciones: resolveReferences(opcion.acciones, accionesMap),
              })),
            })),
          })),
        })),
      })),
    })),
  }));
};
const transformJSON = (rawData) => {
  // Extraer los objetos principales
  const { paises = {}, empresas = {}, centrosCosto = {}, modulos = {}, menus = {}, categorias = {}, opciones = {}, acciones = {} } = rawData;

  // Función para mapear IDs a objetos con resolución de referencias
  const mapIdsToObjects = (ids, source) => (ids || []).map((id) => source[id]).filter(Boolean);

  // Construir la estructura anidada
  return {
    paises: Object.values(paises).map((pais) => ({
      ...pais,
      empresas: mapIdsToObjects(pais.empresas, empresas).map((empresa) => ({
        ...empresa,
        centrosCosto: mapIdsToObjects(empresa.centrosCosto, centrosCosto).map((cc) => ({
          ...cc,
          modulos: mapIdsToObjects(cc.modulos, modulos).map((modulo) => ({
            ...modulo,
            menus: mapIdsToObjects(modulo.menus, menus).map((menu) => ({
              ...menu,
              categorias: mapIdsToObjects(menu.categorias, categorias).map((categoria) => ({
                ...categoria,
                opciones: mapIdsToObjects(categoria.opciones, opciones).map((opcion) => ({
                  ...opcion,
                  acciones: mapIdsToObjects(opcion.acciones, acciones),
                })),
              })),
            })),
          })),
        })),
      })),
    })),
  };
};

const safeParse = (val) => (typeof val === "string" ? JSON.parse(val) : val);
const toNumOrStr = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : v;
};
const getCode = (obj, fallbackKey, prop) => obj?.[prop] ?? toNumOrStr(fallbackKey);

/**
 * Filtra el árbol de `menus` (paises->empresas->cc->modulos->menus->categorias)
 * usando la estructura de permisos del usuario.
 *
 * Se espera `jsonPermisos` como el JSON del usuario (con `permisos.paises`).
 * Si no hay permisos, regresa el árbol sin filtrar.
 */
const filterMenuTreeByPermisos = (menuTreeArray, jsonPermisos) => {
  const jp = safeParse(jsonPermisos);
  const permisosPaises = jp?.permisos?.paises || null;
  if (!permisosPaises) return menuTreeArray;

  // Pre-normalizar: mapa cod_pais -> nodoPermisoPais
  const paisPermMap = new Map();
  Object.entries(permisosPaises).forEach(([k, v]) => {
    const cod = getCode(v, k, "cod_pais");
    paisPermMap.set(cod, v);
  });

  return (menuTreeArray || [])
    .filter((pais) => paisPermMap.has(pais?.cod_pais))
    .map((pais) => {
      const permPais = paisPermMap.get(pais.cod_pais);
      const empresasPerm = permPais?.empresas || {};
      const empPermMap = new Map();
      Object.entries(empresasPerm).forEach(([k, v]) => {
        const cod = getCode(v, k, "cod_empresa");
        empPermMap.set(cod, v);
      });

      const empresas = (pais.empresas || [])
        .filter((e) => empPermMap.has(e?.cod_empresa))
        .map((empresa) => {
          const permEmp = empPermMap.get(empresa.cod_empresa);
          const ccPerm = permEmp?.centrosCosto || {};
          const ccPermMap = new Map();
          Object.entries(ccPerm).forEach(([k, v]) => {
            const cod = getCode(v, k, "cod_cc");
            ccPermMap.set(cod, v);
          });

          const centrosCosto = (empresa.centrosCosto || [])
            .filter((cc) => ccPermMap.has(cc?.cod_cc))
            .map((cc) => {
              const permCC = ccPermMap.get(cc.cod_cc);
              const modPerm = permCC?.modulos || {};
              const modPermMap = new Map();
              Object.entries(modPerm).forEach(([k, v]) => {
                const cod = getCode(v, k, "cod_modulo");
                modPermMap.set(cod, v);
              });

              const modulos = (cc.modulos || [])
                .filter((m) => modPermMap.has(m?.cod_modulo))
                .map((modulo) => {
                  const permMod = modPermMap.get(modulo.cod_modulo);
                  const menuPerm = permMod?.menus || {};
                  const menuPermMap = new Map();
                  Object.entries(menuPerm).forEach(([k, v]) => {
                    const cod = getCode(v, k, "cod_menu");
                    menuPermMap.set(cod, v);
                  });

                  const menus = (modulo.menus || [])
                    .filter((mn) => menuPermMap.has(mn?.cod_menu))
                    .map((mn) => {
                      const permMenu = menuPermMap.get(mn.cod_menu);
                      const catPerm = permMenu?.categorias || {};
                      const catPermSet = new Set(Object.entries(catPerm).map(([k, v]) => getCode(v, k, "cod_categoria")));

                      const categorias = (mn.categorias || []).filter((c) => catPermSet.has(c?.cod_categoria));
                      return { ...mn, categorias };
                    })
                    .filter((mn) => (mn.categorias || []).length > 0);

                  return { ...modulo, menus };
                })
                .filter((m) => (m.menus || []).length > 0);

              return { ...cc, modulos };
            })
            .filter((cc) => (cc.modulos || []).length > 0);

          return { ...empresa, centrosCosto };
        })
        .filter((e) => (e.centrosCosto || []).length > 0);

      return { ...pais, empresas };
    })
    .filter((p) => (p.empresas || []).length > 0);
};

export const generatemenuTree = (allMenus, json) => (dispatch, getState) => {
  const menusObj = transformJSON(allMenus);
  const menusArray = transformToArray(allMenus);

  // Filtrar el árbol por permisos del usuario (jsonPermisos)
  const filteredMenusArray = filterMenuTreeByPermisos(menusArray, json);

  dispatch(setMenus({ menusJSON: menusObj, menus: filteredMenusArray }));
};
export const setPais = (pais) => (dispatch) => {
  dispatch(setCurrentPais(pais));
};
export const setEmpresa = (empresa) => (dispatch) => {
  dispatch(setCurrentEmpresa(empresa));
};
export const setCentroCosto = (cc) => (dispatch) => {
  dispatch(setCurrentCentroCosto(cc));
};

const normalizeSegment = (seg) =>
  (seg || "")
    .toString()
    .trim()
    .replace(/^\/+|\/+$/g, "");

/**
 * Encuentra el contexto (pais/empresa/cc/modulo/menu/categoría) recorriendo TODO el árbol
 * para una URL tipo: `/modulo/menu/categoria/...extra`.
 *
 * Se usa para inicializar currents desde `defaultUrl` en el primer login,
 * sin depender de `puesto_default`.
 */
const findContextByUrl = (menus, url, puesto_default) => {
  const cleaned = normalizeSegment(url);
  if (!cleaned) return null;

  console.log({ puesto_default });

  const parts = cleaned.split("/").filter(Boolean);
  const [modSeg, menuSeg, catSeg, ...extra] = parts;
  if (!modSeg) return null;

  for (const pais of menus || []) {
    if (puesto_default) if (puesto_default.cod_pais !== pais.cod_pais) continue;
    // console.log(pais);

    for (const empresa of pais?.empresas || []) {
      if (puesto_default) if (puesto_default.cod_emp !== empresa.cod_empresa) continue;
      // console.log(empresa);

      for (const centroCosto of empresa?.centrosCosto || []) {
        if (puesto_default) if (puesto_default.cod_cc !== centroCosto.cod_cc) continue;
        // console.log(centroCosto);

        const modulo = (centroCosto?.modulos || []).find((m) => normalizeSegment(m?.modulo_ruta) === normalizeSegment(modSeg));
        if (!modulo) continue;
        // console.log(modulo);

        const menu = (modulo?.menus || []).find((mn) => normalizeSegment(mn?.menu_ruta) === normalizeSegment(menuSeg));
        const categoria = menu ? (menu?.categorias || []).find((c) => normalizeSegment(c?.ruta_cat) === normalizeSegment(catSeg)) : null;
        // console.log(menu);
        // console.log(categoria);

        return {
          pais,
          empresa,
          centroCosto,
          modulo,
          menu,
          categoria,
          // URL preservando segmentos extra (IDs, etc.)
          url: `/${[normalizeSegment(modulo?.modulo_ruta), normalizeSegment(menu?.menu_ruta), normalizeSegment(categoria?.ruta_cat), ...extra.filter(Boolean)].filter(Boolean).join("/")}`,
        };
      }
    }
  }

  return null;
};

/**
 * Inicializa todos los "currents" (pais/empresa/cc/modulo/menu/categoría) a partir de `defaultUrl`.
 *
 * Se diseñó para correr **solo una vez después del login**.
 * Si no se puede resolver el contexto, no hace nada y devuelve `null`.
 */
export const initCurrentsFromDefaultUrl = () => (dispatch, getState) => {
  const { defaultUrl } = getState().auth;
  const { menus } = getState().menu;
  const { json } = getState().auth;
  const { puesto_default } = json?.configuracion || {};

  if (!defaultUrl || defaultUrl === "/" || defaultUrl === "") return null;

  const ctx = findContextByUrl(menus, defaultUrl, puesto_default);
  if (!ctx) return null;

  // Setear TODO el contexto. En primer login queremos forzar coherencia con la ruta default.
  dispatch(setCurrentPais(ctx.pais || null));
  dispatch(setCurrentEmpresa(ctx.empresa || null));
  dispatch(setCurrentCentroCosto(ctx.centroCosto || null));

  dispatch(setCurrentModulo({ modulo: ctx.modulo || null }));
  dispatch(setCurrentMenu({ menu: ctx.menu || null }));
  dispatch(setCurrentCategoria({ categoria: ctx.categoria || null }));

  if (ctx.pais && ctx.empresa && ctx.centroCosto) dispatch(setDashboardAccessGranted(true));

  return ctx.url || defaultUrl;
};

export const redirectToUrl =
  (aplicarParaRedirigir = true, url_) =>
  (dispatch, getState) => {
    const { defaultUrl, json } = getState().auth;
    const { menus, currentPais, currentEmpresa, currentCentroCosto, currentModulo, currentMenu, currentCategoria } = getState().menu;
    let fullUrl = url_ || defaultUrl;

    // Solo aplicamos el puesto_default (pais/empresa/cc) si el usuario tiene una ruta por defecto.
    // Si no tiene `defaultUrl`, deben quedar en null hasta que el usuario los seleccione.
    const hasDefaultUrl = !!(defaultUrl && defaultUrl !== "/" && defaultUrl !== "");
    const hasCustomUrl = !!url_;

    const permisos_default = json?.configuracion?.puesto_default;
    const shouldApplyPuestoDefault = hasDefaultUrl && !!fullUrl && fullUrl !== "/";
    if (!fullUrl || fullUrl === "" || fullUrl === "/") {
      dispatch(removeCurrentCategoria());
      dispatch(removeCurrentModulo());
      dispatch(removeCurrentMenu());
      return fullUrl || "/";
    }

    // Caso importante: cuando recargamos una URL específica (ej. /modulo/menu/...)
    // y NO hay puesto_default aplicable, debemos respetar la ruta actual
    // y NO forzar redirecciones a "/" o a otra ruta.
    if (hasCustomUrl && (!permisos_default || !shouldApplyPuestoDefault)) {
      return fullUrl;
    }

    const urlParts = fullUrl?.split("/") || [];

    // Resolver "contexto" (pais/empresa/cc). Solo seteamos por defecto si el usuario tiene ruta default.
    let resolvedPais = currentPais;
    let resolvedEmpresa = currentEmpresa;
    let resolvedCentroCosto = currentCentroCosto;

    if (permisos_default && shouldApplyPuestoDefault) {
      // Resolver según `puesto_default` dentro del menú ya transformado (array `menus`).
      resolvedPais = permisos_default.cod_pais ? menus.find((p) => p.cod_pais === permisos_default.cod_pais) : currentPais;
      resolvedEmpresa = resolvedPais && permisos_default.cod_emp ? resolvedPais.empresas.find((e) => e.cod_empresa === permisos_default.cod_emp) : currentEmpresa;
      resolvedCentroCosto = resolvedEmpresa && permisos_default.cod_cc ? resolvedEmpresa.centrosCosto.find((c) => c.cod_cc === permisos_default.cod_cc) : currentCentroCosto;

      if (!currentPais && resolvedPais) dispatch(setCurrentPais(resolvedPais));
      if (!currentEmpresa && resolvedEmpresa) dispatch(setCurrentEmpresa(resolvedEmpresa));
      if (!currentCentroCosto && resolvedCentroCosto) dispatch(setCurrentCentroCosto(resolvedCentroCosto));
    }

    // Encontrar modulo/menu/categoria usando segmentos base (aunque no apliquemos puesto_default).
    const baseIndex = 1; // Primer segmento es [0] en array sin partes vacías
    const modulo = resolvedCentroCosto?.modulos?.find((m) => m.modulo_ruta.replace("/", "") === (urlParts[baseIndex] || ""));
    const menu = modulo?.menus?.find((m) => m.cod_cc === (resolvedCentroCosto?.cod_cc ?? currentCentroCosto?.cod_cc) && m.menu_ruta.replace("/", "") === (urlParts[baseIndex + 1] || ""));
    const categoria = menu?.categorias?.find((c) => c.ruta_cat.replace("/", "") === (urlParts[baseIndex + 2] || ""));

    if (aplicarParaRedirigir) {
      /**
       * Construye una URL preservando “segmentos extra”:
       * ejemplo: /modulo/menu/categoria/123 -> se mantiene el "/123".
       *
       * También setea el currentModulo/currentMenu/currentCategoria si aún no existen.
       */
      // 1. Construir la parte BASE de la URL (modulo/menu/categoria)
      let newBaseUrl = "";
      if (!currentModulo && modulo) {
        dispatch(setCurrentModulo({ modulo }));
        newBaseUrl += `/${modulo.modulo_ruta.replace("/", "")}`;
      }
      if (!currentMenu && menu) {
        dispatch(setCurrentMenu({ menu }));
        newBaseUrl += `/${menu.menu_ruta.replace("/", "")}`;
      }
      if (!currentCategoria && categoria) {
        dispatch(setCurrentCategoria({ categoria }));
        newBaseUrl += `/${categoria.ruta_cat.replace("/", "")}`;
      }

      // 2. Preservar segmentos adicionales (ej: IDs)
      const extraSegments = urlParts.slice(baseIndex + 3).join("/");
      const preservedUrl = `${newBaseUrl}${extraSegments ? `/${extraSegments}` : ""}`;

      // 3. Usar la URL completa preservada
      fullUrl = preservedUrl || fullUrl;
      return fullUrl;
    }
    // console.log("Redirecting to:", fullUrl);
    return fullUrl;
  };
export const redirectToUserHome = redirectToUrl;
export const getCurrentMenusBasadosEnRuta = () => (dispatch) => {};
