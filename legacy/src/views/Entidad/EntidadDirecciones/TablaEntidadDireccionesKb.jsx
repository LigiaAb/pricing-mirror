import { api } from "@/api";
import TablaEditableComponent from "@/components/Tabla/TablaEditableComponent";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import useObtenerOpcionesAcciones from "@/hooks/useObtenerOpcionesAcciones";

const TablaEntidadDireccionesKb = ({ entidad_id }) => {
  const [datos, setDatos] = useState([]);
  const permisosBase = { ver: false, editar: false, eliminar: false, guardar: false, agregar: false };
  const { permisosArray } = useObtenerOpcionesAcciones();

  const obtenerDatos = useCallback(async () => {
    try {
      const { data } = await api.get("/api/appweb/lista-direccionKb-oracle", {
        params: { entidad_id },
      });

      const direcciones = Array.isArray(data?.data) ? data.data : Array.isArray(data?.data?.data) ? data.data.data : [];

      setDatos(direcciones);
    } catch (error) {
      setDatos([]);
      console.error(error);
    }
  }, [entidad_id]);

  const eliminarFila = useCallback(
    async (id, row) => {
      await api
        .post("/api/appweb/eliminar-direccionkb-oracle", null, {
          params: {
            entidad_id,
            tipo_dire: row.tipo_dire,
            corre_dire: row.corre_dire,
          },
        })
        .then(() => obtenerDatos())
        .catch((e) => console.error(e));
    },
    [entidad_id, obtenerDatos],
  );

  const obtenerAccionesSegunPermisos = () => {
    let item = permisosArray.find((i) => i.nom_opcion === "Direcciones");
    return {
      ...permisosBase,
      agregar: item?.acciones.some((i) => i.cod_accion === 3),
      ver: item?.acciones.some((i) => i.cod_accion === 1),
      editar: item?.acciones.some((i) => i.cod_accion === 2),
      guardar: item?.acciones.some((i) => i.cod_accion === 2),
      eliminar: item?.acciones.some((i) => i.cod_accion === 5),
      // add:    item?.acciones.some((i) => i.cod_accion === 3),
      // edit:   item?.acciones.some((i) => i.cod_accion === 2),
      // save:   item?.acciones.some((i) => i.cod_accion === 2),
      delete: item?.acciones.some((i) => i.cod_accion === 5),
    };
  };

  const encabezados = useMemo(
    () => [
      { field: "cod_cropa", headerName: "Codigo", editable: false, type: "text" },
      { field: "tipo_dire", headerName: "Tipo", editable: false, type: "text" },
      { field: "corre_dire", headerName: "correlativo", editable: false, type: "text" },
      { field: "dirclie_dir", headerName: "Direccion", editable: false, type: "text" },
    ],
    [],
  );

  return (
    <div>
      <TablaEditableComponent
        data={datos}
        encabezados={encabezados}
        rowKey="corre_dire"
        onRowDeleted={eliminarFila}
        textoAlertaEliminacion={(id, row) => (
          <>
            ¿Está seguro que desea eliminar la dirección <b>{row?.DIRCLIE_DIR || ""}</b>?
          </>
        )}
        acciones={obtenerAccionesSegunPermisos()}
      />
    </div>
  );
};

TablaEntidadDireccionesKb.propTypes = {
  entidad_id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
};

export default TablaEntidadDireccionesKb;
