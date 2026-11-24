import React, { useMemo, useState } from "react";
import PropTypes from "prop-types";
import TablaEditableMod from "./tablaEditableMod";
import ModalCargas, {
  normalize,
  normalizeCantidad,
  computeCW,
  computeVolumenTotal,
  aplicarCamposDerivados,
  formatPartidaArancelaria,
  getFactorCmPorUnidadMedida,
} from "../modal/modalCargas";
import {
  Box,
  Button,
  Tooltip,
} from "@mui/material";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

const CAMPOS_OCULTOS_MODAL = new Set(["_incomplete", "_estado", "_gridId", "_index"]);

const TablaCargasEditableBase = ({
  encabezados,
  data,
  objetoBase,
  eventosDeTabla,
  onRowAdded,
  onRowDeleted,
  onRowEdit,
  onRowUpdated,
  onInput,
  onRefresh,
  invalidateQueryKeys,
  editarEnTabla = true,
}) => (
  <Box sx={{ width: "100%", overflowX: "auto" }}>
    <TablaEditableMod
      encabezados={encabezados}
      data={data}
      idKey="_gridId"
      editarEnTabla={editarEnTabla}
      acciones={{ view: true }}
      eventosDeTabla={eventosDeTabla}
      onRowAdded={onRowAdded}
      onRowDeleted={onRowDeleted}
      objetoBase={objetoBase}
      onRowEdit={onRowEdit}
      onRowUpdated={onRowUpdated}
      onInput={onInput}
      onRefresh={onRefresh}
      invalidateQueryKeys={invalidateQueryKeys}
    />
  </Box>
);

const renderIncompleteWarning = (val, row, getCamposFaltantes) => {
  if (!val) return null;
  const camposFaltantes = typeof getCamposFaltantes === "function" ? getCamposFaltantes(row) : [];
  return <IncompleteWarning camposFaltantes={camposFaltantes} />;
};

const IncompleteWarning = ({ camposFaltantes }) => {
  const campos = camposFaltantes || [];
  const tooltipText = campos.length > 0
    ? `Faltan campos obligatorios: ${campos.join(", ")}`
    : "Información obligatoria incompleta";

  return (
    <Tooltip title={tooltipText} arrow>
      <WarningAmberIcon sx={{ color: "warning.main", fontSize: 18, display: "block" }} />
    </Tooltip>
  );
};

IncompleteWarning.propTypes = {
  camposFaltantes: PropTypes.arrayOf(PropTypes.string),
};

TablaCargasEditableBase.propTypes = {
  encabezados: PropTypes.arrayOf(PropTypes.object).isRequired,
  data: PropTypes.arrayOf(PropTypes.object),
  objetoBase: PropTypes.object,
  eventosDeTabla: PropTypes.object,
  onRowAdded: PropTypes.func,
  onRowDeleted: PropTypes.func,
  onRowEdit: PropTypes.func,
  onRowUpdated: PropTypes.func,
  onInput: PropTypes.func,
  onRefresh: PropTypes.func,
  invalidateQueryKeys: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.array,
    PropTypes.object,
  ]),
  editarEnTabla: PropTypes.bool,
};

