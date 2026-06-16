/**
 * Servicio de envío de emails usando Resend.
 * Docs: https://resend.com/docs
 *
 * Tipos de email:
 * - audit_report: Informe de auditoría completado
 * - follow_up_3: Seguimiento día 3
 * - follow_up_7: Seguimiento día 7
 * - follow_up_14: Seguimiento día 14
 */

import { Resend } from "resend";
import { config } from "./config";
import type { EmailType } from "@/types";
import prisma from "./db";

const resend = config.resendApiKey ? new Resend(config.resendApiKey) : null;

/**
 * Envía el email con el informe de auditoría.
 */
export async function sendAuditReportEmail(
  email: string,
  informeUrl: string,
  pdfUrl: string,
  domain: string,
  score: number
): Promise<boolean> {
  const subject = `✅ Tu informe SEO de ${domain} está listo — Puntuación: ${score}/100`;

  const html = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a2a3a;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #1a2a3a; font-size: 24px;">Audita<span style="color: #10b981;">SEO</span></h1>
  </div>

  <h2 style="color: #1a2a3a;">¡Tu informe SEO está listo!</h2>

  <p>Hola,</p>
  <p>Hemos completado la auditoría SEO de <strong>${domain}</strong>. Tu puntuación global es:</p>

  <div style="text-align: center; margin: 30px 0;">
    <div style="display: inline-block; background: ${score >= 80 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444'}; color: white; font-size: 48px; font-weight: bold; padding: 20px 40px; border-radius: 16px;">
      ${score}/100
    </div>
  </div>

  <div style="background: #f9fafb; border-radius: 12px; padding: 20px; margin: 25px 0;">
    <h3 style="margin-top: 0;">📊 ¿Qué incluye tu informe?</h3>
    <ul style="padding-left: 20px;">
      <li>Análisis de posicionamiento en Google</li>
      <li>Auditoría técnica completa</li>
      <li>Comparativa con 3 competidores</li>
      <li>5 recomendaciones priorizadas</li>
      <li>Plan de acción paso a paso</li>
    </ul>
  </div>

  <div style="text-align: center; margin: 35px 0;">
    <a href="${informeUrl}" style="background: #10b981; color: white; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-size: 16px; font-weight: bold; display: inline-block;">
      📄 Ver mi informe online
    </a>
  </div>

  <p style="color: #6b7280; font-size: 14px;">También puedes descargar el PDF adjunto para compartirlo con tu equipo.</p>

  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
    <p style="margin-bottom: 5px;"><strong>¿Quieres ir más allá?</strong></p>
    <p style="color: #6b7280; font-size: 14px; margin-top: 0;">
      <a href="${config.calendlyUrl}" style="color: #10b981;">Agenda una consultoría gratuita</a> con un experto SEO que te ayudará a implementar estas mejoras.
    </p>
  </div>

  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #9ca3af; font-size: 12px;">
    <p>AuditaSEO — Auditorías SEO gratuitas para hacer crecer tu negocio</p>
  </div>
</body>
</html>`;

  return sendEmail(email, subject, html);
}

/**
 * Email de seguimiento: Día 3 — ¿Te ha sido útil?
 */
export async function sendFollowUp3Email(
  email: string,
  informeUrl: string,
  domain: string
): Promise<boolean> {
  const subject = `🤔 ¿Te ha sido útil el informe SEO de ${domain}?`;

  const html = `
<!DOCTYPE html>
<html lang="es">
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a2a3a;">
  <h2>Hola de nuevo 👋</h2>
  <p>Hace unos días te enviamos el informe SEO de <strong>${domain}</strong>. ¿Has tenido oportunidad de revisarlo?</p>
  <p>Sabemos que un informe SEO puede ser abrumador. Por eso, me encantaría ayudarte a interpretarlo personalmente en una videollamada de 30 minutos (sin costo).</p>

  <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
    <p style="margin: 0;"><strong>🗓️ En esta sesión gratuita veremos:</strong></p>
    <ul style="margin: 10px 0 0 0; padding-left: 20px;">
      <li>Los 3 problemas más urgentes de tu web</li>
      <li>Qué están haciendo mejor tus competidores</li>
      <li>Un plan de acción realista para tu presupuesto</li>
    </ul>
  </div>

  <div style="text-align: center; margin: 30px 0;">
    <a href="${config.calendlyUrl}" style="background: #10b981; color: white; text-decoration: none; padding: 14px 36px; border-radius: 8px; font-weight: bold; display: inline-block;">Agendar mi consultoría gratuita →</a>
  </div>

  <p style="margin-bottom: 0;">¿Ya lo revisaste? <a href="${informeUrl}" style="color: #10b981;">Ver informe de nuevo</a></p>
</body>
</html>`;

  return sendEmail(email, subject, html);
}

/**
 * Email de seguimiento: Día 7 — Oferta especial
 */
export async function sendFollowUp7Email(
  email: string,
  informeUrl: string,
  domain: string
): Promise<boolean> {
  const subject = `🎯 Oferta especial: Primera consultoría gratuita para ${domain}`;

  const html = `
<!DOCTYPE html>
<html lang="es">
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a2a3a;">
  <h2>¿Sabías que el 75% de los usuarios nunca pasan de la primera página de Google?</h2>
  <p>Si <strong>${domain}</strong> no está en la primera página para tus keywords clave, estás perdiendo clientes cada día.</p>

  <div style="background: #1a2a3a; color: white; padding: 25px; border-radius: 12px; margin: 25px 0; text-align: center;">
    <p style="font-size: 18px; margin: 0 0 10px 0;">🎁 <strong>Oferta especial para ti</strong></p>
    <p style="font-size: 28px; font-weight: bold; margin: 10px 0;">Primera consultoría GRATIS</p>
    <p style="opacity: 0.8; margin: 10px 0 0 0;">Sin compromiso • 45 minutos • Plan de acción personalizado</p>
  </div>

  <div style="text-align: center; margin: 30px 0;">
    <a href="${config.calendlyUrl}" style="background: #10b981; color: white; text-decoration: none; padding: 14px 36px; border-radius: 8px; font-weight: bold; display: inline-block;">Reservar mi plaza →</a>
  </div>

  <p style="color: #6b7280; font-size: 13px; text-align: center;">Plazas limitadas esta semana</p>
</body>
</html>`;

  return sendEmail(email, subject, html);
}

/**
 * Email de seguimiento: Día 14 — Caso de éxito
 */
export async function sendFollowUp14Email(
  email: string,
  informeUrl: string,
  domain: string
): Promise<boolean> {
  const subject = `📈 ¿Qué pasaría si ${domain} mejorara un 30% su tráfico?`;

  const html = `
<!DOCTYPE html>
<html lang="es">
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a2a3a;">
  <h2>Un caso real 📊</h2>
  <p>Uno de nuestros clientes del sector digital pasó de <strong>2.000 a 8.500 visitas mensuales</strong> en 6 meses aplicando las mejoras que detectamos en su auditoría inicial.</p>

  <div style="background: #f0fdf4; border-radius: 12px; padding: 20px; margin: 25px 0;">
    <p style="margin: 0;"><strong>✅ Lo que hicieron:</strong></p>
    <ul style="margin: 10px 0 0 0; padding-left: 20px;">
      <li>Optimizaron 15 páginas clave con las keywords correctas</li>
      <li>Corrigieron errores técnicos que bloqueaban el rastreo</li>
      <li>Crearon contenido orientado a las preguntas de sus clientes</li>
      <li>Mejoraron la velocidad de carga (de 6.2s a 1.8s)</li>
    </ul>
  </div>

  <p><strong>${domain} puede conseguir resultados similares.</strong> Todo empieza con una conversación.</p>

  <div style="text-align: center; margin: 30px 0;">
    <a href="${config.calendlyUrl}" style="background: #10b981; color: white; text-decoration: none; padding: 14px 36px; border-radius: 8px; font-weight: bold; display: inline-block;">Quiero resultados así →</a>
  </div>

  <p style="color: #6b7280; font-size: 12px; text-align: center; margin-top: 30px;">Si prefieres no recibir más emails, responde con "baja" y te eliminamos de la lista.</p>
</body>
</html>`;

  return sendEmail(email, subject, html);
}

// -----------------------------------------------------------
// Función genérica de envío
// -----------------------------------------------------------
async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<boolean> {
  if (!resend) {
    console.warn(`[Email] Resend not configured. Would send to: ${to}, subject: ${subject}`);
    // Simulamos éxito en desarrollo
    return true;
  }

  try {
    const { error } = await resend.emails.send({
      from: config.emailFrom,
      to,
      subject,
      html,
    });

    if (error) {
      console.error(`[Email] Error sending to ${to}:`, error);
      return false;
    }

    console.log(`[Email] Sent successfully to ${to}: ${subject}`);
    return true;
  } catch (error) {
    console.error(`[Email] Exception sending to ${to}:`, error);
    return false;
  }
}

/**
 * Envía el email correspondiente según el tipo y registra en la DB.
 */
export async function sendScheduledEmail(
  leadId: string,
  email: string,
  type: EmailType,
  informeUrl: string,
  domain: string
): Promise<void> {
  let success = false;

  switch (type) {
    case "audit_report":
      success = await sendAuditReportEmail(email, informeUrl, "", domain, 0);
      break;
    case "follow_up_3":
      success = await sendFollowUp3Email(email, informeUrl, domain);
      break;
    case "follow_up_7":
      success = await sendFollowUp7Email(email, informeUrl, domain);
      break;
    case "follow_up_14":
      success = await sendFollowUp14Email(email, informeUrl, domain);
      break;
  }

  // Registrar en la base de datos
  await prisma.emailLog.create({
    data: {
      leadId,
      type,
      error: success ? null : "Failed to send",
    },
  });

  // Actualizar sentAt en el lead si es el informe principal
  if (type === "audit_report" && success) {
    await prisma.lead.update({
      where: { id: leadId },
      data: { sentAt: new Date() },
    });
  }
}
