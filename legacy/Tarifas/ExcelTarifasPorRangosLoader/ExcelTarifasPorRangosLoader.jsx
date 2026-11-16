import { useRef } from 'react';
import { Box } from '@mui/material';
import ExcelUploadComponent from '../../../components/ExcelUploadComponent/ExcelUploadComponent';
import useColumnasExcelFletes from './hooks/useColumnasExcelFletes';

const ExcelTarifasPorRangosLoader = () => {
	const excelUploadRef = useRef(null);

	const columnas = useColumnasExcelFletes();

	const handleUpload = (filas) => {
		console.log('Filas subidas:', filas);
	};

	return (
		<Box>
			<ExcelUploadComponent
				ref={excelUploadRef}
				columnas={columnas}
				onUpload={handleUpload}
			/>
		</Box>
	);
};

export default ExcelTarifasPorRangosLoader;
