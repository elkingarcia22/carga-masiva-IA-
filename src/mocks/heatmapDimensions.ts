/**
 * Heatmap Dimensions Mock Data
 * Fase 5E - Vista Heatmap en tab Dimensiones
 */

export interface HeatmapCell {
  delta: number; // delta en pp (puntos porcentuales)
  n: number; // tamaño de muestra
  status?: 'private' | 'low_n'; // estados especiales
}

export interface HeatmapDimension {
  id: string;
  name: string;
  segments: Record<string, HeatmapCell>;
}

export interface HeatmapSegment {
  id: string;
  label: string;
}

// Segmentos disponibles
export const SEGMENTS_BY_TYPE: Record<string, HeatmapSegment[]> = {
  'Área': [
    { id: 'ventas', label: 'Ventas' },
    { id: 'marketing', label: 'Marketing' },
    { id: 'tecnologia', label: 'Tecnología' },
    { id: 'producto', label: 'Producto' },
    { id: 'rrhh', label: 'RRHH' },
    { id: 'finanzas', label: 'Finanzas' },
    { id: 'soporte', label: 'Soporte' },
    { id: 'operaciones', label: 'Operaciones' },
  ],
  'Líder': [
    { id: 'juan', label: 'Juan P.' },
    { id: 'ana', label: 'Ana M.' },
    { id: 'carlos', label: 'Carlos R.' },
    { id: 'laura', label: 'Laura G.' },
  ],
  'País': [
    { id: 'col', label: 'Colombia' },
    { id: 'mex', label: 'México' },
    { id: 'per', label: 'Perú' },
    { id: 'chi', label: 'Chile' },
  ],
  'Ciudad': [
    { id: 'bog', label: 'Bogotá' },
    { id: 'med', label: 'Medellín' },
    { id: 'cdmx', label: 'CDMX' },
    { id: 'lim', label: 'Lima' },
  ],
  'Sexo': [
    { id: 'm', label: 'Hombre' },
    { id: 'f', label: 'Mujer' },
    { id: 'o', label: 'Otro' },
    { id: 'na', label: 'Prefiero no decir' },
  ],
  'Columna A': [
    { id: 'a1', label: 'Opción A1' },
    { id: 'a2', label: 'Opción A2' },
    { id: 'a3', label: 'Opción A3' },
  ],
  'Columna B': [
    { id: 'b1', label: 'Opción B1' },
    { id: 'b2', label: 'Opción B2' },
  ],
  'Rol': [
    { id: 'ic', label: 'Individual Contributor' },
    { id: 'mgr', label: 'Manager' },
    { id: 'sr_mgr', label: 'Senior Manager' },
    { id: 'dir', label: 'Director' },
  ]
};

// We will generate the cell data dynamically based on the requested segment type
// so that the UI can show data without having to hardcode hundreds of cells.
export function getHeatmapData(segmentType: string): { segments: HeatmapSegment[], data: HeatmapDimension[] } {
  const segments = SEGMENTS_BY_TYPE[segmentType] || SEGMENTS_BY_TYPE['Área'];
  
  const baseDimensions = [
    { id: 'dim-1', name: 'Liderazgo' },
    { id: 'dim-2', name: 'Reconocimiento' },
    { id: 'dim-3', name: 'Comunicación' },
    { id: 'dim-4', name: 'Cultura' },
    { id: 'dim-5', name: 'Desarrollo' },
    { id: 'dim-6', name: 'Bienestar' },
    { id: 'dim-7', name: 'Carga laboral' },
    { id: 'dim-8', name: 'Pertenencia' },
  ];

  const data: HeatmapDimension[] = baseDimensions.map((dim, dimIdx) => {
    const segmentsData: Record<string, HeatmapCell> = {};
    segments.forEach((seg, segIdx) => {
      // Create some deterministic but varied data based on dimension and segment
      const hash = (dimIdx * 7) + (segIdx * 11) + segmentType.length;
      let delta = (hash % 25) - 12; // -12 to +12
      let n = 20 + (hash % 150);
      let status: 'private' | 'low_n' | undefined = undefined;

      if (n < 25 && hash % 3 === 0) {
        n = 3;
        status = 'low_n';
      } else if (hash % 13 === 0) {
        status = 'private';
      }

      segmentsData[seg.id] = { delta, n, status };
    });

    return {
      id: dim.id,
      name: dim.name,
      segments: segmentsData
    };
  });

  return { segments, data };
}

// Para compatibilidad previa
export const HEATMAP_SEGMENTS = SEGMENTS_BY_TYPE['Área'];
export const HEATMAP_DIMENSIONS_DATA = getHeatmapData('Área').data;

// Soft semantic colors — semi-transparent for readability
export function getHeatmapTone(delta: number, status?: string): string {
  if (status === 'private') return 'heatmap-private';
  if (status === 'low_n') return 'heatmap-low-n';
  
  // 'Sin variación' state for Cultura
  if (Math.abs(delta) < 0.1) return 'bg-[#F1F5F9] border-[#CBD5E1] text-[#64748B]';

  if (delta <= -5) return 'heatmap-negative-strong';
  if (delta >= -4 && delta <= -1) return 'heatmap-negative-light';
  if (delta >= 1 && delta <= 4) return 'heatmap-positive-light';
  if (delta >= 5) return 'heatmap-positive-strong';
  
  return 'heatmap-neutral';
}

// Función para formatear el delta
export function formatDelta(delta: number): string {
  if (Math.abs(delta) < 0.1) return '';
  if (delta > 0) return `+${delta}pp`;
  return `${delta}pp`;
}
