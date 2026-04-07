const API_URL = 'https://picking-system-backend.onrender.com';

// ============================
// 🔥 HORA PERÚ GLOBAL
// ============================
function ahoraPeru() {
    return new Date(new Date().toLocaleString("en-US", {
        timeZone: "America/Lima"
    }));
}

function fechaPeruISO() {
    const f = ahoraPeru();
    return `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}-${String(f.getDate()).padStart(2, '0')}`;
}

// ============================
// RELOJ ADMIN
// ============================
function iniciarRelojAdmin() {
    function tick() {
        const ahora = ahoraPeru();

        let h = ahora.getHours();
        const m = String(ahora.getMinutes()).padStart(2, '0');
        const s = String(ahora.getSeconds()).padStart(2, '0');
        const ampm = h >= 12 ? 'PM' : 'AM';

        h = h % 12 || 12;

        document.getElementById('adminClock').textContent =
            `${String(h).padStart(2, '0')}:${m}:${s} ${ampm}`;
    }

    tick();
    setInterval(tick, 1000);
}

// ============================
// INIT
// ============================
document.addEventListener('DOMContentLoaded', async () => {

    const usuario = JSON.parse(sessionStorage.getItem('usuario'));

    if (!usuario) return location.href = 'index.html';
    if (usuario.rol !== 'admin') return location.href = 'trabajador.html';

    iniciarRelojAdmin();

    document.getElementById('fecha').value = fechaPeruISO();

    await cargarTrabajadores();
    await cargarReportes();

    setInterval(cargarReportes, 30000);
});

// ============================
// TRABAJADORES
// ============================
async function cargarTrabajadores() {
    try {
        const res = await fetch(`${API_URL}/api/admin/trabajadores`);
        const data = await res.json();

        const select = document.getElementById('trabajador');
        select.innerHTML = '<option value="">Todos</option>';

        data.forEach(t => {
            const o = document.createElement('option');
            o.value = t.id;
            o.textContent = `${t.nombre} (${t.dni})`;
            select.appendChild(o);
        });

    } catch (e) {
        console.error(e);
    }
}

// ============================
// REPORTES
// ============================
async function cargarReportes() {

    const fecha = document.getElementById('fecha').value;
    const trabajadorId = document.getElementById('trabajador').value;

    let url = `${API_URL}/api/admin/reportes?`;
    if (fecha) url += `fecha=${fecha}&`;
    if (trabajadorId) url += `trabajador_id=${trabajadorId}`;

    try {
        const res = await fetch(url);
        const data = await res.json();

        const tbody = document.getElementById('reportesBody');
        tbody.innerHTML = '';

        if (!data.length) {
            tbody.innerHTML = `<tr><td colspan="7">No hay registros</td></tr>`;
            return;
        }

        data.forEach(r => {

            const row = tbody.insertRow();

            row.insertCell(0).textContent = r.trabajador;
            row.insertCell(1).textContent = r.dni;

            // 🔥 FECHA PERÚ CORRECTA
            row.insertCell(2).textContent =
                new Date(r.fecha + 'T00:00:00')
                .toLocaleDateString('es-PE', { timeZone: 'America/Lima' });

            row.insertCell(3).textContent = r.hora_inicio;
            row.insertCell(4).textContent = r.hora_fin || '—';
            row.insertCell(5).textContent = r.tiempo_total || 'En curso';

            row.insertCell(6).innerHTML =
                !r.hora_fin
                    ? '<span class="badge-active">En curso</span>'
                    : '<span class="badge-done">Finalizado</span>';
        });

    } catch (e) {
        console.error(e);
    }
}

// ============================
// EXPORTAR PDF
// ============================
async function exportarExcel() {

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'landscape' });

    const ahora = ahoraPeru();

    const fecha = fechaPeruISO();
    const hora = ahora.toLocaleTimeString('es-PE', { timeZone: 'America/Lima' });

    doc.text('📦 Reporte de Picking', 14, 20);
    doc.text(`Fecha: ${fecha}`, 14, 30);
    doc.text(`Hora: ${hora}`, 14, 36);

    doc.save(`reporte_${fecha}.pdf`);
}