// update comment
import { useMemo, useState } from "react";
import { Box, Button, Icon, Typography, Grid } from "@mui/material";
import { api } from "@/api";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import FormularioComponent from "@/components/Formulario/FormularioComponent";
import LoaderComponent from "@/components/Loader/LoaderComponent";
import TablaDetallesComponent from "@/components/Tabla/TablaDetallesComponent";
import BandaAlertaComponent from "@/components/Alertas/BandaAlertaComponent";
import { useSelector } from "react-redux";
import moment from 'moment/moment'
import {
  useFetchCentrosCosto,
  useFetchEmpresas,
} from "@/hooks/Fetch/useFetchCatalog";

const encabezadoExcel = [
  'CORRELATIVO','CLIENTE','EMBARQUE','CORREO','VIGENCIA INICIAL','VIGENCIA FINAL'
]

const FormularioCargaAsignacionCTS = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingCompleted, setIsLoadingCompleted] = useState(false);
    const [errores, setErrores] = useState([]);
    const [completados, setCompletados] = useState([]);
    const [state, setState] = useState(0);
    const [valores, setValores] = useState({});

    const empresas = useFetchEmpresas();
    const cencos = useFetchCentrosCosto();

    const handleDescargarPlantilla = async () => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Datos");
        worksheet.addRow(encabezadoExcel);

        // Ajustar el ancho de las columnas
        worksheet.columns.forEach((column, index) => {
        column.width = encabezadoExcel[index].length < 20 ? 20 : encabezadoExcel[index].length;
        });

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        saveAs(blob, "Plantilla Carga de Asignaciones CTS.xlsx");
    };

    const handleLimpiezaResultado = () => {
        setIsLoading(false);
        setIsLoadingCompleted(false);
        setErrores([]);
    };

    const handleSubmit = async () => {
       
        setIsLoading(true);
        setIsLoadingCompleted(false);
        
        const {empresa, cenco, archivo} = valores

        const formData = new FormData();
        formData.append("cod_metodo", "ASIGNACION_CTS");
        formData.append("cod_empresa", empresa.cod_empresa);
        formData.append("cod_cc", cenco.cod_cc);
        formData.append("archivo", archivo);

        const cargaMasivaURL = "/api/appweb/orquestador-cargas-masivas";
        let response = await api.post(cargaMasivaURL, formData, {
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

    const empresas_ = useMemo(
        () =>
          empresas.data?.map((item) => ({
            ...item,
            value: item.cod_empresa.toString(),
            label: item.nombre_emp,
          })),
        [empresas.data],
    );
    
    const cencos_ = useMemo(() => {
        if (valores?.empresa) {
          return cencos.data
            ?.filter((cenco) => cenco.cod_empresa_cc == valores.empresa.value)
            ?.map((item) => ({
              ...item,
              value: item.cod_cc.toString(),
              label: item.nombre_cc,
            }));
        }
        return [];
    }, [valores?.empresa, cencos.data]);

    const inputs = useMemo(
        () => [
            {
                id: "empresa",
                label: "Empresa",
                val: valores?.empresa || null,
                tipo: "select",
                size: 6,
                readonly: false,
                options: empresas_,
                requerido: true,
            },
            {
                id: "cenco",
                label: "Centro de Costo",
                val: valores?.cenco || null,
                tipo: "select",
                size: 6,
                readonly: false,
                options: cencos_,
                requerido: true,
            },
            {
                tipo: 'archivo2',
                label: 'Archivo',
                id: 'archivo',
                val: valores.archivo_excel,
                acceptedFiles: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
                requerido: true,
                multiple: false,
                icono: "c-excel",
                size: 6
            },
        ],
        [valores, empresas_, cencos_],
    );

    return (
        <Grid display="flex" flexDirection="column" gap={2} mt={2}>
        <Grid container columns={12}>
            <Button variant="contained" component="label" startIcon={<Icon sx={{ mr: 1 }} className="c-descargar" />} onClick={handleDescargarPlantilla} sx={{ width: "fit-content" }}>
            Descargar Plantilla
            </Button>
        </Grid>

        <FormularioComponent
            inputs={inputs}
            onInput={({ id, val }) => {
                setValores((inp) => ({ ...inp, [id]: val }));
                setState(state + 1);
            }}
            botones={{
                agregar: { visible: false },
                editar: { visible: false },
                limpiar: { visible: isLoadingCompleted, onClick: handleLimpiezaResultado },
                enviar: { visible: true, readonly: isLoading, onClick: handleSubmit },
            }}
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
                    filename={`reporte_carga_asignaciones_cts_${moment().unix()}`}
                    id="CompletadoCargaMasiva"  height="100%"
                    data={completados.map((t) => ({ tarifa: `${t}` }))} 
                    columnas={[{ label: "Modificaciones", column: "tarifa" }]} 
                />
                <TablaDetallesComponent 
                    descargar={true}
                    filename={`reporte_errores_asignaciones_cts_${moment().unix()}`}
                    id="ErroresCargaMasiva"  height="100%"
                    data={errores.map((e) => ({ errorMessage: e }))} 
                    columnas={[{ label: "Errores de Carga", column: "errorMessage" }]} 
                />
            </Box>
            ) : ( 
            <Box display="flex" flexDirection="column" gap={2}>
                <BandaAlertaComponent tipo="success" sx={{ mt: 2, mb: 2 }}>
                    Carga masiva de asignaciones completada exitosamente sin errores.
                </BandaAlertaComponent>
                <TablaDetallesComponent 
                    descargar={true}
                    filename={`reporte_carga_asignaciones_cts_${moment().unix()}`}
                    id="ErroresCargaMasiva"  height="100%"
                    data={completados.map((t) => ({ tarifa: `${t}` }))} 
                    columnas={[{ label: "Modificaciones", column: "tarifa" }]} 
                />
            </Box>
            ))}
        </Grid>
    );
};

export default FormularioCargaAsignacionCTS;
