const API_URL = 'http://localhost:5000'; // Cambiar por URL de producción

let usuario = null;
let intervalReloj = null;
let intervalEstado = null;

// Cargar usuario al iniciar
document.addEventListener('DOMContentLoaded', async () => {
    const usuarioData = sessionStorage.getItem('usuario');
    if (!usuarioData) {
        window.location.href = 'index.html';
        return;
    }
    
    usuario = JSON.parse(usuarioData);
    
    if (usuario.rol === 'admin') {
        window.location.href = 'admin.html';
        return;
    }
    
    // Mostrar información del usuario
    document.getElementById('nombreTrabajador').textContent = usuario.nombre;
    document.getElementById('dniTrabajador').textContent = usuario.dni;
    
    // Iniciar reloj
    iniciarReloj();
    
    // Cargar estado inicial
    await cargarEstado();
    
    // Actualizar estado cada 5 segundos
    intervalEstado = setInterval(cargarEstado, 5000);
});

function iniciarReloj() {
    intervalReloj = setInterval(() => {
        const ahora = new Date();
        document.getElementById('reloj').textContent = ahora.toLocaleTimeString('es-ES');
        document.getElementById('fechaActual').textContent = ahora.toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }, 1000);
}

async function cargarEstado() {
    try {
        const response = await fetch(`${API_URL}/api/trabajador/estado/${usuario.id}`);
        const data = await response.json();
        
        const estadoIcono = document.getElementById('estadoIcono');
        const estadoTexto = document.getElementById('estadoTexto');
        const btnIniciar = document.getElementById('btnIniciar');
        const btnFinalizar = document.getElementById('btnFinalizar');
        const tiempoTranscurrido = document.getElementById('tiempoTranscurrido');
        
        if (data.activo && data.registro_activo) {
            estadoIcono.textContent = '🟢';
            estadoTexto.textContent = 'Picking en curso';
            btnIniciar.style.display = 'none';
            btnFinalizar.style.display = 'block';
            
            // Calcular tiempo transcurrido
            const inicio = new Date(data.registro_activo.hora_inicio);
            const ahora = new Date();
            const diff = Math.floor((ahora - inicio) / 1000);
            const horas = Math.floor(diff / 3600);
            const minutos = Math.floor((diff % 3600) / 60);
            tiempoTranscurrido.textContent = `Tiempo actual: ${horas}h ${minutos}min`;
        } else {
            estadoIcono.textContent = '⏸️';
            estadoTexto.textContent = 'No hay picking activo';
            btnIniciar.style.display = 'block';
            btnFinalizar.style.display = 'none';
            tiempoTranscurrido.textContent = '';
        }
        
        // Actualizar resumen del día
        if (data.ultimo_registro) {
            const totalHoy = document.getElementById('totalHoy');
            const ultimoRegistro = document.getElementById('ultimoRegistro');
            
            if (data.ultimo_registro.tiempo_total) {
                totalHoy.textContent = data.ultimo_registro.tiempo_total;
            }
            ultimoRegistro.textContent = data.ultimo_registro.hora_inicio || '--';
        }
        
    } catch (error) {
        console.error('Error al cargar estado:', error);
    }
}

async function iniciarPicking() {
    try {
        const response = await fetch(`${API_URL}/api/trabajador/iniciar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ usuario_id: usuario.id })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            mostrarNotificacion('✅ Picking iniciado correctamente', 'success');
            await cargarEstado();
        } else {
            mostrarNotificacion(data.error || 'Error al iniciar picking', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('Error de conexión', 'error');
    }
}

async function finalizarPicking() {
    try {
        const response = await fetch(`${API_URL}/api/trabajador/finalizar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ usuario_id: usuario.id })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            mostrarNotificacion('✅ Picking finalizado correctamente', 'success');
            await cargarEstado();
        } else {
            mostrarNotificacion(data.error || 'Error al finalizar picking', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('Error de conexión', 'error');
    }
}

function mostrarNotificacion(mensaje, tipo) {
    const notificacion = document.createElement('div');
    notificacion.className = `notificacion notificacion-${tipo}`;
    notificacion.textContent = mensaje;
    notificacion.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${tipo === 'success' ? '#00b894' : '#ff4757'};
        color: white;
        border-radius: 10px;
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notificacion);
    
    setTimeout(() => {
        notificacion.remove();
    }, 3000);
}

function cerrarSesion() {
    sessionStorage.clear();
    window.location.href = 'index.html';
}

// Agregar estilos de animación
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);