from flask import Blueprint, request, jsonify
from extensions import db
from models.registro import Registro
from models.usuario import Usuario
from datetime import datetime

bp = Blueprint('admin', __name__, url_prefix='/api/admin')

@bp.route('/reportes', methods=['GET'])
def get_reportes():
    fecha = request.args.get('fecha')
    trabajador_id = request.args.get('trabajador_id')
    
    query = db.session.query(Registro, Usuario).join(
        Usuario, Registro.usuario_id == Usuario.id
    )
    
    if fecha:
        query = query.filter(Registro.fecha == fecha)
    
    if trabajador_id:
        query = query.filter(Registro.usuario_id == trabajador_id)
    
    query = query.order_by(Registro.fecha.desc(), Registro.hora_inicio.desc())
    resultados = query.all()
    
    reportes = []
    
    for registro, usuario in resultados:
        tiempo_total = None
        duracion_horas = 0
        duracion_segundos = 0
        
        if registro.hora_fin:
            delta = registro.hora_fin - registro.hora_inicio
            duracion_segundos = int(delta.total_seconds())
            
            # Cálculo de horas, minutos, segundos
            horas = duracion_segundos // 3600
            minutos = (duracion_segundos % 3600) // 60
            segs = duracion_segundos % 60
            
            tiempo_total = f"{horas}h {minutos}m {segs}s"
            duracion_horas = duracion_segundos / 3600
        else:
            tiempo_total = "En curso"
        
        reportes.append({
            'trabajador': usuario.nombre,
            'dni': usuario.dni,
            'fecha': registro.fecha.strftime('%Y-%m-%d'),
            'hora_inicio': registro.hora_inicio.strftime('%H:%M:%S'),
            'hora_fin': registro.hora_fin.strftime('%H:%M:%S') if registro.hora_fin else None,
            'tiempo_total': tiempo_total,
            'duracion_horas': round(duracion_horas, 2),
            'duracion_segundos': duracion_segundos
        })
    
    return jsonify(reportes)

@bp.route('/trabajadores', methods=['GET'])
def get_trabajadores():
    trabajadores = Usuario.query.filter_by(rol='trabajador').all()
    return jsonify([{
        'id': t.id,
        'nombre': t.nombre,
        'dni': t.dni
    } for t in trabajadores])

@bp.route('/estadisticas', methods=['GET'])
def get_estadisticas():
    fecha = request.args.get('fecha', datetime.now().strftime('%Y-%m-%d'))
    
    # Obtener todos los registros de la fecha
    registros = Registro.query.filter_by(fecha=fecha).all()
    
    trabajadores_activos = len([r for r in registros if r.hora_fin is None])
    total_registros = len(registros)
    
    horas_totales = 0
    for r in registros:
        if r.duracion_segundos:
            horas_totales += r.duracion_segundos / 3600
    
    return jsonify({
        'fecha': fecha,
        'trabajadores_activos': trabajadores_activos,
        'total_registros': total_registros,
        'horas_totales': round(horas_totales, 2),
        'promedio_horas': round(horas_totales / total_registros if total_registros > 0 else 0, 2)
    })