const API_URL = 'https://picking-system-backend.onrender.com';

// Colores avatar
const AVATAR_COLORS = [
    'linear-gradient(135deg,#C9A84C,#8B6914)',
    'linear-gradient(135deg,#5a67d8,#3c3489)',
    'linear-gradient(135deg,#2d6a4f,#085041)',
    'linear-gradient(135deg,#d85a30,#4a1b0c)',
    'linear-gradient(135deg,#185fa5,#042c53)',
    'linear-gradient(135deg,#993556,#4b1528)',
];

let usuario = null;

// ============================
// RELOJ ADMIN (12H EN VIVO)
// ============================
function iniciarRelojAdmin() {
    function tick() {
        const ahora = new Date();

        let horas = ahora.getHours();
        const minutos = String(ahora.getMinutes()).padStart(2, '0');
        const segundos = String(ahora.getSeconds()).padStart(2, '0');
        const ampm = horas >= 12 ? 'PM' : 'AM';

        horas = horas % 12;
        horas = horas ? horas : 12;

        const relojDiv = document.getElementById('adminClock');
        if (relojDiv) {
            relojDiv.textContent =
                `${String(horas).padStart(2, '0')}:${minutos}:${segundos} ${ampm}`;
        }
    }

    tick();
    setInterval(tick, 1000);
}

// ============================
// INIT
// ============================
document.addEventListener('DOMContentLoaded', async () => {

    const usuarioData = sessionStorage.getItem('usuario');
    if (!usuarioData) { window.location.href = 'index.html'; return; }

    usuario = JSON.parse(usuarioData);
    if (usuario.rol !== 'admin') {
        window.location.href = 'trabajador.html';
        return;
    }

    iniciarRelojAdmin();

    await cargarTrabajadores();

    const hoy = new Date().toISOString().split('T')[0];
    document.getElementById('fecha').value = hoy;

    await cargarReportes();

    // refresco automático
    setInterval(cargarReportes, 30000);
});

// ============================
// TRABAJADORES
// ============================
async function cargarTrabajadores() {
    try {
        const response = await fetch(`${API_URL}/api/admin/trabajadores`);
        const trabajadores = await response.json();

        const select = document.getElementById('trabajador');
        select.innerHTML = '<option value="">Todos los trabajadores</option>';

        trabajadores.forEach(t => {
            const option = document.createElement('option');
            option.value = t.id;
            option.textContent = `${t.nombre} (${t.dni})`;
            select.appendChild(option);
        });

    } catch (error) {
        console.error('Error al cargar trabajadores:', error);
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
        const response = await fetch(url);
        const reportes = await response.json();

        const tbody = document.getElementById('reportesBody');
        tbody.innerHTML = '';

        let totalHoras = 0;
        const trabajadoresUnicos = new Set();

        if (reportes.length === 0) {
            tbody.innerHTML =
                '<tr><td colspan="7" class="text-center td-muted">No hay registros</td></tr>';
        } else {

            reportes.forEach((r, i) => {

                const row = tbody.insertRow();
                const activo = !r.hora_fin;

                const initials = r.trabajador
                    .split(' ')
                    .map(w => w[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase();

                const color = AVATAR_COLORS[i % AVATAR_COLORS.length];

                row.insertCell(0).innerHTML = `
                    <div class="worker-cell">
                        <div class="mini-avatar" style="background:${color}; color:var(--ink)">
                            ${initials}
                        </div>
                        ${escapeHtml(r.trabajador)}
                    </div>`;

                row.insertCell(1).textContent = r.dni;

                // fecha formateada
                const fechaFormateada = new Date(r.fecha).toLocaleDateString('es-ES');
                row.insertCell(2).textContent = fechaFormateada;

                row.insertCell(3).textContent = r.hora_inicio;
                row.insertCell(4).textContent = r.hora_fin || '—';
                row.insertCell(5).textContent = r.tiempo_total || 'En curso';

                row.insertCell(6).innerHTML = activo
                    ? '<span class="badge-active">En curso</span>'
                    : '<span class="badge-done">Finalizado</span>';

                if (r.duracion_horas) {
                    totalHoras += r.duracion_horas;
                    trabajadoresUnicos.add(r.trabajador);
                }
            });
        }

        // métricas
        document.getElementById('totalActivos').textContent =
            reportes.filter(r => !r.hora_fin).length;

        document.getElementById('totalHoras').textContent =
            `${totalHoras.toFixed(2)}h`;

        document.getElementById('promedioHoras').textContent =
            trabajadoresUnicos.size
                ? `${(totalHoras / trabajadoresUnicos.size).toFixed(2)}h`
                : '0h';

        document.getElementById('totalRegistros').textContent = reportes.length;

        document.getElementById('contadorRegistros').textContent =
            `${reportes.length} registro${reportes.length !== 1 ? 's' : ''}`;

    } catch (error) {
        console.error('Error al cargar reportes:', error);

        document.getElementById('reportesBody').innerHTML =
            '<tr><td colspan="7">Error al cargar datos</td></tr>';
    }
}

// ============================
// EXPORTAR PDF (CON HORA REAL 12H)
// ============================
async function exportarExcel() {

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'landscape' });

    const fecha = document.getElementById('fecha').value || 'Todas';
    const select = document.getElementById('trabajador');
    const trabajadorTexto =
        select.options[select.selectedIndex]?.text || 'Todos';

    // 🔥 HORA ACTUAL FORMATO 12H
    const ahora = new Date();

    let horas = ahora.getHours();
    const minutos = String(ahora.getMinutes()).padStart(2, '0');
    const segundos = String(ahora.getSeconds()).padStart(2, '0');
    const ampm = horas >= 12 ? 'PM' : 'AM';

    horas = horas % 12;
    horas = horas ? horas : 12;

    const horaActual =
        `${String(horas).padStart(2, '0')}:${minutos}:${segundos} ${ampm}`;

    // encabezado
    doc.setFontSize(16);
    doc.text('📦 Reporte de Picking', 14, 22);

    doc.setFontSize(10);
    doc.text(`Filtro fecha: ${fecha}`, 14, 32);
    doc.text(`Trabajador: ${trabajadorTexto}`, 14, 38);
    doc.text(`Generado: ${horaActual}`, 14, 44);

    // tabla
    const headers = [];
    document.querySelectorAll('#reportesTabla thead th')
        .forEach(th => headers.push(th.innerText.trim()));

    const body = [];
    document.querySelectorAll('#reportesTabla tbody tr')
        .forEach(tr => {
            const row = [];
            tr.querySelectorAll('td')
                .forEach(td => row.push(td.innerText.trim()));
            if (row.length) body.push(row);
        });

    doc.autoTable({
        head: [headers],
        body: body,
        startY: 52,
        theme: 'striped',
        styles: { fontSize: 9 }
    });

    doc.save(`reporte_${new Date().toISOString().split('T')[0]}.pdf`);

    mostrarNotificacion('PDF generado correctamente', 'success');
}

// ============================
// UTIL
// ============================
function mostrarNotificacion(mensaje, tipo) {
    const n = document.createElement('div');
    n.textContent = mensaje;
    n.style.cssText = `
        position:fixed; top:20px; right:20px;
        background:${tipo === 'success' ? 'green' : 'red'};
        color:white; padding:10px;
    `;
    document.body.appendChild(n);
    setTimeout(() => n.remove(), 3000);
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function cerrarSesion() {
    sessionStorage.clear();
    window.location.href = 'index.html';
}