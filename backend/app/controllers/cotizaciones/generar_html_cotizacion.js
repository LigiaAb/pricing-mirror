
module.exports.generarHTMLCotizacion = async (datos, items = [], opcionales = [],) => {
    return `
        <!DOCTYPE html><html><head><meta http-equiv="content-type" content="text/html; charset=utf-8" /><title>Notificación</title><style> h1, th, td { text-align: center; } p { font-size: 1em; } body { font-family: Arial, Helvetica, sans-serif; }</style></head><body style="padding: 0px !important; margin: 0px !important"><p style="padding: 0px !important; margin: 0px !important">
        <table
          style="border-collapse: collapse; border: white solid 0px; text-align: center; color: black"
        >
          <tbody style="border: white solid 0px; text-align: center">
            <tr style="border: white solid 0px">
              <td colspan="2" style="border: white solid 0px">
                <img
                  height="100"
                  style="border: white solid 0px"
                  src="https://erp.cropa.com.gt/img/banner_pdf_blanco.jpg"
                />
              </td>
            </tr>
            <tr style="border: white solid 0px; text-align: left">
              <td style="border: white solid 0px; text-align: left">
                Estimado Cliente <br>
                <b>DEPOSITO DENTAL DENTECO, SOCIEDAD ANONIMA</b> <br>
                Presente. <br><br>

                Le saludamos cordialmente para informarle sobre el seguimiento de su mercadería en referencia: <br><br>
              </td>
            </tr>
            
              <tr style="border: white solid 0px">
                <td
                  style="
                    vertical-align: top;
                    text-align: left;
                    padding: 2px;
                    border: white solid 0px;
                  "
                >
                  <span style="font-weight: bolder">Proveedor:</span>
                  <span style="margin-top: 10px; margin-bottom: 10px; margin-left: 10px">
                    LABORATORIOS EUFAR, S.A.
                  </span>
                </td>
              </tr>
              
            

              <tr style="border: white solid 0px">
                <td
                  style="
                    vertical-align: top;
                    text-align: left;
                    padding: 2px;
                    border: white solid 0px;
                  "
                >
                  <span style="font-weight: bolder">Origen:</span>
                  <span style="margin-top: 10px; margin-bottom: 10px; margin-left: 10px">
                    COLOMBIA
                  </span>
                </td>
              </tr>
              

              <tr style="border: white solid 0px">
                <td
                  style="
                    vertical-align: top;
                    text-align: left;
                    padding: 2px;
                    border: white solid 0px;
                  "
                >
                  <span style="font-weight: bolder">Orden de Compra:</span>
                  <span style="margin-top: 10px; margin-bottom: 10px; margin-left: 10px">
                    CT-17051 P01525
                  </span>
                </td>
              </tr>
              

              <tr style="border: white solid 0px">
                <td
                  style="
                    vertical-align: top;
                    text-align: left;
                    padding: 2px;
                    border: white solid 0px;
                  "
                >
                  <span style="font-weight: bolder">Referencia:</span>
                  <span style="margin-top: 10px; margin-bottom: 10px; margin-left: 10px">
                    CT-17051 P01525
                  </span>
                </td>
              </tr>
              
              <tr style="border: white solid 0px">
                <td
                  style="
                    vertical-align: top;
                    text-align: left;
                    padding: 2px;
                    border: white solid 0px;
                  "
                >
                  <span style="font-weight: bolder">Comentario:</span>
                  <span style="margin-top: 10px; margin-bottom: 10px; margin-left: 10px">
                    CONTACTAR A SHIPPER, CONFIRMAR FECHA DE RECOLECCIÓN, ENVIAR RESERVA DE BOOKING, FOTOGRAFIAS DE CARGA, HBL & MBL DRAFT Y FACTURA DE FLETE. NO ESTIBAR A MAS DE CINCO CAJAS. REVISAR INSTRUCCIONES DE PROVEEDOR.
                  </span>
                </td>
              </tr>
              
            <tr style="border: white solid 0px; text-align: left">
              <td style="border: white solid 0px; text-align: left">
                <span>
                  <br>Atentamente:<br>
                </span>
                <span>
                  <b>
                  <br>MARILIN SUSETH PEREZ COLINDRES  
                  <br>Customer Service
                  <br>IMPORTACIONES
                  <br>Grupo Cropa DSV
                  <br>PBX: 2259-0600
                  </b>
                </span>
              </td>
            </tr>
            <tr style="border: white solid 0px">
              <td style="text-align: left; border: white solid 0px" colspan="2">
                <br>
                Para consultar más detalles presione <a href="https://erp.cropa.com.gt/seguimientoFile?data=eyJpdiI6IkdJZEk2blQ5NitoalhBcUh4M1VBV1E9PSIsInZhbHVlIjoiblNUWTZybFNhaGh6TVdid0hMM1pkQUo2c0t6cE91eTJVaE5TeGRLSjJ5cVhYaWtKSDJ3WVBPNFQxSUJHWi83enRWUnAyYnQ1K1MwR2ttSFg1T01zd0hwVDhqRkREK0IrdDFCYTVRRjN4WEZCNEs5RDRmM1hpb29VN3VDQVNJajJmZEdGRVNyMXpTL0NXNGprQkpjMkszVllaby9Mb1lIRDlFYVEweEFLZWVCSy9GTWd3aGZYSGxkczhYQUIwclREOHc4U3JRMUtIS3I5QlV1LzdaeFp2bXNyTXUwYzhJOUp4NDNWN1VPc1d5dmZzK0t5alEyMlVUMytHdU5qdTZFOTJmUmY3N3ZsaGVKdkFGMlpQbU5ZYnRObk8wYWUrZGxUSVFEMWJYQjVnQU9Celh3KzhmQlNBRlMxVVQydVVtaGYxODk3TVl4b29pcXlobVNDRVl2ME53PT0iLCJtYWMiOiIwZDhmMDM3MDU3MzgxNDE2YmYxMzZhMmI1OTE5OGI2YzhhMDk1MWU2NjBhNWQ1YWFlODJjZjE2YzViZmFjYWQxIiwidGFnIjoiIn0%3D&expires=1752351060&signature=f40a66f4c46f131ae7be719de7ee5f65ef9466c2b0f836eb3506191f4e70e907">Aquí.</a>
              </td>
            </tr>
            <tr style="border: white solid 0px">
              <td colspan='100' style="text-align: left; border: white solid 0px">
                <span style="font-size: 11px; color: black"><br><br>Este correo tiene la función de ser informativo, por favor no responder a este correo.<br><br>
                Aviso de Confidencialidad: La información contenida en este correo electrónico es estrictamente confidencial, privilegiada y debe ser utilizada por el destinatario Exclusivamente. Si usted no es el destinatario, por favor elimínelo y notifique al remitente del correo con el fin de garantizar la devolución del correo, documento e información. Por este medio, se le notifica que cualquier publicación, revelación, copia, distribución o cualquier acción que se tome o realice en relación con el contenido del presente correo, está estrictamente prohibido.<br><br>
                Confidentiality Notice: The information contained in this email is strictly confidential and privileged, and should be used exclusively by the addressee. If you are not the addressee please delete it and notify the sender of the mail to en sure the repayment of mail, document and information, By this means be notified that any publication, disclosure, copying, distribution or any action taken or done in connection with the contents of this mail, Is strictly prohibited. Cropa, S.A.
                </span>
              </td>
            </tr>
            <tr style="border: white solid 0px">
              <td colspan='100' style="text-align: left; border: white solid 0px"></td>
            </tr>
            <tr style="border: white solid 0px">
              <td colspan='100' style="text-align: center; border: white solid 0px"><img height='40' width='750' style='border: white solid 0px; height:40px; width:750px' src='https://erp.cropa.com.gt/img/footer_pdf_blanco.jpg' /></td>
            </tr>
          </tbody>
        </table>
      </p></body></html>
    `
}