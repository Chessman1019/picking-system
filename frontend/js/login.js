const API_URL = 'http://localhost:5000'; // Cambiar por URL de producción

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const dni = document.getElementById('dni').value;
    const errorDiv = document.getElementById('errorMessage');
    
    try {
        const response = await fetch(`${API_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ dni })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            // Guardar usuario en sessionStorage
            sessionStorage.setItem('usuario', JSON.stringify(data.usuario));
            
            // Redirigir según rol
            if (data.usuario.rol === 'admin') {
                window.location.href = 'admin.html';
            } else {
                window.location.href = 'trabajador.html';
            }
        } else {
            errorDiv.textContent = data.error || 'Usuario no encontrado';
            errorDiv.style.display = 'block';
            setTimeout(() => {
                errorDiv.style.display = 'none';
            }, 3000);
        }
    } catch (error) {
        console.error('Error:', error);
        errorDiv.textContent = 'Error de conexión con el servidor';
        errorDiv.style.display = 'block';
    }
});