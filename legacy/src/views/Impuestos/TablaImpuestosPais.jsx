import React, { useState, useEffect, useMemo } from "react";
import { Box, Grid, Typography } from "@mui/material";
import TablaComponent from "../../components/Tabla/TablaComponent";
import { useNavigate } from "react-router-dom";
import { FormularioImpuestoPais } from "./FormularioImpuestoPais";
import ActionAlertComponent from "../../components/Dialog/ActionAlertComponent";
import { api } from "../../api";
import FormularioComponent from "../../components/Formulario/FormularioComponent";

export const TablaImpuestosPais = (props) => {
  const { dataApi = [], paises = [], estados = [], modalResume, viewBtn, newBtn = false, setUpdateData, updateData } = props;

  const [viewForm, setViewForm] = useState(false);
  const [open, setOpen] = useState(false);
  const [newForm, setNewForm] = useState(false);
  const [mostrarAlerta, setMostrarAlerta] = useState(false);
  const [filaSeleccionada, setFilaSeleccionada] = useState(null);
  const [valores, setValores] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);
  const [headesRender, setHeadersRender] = useState([
    {
      name: "COD_IMPUESTO_PAIS",
      label: "Codigo Impuesto Pais",
      campo: "cod_impuesto_pais",
    },
    {
      name: "NOMBRE_PAIS",
      label: "Pais",
      campo: "nombre_pais",
    },
    {
      name: "PORCENTAJE_IMPUESTO",
      label: "Porcentaje",
      campo: "porcentaje_impuesto",
    },
    {
      name: "FECHA_INICIO_IMPUESTO",
      label: "Fecha Inicio",
      campo: "fecha_inicio_impuesto",
    },
    {
      name: "FECHA_FIN_IMPUESTO",
      label: "Fecha Fin",
      campo: "fecha_fin_impuesto",
    },
    {
      name: "ESTADO_DESC",
      label: "Estado",
      campo: "estado_desc",
    },
  ]);

  const navigate = useNavigate();

  const eliminarFila = (fila) => {
    console.log("fila", fila.content);
    api.post("/api/appweb/actualizar-impuesto-x-pais", { ...fila.content, cod_estado: 4 }).then((i) => setUpdateData(updateData + 1));
  };

  useEffect(() => {
    if (modalResume) {
      setHeadersRender([
        {
          name: "NOM_IMPUESTO",
          label: "Moneda",
          campo: "nom_impuesto",
        },
      ]);
    }
  }, []);

  const datos = useMemo(() => {
    return dataApi.map((i) => {
      let o = {};
      Object.keys(i).forEach((d) => {
        o[d] = {
          color: d === "estado_desc" ? (i.estado_desc === "ACTIVO" ? "green.main" : "red.main") : undefined,
          bold: d === "estado_desc" ? true : undefined,
        };
      });
      return {
        ...i,
        propiedadesDeTabla: o,
      };
    });
  }, [dataApi]);

  const paises_ = useMemo(
    () =>
      paises?.map((item) => ({
        value: item.cod_pais.toString(),
        label: item.nombre_pais,
      })),
    [paises]
  );

  const dataPaises_ = useMemo(() => datos?.filter((item) => (valores ? item.cod_pais == valores.value : true)), [datos, valores]);

  const inputs = useMemo(
    () => [
      {
        tipo: "select",
        label: "Filtro",
        id: "filtro",
        val: {
          label: valores ? valores?.label : "",
          value: valores ? valores?.value : -1,
        },
        options: paises_,
      },
    ],
    [valores]
  );

  return (
    <Box sx={{ p: 1, m: 0 }}>
      <FormularioComponent
        inputs={inputs}
        onInput={({ id, val }) => {
          console.log("input", id, val);
          setValores(val);
        }}
        botones={{ agregar: { visible: false } }}
      />

      <TablaComponent
        titulo="Impuestos"
        id="cod_impuesto_pais"
        encabezado={headesRender}
        datos={dataPaises_}
        select={false}
        eventosDeTabla={{
          add: (fila) => {
            if (fila) navigate(`${fila?.content.cod_pais}`);
          },
          view: (fila) => {
            setSelectedRow(fila.content);
            setViewForm(true);
            setOpen(false);
            setNewForm(false);
          },
          // go: (fila) => console.log("go", fila),
          // copy: (fila) => console.log("copy", fila),
          // paste: (fila) => console.log("paste", fila),
          // auth: (fila) => console.log("auth", fila),
          // edit: (fila) => {
          //   setOpen(!open)
          //   setNewForm(false)
          //   setViewForm(false)
          //   setSelectedRow(selectedRow ? null : fila.content)
          // },
          // excel: (fila) => console.log("excel", fila),
          // pdf: (fila) => console.log("pdf", fila),
          // download: (fila) => console.log("download", fila),
          delete: (fila) => {
            setMostrarAlerta(true);
            setFilaSeleccionada(fila);
          },
        }}
        botones={
          newBtn && {
            nuevo: {
              label: "nuevo",
              color: "primary",
              onClick: () => {
                setOpen(false);
                setNewForm(!newForm);
                setSelectedRow(null);
              },
            },
          }
        }
      />
      {viewForm && (
        <Box sx={{ p: 1, m: 0, my: 2 }}>
          <Grid size="auto">
            <Typography variant="h6" mx={1} sx={{ whiteSpace: "wrap" }}>
              VER
            </Typography>
          </Grid>
          <FormularioImpuestoPais
            readOnly={true}
            dataGet={selectedRow}
            enableBtn={false}
            readOnlyInput={true}
            paises={paises}
            estados={estados}
            updateData={updateData}
            setUpdateData={setUpdateData}
          />
        </Box>
      )}
      {open && (
        <Box sx={{ p: 1, m: 0, my: 2 }}>
          <Grid size="auto">
            <Typography variant="h6" mx={1} sx={{ whiteSpace: "wrap" }}>
              EDITAR
            </Typography>
          </Grid>
          <FormularioImpuestoPais
            readOnly={false}
            dataGet={selectedRow}
            enableBtn={true}
            readOnlyInput={false}
            paises={paises}
            estados={estados}
            updateData={updateData}
            setUpdateData={setUpdateData}
          />
        </Box>
      )}
      {newForm && (
        <Box sx={{ p: 1, m: 0, my: 2 }}>
          <Grid size="auto">
            <Typography variant="h6" mx={1} sx={{ whiteSpace: "wrap" }}>
              NUEVO
            </Typography>
          </Grid>
          <FormularioImpuestoPais readOnly={false} dataGet={null} enableBtn={true} readOnlyInput={false} paises={paises} estados={estados} updateData={updateData} setUpdateData={setUpdateData} />
        </Box>
      )}
      <ActionAlertComponent
        aceptar={() => {
          eliminarFila(filaSeleccionada);
          setMostrarAlerta(false);
        }}
        cancelar={() => {
          setMostrarAlerta(false);
        }}
        openDialog={mostrarAlerta}
        tipo="error"
        handleClose={() => {}}
        content={"¿Esta seguro que desea eliminar el registro?"}
      />
    </Box>
  );
};
