import { useCallback } from 'react';
import { api } from '../api';

/**
 * Hook personalizado para transferir datos de cotización a módulos de embarque
 * @param {number} embarqueId - ID del embarque creado
 * @param {object} datosCotizacion - Datos de la cotización
 * @returns {object} - Funciones de transferencia
 */
export const useTransferenciaDatosCotizacion = () => {
  
  // Función para transferir contactos de la cotización al embarque
  const transferirContactos = useCallback(async (embarqueId, datosCotizacion) => {
    let contactosTransferidos = 0;
    try {

      const contactos = [];

      // Exportador (Shipper) - Usar ENTIDADCONTACTO_ID de la cotización
      if (datosCotizacion.exportador || datosCotizacion.contactoExportador) {
        const entidadcontactoId = datosCotizacion.entidadcontacto_id || 
                                 datosCotizacion.datosCompletosCotizacion?.contacto?.entidadcontacto_id ||
                                 datosCotizacion.ENTIDADCONTACTO_ID;
        
        if (entidadcontactoId) {
          contactos.push({
            embarque_id: embarqueId,
            entidadcontacto_id: entidadcontactoId,
            instrucciones: 'Contacto Exportador transferido desde cotización',
            emb_legs_id: null // No es parte de un tramo específico
          });
        } else {
          console.warn('No se encontró ENTIDADCONTACTO_ID para Exportador');
        }
      }

      // Consignatario (Consignee) - Usar ENTIDADCONTACTO_ID de la cotización
      if (datosCotizacion.consignatario || datosCotizacion.contactoConsignatario) {
        const entidadcontactoId = datosCotizacion.entidadcontacto_id || 
                                 datosCotizacion.datosCompletosCotizacion?.contacto?.entidadcontacto_id ||
                                 datosCotizacion.ENTIDADCONTACTO_ID;
        
        if (entidadcontactoId) {
          contactos.push({
            embarque_id: embarqueId,
            entidadcontacto_id: entidadcontactoId,
            instrucciones: 'Contacto Consignatario transferido desde cotización',
            emb_legs_id: null // No es parte de un tramo específico
          });
        } else {
          console.warn('No se encontró ENTIDADCONTACTO_ID para Consignatario');
        }
      }

      // Notificados (Notify Party) - Usar ENTIDADCONTACTO_ID de la cotización
      if (datosCotizacion.notificados || datosCotizacion.contactoNotificados) {
        const entidadcontactoId = datosCotizacion.entidadcontacto_id || 
                                 datosCotizacion.datosCompletosCotizacion?.contacto?.entidadcontacto_id ||
                                 datosCotizacion.ENTIDADCONTACTO_ID;
        
        if (entidadcontactoId) {
          contactos.push({
            embarque_id: embarqueId,
            entidadcontacto_id: entidadcontactoId,
            instrucciones: 'Contacto Notificado transferido desde cotización',
            emb_legs_id: null // No es parte de un tramo específico
          });
        } else {
          console.warn('No se encontró ENTIDADCONTACTO_ID para Notificado');
        }
      }

      // Insertar contactos usando la API
      for (const contacto of contactos) {
        // Validar que el contacto tenga entidadcontacto_id
        if (!contacto.entidadcontacto_id) {
          console.warn(`Contacto no tiene entidadcontacto_id válido, omitiendo inserción:`, contacto);
          continue;
        }
        
        try {
          const response = await api.post('/api/appweb/insertar-coordinacion-contacto', contacto);
          contactosTransferidos++;
        } catch (error) {
          console.error('Error insertando contacto:', error);
          console.error('Datos enviados:', contacto);
          console.error('Respuesta del error:', error.response?.data);
        }
      }
      return contactosTransferidos;
    } catch (error) {
      console.error('Error en transferencia de contactos:', error);
      throw error;
    }
  }, []);

  // Función para transferir fechas de la cotización al embarque
  const transferirFechas = useCallback(async (embarqueId, datosCotizacion) => {
    try {

      const fechas = [];

      const tiposFecha = {
        153: { nom_tipo: "ESTIMATED TIME OF DEPARTURE", nomenclatura: "ETD" },
        155: { nom_tipo: "ESTIMATED TIME OF ARRIVAL", nomenclatura: "ETA" },
        205: { nom_tipo: "FECHA DE RECOLECCION", nomenclatura: null }
      };
      

      // FECHA DE RECOLECCION - Priorizar fecha del formulario web sobre fecha de cotización
      const fechaRecoleccion = datosCotizacion.fechaRecoleccionFormulario || 
                              datosCotizacion.fechaRecoleccion || 
                              datosCotizacion.fecha_recoleccion;
      
      if (fechaRecoleccion) {
        const tipoFechaRecoleccion = tiposFecha[205];
        fechas.push({
          embarque_id: embarqueId,
          nom_tipo: tipoFechaRecoleccion.nom_tipo, // "FECHA DE RECOLECCION"
          id_tipo_fecha: 205, // Código 205 para FECHA DE RECOLECCION
          fecha: fechaRecoleccion,
          observacion: `${tipoFechaRecoleccion.nom_tipo} transferida desde cotización`
        });
      } else {
        console.warn('No se encontró fecha de recolección en los datos');
      }

      // ETD (Estimated Time of Departure) - Fecha estimada de salida
      if (datosCotizacion.fechaSalida || datosCotizacion.etd) {
        const tipoFechaETD = tiposFecha[153];
        fechas.push({
          embarque_id: embarqueId,
          nom_tipo: tipoFechaETD.nom_tipo, // "ESTIMATED TIME OF DEPARTURE"
          id_tipo_fecha: 153, // ETD - Estimated Time of Departure
          fecha: datosCotizacion.fechaSalida || datosCotizacion.etd,
          observacion: `${tipoFechaETD.nomenclatura} transferida desde cotización`
        });
      }

      // ETA (Estimated Time of Arrival) - Fecha estimada de llegada
      if (datosCotizacion.fechaLlegada || datosCotizacion.eta) {
        const tipoFechaETA = tiposFecha[155];
        fechas.push({
          embarque_id: embarqueId,
          nom_tipo: tipoFechaETA.nom_tipo, // "ESTIMATED TIME OF ARRIVAL"
          id_tipo_fecha: 155, // ETA - Estimated Time of Arrival
          fecha: datosCotizacion.fechaLlegada || datosCotizacion.eta,
          observacion: `${tipoFechaETA.nomenclatura} transferida desde cotización`
        });
        // console.log('ETA agregada:', datosCotizacion.fechaLlegada || datosCotizacion.eta, 'Tipo:', tipoFechaETA.nom_tipo);
      }

      // Insertar fechas usando la API
      for (const fecha of fechas) {
        try {
          const fechaData = {
            ...fecha,
            estado_cod: 1 // Estado activo
          };
          // console.log('Enviando fecha a API:', fechaData);
          const response = await api.post('/api/appweb/insertar-coordinacion-fecha-mov', fechaData);
          console.log('Fecha insertada:', fecha.observacion, response.data);
        } catch (error) {
          console.error('Error insertando fecha:', fecha.observacion, error);
          console.error('Datos enviados:', fechaData);
          console.error('Respuesta del error:', error.response?.data);
        }
      }

      // console.log(`${fechas.length} fechas transferidas`);
      return fechas.length;
    } catch (error) {
      console.error('Error en transferencia de fechas:', error);
      throw error;
    }
  }, []);

  // Función para transferir datos de notificación del formulario instructivo
  const transferirNotificadorInstructivo = useCallback(async (embarqueId, datosCotizacion) => {
    try {
      // console.log('Transfiriendo notificador instructivo...');
      
      // Verificar si hay datos de notificación
      if (!datosCotizacion.notificarNombre && !datosCotizacion.notificarEmail) {
        console.log('No hay datos de notificación para transferir');
        return 0;
      }

      // PASO 1: Crear el contacto de entidad primero
      const entidadId = datosCotizacion.entidad?.value || datosCotizacion.entidadId || null;

      if (!entidadId) {
        console.error('No se encontró entidad_id para crear el contacto');
        return 0;
      }

      const nuevoContactoEntidad = {
        entidad_id: entidadId,
        cod_tipo: '1',
        entidadcontacto_nombre: datosCotizacion.notificarNombre || 'Notificador Instructivo',
        entidadcontacto_email: datosCotizacion.notificarEmail || '',
        entidadcontacto_telefono: '',
        cod_emp: '1',
        cod_cc: '2',
        cod_estado: '1',
        lista_cod_tipo: [215]
      };

      // console.log('Creando contacto de entidad:', nuevoContactoEntidad.entidadcontacto_nombre);

      let entidadcontactoId = null;

      try {
        const responseContacto = await api.post('/api/appweb/insertar-entidad-contacto', nuevoContactoEntidad, {
          headers: {
            'version_app': '0.0.2',
            'Content-Type': 'application/json',
          }
        });
        
        entidadcontactoId = responseContacto.data?.data?.entidadcontacto_id || 
                           responseContacto.data?.entidadcontacto_id ||
                           null;
        
        // console.log('Contacto de entidad creado - ID:', entidadcontactoId);

        if (!entidadcontactoId) {
          console.error('No se obtuvo entidadcontacto_id');
          return 0;
        }

      } catch (error) {
        console.error('Error al crear contacto de entidad:', error.message);
        if (error.response) {
          console.error('Response data:', error.response.data);
        }
        return 0;
      }

      // PASO 2: Crear el registro en coordinación contactos
      // console.log('Creando registro en coordinación contactos...');

      let instrucciones = 'FORMULARIO INSTRUCTIVO NOTIFICAR\n';
      if (datosCotizacion.notificarNombre) {
        instrucciones += `Nombre: ${datosCotizacion.notificarNombre}\n`;
      }
      if (datosCotizacion.notificarEmail) {
        instrucciones += `Email: ${datosCotizacion.notificarEmail}`;
      }

      const contactoNotificador = {
        embarque_id: embarqueId,
        entidadcontacto_id: entidadcontactoId,
        instrucciones: instrucciones.trim(),
        cod_tipo: 215,
        nom_tipo: 'NOTIFICADOR_INSTRUCTIVO'
      };
      
      try {
        const response = await api.post('/api/appweb/insertar-coordinacion-contacto', contactoNotificador);
        // console.log('Notificador instructivo insertado en coordinación');
        return 1;
      } catch (error) {
        console.error('Error al insertar en coordinación contacto:', error.message);
        if (error.response) {
          console.error('Response data:', error.response.data);
        }
        return 0;
      }
    } catch (error) {
      console.error('Error en transferirNotificadorInstructivo:', error);
      return 0;
    }
  }, []);

  // Función para transferir documentos de la cotización al embarque
  const transferirDocumentos = useCallback(async (embarqueId, datosCotizacion, documentosSubidos = null) => {
    try {
      // console.log('TRANSFIRIENDO DOCUMENTOS...');

      const documentos = [];

      // Documentos que ya fueron subidos en el formulario instructivo
      // Los documentos vienen en datosCotizacion con los campos archivo*
      const documentosSubidos = {
        archivoMsds: datosCotizacion.archivoMsds,
        archivoOtrosDocumentos: datosCotizacion.archivoOtrosDocumentos,
        archivoDeprex: datosCotizacion.archivoDeprex,
        archivoDuaComplementaria: datosCotizacion.archivoDuaComplementaria,
        archivoDuaSimplificada: datosCotizacion.archivoDuaSimplificada,
        archivoDuaDefinitiva: datosCotizacion.archivoDuaDefinitiva
      };
      
      console.log('DOCUMENTOS SUBIDOS EN FORMULARIO:', documentosSubidos);
      console.log('DEBUG - datosCotizacion archivos:', {
        archivoMsds: datosCotizacion.archivoMsds,
        archivoDeprex: datosCotizacion.archivoDeprex,
        todosLosCampos: Object.keys(datosCotizacion).filter(key => key.includes('archivo'))
      });
      
      if (documentosSubidos) {
        const documentosSubidosMapeo = [
          { campo: 'archivoMsds', tipo: 'MSDS', cod_tipo: 199 },
          { campo: 'archivoOtrosDocumentos', tipo: 'OTROS DOCUMENTOS COPRA', cod_tipo: 200 },
          { campo: 'archivoDeprex', tipo: 'DEPREX', cod_tipo: 201 },
          { campo: 'archivoDuaComplementaria', tipo: 'DUA COMPLEMENTARIA', cod_tipo: 202 },
          { campo: 'archivoDuaSimplificada', tipo: 'DUA SIMPLIFICADA', cod_tipo: 203 },
          { campo: 'archivoDuaDefinitiva', tipo: 'DUA DEFINITIVA', cod_tipo: 204 }
        ];

        // Procesar documentos subidos
        for (const doc of documentosSubidosMapeo) {
          const archivo = documentosSubidos[doc.campo];
          // console.log(`PROCESANDO DOCUMENTO ${doc.tipo}:`, archivo);
          
          if (archivo && archivo.uploaded && archivo.uploaded.ruta_archivo) {
            // Insertar en tabla de documentos de cotización
            try {
              const documentoCotizacion = {
                cod_cotizacion_cabecera: datosCotizacion.numeroCotizacion || datosCotizacion.cotizacion,
                cod_tip_doc: doc.cod_tipo,
                url_documento: archivo.uploaded.ruta_archivo,
                cod_estado: 1
              };

              console.log(`Insertando documento ${doc.tipo} en cotización:`, documentoCotizacion);
              await api.post('/api/appweb/insertar-cotizacion-documento', documentoCotizacion);
              // console.log(`Documento ${doc.tipo} insertado en cotización`);
            } catch (error) {
              console.error(`Error insertando documento ${doc.tipo} en cotización:`, error);
            }

            // También insertar en coordinación para compatibilidad
            const documentoParaInsertar = {
              embarque_id: embarqueId,
              cod_tipo_documento: doc.cod_tipo,
              ubicacion: 'COTIZACION',
              url_archivo: archivo.uploaded.ruta_archivo,
              descripcion: `${doc.tipo} - Transferido desde cotización`,
              estado_cod: 1,
              documento_id_coord: null
            };
            
            // console.log(`DOCUMENTO ${doc.tipo} PREPARADO PARA INSERTAR EN COORDINACIÓN:`, documentoParaInsertar);
            documentos.push(documentoParaInsertar);
          } else {
            console.log(`DOCUMENTO ${doc.tipo} NO TIENE ARCHIVO O RUTA VÁLIDA:`, archivo);
          }
        }
      }

      // Documentos adicionales de la cotización (si existen)
      if (datosCotizacion.documentos && Array.isArray(datosCotizacion.documentos)) {
        for (const doc of datosCotizacion.documentos) {
          if (doc.url_documento || doc.ruta_archivo) {
            documentos.push({
              embarque_id: embarqueId,
              cod_tipo_documento: doc.cod_tip_doc || 147, // FACTURA por defecto
              ubicacion: 'COTIZACION',
              url_archivo: doc.url_documento || doc.ruta_archivo,
              descripcion: `${doc.descripcion || 'Documento'} - Transferido desde cotización`,
              estado_cod: 1,
              documento_id_coord: null
            });
          }
        }
      }

      // Insertar documentos usando la API
      for (const documento of documentos) {
        try {
          // console.log('Enviando documento a API:', documento);
          const response = await api.post('/api/appweb/insertar-coordinacion-documento', documento);
          // console.log('Documento insertado:', documento.descripcion, response.data);
        } catch (error) {
          console.error('Error insertando documento:', documento.descripcion, error);
          console.error('Datos enviados:', documento);
          console.error('Respuesta del error:', error.response?.data);
        }
      }

      // console.log(`${documentos.length} documentos transferidos`);
      return documentos.length;
    } catch (error) {
      console.error('Error en transferencia de documentos:', error);
      throw error;
    }
  }, []);

  // Función principal para transferir todos los datos
  const transferirDatosCotizacionAEmbarque = useCallback(async (embarqueId, datosCotizacion, documentosSubidos = null) => {
    try {
      // console.log('Iniciando transferencia de datos al embarque', embarqueId);

      const resultados = {
        contactos: 0,
        fechas: 0,
        documentos: 0,
        notificadores: 0
      };

      // 1. TRANSFERIR CONTACTOS (PARTIES)
      resultados.contactos = await transferirContactos(embarqueId, datosCotizacion);

      // 2. TRANSFERIR FECHAS
      resultados.fechas = await transferirFechas(embarqueId, datosCotizacion);

      // 3. TRANSFERIR DOCUMENTOS
      resultados.documentos = await transferirDocumentos(embarqueId, datosCotizacion, documentosSubidos);

      // 4. TRANSFERIR NOTIFICADOR INSTRUCTIVO
      resultados.notificadores = await transferirNotificadorInstructivo(embarqueId, datosCotizacion);

      // console.log('Transferencia completada:', resultados);
      return resultados;
    } catch (error) {
      console.error('Error en transferencia de datos:', error);
      throw error;
    }
  }, [transferirContactos, transferirFechas, transferirDocumentos, transferirNotificadorInstructivo]);

  return {
    transferirDatosCotizacionAEmbarque,
    transferirContactos,
    transferirFechas,
    transferirDocumentos,
    transferirNotificadorInstructivo
  };
};
