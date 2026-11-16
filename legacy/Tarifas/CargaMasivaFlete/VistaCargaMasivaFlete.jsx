import ExcelTarifasPorRangosLoader from '../../../views/Tarifas/ExcelTarifasPorRangosLoader/ExcelTarifasPorRangosLoader';
import CargaMasivaFlete from '../../../views/Tarifas/CargaMasivaFlete/CargaMasivaFlete';

const VistaCargaMasivaFlete = ({actualizacion = false}) => {
	return (
		<>
			{/* <ExcelTarifasPorRangosLoader/> */}
			<CargaMasivaFlete actualizacion={actualizacion}/>
			{/* <ExcelUploadComponent /> */}
			{/* <ExcelTarifasPorRangosLoader /> */}
			{/* <CargaMasivaFlete /> */}
			{/* <ExcelUploadComponent /> */}
		</>
	);
};

export default VistaCargaMasivaFlete;
