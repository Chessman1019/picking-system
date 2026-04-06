const API_URL = 'https://picking-system-backend.onrender.com';

let usuario = null;

// Verificar autenticación
document.addEventListener('DOMContentLoaded', async () => {
    const usuarioData = sessionStorage.getItem('usuario');
    if (!usuarioData) {
        window.location.href = 'index.html';
        return;
    }
    
    usuario = JSON.parse(usuarioData);
    
    if (usuario.rol !== 'admin') {
        window.location.href = 'trabajador.html';
        return;
    }
    
    // Cargar trabajadores
    await cargarTrabajadores();
    
    // Cargar reportes del día actual
    const hoy = new Date().toISOString().split('T')[0];
    document.getElementById('fecha').value = hoy;
    await cargarReportes();
    
    // Actualizar cada 30 segundos
    setInterval(cargarReportes, 30000);
});

async function cargarTrabajadores() {
    try {
        const response = await fetch(`${API_URL}/api/admin/trabajadores`);
        const trabajadores = await response.json();
        
        const select = document.getElementById('trabajador');
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

async function cargarReportes() {
    const fecha = document.getElementById('fecha').value;
    const trabajadorId = document.getElementById('trabajador').value;
    
    let url = `${API_URL}/api/admin/reportes?`;
    if (fecha) url += `fecha=${fecha}&`;
    if (trabajadorId) url += `trabajador_id=${trabajadorId}`;
    
    try {
        const response = await fetch(url);
        const reportes = await response.json();
        
        // Actualizar tabla
        const tbody = document.getElementById('reportesBody');
        tbody.innerHTML = '';
        
        let totalHoras = 0;
        let trabajadoresUnicos = new Set();
        
        if (reportes.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">No hay registros para esta fecha</td></tr>';
        } else {
            reportes.forEach(r => {
                const row = tbody.insertRow();
                row.insertCell(0).textContent = r.trabajador;
                row.insertCell(1).textContent = r.dni;
                row.insertCell(2).textContent = r.fecha;
                row.insertCell(3).textContent = r.hora_inicio;
                row.insertCell(4).textContent = r.hora_fin || 'En curso';
                row.insertCell(5).textContent = r.tiempo_total || 'En curso';
                
                if (r.duracion_horas) {
                    totalHoras += r.duracion_horas;
                    trabajadoresUnicos.add(r.trabajador);
                }
            });
        }
        
        // Actualizar estadísticas
        document.getElementById('totalActivos').textContent = reportes.filter(r => !r.hora_fin).length;
        document.getElementById('totalHoras').textContent = `${totalHoras.toFixed(1)}h`;
        document.getElementById('promedioHoras').textContent = 
            trabajadoresUnicos.size ? `${(totalHoras / trabajadoresUnicos.size).toFixed(1)}h` : '0h';
        document.getElementById('totalRegistros').textContent = reportes.length;
        
    } catch (error) {
        console.error('Error al cargar reportes:', error);
        document.getElementById('reportesBody').innerHTML = '<tr><td colspan="6" class="text-center">Error al cargar datos</td></tr>';
    }
}

function exportarExcel() {
    const tabla = document.getElementById('reportesTabla');
    const rows = tabla.querySelectorAll('tr');
    const csv = [];
    
    rows.forEach(row => {
        const cells = row.querySelectorAll('th, td');
        const rowData = Array.from(cells).map(cell => cell.textContent);
        csv.push(rowData.join(','));
    });
    
    const blob = new Blob([csv.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', `reporte_picking_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    mostrarNotificacion('✅ Reporte exportado correctamente', 'success');
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