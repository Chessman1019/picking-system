from flask import Flask, send_from_directory
from flask_cors import CORS
from config import Config
from extensions import db
from routes import auth_routes, trabajador_routes, admin_routes
import os

from flask import Flask, send_from_directory
from flask_cors import CORS
from config import Config
from extensions import db
from routes import auth_routes, trabajador_routes, admin_routes
import os

def create_app():
    app = Flask(__name__, static_folder='../frontend', static_url_path='')
    app.config.from_object(Config)
    
    # Configurar CORS
    CORS(app, origins=Config.CORS_ORIGINS)
    
    # Inicializar DB
    db.init_app(app)
    
    # Crear tablas si no existen
    with app.app_context():
        db.create_all()
        print("✅ Base de datos inicializada correctamente")
        
        # Crear usuario admin por defecto si no existe
        from models.usuario import Usuario
        admin = Usuario.query.filter_by(dni='admin123').first()
        if not admin:
            admin_user = Usuario(
                dni='admin123',
                nombre='Administrador',
                rol='admin'
            )
            db.session.add(admin_user)
            
            # Crear trabajador de prueba
            trabajador = Usuario(
                dni='12345678',
                nombre='Trabajador Demo',
                rol='trabajador'
            )
            db.session.add(trabajador)
            db.session.commit()
            print("✅ Usuarios de prueba creados")
    
    # Registrar blueprints
    app.register_blueprint(auth_routes.bp)
    app.register_blueprint(trabajador_routes.bp)
    app.register_blueprint(admin_routes.bp)
    
    # Servir frontend
    @app.route('/')
    def serve_index():
        return send_from_directory(app.static_folder, 'index.html')
    
    @app.route('/<path:path>')
    def serve_static(path):
        return send_from_directory(app.static_folder, path)
    
    return app

# 👇 ESTO ES LO NUEVO - La aplicación para Gunicorn 👇
app = create_app()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)