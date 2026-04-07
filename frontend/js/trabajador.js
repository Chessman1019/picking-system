const API_URL = 'https://picking-system-backend.onrender.com';

let usuario = null;
let intervalReloj = null;
let intervalEstado = null;
let intervalTiempo = null;

let totalBaseSegundos = 0;
let inicioActivo = null;

// ============================
// 🔥 HORA PERÚ
// ============================
function ahoraPeru() {
    return new Date(new Date().toLocaleString("en-US", {
        timeZone: "America/Lima"
    }));
}

// ============================
// 🔥 PARSEAR HORA BACKEND
// ============================
function parseHoraPeru(horaStr) {
    if (!horaStr) return null;

    const partes = horaStr.match(/(\d+):(\d+):(\d+)\s?(AM|PM)/i);
    if (!partes) return null;

    let h = parseInt(partes[1]);
    const m = parseInt(partes[2]);
    const s = parseInt(partes[3]);
    const ampm = partes[4].toUpperCase();

    if (ampm === 'PM' && h !== 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;

    const ahora = ahoraPeru();

    return new Date(
        ahora.getFullYear(),
        ahora.getMonth(),
        ahora.getDate(),
        h, m, s
    );
}

// ============================
// FORMATO
// ============================
function formatearSegundos(seg) {
    const h = String(Math.floor(seg / 3600)).padStart(2, '0');
    const m = String(Math.floor((seg % 3600) / 60)).padStart(2, '0');
    const s = String(seg % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
}

function formatearHoraPeru(date) {
    return date.toLocaleTimeString('es-PE', {
        timeZone: 'America/Lima'
    });
}

// ============================
// INIT
// ============================
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
// 🕒 RELOJ PERÚ
// ============================
function iniciarReloj() {
    function tick() {
        const ahora = ahoraPeru();

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
            ahora.toLocaleDateString('es-PE', {
                timeZone: 'America/Lima',
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
// ESTADO
// ============================
async function cargarEstado() {
    try {
        const res = await fetch(`${API_URL}/api/trabajador/estado/${usuario.id}`);
        const data = await res.json();

        const texto = document.getElementById('estadoTexto');
        const tiempo = document.getElementById('tiempoTranscurrido');

        if (intervalTiempo) clearInterval(intervalTiempo);

        if (data.activo && data.registro_activo) {

            const inicio = parseHoraPeru(data.registro_activo.hora_inicio);
            inicioActivo = inicio;

            texto.textContent =
                'Jornada activa desde las ' + formatearHoraPeru(inicio);

            intervalTiempo = setInterval(() => {

                const ahora = ahoraPeru();
                const diff = Math.floor((ahora - inicioActivo) / 1000);

                tiempo.textContent =
                    `Tiempo transcurrido: ${formatearSegundos(diff)}`;

                document.getElementById('totalHoy').textContent =
                    formatearSegundos(totalBaseSegundos + diff);

            }, 1000);

        } else {
            texto.textContent = 'No hay sesión iniciada';
            tiempo.textContent = '';
        }

        // 🔥 ÚLTIMO INICIO CORREGIDO
        if (data.ultimo_registro?.hora_inicio) {

            const f = parseHoraPeru(data.ultimo_registro.hora_inicio);

            document.getElementById('ultimoRegistro').textContent =
                f ? formatearHoraPeru(f) : data.ultimo_registro.hora_inicio;
        }

    } catch (e) {
        console.error(e);
    }
}

// ============================
// HISTORIAL + TOTAL
// ============================
function parseDuracion(txt) {
    if (!txt) return 0;

    const h = txt.match(/(\d+)h/)?.[1] || 0;
    const m = txt.match(/(\d+)m/)?.[1] || 0;
    const s = txt.match(/(\d+)s/)?.[1] || 0;

    return (+h * 3600) + (+m * 60) + (+s);
}

async function cargarHistorial() {
    try {
        const res = await fetch(`${API_URL}/api/trabajador/historial/${usuario.id}`);
        const data = await res.json();

        const historial = data.historial || [];

        totalBaseSegundos = 0;

        historial.forEach(h => {
            totalBaseSegundos += parseDuracion(h.tiempo_total);
        });

        document.getElementById('totalHoy').textContent =
            formatearSegundos(totalBaseSegundos);

        mostrarHistorial(historial);

    } catch (e) {
        console.error(e);
    }
}

// ============================
// TABLA
// ============================
function mostrarHistorial(historial) {
    const tbody = document.getElementById('historialBody');
    tbody.innerHTML = '';

    document.getElementById('totalSesiones').textContent = historial.length;

    historial.forEach(h => {
        const row = tbody.insertRow();

        row.insertCell(0).textContent = h.fecha;
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