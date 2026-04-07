const API_URL = 'https://picking-system-backend.onrender.com';

let usuario = null;
let intervalTiempo = null;

// ============================
// 🔥 HORA PERÚ
// ============================
function ahoraPeru() {
    return new Date(new Date().toLocaleString("en-US", {
        timeZone: "America/Lima"
    }));
}

// ============================
// INIT
// ============================
document.addEventListener('DOMContentLoaded', async () => {

    usuario = JSON.parse(sessionStorage.getItem('usuario'));

    if (!usuario) return location.href = 'index.html';
    if (usuario.rol === 'admin') return location.href = 'admin.html';

    document.getElementById('nombreTrabajador').textContent = usuario.nombre;

    iniciarReloj();
    await cargarEstado();
});

// ============================
// RELOJ
// ============================
function iniciarReloj() {
    setInterval(() => {

        const ahora = ahoraPeru();

        document.getElementById('hora').textContent =
            ahora.toLocaleTimeString('es-PE', { timeZone: 'America/Lima' });

    }, 1000);
}

// ============================
// ESTADO
// ============================
async function cargarEstado() {

    try {
        const res = await fetch(`${API_URL}/api/trabajador/estado/${usuario.id}`);
        const data = await res.json();

        const estado = document.getElementById('estadoTexto');

        if (data.activo) {
            estado.textContent = 'En picking';
        } else {
            estado.textContent = 'Sin sesión';
        }

    } catch (e) {
        console.error(e);
    }
}

// ============================
// INICIAR
// ============================
async function iniciarPicking() {

    try {
        const res = await fetch(`${API_URL}/api/trabajador/iniciar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario_id: usuario.id })
        });

        const data = await res.json();

        if (!res.ok) throw new Error(data.message);

        alert('✅ Picking iniciado');
        await cargarEstado();

    } catch (e) {
        alert('❌ ' + e.message);
    }
}

// ============================
// FINALIZAR
// ============================
async function finalizarPicking() {

    try {
        const res = await fetch(`${API_URL}/api/trabajador/finalizar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario_id: usuario.id })
        });

        const data = await res.json();

        if (!res.ok) throw new Error(data.message);

        alert('✅ Picking finalizado');
        await cargarEstado();

    } catch (e) {
        alert('❌ ' + e.message);
    }
}

// ============================
// LOGOUT
// ============================
function cerrarSesion() {
    sessionStorage.clear();
    location.href = 'index.html';
}