const TablaCargasEditable = ({
  filas,
  isLoadingPaises,
  paises,
  unidadesVolumetricas,
  hideUnidadVolumetrica = false,
  showId = false,
  columnasVisibles = null,
  updateFila,
  removeFila,
  addFila,
  onRowCreate,
  onRowSave,
  onRowDelete,
  onRefresh,
  invalidateQueryKeys,
  regimenAduanalOptions = [],
  incompleteRowIds = null,
  getCamposFaltantes = null,
  tiposEmbalaje = [],
  isLoadingTiposEmbalaje = false,
  unidadesMedida = [],
  isLoadingUnidadesMedida = false,
  readOnly = false,
}) => {
  const [modalState, setModalState] = useState({
    open: false,
    row: null,
  });
  const [newModalOpen, setNewModalOpen] = useState(false);
  const [newModalRow, setNewModalRow] = useState(null);

  const paisesOrdenados = useMemo(() => {
    return [...(paises || [])].sort((a, b) => {
      const aLabel = String(a.label || a.nombre_pais || a.NOMBRE_PAIS || a.value || a.cod_pais || "").toLowerCase();
      const bLabel = String(b.label || b.nombre_pais || b.NOMBRE_PAIS || b.value || b.cod_pais || "").toLowerCase();
      return aLabel.localeCompare(bLabel);
    });
  }, [paises]);

  const datosConId = useMemo(() => {
    return filas.map((fila, index) => {
      const gridId = fila._gridId ?? fila.embCargaId ?? `temp_id_${index}`;
      const incomplete = incompleteRowIds ? incompleteRowIds.has(gridId) : false;
      return {
        ...fila,
        _gridId: gridId,
        _index: index,
        definitivoGeneralBool: String(fila.definitivoGeneral).toUpperCase() === "S",
        _incomplete: incomplete,
      };
    });
  }, [filas, incompleteRowIds]);

  const defaultPaisOrigenId = useMemo(() => {
    if (paisesOrdenados && paisesOrdenados.length > 0) {
      const guatemala = paisesOrdenados.find((p) => {
        const nombre = String(p.nombre_pais || p.NOMBRE_PAIS || p.label || p.value || p.cod_pais || "").toLowerCase();
        return nombre === "guatemala" || nombre.includes("guatemala");
      });

      return guatemala ? (guatemala.value ?? guatemala.cod_pais ?? "") : "";
    }
    return "";
  }, [paisesOrdenados]);

  const encabezados = useMemo(() => {
    const cols = [
      { id: "embCargaId", field: "embCargaId", label: "ID", editable: false, visible: showId, minWidth: 50, maxWidth: 75, width: 75 },
      {
        id: "_incomplete",
        field: "_incomplete",
        label: "",
        editable: false,
        minWidth: 36,
        maxWidth: 36,
        width: 36,
        showOnNew: false,
        format: (val, row) => renderIncompleteWarning(val, row, getCamposFaltantes),
      },
      {
        id: "_estado",
        field: "_estado",
        label: "Estado",
        editable: false,
        minWidth: 120,
        width: 120,
        showOnNew: true,
        format: (val, row) => {
          const campos = getCamposFaltantes ? getCamposFaltantes(row) : [];
          return campos.length > 0 ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, color: "warning.main" }}>
              <WarningAmberIcon sx={{ fontSize: 16 }} />
              <span style={{ fontSize: 12 }}>Faltan datos</span>
            </Box>
          ) : (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, color: "success.main" }}>
              <CheckCircleIcon sx={{ fontSize: 16 }} />
              <span style={{ fontSize: 12 }}>Completo</span>
            </Box>
          );
        },
      },
      {
        id: "paisOrigenId",
        field: "paisOrigenId",
        label: "País Origen *",
        type: "select",
        options: (paisesOrdenados || []).map(p => ({
          value: p.value || p.cod_pais,
          label: p.label || p.nombre_pais || p.NOMBRE_PAIS || p.value || p.cod_pais
        })),
        valueOption: "value",
        labelOption: "label",
        format: (val) => {
          if (val && typeof val === "object") {
            return val.label || val.value || "";
          }
          const found = (paisesOrdenados || []).find(p => String(p.value || p.cod_pais) === String(val));
          return found ? (found.label || found.nombre_pais || found.NOMBRE_PAIS || val) : val;
        },
        editable: !isLoadingPaises,
        loading: isLoadingPaises,
        minWidth: 180,
      },
      { id: "descripcion", field: "descripcion", label: "Descripción *", editable: true, minWidth: 170 },
      { id: "valor", field: "valor", label: "Valor declarado*", type: "number", editable: true, minWidth: 80, min: 0.01 },
      {
        id: "tipoEmbalaje",
        field: "tipoEmbalaje",
        label: "Tipo Embalaje *",
        type: "select",
        required: true,
        options: (tiposEmbalaje && tiposEmbalaje.length > 0)
          ? tiposEmbalaje.map((t) => ({ value: t.value ?? t.codTipo ?? t.cod_tipo, label: t.label ?? t.nomTipo ?? t.nom_tipo ?? String(t.value ?? t.codTipo ?? t.cod_tipo) }))
          : [
              { value: "Cajas", label: "Cajas" },
              { value: "Tarima", label: "Tarima" },
              { value: "Otros", label: "Otros" },
            ],
        valueOption: "value",
        labelOption: "label",
        format: (val) => {
          if (val && typeof val === "object") {
            return val.label || val.value || "";
          }
          const opt = tiposEmbalaje && tiposEmbalaje.length > 0
            ? tiposEmbalaje.find((t) => String(t.value ?? t.codTipo ?? t.cod_tipo) === String(val))
            : null;
          if (opt) return opt.label ?? opt.nomTipo ?? opt.nom_tipo ?? val;
          const mapa = { Cajas: "Cajas", Tarima: "Tarima", Otros: "Otros" };
          return mapa[val] || val;
        },
        editable: !isLoadingTiposEmbalaje,
        loading: isLoadingTiposEmbalaje,
        minWidth: 105,
      },
      {
        id: "partidaArancelaria",
        field: "partidaArancelaria",
        label: "Partida Arancelaria *",
        type: "text",
        editable: true,
        minWidth: 200,
        multiline: false,
      },
      {
        id: "regimenAduanal",
        field: "regimenAduanal",
        label: "Régimen Aduanal *",
        type: "select",
        options: (regimenAduanalOptions || []).map((t) => ({
          value: t.value,
          label: t.label,
        })),
        valueOption: "value",
        labelOption: "label",
        format: (val) => {
          if (val && typeof val === "object") {
            return val.label || val.value || "";
          }
          const found = (regimenAduanalOptions || []).find((t) => String(t.value) === String(val));
          return found ? (found.label || val) : val;
        },
        editable: true,
        minWidth: 150,
      },
      // Columna calculadora deshabilitada según solicitud
      // {
      //   id: "calcular",
      //   field: "calcular",
      //   label: "Calcular",
      //   editable: false,
      //   showOnNew: true,
      //   minWidth: 50,
      //   format: renderCalculatorButton,
      // },
    ];

    if (!hideUnidadVolumetrica) {
      cols.push({
        id: "unidadMedida",
        field: "unidadMedida",
        label: "Unidad Volumétrica *",
        type: "select",
        options: (unidadesVolumetricas || []).map(u => ({
          value: u.value, label: u.label
        })),
        valueOption: "value",
        labelOption: "label",
        format: (val) => {
          if (val && typeof val === "object") {
            return val.label || val.value || "";
          }
          const found = (unidadesVolumetricas || []).find(u => String(u.value) === String(val));
          return found ? (found.label || val) : val;
        },
        editable: true,
        minWidth: 150,
      });
    }

    cols.push(
      {
        id: "cantidad",
        field: "cantidad",
        label: "# Bultos *",
        type: "number",
        editable: true,
        minWidth: 72,
        maxWidth: 90,
        width: 90,
        min: 1,
        inputProps: { step: 1 },
      },
      { id: "pesoTotal", field: "pesoTotal", label: "Peso (kg) *", type: "number", editable: true, minWidth: 110, maxWidth: 130, width: 130, min: 0.001 },
    );

    if (Array.isArray(unidadesMedida) && unidadesMedida.length > 0) {
      cols.push({
        id: "unidadMedida",
        field: "unidadMedida",
        label: "Unidad de medida *",
        type: "select",
        // El valor guardado en la carga (tipo_id_unidad_medida) es el `cod_tipo`
        // del registro de lista-relacion-tipo, no su `cod_relacion_tipo`. Si
        // mapeamos el value de la option a `u.value` (cod_relacion_tipo), el
        // selector no encuentra la opción guardada al editar. Por eso usamos
        // `cod_tipo` (codTipo en el hook público, cod_tipo en el privado).
        options: unidadesMedida.map((u) => ({ value: u.codTipo ?? u.cod_tipo ?? u.value, label: u.label })),
        valueOption: "value",
        labelOption: "label",
        format: (val) => {
          if (val && typeof val === "object") {
            return val.label || val.value || "";
          }
          const found = unidadesMedida.find((u) => String(u.codTipo ?? u.cod_tipo ?? u.value) === String(val));
          return found ? (found.label || val) : val;
        },
        editable: !isLoadingUnidadesMedida,
        loading: isLoadingUnidadesMedida,
        minWidth: 140,
      });
    }

    cols.push(
      { id: "largo", field: "largo", label: "Largo", type: "number", editable: true, minWidth: 63, maxWidth: 77, width: 77, min: 0.1 },
      { id: "alto", field: "alto", label: "Alto", type: "number", editable: true, minWidth: 63, maxWidth: 77, width: 77, min: 0.1 },
      { id: "ancho", field: "ancho", label: "Ancho", type: "number", editable: true, minWidth: 63, maxWidth: 77, width: 77, min: 0.1 },
      { id: "volumenTotal", field: "volumenTotal", label: "Peso volumétrico (kg)", type: "number", editable: false, showOnNew: true, minWidth: 110, maxWidth: 110, width: 110, min: 0.0001 },
      {
        id: "cw", field: "cw", label: "CW (kg)", type: "number", editable: false, showOnNew: true, minWidth: 220, maxWidth: 220, width: 220,
        format: (val, row) => {
          const cwValue = row?.cw ?? val;
          const cwNum = Number(cwValue);
          if (!Number.isFinite(cwNum) || cwNum <= 0) return 0;
          return Number(cwNum.toFixed(3));
        },
      }
    );

    return cols;
  }, [isLoadingPaises, paisesOrdenados, tiposEmbalaje, isLoadingTiposEmbalaje, hideUnidadVolumetrica, showId, unidadesVolumetricas, regimenAduanalOptions, getCamposFaltantes, unidadesMedida, isLoadingUnidadesMedida]);

  const encabezadosTabla = useMemo(() => {
    const cols = columnasVisibles?.length > 0
      ? encabezados.filter(c => columnasVisibles.includes(c.id))
      : encabezados;
    if (!readOnly) return cols;
    return cols.map((c) => ({ ...c, editable: false }));
  }, [encabezados, columnasVisibles, readOnly]);

  const generatedBaseRow = useMemo(() => {
    const baseRow = { paisOrigenId: defaultPaisOrigenId };
    return encabezados.reduce((acc, columna) => {
      if (acc[columna.id] !== undefined) {
        return acc;
      }

      if (columna.type === "boolean" || columna.type === "checkbox") {
        acc[columna.id] = false;
      } else {
        acc[columna.id] = "";
      }

      return acc;
    }, baseRow);
  }, [encabezados, defaultPaisOrigenId]);

  const camposModal = useMemo(
    () => encabezados
      .filter((columna) => columna.visible !== false && !CAMPOS_OCULTOS_MODAL.has(columna.id))
      .map((columna) => (readOnly ? { ...columna, editable: false } : columna)),
    [encabezados, readOnly],
  );

  const abrirDialogoEdicion = (id, row) => {
    setModalState({
      open: true,
      row,
    });
  };

  const cerrarDialogoEdicion = () => {
    setModalState({
      open: false,
      row: null,
    });
  };

  const abrirNuevoModal = () => {
    setNewModalRow(generatedBaseRow);
    setNewModalOpen(true);
  };

  const cerrarNuevoModal = () => {
    setNewModalOpen(false);
    setNewModalRow(null);
  };

  const handleSaveNuevo = async (draft) => {
    if (!draft) return;
    if (typeof onRowCreate === "function") {
      await Promise.resolve(onRowCreate(draft));
    }
    setNewModalOpen(false);
  };

  const handleRowEdit = (id, newData, oldData) => {
    const targetData = newData || oldData;
    if (!targetData) return;
    const index = targetData._index;
    Object.keys(targetData).forEach(key => {
      if (key === "definitivoGeneralBool") {
        const newVal = targetData[key] ? "S" : "N";
        const oldBoolValue = oldData ? oldData.definitivoGeneralBool : null;
        let oldVal = null;
        if (oldBoolValue !== null) {
          oldVal = oldBoolValue ? "S" : "N";
        }
        if (newVal !== oldVal) {
          updateFila(index, "definitivoGeneral", newVal);
        }
      } else if (key !== "_gridId" && key !== "_index" && newData && oldData && newData[key] !== oldData[key]) {
        updateFila(index, key, normalize(newData[key]));
      }
    });
  };

  const applyVolumeAutoUpdate = (row, index, field, value) => {
    const normalized = normalize(value);

    if (field === "definitivoGeneralBool") {
      updateFila(index, "definitivoGeneral", value ? "S" : "N");
    } else {
      updateFila(index, field, normalized);
    }

    if (["cantidad", "largo", "ancho", "alto", "unidadMedida"].includes(field)) {
      const nextValues = { ...row, [field]: normalized };
      const factorCm = getFactorCmPorUnidadMedida(nextValues.unidadMedida, unidadesMedida);
      const newVolumen = computeVolumenTotal({ ...nextValues, factorCm });
      const finalVolumen = newVolumen > 0 ? newVolumen : "";
      updateFila(index, "volumenTotal", finalVolumen);
      updateFila(index, "cw", computeCW({ pesoTotal: row.pesoTotal, volumenTotal: finalVolumen }));
    } else if (field === "pesoTotal") {
      updateFila(index, "cw", computeCW({ pesoTotal: normalized, volumenTotal: row.volumenTotal }));
    }
  };

  const handleInput = (params) => {
    const { field, value, row, isNew } = params;

    if (!row) return row;

    let valorProcesado;
    if (field === "cantidad") {
      valorProcesado = normalizeCantidad(value);
    } else if (field === "partidaArancelaria") {
      valorProcesado = formatPartidaArancelaria(value);
    } else {
      valorProcesado = value;
    }

    if (isNew) {
      return aplicarCamposDerivados(row, field, valorProcesado, { unidadesMedida });
    }

    if (row._index !== undefined) {
      applyVolumeAutoUpdate(row, row._index, field, valorProcesado);
    }

    // Return row with derived fields computed for live display during editing
    return aplicarCamposDerivados(row, field, valorProcesado, { unidadesMedida });
  };

  return (
    <>
      {typeof onRowCreate === "function" && (
        <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
          <Button variant="contained" onClick={abrirNuevoModal}>
            Nuevo
          </Button>
        </Box>
      )}
      <TablaCargasEditableBase
        encabezados={encabezadosTabla}
        data={datosConId}
        objetoBase={{ paisOrigenId: defaultPaisOrigenId }}
        editarEnTabla={!readOnly}
        eventosDeTabla={{
          delete: (id, row) => {
            const idx = row._index;
            if (typeof onRowDelete === "function") {
              const res = onRowDelete(row, idx);
              if (res?.then) {
                res.then(() => removeFila(idx)).catch(() => removeFila(idx));
              } else {
                removeFila(idx);
              }
            } else {
              removeFila(idx);
            }
          },
          save: (id, row) => {
            handleRowEdit(id, row);
            if (typeof onRowSave === "function") {
              onRowSave(row, row._index);
            }
          },
          edit: (id, row) => handleRowEdit(id, row),
          view: abrirDialogoEdicion,
        }}
        onRowAdded={(id, filaGenerada) => addFila(filaGenerada)}
        onRowDeleted={(id, row) => removeFila(row._index)}
        onRowEdit={handleRowEdit}
        onRowUpdated={handleRowEdit}
        onInput={handleInput}
        onRefresh={onRefresh}
        invalidateQueryKeys={invalidateQueryKeys}
      />

      <ModalCargas
        open={modalState.open}
        row={modalState.row}
        camposModal={camposModal}
        onClose={cerrarDialogoEdicion}
        readOnly={readOnly}
        unidadesMedida={unidadesMedida}
        onSave={async (draft) => {
          if (!draft) return;
          const row = modalState.row;
          handleRowEdit(row?._gridId ?? row?.embCargaId, draft, row);
          if (typeof onRowSave === "function") {
            await Promise.resolve(onRowSave(draft, draft._index));
          }
        }}
      />
      <ModalCargas
        open={newModalOpen}
        row={newModalRow}
        camposModal={camposModal}
        onClose={cerrarNuevoModal}
        onSave={handleSaveNuevo}
        unidadesMedida={unidadesMedida}
      />
    </>
  );
};

