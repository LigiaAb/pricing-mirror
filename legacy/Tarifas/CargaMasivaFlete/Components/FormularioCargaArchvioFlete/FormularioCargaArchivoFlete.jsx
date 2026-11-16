import { useMemo, useState } from "react";
import { Box, Button, Icon, Typography, Grid } from "@mui/material";
import { api } from "../../../../../api";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import FormularioComponent from "../../../../../components/Formulario/FormularioComponent";
import LoaderComponent from "../../../../../components/Loader/LoaderComponent";
import TablaDetallesComponent from "../../../../../components/Tabla/TablaDetallesComponent";
import BandaAlertaComponent from "../../../../../components/Alertas/BandaAlertaComponent";
import useCatalogosCargaMasivaFlete from "./hooks/useCatalogosCargaMasivaFlete";
import useInputsCargaMasivaFlete from "./hooks/useInputsCargaMasivaFlete";
import { useSelector } from "react-redux";
import moment from 'moment/moment'
import TabComponent from "@/components/Tabs/TabComponent";
import useInputsCargaMasivaFleteTerrestre from "./hooks/useInputsCargaMasivaFleteTerrestre";

const CODS_RURBOS = {
  FLETE: 11,
};

const encabezadoExcelAereo = [
  "NUMERO",
  "TIPO DE TRANSPORTE",
  "LINEA AEREA",
  "TIPO DE CARGA",
  "CLASIFICACION DE CARGA",
  "VIGENCIA INICIAL",
  "VIGENCIA FINAL",
  "SIGLAS",
  "ORIGEN CODIGO IATA",
  "DESTINO CODIGO IATA",
  "MINIMO",
  "<45",
  ">45",
  ">100",
  ">300",
  ">500",
  ">1000",
  ">1300 ",
  "TIPO TARIFA",
  "TIPO AVION",
];

const encabezadoExcelTerrestre = [
  "NUMERO",
  "TIPO DE CARGA",
  "CLASIFICACION DE CARGA",
  "VIGENCIA INICIAL",
  "VIGENCIA FINAL",
  "DESTINO",
  "PAIS",
  "SIGLAS",
  "MINIMO",
  "<45",
  ">45",
  ">100",
  ">300",
  ">500",
  ">1000",
  ">1300 ",
];

const formatFormValueToApiSubmissionFormat = (valores) => {
  const valoresConFormato = {
    ...valores,
    cod_rubro: CODS_RURBOS.FLETE,
  };

  delete valoresConFormato.empresa;
  delete valoresConFormato.centroCosto;
  delete valoresConFormato.rubro;

  return valoresConFormato;
};

