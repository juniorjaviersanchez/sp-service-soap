const mysql = require("mysql2/promise");

require('dotenv').config();

// Configuración de la base de datos
const dbConfig = {
  host: process.env.BD_HOST,  // Cambia por tu host de la base de datos
  user: process.env.BD_USER, // Cambia por tu usuario
  password: process.env.BD_PASSWORD, // Cambia por tu contraseña
  database: process.env.BD_DATABASE,  // Nombre de la base de datos
};

/**
 * Crea la conexión a la base de datos
 */
async function conectarBD() {
  const connection = await mysql.createConnection(dbConfig);
  return connection;
}

/**
 * Obtiene el último registro de las tablas dinámicamente por sus ID.
 * Ahora usa un array de objetos con `placa` e `imei` en lugar de solo IDs.
 * @param {Array} objetos - Array con objetos que contienen `placa` e `imei`.
 */
async function obtenerUltimosRegistros(objetos) {
    const connection = await conectarBD();
    const resultados = [];
  
    for (const obj of objetos) {
      const { placa, imei } = obj;
      const nombreTabla = `gs_object_data_${imei}`;
  
      const [rows] = await connection.execute(`
        SELECT * FROM ${nombreTabla}
        ORDER BY dt_tracker DESC
        LIMIT 1
      `);
  
      // Si hay registros, los agregamos al array de resultados
      if (rows.length > 0) {
        const registro = rows[0];
        registro.id = imei;  // Añadimos la propiedad 'id' con el valor de imei
        registro.placa = placa; // También agregamos la placa al registro
        resultados.push(registro);
      } else {
        resultados.push(null); // Si no hay registros, agregamos null
      }
    }
  
    await connection.end(); // Cerrar la conexión
    return resultados;
}




module.exports = { obtenerUltimosRegistros };
