function baseTemplate(content: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 30px auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .header { background: #0097b2; padding: 24px 32px; text-align: center; }
    .header h1 { color: #fff; font-size: 22px; margin: 8px 0 0; font-weight: 800; }
    .body { padding: 32px; color: #333; line-height: 1.6; }
    .btn { display: inline-block; background: #0097b2; color: #fff; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-weight: 600; margin: 16px 0; }
    .btn-orange { background: #f39c12; }
    .footer { background: #f9f9f9; padding: 16px 32px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #eee; }
    .alert { background: #f39c12; color: #fff; padding: 12px 16px; border-radius: 6px; margin: 16px 0; font-weight: 600; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    td { padding: 8px 0; border-bottom: 1px solid #eee; }
    .label { color: #666; }
    .value { font-weight: 600; }
    .code { font-family: monospace; font-size: 18px; color: #f39c12; font-weight: 700; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔐 EscapeMaster</h1>
    </div>
    <div class="body">${content}</div>
    <div class="footer">
      EscapeMaster · escapemaster.es<br>
      <a href="https://escapemaster.es" style="color:#0097b2">escapemaster.es</a> · <a href="mailto:support@escapemaster.es" style="color:#0097b2">support@escapemaster.es</a>
    </div>
  </div>
</body>
</html>`;
}

export function confirmacionReservaTemplate(data: {
  nombreUsuario: string;
  nombreSala: string;
  fecha: string;
  hora: string;
  jugadores: number;
  codigoReserva: string;
  precioTotal: number;
  direccion: string;
  urlReserva: string;
}) {
  return baseTemplate(`
    <h2>¡Reserva confirmada! 🎉</h2>
    <p>Hola <strong>${data.nombreUsuario}</strong>,</p>
    <p>Tu reserva está lista. Aquí tienes los detalles:</p>
    <table>
      <tr><td class="label">Sala</td><td class="value">${data.nombreSala}</td></tr>
      <tr><td class="label">Fecha</td><td class="value">${data.fecha}</td></tr>
      <tr><td class="label">Hora</td><td class="value">${data.hora}</td></tr>
      <tr><td class="label">Jugadores</td><td class="value">${data.jugadores}</td></tr>
      <tr><td class="label">Precio Total</td><td class="value">${data.precioTotal}€</td></tr>
      <tr><td class="label">Dirección</td><td class="value">${data.direccion}</td></tr>
      <tr><td class="label">Código</td><td class="value code">${data.codigoReserva}</td></tr>
    </table>
    <a href="${data.urlReserva}" class="btn">Ver mi reserva</a>
    <p style="color:#666;font-size:14px">¿Necesitas cancelar o modificar? Escríbenos a <a href="mailto:support@escapemaster.es">support@escapemaster.es</a></p>
  `);
}

export function verificacionCuentaTemplate(data: {
  nombreUsuario: string;
  urlVerificacion: string;
}) {
  return baseTemplate(`
    <h2>Verifica tu cuenta</h2>
    <p>Hola <strong>${data.nombreUsuario}</strong>,</p>
    <p>Gracias por registrarte en EscapeMaster. Para activar tu cuenta, haz clic en el botón:</p>
    <a href="${data.urlVerificacion}" class="btn">Verificar mi cuenta</a>
    <p style="color:#666;font-size:13px">Este enlace expira en 24 horas. Si no creaste esta cuenta, ignora este correo.</p>
  `);
}

export function recordatorioReservaTemplate(data: {
  nombreUsuario: string;
  nombreSala: string;
  fecha: string;
  hora: string;
  direccion: string;
  codigoReserva: string;
  urlReserva: string;
}) {
  return baseTemplate(`
    <div class="alert">¡Tu aventura es mañana! ⏰</div>
    <p>Hola <strong>${data.nombreUsuario}</strong>,</p>
    <p>Te recordamos que tienes una reserva confirmada:</p>
    <table>
      <tr><td class="label">Sala</td><td class="value">${data.nombreSala}</td></tr>
      <tr><td class="label">Fecha</td><td class="value">${data.fecha}</td></tr>
      <tr><td class="label">Hora</td><td class="value">${data.hora}</td></tr>
      <tr><td class="label">Código</td><td class="value code">${data.codigoReserva}</td></tr>
    </table>
    <p>📍 <strong>${data.direccion}</strong></p>
    <a href="${data.urlReserva}" class="btn">Ver detalles</a>
    <p style="color:#666;font-size:14px">¿Necesitas cancelar o modificar? Escríbenos a <a href="mailto:support@escapemaster.es">support@escapemaster.es</a></p>
  `);
}

export function recuperarPasswordTemplate(data: {
  nombreUsuario: string;
  urlReset: string;
}) {
  return baseTemplate(`
    <h2>Restablecer contraseña</h2>
    <p>Hola <strong>${data.nombreUsuario}</strong>,</p>
    <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta.</p>
    <a href="${data.urlReset}" class="btn btn-orange">Restablecer contraseña</a>
    <p style="color:#666;font-size:13px">Este enlace expira en 1 hora. Si no solicitaste esto, ignora este correo — tu cuenta está segura.</p>
  `);
}

export function soporteTemplate(data: {
  nombreUsuario: string;
  email: string;
  mensaje: string;
  idTicket?: string;
}) {
  return baseTemplate(`
    <h2>Nuevo mensaje de soporte</h2>
    <p><strong>${data.nombreUsuario}</strong> (${data.email}) ha enviado un mensaje:</p>
    <div style="background:#f9f9f9;padding:16px;border-radius:8px;margin:16px 0">
      <p style="margin:0">${data.mensaje}</p>
    </div>
    ${data.idTicket ? `<p class="code">Ticket: ${data.idTicket}</p>` : ""}
    <p style="color:#666;font-size:14px">Responde directamente a este email para contestar al usuario.</p>
  `);
}

export function emailBaseTemplate(data: {
  titulo: string;
  contenido: string;
  botonTexto?: string;
  botonUrl?: string;
}) {
  return baseTemplate(`
    <h2>${data.titulo}</h2>
    ${data.contenido}
    ${data.botonTexto && data.botonUrl ? `<a href="${data.botonUrl}" class="btn">${data.botonTexto}</a>` : ""}
  `);
}
