import { useState, useRef, useEffect } from 'react';
import { Box, Button, Icon } from '@mui/material';

const ErrorReportComponent = () => {
    const consoleRef = useRef(null);
    const [logs, setLogs] = useState([{ id: 1, message: 'Error 1' }, { id: 2, message: 'Error 2' }]);

    useEffect(() => {
        if (consoleRef.current) {
          consoleRef.current.scrollTop = consoleRef.current.scrollHeight
        }
    }, [logs])

	return (
		<Box display='flex' flexDirection='column' gap={1}>
			<Box display='flex' flexWrap='wrap' gap={1}>
				<Button
                    variant='contained'
                    color='primary'
                    startIcon={<Icon className='c-descargar' />}
                    sx={{ width: { xs: '100%', md: 'auto' } }}
                >
                    Descargar Filas No Procesados

				</Button>

				<Button
                    variant='contained'
                    color='primary'
                    startIcon={<Icon className='c-descargar' />}
                    sx={{ width: { xs: '100%', md: 'auto' } }}
                >
                    Descargar Log de Errores
				</Button>

				<Button
                    variant='contained'
                    color='primary'
                    startIcon={<Icon className='c-actualizar' />}
                    sx={{ width: { xs: '100%', md: 'auto' } }}
                >
                    Nueva Importación
                </Button>
			</Box>

			
            <Box 
                ref={consoleRef}
                sx={{
                    height: '300px',
                    overflowY: 'auto',
                    bgcolor: '#000',
                    color: 'error.main',
                    p: 2,
                    fontFamily: 'monospace',
                    fontSize: '0.9rem',
                    mb: 2
                }}
            >
                {
                    logs.map(log => (
                        <div key={log.id}>
                            {log.message}
                        </div>
                    ))
                }
            </Box>
		</Box>
	);
};

export default ErrorReportComponent;
