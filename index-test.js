const axios = require("axios");
const { Builder } = require("xml2js");

const url = "https://ww3.qanalytics.cl/gps_test/service.asmx";
const soapAction = "http://tempuri.org/WM_INS_REPORTE_CLASS";
const usuario = "WS_test";
const clave = "$$WS17";

const builder = new Builder({ headless: true });

/**
 * Genera datos dinámicos tipo GPS.
 */
function generarDatos() {
  const ahora = new Date();

  return [
    {
      ID_REG: ahora.getTime().toString(),
      LATITUD: 12.345 + Math.random() * 0.01,
      LONGITUD: -76.543 + Math.random() * 0.01,
      SENTIDO: Math.floor(Math.random() * 360),
      VELOCIDAD: Math.floor(Math.random() * 120),
      FH_DATO: ahora.toISOString(),
      PLACA: "ABC123",
      CANT_SATELITES: 6 + Math.floor(Math.random() * 5),
      HDOP: 2,
      TEMP1: (25 + Math.random() * 5).toFixed(1),
      TEMP2: 0,
      TEMP3: 0,
      SENSORA_1: (1 + Math.random()).toFixed(2),
      AP: 1,
      IGNICION: 1,
      PANICO: 0,
      SENSORD_1: 0,
      TRANS: "",
    },
  ];
}

/**
 * Construye el XML completo con datos y cabecera.
 */
function construirXML(datos) {
  const datosXML = datos.map((d) => ({ Datos: d }));
  const tablaXML = builder
    .buildObject({ Tabla: datosXML })
    .replace("<Tabla>", "")
    .replace("</Tabla>", "");

  return `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
               xmlns:xsd="http://www.w3.org/2001/XMLSchema"
               xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Header>
    <Authentication xmlns="http://tempuri.org/">
      <Usuario>${usuario}</Usuario>
      <Clave>${clave}</Clave>
    </Authentication>
  </soap:Header>
  <soap:Body>
    <WM_INS_REPORTE_CLASS xmlns="http://tempuri.org/">
      <Tabla>
        ${tablaXML}
      </Tabla>
    </WM_INS_REPORTE_CLASS>
  </soap:Body>
</soap:Envelope>`;
}

/**
 * Envía los datos al servidor.
 */
async function enviarSOAP() {
  const datos = generarDatos();
  const xml = construirXML(datos);

  try {
    const { data } = await axios.post(url, xml, {
      headers: {
        "Content-Type": "text/xml; charset=utf-8",
        SOAPAction: soapAction,
      },
    });

    console.log(`[${new Date().toLocaleTimeString()}] 🟢 Enviado con éxito:`);
    console.log(data);
  } catch (error) {
    console.error("🔴 Error al enviar SOAP:", error.response?.data || error.message);
  }
}

// Enviar cada 30 segundos
setInterval(enviarSOAP, 30000);
enviarSOAP(); // Primer envío inmediato
