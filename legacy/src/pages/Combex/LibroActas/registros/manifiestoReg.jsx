import { useState, useMemo } from "react";
import { Box } from "@mui/material";
import PropTypes from "prop-types";
import { useQueryClient } from "@tanstack/react-query";
import FormularioComponent from "../../../../components/Formulario/FormularioComponent";
import ActionAlertComponent from "../../../../components/Dialog/ActionAlertComponent";
import TablaComponent from "../../../../components/Tabla/TablaComponent";
import {
  useGuardarArchivo,
  useCreateCoordinacionDocumento,
  useUpdateCoordinacionDocumento,
  useDeleteCoordinacionDocumento,
  useRecuperarArchivo,
  useCoordinacionDocumentos,
} from "../../../../hooks/Bpm";

const ManifiestoRegistro = ({ coordinacion }) => {
  const queryClient = useQueryClient();
  const guardarArchivo = useGuardarArchivo();
  const createCoordinacionDocumento = useCreateCoordinacionDocumento();
  const updateCoordinacionDocumento = useUpdateCoordinacionDocumento();
  const deleteCoordinacionDocumento = useDeleteCoordinacionDocumento();
  const { data: documentos = [], isLoading: isLoadingDocumentos } =
    useCoordinacionDocumentos({ embarque_id: coordinacion.embarqueId });
  const { mutateAsync: recuperarArchivo } = useRecuperarArchivo();

  const manifestosCombex = useMemo(() => {
    const filtrados = documentos.filter((doc) => {
      const tipoDesc = doc.tipoDescripcion.toUpperCase();
      return tipoDesc.includes("MANIFIESTO COMBEX");
    });
    return filtrados;
  }, [documentos]);
  const [manifiestoFile, setManifiestoFile] = useState(null);
  const [descripcion, setDescripcion] = useState("");
  const [modoEdicion, setModoEdicion] = useState(false);
  const [documentoEditando, setDocumentoEditando] = useState(null);
  const [descripcionEdit, setDescripcionEdit] = useState("");
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [documentoToDelete, setDocumentoToDelete] = useState(null);

  const handleGuardar = async () => {
    try {
      if (!manifiestoFile) {
        alert("Por favor selecciona un archivo");
        return;
      }

      const ruta = await guardarArchivo.mutateAsync({
        archivo: manifiestoFile,
        tipo_documento: "coordinaciones",
        embarque_id: coordinacion.embarqueId,
        cod_file: coordinacion.codFile || coordinacion.cod_file,
        descripcion: descripcion,
      });

      await createCoordinacionDocumento.mutateAsync({
        embarque_id: coordinacion.embarqueId,
        cod_tipo_documento: 228,
        ubicacion: "coordinaciones",
        url_archivo: ruta,
        descripcion: descripcion || "Manifiesto sellado Combex",
        estado_cod: 1,
      });

      queryClient.invalidateQueries([
        "coordinacion-documentos",
        coordinacion.embarqueId,
      ]);

      setManifiestoFile(null);
      setDescripcion("");
    } catch (err) {
      console.error("Error al guardar manifiesto:", err);
    }
  };

  const handleDescargar = async (documento) => {
    try {
      const urlArchivo =
        documento.urlArchivo || documento.URL_ARCHIVO || documento.url;
      if (!urlArchivo) {
        throw new Error("URL del archivo no disponible");
      }

      const blob = await recuperarArchivo({ ruta_archivo: urlArchivo });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `manifiesto_combex_${documento.documentoIdCoord || "doc"}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error al descargar archivo:", err);
    }
  };

  const handleVer = async (documento) => {
    try {
      const urlArchivo =
        documento.urlArchivo || documento.URL_ARCHIVO || documento.url;
      if (!urlArchivo) {
        throw new Error("URL del archivo no disponible");
      }

      const blob = await recuperarArchivo({ ruta_archivo: urlArchivo });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");

      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (err) {
      console.error("Error al visualizar archivo:", err);
    }
  };

  const handleEditar = (documento) => {
    setDocumentoEditando(documento);
    setDescripcionEdit(documento.descripcion || "");
    setModoEdicion(true);
  };

  const handleCancelarEdicion = () => {
    setModoEdicion(false);
    setDocumentoEditando(null);
    setDescripcionEdit("");
  };

  const handleGuardarEdicion = async () => {
    try {
      if (!documentoEditando) return;

      await updateCoordinacionDocumento.mutateAsync({
        documento_id_coord: documentoEditando.documentoIdCoord,
        embarque_id: coordinacion.embarqueId,
        cod_tipo_documento: documentoEditando.tipoIdDocumento || 228,
        ubicacion: documentoEditando.ubicacion || "coordinaciones",
        url_archivo: documentoEditando.urlArchivo,
        descripcion: descripcionEdit,
        estado_cod: documentoEditando.estadoId || 1,
      });

      queryClient.invalidateQueries([
        "coordinacion-documentos",
        coordinacion.embarqueId,
      ]);

      handleCancelarEdicion();
    } catch (err) {
      console.error("Error al actualizar documento:", err);
    }
  };

  const handleEliminar = (documento) => {
    setDocumentoToDelete(documento);
    setShowDeleteAlert(true);
  };

  const confirmarEliminacion = async () => {
    try {
      if (!documentoToDelete) return;

      await deleteCoordinacionDocumento.mutateAsync({
        documento_id_coord: documentoToDelete.documentoIdCoord,
      });

      queryClient.invalidateQueries([
        "coordinacion-documentos",
        coordinacion.embarqueId,
      ]);

      setShowDeleteAlert(false);
      setDocumentoToDelete(null);
    } catch (err) {
      console.error("Error al eliminar documento:", err);
      setShowDeleteAlert(false);
      setDocumentoToDelete(null);
    }
  };

  const cancelarEliminacion = () => {
    setShowDeleteAlert(false);
    setDocumentoToDelete(null);
  };

  const columnasDocumentos = [
    {
      name: "tipoDescripcion",
      label: "Tipo Documento",
      campo: "tipoDescripcion",
    },
    {
      name: "descripcion",
      label: "Descripción",
      campo: "descripcion",
    },
    {
      name: "estadoDescripcion",
      label: "Estado",
      campo: "estadoDescripcion",
    },
    {
      name: "fechaCarga",
      label: "Fecha de Carga",
      campo: "fechaCarga",
    },
  ];

  const datosTabla = manifestosCombex.map((doc) => ({
    ...doc,
    accionesDeTabla: {
      view: true,
      edit: true,
      delete: true,
      download: true,
    },
  }));

  return (
    <>
      <Box mb={2}>
        <TablaComponent
          titulo="Manifiestos firmados"
          encabezado={columnasDocumentos}
          datos={datosTabla}
          id="documentoIdCoord"
          isLoading={isLoadingDocumentos}
          rowsPerPage={5}
          select={false}
          eventosDeTabla={{
            view: (row) => handleVer(row.content),
            edit: (row) => handleEditar(row.content),
            delete: (row) => handleEliminar(row.content),
            download: (row) => handleDescargar(row.content),
          }}
          mensajes={{
            noData: "No hay manifiestos Combex cargados.",
            loading: "Cargando documentos...",
          }}
        />
      </Box>

      <Box sx={{ width: "90%", maxWidth: 600, mx: "auto" }}>
        <FormularioComponent
          inputs={
            modoEdicion
              ? [
                  {
                    id: "descripcionEdit",
                    tipo: "textarea",
                    label: "Descripción",
                    val: descripcionEdit,
                    requerido: false,
                    size: 12,
                  },
                ]
              : [
                  {
                    id: "descripcion",
                    tipo: "textarea",
                    label: "Descripción",
                    val: descripcion,
                    requerido: false,
                    size: 12,
                  },
                  {
                    id: "manifiesto",
                    tipo: "archivo",
                    label: "Manifiesto sellado",
                    val: manifiestoFile,
                    multiple: false,
                    acceptedFiles: "application/pdf",
                    requerido: false,
                  },
                ]
          }
          onInput={({ id, val }) => {
            if (id === "manifiesto") setManifiestoFile(val);
            if (id === "descripcion") setDescripcion(val);
            if (id === "descripcionEdit") setDescripcionEdit(val);
          }}
          botones={{
            agregar: { visible: false },
            cancelar: {
              visible: modoEdicion,
              onClick: handleCancelarEdicion,
            },
            filtrar: { visible: false },
            guardar: {
              visible: true,
              onClick: modoEdicion ? handleGuardarEdicion : handleGuardar,
            },
          }}
        />
      </Box>

      <ActionAlertComponent
        openDialog={showDeleteAlert}
        handleClose={cancelarEliminacion}
        onConfirm={confirmarEliminacion}
        onCancel={cancelarEliminacion}
        tipo="warning"
        activarAceptar={true}
        activarCanecelar={true}
        textoConfirmar="Sí, Eliminar"
      >
        <div>
          <strong>¿Estás seguro de que quieres eliminar el documento?</strong>
          <br />
          <br />
          Descripción: &quot;
          {documentoToDelete?.descripcion || "Sin descripción"}&quot;
          <br />
          Tipo: {documentoToDelete?.tipoDescripcion}
        </div>
      </ActionAlertComponent>
    </>
  );
};

ManifiestoRegistro.propTypes = {
  coordinacion: PropTypes.object.isRequired,
};

export default ManifiestoRegistro;
