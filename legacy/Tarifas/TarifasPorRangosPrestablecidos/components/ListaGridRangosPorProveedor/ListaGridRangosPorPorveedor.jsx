import { Box, Tooltip, Typography, Icon } from '@mui/material';
import PropTypes from 'prop-types';
import FormularioCalculoRango from '../../../Calculo/FormularioCalculoRango';
import { useFetchAllEntidades } from '../../../../../hooks/Fetch/useFetchEntidades';

const ListaGridRangosPorPorveedor = ({
	tarifasConRutas = [],
}) => {
	const proveedoresResonse = useFetchAllEntidades(['proveedores'], { cod_estado: 1, tipo_entidad: 'PROVEEDOR' }, {}, ['PROVEEDOR']);
	const proveedores = proveedoresResonse.data?.data || []; 

	return (
		<Box display='flex' flexDirection='column' gap={2} sx={{ py: 2}}>
			{
				tarifasConRutas.map(tarifa => (
					<>
						<Box sx={{ display: 'flex', gap: 3 }}>
							<Tooltip title='Tarifa'>
								<Box sx={{ display: 'flex', alignItems: 'center', color: 'primary' }}>
									<Icon sx={{ mr: 1 }} className='c-documento' />
									<Typography variant='h6'>{tarifa.nombre}</Typography>
								</Box>
							</Tooltip>

							<Tooltip title='Proveedor'>
								<Box sx={{ display: 'flex', alignItems: 'center', color: 'primary' }}>
									<Icon sx={{ mr: 1 }} className='c-usuario' />
									<Typography variant='h6'>{proveedores.find(p => p.entidad_id === tarifa.entidad_id)?.entidad_nombre}</Typography>
								</Box>
							</Tooltip>
						</Box>

						<FormularioCalculoRango
							key={tarifa.metodo.cod_metodo}
							metodo={tarifa.metodo}
						/>
					</>
				))
			}
		</Box>
	);
};


ListaGridRangosPorPorveedor.propTypes = {
	tarifasConRutas: PropTypes.array
};


export default ListaGridRangosPorPorveedor;
