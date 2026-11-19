import PropTypes from 'prop-types';


const FormularioCriterios = ({
	rubros = [],
}) => {
	return (
		<div>
			Formulario de Criterios
			{
				rubros.map((rubro, index) => (
					<div key={index}>
						{rubro.label}
					</div>
				))
			}
		</div>
	);
};

FormularioCriterios.propTypes = {
	rubros: PropTypes.array,
};


export default FormularioCriterios;