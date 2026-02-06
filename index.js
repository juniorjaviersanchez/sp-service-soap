const axios = require("axios");
const { Builder } = require("xml2js");
const { obtenerUltimosRegistros } = require("./dbConnection");
require('dotenv').config();

const url = process.env.SOAP_URL;
const soapAction = process.env.SOAP_ACTION;
const usuario = process.env.SOAP_USER;
const clave = process.env.SOAP_PASSWORD;

const builder = new Builder({ headless: true });

function formatearFecha(fecha) {
  const f = new Date(fecha);

  const yyyy = f.getFullYear();
  const mm = String(f.getMonth() + 1).padStart(2, '0');
  const dd = String(f.getDate()).padStart(2, '0');

  const hh = String(f.getHours()).padStart(2, '0');
  const min = String(f.getMinutes()).padStart(2, '0');
  const ss = String(f.getSeconds()).padStart(2, '0');

  return `${yyyy}${mm}${dd} ${hh}:${min}:${ss}`;
}

async function generarDatos(ids) {
  const registros = await obtenerUltimosRegistros(ids);  // Obtener los últimos registros de las tablas

  // Mapea los registros obtenidos para formar el array de datos
  return registros.map((registro) => {
    if (registro) {
      return {
        ID_REG: `${registro.id || "001"}`,  // Bien
        LATITUD: registro.lat, // Bien
        LONGITUD: registro.lng, // Bien
        SENTIDO: registro.course || 0,
        VELOCIDAD: registro.speed || 0, // Bien
        FH_DATO: formatearFecha(registro.dt_tracker),
        PLACA: registro.placa || "ABC123", // Bien
        CANT_SATELITES: registro.sat || 0,
        HDOP: registro.hdop || 0,
        TEMP1: registro.temp1 || 0,
        TEMP2: registro.temp2 || 0,
        TEMP3: registro.temp3 || 0,
        SENSORA_1: registro.sensor_a1 || 0,
        AP: registro.ap || 0,
        IGNICION: registro.ignition || 0,
        PANICO: registro.panico || 0,
        SENSORD_1: registro.sensor_d1 || 0,
        TRANS: "",
      };
    }
    return {}; // En caso de que no haya registro
  });
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
async function enviarSOAP(ids) {
  const datos = await generarDatos(ids);  // Obtener los datos de las tablas dinámicamente

  console.log(datos);
  
  // return;
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

// Ejemplo: Enviar datos para varias tablas
const idsTablas = [
  { placa: "CAR-921", imei: "865784054739076" },
  { placa: "F4P-710", imei: "351510090686752" }
];

// Enviar cada 30 segundos
setInterval(() => enviarSOAP(idsTablas), 30000);
enviarSOAP(idsTablas); // Primer envío inmediato
