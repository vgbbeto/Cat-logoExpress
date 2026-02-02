<!-- src/lib/components/ui/BankAccountsManager.svelte -->
<script>
  import { createEventDispatcher } from 'svelte';
  import { Plus, X, Building2, User, CreditCard, Hash } from 'lucide-svelte';
  
  const dispatch = createEventDispatcher();
  
  export let cuentas = [];
  export let disabled = false;
  
  let editandoCuenta = null;
  let nuevaCuenta = crearCuentaVacia();
  
  function crearCuentaVacia() {
    return {
      banco: '',
      titular: '',
      numero_cuenta: '',
      clabe: ''
    };
  }
  
  function agregarCuenta() {
    if (!validarCuenta(nuevaCuenta)) {
      return;
    }
    
    cuentas = [...cuentas, { ...nuevaCuenta }];
    nuevaCuenta = crearCuentaVacia();
    dispatch('change', cuentas);
  }
  
  function eliminarCuenta(index) {
    if (confirm('¿Eliminar esta cuenta bancaria?')) {
      cuentas = cuentas.filter((_, i) => i !== index);
      dispatch('change', cuentas);
    }
  }
  
  function editarCuenta(index) {
    editandoCuenta = index;
  }
  
  function guardarEdicion(index) {
    if (!validarCuenta(cuentas[index])) {
      return;
    }
    editandoCuenta = null;
    dispatch('change', cuentas);
  }
  
  function cancelarEdicion() {
    editandoCuenta = null;
  }
  
  function validarCuenta(cuenta) {
    if (!cuenta.banco || cuenta.banco.trim() === '') {
      alert('El nombre del banco es obligatorio');
      return false;
    }
    if (!cuenta.titular || cuenta.titular.trim() === '') {
      alert('El titular de la cuenta es obligatorio');
      return false;
    }
    if (!cuenta.numero_cuenta || cuenta.numero_cuenta.trim() === '') {
      alert('El número de cuenta es obligatorio');
      return false;
    }
    return true;
  }
  
  const bancosSugeridos = [
    'BBVA',
    'Santander',
    'Citibanamex',
    'Banorte',
    'HSBC',
    'Scotiabank',
    'Inbursa',
    'Azteca',
    'Afirme',
    'Banregio'
  ];
</script>

