const url = import.meta.env.VITE_ERROR_LOG_URL;
import axios from "axios";
import moment from "moment";

const crearError = async (error /* { code, message, id_usuario, nombre } */) => {
  let data = {
    type: "message",
    attachments: [
      {
        contentType: "application/vnd.microsoft.card.adaptive",
        contentUrl: null,
        content: {
          $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
          type: "AdaptiveCard",
          version: "1.2",
          msTeams: {
            width: "full",
          },
          body: [
            {
              type: "TextBlock",
              weight: "bolder",
              text: `${error.code.includes("W") ? "🟡⚠️" : "🔴❗"} ${error.code.includes("W") ? "ALERTA" : "ERROR"} ${`${error.id}`} `,
              style: "heading",
              wrap: true,
            },
            {
              type: "ColumnSet",
              columns: [
                {
                  type: "Column",
                  items: [
                    {
                      type: "Container",
                      items: [{ type: "TextBlock", text: "" }],
                      backgroundImage: {
                        url: error.code.includes("W")
                          ? "https://htmlcolorcodes.com/assets/images/colors/orange-color-solid-background-1920x1080.png"
                          : "https://htmlcolorcodes.com/assets/images/colors/red-color-solid-background-1920x1080.png",
                        horizontalAlignment: "Center",
                      },
                      verticalContentAlignment: "Center",
                      rtl: false,
                      height: "stretch",
                      horizontalAlignment: "Center",
                    },
                  ],
                  width: "5%",
                },
                {
                  type: "Column",
                  items: [
                    {
                      type: "ColumnSet",
                      columns: [
                        {
                          type: "Column",
                          items: [
                            { type: "TextBlock", weight: "bolder", text: `[[Crear Issue](http://erp.cropa.com.gt/)]` },
                            { type: "TextBlock", weight: "bolder", text: ``, wrap: true },
                          ],
                          width: "40%",
                        },
                        {
                          type: "Column",
                          items: [
                            { type: "TextBlock", weight: "bolder", text: `[\`${error.code}\`] ${error.message}`, wrap: true },
                            { type: "TextBlock", weight: "bolder", text: `*USUARIO*: [${error.id_usuario}] _${error.nombre}_`, wrap: true },
                          ],
                          width: "stretch",
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      },
    ],
  };

  await axios.post(url, data);
  // .then((response) => {
  //   console_log("Mensaje enviado a Teams:", response.data);
  // })
  // .catch((error) => {
  //   console_error("Error al enviar mensaje a Teams:", error);
  // });
};

export default crearError;
