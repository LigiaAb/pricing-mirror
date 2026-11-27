const moment = require("moment-timezone");
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

dayjs.extend(utc);
dayjs.extend(timezone);

module.exports.fcropa_fecha_actual = async (fecha_recibe = false) =>{
    const hoy = fecha_recibe ? moment(fecha_recibe).tz('America/Guatemala') :  moment().tz('America/Guatemala');
    const fecha= hoy.format('YYYY-MM-DD');
    return fecha;
}

module.exports.fcropa_hora_actual = async () =>{
    //const hoy = moment().tz('America/Guatemala');
    //const hora= hoy.format('HH:mm:ss');

    const hora = dayjs().tz('America/Guatemala').format('HH:mm:ss');    
    return hora;
}

module.exports.fcropa_fecha_hora_actual = async () =>{
    //const hoy = moment().tz('America/Guatemala');
    //const fechahora= hoy.format('YYYY-MM-DD HH:mm:ss');
    const fechahora = dayjs().tz('America/Guatemala').format('YYYY-MM-DD HH:mm:ss');
    return fechahora;    
}