TablaCargasEditable.propTypes = {
  filas: PropTypes.arrayOf(PropTypes.object).isRequired,
  isLoadingPaises: PropTypes.bool,
  paises: PropTypes.arrayOf(PropTypes.object),
  unidadesVolumetricas: PropTypes.arrayOf(PropTypes.object),
  regimenAduanalOptions: PropTypes.arrayOf(PropTypes.object),
  hideUnidadVolumetrica: PropTypes.bool,
  showId: PropTypes.bool,
  updateFila: PropTypes.func.isRequired,
  removeFila: PropTypes.func.isRequired,
  addFila: PropTypes.func.isRequired,
  onRowCreate: PropTypes.func,
  onOpenCalculator: PropTypes.func,
  onRowSave: PropTypes.func,
  onRowDelete: PropTypes.func,
  onRefresh: PropTypes.func,
  invalidateQueryKeys: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.array,
    PropTypes.object,
  ]),
  tiposEmbalaje: PropTypes.arrayOf(PropTypes.object),
  isLoadingTiposEmbalaje: PropTypes.bool,
  unidadesMedida: PropTypes.arrayOf(PropTypes.object),
  isLoadingUnidadesMedida: PropTypes.bool,
  columnasVisibles: PropTypes.array,
  incompleteRowIds: PropTypes.instanceOf(Set),
  getCamposFaltantes: PropTypes.func,
  readOnly: PropTypes.bool,
};

export default TablaCargasEditable;