// src/routes/api/cron/+server.js
import { json } from '@sveltejs/kit';
import { 
  autoFinalizarPedidos, 
  limpiarHistorialAntiguo,
  recordatoriosPagoPendiente
} from '$lib/server/cron/pedidos';

const CRON_SECRET = process.env.CRON_SECRET || 'dev-secret-change-in-production';

export async function POST({ request }) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    const { task } = await request.json();
    
    let result;
    
    switch (task) {
      case 'auto-finalizar':
        result = await autoFinalizarPedidos();
        break;
        
      case 'limpiar-historial':
        result = await limpiarHistorialAntiguo();
        break;
        
      case 'recordatorios-pago':
        result = await recordatoriosPagoPendiente();
        break;
        
      case 'all':
        const results = await Promise.all([
          autoFinalizarPedidos(),
          limpiarHistorialAntiguo(),
          recordatoriosPagoPendiente()
        ]);
        
        result = {
          success: true,
          tasks: {
            autoFinalizar: results[0],
            limpiarHistorial: results[1],
            recordatoriosPago: results[2]
          }
        };
        break;
        
      default:
        return json(
          { 
            success: false, 
            error: 'Tarea no reconocida',
            availableTasks: ['auto-finalizar', 'limpiar-historial', 'recordatorios-pago', 'all']
          },
          { status: 400 }
        );
    }
    
    return json(result);
    
  } catch (error) {
    console.error('Error en cron:', error);
    return json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function GET({ url }) {
  const secret = url.searchParams.get('secret');
  
  if (secret !== CRON_SECRET) {
    return json(
      { success: false, error: 'No autorizado' },
      { status: 401 }
    );
  }
  
  return json({
    success: true,
    message: 'Endpoint de cron activo',
    availableTasks: [
      'auto-finalizar',
      'limpiar-historial',
      'recordatorios-pago',
      'all'
    ],
    usage: {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer YOUR_CRON_SECRET',
        'Content-Type': 'application/json'
      },
      body: {
        task: 'auto-finalizar | limpiar-historial | recordatorios-pago | all'
      }
    }
  });
}