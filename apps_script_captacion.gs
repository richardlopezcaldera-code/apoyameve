/**
 * Backend de CAPTACIÓN para Google Apps Script.
 * Recibe el webhook del escaneo (app/captacion_scan.py), guarda las
 * oportunidades en un Google Sheet y envía un correo resumen.
 *
 * Despliegue:
 *  1. Crea un Google Sheet nuevo -> Extensiones -> Apps Script.
 *  2. Pega este código. Ajusta EMAILS_DESTINO.
 *  3. Ejecuta prueba() una vez para autorizar permisos.
 *  4. Implementar -> Nueva implementación -> Aplicación web ->
 *     Ejecutar como: yo | Acceso: cualquier usuario -> copia la URL /exec.
 *  5. Pega esa URL en CAPTACION_WEBHOOK_URL del .env del backend.
 */

var EMAILS_DESTINO = "ventas@tuempresa.cl";   // separa con coma si son varios
var HOJA = "Captacion";

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var ops = data.oportunidades || [];
    var sh = _hoja();
    var hoy = new Date();
    ops.forEach(function (o) {
      sh.appendRow([hoy, o.codigo, o.nombre, o.organismo, o.region,
                    o.monto_estimado, o.fecha_cierre, o.score,
                    (o.motivos || []).join("; ")]);
    });
    if (ops.length > 0) _enviarCorreo(ops);
    return ContentService.createTextOutput(
      JSON.stringify({ ok: true, guardadas: ops.length }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function _hoja() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(HOJA);
  if (!sh) {
    sh = ss.insertSheet(HOJA);
    sh.appendRow(["Fecha", "Código", "Nombre", "Organismo", "Región",
                  "Monto estimado", "Cierre", "Score", "Motivos"]);
  }
  return sh;
}

function _enviarCorreo(ops) {
  var filas = ops.map(function (o) {
    return "<tr><td>" + o.score + "</td><td>" + o.nombre +
      "</td><td>" + (o.organismo || "") + "</td><td>" + (o.region || "") +
      "</td><td>$" + (o.monto_estimado || 0) + "</td><td>" +
      (o.fecha_cierre || "") + "</td><td>" + o.codigo + "</td></tr>";
  }).join("");
  var html =
    "<h2>Nuevas licitaciones captadas (" + ops.length + ")</h2>" +
    "<table border='1' cellpadding='6' style='border-collapse:collapse'>" +
    "<tr><th>Score</th><th>Nombre</th><th>Organismo</th><th>Región</th>" +
    "<th>Monto</th><th>Cierre</th><th>Código</th></tr>" + filas + "</table>";
  MailApp.sendEmail({
    to: EMAILS_DESTINO,
    subject: "🔔 " + ops.length + " licitaciones captadas para ti",
    htmlBody: html
  });
}

function prueba() {
  doPost({ postData: { contents: JSON.stringify({
    oportunidades: [{
      codigo: "1209395-10-LE26",
      nombre: "Mobiliario y Equipamiento para RF de AADD",
      organismo: "Servicio de Protección Araucanía",
      region: "Araucanía", monto_estimado: 20234260,
      fecha_cierre: "2026-07-27T15:00:00", score: 75,
      motivos: ["palabras clave: mobiliario", "UNSPSC de mobiliario"]
    }]
  }) } });
}
