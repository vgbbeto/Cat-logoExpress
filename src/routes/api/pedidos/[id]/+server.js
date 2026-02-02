// src/routes/api/pedidos/[id]/+server.js
import { json } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/supabaseServer';

/**
 * GET - Obtener un pedido específico por ID
 */
export async function GET({ params }) {
  try {
    const { id } = params;
    
    if (!id) {
      return json(
        { success: false, error: 'ID de pedido requerido' },
        { status: 400 }
      );
    }
    
    // Obtener pedido con items
    const { data: pedido, error: errorPedido } = await supabaseAdmin
      .from('pedidos')
      .select(`
        *,
        items:pedidos_items(*)
      `)
      .eq('id', id)
      .single();
    
    if (errorPedido || !pedido) {
      console.error('Error obteniendo pedido:', errorPedido);
      return json(
        { success: false, error: 'Pedido no encontrado' },
        { status: 404 }
      );
    }
    
    return json({
      success: true,
      data: pedido
    });
    
  } catch (error) {
    console.error('Error en GET /api/pedidos/[id]:', error);
    return json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}