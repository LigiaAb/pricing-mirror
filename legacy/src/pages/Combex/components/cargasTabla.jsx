import { Box, Typography, IconButton, Icon, Tooltip } from "@mui/material";
import EditableDataGridComponent from "../../../components/Tabla/EditableDataGridComponent";
import LoaderComponent from "../../../components/Loader/LoaderComponent";
import PropTypes from "prop-types";
import { useCoordinacionCargas } from "../../../hooks/Bpm";

export default function CargasTabla({
  embarqueId,
  cargasData: cargasDataProp,
  isLoading: isLoadingProp,
  error: errorProp,
  onView,
  onRefetch,
  useCheck = true,
  useVer = true,
  filasSeleccionadas = [],
  onFilasSeleccionadas = () => { },
  multipleCheck = true,
}) {
  const shouldUseProps = Array.isArray(cargasDataProp);
  const {
    data: cargasDataFromHook,
    isLoading: isLoadingFromHook,
    error: errorFromHook,
    refetch,
  } = useCoordinacionCargas(embarqueId);

  const cargasData = shouldUseProps ? cargasDataProp : cargasDataFromHook;
  const isLoading = shouldUseProps ? !!isLoadingProp : !!isLoadingFromHook;
  const error = shouldUseProps ? errorProp : errorFromHook;

  const columnasCargas = [
    //{ id: "HAWB", field: "501", label: "HAWB", headerName: "HAWB", name: "HAWB", campo: "501" },
    { id: "estadoDescripcion", field: "estadoDescripcion", label: "Estado", headerName: "Estado", name: "estadoDescripcion", campo: "estadoDescripcion" },
    {
      id: "descripcionCarga",
      field: "descripcionCarga",
      label: "Descripción",
      headerName: "Descripción",
      name: "descripcionCarga",
      campo: "descripcionCarga",
    },
    { id: "bultos", field: "bultos", label: "Bultos", headerName: "Bultos", name: "bultos", campo: "bultos" },
    { id: "peso", field: "peso", label: "Peso", headerName: "Peso", name: "peso", campo: "peso" },
    { id: "repeso", field: "repeso", label: "RePeso", headerName: "RePeso", name: "repeso", campo: "repeso" },
    { id: "tipoDescripcion", field: "tipoDescripcion", label: "Unidad", headerName: "Unidad", name: "tipoDescripcion", campo: "tipoDescripcion" },
    { id: "volumen", field: "volumen", label: "Volumen", headerName: "Volumen", name: "volumen", campo: "volumen" },
    { id: "rubroNombre", field: "rubroNombre", label: "Rubro", headerName: "Rubro", name: "rubroNombre", campo: "rubroNombre" },
    { id: "valor", field: "valor", label: "Valor ($)", headerName: "Valor ($)", name: "valor", campo: "valor" },
  ];

  const datosTabla = Array.isArray(cargasData)
    ? cargasData.map((item) => {
      const view = !!useVer;
      return {
        ...item,
        url: "",
        accionesDeFila: {
          ...item.accionesDeFila,
          view,
        },
        canView: view,
        canEdit: false,
        canDelete: false,
      };
    })
    : [];

  const handleRowClick = (rowData) => {
    if (useCheck) {
      const id = rowData.embCargaId;
      let nuevaSeleccion;
      if (multipleCheck) {
        nuevaSeleccion = filasSeleccionadas.includes(id)
          ? filasSeleccionadas.filter((fid) => fid !== id)
          : [...filasSeleccionadas, id];
      } else {
        nuevaSeleccion = filasSeleccionadas.includes(id) ? [] : [id];
      }
      onFilasSeleccionadas(nuevaSeleccion);
      if (onView) onView(rowData?.content ?? rowData);
    }
  };

  let content = null;
  if (error) {
    content = (
      <Typography color="error" variant="body2">
        Error cargando datos: {error.message}
      </Typography>
    );
  } else if (isLoading) {
    content = <LoaderComponent open={true} />;
  } else if (datosTabla.length === 0) {
    content = (
      <Typography variant="body2" color="text.secondary">
        No hay cargas registradas para esta coordinación
      </Typography>
    );
  } else {
    content = (
      <EditableDataGridComponent
        idKey="embCargaId"
        encabezados={columnasCargas}
        datos={datosTabla}
        filaSeleccionada={handleRowClick}
        acciones={{ ver: useVer, editar: false, eliminar: false, guardar: false, agregar: false }}
      />
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
        <Tooltip title="Recargar tabla">
          <IconButton size="small" color="primary" onClick={() => (onRefetch ? onRefetch() : refetch?.())} disabled={isLoading} sx={{ height: 36, width: 36 }}>
            <Icon className="c-actualizar" sx={{ fontSize: 20 }} />
          </IconButton>
        </Tooltip>
      </Box>

      {content}
    </Box>
  );
}

CargasTabla.propTypes = {
  embarqueId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  cargasData: PropTypes.array,
  isLoading: PropTypes.bool,
  error: PropTypes.object,
  onView: PropTypes.func,
  filasSeleccionadas: PropTypes.array,
  onFilasSeleccionadas: PropTypes.func,
  useCheck: PropTypes.bool,
  useVer: PropTypes.bool,
  onRefetch: PropTypes.func,
  multipleCheck: PropTypes.bool,
};
