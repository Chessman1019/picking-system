from extensions import db
from models.registro import Registro
from datetime import datetime, date

class RegistroService:
    
    @staticmethod
    def iniciar_picking(usuario_id):
        hoy = date.today()
        registro_activo = Registro.query.filter_by(
            usuario_id=usuario_id,
            fecha=hoy,
            hora_fin=None
        ).first()
        
        if registro_activo:
            return None, "Ya tiene un picking activo hoy"
        
        registro = Registro(
            usuario_id=usuario_id,
            fecha=hoy,
            hora_inicio=datetime.now()
        )
        
        db.session.add(registro)
        db.session.commit()
        
        return registro, "Picking iniciado correctamente"
    
    @staticmethod
    def finalizar_picking(usuario_id):
        hoy = date.today()
        registro = Registro.query.filter_by(
            usuario_id=usuario_id,
            fecha=hoy,
            hora_fin=None
        ).first()
        
        if not registro:
            return None, "No hay picking activo"
        
        registro.hora_fin = datetime.now()
        registro.calcular_duracion()
        db.session.commit()
        
        return registro, "Picking finalizado correctamente"