// src/routes/api/pedidos/[id]/cambiar-estado/+server.js
//  APERTURA AUTOMÁTICA DE WHATSAPP

import { json } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/supabaseServer';
import { 
  ESTADOS, 
  validarTransicionConContexto 
} from '$lib/server/pedidos/estados';
import { encolarNotificacion, procesarCola } from '$lib/server/notificaciones/cola';
import { generarMensajeWhatsApp } from '$lib/server/notificaciones/mensajes';

export async function POST({ params, request }) {
  const { id } = params;
  
  try {
    const { estado_nuevo, notas, tipo_usuario = 'vendedor' } = await request.json();
    
    if (!estado_nuevo) {
      return json({ success: false, error: 'Estado nuevo es requerido' }, { status: 400 });
    }
    
    // Obtener pedido actual
    const { data: pedido, error: errorPedido } = await supabaseAdmin
      .from('pedidos')
      .select('*, items:pedidos_items(*)')
      .eq('id', id)
      .single();
    
    if (errorPedido || !pedido) {
      return json({ success: false, error: 'Pedido no encontrado' }, { status: 404 });
    }
    
    // Validar transición
    const validacion = validarTransicionConContexto(pedido, estado_nuevo);
    if (!validacion.valido) {
      return json({ success: false, error: validacion.mensaje }, { status: 400 });
    }
    
    // Preparar datos de actualización
    const updateData = { estado: estado_nuevo };
    
    switch (estado_nuevo) {
      case ESTADOS.CONFIRMADO:
        updateData.fecha_confirmado = new Date().toISOString();
        break;
      case ESTADOS.PAGADO:
        updateData.fecha_pagado = new Date().toISOString();
        updateData.estado_pago = 'pagado';
        break;
      case ESTADOS.PREPARANDO:
        updateData.fecha_preparando = new Date().toISOString();
        break;
      case ESTADOS.ENVIADO:
        if (pedido.envio && !pedido.guia_envio?.numero_guia) {
          return json({ 
            success: false, 
            error: 'Debe capturar la guía de envío antes de marcar como enviado' 
          }, { status: 400 });
        }
        updateData.fecha_enviado = pedido.fecha_enviado || new Date().toISOString();
        break;
      case ESTADOS.RECIBIDO:
        updateData.fecha_recibido = new Date().toISOString();
        break;
      case ESTADOS.ENTREGADO:
        updateData.fecha_entregado = new Date().toISOString();
        break;
      case ESTADOS.CANCELADO:
        updateData.fecha_cancelado = new Date().toISOString();
        updateData.motivo_cancelacion = notas || 'Cancelado por vendedor';
        break;
    }
    
    // Actualizar pedido
    const { data: pedidoActualizado, error: errorUpdate } = await supabaseAdmin
      .from('pedidos')
      .update(updateData)
      .eq('id', id)
      .select('*, items:pedidos_items(*)')
      .single();
    
    if (errorUpdate) {
      console.error('Error actualizando estado:', errorUpdate);
      return json({ success: false, error: 'Error al cambiar estado' }, { status: 500 });
    }
    
    // Registrar en historial
    await supabaseAdmin
      .from('pedidos_historial')
      .insert({
        pedido_id: id,
        estado_anterior: pedido.estado,
        estado_nuevo: estado_nuevo,
        tipo_usuario: tipo_usuario,
        notas: notas || `Cambio de estado a ${estado_nuevo}`
      });
    
    // ✅ GENERAR URL DE WHATSAPP
    let urlWhatsApp = null;
    let mensajeGenerado = null;
    
    try {
      const { data: config } = await supabaseAdmin
        .from('configuracion')
        .select('*')
        .single();
      
      const resultado = await generarMensajeYURL(pedidoActualizado, estado_nuevo, config);
      
      if (resultado) {
        urlWhatsApp = resultado.url;
        mensajeGenerado = resultado.mensaje;
        
        // ✅ ENCOLAR NOTIFICACIÓN (para historial)
        await encolarNotificacion({
          pedidoId: id,
          clienteWhatsapp: pedidoActualizado.cliente_whatsapp,
          tipo: obtenerTipoNotificacion(estado_nuevo),
          prioridad: 'alta',
          metadata: resultado.metadata || {}
        });
        
        // Procesar cola en background
        procesarCola().catch(err => console.error('Error procesando cola:', err));
      }
    } catch (notifError) {
      console.error('⚠️ Error generando mensaje WhatsApp:', notifError);
    }
    
    console.log(`✅ Pedido ${pedido.numero_pedido}: ${pedido.estado} → ${estado_nuevo}`);
    
    return json({
      success: true,
      data: pedidoActualizado,
      message: `Pedido actualizado a ${estado_nuevo}`,
      whatsapp: {
        url: urlWhatsApp,
        mensaje: mensajeGenerado,
        auto_abrir: true // ✅ Señal para abrir automáticamente
      }
    });
    
  } catch (error) {
    console.error('Error en cambiar-estado:', error);
    return json({ success: false, error: 'Error interno del servidor' }, { status: 500 });
  }
}

/**
 * ✅ Genera mensaje y URL de WhatsApp según el estado
 */
async function generarMensajeYURL(pedido, estadoNuevo, config) {
  let tipoNotificacion = null;
  let metadata = {};
  
  switch (estadoNuevo) {
    case ESTADOS.CONFIRMADO:
      tipoNotificacion = 'pedido_confirmado';
      
      // Obtener cuentas de pago
      const cuentasPago = config?.cuentas_pago 
        ? (typeof config.cuentas_pago === 'string' 
            ? JSON.parse(config.cuentas_pago) 
            : config.cuentas_pago)
        : [];
      
      metadata = { cuentas_pago: cuentasPago };
      break;
      
    case ESTADOS.PREPARANDO:
      tipoNotificacion = 'pedido_preparando';
      metadata = {
        ciudad: pedido.cliente_direccion?.ciudad,
        estado: pedido.cliente_direccion?.estado
      };
      break;
      
    case ESTADOS.ENVIADO:
      tipoNotificacion = 'pedido_enviado';
      metadata = {
        guia_envio: pedido.guia_envio?.numero_guia,
        transportadora: pedido.guia_envio?.paqueteria,
        url_rastreo: pedido.guia_envio?.url_rastreo
      };
      break;
      
    case ESTADOS.RECIBIDO:
      tipoNotificacion = 'pedido_recibido_confirmacion';
      break;
      
    case ESTADOS.CANCELADO:
      tipoNotificacion = 'pedido_cancelado';
      metadata = { motivo: pedido.motivo_cancelacion };
      break;
      
    default:
      return null;
  }
  
  if (!tipoNotificacion) return null;
  
  // Generar mensaje usando la función existente
  const resultado = generarMensajeWhatsApp(pedido, tipoNotificacion, config, metadata);
  
  return resultado ? { ...resultado, metadata } : null;
}

/**
 * Mapear estado a tipo de notificación
 */
function obtenerTipoNotificacion(estadoNuevo) {
  const mapa = {
    [ESTADOS.CONFIRMADO]: 'pedido_confirmado',
    [ESTADOS.PREPARANDO]: 'pedido_preparando',
    [ESTADOS.ENVIADO]: 'pedido_enviado',
    [ESTADOS.RECIBIDO]: 'pedido_recibido_confirmacion',
    [ESTADOS.CANCELADO]: 'pedido_cancelado'
  };
  
  return mapa[estadoNuevo] || 'cambio_estado';
}