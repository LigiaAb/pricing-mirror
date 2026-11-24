import React, { useEffect, useState } from "react";
import { Box, Grid, Icon } from "@mui/material";
import propTypes from "prop-types";
import { useSelector } from "react-redux";

export const CardCampana = (props) => {
  const { themeMode } = useSelector((state) => state.theme);
  const { campana, catalogos, onClick } = props;
  const { paises = [], tipos = [], empresas = [], cencos = [] } = catalogos;
  const [data, setData] = useState(null);

  useEffect(() => {
    const empresa = empresas?.find((empresa) => empresa.cod_empresa == campana?.cod_emp);
    const cenco = cencos?.find((cenco) => cenco.cod_cc == campana?.cod_cc);
    // const pais_origen = paises?.find((pais) => pais.cod_pais == campana?.pais_origen)
    // const pais_destino = paises?.find((pais) => pais.cod_pais == campana?.pais_destino)
    const tipo_transporte = tipos?.find((tipo) => tipo.cod_tipo == campana?.tipo_transporte);
    const tipo_entidad = tipos?.find((tipo) => tipo.cod_tipo == campana?.tipo_entidad);
    const tipo_actividad = tipos?.find((tipo) => tipo.cod_tipo == campana?.tipo_actividad);
    const tipo_asignacion = tipos?.find((tipo) => tipo.cod_tipo == campana?.tipo_asignacion);
    setData({
      ...campana,
      empresa: empresa?.nombre_emp,
      cenco: cenco?.nombre_cc,
      tipo_entidad_desc: tipo_entidad?.nom_tipo,
      tipo_transporte_desc: tipo_transporte?.nom_tipo,
      pais_origen: campana?.pais_origen ? JSON.parse(campana?.pais_origen) : [],
      pais_destino: campana?.pais_destino ? JSON.parse(campana?.pais_destino) : [],
      tipo_actividad_desc: tipo_actividad?.nom_tipo,
      tipo_asignacion_desc: tipo_asignacion?.nom_tipo,
    });
  }, [campana]);

  return (
    <Grid
      container
      onClick={onClick}
      sx={{
        display: "flex",
        justifyContent: "left",
        alignItems: "center",
        bgcolor: themeMode === "dark" ? "background.50" : "background.900",
        borderRadius: 2,
        borderColor: themeMode === "dark" ? "background.100" : "background.700",
        borderWidth: 1,
        boxShadow: "2px 2px 5px 2px rgba(0,0,0,0.1)",
        pb: 1,
        pt: 3,
        px: 1,
        mb: 1,
        mt: 2,
      }}
    >
      <Grid item sx={{ pl: 2, pb: 2 }} size={{ xs: 12, md: 12 }}>
        <Box fontSize="1.3rem" sx={{ display: "inline-flex", alignItems: "center" }}>
          {/* <Icon className="c-exclamacion" sx={{mr: 2}}/> */}
          {campana?.descripcion || ""}
        </Box>
      </Grid>
      <Grid item sx={{ pl: 2, pb: 2 }} size={{ xs: 12, md: 6 }}>
        <Box fontSize="1.2rem" sx={{ display: "inline-flex", alignItems: "center" }}>
          <Icon className="c-calendario1" sx={{ mr: 2 }} /> Fecha de inicio: {new Date(data?.fecha_inicio).toLocaleDateString() || ""}
        </Box>
      </Grid>
      <Grid item sx={{ pl: 2, pb: 2 }} size={{ xs: 12, md: 6 }}>
        <Box fontSize="1.2rem" sx={{ display: "inline-flex", alignItems: "center" }}>
          <Icon className="c-calendario1" sx={{ mr: 2 }} /> Fecha de finalización: {data?.fecha_fin ? new Date(data?.fecha_fin).toLocaleDateString() : "-"}
        </Box>
      </Grid>
      <Grid item sx={{ pl: 2, pb: 2 }} size={{ xs: 12, md: 6 }}>
        <Box fontSize="1.2rem" sx={{ display: "inline-flex", alignItems: "center" }}>
          <Icon className="c-empresa" sx={{ mr: 2 }} /> Empresa: {data?.empresa || ""}
        </Box>
      </Grid>
      <Grid item sx={{ pl: 2, pb: 2 }} size={{ xs: 12, md: 6 }}>
        <Box fontSize="1.2rem" sx={{ display: "inline-flex", alignItems: "center" }}>
          <Icon className="c-bodega" sx={{ mr: 2 }} /> Centro de Costo: {data?.cenco || ""}
        </Box>
      </Grid>
      {data?.pais_origen && data?.pais_origen.length > 0 && (
        <Grid item sx={{ pl: 2, pb: 2 }} size={{ xs: 12, md: 6 }}>
          <Box fontSize="1.2rem" sx={{ display: "inline-flex", alignItems: "center" }}>
            <Icon className="c-mundo" sx={{ mr: 2 }} /> Pais(es) de Origen: {data?.pais_origen.map((pais) => pais.PAIS_NOMBRE).join(", ")}
          </Box>
        </Grid>
      )}
      {data?.pais_destino && data?.pais_destino.length > 0 && (
        <Grid item sx={{ pl: 2, pb: 2 }} size={{ xs: 12, md: 6 }}>
          <Box fontSize="1.2rem" sx={{ display: "inline-flex", alignItems: "center" }}>
            <Icon className="c-mundo" sx={{ mr: 2 }} /> Pais(es) de Destino: {data?.pais_destino.map((pais) => pais.PAIS_NOMBRE).join(", ")}
          </Box>
        </Grid>
      )}

      <Grid item sx={{ pl: 2, pb: 2 }} size={{ xs: 12, md: 6 }}>
        <Box fontSize="1.2rem" sx={{ display: "inline-flex", alignItems: "center" }}>
          <Icon className="c-camion" sx={{ mr: 2 }} /> Tipo de transporte: {data?.tipo_transporte_desc || ""}
        </Box>
      </Grid>
      <Grid item sx={{ pl: 2, pb: 2 }} size={{ xs: 12, md: 6 }}>
        <Box fontSize="1.2rem" sx={{ display: "inline-flex", alignItems: "center" }}>
          <Icon className="c-calendario-actividad" sx={{ mr: 2 }} /> Tipo de actividad: {data?.tipo_actividad_desc || ""}
        </Box>
      </Grid>
      <Grid item sx={{ pl: 2, pb: 2 }} size={{ xs: 12, md: 6 }}>
        <Box fontSize="1.2rem" sx={{ display: "inline-flex", alignItems: "center" }}>
          <Icon className="c-asignacion" sx={{ mr: 2 }} /> Tipo de asignacion: {data?.tipo_asignacion_desc || ""}
        </Box>
      </Grid>
    </Grid>
  );
};

CardCampana.propTypes = {
  // cliente: propTypes.shape({
  //     entidad_nombre: propTypes.string,
  //     pais: propTypes.string,
  //     ciudad: propTypes.string,
  //     industria: propTypes.string,
  //     tipo: propTypes.string,
  //     estado: propTypes.string
  // }),
  onClick: propTypes.func,
};