<div class="space-y-4">
  <!-- Lista de cuentas existentes -->
  {#if cuentas.length > 0}
    <div class="space-y-3">
      {#each cuentas as cuenta, index}
        <div class="bg-gray-50 rounded-lg border-2 border-gray-200 hover:border-yellow-300 transition-colors">
          {#if editandoCuenta === index}
            <!-- Modo edición -->
            <div class="p-4 space-y-3">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <!-- Banco -->
                <div>
                  <label class="label flex items-center gap-2">
                    <Building2 class="w-4 h-4 text-yellow-600" />
                    Banco *
                  </label>
                  <input
                    type="text"
                    bind:value={cuenta.banco}
                    list="bancos-sugeridos"
                    placeholder="Ej: BBVA"
                    class="input"
                    disabled={disabled}
                    required
                  />
                </div>
                
                <!-- Titular -->
                <div>
                  <label class="label flex items-center gap-2">
                    <User class="w-4 h-4 text-yellow-600" />
                    Titular de la cuenta *
                  </label>
                  <input
                    type="text"
                    bind:value={cuenta.titular}
                    placeholder="Ej: Juan Pérez López"
                    class="input"
                    disabled={disabled}
                    required
                  />
                </div>
                
                <!-- Número de cuenta -->
                <div>
                  <label class="label flex items-center gap-2">
                    <CreditCard class="w-4 h-4 text-yellow-600" />
                    Número de cuenta *
                  </label>
                  <input
                    type="text"
                    bind:value={cuenta.numero_cuenta}
                    placeholder="Ej: 1234567890"
                    class="input font-mono"
                    disabled={disabled}
                    required
                  />
                </div>
                
                <!-- CLABE -->
                <div>
                  <label class="label flex items-center gap-2">
                    <Hash class="w-4 h-4 text-yellow-600" />
                    CLABE (opcional)
                  </label>
                  <input
                    type="text"
                    bind:value={cuenta.clabe}
                    placeholder="Ej: 012345678901234567"
                    maxlength="18"
                    class="input font-mono"
                    disabled={disabled}
                  />
                  <p class="text-xs text-gray-500 mt-1">18 dígitos</p>
                </div>
              </div>
              
              <!-- Botones de acción (edición) -->
              <div class="flex justify-end gap-2 pt-2 border-t border-gray-200">
                <button
                  type="button"
                  on:click={cancelarEdicion}
                  class="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                  disabled={disabled}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  on:click={() => guardarEdicion(index)}
                  class="px-3 py-1.5 text-sm bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                  disabled={disabled}
                >
                  Guardar
                </button>
              </div>
            </div>
          {:else}
            <!-- Modo vista -->
            <div class="p-4">
              <div class="flex items-start justify-between gap-4">
                <div class="flex-1 space-y-2">
                  <div class="flex items-center gap-2">
                    <Building2 class="w-5 h-5 text-yellow-600" />
                    <span class="font-semibold text-gray-800">{cuenta.banco}</span>
                  </div>
                  
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 text-sm">
                    <div class="flex items-center gap-2 text-gray-600">
                      <User class="w-4 h-4" />
                      <span class="font-medium">Titular:</span>
                      <span>{cuenta.titular}</span>
                    </div>
                    
                    <div class="flex items-center gap-2 text-gray-600">
                      <CreditCard class="w-4 h-4" />
                      <span class="font-medium">Cuenta:</span>
                      <span class="font-mono">{cuenta.numero_cuenta}</span>
                    </div>
                    
                    {#if cuenta.clabe}
                      <div class="flex items-center gap-2 text-gray-600 md:col-span-2">
                        <Hash class="w-4 h-4" />
                        <span class="font-medium">CLABE:</span>
                        <span class="font-mono">{cuenta.clabe}</span>
                      </div>
                    {/if}
                  </div>
                </div>
                
                {#if !disabled}
                  <div class="flex gap-2">
                    <button
                      type="button"
                      on:click={() => editarCuenta(index)}
                      class="p-2 text-gray-600 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                      </svg>
                    </button>
                    
                    <button
                      type="button"
                      on:click={() => eliminarCuenta(index)}
                      class="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                      title="Eliminar"
                    >
                      <X class="w-5 h-5" />
                    </button>
                  </div>
                {/if}
              </div>
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
  
  <!-- Formulario para agregar nueva cuenta -->
  {#if !disabled}
    <div class="bg-yellow-50 rounded-lg border-2 border-dashed border-yellow-300 p-4">
      <h4 class="font-semibold text-gray-800 mb-3 flex items-center gap-2">
        <Plus class="w-5 h-5 text-yellow-600" />
        Agregar cuenta bancaria
      </h4>
      
      <div class="space-y-3">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <!-- Banco -->
          <div>
            <label class="label flex items-center gap-2">
              <Building2 class="w-4 h-4 text-yellow-600" />
              Banco *
            </label>
            <input
              type="text"
              bind:value={nuevaCuenta.banco}
              list="bancos-sugeridos"
              placeholder="Ej: BBVA"
              class="input"
              required
            />
          </div>
          
          <!-- Titular -->
          <div>
            <label class="label flex items-center gap-2">
              <User class="w-4 h-4 text-yellow-600" />
              Titular de la cuenta *
            </label>
            <input
              type="text"
              bind:value={nuevaCuenta.titular}
              placeholder="Ej: Juan Pérez López"
              class="input"
              required
            />
          </div>
          
          <!-- Número de cuenta -->
          <div>
            <label class="label flex items-center gap-2">
              <CreditCard class="w-4 h-4 text-yellow-600" />
              Número de cuenta *
            </label>
            <input
              type="text"
              bind:value={nuevaCuenta.numero_cuenta}
              placeholder="Ej: 1234567890"
              class="input font-mono"
              required
            />
          </div>
          
          <!-- CLABE -->
          <div>
            <label class="label flex items-center gap-2">
              <Hash class="w-4 h-4 text-yellow-600" />
              CLABE (opcional)
            </label>
            <input
              type="text"
              bind:value={nuevaCuenta.clabe}
              placeholder="Ej: 012345678901234567"
              maxlength="18"
              class="input font-mono"
            />
            <p class="text-xs text-gray-500 mt-1">18 dígitos</p>
          </div>
        </div>
        
        <div class="flex justify-end">
          <button
            type="button"
            on:click={agregarCuenta}
            class="btn-primary flex items-center gap-2"
          >
            <Plus class="w-4 h-4" />
            Agregar cuenta
          </button>
        </div>
      </div>
    </div>
  {/if}
  
  <!-- Datalist para bancos sugeridos -->
  <datalist id="bancos-sugeridos">
    {#each bancosSugeridos as banco}
      <option value={banco}></option>
    {/each}
  </datalist>
  
  <!-- Información de ayuda -->
  <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
    <div class="flex items-start gap-3">
      <svg class="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
      <div class="text-sm text-blue-800">
        <p class="font-medium mb-1">Instrucciones</p>
        <ul class="list-disc list-inside space-y-1 text-blue-700">
          <li>Puedes agregar múltiples cuentas bancarias (para depósitos y transferencias)</li>
          <li>Los campos marcados con * son obligatorios</li>
          <li>La CLABE es opcional pero recomendada para transferencias</li>
          <li>Esta información se mostrará a los clientes al momento de pagar</li>
        </ul>
      </div>
    </div>
  </div>
</div>