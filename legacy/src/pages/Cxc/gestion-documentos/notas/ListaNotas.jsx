import React, { useMemo, useState } from "react";
import { Box, Grid, Autocomplete, TextField } from "@mui/material";
import TablaEditableMod from "../../../../components/bpm/tablas/tablaEditableMod";
import {
  useFetchPaises,
  useFetchEmpresas,
  useCentrosCostoPorEmpresa,
  useFetchTipoDocumentoCentroCosto,
  useFetchSerieTipoDocumentoCentroCosto,
  useFetchDocumentoCobroExterno,
} from "../../../../hooks/Bpm";

const ListaNotas = () => {
  const [pais, setPais] = useState(null);
  const [empresa, setEmpresa] = useState(null);
  const [centroCosto, setCentroCosto] = useState(null);
  const [tipoDocumento, setTipoDocumento] = useState(null);
  const [serie, setSerie] = useState(null);

  const { data: paises = [], isLoading: loadingPaises } = useFetchPaises({}, { allowedCountries: [1001, 1005, 1002] });
  const { data: empresas = [], isLoading: loadingEmpresas } = useFetchEmpresas();
  const { data: centrosCosto = [], isLoading: loadingCC } = useCentrosCostoPorEmpresa({ cod_empresa: empresa?.value });
  const { data: tiposDocumento = [], isLoading: loadingTiposDocumento } = useFetchTipoDocumentoCentroCosto({
    cod_empresa: empresa?.value,
    cod_cc: centroCosto?.value,
  });

  const { data: series = [], isLoading: loadingSeries } = useFetchSerieTipoDocumentoCentroCosto({
    cod_empresa: empresa?.value,
    cod_cc: centroCosto?.value,
    tipoDocumentoId: tipoDocumento?.value,
  });

  const { data: lista = [] } = useFetchDocumentoCobroExterno({
    cod_empresa_cropa: empresa?.codCropa,
    cod_cc_cropa: centroCosto?.codCropa,
    tipoDocumentoCropa: tipoDocumento?.codCropa,
    serie: serie?.label,
  });

  const paisesOptions = useMemo(
    () => paises.map((p) => ({ value: p.cod_pais, label: p.nombre_pais })),
    [paises]
  );

  const empresasOptions = useMemo(
    () =>
      empresas
        .filter((e) => !pais?.value || e.paisEmp === pais.value)
        .map((e) => ({ value: e.cod_empresa, label: e.nombre_emp, codCropa: e.codCropa })),
    [empresas, pais]
  );

  const encabezados = [
    { id: "estado", label: "Estado", editable: false },
    { id: "fecha", label: "Fecha", editable: false },
    { id: "cliente", label: "Cliente", editable: false },
    { id: "numero", label: "Número", editable: false },
    { id: "moneda", label: "Moneda", editable: false },
    { id: "concepto", label: "Concepto", editable: false },
    { id: "usuarioSolicita", label: "Usuario Solicita", editable: false },
    //{ id: "tipoDocumento", label: "Tipo de Documento", editable: false },
    //{ id: "serie", label: "Serie", editable: false },
    //{ id: "departamento", label: "Departamento", editable: false },
    //{ id: "empresa", label: "Empresa", editable: false },
  ];

  const handleVer = (id, row) => {
    console.log("Ver nota", id, row);
  };

  return (
    <Box sx={{ p: 1, m: 0 }}>
      <Grid container spacing={2} sx={{ my: 1 }}>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Autocomplete
            options={paisesOptions}
            getOptionLabel={(opt) => opt.label || ""}
            isOptionEqualToValue={(opt, val) => opt.value === val?.value}
            value={pais}
            onChange={(_, val) => {
              setPais(val);
              setEmpresa(null);
              setCentroCosto(null);
            }}
            disabled={loadingPaises}
            loading={loadingPaises}
            size="small"
            fullWidth
            renderInput={(params) => <TextField {...params} label="País" />}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Autocomplete
            options={empresasOptions}
            getOptionLabel={(opt) => opt.label || ""}
            isOptionEqualToValue={(opt, val) => opt.value === val?.value}
            value={empresa}
            onChange={(_, val) => {
              setEmpresa(val);
              setCentroCosto(null);
            }}
            disabled={!pais?.value || loadingEmpresas}
            loading={loadingEmpresas}
            size="small"
            fullWidth
            renderInput={(params) => <TextField {...params} label="Empresa" />}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Autocomplete
            options={centrosCosto || []}
            getOptionLabel={(opt) => opt.label || ""}
            isOptionEqualToValue={(opt, val) => opt.value === val?.value}
            value={centroCosto}
            onChange={(_, val) => {
              setCentroCosto(val);
              setTipoDocumento(null);
            }}
            disabled={!empresa?.value || loadingCC}
            loading={loadingCC}
            size="small"
            fullWidth
            renderInput={(params) => <TextField {...params} label="Centro de Costo" />}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Autocomplete
            options={tiposDocumento}
            getOptionLabel={(opt) => opt.label || ""}
            isOptionEqualToValue={(opt, val) => opt.value === val?.value}
            value={tipoDocumento}
            onChange={(_, val) => {
              setTipoDocumento(val);
              setSerie(null);
            }}
            disabled={!centroCosto?.value || loadingTiposDocumento}
            loading={loadingTiposDocumento}
            size="small"
            fullWidth
            renderInput={(params) => <TextField {...params} label="Tipo de Documento" />}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Autocomplete
            options={series}
            getOptionLabel={(opt) => opt.label || ""}
            isOptionEqualToValue={(opt, val) => opt.value === val?.value}
            value={serie}
            onChange={(_, val) => setSerie(val)}
            disabled={!tipoDocumento?.value || loadingSeries}
            loading={loadingSeries}
            size="small"
            fullWidth
            renderInput={(params) => <TextField {...params} label="Serie" />}
          />
        </Grid>
      </Grid>

      <Box sx={{ p: 1, m: 0, my: 1 }}>
        <TablaEditableMod
          titulo="Notas"
          rowKey="id"
          encabezados={encabezados}
          data={serie?.value ? lista : []}
          acciones={{ view: true }}
          editarEnTabla={false}
          onRowView={handleVer}
          invalidateQueryKeys={[["documento-cobro-externo"]]}
        />
      </Box>
    </Box>
  );
};

export default ListaNotas;
