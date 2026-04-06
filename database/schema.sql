-- Crear tabla de usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    dni VARCHAR(20) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    rol VARCHAR(20) NOT NULL DEFAULT 'trabajador',
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de registros
CREATE TABLE IF NOT EXISTS registros (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    hora_inicio TIMESTAMP NOT NULL,
    hora_fin TIMESTAMP,
    duracion_segundos INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear índices para mejorar rendimiento
CREATE INDEX idx_registros_usuario_id ON registros(usuario_id);
CREATE INDEX idx_registros_fecha ON registros(fecha);
CREATE INDEX idx_registros_usuario_fecha ON registros(usuario_id, fecha);
CREATE INDEX idx_usuarios_dni ON usuarios(dni);

-- Insertar datos de prueba
INSERT INTO usuarios (dni, nombre, rol) VALUES 
('12345678', 'Trabajador Demo', 'trabajador'),
('87654321', 'Administrador Demo', 'admin')
ON CONFLICT (dni) DO NOTHING;

-- Insertar algunos registros de ejemplo
INSERT INTO registros (usuario_id, fecha, hora_inicio, hora_fin, duracion_segundos) 
SELECT 
    id,
    CURRENT_DATE,
    CURRENT_TIMESTAMP - INTERVAL '8 hours',
    CURRENT_TIMESTAMP,
    28800
FROM usuarios 
WHERE dni = '12345678'
ON CONFLICT DO NOTHING;