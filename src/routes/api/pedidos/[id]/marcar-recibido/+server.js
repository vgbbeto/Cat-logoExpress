
// ========================================
// src/routes/api/pedidos/[id]/marcar-recibido/+server.js
// ACTUALIZADO: Incluye calificación y comentario
// ========================================
export async function POST({ params, request }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { calificacion = 0, comentario = null } = body;
    
    const { data: pedido } = await supabaseAdmin
      .from('pedidos')
      .select('*')
      .eq('id', id)
      .single();
    
    if (!pedido || pedido.estado !== ESTADOS.ENVIADO) {
      return json(
        { success: false, error: 'El pedido debe estar enviado' },
        { status: 400 }
      );
    }
    
    const { data, error } = await supabaseAdmin
      .from('pedidos')
      .update({
        estado: ESTADOS.RECIBIDO,
        fecha_recibido: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    // Registrar en historial con calificación
    await supabaseAdmin
      .from('pedidos_historial')
      .insert({
        pedido_id: id,
        estado_anterior: ESTADOS.ENVIADO,
        estado_nuevo: ESTADOS.RECIBIDO,
        tipo_usuario: 'cliente',
        notas: comentario || 'Cliente confirmó recepción del pedido',
        metadata: {
          calificacion,
          comentario
        }
      });
    
    return json({
      success: true,
      data,
      message: '✅ ¡Pedido recibido! Gracias por tu compra.'
    });
    
  } catch (error) {
    return json({ success: false, error: error.message }, { status: 500 });
  }
}