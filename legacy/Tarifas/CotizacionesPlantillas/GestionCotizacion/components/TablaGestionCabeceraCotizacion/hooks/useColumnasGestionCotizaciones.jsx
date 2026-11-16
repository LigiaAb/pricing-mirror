const useColumnasGestionCotizaciones = () => {
  const columnas = [
    {
      label: "#",
      campo: "cod_tarifaplantilla",
      name: "cod_tarifaplantilla",
    },
    // {
    //   label: "Empresa",
    //   campo: "empresa",
    //   name: "empresa",
    // },
    // {
    //   label: "Centro de Costo",
    //   campo: "centroCosto",
    //   name: "centroCosto",
    // },
    {
      label: "Cliente",
      campo: "entidad",
      name: "entidad",
      formato: (id, d) => (d["entidad"] ? ((d["entidad"] || "").length > 20 ? (d["entidad"] || "").substr(0, 20) + "..." : d["entidad"]) : ""),
      tooltip: (id, d) => ((d["entidad"] || "").length > 20 ? d["entidad"] : undefined),
      tooltip_properties: { color: "black.main", borderColor: "black.main", bgcolor: "background.main_70" },
      multilinea: false,
    },
    {
      label: "Tipo de Transporte",
      campo: "tipoTransporte",
      name: "tipoTransporte",
    },
    {
      label: "Tipo de Servicio",
      campo: "tipoServicio",
      name: "tipoServicio",
    },
    {
      label: "Tipo de Carga",
      campo: "tipoCarga",
      name: "tipoCarga",
    },
    {
      label: "Tipo de pago",
      campo: "tipoPago",
      name: "tipoPago",
    },
    {
      label: "Clasificación de Carga",
      campo: "clasificacionCarga",
      name: "clasificacionCarga",
    },
    {
      label: "Estado",
      campo: "estado",
      name: "estado",
    },
  ];

  return columnas;
};

export default useColumnasGestionCotizaciones;