const FormularioCargaArchivoFlete = () => {
  const { currentEmpresa, currentCentroCosto } = useSelector((state) => state.menu);
  const { empresas, centrosCostos, rubros } = useCatalogosCargaMasivaFlete({});

  const [tab, setTab] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCompleted, setIsLoadingCompleted] = useState(false);
  const [errores, setErrores] = useState([]);
  const [completados, setCompletados] = useState([]);

  const valoresIniciales = useMemo(() => {
    const empresa = { ...currentEmpresa, label: currentEmpresa.nombre_emp, value: currentEmpresa.cod_empresa };
    delete empresa.centrosCosto;
    const centroCosto = { ...currentCentroCosto, label: currentCentroCosto.nombre_cc, value: currentCentroCosto.cod_cc };
    delete centroCosto.modulos;
    const valoresIniciales = {
      cod_metodo: "AIRFREIGHT",
      cod_empresa: empresa?.cod_empresa || null,
      empresa,
      cod_cc: centroCosto?.cod_cc || null,
      centroCosto,
    };
    return valoresIniciales;
  }, [currentEmpresa, currentCentroCosto]);

  const [valores, setValores] = useState(valoresIniciales);

  const valoresConFormatoDeFormulario = {
    ...valores,
    empresa: empresas.find((e) => e.cod_empresa === valores.cod_empresa),
    centroCosto: centrosCostos.find((cc) => cc.cod_cc === valores.cod_cc),
  };

  const inputs = useInputsCargaMasivaFlete({
    valores: valoresConFormatoDeFormulario,
    opciones: {
      empresas,
      centrosCostos,
      rubros,
    },
  });


  const inputsTerrestre = useInputsCargaMasivaFleteTerrestre({
    valores: valoresConFormatoDeFormulario,
    opciones: {
      empresas,
      centrosCostos,
      rubros,
    },
  });

  const handleDescargarPlantilla = async (tipo) => {
    const encabezadoExcel = tipo == "AIRFREIGTH" ? encabezadoExcelAereo : encabezadoExcelTerrestre 
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Datos");
    worksheet.addRow(encabezadoExcel);

    // Ajustar el ancho de las columnas
    worksheet.columns.forEach((column, index) => {
      column.width = encabezadoExcel[index].length < 20 ? 20 : encabezadoExcel[index].length;
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    saveAs(blob, `Plantilla Carga de Fletes ${tipo}.xlsx`);
  };

  const handleLimpiezaResultado = () => {
    setIsLoading(false);
    setIsLoadingCompleted(false);
    setErrores([]);
  };

  const handleInputChange = ({ id, val }) => {
    setValores((prev) => {
      const nuevosValores = { ...prev, [id]: val };

      switch (id) {
        case "empresa":
          nuevosValores.cod_empresa = val?.value;
          if (!val) nuevosValores.empresa = nuevosValores.cod_empresa = null;
          nuevosValores.centroCosto = nuevosValores.cod_cc = null;
          break;
        case "centroCosto":
          nuevosValores.cod_cc = val?.value;
          if (!val) nuevosValores.centroCosto = nuevosValores.cod_cc = null;
          break;
      }

      return nuevosValores;
    });
  };

  const handleSubmit = async (tipo) => {
    setIsLoading(true);
    setIsLoadingCompleted(false);
    const valoresConFormato = formatFormValueToApiSubmissionFormat({
      ...valores, cod_metodo: tipo || "AIRFREIGHT"
    });

    const formData = new FormData();
    for (const key in valoresConFormato) {
      const value = valoresConFormato[key];
      formData.append(key, value);
    }

    const cargaMasivaFleteURL = "/api/appweb/orquestador-cargas-masivas-fletes";
    let response = await api.post(cargaMasivaFleteURL, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    setIsLoading(false);
    setIsLoadingCompleted(true);
    if (!response.data?.data?.success) {
      return setErrores([response.data?.data?.mensaje]);
    }
    setCompletados(response.data.data.data.successfull_inserts || [])
    setErrores(response.data.data.data.failedInserts || []);
  };

  return (
    <Grid display="flex" flexDirection="column" gap={2} mt={2}>
      <Grid container columns={12}>
        <Typography m={0} p={0} variant="h4"> Carga Masiva de Fletes </Typography>
      </Grid>

       <TabComponent
          opciones={[
            {
              id: 0,
              label: "Aereo",
              icono: "c-avion",
              content: (<>
                <Grid container columns={12} mt={2}>
                  <Button variant="contained" component="label" startIcon={<Icon sx={{ mr: 1 }} className="c-descargar" />} 
                    onClick={() => handleDescargarPlantilla("AIRFREIGTH")} sx={{ width: "fit-content" }}
                  >
                    Descargar Plantilla AEREO
                  </Button>
                </Grid>

                <FormularioComponent
                  inputs={inputs}
                  onInput={handleInputChange}
                  botones={{
                    agregar: { visible: false },
                    editar: { visible: false },
                    limpiar: { visible: isLoadingCompleted, onClick: handleLimpiezaResultado },
                    enviar: { visible: true, readonly: isLoading, onClick: () => handleSubmit("AIRFREIGTH") },
                  }}
                />
              </>),
            },
            {
              id: 1,
              label: "Terrestre",
              icono: "c-camion",
              content: (<>
                <Grid container columns={12} mt={2}>
                  <Button variant="contained" component="label" startIcon={<Icon sx={{ mr: 1 }} className="c-descargar" />} 
                    onClick={() => handleDescargarPlantilla("LANDFREIGTH")} sx={{ width: "fit-content" }}
                  >
                    Descargar Plantilla TERRESTRE
                  </Button>
                </Grid>

                <FormularioComponent
                  inputs={inputsTerrestre}
                  onInput={handleInputChange}
                  botones={{
                    agregar: { visible: false },
                    editar: { visible: false },
                    limpiar: { visible: isLoadingCompleted, onClick: handleLimpiezaResultado },
                    enviar: { visible: true, readonly: isLoading, onClick: () => handleSubmit("LANDFREIGTH") },
                  }}
                />
              </>),
            },
          ]}
          tabInicial={tab}
          tabSeleccionado={(nuevoTab) => setTab(nuevoTab)}
          onCambiarTab={(nuevoTab) => setTab(nuevoTab)}
      />
 
      

      {isLoading && 
        <LoaderComponent sx={{ position: "block" }} 
          texto={"Cargando"} texto2={"Esto puede demorar unos minutos, por favor no cerrar la pestaña."} 
        />
      }

      {isLoadingCompleted &&
        (errores.length ? (
          <Box display="flex" flexDirection="column" gap={2}>
            <BandaAlertaComponent tipo="error">Han ocurrido errores durante la carga masiva.</BandaAlertaComponent>
            <TablaDetallesComponent 
              descargar={true}
              filename={`reporte_carga_fletes_${moment().unix()}`}
              id="ErroresCargaMasivaFlete"  height="100%"
              data={completados.map((t) => ({ tarifa: `Fila ${t.FILA}: Tarifa #${t.SERVICIO} ${t.ACTUALIZADO ? "actualizada" : "creada"} correctamente.` }))} 
              columnas={[{ label: "Modificaciones", column: "tarifa" }]} 
            />
            <TablaDetallesComponent 
              descargar={true}
              filename={`reporte_errores_carga_fletes_${moment().unix()}`}
              id="ErroresCargaMasivaFlete"  height="100%"
              data={errores.map((e) => ({ errorMessage: e }))} 
              columnas={[{ label: "Errores de Carga", column: "errorMessage" }]} 
            />
          </Box>
        ) : ( 
          <Box display="flex" flexDirection="column" gap={2}>
            <BandaAlertaComponent tipo="success" sx={{ mt: 2, mb: 2 }}>
              Carga masiva de flete completada exitosamente sin errores.
            </BandaAlertaComponent>
            <TablaDetallesComponent 
              descargar={true}
              filename={`reporte_carga_fletes_${moment().unix()}`}
              id="ErroresCargaMasivaFlete"  height="100%"
              data={completados.map((t) => ({ tarifa: `Fila ${t.FILA}: Tarifa #${t.SERVICIO} ${t.ACTUALIZADO ? "actualizada" : "creada"} correctamente.` }))} 
              columnas={[{ label: "Modificaciones", column: "tarifa" }]} 
            />
          </Box>
        ))}
    </Grid>
  );
};

export default FormularioCargaArchivoFlete;
