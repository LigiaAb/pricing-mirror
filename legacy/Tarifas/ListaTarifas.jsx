import { useState } from "react";
import { Box } from "@mui/material";
import TablaTarifas from "../../views/Tarifas/TablaTarifas";
import FormularioComponent from "../../components/Formulario/FormularioComponent";
import tarifasDummy, { paises, tiposTransporte, tiposProductos } from "../../database_dummy/tarifas";
import { setQuarterWithOptions } from "date-fns/fp";

const IDS_TIPOS_TRANSPORTE = {
  TERRESTRE: 1,
  AEREO: 2,
  MARITIMO: 3,
};

const tiposEmbarquePorTipoTransporte = {
  [IDS_TIPOS_TRANSPORTE.TERRESTRE]: [
    { value: 1, label: "LCL" },
    { value: 2, label: "FCL" },
  ],
  [IDS_TIPOS_TRANSPORTE.AEREO]: [
    { value: 3, label: "Consolidado" },
    { value: 4, label: "Directo" },
  ],
  [IDS_TIPOS_TRANSPORTE.MARITIMO]: [
    { value: 5, label: "LCL" },
    { value: 6, label: "FCL" },
  ],
};

const ListaTarifas = () => {
  const [data, setData] = useState({
    origen: null,
    destino: null,
    tipoProducto: null,
    comodity: null,
    tipoTransporte: null,
    tipoEmbarque: null,
  });

  const [tarifas, setTarifas] = useState(tarifasDummy);
  const [tarifasFiltradas, setTarifasFiltradas] = useState(tarifasDummy);
  const [tiposEmbarque, setTiposEmbarque] = useState([]);

  const inputs = [
    {
      id: "origen",
      label: "Origen",
      val: data.origen || null,
      tipo: "select",
      readonly: false,
      options: paises,
    },
    {
      id: "destino",
      label: "Destino",
      val: data.destino || null,
      tipo: "select",
      readonly: false,
      options: paises,
    },
    {
      id: "tipoProducto",
      label: "Tipo de Producto",
      val: data.tipoProducto || null,
      tipo: "select",
      readonly: false,
      options: tiposProductos,
    },
    {
      id: "comodity",
      label: "Comodity",
      val: null,
      tipo: "select",
      readonly: true,
      options: [],
    },
    {
      id: "tipoTransporte",
      label: "Tipo de Transporte",
      tipo: "radio",
      options: tiposTransporte,
    },
    {
      id: "tipoEmbarque",
      label: "Tipo de Embarque",
      tipo: "radio",
      options: tiposEmbarque,
    },
  ];

  const handleChangeInput = ({ id: inputId, val: nuevoValor }) => {
    setData((prev) => ({
      ...prev,
      [inputId]: nuevoValor,
    }));

    if (inputId === "tipoTransporte") {
      setTiposEmbarque(tiposEmbarquePorTipoTransporte[nuevoValor]);
      setData((prev) => ({ ...prev, tipoEmbarque: null }));
    }
  };

  const handleObtenerTarifas = () => {
    const tarifasFiltradas = tarifas.filter((tarifa) => {
      return (
        tarifa.origen === data.origen.label &&
        tarifa.destino === data.destino.label &&
        tarifa.tipo_producto === data.tipoProducto.label &&
        tarifa.tipo_transporte === tiposTransporte.find((tt) => tt.value === parseInt(data.tipoTransporte)).label &&
        tarifa.tipo_embarque === tiposEmbarque.find((te) => te.value === parseInt(data.tipoEmbarque)).label
      );
    });
    setTarifasFiltradas(tarifasFiltradas);
  };

  return (
    <Box display="flex" flexDirection="column" gap={2}>
      <FormularioComponent
        inputs={inputs}
        botones={{
          agregar: {
            visible: false,
          },
          buscar: {
            visible: true,
            texto: "buscar",
            onClick: handleObtenerTarifas,
          },
        }}
        onInput={handleChangeInput}
      />
      <TablaTarifas tarifas={tarifasFiltradas} />
    </Box>
  );
};

export default ListaTarifas;
