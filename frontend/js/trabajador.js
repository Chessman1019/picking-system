const API_URL = 'https://picking-system-backend.onrender.com';

let usuario = null;
let intervalReloj = null;
let intervalEstado = null;

document.addEventListener('DOMContentLoaded', async () => {
    const usuarioData = sessionStorage.getItem('usuario');
    if (!usuarioData) { window.location.href = 'index.html'; return; }

    usuario = JSON.parse(usuarioData);
    if (usuario.rol === 'admin') { window.location.href = 'admin.html'; return; }

    document.getElementById('nombreTrabajador').textContent = usuario.nombre;
    document.getElementById('dniTrabajador').textContent = 'DNI ' + usuario.dni;

    const initials = usuario.nombre.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
    document.getElementById('avatarLetras').textContent = initials;

    iniciarReloj();
    await cargarEstado();
    await cargarHistorial();
    intervalEstado = setInterval(cargarEstado, 5000);
});

// =============================================
// RELOJ EN FORMATO 12 HORAS
// =============================================
function iniciarReloj() {
    function tick() {
        const ahora = new Date();
        let horas = ahora.getHours();
        const minutos = String(ahora.getMinutes()).padStart(2, '0');
        const segundos = String(ahora.getSeconds()).padStart(2, '0');
        const ampm = horas >= 12 ? 'PM' : 'AM';
        horas = horas % 12;
        horas = horas ? horas : 12;
        const horasStr = String(horas).padStart(2, '0');

        document.getElementById('horaH').textContent = horasStr;
        document.getElementById('horaM').textContent = minutos;
        document.getElementById('horaS').textContent = segundos;
        document.getElementById('ampm').textContent = ampm;

        document.getElementById('fechaActual').textContent = ahora.toLocaleDateString('es-ES', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });
    }
    tick();
    intervalReloj = setInterval(tick, 1000);
}

async function cargarEstado() {
    try {
        const response = await fetch(`${API_URL}/api/trabajador/estado/${usuario.id}`);
        const data = await response.json();

        const pill = document.getElementById('statusPill');
        const dot = document.getElementById('statusDot');
        const label = document.getElementById('statusLabel');
        const texto = document.getElementById('estadoTexto');
        const tiempo = document.getElementById('tiempoTranscurrido');
        const btnIni = document.getElementById('btnIniciar');
        const btnFin = document.getElementById('btnFinalizar');

        if (data.activo && data.registro_activo) {
            pill.className = 'status-pill status-active';
            dot.className = 'status-dot status-dot-active';
            label.textContent = 'Picking en curso';
            texto.textContent = 'Jornada activa desde las ' + data.registro_activo.hora_inicio;
            btnIni.style.display = 'none';
            btnFin.style.display = 'block';

            const inicio = new Date(data.registro_activo.hora_inicio);
            const diff = Math.floor((new Date() - inicio) / 1000);
            const h = Math.floor(diff / 3600);
            const m = Math.floor((diff % 3600) / 60);
            tiempo.textContent = `Tiempo transcurrido: ${h}h ${m}min`;
        } else {
            pill.className = 'status-pill status-idle';
            dot.className = 'status-dot';
            label.textContent = 'Sin picking activo';
            texto.textContent = 'No hay sesión iniciada';
            tiempo.textContent = '';
            btnIni.style.display = 'block';
            btnFin.style.display = 'none';
        }

        if (data.ultimo_registro) {
            if (data.ultimo_registro.tiempo_total) {
                document.getElementById('totalHoy').innerHTML = data.ultimo_registro.tiempo_total;
            }
            if (data.ultimo_registro.hora_inicio) {
                document.getElementById('ultimoRegistro').textContent = data.ultimo_registro.hora_inicio;
            }
        }

    } catch (error) {
        console.error('Error al cargar estado:', error);
    }
}

async function cargarHistorial() {
    try {
        const res = await fetch(`${API_URL}/api/trabajador/historial/${usuario.id}`);
        const data = await res.json();
        mostrarHistorial(data.historial || []);
    } catch (error) {
        console.error('Error cargando historial:', error);
    }
}

function mostrarHistorial(historial) {
    const tbody = document.getElementById('historialBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const sesEl = document.getElementById('totalSesiones');
    if (sesEl) sesEl.textContent = historial.length;

    if (!historial.length) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center td-muted">Sin registros previos</td></tr>';
        return;
    }

    historial.forEach(h => {
        const row = tbody.insertRow();
        row.insertCell(0).textContent = h.fecha;
        row.insertCell(1).textContent = h.hora_inicio;
        row.insertCell(2).textContent = h.hora_fin || '—';
        row.insertCell(3).textContent = h.tiempo_total || 'En curso';
    });
}

async function iniciarPicking() {
    try {
        const response = await fetch(`${API_URL}/api/trabajador/iniciar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario_id: usuario.id })
        });
        const data = await response.json();

        if (response.ok && data.success) {
            mostrarNotificacion('Picking iniciado correctamente', 'success');
            await cargarEstado();
            await cargarHistorial();
        } else {
            mostrarNotificacion(data.error || 'Error al iniciar picking', 'error');
        }
    } catch (error) {
        mostrarNotificacion('Error de conexión', 'error');
    }
}

async function finalizarPicking() {
    try {
        const response = await fetch(`${API_URL}/api/trabajador/finalizar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario_id: usuario.id })
        });
        const data = await response.json();

        if (response.ok && data.success) {
            mostrarNotificacion('Picking finalizado correctamente', 'success');
            await cargarEstado();
            await cargarHistorial();
        } else {
            mostrarNotificacion(data.error || 'Error al finalizar picking', 'error');
        }
    } catch (error) {
        mostrarNotificacion('Error de conexión', 'error');
    }
}

function mostrarNotificacion(mensaje, tipo) {
    const n = document.createElement('div');
    n.className = `notificacion notificacion-${tipo}`;
    n.textContent = (tipo === 'success' ? '✓  ' : '✕  ') + mensaje;
    document.body.appendChild(n);
    setTimeout(() => n.remove(), 3500);
}

function cerrarSesion() {
    sessionStorage.clear();
    window.location.href = 'index.html';
}