const API_URL = 'https://picking-system-backend.onrender.com';

let usuario = null;
let intervalReloj = null;
let intervalEstado = null;
let intervalTiempo = null;

let totalBaseSegundos = 0; // acumulado del día
let inicioActivo = null;   // inicio sesión activa

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
    await cargarHistorial();
    await cargarEstado();

    intervalEstado = setInterval(cargarEstado, 5000);
});

// ============================
// RELOJ
// ============================
function iniciarReloj() {
    function tick() {
        const ahora = new Date();

        let horas = ahora.getHours();
        const minutos = String(ahora.getMinutes()).padStart(2, '0');
        const segundos = String(ahora.getSeconds()).padStart(2, '0');
        const ampm = horas >= 12 ? 'PM' : 'AM';

        horas = horas % 12;
        horas = horas ? horas : 12;

        document.getElementById('horaH').textContent = String(horas).padStart(2, '0');
        document.getElementById('horaM').textContent = minutos;
        document.getElementById('horaS').textContent = segundos;
        document.getElementById('ampm').textContent = ampm;

        document.getElementById('fechaActual').textContent =
            ahora.toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
    }

    tick();
    intervalReloj = setInterval(tick, 1000);
}

// ============================
// FORMATEAR TIEMPO
// ============================
function formatearSegundos(seg) {
    const h = String(Math.floor(seg / 3600)).padStart(2, '0');
    const m = String(Math.floor((seg % 3600) / 60)).padStart(2, '0');
    const s = String(seg % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
}

// ============================
// ESTADO ACTUAL
// ============================
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

        if (intervalTiempo) {
            clearInterval(intervalTiempo);
            intervalTiempo = null;
        }

        if (data.activo && data.registro_activo) {

            pill.className = 'status-pill status-active';
            dot.className = 'status-dot status-dot-active';
            label.textContent = 'Picking en curso';

            const inicio = new Date(data.registro_activo.hora_inicio);
            inicioActivo = inicio;

            texto.textContent = 'Jornada activa desde las ' +
                inicio.toLocaleTimeString('es-ES');

            btnIni.style.display = 'none';
            btnFin.style.display = 'block';

            // 🔥 TIEMPO EN VIVO
            intervalTiempo = setInterval(() => {
                const ahora = new Date();
                const diff = Math.floor((ahora - inicioActivo) / 1000);

                tiempo.textContent = `Tiempo transcurrido: ${formatearSegundos(diff)}`;

                // 🔥 TOTAL HOY EN VIVO
                document.getElementById('totalHoy').textContent =
                    formatearSegundos(totalBaseSegundos + diff);

            }, 1000);

        } else {
            pill.className = 'status-pill status-idle';
            dot.className = 'status-dot';
            label.textContent = 'Sin picking activo';
            texto.textContent = 'No hay sesión iniciada';
            tiempo.textContent = '';
            btnIni.style.display = 'block';
            btnFin.style.display = 'none';
            inicioActivo = null;
        }

        // ÚLTIMO INICIO
        if (data.ultimo_registro?.hora_inicio) {
            const f = new Date(data.ultimo_registro.hora_inicio);
            document.getElementById('ultimoRegistro').textContent =
                f.toLocaleTimeString('es-ES');
        }

    } catch (error) {
        console.error('Error al cargar estado:', error);
    }
}

// ============================
// HISTORIAL + TOTAL
// ============================
async function cargarHistorial() {
    try {
        const res = await fetch(`${API_URL}/api/trabajador/historial/${usuario.id}`);
        const data = await res.json();

        const historial = data.historial || [];
        mostrarHistorial(historial);

        // 🔥 SUMA TOTAL
        totalBaseSegundos = 0;

        historial.forEach(h => {
            if (h.duracion_segundos) {
                totalBaseSegundos += h.duracion_segundos;
            }
        });

        document.getElementById('totalHoy').textContent =
            formatearSegundos(totalBaseSegundos);

    } catch (error) {
        console.error('Error cargando historial:', error);
    }
}

// ============================
// TABLA
// ============================
function mostrarHistorial(historial) {
    const tbody = document.getElementById('historialBody');
    tbody.innerHTML = '';

    document.getElementById('totalSesiones').textContent = historial.length;

    if (!historial.length) {
        tbody.innerHTML = '<tr><td colspan="4">Sin registros</td></tr>';
        return;
    }

    historial.forEach(h => {
        const row = tbody.insertRow();

        const fecha = new Date(h.fecha);

        row.insertCell(0).textContent =
            fecha.toLocaleDateString('es-ES');

        row.insertCell(1).textContent = h.hora_inicio;
        row.insertCell(2).textContent = h.hora_fin || '—';
        row.insertCell(3).textContent = h.tiempo_total || 'En curso';
    });
}

// ============================
// ACCIONES
// ============================
async function iniciarPicking() {
    await fetch(`${API_URL}/api/trabajador/iniciar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario_id: usuario.id })
    });

    await cargarHistorial();
    await cargarEstado();
}

async function finalizarPicking() {
    await fetch(`${API_URL}/api/trabajador/finalizar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario_id: usuario.id })
    });

    await cargarHistorial();
    await cargarEstado();
}

function cerrarSesion() {
    sessionStorage.clear();
    window.location.href = 'index.html';
}