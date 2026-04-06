from extensions import db
from datetime import datetime

class Registro(db.Model):
    __tablename__ = 'registros'
    
    id = db.Column(db.Integer, primary_key=True)
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuarios.id'), nullable=False, index=True)
    fecha = db.Column(db.Date, nullable=False, default=datetime.utcnow().date)
    hora_inicio = db.Column(db.DateTime, nullable=False)
    hora_fin = db.Column(db.DateTime, nullable=True)
    duracion_segundos = db.Column(db.Integer, nullable=True)
    
    __table_args__ = (
        db.Index('idx_usuario_fecha', 'usuario_id', 'fecha'),
    )
    
    def calcular_duracion(self):
        if self.hora_fin:
            delta = self.hora_fin - self.hora_inicio
            self.duracion_segundos = int(delta.total_seconds())
            return self.duracion_segundos
        return None
    
    def to_dict(self):
        tiempo_total = None
        if self.hora_fin:
            delta = self.hora_fin - self.hora_inicio
            horas = delta.total_seconds() / 3600
            tiempo_total = f"{horas:.2f}h"
        
        return {
            'id': self.id,
            'usuario_id': self.usuario_id,
            'fecha': self.fecha.isoformat(),
            'hora_inicio': self.hora_inicio.strftime('%H:%M:%S'),
            'hora_fin': self.hora_fin.strftime('%H:%M:%S') if self.hora_fin else None,
            'tiempo_total': tiempo_total,
            'duracion_segundos': self.duracion_segundos
        }