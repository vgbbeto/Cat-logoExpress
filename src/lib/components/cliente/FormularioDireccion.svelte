<!-- src/lib/components/cliente/FormularioDireccion.svelte -->
<script>
  import { createEventDispatcher, onMount } from 'svelte';
  import { MapPin, Loader2, CheckCircle, AlertCircle, Phone, Mail, Edit } from 'lucide-svelte';
  
  export let pedido;
  export let direccionInicial = null;
  
  const dispatch = createEventDispatcher();
  
  let loading = false;
  let error = '';
  let success = '';
  let modoEdicion = true; // ✅ Siempre en edición inicialmente
  let direccionCargada = false;
  
  // Estados de México (catálogo completo)
  const ESTADOS_MX = [
    'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche',
    'Chiapas', 'Chihuahua', 'Coahuila', 'Colima', 'Durango', 'Guanajuato',
    'Guerrero', 'Hidalgo', 'Jalisco', 'México', 'Michoacán', 'Morelos',
    'Nayarit', 'Nuevo León', 'Oaxaca', 'Puebla', 'Querétaro', 'Quintana Roo',
    'San Luis Potosí', 'Sinaloa', 'Sonora', 'Tabasco', 'Tamaulipas',
    'Tlaxcala', 'Veracruz', 'Yucatán', 'Zacatecas', 'Ciudad de México'
  ];
  
  const TIPOS_DOMICILIO = [
    { value: 'casa', label: '🏠 Casa' },
    { value: 'departamento', label: '🏢 Departamento' },
    { value: 'oficina', label: '💼 Oficina' },
    { value: 'bodega', label: '📦 Bodega' }
  ];
  
  const HORARIOS = [
    { value: 'mañana', label: '🌅 Mañana (9am - 1pm)' },
    { value: 'tarde', label: '🌆 Tarde (1pm - 6pm)' },
    { value: 'horario_abierto', label: '⏰ Horario abierto (9am - 6pm)' }
  ];
  
  // Modelo de datos
  let direccion = {
    nombre_destinatario: '',
    telefono: pedido.cliente_whatsapp || '',
    correo: pedido.cliente_email || '',
    calle: '',
    numero_exterior: '',
    numero_interior: '',
    colonia: '',
    codigo_postal: '',
    ciudad: '',
    estado: '',
    pais: 'México',
    referencias: '',
    tipo_domicilio: 'casa',
    persona_recibe: '',
    horario_entrega: 'horario_abierto',
    ubicacion_maps: '',
    autoriza_tercero: false,
    notas_autorizacion: ''
  };
  
  onMount(async () => {
    // Autollenar si hay dirección previa
    if (direccionInicial && direccionInicial.calle) {
      direccion = { ...direccion, ...direccionInicial };
      direccionCargada = true;
      console.log('✅ Dirección autocompletada desde pedido');
    } else {
      // Buscar última dirección del cliente
      await buscarUltimaDireccion();
    }
  });
  
  async function buscarUltimaDireccion() {
    try {
      const res = await fetch(`/api/clientes/ultima-direccion?whatsapp=${encodeURIComponent(pedido.cliente_whatsapp)}`);
      const result = await res.json();
      
      if (result.success && result.data) {
        direccion = { ...direccion, ...result.data };
        direccionCargada = true;
        success = '✅ Encontramos tu última dirección. Por favor revisa que los datos sean correctos.';
        setTimeout(() => success = '', 5000);
      }
    } catch (err) {
      console.log('No se encontró dirección previa:', err);
    }
  }
  
  function validarTelefono(tel) {
    const limpio = tel.replace(/\D/g, '');
    return limpio.length === 10;
  }
  
  function validarCP(cp) {
    return /^\d{5}$/.test(cp);
  }
  
  function validarFormulario() {
    const errores = [];
    
    if (!direccion.nombre_destinatario.trim()) errores.push('Nombre del destinatario');
    if (!validarTelefono(direccion.telefono)) errores.push('Teléfono (10 dígitos)');
    if (!direccion.calle.trim()) errores.push('Calle');
    if (!direccion.numero_exterior.trim()) errores.push('Número exterior');
    if (!direccion.colonia.trim()) errores.push('Colonia');
    if (!validarCP(direccion.codigo_postal)) errores.push('Código postal (5 dígitos)');
    if (!direccion.ciudad.trim()) errores.push('Ciudad');
    if (!direccion.estado) errores.push('Estado');
    if (!direccion.referencias.trim()) errores.push('Referencias');
    
    if (errores.length > 0) {
      error = `Campos obligatorios faltantes: ${errores.join(', ')}`;
      return false;
    }
    
    return true;
  }
  
  async function guardarDireccion() {
    error = '';
    success = '';
    
    if (!validarFormulario()) {
      return;
    }
    
    loading = true;
    
    try {
      const res = await fetch(`/api/pedidos/${pedido.id}/actualizar-direccion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cliente_direccion: direccion
        })
      });
      
      const result = await res.json();
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      success = '✅ Dirección guardada correctamente';
      dispatch('guardado', { direccion });
      
      setTimeout(() => {
        modoEdicion = false;
      }, 1500);
      
    } catch (err) {
      error = err.message || 'Error al guardar la dirección';
    } finally {
      loading = false;
    }
  }
  
  $: formularioCompleto = 
    direccion.nombre_destinatario.trim() &&
    validarTelefono(direccion.telefono) &&
    direccion.calle.trim() &&
    direccion.numero_exterior.trim() &&
    direccion.colonia.trim() &&
    validarCP(direccion.codigo_postal) &&
    direccion.ciudad.trim() &&
    direccion.estado &&
    direccion.referencias.trim();
</script>

<!-- ✅ ALERTA CRÍTICA: Dirección es importante -->
<div class="bg-gradient-to-br from-red-50 via-orange-50 to-amber-50 border-3 border-orange-400 rounded-2xl shadow-xl p-6 mb-6">
  <div class="flex items-start gap-4 mb-4">
    <div class="w-14 h-14 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0 animate-pulse">
      <AlertCircle class="w-8 h-8 text-white" />
    </div>
    <div class="flex-1">
      <h3 class="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
        ⚠️ ¡IMPORTANTE! Confirma tu Dirección
      </h3>
      <p class="text-base text-gray-800 font-medium mb-2">
        Esta información es CRÍTICA para que tu pedido llegue correctamente.
      </p>
      <p class="text-sm text-gray-700">
        Por favor, revisa TODOS los campos cuidadosamente antes de guardar.
      </p>
    </div>
  </div>
</div>

<div class="bg-white rounded-2xl shadow-lg p-6 mb-6 border-2 border-indigo-200">
  
  {#if success}
    <div class="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg mb-6">
      <div class="flex items-center gap-3">
        <CheckCircle class="w-5 h-5 text-green-600" />
        <p class="text-sm text-green-800 font-medium">{success}</p>
      </div>
    </div>
  {/if}
  
  {#if !modoEdicion && direccion.calle}
    <!-- ✅ VISTA RESUMIDA CON TODOS LOS DATOS -->
    <div class="mb-6">
      <div class="flex items-center justify-between mb-4">
        <h4 class="text-lg font-bold text-gray-900 flex items-center gap-2">
          <CheckCircle class="w-6 h-6 text-green-600" />
          Dirección Confirmada
        </h4>
        <button
          on:click={() => modoEdicion = true}
          class="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all font-medium"
        >
          <Edit class="w-4 h-4" />
          Modificar
        </button>
      </div>
      
      <div class="bg-gray-50 rounded-xl p-5 space-y-3 border-2 border-gray-200">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p class="text-xs text-gray-500 mb-1">👤 Destinatario</p>
            <p class="font-semibold text-gray-900">{direccion.nombre_destinatario}</p>
          </div>
          
          <div>
            <p class="text-xs text-gray-500 mb-1">📞 Teléfono</p>
            <p class="font-semibold text-gray-900">{direccion.telefono}</p>
          </div>
          
          {#if direccion.correo}
            <div class="md:col-span-2">
              <p class="text-xs text-gray-500 mb-1">📧 Correo</p>
              <p class="font-semibold text-gray-900">{direccion.correo}</p>
            </div>
          {/if}
        </div>
        
        <div class="border-t border-gray-300 pt-3">
          <p class="text-xs text-gray-500 mb-2">📍 Dirección Completa</p>
          <p class="font-semibold text-gray-900">
            {direccion.calle} {direccion.numero_exterior}{direccion.numero_interior ? ` Int. ${direccion.numero_interior}` : ''}
          </p>
          <p class="text-gray-700">
            Col. {direccion.colonia}
          </p>
          <p class="text-gray-700">
            CP {direccion.codigo_postal} - {direccion.ciudad}, {direccion.estado}
          </p>
          <p class="text-gray-700">{direccion.pais}</p>
        </div>
        
        <div class="border-t border-gray-300 pt-3">
          <p class="text-xs text-gray-500 mb-1">📝 Referencias</p>
          <p class="text-gray-700">{direccion.referencias}</p>
        </div>
        
        <div class="grid grid-cols-2 gap-4 border-t border-gray-300 pt-3">
          <div>
            <p class="text-xs text-gray-500 mb-1">🏠 Tipo</p>
            <p class="text-gray-700">
              {TIPOS_DOMICILIO.find(t => t.value === direccion.tipo_domicilio)?.label || direccion.tipo_domicilio}
            </p>
          </div>
          
          <div>
            <p class="text-xs text-gray-500 mb-1">⏰ Horario</p>
            <p class="text-gray-700">
              {HORARIOS.find(h => h.value === direccion.horario_entrega)?.label || direccion.horario_entrega}
            </p>
          </div>
        </div>
        
        {#if direccion.persona_recibe}
          <div class="border-t border-gray-300 pt-3">
            <p class="text-xs text-gray-500 mb-1">👥 Recibirá</p>
            <p class="text-gray-700">{direccion.persona_recibe}</p>
          </div>
        {/if}
        
        {#if direccion.ubicacion_maps}
          <div class="border-t border-gray-300 pt-3">
            <a 
              href={direccion.ubicacion_maps} 
              target="_blank"
              class="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-medium text-sm"
            >
              <MapPin class="w-4 h-4" />
              Ver en Google Maps
            </a>
          </div>
        {/if}
      </div>
    </div>
    
  {:else}
    <!-- ✅ FORMULARIO COMPLETO SIEMPRE VISIBLE -->
    <div class="space-y-6">
      
      {#if direccionCargada}
        <div class="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg mb-4">
          <div class="flex items-start gap-3">
            <CheckCircle class="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p class="text-sm text-blue-900 font-semibold mb-1">
                Dirección encontrada
              </p>
              <p class="text-xs text-blue-800">
                Hemos llenado el formulario con tu última dirección. 
                <strong>Por favor revisa que TODOS los datos sean correctos.</strong>
              </p>
            </div>
          </div>
        </div>
      {/if}
      
      <!-- Destinatario -->
      <div class="bg-gray-50 rounded-xl p-5 border-2 border-gray-200">
        <h4 class="font-bold text-gray-900 mb-4 text-lg flex items-center gap-2">
          <span class="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm">1</span>
          Datos del Destinatario
        </h4>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="label font-semibold">
              Nombre completo <span class="text-red-600 text-lg">*</span>
            </label>
            <input
              type="text"
              bind:value={direccion.nombre_destinatario}
              placeholder="Juan Pérez García"
              class="input text-lg py-3"
              required
            />
          </div>
          
          <div>
            <label class="label font-semibold">
              Teléfono <span class="text-red-600 text-lg">*</span>
            </label>
            <div class="relative">
              <Phone class="absolute left-3 top-4 w-5 h-5 text-gray-400" />
              <input
                type="tel"
                bind:value={direccion.telefono}
                placeholder="7121234567"
                maxlength="10"
                class="input pl-11 text-lg py-3 {direccion.telefono && !validarTelefono(direccion.telefono) ? 'border-red-500 border-2' : ''}"
                required
              />
            </div>
            {#if direccion.telefono && !validarTelefono(direccion.telefono)}
              <p class="text-sm text-red-600 mt-1 font-medium">⚠️ Debe tener 10 dígitos</p>
            {/if}
          </div>
          
          <div class="md:col-span-2">
            <label class="label font-semibold">Correo electrónico (opcional)</label>
            <div class="relative">
              <Mail class="absolute left-3 top-4 w-5 h-5 text-gray-400" />
              <input
                type="email"
                bind:value={direccion.correo}
                placeholder="correo@ejemplo.com"
                class="input pl-11 text-lg py-3"
              />
            </div>
          </div>
        </div>
      </div>
      
      <!-- Dirección -->
      <div class="bg-gray-50 rounded-xl p-5 border-2 border-gray-200">
        <h4 class="font-bold text-gray-900 mb-4 text-lg flex items-center gap-2">
          <span class="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm">2</span>
          Dirección Completa
        </h4>
        
        <div class="space-y-4">
          <div>
            <label class="label font-semibold">
              Calle <span class="text-red-600 text-lg">*</span>
            </label>
            <input
              type="text"
              bind:value={direccion.calle}
              placeholder="Av. Juárez"
              class="input text-lg py-3"
              required
            />
          </div>
          
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="label font-semibold">
                Número exterior <span class="text-red-600 text-lg">*</span>
              </label>
              <input
                type="text"
                bind:value={direccion.numero_exterior}
                placeholder="123 o S/N"
                class="input text-lg py-3"
                required
              />
            </div>
            
            <div>
              <label class="label font-semibold">Número interior (opcional)</label>
              <input
                type="text"
                bind:value={direccion.numero_interior}
                placeholder="Apto 4B"
                class="input text-lg py-3"
              />
            </div>
          </div>
          
          <div>
            <label class="label font-semibold">
              Colonia <span class="text-red-600 text-lg">*</span>
            </label>
            <input
              type="text"
              bind:value={direccion.colonia}
              placeholder="Centro"
              class="input text-lg py-3"
              required
            />
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="label font-semibold">
                Código Postal <span class="text-red-600 text-lg">*</span>
              </label>
              <input
                type="text"
                bind:value={direccion.codigo_postal}
                placeholder="44100"
                maxlength="5"
                class="input text-lg py-3 {direccion.codigo_postal && !validarCP(direccion.codigo_postal) ? 'border-red-500 border-2' : ''}"
                required
              />
              {#if direccion.codigo_postal && !validarCP(direccion.codigo_postal)}
                <p class="text-sm text-red-600 mt-1 font-medium">⚠️ 5 dígitos</p>
              {/if}
            </div>
            
            <div>
              <label class="label font-semibold">
                Ciudad <span class="text-red-600 text-lg">*</span>
              </label>
              <input
                type="text"
                bind:value={direccion.ciudad}
                placeholder="Guadalajara"
                class="input text-lg py-3"
                required
              />
            </div>
            
            <div>
              <label class="label font-semibold">
                Estado <span class="text-red-600 text-lg">*</span>
              </label>
              <select bind:value={direccion.estado} class="input text-lg py-3" required>
                <option value="">Selecciona...</option>
                {#each ESTADOS_MX as estado}
                  <option value={estado}>{estado}</option>
                {/each}
              </select>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Referencias y Detalles -->
      <div class="bg-gray-50 rounded-xl p-5 border-2 border-gray-200">
        <h4 class="font-bold text-gray-900 mb-4 text-lg flex items-center gap-2">
          <span class="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm">3</span>
          Referencias y Detalles de Entrega
        </h4>
        
        <div class="space-y-4">
          <div>
            <label class="label font-semibold">
              Referencias para encontrar tu domicilio <span class="text-red-600 text-lg">*</span>
            </label>
            <textarea
              bind:value={direccion.referencias}
              placeholder="Ej: Casa azul con portón negro, entre calles X y Y, frente al parque"
              rows="4"
              class="input resize-none text-base py-3"
              required
            ></textarea>
            <p class="text-sm text-gray-600 mt-2 font-medium">
              💡 Estas referencias son MUY IMPORTANTES para que el repartidor encuentre tu domicilio
            </p>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="label font-semibold">
                Tipo de domicilio <span class="text-red-600 text-lg">*</span>
              </label>
              <select bind:value={direccion.tipo_domicilio} class="input text-lg py-3" required>
                {#each TIPOS_DOMICILIO as tipo}
                  <option value={tipo.value}>{tipo.label}</option>
                {/each}
              </select>
            </div>
            
            <div>
              <label class="label font-semibold">Horario preferido de entrega</label>
              <select bind:value={direccion.horario_entrega} class="input text-lg py-3">
                {#each HORARIOS as horario}
                  <option value={horario.value}>{horario.label}</option>
                {/each}
              </select>
            </div>
          </div>
          
          <div>
            <label class="label font-semibold">¿Quién recibirá el pedido? (opcional)</label>
            <input
              type="text"
              bind:value={direccion.persona_recibe}
              placeholder="Nombre de quien recibirá"
              class="input text-lg py-3"
            />
          </div>
          
          <div>
            <label class="label font-semibold">Link de Google Maps (opcional)</label>
            <input
              type="url"
              bind:value={direccion.ubicacion_maps}
              placeholder="https://maps.google.com/..."
              class="input text-lg py-3"
            />
            <p class="text-xs text-gray-600 mt-1">
              💡 Opcional pero muy útil para ubicación exacta
            </p>
          </div>
          
          <label class="flex items-start gap-3 cursor-pointer p-3 bg-white rounded-lg border-2 border-gray-200 hover:border-indigo-300 transition-all">
            <input
              type="checkbox"
              bind:checked={direccion.autoriza_tercero}
              class="w-6 h-6 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 mt-1"
            />
            <div class="flex-1">
              <span class="text-base font-semibold text-gray-900">
                Autorizo que otra persona reciba mi pedido
              </span>
              <p class="text-sm text-gray-600 mt-1">
                Si no puedes estar presente, indica quién puede recibir el paquete
              </p>
            </div>
          </label>
          
          {#if direccion.autoriza_tercero}
            <div class="ml-8 animate-slide-down">
              <textarea
                bind:value={direccion.notas_autorizacion}
                placeholder="Nombre y relación de la persona autorizada (ej: María López - Hermana)"
                rows="2"
                class="input resize-none text-base py-3"
              ></textarea>
            </div>
          {/if}
        </div>
      </div>
      
      {#if error}
        <div class="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
          <div class="flex items-center gap-3">
            <AlertCircle class="w-6 h-6 text-red-600" />
            <p class="text-base text-red-800 font-medium">{error}</p>
          </div>
        </div>
      {/if}
      
      <!-- Checklist visual -->
      <div class="bg-amber-50 border-2 border-amber-300 rounded-xl p-5">
        <h5 class="font-bold text-amber-900 mb-3 flex items-center gap-2 text-lg">
          <CheckCircle class="w-6 h-6" />
          Verificación de datos
        </h5>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-base">
          <div class="flex items-center gap-2">
            <span class="{direccion.nombre_destinatario.trim() ? 'text-green-600 text-xl' : 'text-gray-400 text-xl'}">
              {direccion.nombre_destinatario.trim() ? '✓' : '○'}
            </span>
            <span class="font-medium">Nombre completo</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="{validarTelefono(direccion.telefono) ? 'text-green-600 text-xl' : 'text-gray-400 text-xl'}">
              {validarTelefono(direccion.telefono) ? '✓' : '○'}
            </span>
            <span class="font-medium">Teléfono válido</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="{direccion.calle.trim() && direccion.numero_exterior.trim() ? 'text-green-600 text-xl' : 'text-gray-400 text-xl'}">
              {direccion.calle.trim() && direccion.numero_exterior.trim() ? '✓' : '○'}
            </span>
            <span class="font-medium">Calle y número</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="{direccion.colonia.trim() ? 'text-green-600 text-xl' : 'text-gray-400 text-xl'}">
              {direccion.colonia.trim() ? '✓' : '○'}
            </span>
            <span class="font-medium">Colonia</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="{validarCP(direccion.codigo_postal) && direccion.ciudad.trim() && direccion.estado ? 'text-green-600 text-xl' : 'text-gray-400 text-xl'}">
              {validarCP(direccion.codigo_postal) && direccion.ciudad.trim() && direccion.estado ? '✓' : '○'}
            </span>
            <span class="font-medium">CP, ciudad y estado</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="{direccion.referencias.trim() ? 'text-green-600 text-xl' : 'text-gray-400 text-xl'}">
              {direccion.referencias.trim() ? '✓' : '○'}
            </span>
            <span class="font-medium">Referencias</span>
          </div>
        </div>
      </div>
      
      <!-- Botón de guardar -->
      <button
        on:click={guardarDireccion}
        disabled={!formularioCompleto || loading}
        class="w-full bg-indigo-600 text-white rounded-xl py-5 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-xl flex items-center justify-center gap-3 shadow-xl transition-all transform hover:scale-[1.02] disabled:transform-none"
      >
        {#if loading}
          <Loader2 class="w-7 h-7 animate-spin" />
          <span>Guardando dirección...</span>
        {:else}
          <CheckCircle class="w-7 h-7" />
          <span>Confirmar y Guardar Dirección</span>
        {/if}
      </button>
    </div>
  {/if}
</div>

<style>
  .label {
    @apply block text-sm text-gray-700 mb-2;
  }
  
  .input {
    @apply w-full px-4 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all;
  }
  
  @keyframes slide-down {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .animate-slide-down {
    animation: slide-down 0.3s ease-out;
  }
</style>