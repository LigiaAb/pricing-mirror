import React, { useState } from 'react';
import jsPDF from 'jspdf';
import image from "../../../../assets/logo-cropa-dsv-1024x205.png";

const calcularTamanoImagen = (anchoDeseado, altoDeseado) => {
  const image = {
    width: 20,
    height: 3.7,
  };

  if (anchoDeseado) {
    const alto = (image.height / image.width) * anchoDeseado;
    return alto;
  }
  if (altoDeseado) {
    const ancho = (image.width / image.height) * altoDeseado;
    return ancho;
  }
};

const generarPDF = (pdfData, pdfItems = [], pdfOpcionales = [], pdfCriterios =[]) => {

    const doc = new jsPDF(pdfData.horizontal ? "l" : "p", "pt", pdfData.tamano || "letter");
    let opcionesGuardadas = [];
    let margins = {
        top: 210,
        bottom: 50,
        left: 10,
        width: 610
    };



    const transportes = [
        {
            id: 1,
            transporte: "Aereo",
            condiciones: ["CONDICIONES GENERALES: ",
                // "· Sugerimos revisar la oferta y confirmar la tarifa antes de realizar su envío.",
                // "· Esta cotización tiene vigencia de 15 días, y puede estar sujeta a cambios",
                "· Esta cotización no es un contrato de transporte, las condiciones generales, incluyendo limitaciones de responsabilidad, se encuentran establecidas en los documentos de transporte Cartas de Porte, Bill of Loading, Air Way Bill, en el reverso.",
                // "· Oferta basada en datos estimados proporcionados por el cliente, pueden variar al momento de la operación, por cambios en peso - volumen o condiciones del mercado.",
                "· De acuerdo con las Regulaciones Internacionales de Embalaje NIMF 15, todo embalaje o tarima de madera debe ser fumigado con Tratamiento Térmico y contar con el sello correspondiente.",
                "· Cobertura: La carga debe transportarse asegurada, de lo contrario cualquier eventualidad durante su transporte será manejado de acuerdo a las limitaciones de responsabilidad del transportista, las cuales se encuentran detalladas en el reverso del documento de embarque y en donde constan los limites máximos de responsabilidad en caso de cualquier tipo de siniestro.",
                '· La exportación de producto peligroso está sujeto a los Convenios Internacionales vigentes, su manejo puede considerar costos, tiempos adicionales y su aceptación queda a reserva del operador del transporte, sin responsabilidad para Cropa, S.A. y sus transportistas.',
                // '· Esta cotización no incluye almacenajes, revisiones, multas y otros gastos tanto en origen como en destino (impuestos, demoras, estadías, parqueos, fletes falsos, roleos, cancelaciones, división de embarques, custodias o patrullas)',
                '· Los embarques al cobro se realizan a través de las oficinas de DSV en destino, previa autorización del consignatario.',
                // '· La tarifa se encuentra sujeta a cambios sin previo aviso por variación en el costo de los combustibles',
                '· Cropa, S.A. no se hará bajo ninguna circunstancia responsable, en caso de cualquier incautación y/u orden de secuestro por parte de autoridades gubernamentales e internacionales, y solamente dará aviso lo antes posible al cliente y exonera a Cropa, S.A. de toda responsabilidad penal, civil, administrativa, aduanal e internacional.',
                '· Cropa S.A no se hará responsable del pago de las demoras en origen y/o destino por situaciones fuera de control como y no limitado a tema de aduanas y otros que no sean responsabilidad directa de la empresa .',
                '· La mercadería deberá ser presentado con un embalaje apto para su transporte, Cropa, S.A se reserva el derecho de rechazar cualquier mercadería que no cumpla con los requisitos establecidos y no será responsable por cualquier cobro que se genere por tal rechazo',
                '· Cualquier reclamo se deberá presentar por escrito dentro de un plazo máximo de 7 dias contados a partir de la recepcion de las cargas, adjuntando toda la documetación pertinente para ser colocada ante la aseguradora.',
                '                ',
                'CONDICIONES ESPECIFICAS PARA EL SERVICIO AEREO',
                '· Confirmar reservas con 24 horas de anticipación.',
                '· Combex In otorga un máximo de 3 días libres de almacenaje.',
                '· Sugerimos cotizar el servicio MUST GO o contrato PREMIUM para la carga urgente o que deba de ser entregada en una fecha específica.',
                '',
                'DOCUMENTOS NECESARIOS PARA LOS TRÁMITES DE EXPORTACIÓN',
                '· Hoja de Instrucción de Embarque.',
                '· Copia de factura de electrónica (FEL) emitida en USD y con Incoterm.',
                '· Copia de lista de empaque.',
                '· Hoja de seguridad del producto, si el mismo es considerado peligroso para el transporte.',
                '· EUR1 en caso trasporte a Europa',
                '· Fito en caso de ser Perecedero',
                '',
                'CLAUSULA DE EXONERACION DE RESPONSABILIDAD',
                'Se hace constar que es de conocimiento y total aceptación del cliente, que Cropa, S.A. no responderá bajo ninguna circunstancia, por ningún daño que afecte la carga del cliente, sea este por desorden público, manifestaciones, violencia común, reuniones ilícitas, disturbios populares, pandemias o cualquier desorden de tipo civil o penal, por lo que se exonera de responsabilidad civil, penal, aduanal y administrativa ocurrida dentro del territorio y fronteras a Cropa, S.A. y a los transportistas que se contraten para cubrir el servicio respectivo. Por lo que se le sugiera revisar si su póliza de seguro o cobertura de mercadería, cubre los hechos y actividades indicadas anteriormente',
                '',
                'Por favor devolver sellada y firmada la presente cotización.',
                '',
                'Atentamente,',
                '',
                'Cropa, S.A.',
                '',
                'Exportaciones']
        },
        {
            id: 2,
            transporte: "Maritimo",
            condiciones: ['CONDICIONES GENERALES',
                '· Sugerimos revisar la oferta y confirmar la tarifa antes de realizar su envío.',
                '· Esta cotización tiene vigencia de 15 días, y puede estar sujeta a cambios',
                '· Oferta basada en datos estimados y que fueron proporcionados por el cliente, y que pueden variar al momento de la operación, por cambios en peso - volumen o condiciones del mercado o algún evento de fuerza mayor.',
                '· De acuerdo con las Regulaciones Internacionales de Embalaje NIMF 15, todo mbalaje o tarima de madera debe ser fumigado con Tratamiento Térmico y contar con el sello correspondiente.',
                '· Cobertura: La carga debe transportarse asegurada, de lo contrario cualquier eventualidad durante su transporte será manejado de acuerdo a las limitaciones de responsabilidad del transportista las cuales se encuentan detalladas en el reverso del documento de embarque.',
                '· La exportación de producto peligroso está sujeto a los Convenios Internacionales vigentes, y su manejo puede considerar costos, tiempos adicionales y su aceptación queda a reserva deloperador del transporte, sin responsabilidad de ningún tipo para Cropa, S.A.',
                '· Esta cotización no incluye costos por almacenajes, revisiones, multas y otros gastos tanto en origen como en destino (impuestos, demoras, estadías, parqueos, fletes falsos, roleos, cancelaciones, división de embarques, custodias o patrullas)',
                '· Los embarques al cobro se realizan a través de las oficinas de DSV en destino, previa autorización del consignatario.',
                '· La tarifa se encuentra sujeta a cambios sin previo aviso por variación en el costo de los combustibles (bunker/BAF)',
                '· Cropa, S.A. no se hará bajo ninguna circunstancia responsable, en caso de cualquier incautación y/u orden de secuestropor parte de autoridades gubernamentales e internacionales, y solamente dará aviso lo antes posible al cliente y exonera a Cropa, S.A. de toda responsabilidad penal, civil, administrativa, aduanal e internacional.',
                '· Cropa S.A no se hará responsable del pago de las demoras en origen y/o destino por situaciones fuera de control comoy no limitado a tema de aduanas y otros que no sean responsabilidad directa de la empresa .',
                '· La mercadería deberá ser presentado con un embalaje apto para su transporte, Cropa, S.A se reserva el derecho de rechazar cualquier mercadería que no cumpla con los requisitos establecidos y no será responsable por cualquier cobro que se genere por tal rechazo',
                '· Cualquier reclamo se deberá presentar por escrito dentro de un plazo máximo de 7 días contados a partir de la recepción de las cargas, adjuntando toda la documentación pertinente para ser colocada ante la aseguradora.',
                '',
                'CONDICIONES ESPECIFICAS PARA EL SERVICIO MARITIMO',
                '· Por restricción guatemalteca la capacidad de peso máxima por contenedor es de 20 toneladas. De 20 a 25 toneladas máximo se puede transportar utilizando chasís de 03 ejes, con el recargo adicional correspondiente.',
                '· Se debe considerar el pago por selectivo en puero por contenedor (aplica si SAT genera Selectivo Rojo. Estas tarifas se podrán otorgar cuando esto aplique.',
                '· Cualquier transferencia tiene un recargo de USD 30.00 y este debe de ser cancelado por el embarcador, consignatario o exportador.',
                '· Toda carta de corrección tiene un costo especifico establecido por el Carrier. Este cobro será asumido por el exportador, embarcador o consignatario',
                '· La programación será coordinada según las políticas del Carrier contratado, de acuerdo al itinerario de la naviera, y el mismo puee ser cambiado a discreción de la misma sin responsabilidad alguna.',
                '· Cropa, S.A. no se responsabiliza por tiempos de carga adicionales a los proporcionados por la naviera y la cancelación de los buques, ya que estos serigen de acuerdo a las disposiciones y recargo de la línea naviera.',
                '· La programación será coordinada una semana antes de la salida del buque o de acuerdo al itinerario de la naviera.',
                '· Esta cotización no incluye gastos portuarios en destino THCD',
                '· Para embarques despachados como directo, el Carrier tiene la potestad de suspender el servicio en cualquier moment si el embarcado/consignatario tienen adeudo con el mismo, cualquier cargo que se genere es responsabilidad del embarcador o consignatario.',
                '· Los gastos generados por roleo de contenedor, son responsabildad del embarcador, consignatario o exportador.',
                '',
                'DOCUMENTOS NECESARIOS PARA LOS TRÁMITES DE EXPORTACIÓN',
                '· Hoja de Instrucción de Embarque.',
                '· Copia de factura de electrónica (FEL) emitida en USD  con Incoterm.',
                '· Copia de lista de empaque.',
                '· Hoja de seguridad del producto, si el mismo es considerado peligroso ara el transporte.',
                '',
                'CLAUSULA DE EXONERACION DE RESPONSABILIDAD',
                'Se hace constar que es de conocimiento y total aceptación del cliente, que Cropa, S.A. no responderá bajo ninguna circunstancia, por ningún daño que afecte la carga del cliente, sea este por desorden público, ordenes gubernamentales, incautaciones por autoridades, manifestaciones, violencia común, reuniones ilícitas, disturbios populares o cualquier desorden de tipo civil o penal, fuerza mayor o caso fortuito, por lo que se exonera de responsabilidad civil, penal, aduanal y administrativa ocurrida dentro del territorio y fronteras a Cropa, S.A. y a los transportistas que se contraten para cubrir el servicio respectivo. Por lo que se le sugiera revisar si su póliza de seguro o cobertura de mercadería, cubre los hechos y actividades indicadas anteriormente',
                'Por favor devolver sellada y firmada la presente cotización.',
                '',
                'Atentamente,',
                '',
                'Cropa, S.A.',
                '',
                'Exportaciones',]
        },
        {
            id: 3,
            transporte: "Terrestre",
            condiciones: ['CONDICIONES GENERALES:',
                '· Sugerimos revisar la oferta y confirmar la tarifa antes de realizar su envío.',
                '· Esta cotización tiene vigencia de 15 días, y puede estar sujeta a cambios',
                '· Oferta basada en datos estimados proporcionados por el cliente, pueden variar al momento de la operación, por cambios en peso - volumen o condiciones del mercado.',
                '· De acuerdo con las Regulaciones Internacionales de Embalaje NIMF 15, todo embalaje o tarima de madera debe ser fumigado con Tratamiento Térmico y contar con el sello correspondiente.',
                '· Cobertura: La carga debe transportarse asegurada, de lo contrario cualquier eventualidad durante su transporte será manejado de acuerdo a las limitaciones de responsabilidad del transportista las cuales se encuentran detalladas en el reverso del documento de embarque y en donde cosntan los limites maximos de responsabilidad en caso de cualquier tipo de siniestro.',
                '· La exportación de producto peligroso está sujeto a los Convenios Internacionales vigentes, su manejo puede considerar costos, tiempos adicionales y su aceptación queda a reserva del operador del transporte, sin responsabilidad para Cropa, S.A. y sus transportistas.',
                '· Esta cotización no incluye almacenajes, revisiones, multas y otros gastos tanto en origen como en destino (impuestos, demoras, estadías, parqueos, fletes falsos, roleos, cancelaciones, división de embarques, custodias o patrullas)',
                '· Los embarques al cobro se realizan a través de las oficinas de DSV en destino, previa autorización del consignatario.',
                '· La tarifa se encuentra sujeta a cambios sin previo aviso por variación en el costo de los combustibles',
                '· Cropa, S.A. no se hará bajo ninguna circunstancia responsable, en caso de cualquier incautación y/u orden de secuestro por parte de autoridades gubernamentales e internacionales, y solamente dará aviso lo antes posible al cliente y exonera a Cropa, S.A. de toda responsabilidad penal, civil, administrativa, aduanal e internacional.',
                '· Cropa S.A no se hará responsable del pago de las demoras en origen y/o destino por situaciones fuera de control como y no limitado a tema de aduanas y otros que no sean responsabilidad directa de la empresa .',
                '· La mercadería deberá ser presentado con un embalaje apto para su transporte, Cropa, S.A se reserva el derecho de rechazar cualquier mercadería que no cumpla con los requisitos establecidos y no será responsable por cualquier cobro que se genere por tal rechazo.',
                '',
                'CONDICIONES ESPECIFICAS PARA EL SERVICIO TERRESTRE',
                '· El recargo por demoras tienen un costo de USD150.00 por día o fracción.',
                '· Tomar en cuenta las restricciones máximas de peso para tránsito por carreteras en Centro América, dependiendo el tipo de equipo a utilizar (Camión: 7.5 Ton / Furgón: 20 Ton).',
                '· Para cancelar un servicio solicitado, lo debe de realizar con 24 horas de anticipación ala fecha de cargue, de lo contrario tendrá un recargo por movimiento en falso con un costo del 33% del valor del flete cotizado.',
                '',
                'DOCUMENTOS NECESARIOS PARA LOS TRÁMITES DE EXPORTACIÓN',
                '· Hoja de Instrucción de Embarque.',
                '· Copia de factura de electrónica (FEL) emitida en USD y con Incoterm.',
                '· Copia de lista de empaque.',
                '· Hoja de seguridad del producto, si el mismo es considerado peligroso para el transporte.',
                '',
                'CLAUSULA DE EXONERACION DE RESPONSABILIDAD',
                'Se hace constar que es de conocimiento y total aceptación del cliente, que Cropa, S.A. no responderá bajo ninguna circunstancia, por ningún daño que afecte la carga del cliente, sea este por desorden público, manifestaciones, violencia común, reuniones ilícitas, disturbios populares o cualquier desorden de tipo civil o penal, por lo que se exonera de responsabilidad civil, penal, aduanal y administrativa ocurrida dentro del territorio y fronteras a Cropa, S.A. y a los transportistas que se contraten para cubrir el servicio respectivo. Por lo que se le sugiera revisar si su póliza de seguro o cobertura de mercadería, cubre los hechos y actividades indicadas anteriormente',
                '',
                'Por favor devolver sellada y firmada la presente cotización.',
                '',
                'Atentamente,',
                '',
                'Cropa, S.A.',
                '',
                'Exportaciones']
        },
    ]

    const tipoTransporteSeleccionado = transportes[pdfData.tipo_transporte];
    // console.log("tipo seleccionado", tipoTransporteSeleccionado);
    // console.log("tipo transporte", pdfData.tipo_transporte)
    let pagina = 1;
    // let pagianT = Math.ceil(items.length / 10);

    let header = () => {
        doc.setTextColor("#BBB");
        doc.addImage(image, 'PNG', 330, 60, 250, calcularTamanoImagen(250)); // Ajusta la posición y tamaño

        // Texto bajo la imagen
        doc.setFontSize(6);
        doc.setTextColor("#BBB");
        doc.text(`3ra. Calle 6-70, Zona 13, Pamplona`, 405, 110);
        doc.text(`Tels.: +(502) 2259-0600 / 2474-9000`, 404, 118);
        doc.text(`informacion@cropa.com.gt`, 418, 124);

        // Fecha, referencias
        doc.setFontSize(7.5);
        doc.setFont("Helvetica", "normal");
        doc.setTextColor("#000");
        doc.text(`Fecha:`, 15, 22);
        doc.text(`Referencia:`, 15, 32);
        // doc.text(`Pagina:`, 160, 22); 
        // doc.text(`Version:`, 160, 32);

        doc.setTextColor("#4184C5");
        doc.text(`${pdfData.fechaActual}`, 75, 22);
        doc.text(`${pdfData.centroCosto}-${pdfData.ano}-${pdfData.codCotizacion}`, 75, 32);
        doc.text(`${pdfData.version}`, 200, 32);
        // doc.text(`${pagina}`, 203, 22);

        doc.setDrawColor("#00205b");
        doc.setFillColor("#00205b");
        doc.rect(5, 40, 290, 0.7, "F");

        // Señores
        doc.setFont("Helvetica", "normal");
        doc.setTextColor("#000");
        doc.text(`Cliente:`, 15, 52);
        doc.text(`Señores:`, 15, 62);
        doc.setFontSize(7.17);

        const linesSeñores = doc.splitTextToSize(`Es un placer presentra a su consideracion nuestra cotizacion de trasnporte internacional de carga.`, 285);
        doc.text(linesSeñores,15,75)
        doc.setFontSize(7.5);

        doc.setTextColor("#4184C5");
        doc.text(`${pdfData.cliente}`, 75, 52);
        doc.text(`${pdfData.contacto || " "}`, 75,62)

        doc.setDrawColor("#00205b");
        doc.setFillColor("#00205b");
        //correr hacia abajo
        doc.rect(5, 90, 290, 0.7, "F");

        // Continuación
        doc.setFont("Helvetica", "normal");
        doc.setTextColor("#000");
        doc.text(`A continuación se encontrará nuestras tarifas para su exportación desde:`, 15, 100);
        doc.text('Origen: ',15,110);
        doc.text('Destino: ', 15, 120);
        doc.setTextColor("#4184C5");
        doc.setFontSize(6.5);

        // doc.text(`${pdfData.paisOrigen},${pdfData.origen}, hacia ${pdfData.destino},${pdfData.paisDestino}`, 15, 95);

        doc.text(`${pdfData.origen}, ${pdfData.paisOrigen.toUpperCase()}`, 50, 110);
        doc.text(`${pdfData.destino}, ${pdfData.paisDestino.toUpperCase()}`, 50, 120);

        
        // const lines = doc.splitTextToSize(`${pdfData.origen}, ${pdfData.paisOrigen.toUpperCase()} hacia ${pdfData.destino}, ${pdfData.paisDestino.toUpperCase()}`, 295);
        // doc.text(lines, 150, 90, { align: "center" });
        doc.setFontSize(7.5);

        doc.setDrawColor("#00205b");
        doc.setFillColor("#00205b");
        doc.rect(5, 123, 290, 0.7, "F");

        // Servicio
        doc.setFont("Helvetica", "normal");
        doc.setTextColor("#000");
        doc.text(`Tipo de servicio:`, 15, 133);
        doc.setTextColor("#4184C5");

        // doc.text(`Servicio ${tipoTransporteSeleccionado.transporte}, ${pdfData.origen}, ${pdfData.paisDestino}`, 150, 126, {align: "center"});
        // const lines1 = doc.splitTextToSize(`SERVICIO ${tipoTransporteSeleccionado.transporte.toUpperCase()} , ${pdfData.tipoServicio.toUpperCase()}`, 295);
        const lines1 = doc.splitTextToSize(`${pdfData.tipoServicio.toUpperCase()}`, 295);
        doc.text(lines1, 150, 133, { align: "center" })

        const lines2 = doc.splitTextToSize(`${pdfData.observacionServicio}`, 280);
        doc.text(lines2,15,142);


        doc.setDrawColor("#00205b");
        doc.setFillColor("#00205b");
        doc.rect(5, 153, 290, 0.7, "F");

        // PESO, MASA, TARIFA
        doc.setFont("Helvetica", "normal");
        doc.setTextColor("#000");
        
        doc.text(`Peso Volumétrico`, 15, 163);
        doc.text(`Peso Real`, 125, 163);
        doc.text(`Chargeable Weight - CW`, 210, 163);
        
        // doc.text(`CW:`, 15, 143);
        // doc.text(`DUE AGENT:`, 90, 143);
        // doc.text(`FLETE:`, 170, 143);
        // doc.text(`KILOS:`, 200, 143);
        // doc.text(`LIBRA:`, 240, 143);
        
        // let xtemp = 15; 
        // let width = 280;
        // let indice = width/(pdfCriterios.length)
        // pdfCriterios.forEach((cri) => {
            // doc.setTextColor("#000");
            // doc.text(`${cri.criterio}`, xtemp, 143);
            doc.setTextColor("#4184C5");
            doc.text(`${pdfData.pesoVolumetrico} kg`, 45, 173, {align: "center"});
            doc.text(`${pdfData.pesoReal} kg`, 142, 173, {align: "center"});
            doc.text(`${pdfData.chargeWeight} kg`, 250, 173, {align: "center"});
            // doc.text(`${cri.valor || "N/D"}`, xtemp, 153);
        // // doc.text(`${pdfData.tarifa}`, 235, 153);
        // xtemp += indice;
        // })
        // doc.text(`${pdfCriterios.valor[0]}`, 25, 153);

        doc.setDrawColor("#00205b");
        doc.setFillColor("#00205b");
        doc.rect(5, 183, 600, 0.7, "F");

        // Descripción, Monto
        doc.setFont("Helvetica", "normal");
        doc.setTextColor("#000");
        doc.text(`Descripción:`, 15, 193);
        doc.text(`Moneda:`, 495, 193);
        doc.text(`Monto:`, 565, 193,{align:"right"});

    };

    let footer = (isLastPage = false) => {
        doc.setDrawColor("#00205b");
        doc.setFillColor("#00205b");
        doc.rect(305, 635, 0.7, 270, "F");

        // Texto principio derecha
        // doc.setFontSize(6);
        // doc.setFont("Helvetica", "normal");
        // doc.setTextColor("#00205b");
        // doc.text(`TARIFAS EN EUROS SE FACTURARAN EN USD DOLARES AL TIPO DE CAMBIO DEL DIA, MAS`, 320, 520);
        // doc.setFontSize(6);
        // doc.text(`0.05 PTS DE COTIZACIÓN REALIZADA EN BASE A PESO Y VOLUMEN PROPORCIONADOS.`, 320, 527);
        // doc.setFontSize(6);
        // doc.text(`SI ALGUNO DE ESTOS FACTORES VARIA, LA PRESENTE COTIZACIÓN PIERDE TOTAL VALIDEZ.`, 320, 534);

        // Titulo total izquierda
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor("#000");
        doc.text(`Total de gastos`, 15, 535);

        // Cuadro de totales
        
        if (isLastPage) {
            // Mostrar total
            if (totalQ === 0){
                
                doc.setDrawColor("#00205b");
                doc.setFillColor("#fff");
                doc.roundedRect(5, 540, 290, 50, 5, 5);
                
                doc.setFontSize(10);
                doc.setTextColor("#00205b");
                doc.text(`Total $: `, 15, 568);
                doc.setTextColor("#4184C5");
                doc.text(`${totalD.toFixed(2)}`, 55, 568);
                
            } else if(totalD === 0){

                doc.setDrawColor("#00205b");
                doc.setFillColor("#fff");
                doc.roundedRect(5, 540, 290, 50, 5, 5);
                
                doc.setFontSize(10);
                doc.setTextColor("#00205b");
                doc.text(`Total Q: `, 15, 568);
                doc.setTextColor("#4184C5");
                doc.text(`${totalQ.toFixed(2)}`, 55, 568);

            }else{

                doc.setDrawColor("#00205b");
                doc.setFillColor("#fff");
                doc.roundedRect(5, 540, 290, 50, 5, 5);
                
                doc.setFontSize(10);
                doc.setTextColor("#00205b");
                doc.text(`Total $: `, 15, 557);
                doc.setTextColor("#4184C5");
                doc.text(`${totalD.toFixed(2)}`, 55, 557);
                
                doc.setDrawColor("#00205b");
                doc.setFillColor("#00205b");
                doc.rect(5, 565, 290, 0.7, "F");

                doc.setFontSize(10);
                doc.setTextColor("#00205b");
                doc.text(`Total Q: `, 15, 580);
                doc.setTextColor("#4184C5");
                doc.text(`${totalQ.toFixed(2)}`, 55, 580);
                

            }


        }

        // Salidas
        doc.setFontSize(7.5);
        doc.setTextColor("#00205b");
        doc.text(`Salidas: `, 15, 610);
        doc.setTextColor("#4184C5");
        doc.text(`${pdfData.salidas}`, 55, 610);

        // Tiempo tránsito
        doc.setFontSize(7.5);
        doc.setTextColor("#00205b");
        doc.text(`Tiempo de Transito: `, 15, 625);
        doc.setTextColor("#4184C5");
        doc.text(`${pdfData.tiempoTransito}`, 95, 625);

        // Texto abajo
        doc.setFontSize(6.5);
        doc.setTextColor("#00205b");
        doc.text(`“Las tarifas y tiempos de tránsito podrán cambiar por razones de fuerza mayor, caso fortuito, `, 15, 640);
        doc.text(`pandemias, disposiciones gubernamentales y/o circunstancias fuera del control de CROPA, `, 15, 647);
        doc.text(`por lo cual se avisará al cliente para que proceda a autorizar previamente el servicio y/o tarifa, `, 15, 654);
        doc.text(`sin ningún tipo de indemnización o responsabilidad por parte de CROPA”.`, 15, 661);

        doc.setDrawColor("#00205b");
        doc.setFillColor("#00205b");
        doc.rect(5, 670, 290, 0.7, "F");

        // Valido
        doc.setFontSize(7.5);
        doc.setTextColor("#00205b");
        doc.text(`Valido al: `, 15, 680);
        doc.setTextColor("#4184C5");
        doc.text(`${pdfData.fechaVencimiento}`, 55, 680);

        doc.setDrawColor("#00205b");
        doc.setFillColor("#00205b");
        doc.rect(5, 700, 290, 0.7, "F");

        // Contacto:
        doc.setFontSize(7.5);
        doc.setTextColor("#00205b");
        doc.text(`Contacto Cropa DSV: `, 15, 710);
        doc.setTextColor("#4184C5");
        doc.text(`${pdfData.nombreCreador}`, 145, 740,{align:"center"});
        doc.text(`${pdfData.puestoCreador}`, 145, 750,{align:"center"});

        // Cuadro opcionales
        doc.setDrawColor("#00205b");
        doc.setFillColor("#fff");
        doc.roundedRect(305, 540, 300, 90, 5, 5);

        // Opcionales
        doc.setFontSize(7.5);
        doc.setTextColor("#00205b");
        doc.text(`Opcionales: `, 320, 550);

        let yPositionOp = 557;
        const maxWidthop = 270;
        // const itemsOpcionales = pdfOpcionales //.filter(item => item.opcion === "S");

        const detailsLines = doc.splitTextToSize(`${pdfData.opcionales}`,maxWidthop);
        doc.text(detailsLines,320,yPositionOp);
        

        // if (pdfOpcionales.length > 0) {
        //     itemsOpcionales.forEach((item) => {

        //         if (yPositionOp > 625) {
        //             !opcionesGuardadas.some(i => i.id === item.id) && opcionesGuardadas.push(item);
        //             return;
        //         }

        //         doc.setFontSize(6);
        //         doc.text(item.rubro || "", 320, yPositionOp);
        //         yPositionOp += 6;

        //         if (item.detalle) {
        //             const detailLines = doc.splitTextToSize(item.detalle, maxWidthop);
        //             detailLines.forEach((line) => {
        //                 doc.text(line, 320, yPositionOp);
        //                 yPositionOp += 5;
        //             });
        //         }

        //         // Imprimir monto
        //         doc.setFontSize(6);
        //         doc.text(`${item.moneda}${item.monto.toFixed(2)}`, 550, yPositionOp - 5);
        //         yPositionOp += 5;


        //     });
        // } else {
        //     doc.setFontSize(7.5);
        //     doc.text(`No hay items opcionales.`, 320, yPositionOp); // Mensaje si no hay opcionales
        // }

        // if (opcionesGuardadas.length > 0) {
        //     // Lógica para imprimir las opciones almacenadas en otra parte
        //     console.log("Opciones almacenadas:", opcionesGuardadas);
        // }

        // Texto largo de abajo a la derecha
        doc.setFontSize(7);

        const textoLargoAbajoDerecha = [
            `• *Sugerimos revisar la oferta y confirmar la tarifa antes de realizar su envío.`,
            `• *Esta cotización no incluye almacenajes, revisiones, multas y otros gastos tanto en origen como en destino (impuestos, demoras, estadías, parqueos, fletes falsos, roleos, cancelaciones, división de embarques, custodias o patrullas)`,
            // '• *Esta cotización no es un contrato de transporte, las condiciones generales, incluyendo limitaciones de responsabilidad, se encuentran establecidas en los documentos de transporte Cartas de Porte, Bill of Loading, Air Way Bill, en el reverso. ',
            '• *Las tarifas anteriores NO incluyen seguro, impuestos, trámites aduanales, o cualquier otrogasto extraordinario.',
            '• *Por políticas de CROPA, S.A., la carga debe transportarse Asegurada. Si usted cuenta con Cobertura de Seguro Internacional por favor indicarlo y firmar carta de Liberación de Responsabilidad. De lo contrario, se asegurará la mercadería desde origen con la Póliza Internacional de CROPA, S.A.',
            // '• *DSV se reserva el derecho de escoger la línea aérea, marítima o terrestre para cada Embarque.',
            '• *Estas tarifas NO aplican para carga peligrosa, con extra peso y/o extra dimensiones.',
            '• *En caso de existir algún gasto de manejo adicional en origen y/o en destino, les será facturado al costo',
            '• *Estas tarifas están sujetas a cambios sin previo aviso, dependiendo de las condiciones del mercado internacional.',
            '• *El Tiempo de Tránsito no incluye los días de espera para consolidación en aeropuertos o puertos de origen o trasbordo.',
            `• *La tarifa se encuentra sujeta a cambios sin previo aviso por variación en el costo de los combustibles`
            // '• *Estas tarifas han sido cotizadas en base al peso y volumen proporcionados, las cuales quedan sujetas a variación dependiendo el peso y volumen real de la mercadería.',
        ]
        let yTemp = 640
        const lineHeight = 7
        const lineWidth = 275
        textoLargoAbajoDerecha.forEach(i => {
            doc.text(i, 315, yTemp, { maxWidth: lineWidth, align: 'justify', lineHeightFactor: 1 })
            const lines = doc.splitTextToSize(i, lineWidth);
            lines.forEach(l => yTemp += lineHeight)
            yTemp += 0.5
        })
        doc.internal.write(0, "Tw")

        // doc.text("•", 310, 640, { maxWidth: 280, align: 'justify' });
        // doc.text(`*Esta cotización no es un contrato de transporte, las condiciones generales, incluyendo`, 315, 640,{ maxWidth: 280, align: 'justify' });
        // doc.text(`limitaciones de responsabilidad, se encuentran establecidas en los documentos de`, 315, 647,{ maxWidth: 280, align: 'justify' });
        // doc.text(`transporte Cartas de Porte, Bill of Loading, Air Way Bill, en el reverso.`, 315, 654,{ maxWidth: 280, align: 'justify' });

        // doc.text("•", 310, 661,{ maxWidth: 280, align: 'justify' });
        // doc.text(`*Las tarifas anteriores NO incluyen seguro, impuestos, trámites aduanales, o cualquier otro`, 315, 661,{ maxWidth: 280, align: 'justify' });
        // doc.text(`gasto extraordinario.`, 315, 668,{ maxWidth: 280, align: 'justify' });

        // doc.text("•", 310, 675,{ maxWidth: 280, align: 'justify' });
        // doc.text(`*Por políticas de CROPA, S.A., la carga debe transportarse Asegurada. Si usted cuenta con`, 315, 675,{ maxWidth: 280, align: 'justify' });
        // doc.text(`Cobertura de Seguro Internacional por favor indicarlo y firmar carta de Liberación de`, 315, 682,{ maxWidth: 280, align: 'justify' });
        // doc.text(`Responsabilidad. De lo contrario, se asegurará la mercadería desde origen con la Póliza`, 315, 689,{ maxWidth: 280, align: 'justify' });
        // doc.text(`Internacional de CROPA, S.A.`, 315, 696,{ maxWidth: 280, align: 'justify' });

        // doc.text("•", 310, 703,{ maxWidth: 280, align: 'justify' });
        // doc.text(`*DSV se reserva el derecho de escoger la línea aérea, marítima o terrestre para cada`, 315, 703,{ maxWidth: 280, align: 'justify' });
        // doc.text(`Embarque.`, 315, 710,{ maxWidth: 280, align: 'justify' });

        // doc.text("•", 310, 717,{ maxWidth: 280, align: 'justify' });
        // doc.text(`*Estas tarifas NO aplican para carga peligrosa, con extra peso y/o extra dimensiones.`, 315, 717,{ maxWidth: 280, align: 'justify' });

        // doc.text("•", 310, 724,{ maxWidth: 280, align: 'justify' });
        // doc.text(`*En caso de existir algún gasto de manejo adicional en origen y/o en destino, les será`, 315, 724,{ maxWidth: 280, align: 'justify' });
        // doc.text(`facturado al costo.`, 315, 731,{ maxWidth: 280, align: 'justify' });

        // doc.text("•", 310, 738,{ maxWidth: 280, align: 'justify' });
        // doc.text(`*Estas tarifas están sujetas a cambios sin previo aviso, dependiendo de las condiciones del`, 315, 738,{ maxWidth: 280, align: 'justify' });
        // doc.text(`mercado internacional.`, 315, 745,{ maxWidth: 280, align: 'justify' });

        // doc.text("•", 310, 752,{ maxWidth: 280, align: 'justify' });
        // doc.text(`*El Tiempo de Tránsito no incluye los días de espera para consolidación en aeropuertos o`, 315, 752,{ maxWidth: 280, align: 'justify' });
        // doc.text(`puertos de origen o trasbordo.`, 315, 759,{ maxWidth: 280, align: 'justify' });

        // doc.text("•", 310, 766,{ maxWidth: 280, align: 'justify' });
        // doc.text(`*Estas tarifas han sido cotizadas en base al peso y volumen proporcionados, las cuales`, 315, 766,{ maxWidth: 280, align: 'justify' });
        // doc.text(`quedan sujetas a variación dependiendo el peso y volumen real de la mercadería.`, 315, 773,{ maxWidth: 280, align: 'justify' });
    };

    let cotizacion = () => {


        let yPosition = margins.top;
        let tieneQuetzales = false;

        const addItemsToDoc = (pdfItems, moneda) => {
            doc.setTextColor("#00205b");
            const filteredItems = pdfItems.filter(item => item.moneda === moneda);
            // console.log("moneda", filteredItems);
            console.log("moneda", moneda)
            if (moneda !== "USD" && filteredItems.length > 0) {
                doc.setFontSize(8);
                doc.setFont("Helvetica", "bold"); // Cambiar la fuente a negrita
                doc.setTextColor("#000");
                // doc.text(`Gastos en destino`, 15, yPosition);
                yPosition += 15;
                tieneQuetzales = true;
                doc.setFont("Helvetica", "normal"); // Volver a la fuente normal
                doc.setTextColor("#00205b");
            }
            pdfItems.forEach((item, index) => {
                const maxWidth = 480 < margins.width ? 480 : margins.width;
                doc.setTextColor(index%2?"#00205b":"#000f2b");
                doc.setFontSize(7.5);
                doc.setFont("Helvetica", index%2?"normal":"normal"); 
                doc.text(item.rubro || "", 15, yPosition);
                
                doc.setFont("Helvetica", "italic"); // Volver a la fuente normal
                doc.setTextColor("#5e5e5e");
                
                if (item.detalle || item.rubro.toUpperCase() === "FLETE") {
                    let texto = item.detalle;
                    let textoDetalleTarifaParaFlete = pdfData.tarifa;
                    let textoDetallePesoParaFlete = pdfData.peso;
                    let string = [textoDetalleTarifaParaFlete || null, textoDetallePesoParaFlete|| null].filter(i => i).join(", ")
                    if (Array.isArray(item.detalle))
                        texto = [...(item.rubro.toUpperCase() === "FLETE" ? [{ detalle: textoDetalleTarifaParaFlete }, { detalle: textoDetallePesoParaFlete }] : []), ...(item.detalle)].filter(i => i.detalle || i.valor).map(i => i.detalle ? i.detalle : i.valor).join(", ");
                    else if (typeof item.detalle === "string")
                        texto = `${item.rubro.toUpperCase() === "FLETE" ? `${string}${ string.trim() == "" ? "" : ", " }` : ""}${item.detalle}`;
                    else
                        texto = `${item.rubro.toUpperCase() === "FLETE" ? `${string}` : ""}`;

                    // if (texto.endsWith(", ")) {
                    //     texto = texto.slice(0, -2); // Elimina la última coma y el espacio
                    // }
                    
                    if (texto.trim() !== "") {
                        yPosition += 10;
                        doc.setFontSize(7.5);
                        doc.text(doc.splitTextToSize(texto, maxWidth), 15, yPosition, {
                            align: "left",
                            maxWidth: maxWidth - 10,
                        });
                    }
                    yPosition += 10;
                    doc.setDrawColor("#cfcfcf");
                    doc.line( 15,yPosition,595,yPosition)

                } else {
                    yPosition += 10;
                    doc.setDrawColor("#cfcfcf");
                    doc.line(15,yPosition,595,yPosition)
                }
                doc.setFont("Helvetica", index%2?"normal":"normal"); // Volver a la fuente normal
                doc.setTextColor(index%2?"#00205b":"#000f2b");


                
                // Imprimir monto
                doc.setFontSize(7.5);
                doc.text(`${item.moneda}`,500,yPosition-10)
                doc.text(`${(item.monto||0).toFixed(2)}`, 565, yPosition - 10,{align:"right"});
                yPosition += 10;

                if (yPosition >= 460) {
                    doc.addPage();
                    pagina++;
                    yPosition = margins.top;
                }


            });
        };

        const totalD = pdfItems.filter(item => ["$", "USD"].includes(item.moneda)).reduce((acc, { monto }) => acc += monto, 0);
        const totalQ = pdfItems.filter(item => !["$", "USD"].includes(item.moneda)).reduce((acc, { monto }) => acc += monto, 0);
        const itemsDolares = pdfItems.filter(item => ["$", "USD"].includes(item.moneda));
        const itemsNoDolares = pdfItems.filter(item => !["$", "USD"].includes(item.moneda));

        addItemsToDoc(itemsDolares, "$");
        itemsNoDolares.length > 0 && addItemsToDoc(itemsNoDolares, itemsNoDolares[0].moneda);

        return { totalD, totalQ };
    };

    const { totalD, totalQ } = cotizacion();


    const totalPages = doc.internal.getNumberOfPages()

    for (let i = 1; i <= totalPages; i++) {
        doc.setFontSize(7.5);

        doc.setPage(i)
        doc.setTextColor("#4184C5");
        doc.text(`Página ${i} de ${totalPages}`, 290, 22, { align: "right" });

        doc.setTextColor("#000");
        doc.text(`Version:`, 160, 32);

        header();
        footer(i === (totalPages));

    }

    // header();
    // footer(true);
    pagina++;


    if (tipoTransporteSeleccionado) {
        const condicionesTexto = tipoTransporteSeleccionado.condiciones;
        const maxWidth = 500;
        const lineHeight = 12;

        const lines = doc.splitTextToSize(condicionesTexto, maxWidth);

        doc.addPage();

        doc.setFontSize(9);
        doc.setTextColor("#00205b");

        doc.text(`Condiciones para el transporte ${tipoTransporteSeleccionado.transporte}`, margins.width / 2, 30, { align: "center" });

        let yTemp = 40

        if (opcionesGuardadas.length > 0) {
            doc.text(`OPCIONES ADICIONALES ESCOGIDAS:`, 25, yTemp);

            yTemp += 10;

            opcionesGuardadas.forEach((item) => {
                doc.text(`- ${item.rubro}`, 25, yTemp);
                yTemp += 10;

                if (item.detalle) {
                    const detailLines = doc.splitTextToSize(item.detalle, 500);
                    detailLines.forEach((line) => {
                        doc.text(line, 30, yTemp);
                        yTemp += 7;
                    });
                }

                // Imprimir monto
                doc.text(`${item.moneda}${item.monto.toFixed(2)}`, 550, yTemp - 10);
                yTemp += 6;

            })
            yTemp += 6;
        }

        let cursorY = yTemp;
        const lineWidth = 550
        condicionesTexto.forEach(i => {
            doc.text(i, 30, yTemp, { maxWidth: lineWidth, align: 'justify', })
            const lines = doc.splitTextToSize(i, lineWidth);
            yTemp += (lines.length * doc.getLineHeight())
            if ((yTemp) > (doc.internal.pageSize.height - (margins.bottom))) {
                doc.addPage();
                yTemp = 50;
            }
        })
        doc.internal.write(0, "Tw")


        // for (const line of condicionesTexto) {
        //     const detailLines = doc.splitTextToSize(line, 500);
        //         detailLines.forEach((line) => {
        //         doc.text(line, 50, yTemp, {maxWidth: 500, align: "justify"});
        //         yTemp += 12;
        //         });
        //     if ((cursorY + lineHeight) > (doc.internal.pageSize.height-(margins.bottom+100))) {
        //         doc.addPage();
        //         cursorY = 20;
        //     }
        //     // doc.text(line.trim(), 15, cursorY);
        //     cursorY += lineHeight;
        // }
    }




    return doc.output("datauristring");
};


export default generarPDF;