from functools import wraps
from flask import jsonify
from datetime import datetime

def formato_fecha(fecha):
    """Convertir fecha a string formato YYYY-MM-DD"""
    if isinstance(fecha, datetime):
        return fecha.strftime('%Y-%m-%d')
    return fecha

def formato_hora(hora):
    """Convertir hora a string formato HH:MM:SS"""
    if isinstance(hora, datetime):
        return hora.strftime('%H:%M:%S')
    return hora

def calcular_tiempo_trabajado(segundos):
    """Convertir segundos a formato legible"""
    horas = segundos // 3600
    minutos = (segundos % 3600) // 60
    seg = segundos % 60
    return f"{horas:02d}:{minutos:02d}:{seg:02d}"