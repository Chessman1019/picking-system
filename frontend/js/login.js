const API_URL = 'https://picking-system-backend.onrender.com';
 
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
 
    const dni = document.getElementById('dni').value.trim();
    const errorDiv = document.getElementById('errorMessage');
 
    if (!dni) return;
 
    try {
        const response = await fetch(`${API_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ dni })
        });
 
        const data = await response.json();
 
        if (response.ok && data.success) {
            sessionStorage.setItem('usuario', JSON.stringify(data.usuario));
            window.location.href = data.usuario.rol === 'admin' ? 'admin.html' : 'trabajador.html';
        } else {
            mostrarError(data.error || 'Usuario no encontrado. Verifica tu DNI.');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error de conexión con el servidor.');
    }
});
 
function mostrarError(msg) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = msg;
    errorDiv.style.display = 'block';
    setTimeout(() => { errorDiv.style.display = 'none'; }, 4000);
}
 