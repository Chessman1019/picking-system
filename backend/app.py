from flask import Flask, send_from_directory
from flask_cors import CORS
from config import Config
from extensions import db
from routes import auth_routes, trabajador_routes, admin_routes
import os

def create_app():
    app = Flask(__name__, static_folder='../frontend', static_url_path='')
    app.config.from_object(Config)

    # 🔥 CORS
    CORS(app, origins=Config.CORS_ORIGINS)

    # 🔌 DB
    db.init_app(app)

    # 🔥 CREAR TABLAS (PROTEGIDO)
    with app.app_context():
        try:
            db.create_all()
            print("✅ Base de datos conectada")

            # ⚠️ YA NO creamos usuarios automáticamente
            # Los usuarios ya están cargados desde Aiven
            from models.usuario import Usuario
            
            admin_exists = Usuario.query.filter_by(rol='admin').first()
            if not admin_exists:
                print("⚠️ No hay administrador en la BD. Agrega uno manualmente.")
            else:
                print(f"✅ Administrador encontrado: {admin_exists.nombre}")

        except Exception as e:
            print("❌ Error conectando a la BD:", e)

    # 📌 BLUEPRINTS
    app.register_blueprint(auth_routes.bp)
    app.register_blueprint(trabajador_routes.bp)
    app.register_blueprint(admin_routes.bp)

    # 🌐 RUTA TEST (IMPORTANTE PARA DEPLOY)
    @app.route('/test')
    def test():
        return "API funcionando correctamente 🚀"

    # 🌐 FRONTEND
    @app.route('/')
    def serve_index():
        return send_from_directory(app.static_folder, 'index.html')

    @app.route('/<path:path>')
    def serve_static(path):
        return send_from_directory(app.static_folder, path)

    return app


# 🔥 PARA GUNICORN (CLAVE)
app = create_app()


# 🔧 SOLO PARA LOCAL
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)