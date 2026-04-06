import psycopg2
import os
from dotenv import load_dotenv

# Cargar variables de entorno desde .env
load_dotenv()

# Obtener la URL de la base de datos
DATABASE_URL = os.environ.get('DATABASE_URL')

print("🔌 Conectando a la base de datos...")

# Conectar a PostgreSQL
conn = psycopg2.connect(DATABASE_URL)
cursor = conn.cursor()

# ============================================
# 1. Eliminar usuarios viejos (demo)
# ============================================
print("🗑️ Eliminando usuarios viejos...")
cursor.execute("DELETE FROM registros WHERE usuario_id IN (SELECT id FROM usuarios WHERE dni IN ('admin123', '12345678'));")
cursor.execute("DELETE FROM usuarios WHERE dni IN ('admin123', '12345678');")

# ============================================
# 2. Crear nuevo administrador
# ============================================
print("👑 Creando administrador...")
cursor.execute("""
    INSERT INTO usuarios (dni, nombre, rol) VALUES 
    ('75858913', 'Jimmy Lino', 'admin')
    ON CONFLICT (dni) DO NOTHING;
""")

# ============================================
# 3. Crear trabajadores
# ============================================
print("👥 Creando trabajadores...")
trabajadores = [
    ('74718203', 'Kevin Antonio Phocco Peña'),
    ('71793623', 'Anderson Antonio Huere Michue'),
    ('75072772', 'Luis Francisco Guimaraes Mozombite'),
    ('72802551', 'Pedro Alexander Yupanqui Salvador'),
    ('75877640', 'Rudi Tone Ochoa'),
    ('76631381', 'Elder Pomatanta Leon'),
    ('74775969', 'Rem Estefano Levano Pinto'),
    ('76361666', 'Esteban Nicolas Arenas Tolentino'),
    ('74743310', 'Jesus Pascual Retuerto Campomanes'),
    ('73260230', 'Abel Israel Villareal Sosa'),
    ('70239105', 'Andres Rivera Ambiajuan'),
    ('74239684', 'Carlos Alberto Giraldo Camacho'),
    ('73359956', 'Willy Jhonatan Diaz Perez'),
    ('76357400', 'Jordy Roger Tone Ochoa')
]

for dni, nombre in trabajadores:
    cursor.execute("""
        INSERT INTO usuarios (dni, nombre, rol) VALUES (%s, %s, 'trabajador')
        ON CONFLICT (dni) DO NOTHING;
    """, (dni, nombre))

# Guardar cambios
conn.commit()

# ============================================
# 4. Verificar usuarios registrados
# ============================================
print("\n📋 USUARIOS REGISTRADOS:")
print("-" * 60)
cursor.execute("SELECT id, dni, nombre, rol FROM usuarios ORDER BY rol, nombre;")
for row in cursor.fetchall():
    print(f"ID: {row[0]} | DNI: {row[1]} | Nombre: {row[2]} | Rol: {row[3]}")

# Cerrar conexión
cursor.close()
conn.close()

print("\n✅ Base de datos actualizada correctamente")