from flask import Blueprint, request, jsonify
from extensions import db
from models.usuario import Usuario

bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    dni = data.get('dni')
    
    if not dni:
        return jsonify({'error': 'DNI requerido'}), 400
    
    usuario = Usuario.query.filter_by(dni=dni).first()
    
    if not usuario:
        return jsonify({'error': 'Usuario no encontrado'}), 404
    
    return jsonify({
        'success': True,
        'usuario': usuario.to_dict()
    })