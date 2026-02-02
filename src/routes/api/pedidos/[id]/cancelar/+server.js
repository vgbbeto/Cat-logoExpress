// ========================================
// src/routes/api/pedidos/[id]/cancelar/+server.js
// ========================================
export async function POST({ params, request }) {
  try {
    const { id } = params;
    const { motivo } = await request.json();
    
    if (!motivo || motivo.trim().length < 10) {
      return json(
        { success: false, error: 'Debe proporcionar un motivo de cancelación (mínimo 10 caracteres)' },
        { status: 400 }
      );
    }
    
    const { data: pedido } = await supabaseAdmin
      .from('pedidos')
      .select('*')
      .eq('id', id)
      .single();
    
    if (!pedido) {
      return json(
        { success: false, error: 'Pedido no encontrado' },
        { status: 404 }
      );
    }
    
    // No se puede cancelar si ya está enviado o recibido
    if ([ESTADOS.ENVIADO, ESTADOS.RECIBIDO, ESTADOS.ENTREGADO].includes(pedido.estado)) {
      return json(
        { success: false, error: 'No se puede cancelar un pedido ya enviado' },
        { status: 400 }
      );
    }
    
    const { data, error } = await supabaseAdmin
      .from('pedidos')
      .update({
        estado: ESTADOS.CANCELADO,
        motivo_cancelacion: motivo,
        editable: false
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    await supabaseAdmin
      .from('pedidos_historial')
      .insert({
        pedido_id: id,
        estado_anterior: pedido.estado,
        estado_nuevo: ESTADOS.CANCELADO,
        tipo_usuario: 'vendedor',
        notas: `Pedido cancelado: ${motivo}`
      });
    
    // ✅ GENERAR URL DE WHATSAPP
    let urlWhatsApp = null;

    try {
      const { data: config } = await supabaseAdmin
        .from('configuracion')
        .select('*')
        .single();
      
      const { generarMensajeWhatsApp } = await import('$lib/server/notificaciones/mensajes');
      const resultado = generarMensajeWhatsApp(
        data,
        'pedido_cancelado',
        config,
        { motivo }
      );
      
      if (resultado?.url) {
        urlWhatsApp = resultado.url;
      }
    } catch (err) {
      console.error('Error generando WhatsApp:', err);
    }

    return json({
      success: true,
      data,
      message: 'Pedido cancelado',
      whatsapp: {
        url: urlWhatsApp,
        auto_abrir: true
      }
    });
    
  } catch (error) {
    return json({ success: false, error: error.message }, { status: 500 });
  }
}