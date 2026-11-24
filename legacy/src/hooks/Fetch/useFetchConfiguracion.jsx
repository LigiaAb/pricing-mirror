import { api } from "../../api";
import useCustomQuery from "./useCustomQuery";
import { createDataHook } from "./useFunctions";
// Hook para obtener menus
export const useFetchMenus = createDataHook("menus", `/api/appweb/lista-menu`, (m) => ({ ...m, label: m.nom_menu, value: m.cod_menu }));
// Hook para obtener categoria menus
export const useFetchCategoriaMenus = createDataHook(["categoria-menus"], "/api/appweb/lista-categoria-menu", (m) => ({ ...m, label: m.nom_cat, value: m.cod_categoria }));
// Hook para obtener categorias
export const useFetchCategorias = createDataHook(["categorias"], "/api/appweb/lista-categoria", (i) => ({ ...i, label: i.nom_cat, value: i.cod_categoria }));
// Hook para obtener roles
export const useFetchModulos = createDataHook(["modulos"], "/api/appweb/listamodulo", (i) => ({ ...i, label: i.nom_modulo, value: i.cod_modulo }));
// Hook para obtener roles Menu Categoria Opcion Accion
export const useFetchRolMenuCatOpAcc = createDataHook(["rol-menu-cat-opc-acc"], "/api/appweb/lista-rol-menu-cat-opc-acc");
// Hook para obtener Acciones
export const useFetchAcciones = createDataHook(["acciones"], "/api/appweb/lista-accion");
// Hook para obtener Opciones
export const useFetchOpciones = createDataHook(["opciones"], "/api/appweb/lista-opcion");
// Hook para obtener Opciones
export const useFetchOpcionesAcciones = createDataHook(["opciones-accion"], "/api/appweb/lista-opcion-accion");

export const useFetchEmpUsuPuesto = createDataHook(["empleado-usuario-puesto"], "/api/appweb/listaemp-usu-puesto", (i) => ({ ...i, nombre_completo: `${i.nom_empleado} ${i.apellido_emp}` }));

export const useFetchPuestos = createDataHook(["puestos"], "/api/appweb/lista-puesto", (i) => i);

export const useFetchEmpleados = createDataHook(["empleados"], "/api/appweb/listaemp-usu-puesto", (i) => i);

export const useFetchJsonUsuario = createDataHook(["json_usuario_actual"], "/api/appweb/get-json-usuario", null);
