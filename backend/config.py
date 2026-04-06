import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'clave-super-segura')

    # 🔥 DATABASE URL DESDE RENDER (PRINCIPAL)
    DATABASE_URL = os.environ.get('DATABASE_URL')

    if DATABASE_URL:
        # ✅ FIX CRÍTICO para PostgreSQL
        if DATABASE_URL.startswith("postgres://"):
            DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
    else:
        # 🔧 FALLBACK LOCAL (solo desarrollo)
        DB_HOST = os.environ.get('DB_HOST', 'localhost')
        DB_PORT = os.environ.get('DB_PORT', '5432')
        DB_USER = os.environ.get('DB_USER', 'postgres')
        DB_PASSWORD = os.environ.get('DB_PASSWORD', '')
        DB_NAME = os.environ.get('DB_NAME', 'picking_system')

        DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

    SQLALCHEMY_DATABASE_URI = DATABASE_URL
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # 🔥 CONFIG PRO PARA PRODUCCIÓN
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_pre_ping": True,
        "pool_recycle": 300,
    }

    # 🌐 CORS
    CORS_ORIGINS = os.environ.get(
        'CORS_ORIGINS',
        'http://localhost:5000'
    ).split(',')