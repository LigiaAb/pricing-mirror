const dayjs = require("dayjs");
const fs = require("fs");
const { jsPDF } = require("jspdf");
const moment = require("moment");
function getBase64(filePath) {
    const bitmap = fs.readFileSync(filePath);
    return Buffer.from(bitmap).toString("base64");
}
const image = getBase64("assets/logo-cropa-dsv-1024x205.png");

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

module.exports.generarPDFCotizacionIngles = async (props) => {

    let { pdfData, pdfItems = [], pdfOpcionales = [], pdfCriterios = [], guardarSFTP = false, copiaLocal = false, prepaid = false, collect = false, idioma = "es" } = props

    const doc = new jsPDF(pdfData.horizontal ? "l" : "p", "pt", pdfData.tamano || "letter");
    let opcionesGuardadas = [];
    let margins = {
        top: 230,
        bottom: 50,
        left: 10,
        width: 610
    };

    const transportes = [
        {
            id: 1,
            transporte: "Aereo",
            condiciones: [
                "CONDICIONES COMERCIALES: ",
                'La presente cotización tiene carácter informativo y no constituye un contrato definitivo de transporte. Las tarifas deberán ser confirmadas antes de coordinar cada embarque y estarán sujetas a disponibilidad de espacio y equipo por parte del transportista al momento de la reserva/booking.',
                'Las tarifas cotizadas no incluyen almacenajes, inspecciones, impuestos, aranceles, demoras de contenedor, sobreestadías, multas, demoras, estadías, cancelaciones, custodias, servicios extraordinarios ni cualquier otro cargo generado por autoridades, terminales, puertos, aeropuertos, navieras, aerolíneas o terceros. Todo gasto adicional imprevisible o incurrido para la preservación o despacho de la carga será facturado al costo correspondiente más gastos administrativos si aplicaren.',
                'Las tarifas están sujetas a modificaciones sin previo aviso debido a variaciones en recargos de combustible, tarifas de transportistas, tipo de cambio, disposiciones gubernamentales o cualquier otro factor fuera del control de CROPA, S.A. entre la fecha de emisión de esta cotización y la fecha real de embarque.',
                'Toda mercancía deberá transportarse debidamente asegurada. Si el cliente requiere la contratación del seguro por medio de CROPA, S.A., deberá solicitarlo expresamente y por escrito mediante las instrucciones de embarque o comunicación escrita previo al inicio del tránsito. En ausencia de dicha solicitud y confirmación de cobertura por parte de la aseguradora, la mercancía viajará bajo la responsabilidad y cobertura del cliente reconociendo el cliente que CROPA, S.A. no actúa como asegurador directo.',
                'La aceptación, reserva y transporte de la carga estarán sujetos a la aprobación del transportista efectivo, así como al cumplimiento de las regulaciones nacionales e internacionales aplicables. La carga peligrosa, sobredimensionada, con sobrepeso, perecedera o de manejo especial podrá estar sujeta a restricciones, requisitos y cargos adicionales',
                'Los tiempos de tránsito son estimados y podrán variar por condiciones operativas, climáticas, regulatorias, aduaneras o cualquier otra circunstancia fuera del control razonable de CROPA, S.A., sin que ello genere responsabilidad ni indemnización a cargo de la empresa por pérdidas consecuenciales, lucro cesante o daños indirectos.',
                'La mercancía deberá entregarse con embalaje, marcado y etiquetado adecuados para su transporte internacional y cumplir con las regulaciones vigentes, incluyendo la Norma Internacional NIMF-15 cuando aplique. CROPA, S.A. podrá rechazar cualquier carga que no cumpla con estos requisitos siendo el cliente el único responsable de los daños causados por embalaje defectuoso o insuficiente.',
                'Todo reclamo relacionado con pérdida, daño o faltante visibles deberá anotarse inmediatamente en el documento de recepción/conocimiento de embarque al momento de la entrega. Para daños no aparentes o no visibles, el reclamo deberá presentarse por escrito dentro de los siete (7) días calendario siguientes a la recepción de la mercancía, acompañado de la documentación de respaldo correspondiente (fotografías, acta de recepción, copia del documento de transporte con los daños y factura comercial). La falta de indicación del daño oportuna extinguirá el derecho a reclamo.',
                'El cliente reconoce que CROPA, S.A. no será responsable por retrasos, pérdidas, incautaciones, inspecciones, retenciones, decomisos o cualquier afectación ocasionada por autoridades competentes, fuerza mayor, caso fortuito o situaciones fuera de su control razonable.',
                'En el evento que se determinare responsabilidad imputable a CROPA, S.A., la indemnización máxima a pagar por la empresa estará limitada al monto de los honorarios o comisión percibida por el servicio de intermediación del embarque específico, o conforme a las limitaciones cuantitativas establecidas en el convenio internacional de transporte aplicable, lo que resulte menor, salvo que el cliente haya declarado un valor mayor y pagado la sobretasa correspondiente.',
                'CROPA, S.A. tendrá derecho de retención y prenda sobre las mercancías y/o documentos en su posesión o custodia por cualesquiera sumas adeudadas por el cliente derivadas del presente embarque o de embarques anteriores.',
                'El pago de los servicios deberá realizarse de conformidad con el crédito otorgado o al contado antes de la liberación/entrega de la carga. Toda factura no pagada a su vencimiento devengará el interés moratorio legal o acordado aplicable por cada mes de retraso.',
                'La aceptación de la presente cotización implica el conocimiento y aceptación de las presentes condiciones comerciales y de los Términos y Condiciones Generales de Servicio de CROPA, S.A.',
                '',
                'DOCUMENTOS NECESARIOS PARA LOS TRÁMITES DE EXPORTACIÓN',
                '• Hoja de Instrucción de Embarque.',
                '• Copia de factura electrónica (FEL) emitida en USD y con Incoterm.',
                '• Copia de lista de empaque.',
                '• Hoja de seguridad del producto, si el mismo es considerado peligroso para el transporte.',
                '• Certificado EUR.1 u otro certificado de origen cuando corresponda para exportaciones. ',
                '• Certificado Fitosanitario / Zoosanitario cuando se trate de mercancía perecedera o según la normativa aplicable.',
                '',
                'CLAUSULA DE EXONERACION DE RESPONSABILIDAD',
                'El cliente declara conocer y aceptar que CROPA, S.A. no responderá por daños, pérdidas, retrasos , daño emergente, lucro cesante o cualquier afectación a la mercancía ocasionados por hechos de fuerza mayor o caso fortuito, incluyendo, entre otros, desórdenes públicos, manifestaciones, bloqueos, violencia común, reuniones ilícitas, disturbios civiles, conflictos sociales, pandemias, actos de autoridad , fallas en infraestructura pública, desastres naturales o cualquier situación de naturaleza civil, penal o política que escape al control razonable de la empresa o de los transportistas contratados.',
                'En consecuencia, el cliente libera a CROPA, S.A. y a sus proveedores de transporte de toda responsabilidad civil, penal, administrativa y aduanera derivada de dichos eventos. Asimismo, se recomienda verificar que la póliza de seguro de la mercancía contemple cobertura para este tipo de riesgos incluyendo la cobertura de Huelgas, Motines y Conmoción Civil (SRCC).',
                'La presente cotización y sus condiciones se regirán e interpretarán de acuerdo con las leyes de la República de Guatemala. Para la resolución de cualquier controversia, las partes se someten expresamente a la jurisdicción de los tribunales ordinarios de la Ciudad de Guatemala.',
                ''
            ],
            condicionesIngles: [
                "SERVICE TERMS & CONDITIONS",
                'This quotation is provided for informational purposes only and does not constitute a binding transportation agreement. All rates must be confirmed prior to scheduling each shipment and remain subject to equipment and space availability with the actual carrier at the time of booking.',
                'The quoted rates do not include storage charges, inspections, taxes, duties, container detention, demurrage, penalties, delays, terminal storage, cancellations, security escorts, extraordinary services, or any other charges imposed by governmental authorities, terminals, ports, airports, shipping lines, airlines, or other third parties. Any unforeseen expenses incurred for the preservation, handling, or clearance of the cargo shall be invoiced at cost, plus applicable administrative charges.',
                `Rates are subject to change without prior notice due to fuel surcharges, carrier tariff adjustments, exchange rate fluctuations, governmental regulations, or any other factors beyond CROPA, S.A.'s reasonable control occurring between the date of this quotation and the actual shipment date`,
                `All cargo should be adequately insured during transportation. If the customer wishes CROPA, S.A. to arrange cargo insurance, such request must be made expressly and in writing through the Shipping Instructions or other written communication prior to the commencement of transit. Unless such request has been received and insurance coverage has been confirmed by the insurer, the cargo shall travel at the customer's own risk and responsibility. The customer acknowledges that CROPA, S.A. does not act as the insurer.`,
                `Acceptance, booking, and transportation of cargo are subject to approval by the actual carrier and compliance with all applicable national and international regulations. Dangerous goods, oversized, overweight, perishable, or special-handling cargo may be subject to additional restrictions, documentation requirements, and applicable surcharges.`,
                `Transit times are estimates only and may vary due to operational, weather-related, regulatory, customs, or other circumstances beyond the reasonable control of CROPA, S.A. Such variations shall not give rise to liability or compensation for consequential damages, loss of profits, or indirect losses.`,
                `Cargo must be properly packed, marked, and labeled for international transportation and comply with all applicable regulations, including ISPM-15 requirements whenever applicable. CROPA, S.A. reserves the right to reject any cargo that fails to meet these requirements. The customer shall be solely responsible for any loss or damage resulting from inadequate or defective packaging. `,
                `Any claim relating to visible loss, damage, or shortage must be noted immediately on the delivery receipt or transport document at the time of delivery. Claims for concealed or non-apparent damage must be submitted in writing within seven (7) calendar days following receipt of the cargo and supported by the corresponding documentation, including photographs, delivery inspection report, copy of the transport document indicating the damage, and commercial invoice. Failure to notify such damage within the specified period shall result in the forfeiture of the right to file a claim.`,
                `The customer acknowledges that CROPA, S.A. shall not be liable for delays, losses, seizures, inspections, detentions, confiscations, or any other impact caused by competent authorities, force majeure, unforeseen events, or circumstances beyond its reasonable control. `,
                `Should CROPA, S.A. be found legally liable, its maximum liability shall be limited to the amount of the freight forwarding fee or commission earned for the specific shipment, or to the monetary limitations established under the applicable international transportation convention, whichever amount is lower, unless the customer has declared a higher cargo value and paid the corresponding additional charge`,
                `CROPA, S.A. shall have a lien and right of retention over any cargo and/or documents in its possession or control for any outstanding amounts owed by the customer arising from the current shipment or any previous shipments`,
                `Payment for services shall be made in accordance with the approved credit terms or, if no credit has been granted, in full prior to the release or delivery of the cargo. Any invoice remaining unpaid after its due date shall accrue the applicable legal or agreed default interest for each month of delay.`,
                `Acceptance of this quotation constitutes full acknowledgment and acceptance of these Commercial Terms and Conditions, as well as the General Terms and Conditions of Service of CROPA, S.A.`,
                '',
                'REQUIRED EXPORT DOCUMENTATION',
                '• Shipping Instructions.',
                '• Copy of the Electronic Commercial Invoice (FEL), issued in U.S. Dollars (USD), indicating the applicable Incoterm®. ',
                '• Copy of the Packing List. ',
                '• Safety Data Sheet (SDS/MSDS), when the cargo is classified as dangerous goods. ',
                '• EUR.1 Certificate or any other applicable Certificate of Origin, when required.  ',
                '• Phytosanitary or Veterinary Certificate, when applicable for perishable cargo or as required by law. ',
                '',
                'LIABILITY EXEMPTION CLAUSE',
                'The customer acknowledges and agrees that CROPA, S.A. shall not be liable for loss, damage, delay, direct damages, consequential damages, loss of profits, or any adverse effect affecting the cargo arising from force majeure or events beyond its reasonable control, including but not limited to public disturbances, demonstrations, road blockades, criminal acts, unlawful assemblies, civil unrest, social conflicts, pandemics, governmental actions, failures of public infrastructure, natural disasters, or any civil, criminal, or political event beyond the reasonable control of CROPA, S.A. or its contracted carriers.',
                'Accordingly, the customer releases and holds harmless CROPA, S.A. and its transportation providers from any civil, criminal, administrative, or customs liability arising from such events. Customers are strongly encouraged to verify that their cargo insurance policy includes coverage for these risks, including Strike, Riot, and Civil Commotion (SRCC) coverage.',
                'This quotation and these Terms and Conditions shall be governed by and construed in accordance with the laws of the Republic of Guatemala. Any dispute arising from or related to these Terms and Conditions shall be submitted exclusively to the competent courts of Guatemala City, Guatemala.',
                ''
            ],
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
                'Exportaciones',],
            condicionesIngles: [
                "SERVICE TERMS & CONDITIONS",
                'This quotation is provided for informational purposes only and does not constitute a binding transportation agreement. All rates must be confirmed prior to scheduling each shipment and remain subject to equipment and space availability with the actual carrier at the time of booking.',
                'The quoted rates do not include storage charges, inspections, taxes, duties, container detention, demurrage, penalties, delays, terminal storage, cancellations, security escorts, extraordinary services, or any other charges imposed by governmental authorities, terminals, ports, airports, shipping lines, airlines, or other third parties. Any unforeseen expenses incurred for the preservation, handling, or clearance of the cargo shall be invoiced at cost, plus applicable administrative charges.',
                `Rates are subject to change without prior notice due to fuel surcharges, carrier tariff adjustments, exchange rate fluctuations, governmental regulations, or any other factors beyond CROPA, S.A.'s reasonable control occurring between the date of this quotation and the actual shipment date`,
                `All cargo should be adequately insured during transportation. If the customer wishes CROPA, S.A. to arrange cargo insurance, such request must be made expressly and in writing through the Shipping Instructions or other written communication prior to the commencement of transit. Unless such request has been received and insurance coverage has been confirmed by the insurer, the cargo shall travel at the customer's own risk and responsibility. The customer acknowledges that CROPA, S.A. does not act as the insurer.`,
                `Acceptance, booking, and transportation of cargo are subject to approval by the actual carrier and compliance with all applicable national and international regulations. Dangerous goods, oversized, overweight, perishable, or special-handling cargo may be subject to additional restrictions, documentation requirements, and applicable surcharges.`,
                `Transit times are estimates only and may vary due to operational, weather-related, regulatory, customs, or other circumstances beyond the reasonable control of CROPA, S.A. Such variations shall not give rise to liability or compensation for consequential damages, loss of profits, or indirect losses.`,
                `Cargo must be properly packed, marked, and labeled for international transportation and comply with all applicable regulations, including ISPM-15 requirements whenever applicable. CROPA, S.A. reserves the right to reject any cargo that fails to meet these requirements. The customer shall be solely responsible for any loss or damage resulting from inadequate or defective packaging. `,
                `Any claim relating to visible loss, damage, or shortage must be noted immediately on the delivery receipt or transport document at the time of delivery. Claims for concealed or non-apparent damage must be submitted in writing within seven (7) calendar days following receipt of the cargo and supported by the corresponding documentation, including photographs, delivery inspection report, copy of the transport document indicating the damage, and commercial invoice. Failure to notify such damage within the specified period shall result in the forfeiture of the right to file a claim.`,
                `The customer acknowledges that CROPA, S.A. shall not be liable for delays, losses, seizures, inspections, detentions, confiscations, or any other impact caused by competent authorities, force majeure, unforeseen events, or circumstances beyond its reasonable control. `,
                `Should CROPA, S.A. be found legally liable, its maximum liability shall be limited to the amount of the freight forwarding fee or commission earned for the specific shipment, or to the monetary limitations established under the applicable international transportation convention, whichever amount is lower, unless the customer has declared a higher cargo value and paid the corresponding additional charge`,
                `CROPA, S.A. shall have a lien and right of retention over any cargo and/or documents in its possession or control for any outstanding amounts owed by the customer arising from the current shipment or any previous shipments`,
                `Payment for services shall be made in accordance with the approved credit terms or, if no credit has been granted, in full prior to the release or delivery of the cargo. Any invoice remaining unpaid after its due date shall accrue the applicable legal or agreed default interest for each month of delay.`,
                `Acceptance of this quotation constitutes full acknowledgment and acceptance of these Commercial Terms and Conditions, as well as the General Terms and Conditions of Service of CROPA, S.A.`,
                '',
                'REQUIRED EXPORT DOCUMENTATION',
                '• Shipping Instructions.',
                '• Copy of the Electronic Commercial Invoice (FEL), issued in U.S. Dollars (USD), indicating the applicable Incoterm®. ',
                '• Copy of the Packing List. ',
                '• Safety Data Sheet (SDS/MSDS), when the cargo is classified as dangerous goods. ',
                '• EUR.1 Certificate or any other applicable Certificate of Origin, when required.  ',
                '• Phytosanitary or Veterinary Certificate, when applicable for perishable cargo or as required by law. ',
                '',
                'LIABILITY EXEMPTION CLAUSE',
                'The customer acknowledges and agrees that CROPA, S.A. shall not be liable for loss, damage, delay, direct damages, consequential damages, loss of profits, or any adverse effect affecting the cargo arising from force majeure or events beyond its reasonable control, including but not limited to public disturbances, demonstrations, road blockades, criminal acts, unlawful assemblies, civil unrest, social conflicts, pandemics, governmental actions, failures of public infrastructure, natural disasters, or any civil, criminal, or political event beyond the reasonable control of CROPA, S.A. or its contracted carriers.',
                'Accordingly, the customer releases and holds harmless CROPA, S.A. and its transportation providers from any civil, criminal, administrative, or customs liability arising from such events. Customers are strongly encouraged to verify that their cargo insurance policy includes coverage for these risks, including Strike, Riot, and Civil Commotion (SRCC) coverage.',
                'This quotation and these Terms and Conditions shall be governed by and construed in accordance with the laws of the Republic of Guatemala. Any dispute arising from or related to these Terms and Conditions shall be submitted exclusively to the competent courts of Guatemala City, Guatemala.',
                '',
                'To confirm acceptance of these Commercial and Operational Terms and Conditions, we kindly request that this quotation be returned duly signed and stamped by the customer. ',
            ],
        },
        {
            id: 3,
            transporte: "Terrestre",
            condiciones: ['CONDICIONES GENERALES:',
                'La presente cotización tiene carácter informativo y no constituye un contrato definitivo de transporte. Las tarifas deberán ser confirmadas antes de coordinar cada embarque y estarán sujetas a disponibilidad de espacio y equipo por parte del transportista al momento de la reserva/booking.',
                'Las tarifas cotizadas no incluyen almacenajes, inspecciones, impuestos, aranceles, demoras de contenedor, sobreestadías, multas, demoras, estadías, cancelaciones, custodias, servicios extraordinarios ni cualquier otro cargo generado por autoridades, terminales, puertos, aeropuertos, navieras, aerolíneas o terceros. Todo gasto adicional imprevisible o incurrido para la preservación o despacho de la carga será facturado al costo correspondiente más gastos administrativos si aplicaren.',
                'Las tarifas están sujetas a modificaciones sin previo aviso debido a variaciones en recargos de combustible, tarifas de transportistas, tipo de cambio, disposiciones gubernamentales o cualquier otro factor fuera del control de CROPA, S.A. entre la fecha de emisión de esta cotización y la fecha real de embarque.',
                'Toda mercancía deberá transportarse debidamente asegurada. Si el cliente requiere la contratación del seguro por medio de CROPA, S.A., deberá solicitarlo expresamente y por escrito mediante las instrucciones de embarque o comunicación escrita previo al inicio del tránsito. En ausencia de dicha solicitud y confirmación de cobertura por parte de la aseguradora, la mercancía viajará bajo la responsabilidad y cobertura del cliente reconociendo el cliente que CROPA, S.A. no actúa como asegurador directo.',
                'La aceptación, reserva y transporte de la carga estarán sujetos a la aprobación del transportista efectivo, así como al cumplimiento de las regulaciones nacionales e internacionales aplicables. La carga peligrosa, sobredimensionada, con sobrepeso, perecedera o de manejo especial podrá estar sujeta a restricciones, requisitos y cargos adicionales',
                'Los tiempos de tránsito son estimados y podrán variar por condiciones operativas, climáticas, regulatorias, aduaneras o cualquier otra circunstancia fuera del control razonable de CROPA, S.A., sin que ello genere responsabilidad ni indemnización a cargo de la empresa por pérdidas consecuenciales, lucro cesante o daños indirectos.',
                'La mercancía deberá entregarse con embalaje, marcado y etiquetado adecuados para su transporte internacional y cumplir con las regulaciones vigentes, incluyendo la Norma Internacional NIMF-15 cuando aplique. CROPA, S.A. podrá rechazar cualquier carga que no cumpla con estos requisitos siendo el cliente el único responsable de los daños causados por embalaje defectuoso o insuficiente.',
                'Todo reclamo relacionado con pérdida, daño o faltante visibles deberá anotarse inmediatamente en el documento de recepción/conocimiento de embarque al momento de la entrega. Para daños no aparentes o no visibles, el reclamo deberá presentarse por escrito dentro de los siete (7) días calendario siguientes a la recepción de la mercancía, acompañado de la documentación de respaldo correspondiente (fotografías, acta de recepción, copia del documento de transporte con los daños y factura comercial). La falta de indicación del daño oportuna extinguirá el derecho a reclamo.',
                'El cliente reconoce que CROPA, S.A. no será responsable por retrasos, pérdidas, incautaciones, inspecciones, retenciones, decomisos o cualquier afectación ocasionada por autoridades competentes, fuerza mayor, caso fortuito o situaciones fuera de su control razonable.',
                'En el evento que se determinare responsabilidad imputable a CROPA, S.A., la indemnización máxima a pagar por la empresa estará limitada al monto de los honorarios o comisión percibida por el servicio de intermediación del embarque específico, o conforme a las limitaciones cuantitativas establecidas en el convenio internacional de transporte aplicable, lo que resulte menor, salvo que el cliente haya declarado un valor mayor y pagado la sobretasa correspondiente.',
                'CROPA, S.A. tendrá derecho de retención y prenda sobre las mercancías y/o documentos en su posesión o custodia por cualesquiera sumas adeudadas por el cliente derivadas del presente embarque o de embarques anteriores.',
                'El pago de los servicios deberá realizarse de conformidad con el crédito otorgado o al contado antes de la liberación/entrega de la carga. Toda factura no pagada a su vencimiento devengará el interés moratorio legal o acordado aplicable por cada mes de retraso.',
                'La aceptación de la presente cotización implica el conocimiento y aceptación de las presentes condiciones comerciales y de los Términos y Condiciones Generales de Servicio de CROPA, S.A.',
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
                'Exportaciones'],
            condicionesIngles: [
                "SERVICE TERMS & CONDITIONS",
                'This quotation is provided for informational purposes only and does not constitute a binding transportation agreement. All rates must be confirmed prior to scheduling each shipment and remain subject to equipment and space availability with the actual carrier at the time of booking.',
                'The quoted rates do not include storage charges, inspections, taxes, duties, container detention, demurrage, penalties, delays, terminal storage, cancellations, security escorts, extraordinary services, or any other charges imposed by governmental authorities, terminals, ports, airports, shipping lines, airlines, or other third parties. Any unforeseen expenses incurred for the preservation, handling, or clearance of the cargo shall be invoiced at cost, plus applicable administrative charges.',
                `Rates are subject to change without prior notice due to fuel surcharges, carrier tariff adjustments, exchange rate fluctuations, governmental regulations, or any other factors beyond CROPA, S.A.'s reasonable control occurring between the date of this quotation and the actual shipment date`,
                `All cargo should be adequately insured during transportation. If the customer wishes CROPA, S.A. to arrange cargo insurance, such request must be made expressly and in writing through the Shipping Instructions or other written communication prior to the commencement of transit. Unless such request has been received and insurance coverage has been confirmed by the insurer, the cargo shall travel at the customer's own risk and responsibility. The customer acknowledges that CROPA, S.A. does not act as the insurer.`,
                `Acceptance, booking, and transportation of cargo are subject to approval by the actual carrier and compliance with all applicable national and international regulations. Dangerous goods, oversized, overweight, perishable, or special-handling cargo may be subject to additional restrictions, documentation requirements, and applicable surcharges.`,
                `Transit times are estimates only and may vary due to operational, weather-related, regulatory, customs, or other circumstances beyond the reasonable control of CROPA, S.A. Such variations shall not give rise to liability or compensation for consequential damages, loss of profits, or indirect losses.`,
                `Cargo must be properly packed, marked, and labeled for international transportation and comply with all applicable regulations, including ISPM-15 requirements whenever applicable. CROPA, S.A. reserves the right to reject any cargo that fails to meet these requirements. The customer shall be solely responsible for any loss or damage resulting from inadequate or defective packaging. `,
                `Any claim relating to visible loss, damage, or shortage must be noted immediately on the delivery receipt or transport document at the time of delivery. Claims for concealed or non-apparent damage must be submitted in writing within seven (7) calendar days following receipt of the cargo and supported by the corresponding documentation, including photographs, delivery inspection report, copy of the transport document indicating the damage, and commercial invoice. Failure to notify such damage within the specified period shall result in the forfeiture of the right to file a claim.`,
                `The customer acknowledges that CROPA, S.A. shall not be liable for delays, losses, seizures, inspections, detentions, confiscations, or any other impact caused by competent authorities, force majeure, unforeseen events, or circumstances beyond its reasonable control. `,
                `Should CROPA, S.A. be found legally liable, its maximum liability shall be limited to the amount of the freight forwarding fee or commission earned for the specific shipment, or to the monetary limitations established under the applicable international transportation convention, whichever amount is lower, unless the customer has declared a higher cargo value and paid the corresponding additional charge`,
                `CROPA, S.A. shall have a lien and right of retention over any cargo and/or documents in its possession or control for any outstanding amounts owed by the customer arising from the current shipment or any previous shipments`,
                `Payment for services shall be made in accordance with the approved credit terms or, if no credit has been granted, in full prior to the release or delivery of the cargo. Any invoice remaining unpaid after its due date shall accrue the applicable legal or agreed default interest for each month of delay.`,
                `Acceptance of this quotation constitutes full acknowledgment and acceptance of these Commercial Terms and Conditions, as well as the General Terms and Conditions of Service of CROPA, S.A.`,
                '',
                'REQUIRED EXPORT DOCUMENTATION',
                '• Shipping Instructions.',
                '• Copy of the Electronic Commercial Invoice (FEL), issued in U.S. Dollars (USD), indicating the applicable Incoterm®. ',
                '• Copy of the Packing List. ',
                '• Safety Data Sheet (SDS/MSDS), when the cargo is classified as dangerous goods. ',
                '• EUR.1 Certificate or any other applicable Certificate of Origin, when required.  ',
                '• Phytosanitary or Veterinary Certificate, when applicable for perishable cargo or as required by law. ',
                '',
                'LIABILITY EXEMPTION CLAUSE',
                'The customer acknowledges and agrees that CROPA, S.A. shall not be liable for loss, damage, delay, direct damages, consequential damages, loss of profits, or any adverse effect affecting the cargo arising from force majeure or events beyond its reasonable control, including but not limited to public disturbances, demonstrations, road blockades, criminal acts, unlawful assemblies, civil unrest, social conflicts, pandemics, governmental actions, failures of public infrastructure, natural disasters, or any civil, criminal, or political event beyond the reasonable control of CROPA, S.A. or its contracted carriers.',
                'Accordingly, the customer releases and holds harmless CROPA, S.A. and its transportation providers from any civil, criminal, administrative, or customs liability arising from such events. Customers are strongly encouraged to verify that their cargo insurance policy includes coverage for these risks, including Strike, Riot, and Civil Commotion (SRCC) coverage.',
                'This quotation and these Terms and Conditions shall be governed by and construed in accordance with the laws of the Republic of Guatemala. Any dispute arising from or related to these Terms and Conditions shall be submitted exclusively to the competent courts of Guatemala City, Guatemala.',
                '',
                'To confirm acceptance of these Commercial and Operational Terms and Conditions, we kindly request that this quotation be returned duly signed and stamped by the customer. ',
            ],
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
        doc.text(`Date:`, 15, 22);
        doc.text(`Reference:`, 15, 32);
        // doc.text(`Pagina:`, 160, 22); 
        // doc.text(`Version:`, 160, 32);

        doc.setTextColor("#4184C5");
        const fecha = moment(pdfData.fechaActual, ['DD-MM-YYYY', 'MM-DD-YYYY', 'YYYY-MM-DD HH:mm:ss'], true);
        const fechaFormateada = fecha.isValid()
            ? fecha.format('MM/DD/YYYY')
            : null;
        doc.text(`${fechaFormateada}`, 75, 22);
        doc.text(`${pdfData.centroCosto}-${pdfData.ano}-${pdfData.codCotizacion}`, 75, 32);
        doc.text(`${pdfData.version}`, 200, 32);
        // doc.text(`${pagina}`, 203, 22);

        doc.setDrawColor("#00205b");
        doc.setFillColor("#00205b");
        doc.rect(5, 40, 290, 0.7, "F");

        // Señores
        doc.setFont("Helvetica", "normal");
        doc.setTextColor("#000");
        doc.text(`Customer:`, 15, 52);
        doc.text(`Attention:`, 15, 62);
        doc.setFontSize(7.17);

        const linesSeñores = doc.splitTextToSize(`We are pleased to submit for your consideration our quotation for international freight services.`, 285);
        doc.text(linesSeñores, 15, 75)
        doc.setFontSize(7.5);

        doc.setTextColor("#4184C5");
        // if (pdfData.tipo_pago === 128) {
        //     doc.text(`${pdfData.cliente}`, 75, 52);
        // } else if (pdfData.tipo_pago === 127) {
        //     doc.text(`${pdfData.estacion}`, 75, 52);
        // } else if (pdfData.tipo_pago === 131 && (pdfData.estacion !== "" && pdfData.estacion !== null)) {
        //     doc.text(`${pdfData.estacion}`, 75, 52);
        // } else if (pdfData.tipo_pago === 131 && (pdfData.estacion === "" || pdfData.estacion === null)) {
        //     if(pdfData.tipoPrepaid === 128){
        //         doc.text(`${pdfData.cliente}`, 75, 52);
        //     }else if(pdfData.tipoCollect === 127){
        //     doc.text(`${pdfData.estacion}`,75, 52);
        //     }
        // }
        if (pdfData.tipo_pago === 131) {
            if (collect && !!pdfData.estacion) {
                doc.text(`${pdfData.estacion}`, 75, 52);
            } else {
                doc.text(`${pdfData.cliente}`, 75, 52);
            }
        } else {
            doc.text(`${pdfData.cliente}`, 75, 52);
        }

        doc.text(`${pdfData.contacto || " "}`, 75, 62)

        doc.setDrawColor("#00205b");
        doc.setFillColor("#00205b");
        //correr hacia abajo
        doc.rect(5, 90, 290, 0.7, "F");

        // Continuación
        doc.setFont("Helvetica", "normal");
        doc.setTextColor("#000");
        doc.text(`Please find below our rates for your export shipment from:`, 15, 100);
        doc.text('Origin: ', 15, 110);
        doc.text('Destination: ', 15, 120);
        doc.setTextColor("#4184C5");
        doc.setFontSize(6.5);

        // doc.text(`${pdfData.paisOrigen},${pdfData.origen}, hacia ${pdfData.destino},${pdfData.paisDestino}`, 15, 95);

        doc.text(`${pdfData.origen.toUpperCase()}, ${pdfData.paisOrigen.toUpperCase()}`, 58, 110);
        doc.text(`${pdfData.destino.toUpperCase()}, ${pdfData.paisDestino.toUpperCase()}`, 58, 120);


        // const lines = doc.splitTextToSize(`${pdfData.origen}, ${pdfData.paisOrigen.toUpperCase()} hacia ${pdfData.destino}, ${pdfData.paisDestino.toUpperCase()}`, 295);
        // doc.text(lines, 150, 90, { align: "center" });
        doc.setFontSize(7.5);

        doc.setDrawColor("#00205b");
        doc.setFillColor("#00205b");
        doc.rect(5, 123, 290, 0.7, "F");

        // Servicio
        doc.setFont("Helvetica", "normal");
        doc.setTextColor("#000");
        doc.text(`Type of Service:`, 15, 133);
        doc.setTextColor("#4184C5");

        // doc.text(`Servicio ${tipoTransporteSeleccionado.transporte}, ${pdfData.origen}, ${pdfData.paisDestino}`, 150, 126, {align: "center"});
        // const lines1 = doc.splitTextToSize(`SERVICIO ${tipoTransporteSeleccionado.transporte.toUpperCase()} , ${pdfData.tipoServicio.toUpperCase()}`, 295);
        if (pdfData.tipo_pago === 128) {
            doc.text("PREPAID", 16, 207);
        } else if (pdfData.tipo_pago === 127) {
            doc.text("COLLECT", 16, 207);
        } else {
            doc.text("PREPAID/COLLECT", 16, 207);
        }
        const lines1 = doc.splitTextToSize(`${pdfData.tipoServicio.toUpperCase()}`, 295);
        doc.text(lines1, 150, 133, { align: "center" })

        const lines2 = doc.splitTextToSize(`${pdfData.observacionServicio}`, 280);
        doc.text(lines2, 15, 142);


        doc.setDrawColor("#00205b");
        doc.setFillColor("#00205b");
        doc.rect(5, 153, 290, 0.7, "F");

        // PESO, MASA, TARIFA
        doc.setFont("Helvetica", "normal");
        doc.setTextColor("#000");

        doc.text(`Volumetric Weight`, 15, 163);
        doc.text(`Actual Weight`, 125, 163);
        doc.text(`Chargeable Weight (CW)`, 210, 163);

        doc.text(`Payment Terms:`, 15, 193);

        doc.text(`Total Pieces`, 125, 193);
        doc.text(`Product Type`, 225, 193);

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
        doc.text(`${Math.ceil(Number(pdfData.pesoVolumetrico))} kg`, 45, 173, { align: "center" });
        doc.text(`${Math.ceil(Number(pdfData.pesoReal))} kg`, 142, 173, { align: "center" });
        doc.text(`${Math.ceil(Number(pdfData.chargeWeight))} kg`, 250, 173, { align: "center" });

        doc.text(`${pdfData.totalPiezas}`, 142, 207);
        doc.text(`${pdfData.tipoProducto}`, 250, 207, { align: "center" })
        // doc.text(`${cri.valor || "N/D"}`, xtemp, 153);
        // // doc.text(`${pdfData.tarifa}`, 235, 153);
        // xtemp += indice;
        // })
        // doc.text(`${pdfCriterios.valor[0]}`, 25, 153);

        doc.setDrawColor("#00205b");
        doc.setFillColor("#00205b");
        doc.rect(5, 183, 290, 0.7, "F");

        doc.rect(5, 213, 600, 0.7, "F");


        // Descripción, Monto
        doc.setFont("Helvetica", "normal");
        doc.setTextColor("#000");
        doc.text(`Description:`, 15, 223);


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
        doc.text(`Total expenses`, 15, 535);

        // Cuadro de totales
        doc.roundedRect(5, 540, 290, 50, 5, 5);

        if (isLastPage) {

            doc.setFontSize(9);
            doc.setTextColor("#00205b");

            // doc.text("Totales:", 350, 535);

            doc.setFontSize(8);

            if (pdfData.tipo_pago === 131 && (pdfData.estacion === "" || pdfData.estacion === null)) { // doc.text("Prepaid:", 350, 550);

                doc.text(moneda, 350, 535, { align: "right" });
                doc.text((totalPrepaid || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ","), 565, 535, { align: "right" });

                // doc.text("Collect:", 350, 565);
                doc.text((totalCollect || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ","), 480, 535, { align: "right" });
            }

            // Mostrar total
            if (totalQ === 0) {

                doc.setDrawColor("#00205b");
                doc.setFillColor("#fff");
                // doc.roundedRect(5, 540, 290, 50, 5, 5);

                doc.setFontSize(10);
                doc.setTextColor("#00205b");
                doc.text(`Total $: `, 15, 568);
                doc.setTextColor("#4184C5");
                doc.text(`${(totalD || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`, 55, 568);

            } else if (totalD === 0) {

                doc.setDrawColor("#00205b");
                doc.setFillColor("#fff");
                // doc.roundedRect(5, 540, 290, 50, 5, 5);

                doc.setFontSize(10);
                doc.setTextColor("#00205b");
                doc.text(`Total Q: `, 15, 568);
                doc.setTextColor("#4184C5");
                doc.text(`${(totalQ || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`, 55, 568);

            } else {

                doc.setDrawColor("#00205b");
                doc.setFillColor("#fff");
                // doc.roundedRect(5, 540, 290, 50, 5, 5);

                doc.setFontSize(10);
                doc.setTextColor("#00205b");
                doc.text(`Total $: `, 15, 557);
                doc.setTextColor("#4184C5");
                doc.text(`${(totalD || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`, 55, 557);

                doc.setDrawColor("#00205b");
                doc.setFillColor("#00205b");
                doc.rect(5, 565, 290, 0.7, "F");

                doc.setFontSize(10);
                doc.setTextColor("#00205b");
                doc.text(`Total Q: `, 15, 580);
                doc.setTextColor("#4184C5");
                doc.text(`${totalQ.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`, 55, 580);


            }


        }

        // Salidas
        doc.setFontSize(7.5);
        doc.setTextColor("#00205b");
        doc.text(`Depatures: `, 15, 610);
        doc.setTextColor("#4184C5");
        doc.text(`${pdfData.salidas}`, 55, 610);

        // Tiempo tránsito
        doc.setFontSize(7.5);
        doc.setTextColor("#00205b");
        doc.text(`Transit time: `, 15, 625);
        doc.setTextColor("#4184C5");
        doc.text(`${pdfData.tiempoTransito}`, 90, 625);

        // Texto abajo
        doc.setFontSize(6.5);
        doc.setTextColor("#00205b");
        doc.text(`Rates and transit times may be subject to change due force majeure events, unforeseen`, 15, 640);
        doc.text(`circumstances, pandemics, govemmet regulations, or any situation beyong CROPA's control.`, 15, 647);
        doc.text(`In such cases, the customer will be informed in advance for prior approbal of the service`, 15, 654);
        doc.text(`and/or revised rate, without any liability or compensation on the part of CROPA”.`, 15, 661);

        doc.setDrawColor("#00205b");
        doc.setFillColor("#00205b");
        doc.rect(5, 670, 290, 0.7, "F");

        // Valido
        doc.setFontSize(7.5);
        doc.setTextColor("#00205b");
        doc.text(`Rates validity: `, 15, 680);
        doc.setTextColor("#4184C5");
        const fecha = moment(pdfData.fechaVencimiento, ['DD/MM/YYYY', 'MM/DD/YYYY'], true);
        const fechaFormateada = fecha.isValid()
            ? fecha.format('MM/DD/YYYY')
            : null;
        doc.text(`${fechaFormateada}`, 65, 680);

        doc.setDrawColor("#00205b");
        doc.setFillColor("#00205b");
        doc.rect(5, 700, 290, 0.7, "F");

        // Contacto:
        doc.setFontSize(7.5);
        doc.setTextColor("#00205b");
        doc.text(`Contact Cropa DSV: `, 15, 710);
        doc.setTextColor("#4184C5");
        doc.text(`${pdfData.nombreCreador}`, 145, 740, { align: "center" });
        doc.text(`${pdfData.puestoCreador}`, 145, 750, { align: "center" });

        // Cuadro opcionales
        doc.setDrawColor("#00205b");
        doc.setFillColor("#fff");
        doc.roundedRect(305, 540, 300, 90, 5, 5);

        // Opcionales
        doc.setFontSize(7.5);
        doc.setTextColor("#00205b");
        doc.text(`Accesorial charges: `, 320, 550);

        let yPositionOp = 557;
        const maxWidthop = 270;
        // const itemsOpcionales = pdfOpcionales //.filter(item => item.opcion === "S");

        const detailsLines = doc.splitTextToSize(`${pdfData.opcionales}`, maxWidthop);
        doc.text(detailsLines, 320, yPositionOp);


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
            "• We recommend reviewing the quotation and confirming the rate before arranging your shipment.",
            "• This quotation does not include warehousing, inspections, fines, or any other charges at origin or destination (taxes, demurrage, storage, parking, dead freight, rollovers, cancellations, shipment splitting, escorts, or security patrols)",
            "• The above rates DO NOT include insurance, taxes, customs clearance, customs procedures, or any other extraordinary charges.",
            "• In accordance with CROPA S.A. policies, all cargo must be insured. If you already have International Cargo Insurance coverage, please inform us and sign a Liability Release Letter. Otherwise, the cargo will be insured from origin under CROPA S.A.'s International Insurance Policy.",
            "• These rates DO NOT apply to dangerous goods, overweight cargo, and/or oversized cargo.",
            "• Any additional handling charges incurred at origin and/or destination will be invoiced at cost.",
            "• These rates are subject to change without prior notice, depending on international market conditions.",
            "• Transit time does not include waiting time for consolidation at airports, seaports of origin, or transshipment ports.",
            "• The rate is subject to change without prior notice due to fluctuations in fuel costs."

            // `• *Sugerimos revisar la oferta y confirmar la tarifa antes de realizar su envío.`,
            // `• *Esta cotización no incluye almacenajes, revisiones, multas y otros gastos tanto en origen como en destino (impuestos, demoras, estadías, parqueos, fletes falsos, roleos, cancelaciones, división de embarques, custodias o patrullas)`,
            // '• *Esta cotización no es un contrato de transporte, las condiciones generales, incluyendo limitaciones de responsabilidad, se encuentran establecidas en los documentos de transporte Cartas de Porte, Bill of Loading, Air Way Bill, en el reverso. ',
            // '• *Las tarifas anteriores NO incluyen seguro, impuestos, trámites aduanales, o cualquier otrogasto extraordinario.',
            // '• *Por políticas de CROPA, S.A., la carga debe transportarse Asegurada. Si usted cuenta con Cobertura de Seguro Internacional por favor indicarlo y firmar carta de Liberación de Responsabilidad. De lo contrario, se asegurará la mercadería desde origen con la Póliza Internacional de CROPA, S.A.',
            // '• *DSV se reserva el derecho de escoger la línea aérea, marítima o terrestre para cada Embarque.',
            // '• *Estas tarifas NO aplican para carga peligrosa, con extra peso y/o extra dimensiones.',
            // '• *En caso de existir algún gasto de manejo adicional en origen y/o en destino, les será facturado al costo',
            // '• *Estas tarifas están sujetas a cambios sin previo aviso, dependiendo de las condiciones del mercado internacional.',
            // '• *El Tiempo de Tránsito no incluye los días de espera para consolidación en aeropuertos o puertos de origen o trasbordo.',
            // `• *La tarifa se encuentra sujeta a cambios sin previo aviso por variación en el costo de los combustibles`
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

        let addItemsToDoc;
        let yPosition = margins.top;
        let tieneQuetzales = false;

        const totalPrepaid = pdfItems
            .filter(i => i.tipo_pago === 128)
            .reduce((acc, { monto }) => acc += monto, 0);

        const totalCollect = pdfItems
            .filter(i => i.tipo_pago === 127)
            .reduce((acc, { monto }) => acc += monto, 0);

        const moneda = pdfItems.find(i => i.moneda)?.moneda || "";

        if (pdfData.tipo_pago === 131 && (pdfData.estacion === "" || pdfData.estacion === null)) {

            doc.setFontSize(7.5);
            doc.setTextColor("#000");
            doc.text(`Currency:`, 350, 223);
            doc.text(`Amount Prepaid:`, 565, 223, { align: "right" });

            // doc.text(`Moneda Collect:`, 495, 193);
            doc.text(`Amount Collect:`, 480, 223, { align: "right" });

            addItemsToDoc = (pdfItems, moneda) => {
                doc.setTextColor("#00205b");
                const filteredItems = pdfItems.filter(item => item.moneda === moneda);
                // console.log("moneda", filteredItems);
                // console.log("moneda", moneda)
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
                    doc.setTextColor(index % 2 ? "#00205b" : "#000f2b");
                    doc.setFontSize(7.5);
                    doc.setFont("Helvetica", index % 2 ? "normal" : "normal");
                    doc.text(item.rubro || "", 15, yPosition);

                    doc.setFont("Helvetica", "italic"); // Volver a la fuente normal
                    doc.setTextColor("#5e5e5e");

                    if (item.detalle /* || item.rubro.toUpperCase() === "FLETE" */) {
                        let texto = item.detalle;

                        if (Array.isArray(item.detalle))
                            texto = [...item.detalle]
                                .filter((i) => i.detalle || i.valor)
                                .map((i) => (i.detalle ? i.detalle : i.valor))
                                .join(", ")
                        else if (typeof item.detalle === "string") texto = `${item.detalle}`;
                        else texto = '';

                        // let textoDetalleTarifaParaFlete = pdfData.tarifa;
                        // let textoDetallePesoParaFlete = pdfData.peso;
                        // let string = [textoDetalleTarifaParaFlete || null, textoDetallePesoParaFlete || null].filter(i => i).join(", ")
                        // if (Array.isArray(item.detalle))
                        //     texto = [...(item.rubro.toUpperCase() === "FLETE" ? [{ detalle: textoDetalleTarifaParaFlete }, { detalle: textoDetallePesoParaFlete }] : []), ...(item.detalle)].filter(i => i.detalle || i.valor).map(i => i.detalle ? i.detalle : i.valor).join(", ");
                        // else if (typeof item.detalle === "string")
                        //     texto = `${item.rubro.toUpperCase() === "FLETE" ? `${string}${string.trim() == "" ? "" : ", "}` : ""}${item.detalle}`;
                        // else
                        //     texto = `${item.rubro.toUpperCase() === "FLETE" ? `${string}` : ""}`;

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
                        doc.line(15, yPosition, 595, yPosition)

                    } else {
                        yPosition += 10;
                        doc.setDrawColor("#cfcfcf");
                        doc.line(15, yPosition, 595, yPosition)
                    }
                    doc.setFont("Helvetica", index % 2 ? "normal" : "normal"); // Volver a la fuente normal
                    doc.setTextColor(index % 2 ? "#00205b" : "#000f2b");



                    if (item.tipo_pago === 128) {

                        // Imprimir monto
                        doc.setFontSize(7.5);
                        doc.text(`${item.moneda}`, 355, yPosition - 10)
                        doc.text(`${(item.monto || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`, 565, yPosition - 10, { align: "right" });
                        doc.text(`----`, 480, yPosition - 10, { align: "right" });





                    } else {
                        // Imprimir monto
                        doc.setFontSize(7.5);
                        doc.text(`${item.moneda}`, 355, yPosition - 10)
                        doc.text(`${(item.monto || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`, 480, yPosition - 10, { align: "right" });
                        doc.text(`----`, 565, yPosition - 10, { align: "right" });


                    }

                    yPosition += 10;

                    if (yPosition >= 490) {
                        doc.addPage();
                        pagina++;
                        yPosition = margins.top;
                    }


                });
            };

        } else {


            doc.setFontSize(7.5);
            doc.setTextColor("#000");
            doc.text(`Currency:`, 495, 223);
            doc.text(`Amount:`, 565, 223, { align: "right" });

            addItemsToDoc = (pdfItems, moneda) => {
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
                    doc.setTextColor(index % 2 ? "#00205b" : "#000f2b");
                    doc.setFontSize(7.5);
                    doc.setFont("Helvetica", index % 2 ? "normal" : "normal");
                    doc.text(item.rubro || "", 15, yPosition);

                    doc.setFont("Helvetica", "italic"); // Volver a la fuente normal
                    doc.setTextColor("#5e5e5e");

                    if (item.detalle /* || item.rubro.toUpperCase() === "FLETE" */) {
                        let texto = item.detalle;

                        if (Array.isArray(item.detalle))
                            texto = [...item.detalle]
                                .filter((i) => i.detalle || i.valor)
                                .map((i) => (i.detalle ? i.detalle : i.valor))
                                .join(", ")
                        else if (typeof item.detalle === "string") texto = `${item.detalle}`;
                        else texto = '';

                        // let textoDetalleTarifaParaFlete = pdfData.tarifa;
                        // let textoDetallePesoParaFlete = pdfData.peso;
                        // let string = [textoDetalleTarifaParaFlete || null, textoDetallePesoParaFlete || null].filter(i => i).join(", ")
                        // if (Array.isArray(item.detalle))
                        //     texto = [...(item.rubro.toUpperCase() === "FLETE" ? [{ detalle: textoDetalleTarifaParaFlete }, { detalle: textoDetallePesoParaFlete }] : []), ...(item.detalle)].filter(i => i.detalle || i.valor).map(i => i.detalle ? i.detalle : i.valor).join(", ");
                        // else if (typeof item.detalle === "string")
                        //     texto = `${item.rubro.toUpperCase() === "FLETE" ? `${string}${string.trim() == "" ? "" : ", "}` : ""}${item.detalle}`;
                        // else
                        //     texto = `${item.rubro.toUpperCase() === "FLETE" ? `${string}` : ""}`;

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
                        doc.line(15, yPosition, 595, yPosition)

                    } else {
                        yPosition += 10;
                        doc.setDrawColor("#cfcfcf");
                        doc.line(15, yPosition, 595, yPosition)
                    }
                    doc.setFont("Helvetica", index % 2 ? "normal" : "normal"); // Volver a la fuente normal
                    doc.setTextColor(index % 2 ? "#00205b" : "#000f2b");



                    // Imprimir monto
                    doc.setFontSize(7.5);
                    doc.text(`${item.moneda}`, 500, yPosition - 10)
                    doc.text(`${(item.monto || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`, 565, yPosition - 10, { align: "right" });
                    yPosition += 10;

                    if (yPosition >= 490) {
                        doc.addPage();
                        pagina++;
                        yPosition = margins.top;
                    }


                });
            };
        }


        const totalD = pdfItems.filter(item => ["$", "USD"].includes(item.moneda)).reduce((acc, { monto }) => acc += monto, 0);
        const totalQ = pdfItems.filter(item => !["$", "USD"].includes(item.moneda)).reduce((acc, { monto }) => acc += monto, 0);
        const itemsDolares = pdfItems.filter(item => ["$", "USD"].includes(item.moneda));
        const itemsNoDolares = pdfItems.filter(item => !["$", "USD"].includes(item.moneda));

        addItemsToDoc(itemsDolares, "$");
        itemsNoDolares.length > 0 && addItemsToDoc(itemsNoDolares, itemsNoDolares[0].moneda);

        return { totalD, totalQ, totalCollect, totalPrepaid, moneda };
    };

    const { totalD, totalQ, totalPrepaid, totalCollect, moneda } = cotizacion();


    const totalPages = doc.internal.getNumberOfPages()

    for (let i = 1; i <= totalPages; i++) {
        doc.setFontSize(7.5);

        doc.setPage(i)
        doc.setTextColor("#4184C5");
        doc.text(`Page ${i} de ${totalPages}`, 290, 22, { align: "right" });

        doc.setTextColor("#000");
        doc.text(`Version:`, 160, 32);

        header();
        footer(i === (totalPages));

    }

    // header();
    // footer(true);
    pagina++;


    if (tipoTransporteSeleccionado) {
        const condicionesTexto = tipoTransporteSeleccionado[
            idioma === "es" ? "condiciones" : "condicionesIngles"
        ];
        const maxWidth = 500;
        const lineHeight = 12;

        const lines = doc.splitTextToSize(condicionesTexto, maxWidth);

        doc.addPage();

        doc.setFontSize(9);
        doc.setTextColor("#00205b");

        // doc.text(`Condiciones para el transporte ${tipoTransporteSeleccionado.transporte}`, margins.width / 2, 30, { align: "center" });
        const tituloCondiciones = idioma === "es"
            ? "CONDICIONES COMERCIALES Y DE SERVICIO"
            : "SERVICE TERMS & CONDITIONS";

        doc.text(tituloCondiciones, margins.width / 2, 30, { align: "center" });

        // doc.setFontSize(9);
        doc.setFont("Helvetica", "bold");

        const condicionesNegrita = idioma === "es" ? "Para efectos de aceptación de las presentes condiciones comerciales y operativas, agradeceremos devolver la presente cotización debidamente firmada y sellada por el cliente." : "To confirm acceptance of these Commercial and Operational Terms and Conditions, we kindly request that this quotation be returned duly signed and stamped by the customer."; doc.setFontSize(8); doc.setFont("Helvetica", "bold"); 
        const lines2 = doc.splitTextToSize(condicionesNegrita, 550); 
        const posicionY = idioma === "es" ? 690 : 555; 
        doc.text(lines2, 30, posicionY, { align: "left" }); 
        // doc.setFontSize(9);
        doc.setFont("Helvetica", "normal");

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
                doc.text(`${item.moneda}${(item.monto || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`, 550, yTemp - 10);
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
    }

    const ruta = `/cropa/cotizaciones/entidad_${pdfData.entidad_id}/${pdfData.codCotizacion}/341/VERSION_${pdfData.version}/`;

    let nombre_a_registrar = `${moment().unix()}_cotizacion${prepaid ? "_p" : collect ? "_c" : ""}_${idioma}.pdf`;
    let ruta_destino = `${ruta}`.replace(" ", "_");

    if (copiaLocal) {
        doc.save(`pdfs/${nombre_a_registrar}`);
    }

    if (!guardarSFTP) {
        // return doc.output("datauristring");
        return null
    }

    //Procesar Archivo
    await sftpAzure_.writeFile(
        {
            dir: `${ruta_destino}`,
            file: Buffer.from(doc.output("arraybuffer")),
            nombre: `${ruta_destino}${nombre_a_registrar}`,
        },
        false
    );

    return `${ruta_destino}${nombre_a_registrar}`;
};