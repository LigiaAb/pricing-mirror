import { Box, Typography, CircularProgress } from "@mui/material";
import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import SelectComponent from "../../../components/Formulario/SelectComponent";
import EditableDataGridComponent from "../../../components/Tabla/EditableDataGridComponent";

import {
  useCoordinacionesQuery,
  useCentrosCostoPorEmpresaQuery,
} from "../../../hooks/Combex/coordinacion/useCoordinacion";
import { useFetchEmpresas } from "../../../hooks/Fetch/useFetchCatalog";

const encabezados = [
  { field: "cod_file", headerName: "Código" },
  { field: "estado", headerName: "Estado", campo: "estado" },
  {
    field: "repeso",
    headerName: "Re-Peso",
    width: 100,
    editable: true,
    type: "number",
  },
  { field: "fechaInicio", headerName: "Fecha Inicio", campo: "fechaInicio" },
  { field: "cliente", headerName: "Cliente", campo: "cliente" },
  { field: "responsable", headerName: "Responsable", campo: "responsable" },
  { field: "paisOrigen", headerName: "País Origen", campo: "paisOrigen" },
  { field: "paisDestino", headerName: "País Destino", campo: "paisDestino" },
  { field: "servicio", headerName: "Servicio", campo: "servicio" },
  { field: "observaciones", headerName: "Observaciones", campo: "observaciones" },
];

export default function EditCoordinacionesTabla({ onEdit }) {
  const [empresa, setEmpresa] = useState(null);
  const [centroCosto, setCentroCosto] = useState(null);

  const { data: empresas, isLoading: loadingEmpresas } = useFetchEmpresas();
  const { data: centrosCostoOptions, isLoading: loadingCC } =
    useCentrosCostoPorEmpresaQuery({ cod_empresa: empresa?.value });

  useEffect(() => {
    if (!empresa && (empresas?.length > 0)) {
      const defaultEmpresa = empresas.find((e) => e.value === 1);
      if (defaultEmpresa) setEmpresa(defaultEmpresa);
    }
  }, [empresas, empresa]);

  useEffect(() => {
    if (
      empresa?.value === 1 &&
      (centrosCostoOptions?.length > 0) &&
      !centroCosto
    ) {
      const defaultCC = centrosCostoOptions.find((cc) => cc.value === 16);
      if (defaultCC) setCentroCosto(defaultCC);
    }
  }, [empresa, centrosCostoOptions, centroCosto]);

  const { data, isLoading, error } = useCoordinacionesQuery(
    {
      cod_empresa: empresa?.value,
      cod_cc: centroCosto?.value,
    },
    { enabled: !!empresa?.value && !!centroCosto?.value }
  );

  const datosFiltrados = (data || []).map((row) => ({
    ...row,
    canEdit: true,
    accionesDeTabla: { ...(row.accionesDeTabla || {}), edit: true },
  }));

  let content;
  if (isLoading) {
    content = <CircularProgress />;
  } else if (error) {
    content = <Typography color="error">Error: {error.message}</Typography>;
  } else {
    content = (
      <Box sx={{ width: "100%" }}>
        <EditableDataGridComponent
          encabezados={encabezados}
          datos={datosFiltrados}
          idKey="cod_file"
          titulo="Coordinaciones"
          pagination
          rowsPerPage={10}
          search
          mensajes={{
            noData: "No hay coordinaciones",
            loading: "Cargando coordinaciones...",
          }}
          acciones={{ editar: true, guardar: true }}
        />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Box display="flex" gap={2} mb={4} mt={2}>
        <SelectComponent
          input={{
            label: "Empresa",
            val: empresa,
            options: empresas || [],
            multiple: false,
            placeholder: loadingEmpresas ? "Cargando..." : "Seleccione empresa",
            disabled: loadingEmpresas,
          }}
          onInput={(val) => {
            setEmpresa(val);
            setCentroCosto(null);
          }}
        />
        <SelectComponent
          input={{
            label: "Centro de Costo",
            val: centroCosto,
            options:
              centrosCostoOptions?.map((opt) => ({
                value: opt.value,
                label: opt.label,
              })) || [],
            multiple: false,
            placeholder: loadingCC
              ? "Cargando..."
              : "Seleccione centro de costo",
            disabled: !empresa?.value || loadingCC,
          }}
          onInput={(val) => setCentroCosto(val)}
        />
      </Box>

      {content}
    </Box>
  );
}

EditCoordinacionesTabla.propTypes = {
  onEdit: PropTypes.func,
};
