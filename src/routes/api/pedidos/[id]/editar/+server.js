// src/routes/api/pedidos/[id]/editar/+server.js
import { json } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/supabaseServer';
import { esEditable, ESTADOS_PAGO } from '$lib/server/pedidos/estados';
import {
  ValidationError,
  validarDatosCliente,
  validarItems,
  validarTotales,
  validarEdicion,
  sanitizarTexto,
  sanitizarWhatsApp
} from '$lib/server/pedidos/validaciones';

export async function GET({ params }) {
  try {
    const { id } = params;
    
    const { data, error } = await supabaseAdmin
      .from('pedidos')
      .select(`
        *,
        items:pedidos_items(*)
      `)
      .eq('id', id)
      .single();
    
    if (error || !data) {
      throw new ValidationError('Pedido no encontrado', 'NOT_FOUND');
    }
    
    const editable = esEditable(data);
    
    return json({
      success: true,
      data: {
        ...data,
        editable
      }
    });
    
  } catch (error) {
    console.error('Error GET editar:', error);
    
    if (error instanceof ValidationError) {
      return json(
        { success: false, error: error.message, code: error.code },
        { status: error.code === 'NOT_FOUND' ? 404 : 400 }
      );
    }
    
    return json(
      { success: false, error: 'Error al obtener pedido', code: 'GET_ERROR' },
      { status: 500 }
    );
  }
}

export async function PUT({ params, request }) {
  try {
    const { id } = params;
    const body = await request.json();
    
    const { data: pedidoActual, error: errorPedido } = await supabaseAdmin
      .from('pedidos')
      .select('*')
      .eq('id', id)
      .single();
    
    if (errorPedido || !pedidoActual) {
      throw new ValidationError('Pedido no encontrado', 'NOT_FOUND');
    }
    
    validarEdicion(pedidoActual);
    
    const updateData = {};
    
    if (body.cliente_nombre) {
      updateData.cliente_nombre = body.cliente_nombre.trim();
    }
    
    if (body.cliente_whatsapp) {
      updateData.cliente_whatsapp = sanitizarWhatsApp(body.cliente_whatsapp);
    }
    
    if (body.cliente_email !== undefined) {
      updateData.cliente_email = body.cliente_email?.trim() || null;
    }
    
    if (body.cliente_direccion !== undefined) {
      updateData.cliente_direccion = body.cliente_direccion?.trim() || null;
    }
    
    if (body.costo_envio !== undefined) {
      updateData.costo_envio = parseFloat(body.costo_envio || 0);
    }
    
    if (body.notas !== undefined) {
      updateData.notas = sanitizarTexto(body.notas);
    }
    
    if (body.metodo_pago !== undefined) {
      updateData.metodo_pago = body.metodo_pago;
    }
    
    if (body.factura !== undefined) {
      updateData.factura = Boolean(body.factura);
    }
    
    if (body.envio !== undefined) {
      updateData.envio = Boolean(body.envio);
    }
    
    if (body.items && Array.isArray(body.items) && body.items.length > 0) {
      validarItems(body.items);
      
      await supabaseAdmin
        .from('pedidos_items')
        .delete()
        .eq('pedido_id', id);
      
      const itemsData = body.items.map(item => ({
        pedido_id: id,
        producto_id: item.producto_id,
        producto_nombre: item.nombre || item.producto_nombre,
        producto_sku: item.sku || item.producto_sku || null,
        cantidad: parseInt(item.cantidad),
        precio_unitario: parseFloat(item.precio_unitario),
        subtotal: parseFloat(item.precio_unitario) * parseInt(item.cantidad),
        imagen_url: item.imagen_url || null
      }));
      
      const { error: errorItems } = await supabaseAdmin
        .from('pedidos_items')
        .insert(itemsData);
      
      if (errorItems) {
        throw new Error('Error al actualizar items del pedido');
      }
      
      const nuevoSubtotal = itemsData.reduce((sum, item) => sum + item.subtotal, 0);
      updateData.subtotal = nuevoSubtotal;
      
      if (body.factura !== undefined ? body.factura : pedidoActual.factura) {
        updateData.impuesto = nuevoSubtotal * 0.16;
      } else {
        updateData.impuesto = 0;
      }
      
      const nuevoTotal = nuevoSubtotal + 
                        (updateData.impuesto || 0) + 
                        (updateData.costo_envio !== undefined ? updateData.costo_envio : pedidoActual.costo_envio || 0);
      
      updateData.total = nuevoTotal;
    } else if (body.costo_envio !== undefined || body.factura !== undefined) {
      const subtotal = pedidoActual.subtotal;
      const impuesto = (body.factura !== undefined ? body.factura : pedidoActual.factura) 
        ? subtotal * 0.16 
        : 0;
      const costoEnvio = body.costo_envio !== undefined 
        ? parseFloat(body.costo_envio) 
        : pedidoActual.costo_envio || 0;
      
      updateData.impuesto = impuesto;
      updateData.total = subtotal + impuesto + costoEnvio;
    }
    
    if (Object.keys(updateData).length > 0) {
      validarTotales({
        subtotal: updateData.subtotal || pedidoActual.subtotal,
        impuesto: updateData.impuesto !== undefined ? updateData.impuesto : pedidoActual.impuesto,
        costo_envio: updateData.costo_envio !== undefined ? updateData.costo_envio : pedidoActual.costo_envio,
        total: updateData.total || pedidoActual.total
      });
    }
    
    const { data: pedidoActualizado, error: errorUpdate } = await supabaseAdmin
      .from('pedidos')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        items:pedidos_items(*)
      `)
      .single();
    
    if (errorUpdate) {
      throw new Error('Error al actualizar el pedido');
    }
    
    const cambios = [];
    if (body.items) cambios.push('productos');
    if (body.cliente_nombre) cambios.push('cliente');
    if (body.costo_envio !== undefined) cambios.push('costo de envío');
    if (body.notas !== undefined) cambios.push('notas');
    if (body.factura !== undefined) cambios.push('factura');
    
    await supabaseAdmin
      .from('pedidos_historial')
      .insert({
        pedido_id: id,
        estado_anterior: pedidoActual.estado,
        estado_nuevo: pedidoActual.estado,
        tipo_usuario: 'vendedor',
        notas: `Pedido editado: ${cambios.join(', ')}`,
        metadata: {
          campos_editados: cambios,
          total_anterior: pedidoActual.total,
          total_nuevo: pedidoActualizado.total
        }
      });
    
    return json({
      success: true,
      data: pedidoActualizado,
      message: 'Pedido actualizado correctamente'
    });
    
  } catch (error) {
    console.error('Error PUT editar:', error);
    
    if (error instanceof ValidationError) {
      return json(
        { success: false, error: error.message, code: error.code },
        { status: error.code === 'NOT_FOUND' ? 404 : 403 }
      );
    }
    
    return json(
      { success: false, error: error.message || 'Error al editar el pedido', code: 'EDIT_ERROR' },
      { status: 500 }
    );
  }
}