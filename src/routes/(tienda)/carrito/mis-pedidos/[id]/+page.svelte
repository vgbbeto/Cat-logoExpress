<!-- src/routes/(tienda)/carrito/mis-pedidos/[id]/+page.svelte -->
<script>
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { 
    ArrowLeft, Package, User, Phone, MapPin, Calendar,
    Upload, CheckCircle, AlertCircle, Truck, MessageCircle, Clock
  } from 'lucide-svelte';
  import { CONFIG_ESTADOS, obtenerColorEstado } from '$lib/pedidos/estadosCliente';
  import TimelinePedido from '$lib/components/cliente/TimelinePedido.svelte';
  import SubirComprobante from '$lib/components/cliente/SubirComprobante.svelte';
  import ConfirmarRecepcion from '$lib/components/cliente/ConfirmarRecepcion.svelte';
  import FormularioDireccion from '$lib/components/cliente/FormularioDireccion.svelte';
  
  export let data;
  
  let pedido = data.pedido;
  let loading = false;
  let error = '';
  let success = '';
  let mostrarFormularioDireccion = false;
  let direccionGuardada = false;
  
  $: colores = obtenerColorEstado(pedido?.estado);
  $: config = CONFIG_ESTADOS[pedido?.estado];
  $: whatsappParam = $page.url.searchParams.get('whatsapp');
  
  async function recargarPedido() {
    loading = true;
    error = '';
    
    try {
      const res = await fetch(`/api/pedidos/${pedido.id}`);
      
      // Verificar que la respuesta sea JSON
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('❌ Respuesta no es JSON. Content-Type:', contentType);
        throw new Error('Error del servidor: el endpoint no existe o devolvió HTML');
      }
      
      if (!res.ok) {
        throw new Error(`Error HTTP: ${res.status}`);
      }
      
      const result = await res.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Error al cargar el pedido');
      }
      
      pedido = result.data;
      console.log('✅ Pedido recargado correctamente');
      
    } catch (err) {
      console.error('❌ Error recargando pedido:', err);
      error = 'No pudimos actualizar la información del pedido. Por favor recarga la página.';
      
      // Mostrar error temporal
      setTimeout(() => error = '', 5000);
    } finally {
      loading = false;
    }
  }
  
  function formatCurrency(amount) {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  }
  
  function formatDate(date) {
    return new Date(date).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  function contactarWhatsApp() {
    const tel = data.configuracion?.whatsapp_numero || '';
    const mensaje = `Hola, tengo una consulta sobre mi pedido #${pedido.numero_pedido}`;
    window.open(`https://wa.me/${tel}?text=${encodeURIComponent(mensaje)}`, '_blank');
  }
  
  function handleDireccionGuardada(event) {
    direccionGuardada = true;
    mostrarFormularioDireccion = false;
    success = 'Dirección guardada correctamente';
    recargarPedido();
    setTimeout(() => success = '', 3000);
  }
  
  function volver() {
    goto('/carrito/mis-pedidos' + (whatsappParam ? `?whatsapp=${whatsappParam}` : ''));
  }
</script>

<svelte:head>
  <title>Pedido #{pedido?.numero_pedido} | {data.configuracion?.nombre_empresa || 'CatálogoExpress'}</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
  <div class="max-w-4xl mx-auto px-4 py-8">
    
    <!-- Header con botón volver -->
    <button
      on:click={volver}
      class="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
    >
      <ArrowLeft class="w-5 h-5" />
      <span class="font-medium">Volver a mis pedidos</span>
    </button>
    
    {#if pedido}
      <!-- Estado Principal -->
      <div class="bg-white rounded-2xl shadow-lg p-6 mb-6">
        <div class="flex items-start justify-between mb-6">
          <div>
            <div class="flex items-center gap-2 mb-2">
              <span class="text-xs font-semibold text-gray-500">PEDIDO</span>
              <span class="text-2xl font-bold text-gray-900">#{pedido.numero_pedido}</span>
            </div>
            <p class="text-sm text-gray-600">{formatDate(pedido.created_at)}</p>
          </div>
          
          <span class="px-4 py-2 text-sm font-semibold rounded-full {colores.bg} {colores.text} border {colores.border} flex items-center gap-2">
            <span class="text-xl">{config.icon}</span>
            {config.label}
          </span>
        </div>
        
        <div class="bg-gradient-to-r from-primary-50 to-blue-50 rounded-xl p-4">
          <p class="text-sm font-medium text-gray-700 mb-1">Estado actual:</p>
          <p class="text-lg font-semibold text-primary-900">{config.descripcion}</p>
        </div>
      </div>
      
      <!-- Timeline del Pedido -->
      <div class="bg-white rounded-2xl shadow-lg p-6 mb-6">
        <h3 class="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Calendar class="w-5 h-5 text-primary-600" />
          Progreso del Pedido
        </h3>
        
        <TimelinePedido {pedido} />
      </div>
      
      <!-- ========================================
           SECCIÓN: ESTADO CONFIRMADO
           ======================================== -->
      {#if pedido.estado === 'confirmado'}
        
        <!-- Mensaje introductorio -->
        <div class="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-2xl p-6 mb-6">
          <div class="flex items-start gap-4">
            <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 text-3xl">
              📋
            </div>
            <div class="flex-1">
              <h3 class="text-2xl font-bold text-gray-900 mb-2">
                ¡Tu pedido está confirmado!
              </h3>
              <p class="text-base text-gray-700 mb-4">
                Para continuar con el proceso, necesitamos que completes estos 2 pasos:
              </p>
              <div class="bg-white rounded-xl p-4 space-y-2">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                    1
                  </div>
                  <p class="text-sm font-semibold text-gray-900">
                    Sube tu comprobante de pago
                  </p>
                </div>
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                    2
                  </div>
                  <p class="text-sm font-semibold text-gray-900">
                    Confirma tu dirección de envío
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- PASO 1: Subir Comprobante -->
        <div class="mb-6">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xl shadow-lg">
              1
            </div>
            <h3 class="text-2xl font-bold text-gray-900">
              Comprobante de Pago
            </h3>
          </div>
          
          {#if pedido.estado_pago === 'rechazado'}
            <!-- Comprobante rechazado -->
            <div class="bg-red-50 border-2 border-red-300 rounded-2xl p-6 mb-4">
              <div class="flex items-start gap-4">
                <div class="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <AlertCircle class="w-6 h-6 text-red-600" />
                </div>
                <div class="flex-1">
                  <h4 class="text-lg font-bold text-red-900 mb-2">⚠️ Comprobante Rechazado</h4>
                  <p class="text-sm text-red-800 mb-3 font-medium">{pedido.motivo_rechazo_pago}</p>
                  <p class="text-sm text-red-700">Por favor, sube un nuevo comprobante que cumpla con los requisitos.</p>
                </div>
              </div>
            </div>
            
            <SubirComprobante 
              {pedido} 
              esReenvio={true}
              on:success={() => {
                success = 'Nuevo comprobante subido correctamente';
                recargarPedido();
              }}
            />
            
          {:else if !pedido.constancia_pago_url}
            <!-- Sin comprobante -->
            <SubirComprobante 
              {pedido} 
              on:success={() => {
                success = 'Comprobante subido correctamente';
                recargarPedido();
              }}
            />
            
          {:else if pedido.estado_pago === 'pendiente_validacion'}
            <!-- Comprobante en validación -->
            <div class="bg-amber-50 border-2 border-amber-300 rounded-2xl p-6">
              <div class="flex items-start gap-4">
                <div class="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Clock class="w-6 h-6 text-amber-600" />
                </div>
                <div class="flex-1">
                  <h4 class="text-lg font-bold text-amber-900 mb-2">⏳ Comprobante en Validación</h4>
                  <p class="text-sm text-amber-800 mb-3">
                    Tu comprobante está siendo revisado por nuestro equipo. Te notificaremos pronto.
                  </p>
                  {#if pedido.constancia_pago_url}
                    <a 
                      href={pedido.constancia_pago_url} 
                      target="_blank"
                      class="inline-flex items-center gap-2 text-sm text-amber-700 hover:text-amber-900 font-medium"
                    >
                      <Upload class="w-4 h-4" />
                      Ver comprobante subido
                    </a>
                  {/if}
                </div>
              </div>
            </div>
          {/if}
        </div>

        <!-- PASO 2: Dirección de Envío -->
        <div class="mb-6">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-xl shadow-lg">
              2
            </div>
            <h3 class="text-2xl font-bold text-gray-900">
              Dirección de Envío
            </h3>
          </div>
          
          <FormularioDireccion 
            {pedido}
            direccionInicial={pedido.cliente_direccion}
            on:guardado={handleDireccionGuardada}
          />
        </div>

        <!-- Mensaje de confirmación cuando ambos estén completos -->
        {#if pedido.constancia_pago_url && pedido.cliente_direccion?.calle && pedido.estado_pago === 'pendiente_validacion'}
          <div class="bg-green-50 border-2 border-green-300 rounded-2xl p-6 mb-6">
            <div class="flex items-start gap-4">
              <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 text-3xl">
                ✅
              </div>
              <div class="flex-1">
                <h3 class="text-2xl font-bold text-green-900 mb-2">
                  ¡Todo Listo!
                </h3>
                <p class="text-base text-green-800 mb-3">
                  Recibimos tu comprobante y dirección de envío. Nuestro equipo está validando tu pago.
                </p>
                <div class="bg-white rounded-xl p-4 space-y-2 text-sm">
                  <div class="flex items-center gap-2">
                    <CheckCircle class="w-5 h-5 text-green-600" />
                    <span class="font-medium text-gray-900">Comprobante recibido</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <CheckCircle class="w-5 h-5 text-green-600" />
                    <span class="font-medium text-gray-900">Dirección confirmada: {pedido.cliente_direccion.ciudad}, {pedido.cliente_direccion.estado}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <Clock class="w-5 h-5 text-amber-600" />
                    <span class="font-medium text-gray-700">Validando pago (aprox. 1-2 horas)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        {/if}

      {:else if pedido.estado === 'preparando'}
        
        <!-- ✅ VISTA DE PREPARANDO -->
        <div class="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl shadow-lg p-6 mb-6 border-2 border-indigo-200">
          <div class="flex items-start gap-4">
            <div class="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Package class="w-6 h-6 text-indigo-600" />
            </div>
            <div class="flex-1">
              <h3 class="text-lg font-bold text-gray-900 mb-2">
                📦 Tu pedido está siendo preparado
              </h3>
              <p class="text-sm text-gray-700 mb-4">
                Estamos empaquetando tus productos con mucho cuidado. Pronto estará listo para el envío.
              </p>
              
              {#if pedido.cliente_direccion}
                <div class="bg-white rounded-xl p-4 border border-indigo-200">
                  <p class="font-semibold text-indigo-900 mb-2 flex items-center gap-2">
                    <MapPin class="w-4 h-4" />
                    Se enviará a:
                  </p>
                  <div class="text-sm text-gray-700 space-y-1">
                    <p><strong>{pedido.cliente_direccion.nombre_destinatario}</strong></p>
                    <p>
                      {pedido.cliente_direccion.calle} {pedido.cliente_direccion.numero_exterior}
                      {pedido.cliente_direccion.numero_interior ? `, Int. ${pedido.cliente_direccion.numero_interior}` : ''}
                    </p>
                    <p>{pedido.cliente_direccion.colonia}</p>
                    <p>
                      {pedido.cliente_direccion.codigo_postal} - {pedido.cliente_direccion.ciudad}, {pedido.cliente_direccion.estado}
                    </p>
                    <p class="text-indigo-600 font-medium pt-2">
                      📞 {pedido.cliente_direccion.telefono}
                    </p>
                  </div>
                </div>
              {/if}
            </div>
          </div>
        </div>

      {:else if pedido.estado === 'enviado'}
        
        <!-- ✅ VISTA DE ENVIADO CON GUÍA -->
        <div class="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl shadow-lg p-6 mb-6 border-2 border-purple-200">
          <div class="flex items-start gap-4 mb-4">
            <div class="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Truck class="w-6 h-6 text-purple-600" />
            </div>
            <div class="flex-1">
              <h3 class="text-lg font-bold text-gray-900 mb-2">
                🚚 Tu pedido está en camino
              </h3>
              <p class="text-sm text-gray-700">
                El paquete ya salió y está siendo transportado a tu dirección
              </p>
            </div>
          </div>
          
          {#if pedido.guia_envio}
            <div class="bg-white rounded-xl p-5 border border-purple-200 space-y-3">
              <div class="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p class="text-gray-600 mb-1">🚛 Paquetería:</p>
                  <p class="font-semibold text-gray-900">{pedido.guia_envio.paqueteria}</p>
                </div>
                
                {#if pedido.guia_envio.numero_guia && pedido.guia_envio.numero_guia !== 'LOCAL'}
                  <div>
                    <p class="text-gray-600 mb-1">🔢 Número de guía:</p>
                    <div class="flex items-center gap-2">
                      <p class="font-mono font-semibold text-gray-900">{pedido.guia_envio.numero_guia}</p>
                      <button
                        on:click={() => navigator.clipboard.writeText(pedido.guia_envio.numero_guia)}
                        class="text-purple-600 hover:text-purple-800"
                        title="Copiar número de guía"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                {/if}
              </div>
              
              {#if pedido.cliente_direccion}
                <div class="pt-3 border-t border-gray-200">
                  <p class="text-gray-600 mb-1 text-sm">📍 Destino:</p>
                  <p class="font-semibold text-gray-900">
                    {pedido.cliente_direccion.ciudad}, {pedido.cliente_direccion.estado}
                  </p>
                </div>
              {/if}
              
              {#if pedido.fecha_enviado}
                <div class="pt-3 border-t border-gray-200">
                  <p class="text-gray-600 mb-1 text-sm">⏰ Enviado:</p>
                  <p class="font-semibold text-gray-900">
                    {formatDate(pedido.fecha_enviado)}
                  </p>
                </div>
              {/if}
              
              {#if pedido.guia_envio.url_rastreo}
                <a
                  href={pedido.guia_envio.url_rastreo}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="block w-full text-center py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all shadow-lg flex items-center justify-center gap-2 font-semibold"
                >
                  🔍 Rastrear mi Pedido
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                  </svg>
                </a>
              {/if}
            </div>
          {/if}
        </div>
        
        <ConfirmarRecepcion 
          {pedido}
          on:success={() => {
            success = '¡Gracias por confirmar la recepción!';
            recargarPedido();
          }}
        />
      {/if}
      
      <!-- Info del Cliente -->
      <div class="bg-white rounded-2xl shadow-lg p-6 mb-6">
        <h3 class="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <User class="w-5 h-5 text-primary-600" />
          Información de Contacto
        </h3>
        
        <div class="space-y-3">
          <div class="flex items-center gap-3">
            <User class="w-5 h-5 text-gray-400" />
            <div>
              <p class="text-xs text-gray-500">Nombre</p>
              <p class="font-medium text-gray-900">{pedido.cliente_nombre}</p>
            </div>
          </div>
          
          <div class="flex items-center gap-3">
            <Phone class="w-5 h-5 text-gray-400" />
            <div>
              <p class="text-xs text-gray-500">WhatsApp</p>
              <p class="font-medium text-gray-900">{pedido.cliente_whatsapp}</p>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Productos -->
      <div class="bg-white rounded-2xl shadow-lg p-6 mb-6">
        <h3 class="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Package class="w-5 h-5 text-primary-600" />
          Productos ({pedido.items?.length || 0})
        </h3>
        
        <div class="space-y-4">
          {#each pedido.items || [] as item}
            <div class="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
              {#if item.imagen_url}
                <img 
                  src={item.imagen_url} 
                  alt={item.producto_nombre}
                  class="w-20 h-20 object-cover rounded-lg"
                />
              {:else}
                <div class="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                  <Package class="w-8 h-8 text-gray-400" />
                </div>
              {/if}
              
              <div class="flex-1">
                <p class="font-semibold text-gray-900">{item.producto_nombre}</p>
                <p class="text-sm text-gray-600">
                  {formatCurrency(item.precio_unitario)} × {item.cantidad}
                </p>
              </div>
              
              <div class="text-right">
                <p class="font-bold text-gray-900">{formatCurrency(item.subtotal)}</p>
              </div>
            </div>
          {/each}
        </div>
      </div>
      
      <!-- Resumen de Pago -->
      <div class="bg-white rounded-2xl shadow-lg p-6 mb-6">
        <h3 class="text-lg font-bold text-gray-900 mb-4">Resumen del Pedido</h3>
        
        <div class="space-y-3">
          <div class="flex justify-between text-gray-700">
            <span>Subtotal:</span>
            <span class="font-medium">{formatCurrency(pedido.subtotal)}</span>
          </div>
          
          {#if pedido.impuesto > 0}
            <div class="flex justify-between text-gray-700">
              <span>IVA:</span>
              <span class="font-medium">{formatCurrency(pedido.impuesto)}</span>
            </div>
          {/if}
          
          {#if pedido.costo_envio > 0}
            <div class="flex justify-between text-gray-700">
              <span>Envío:</span>
              <span class="font-medium">{formatCurrency(pedido.costo_envio)}</span>
            </div>
          {/if}
          
          <div class="border-t-2 border-gray-200 pt-3 flex justify-between">
            <span class="text-xl font-bold text-gray-900">Total:</span>
            <span class="text-2xl font-bold text-primary-700">{formatCurrency(pedido.total)}</span>
          </div>
        </div>
      </div>
      
      <!-- Botón de Ayuda -->
      <button
        on:click={contactarWhatsApp}
        class="w-full bg-green-600 text-white rounded-2xl py-4 hover:bg-green-700 transition-all shadow-lg flex items-center justify-center gap-3 font-semibold text-lg"
      >
        <MessageCircle class="w-6 h-6" />
        ¿Necesitas ayuda? Contáctanos por WhatsApp
      </button>
      
    {:else}
      <!-- Error loading -->
      <div class="bg-white rounded-2xl shadow-lg p-12 text-center">
        <AlertCircle class="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h3 class="text-xl font-semibold text-gray-900 mb-2">Pedido no encontrado</h3>
        <p class="text-gray-600 mb-6">No pudimos cargar la información de este pedido</p>
        <button on:click={volver} class="btn-primary">
          Volver a mis pedidos
        </button>
      </div>
    {/if}
    
    <!-- Mensajes -->
    {#if success}
      <div class="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-4 rounded-xl shadow-lg animate-slide-in z-50">
        <div class="flex items-center gap-3">
          <CheckCircle class="w-5 h-5" />
          <span class="font-medium">{success}</span>
        </div>
      </div>
    {/if}
    
    {#if error}
      <div class="fixed bottom-4 right-4 bg-red-500 text-white px-6 py-4 rounded-xl shadow-lg animate-slide-in z-50">
        <div class="flex items-center gap-3">
          <AlertCircle class="w-5 h-5" />
          <span class="font-medium">{error}</span>
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  @keyframes slide-in {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  .animate-slide-in {
    animation: slide-in 0.3s ease-out;
  }
</style>