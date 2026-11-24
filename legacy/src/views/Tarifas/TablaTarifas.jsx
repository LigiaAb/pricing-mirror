import { useEffect } from "react";
import TablaComponent from "../../components/Tabla/TablaComponent";
import PropTypes from "prop-types";

const TablaTarifas = ({ tarifas }) => {
  const headers = [
    { name: "origen", label: "Origen", campo: "origen" },
    { name: "destino", label: "Destino", campo: "destino" },
    { name: "descripcion", label: "Descripción", campo: "descripcion" },
    { name: "tipo_producto", label: "Tipo de Producto", campo: "tipo_producto" },
    { name: "rubro", label: "Rubro", campo: "rubro" },
    { name: "fecha_inicial", label: "Fecha Inicial", campo: "fecha_inicial" },
    { name: "fecha_final", label: "Fecha Final", campo: "fecha_final" },
    { name: "rango_inicial", label: "Rango Inicial", campo: "rango_inicial" },
    { name: "rango_final", label: "Rango Final", campo: "rango_final" },
    { name: "comodity", label: "Comodity", campo: "comodity" },
    { name: "tipo", label: "Tipo", campo: "tipo" },
    { name: "valor", label: "Valor", campo: "valor" },
    { name: "minimo", label: "Minimo", campo: "minimo" },
    { name: "porcentaje", label: "Porcentaje", campo: "porcentaje" },
    { name: "moneda", label: "Moneda", campo: "moneda" },
    { name: "proveedor", label: "Proveedor", campo: "proveedor" },
  ];

  return <TablaComponent titulo="Tarifas" id="id_tarifa" encabezado={headers} datos={tarifas} />;
};

TablaTarifas.propTypes = {
  tarifas: PropTypes.array.isRequired,
};

export default TablaTarifas;
