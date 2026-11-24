import React, { useCallback, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Box, Grid, Icon, IconButton } from "@mui/material";
import EditableDataGridComponent from "../../components/Tabla/EditableDataGridComponent";
import { useEffect } from "react";
import { api } from "../../api";
import { useFetchTipos } from "../../hooks/Fetch/useFetchCatalog";
import TablaEditableComponent from "../../components/Tabla/TablaEditableComponent";

const TablaIndustria = (props) => {
  const [lista, setLista] = useState([]);
  const [listaAProcesar, setListaAProcesar] = useState([]);
  const tiposDeEntidad = useFetchTipos({ tipo_tabla: "INDUSTRIA" });
  const tiposEntidad = useMemo(() => (tiposDeEntidad.data || []).map((i) => ({ ...i, value: i.label[0] })), [tiposDeEntidad.data]);
  const [filaSeleccionada, setFilaSeleccionada] = useState(null);
  const idKey = "cod_industria";

  const encabezados = [
    { field: "cod_industria", headerName: "Código", editable: false, type: "text" },
    { field: "nom_industria_es", headerName: "Nombre ES", editable: true, max: 100, type: "text" },
    { field: "nom_industria_en", headerName: "Nombre EN", editable: true, max: 100, type: "text" },
    {
      field: "tipo",
      headerName: "Tipo",
      editable: true,
      max: 100,
      type: "singleSelect",
      valueOptions: tiposEntidad,
      labelOption: "label",
      valueOption: "value",
    },

    // {
    //   field: "tipo",
    //   headerName: "Tipo",
    //   editable: filaSeleccionada ? filaSeleccionada.row.tipo === null : true,
    //   type: "singleSelect",
    //   valueOptions: tipos.map((i) => ({ ...i, tipo_descripcion: i.nom_tipo })),
    //   labelOption: "tipo_descripcion",
    //   valueOption: "cod_tipo",
    // },
  ];
  const datos = useMemo(() => {
    return listaAProcesar.map((i) => ({
      ...i,
      tipo: tiposEntidad.find((te) => te.value === i.tipo_entidad),
    }));
  }, [listaAProcesar, tiposEntidad]);

  const eliminarFila = useCallback(async ({ cod_industria }) => {
    await api.post("api/appweb/eliminar-industria", { cod_industria });
  }, []);
  const gruardarFila = useCallback(async (row) => {
    console.log(row);
    const { cod_industria, nom_industria_es, nom_industria_en, tipo } = row;
    await api.post("/api/appweb/actualizar-industria", { cod_industria, nom_industria_es, nom_industria_en, tipo_entidad: tipo?.value });
  }, []);
  const agregarFila = useCallback(async ({ cod_industria, nom_industria_es, nom_industria_en, tipo }) => {
    await api.post("api/appweb/insertar-industria", { cod_industria, nom_industria_es, nom_industria_en, tipo_entidad: tipo?.value });
  }, []);

  const consultarLista = useCallback(async () => {
    await api.get("api/appweb/lista-industria", { params: {} }).then((data) => setLista(data.data.data));
  }, []);

  const realizarConsultas = useCallback(async () => {
    await Promise.all([consultarLista()]);
  }, [consultarLista]);

  useEffect(() => {
    realizarConsultas();
  }, [realizarConsultas]);

  useEffect(() => {
    setListaAProcesar(lista);
  }, [lista]);

  return (
    <Box>
      <TablaEditableComponent
        encabezados={encabezados}
        data={datos}
        idKey={idKey}
        acciones={{ add: true, save: true, edit: true, delete: true }}
        columnasAExtender={[2, 3]}
        objetoBase={{ cod_industria: 0, nom_industria_es: "", nom_industria_en: "", tipo_entidad: "C", tipo: { value: "C", label: "CLIENTE" } }}
        onRowUpdated={(id, row) => gruardarFila(row)}
        onRowAdded={(id, row) => agregarFila(row)}
        onRowDeleted={(id, row) => eliminarFila(row)}
      />

      <Grid width={"100%"} direction="row" container>
        {/* <pre>{JSON.stringify(lista, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify(filaSeleccionada, null, 2)}</pre> */}
      </Grid>
    </Box>
  );
};

TablaIndustria.propTypes = {};

export default TablaIndustria;
