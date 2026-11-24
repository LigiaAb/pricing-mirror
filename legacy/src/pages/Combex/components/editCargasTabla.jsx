import { Box, Typography, IconButton, Icon, Tooltip } from "@mui/material";
import EditableDataGridComponent from "../../../components/Tabla/EditableDataGridComponent";
import PropTypes from "prop-types";
import { useCoordinacionCargas, useCreateRepesoCarga, useUpdateCoordinacionEstado } from "../../../hooks/Bpm";

const EditcargasTabla = ({ embarque_id, onRepesoSuccess, onRefetch, soloLectura = false }) => {
  const { data = [], isLoading, error, refetch } = useCoordinacionCargas(embarque_id);

  const createRepeso = useCreateRepesoCarga({ embarque_id });
  const updateEstado = useUpdateCoordinacionEstado();

  const handleRowSave = async ({ row }) => {
    try {
      // Primero, ejecutar callback para recalcular (si existe). Si falla, no procede a guardar.
      if (onRepesoSuccess && typeof onRepesoSuccess === 'function') {
        try {
          await onRepesoSuccess(row, row?.embCargaId, { phase: "before" });
        } catch (err) {
          console.error("Recalculo falló, no se guardará el repeso:", err);
          return;
        }
      }

      const payload = {
        emb_carga_id: row?.embCargaId,
        embarque_id: embarque_id,
        repeso: row?.repeso,
      };

      const saveResult = await createRepeso.mutateAsync(payload);
      createRepeso.queryClient.invalidateQueries({
        queryKey: ["coordinacion-cargas", embarque_id],
      });

      // notificar al callback que el repeso se guardó; la actualización del
      // estado de coordinación se gestiona en el componente padre (`RepesoDetalles`)
      // tras el recálculo.
      // Notificar al callback que el repeso se guardó (sin volver a recalcular)
      if (onRepesoSuccess && typeof onRepesoSuccess === 'function') {
        try {
          await onRepesoSuccess(row, row?.embCargaId, { phase: "after", saveResult });
        } catch (err) {
          console.error("Error notificando post-guardado:", err);
        }
      }
    } catch (err) {
      console.error("Error guardando repeso:", err);
    }
  };

  const encabezados = [
    //{ field: "hawb", headerName: "HAWB", width: 90 },
    { field: "descripcionCarga", headerName: "Descripción", width: 280 },
    { field: "peso", headerName: "Peso", width: 90 },
    {
      field: "repeso",
      headerName: "Re-Peso",
      width: 100,
      editable: !soloLectura,
      type: "number",
    },
    { field: "cw", headerName: "CW", width: 90 },
    //{ field: "bultos", headerName: "Bultos", width: 100 },
    //{ field: "volumen", headerName: "Volumen", width: 100 },
    //{ field: "rubroNombre", headerName: "Rubro", width: 150 },
    //{ field: "estadoDescripcion", headerName: "Estado", width: 130 },
    //{ field: "fechaRegistro", headerName: "Fecha Registro", width: 150 },
  ];

  if (isLoading) return <Typography>Cargando...</Typography>;
  if (error) return <Typography>Error al cargar datos</Typography>;

  return (
    <Box sx={{ maxWidth: 650, mx: "auto" }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="h6" gutterBottom sx={{ m: 0 }}>
          Listado de Cargas
        </Typography>
        <Tooltip title="Recargar tabla">
          <IconButton size="small" color="primary" onClick={() => (onRefetch ? onRefetch() : refetch?.())} disabled={isLoading} sx={{ height: 36, width: 36 }}>
            <Icon className="c-actualizar" sx={{ fontSize: 20 }} />
          </IconButton>
        </Tooltip>
      </Box>

      <EditableDataGridComponent
        encabezados={encabezados}
        datos={data}
        idKey="embCargaId"
        acciones={{ editar: !soloLectura, guardar: !soloLectura }}
        onRowSave={soloLectura ? undefined : handleRowSave}
      />
    </Box>
  );
};

EditcargasTabla.propTypes = {
  embarque_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
    .isRequired,
  onRepesoSuccess: PropTypes.func,
  onRefetch: PropTypes.func,
  soloLectura: PropTypes.bool,
};

export default EditcargasTabla;
