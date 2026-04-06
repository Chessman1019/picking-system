from flask import Blueprint, request, jsonify
from extensions import db
from models.usuario import Usuario
from models.registro import Registro
from datetime import datetime, date

bp = Blueprint('trabajador', __name__, url_prefix='/api/trabajador')

@bp.route('/iniciar', methods=['POST'])
def iniciar_picking():
    data = request.get_json()
    usuario_id = data.get('usuario_id')
    
    if not usuario_id:
        return jsonify({'error': 'Usuario ID requerido'}), 400
    
    usuario = Usuario.query.get(usuario_id)
    if not usuario:
        return jsonify({'error': 'Usuario no encontrado'}), 404
    
    # Verificar si ya tiene un registro activo hoy
    hoy = date.today()
    registro_activo = Registro.query.filter_by(
        usuario_id=usuario_id,
        fecha=hoy,
        hora_fin=None
    ).first()
    
    if registro_activo:
        return jsonify({'error': 'Ya tienes un picking activo hoy'}), 400
    
    # Crear nuevo registro
    registro = Registro(
        usuario_id=usuario_id,
        fecha=hoy,
        hora_inicio=datetime.now()
    )
    
    db.session.add(registro)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'mensaje': 'Picking iniciado correctamente',
        'registro': registro.to_dict()
    })

@bp.route('/finalizar', methods=['POST'])
def finalizar_picking():
    data = request.get_json()
    usuario_id = data.get('usuario_id')
    
    if not usuario_id:
        return jsonify({'error': 'Usuario ID requerido'}), 400
    
    # Buscar registro activo
    hoy = date.today()
    registro = Registro.query.filter_by(
        usuario_id=usuario_id,
        fecha=hoy,
        hora_fin=None
    ).first()
    
    if not registro:
        return jsonify({'error': 'No hay un picking activo para finalizar'}), 404
    
    # Finalizar registro
    registro.hora_fin = datetime.now()
    registro.calcular_duracion()
    db.session.commit()
    
    return jsonify({
        'success': True,
        'mensaje': 'Picking finalizado correctamente',
        'registro': registro.to_dict()
    })
@bp.route('/historial/<int:usuario_id>', methods=['GET'])
def get_historial(usuario_id):
    registros = Registro.query.filter_by(usuario_id=usuario_id)\
                              .order_by(Registro.fecha.desc()).all()

    historial = []
    for reg in registros:
        tiempo_total = None
        if reg.hora_fin:
            delta = reg.hora_fin - reg.hora_inicio
            segundos = int(delta.total_seconds())
            horas = segundos // 3600
            minutos = (segundos % 3600) // 60
            segs = segundos % 60
            tiempo_total = f"{horas}h {minutos}m {segs}s"

        historial.append({
            'fecha': reg.fecha.strftime('%d/%m/%Y'),
            'hora_inicio': reg.hora_inicio.strftime('%I:%M:%S %p'),
            'hora_fin': reg.hora_fin.strftime('%I:%M:%S %p') if reg.hora_fin else '—',
            'tiempo_total': tiempo_total or 'En curso'
        })

    return jsonify({'historial': historial})

@bp.route('/estado/<int:usuario_id>', methods=['GET'])
def estado_picking(usuario_id):
    hoy = date.today()
    registro_activo = Registro.query.filter_by(
        usuario_id=usuario_id,
        fecha=hoy,
        hora_fin=None
    ).first()
    
    # Obtener último registro
    ultimo_registro = Registro.query.filter_by(
        usuario_id=usuario_id
    ).order_by(Registro.fecha.desc()).first()
    
    return jsonify({
        'activo': registro_activo is not None,
        'registro_activo': registro_activo.to_dict() if registro_activo else None,
        'ultimo_registro': ultimo_registro.to_dict() if ultimo_registro else None
    })