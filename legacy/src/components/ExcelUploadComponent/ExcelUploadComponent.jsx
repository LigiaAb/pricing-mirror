import { useState, forwardRef, useImperativeHandle, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Box, Button, Icon } from '@mui/material';
import TabComponent from '../Tabs/TabComponent';
import LoaderComponent from '../Loader/LoaderComponent';
import ExcelLoaderComponent from './components/ExcelLoaderComponent/ExcelLoaderComponent';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';


const TabContainer = ({ children, height = { xs: '300px', md: '400px' } }) => {
    return (
        <Box sx={{ height }}>
            {children}
        </Box>
    );
};

TabContainer.propTypes = { 
    children: PropTypes.node.isRequired,
    height: PropTypes.oneOfType([PropTypes.number, PropTypes.string, PropTypes.object])
};



const ExcelUploadComponent = ({ 
    columnas, 
    onUpload, 
    height
}, ref) => {
	const [filas, setFilas] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const defaultUploadStatus = {
        filasCorrectas: [],
        filasErroneas: [],
        erroresPorFila: {}
    };
    const [log, setLog] = useState('');
    const [uploadStatus, setUploadStatus] = useState(defaultUploadStatus);
	const [isUploadDisabled, setIsUploadDisabled] = useState(false);
	
	useEffect(() => {
        let log = '';
        for (const [rowNumber, data] of Object.entries(uploadStatus.erroresPorFila)) {
            const { fila, errores } = data;
            delete fila._rowNumber;

            log += `-- Error --\n`;
            log += `No. Fila en Excel: ${rowNumber}\n`;
            log += `Fila: ${columnas.map(c => fila[c.campo]).join(', ')}\n`;
            log += 'Errores:\n';
            errores.forEach(err => {
                log += `  - ${err}\n`;
            });

            log += '\n';
        }
        setLog(log);
    }, [defaultUploadStatus.erroresPorFila, columnas, uploadStatus.erroresPorFila]);

	const [tab, setTab] = useState(1);
    const [logsDisabled, setLogsDisabled] = useState(true);



	const handleUpload = async (data) => {
        setUploadStatus(prev => ({
            ...prev,
            ...data
        }));
        setIsLoading(true);
        setLogsDisabled(false);
        setTab(2);
        await onUpload(data);
		setIsUploadDisabled(true);
		setIsLoading(false);
    };


	const handleReset = () => {
        setFilas([]);
        setUploadStatus(defaultUploadStatus);
        setLogsDisabled(true);
		setIsUploadDisabled(false);
        setTab(1);

    };


	const handleDownloadFilasErroneas = async () => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Datos');
      
        const headers = columnas.map(col => col.label);
        worksheet.addRow(headers);
      
        uploadStatus.filasErroneas.forEach(f => {
          const row = columnas.map(c => f[c.campo]);
          worksheet.addRow(row);
        });
      
        // Ajustar el ancho de las columnas
        worksheet.columns.forEach((column, index) => {
          column.width = headers[index].length < 20 ? 20 : headers[index].length;
        });
      
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(blob, 'FilasErroneas.xlsx');
    };


	const handleDownloadLog = () => {
        let resumen = `Registros Procesados Correctamente: ${uploadStatus.filasCorrectas.length}\n`;
        resumen += `Registros con Errores: ${uploadStatus.filasErroneas.length}\n\n`;
        const blob = new Blob([resumen + log], { type: 'text/plain' });
        saveAs(blob, 'LogErrores.txt');
    };

	
	useImperativeHandle(ref, () => ({
        handleReset,
        uploadStatus,
        setUploadStatus
    }));


	const tabs = [
		{
			id: 1,
			label: 'Carga',
			icono: 'c-cargar',
			disabled: false,
			content: (
                <TabContainer height={height}>
                    <ExcelLoaderComponent
                        columnas={columnas}
                        filas={filas}
                        setFilas={setFilas}
                        onUpload={handleUpload}
                        onReset={handleReset}
                        disabled={isUploadDisabled}
                    />
                </TabContainer>
			)
		},
		{
			id: 2,
			label: 'Logs',
			icono: 'c-documento',
			disabled: logsDisabled,
			content: (
				<TabContainer height={height}>
					{
						isLoading ? (
                            <Box sx={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                <LoaderComponent sx={{ position: 'block' }} texto='Se esta subiendo el excel provisto'/>
                            </Box>
                        ): (
							<Box display='flex' flexDirection='column' gap={2} height='100%'>
								<Box display='flex' flexWrap='wrap' gap={1}>
									<Button
										variant='contained'
										color='primary'
										startIcon={<Icon className='c-descargar' />}
										sx={{ width: { xs: '100%', md: 'auto' } }}
										onClick={handleDownloadFilasErroneas}
									>
										Descargar Filas No Procesados

									</Button>

									<Button
										variant='contained'
										color='primary'
										startIcon={<Icon className='c-descargar' />}
										sx={{ width: { xs: '100%', md: 'auto' } }}
										onClick={handleDownloadLog}
									>
										Descargar Log de Errores
									</Button>

									<Button
										variant='contained'
										color='primary'
										startIcon={<Icon className='c-actualizar' />}
										sx={{ width: { xs: '100%', md: 'auto' } }}
										onClick={handleReset}
									>
										Nueva Importación
									</Button>
								</Box>


								<Box 
                                    sx={{
                                        height: '100%',
                                        overflowY: 'auto',
                                        bgcolor: '#000',
                                        color: 'error.main',
                                        fontFamily: 'monospace',
                                        fontSize: '0.9rem',
                                        p: 4,
                                        mb: 2
                                    }}
                                >   
                                    <Box sx={{ color: 'success.main' }}>
                                        Registros Procesados Correctamente: {uploadStatus.filasCorrectas.length}
                                    </Box>
                                    
                                    <Box sx={{ color: 'error.main' }}>
                                        Registros con Errores: {uploadStatus.filasErroneas.length}
                                    </Box>
        
                                    <br/>
        
                                    <pre> {log} </pre>
                                </Box>
							</Box>
						)
					}
				</TabContainer>
			)
		}
	];

	return (
        <Box sx={{
            width: '100%',
            bgcolor: '#f1f2f3',
            borderRadius: 1,
            typography: 'body1',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            padding: 2
        }}>
			<TabComponent
				opciones={tabs}
				tabInicial={tab}
				sx={{ position: 'block' }}
			/>
		</Box>
	);
};


const ForwardedExcelUploadComponent = forwardRef(ExcelUploadComponent);


ExcelUploadComponent.propTypes = {
	columnas: PropTypes.array,
	onUpload: PropTypes.func,
    height: PropTypes.oneOfType([PropTypes.number, PropTypes.string, PropTypes.object])
};


export default ForwardedExcelUploadComponent;
