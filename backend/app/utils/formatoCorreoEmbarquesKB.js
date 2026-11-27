async function formatoCorreoEmbarquesKB({
  cod_interno,
  desc_estado,
  observacion,
}) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta http-equiv="content-type" content="text/html; charset=utf-8" />
        <title>Actualización de Gestión Embarques KB</title>
    </head>

    <body
        style="
        padding: 0;
        margin: 0;
        font-family: Arial, Helvetica, sans-serif;
        color: #000000;
        "
    >
        <table
        role="presentation"
        style="width: 100%; border-collapse: collapse; border: 0; color: #000000;"
        >
        <tbody>
            <tr>
            <td style="text-align: center; border: 0;">
                <img
                height="100"
                alt="CROPA"
                src="https://erp.cropa.com.gt/img/banner_pdf_blanco.jpg"
                style="border: 0;"
                />
            </td>
            </tr>
            <tr>
            <td style="text-align: left; border: 0; padding: 16px;">
                Estimado usuario:<br /><br />
                Le informamos que se ha realizado un nuevo cambio en
                <b>Gesti&oacute;n Embarques KB No. ${cod_interno}</b>.<br /><br />
                El cambio corresponde a: <b>${desc_estado}</b> <br>
            </td>
            </tr>

            <tr>
            <td style="text-align: left; border: 0; padding: 16px;">
                <b>Observación:</b><br><br>
                <i style="font-size:16px">${observacion}</i><br>  
            </td>
            </tr>

            <tr>
            <td style="text-align: left; border: 0; padding: 16px;">
                Puede consultar la lista de embarques desde el siguiente enlace.
            </td>
            </tr>

            <tr>
            <td style="text-align: center; border: 0; padding: 10px 16px;">
                <a
                href="https://app.cropa.com.gt/tracking/tracking-embarques/tracking-embarques"
                style="
                    background-color: #1a3a5c;
                    color: #ffffff;
                    padding: 12px 24px;
                    font-size: 15px;
                    font-weight: bold;
                    border-radius: 4px;
                    text-decoration: none;
                    display: inline-block;
                "
                >
                Ver lista de embarques
                </a>
            </td>
            </tr>
            <tr>
            <td style="text-align: center; border: 0; padding: 10px 16px;">
                Si el bot&oacute;n no funciona, copie y pegue este enlace en su navegador:<br />
                <a
                href="https://app.cropa.com.gt/tracking/tracking-embarques/tracking-embarques"
                style="color: #1a3a5c; word-break: break-all;"
                >
                https://app.cropa.com.gt/tracking/tracking-embarques/tracking-embarques
                </a>
            </td>
            </tr>
            <tr>
            <td style="text-align: left; border: 0; padding: 16px;">
                Atentamente:<br /><br />
                <b>Equipo de Gesti&oacute;n Embarques KB<br />CROPA, S.A.</b>
            </td>
            </tr>
            <tr>
            <td
                style="
                text-align: left;
                border: 0;
                padding: 16px;
                font-size: 11px;
                color: #000000;
                "
            >
                Este correo tiene la funci&oacute;n de ser informativo; por favor, no responda a este correo.
                <br /><br />
                Aviso de Confidencialidad: La informaci&oacute;n contenida en este correo electr&oacute;nico
                es estrictamente confidencial, privilegiada y debe ser utilizada exclusivamente por el
                destinatario. Si usted no es el destinatario, por favor elim&iacute;nelo y notifique al
                remitente. Cualquier publicaci&oacute;n, revelaci&oacute;n, copia, distribuci&oacute;n o
                acci&oacute;n relacionada con el contenido de este correo est&aacute; estrictamente
                prohibida.
                <br /><br />
                Confidentiality Notice: The information contained in this email is strictly confidential
                and privileged, and should be used exclusively by the addressee. If you are not the
                addressee, please delete it and notify the sender. Any publication, disclosure, copying,
                distribution, or action related to the contents of this email is strictly prohibited.
                Cropa, S.A.
            </td>
            </tr>
            <tr>
            <td style="text-align: center; border: 0;">
                <img
                height="40"
                width="750"
                alt=""
                src="https://erp.cropa.com.gt/img/footer_pdf_blanco.jpg"
                style="border: 0; height: 40px; width: 750px;"
                />
            </td>
            </tr>
        </tbody>
        </table>
    </body>
    </html>
    `;
}

module.exports.formatoCorreoEmbarquesKB = formatoCorreoEmbarquesKB;
