-- Script para arreglar las fechas de las solicitudes existentes
-- Asigna fechas aleatorias de los últimos 6 meses (180 días)

UPDATE solicitudes
SET fecha_solicitud = (
    NOW() - (RANDOM() * INTERVAL '180 days')
)::timestamp
WHERE titulo LIKE 'Solicitud%'
  OR titulo LIKE 'Solicitud de prueba%';

-- Verificar el resultado
SELECT 
    COUNT(*) as total_actualizadas,
    MIN(fecha_solicitud) as fecha_mas_antigua,
    MAX(fecha_solicitud) as fecha_mas_reciente
FROM solicitudes
WHERE titulo LIKE 'Solicitud%' OR titulo LIKE 'Solicitud de prueba%';
