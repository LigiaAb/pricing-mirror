import React from "react";
import PropTypes from "prop-types";
import useCatalogosCotizacion from "../Cotizaciones/hooks/useCatalogosCotizacion";
import TablaEditableComponent from "@/components/Tabla/TablaEditableComponent";
import { api } from "@/api";

const MetodoEntidad = ({ metodo }) => {
  const { isLoading, fetchOptionsClientes, catalogos: catalogosProcesados } = useCatalogosCotizacion();
  const [lista, setLista] = React.useState([]);

  const consultar_entidades_metodo = React.useCallback(
    async () =>
      await api.get("api/appweb/lista-tarifa-entidad", { params: { cod_estado: 1, cod_metodo: metodo.cod_metodo } }).then(({ data }) => {
        setLista(data.data);
        // setListaConsultada(data.data.map(formatearFilaTabla));
      }),
    [metodo.cod_metodo],
  );

  React.useEffect(() => {
    consultar_entidades_metodo();
  }, [consultar_entidades_metodo]);

  const listaProcesada = React.useMemo(() => {
    return lista.map((i) => ({
      ...i,
      entidad: {
        ...catalogosProcesados.clientes.find((e) => e.value === i.entidad_id),
        label: `${i.nombre_cliente}`,
      },
    }));
  }, [lista, catalogosProcesados.clientes]);

  const clientesFiltrados = React.useMemo(() => {
    const entidadesAsignadas = lista.map((i) => i.entidad_id);
    return catalogosProcesados.clientes.filter((e) => !entidadesAsignadas.includes(e.entidad_id));
  }, [catalogosProcesados.clientes, lista]);

  const encabezados = React.useMemo(
    () => [
      // { id: "cod_tarifa_entidad", label: "Código Entidad", editable: false },
      // { id:'cod_metodo',label: "Codigo de metodo" },
      {
        id: "entidad",
        label: "Entidad",
        editable: true,
        tipo: "select",
        options: clientesFiltrados,
        fetchOptions: fetchOptionsClientes,
        // actions: [{ nombre: "add", icono: "c-suma", onClick: () => {} }],
      },
      // { id:'',label: "Nombre Método" },
    ],
    [fetchOptionsClientes, clientesFiltrados],
  );

  const handleAddRow = React.useCallback(
    async (id, row) => {
      await api.post("api/appweb/insertar-tarifa-entidad", { ...row, entidad_id: row.entidad?.value }).then(() => {
        consultar_entidades_metodo();
      });
    },
    [consultar_entidades_metodo],
  );

  const handleDeleteRow = React.useCallback(
    async (id, row) => {
      await api.post("api/appweb/eliminar-tarifa-entidad", { ...row, entidad_id: row.entidad?.value }).then(() => {
        consultar_entidades_metodo();
      });
    },
    [consultar_entidades_metodo],
  );

  return (
    <TablaEditableComponent
      const
      objetoBase={{ cod_tarifa_entidad: null, cliente: null, cod_metodo: metodo.cod_metodo, entidad_id: null, nombre_cliente: null, cod_estado: null }}
      data={listaProcesada}
      encabezados={encabezados}
      acciones={{ add: true, delete: true }}
      onRowAdded={handleAddRow}
      onRowDeleted={handleDeleteRow}
      shadow=" "
    />
  );
  // return (
  //   <pre>
  //     {JSON.stringify(
  //       clientesFiltrados.filter((i, ind) => ind < 10),
  //       null,
  //       2,
  //     )}
  //   </pre>
  // );
};

MetodoEntidad.propTypes = {
  metodo: PropTypes.object.isRequired,
};

export default MetodoEntidad;
