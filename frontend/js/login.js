const API_URL = 'https://picking-system-backend.onrender.com';

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
            sessionStorage.setItem('usuario', JSON.stringify(data.usuario));
            
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