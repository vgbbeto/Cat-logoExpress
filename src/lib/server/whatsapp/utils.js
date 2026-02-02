// src/lib/server/whatsapp/utils.js
// ✅ UTILIDAD CENTRALIZADA PARA ABRIR WHATSAPP

/**
 * Genera URL de WhatsApp y opcionalmente la abre automáticamente
 * @param {string} telefono - Número de WhatsApp del cliente (solo dígitos)
 * @param {string} mensaje - Mensaje pre-llenado
 * @param {boolean} abrirAutomatico - Si debe abrir WhatsApp automáticamente
 * @returns {string} URL de WhatsApp
 */
export function generarYAbrirWhatsApp(telefono, mensaje, abrirAutomatico = false) {
  // Limpiar teléfono
  const telefonoLimpio = telefono.replace(/\D/g, '');
  
  // Generar URL
  const url = `https://wa.me/${telefonoLimpio}?text=${encodeURIComponent(mensaje)}`;
  
  // Si está en el navegador y se solicita apertura automática
  if (abrirAutomatico && typeof window !== 'undefined') {
    window.open(url, '_blank');
  }
  
  return url;
}

/**
 * Formatea número de teléfono para WhatsApp
 */
export function formatearTelefonoWhatsApp(telefono) {
  if (!telefono) return '';
  
  // Eliminar todo excepto dígitos
  let limpio = telefono.replace(/\D/g, '');
  
  // Si empieza con 0, reemplazar con código México (52)
  if (limpio.startsWith('0')) {
    limpio = '52' + limpio.substring(1);
  }
  
  // Si no tiene código de país y es número mexicano (10 dígitos)
  if (limpio.length === 10) {
    limpio = '52' + limpio;
  }
  
  return limpio;
}