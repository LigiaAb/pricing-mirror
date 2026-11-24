import { api, api_no_auth } from "../../../api";
import { setNotificaciones } from "./notificacionSlice";

import NOTIFICACIONES_DUMMY from "/src/database_dummy/notificaciones";

export const getNotificaciones = () => {
  return async (dispatch) => {
    // api_no_auth.get("pg/getQueryPg", { params: { table: "modulo" } }).then(async (data) => {
    //   let modulos = data?.data?.data?.map((i) => ({ ...i, label: i.nombre, url: i.ruta }));
    //   let menus = [];
    //   await api_no_auth.get("pg/getQueryPg", { params: { table: "menu" } }).then((data) => {
    //     menus = data?.data?.data?.map((i) => ({ ...i, label: i.nombre, url: i.ruta }));
    //     let obtenerPadres = buildHierarchy(menus.sort((a, b) => a.titulo.localeCompare(b.titulo)));
    //     dispatch(
    //       setMenus({
    //         menus: modulos.map((modulo) => ({
    //           ...modulo,
    //           menus: obtenerPadres.filter((menu) => menu.id_modulo === modulo.id_modulo),
    //         })),
    //       })
    //     );
    //   });
    // });
    await dispatch(setNotificaciones({ notificaciones: NOTIFICACIONES_DUMMY }));
  };
};
