/**
 * Genera los archivos de muestra para la demo de carga masiva de objetivos.
 *
 * Uso:  node scripts/generate-objetivos-samples.cjs
 * Salida: carpeta demo-samples/objetivos/ en la raíz del repo.
 *
 * La estructura de cada hoja replica la plantilla oficial de UBITS
 * (create-goals-template.xlsx), incluidas sus validaciones de lista y el orden
 * real de columnas — que en "crear" pone cumplimiento_maximo ANTES de
 * cumplimiento_minimo. Los archivos se parsean de verdad en la app; nada aquí
 * depende del nombre del archivo.
 *
 * Los usernames coinciden con el roster de src/mocks/objetivosMocks.ts
 * (SEEDED_ASSIGNED_USERS) para que el match contra el ciclo sea real. Si editas
 * uno, edita el otro.
 */
const fs = require("fs");
const path = require("path");
const XLSX = require(path.join(__dirname, "..", "node_modules", "xlsx"));

const OUT = path.join(__dirname, "..", "demo-samples", "objetivos");
fs.mkdirSync(OUT, { recursive: true });

/** Cabecera exacta de la plantilla de creación de objetivos. */
const CREATE_HEADER = [
  "username",
  "nombre_objetivo",
  "peso",
  "tipo_medida",
  "aumentar_reducir",
  "valor_inicial",
  "cumplimiento_maximo",
  "cumplimiento_minimo",
  "meta",
  "descripcion_meta",
];

/**
 * Cabecera exacta de la plantilla de EDICIÓN de objetivos.
 *
 * Dos diferencias reales con la de creación, y las dos importan:
 *  - Trae `nombre_objetivo_nuevo`: `nombre_objetivo` deja de ser un título y pasa
 *    a ser el criterio de búsqueda contra lo que ya existe en UBITS.
 *  - Los topes van al revés (`minimo` antes de `maximo`). El parser ubica las
 *    columnas por nombre justamente por esto.
 */
const EDIT_HEADER = [
  "username",
  "nombre_objetivo",
  "nombre_objetivo_nuevo",
  "peso",
  "tipo_medida",
  "aumentar_reducir",
  "valor_inicial",
  "cumplimiento_minimo",
  "cumplimiento_maximo",
  "meta",
  "descripcion_meta",
];

/**
 * Cabecera de la plantilla de ACTUALIZACIÓN de avances.
 *
 * La más corta de las tres, y la única en la que casi ninguna columna se
 * escribe. Solo `nuevo_avance` entra a UBITS; las otras tres numéricas salen de
 * UBITS y vuelven tal cual.
 *
 * Están porque un avance suelto no se puede revisar. "38" no dice nada; "38,
 * cuando la meta es 40 y venía de 62" se lee de un vistazo, y quien llena el
 * archivo necesita ese contexto tanto como quien lo revisa después. `peso`,
 * `tipo_medida` y los topes no viajan: no hacen falta para decidir el número y
 * cada columna de más es una que alguien puede editar por error creyendo que
 * sirve de algo.
 *
 * `avance_actual` además se compara contra lo que UBITS tiene hoy. Si no
 * coinciden, el archivo salió de un export que ya quedó viejo — que es el
 * accidente típico de este flujo: exportar el lunes y subirlo el viernes.
 */
const PROGRESS_HEADER = [
  "username",
  "nombre_objetivo",
  "valor_inicial",
  "meta",
  "avance_actual",
  "nuevo_avance",
];
/**
 * Objetivos del happy path.
 *
 * Ocho usuarios con match exacto y pesos que suman 100%, sin una sola violación
 * de regla: el archivo entra limpio y los ocho caen en **Alineados**.
 *
 * La cobertura está repartida a propósito para que un solo archivo ejercite toda
 * la matriz de casos de un objetivo:
 *
 *  - Los 4 tipos de medida y las 2 direcciones.
 *  - Con valor inicial (R6a) y sin valor inicial (R6b-1 / R6c-1).
 *  - Metas NEGATIVAS con y sin inicial, que son las que disparan R6b-2 y R6c-2
 *    (sin inicial, el sistema asume una referencia igual al doble de la meta).
 *  - Con mínimo y máximo, con solo uno de los dos, y sin topes.
 *  - Match por nickname, por correo y por documento; usuarios del ciclo y
 *    usuarios que existen en UBITS pero todavía no están en el ciclo.
 *  - Un aviso R4 ámbar que NO bloquea, para ver la diferencia con un error.
 */
const HAPPY_PATH = [
  // 1 · Cursos Empresariales 3099 - Prueba QA · match por correo, en el ciclo
  {
    username: "usercreadorqa@example.co",
    rows: [
      {
        nombre: "Aumentar la facturación de cuentas nuevas",
        peso: 30, medida: "Dinero", direccion: "Aumentar",
        inicial: 120000000, maximo: 260000000, minimo: 160000000, meta: 220000000,
        descripcion: "Ingresos cerrados de cuentas que no facturaban en 2025.",
      },
      {
        nombre: "Mejorar la tasa de renovación de contratos",
        peso: 25, medida: "Porcentaje", direccion: "Aumentar",
        inicial: 78, maximo: 96, minimo: 85, meta: 92,
        descripcion: "Renovaciones firmadas sobre contratos que vencen en el ciclo.",
      },
      {
        nombre: "Reducir el ciclo de venta promedio",
        peso: 25, medida: "Numérico", direccion: "Reducir",
        inicial: 74, maximo: 38, minimo: 60, meta: 45,
        descripcion: "Días entre el primer contacto y la firma.",
      },
      {
        nombre: "Certificar al equipo comercial en la nueva metodología",
        peso: 20, medida: "Se cumple / No se cumple", direccion: "Aumentar",
        inicial: 0, maximo: "", minimo: "", meta: 1,
        descripcion: "Se cumple cuando el 100% del equipo aprueba la certificación.",
      },
    ],
  },

  // 2 · marta forero · nickname, en el ciclo · filas SIN valor inicial (R6b-1)
  {
    username: "martica",
    rows: [
      {
        nombre: "Cerrar el plan de formación del equipo",
        peso: 30, medida: "Porcentaje", direccion: "Aumentar",
        inicial: "", maximo: "", minimo: "", meta: 100,
        descripcion: "Sin valor inicial: el sistema asume 0 (R6b-1).",
      },
      {
        nombre: "Reducir la rotación voluntaria del área",
        peso: 25, medida: "Porcentaje", direccion: "Reducir",
        inicial: 18.5, maximo: 7, minimo: 15, meta: 12,
        descripcion: "Salidas voluntarias sobre la nómina promedio del ciclo.",
      },
      {
        nombre: "Contratar los perfiles críticos del roadmap",
        peso: 25, medida: "Numérico", direccion: "Aumentar",
        inicial: "", maximo: "", minimo: "", meta: 9,
        descripcion: "Vacantes críticas cerradas. Sin inicial (R6b-1).",
      },
      {
        nombre: "Publicar la política de trabajo híbrido",
        peso: 20, medida: "Se cumple / No se cumple", direccion: "Aumentar",
        inicial: 0, maximo: "", minimo: "", meta: 1,
        descripcion: "Se cumple con la política publicada y comunicada.",
      },
    ],
  },

  // 3 · Alejandro Ramírez · en el ciclo · solo mínimo / solo máximo
  {
    username: "surveys19",
    rows: [
      {
        nombre: "Bajar el costo por adquisición de cliente",
        peso: 40, medida: "Dinero", direccion: "Reducir",
        inicial: 480000, maximo: "", minimo: 400000, meta: 360000,
        descripcion: "Solo mínimo definido: sin techo de cumplimiento.",
      },
      {
        nombre: "Incrementar las oportunidades calificadas del trimestre",
        peso: 35, medida: "Numérico", direccion: "Aumentar",
        inicial: 64, maximo: 130, minimo: "", meta: 110,
        descripcion: "Solo máximo definido: sin piso de cumplimiento.",
      },
      {
        nombre: "Subir la satisfacción del proceso de venta",
        peso: 25, medida: "Porcentaje", direccion: "Aumentar",
        inicial: 71, maximo: 95, minimo: 80, meta: 88,
        descripcion: "Encuesta post-venta a clientes cerrados.",
      },
    ],
  },

  // 4 · Cristian Rincón · en el ciclo · metas NEGATIVAS con valor inicial
  {
    username: "crrincon@example.co",
    rows: [
      {
        nombre: "Mejorar el resultado operativo de la unidad",
        peso: 40, medida: "Dinero", direccion: "Aumentar",
        inicial: -520000000, maximo: "", minimo: "", meta: -180000000,
        descripcion: "Meta negativa con inicial: sigue siendo R6a, solo cambia el signo.",
      },
      {
        nombre: "Reducir la desviación presupuestal acumulada",
        peso: 35, medida: "Porcentaje", direccion: "Reducir",
        inicial: -4, maximo: "", minimo: "", meta: -12,
        descripcion: "Ambos valores negativos, recorridos en dirección descendente.",
      },
      {
        nombre: "Migrar el reporte financiero al nuevo tablero",
        peso: 25, medida: "Se cumple / No se cumple", direccion: "Aumentar",
        inicial: 0, maximo: "", minimo: "", meta: 1,
        descripcion: "Se cumple cuando el tablero reemplaza al reporte manual.",
      },
    ],
  },

  // 5 · prueba hhhhh objetivos · en el ciclo · metas NEGATIVAS SIN inicial
  {
    username: "pobjetivos",
    rows: [
      {
        nombre: "Llevar el EBITDA de la línea a terreno menos negativo",
        peso: 35, medida: "Dinero", direccion: "Aumentar",
        inicial: "", maximo: "", minimo: "", meta: -150000000,
        descripcion: "Sin inicial + Aumentar + meta negativa: R6b-2 (referencia = 2 × meta).",
      },
      {
        nombre: "Llevar el balance de mermas a negativo",
        peso: 35, medida: "Numérico", direccion: "Reducir",
        inicial: "", maximo: "", minimo: "", meta: -240,
        descripcion: "Sin inicial + Reducir + meta negativa: R6c-2 (el sistema asume inicial 0).",
      },
      {
        nombre: "Documentar los procesos críticos del área",
        peso: 30, medida: "Numérico", direccion: "Aumentar",
        inicial: 2, maximo: 12, minimo: 6, meta: 10,
        descripcion: "Procesos con manual publicado y aprobado.",
      },
    ],
  },

  // 6 · Jorge Lopez · en el ciclo · incluye un AVISO R4 que no bloquea
  {
    username: "jlopezsincrorolesypermisos01@example.co",
    rows: [
      {
        nombre: "Aumentar la disponibilidad de la plataforma",
        peso: 40, medida: "Porcentaje", direccion: "Aumentar",
        inicial: 97.2, maximo: 99.95, minimo: 99.8, meta: 99.5,
        descripcion: "Mínimo por encima de la meta: aviso R4 ámbar, no bloquea la carga.",
      },
      {
        nombre: "Reducir los incidentes críticos en producción",
        peso: 35, medida: "Numérico", direccion: "Reducir",
        inicial: 18, maximo: 3, minimo: 12, meta: 8,
        descripcion: "Incidentes con severidad 1 en el ciclo.",
      },
      {
        nombre: "Reducir la deuda técnica priorizada",
        peso: 25, medida: "Porcentaje", direccion: "Reducir",
        inicial: 42, maximo: 10, minimo: 30, meta: 20,
        descripcion: "Ítems del backlog técnico cerrados sobre el total priorizado.",
      },
    ],
  },

  // 7 · Laura Gómez Ríos · existe en UBITS pero NO en el ciclo (match por correo)
  {
    username: "lgomez@example.co",
    rows: [
      {
        nombre: "Abrir la operación comercial en dos ciudades nuevas",
        peso: 45, medida: "Numérico", direccion: "Aumentar",
        inicial: 0, maximo: "", minimo: "", meta: 2,
        descripcion: "Usuario nuevo en el ciclo: se agrega junto con sus objetivos.",
      },
      {
        nombre: "Subir el ticket promedio de la región",
        peso: 30, medida: "Dinero", direccion: "Aumentar",
        inicial: 1850000, maximo: 2600000, minimo: 2000000, meta: 2300000,
        descripcion: "Ticket promedio de las cuentas de la región.",
      },
      {
        nombre: "Reducir la cartera vencida a más de 60 días",
        peso: 25, medida: "Porcentaje", direccion: "Reducir",
        inicial: 14.5, maximo: 3, minimo: 10, meta: 6,
        descripcion: "Cartera vencida sobre la cartera total.",
      },
    ],
  },

  // 8 · Andrés Beltrán Cano · match por DOCUMENTO, no está en el ciclo
  {
    username: "1032456789",
    rows: [
      {
        nombre: "Automatizar el cierre de inventario mensual",
        peso: 40, medida: "Numérico", direccion: "Reducir",
        inicial: 9, maximo: 2, minimo: 6, meta: 4,
        descripcion: "Días hábiles entre el cierre de mes y el inventario firmado.",
      },
      {
        nombre: "Subir la exactitud del inventario",
        peso: 35, medida: "Porcentaje", direccion: "Aumentar",
        inicial: 91, maximo: 99.5, minimo: 96, meta: 98,
        descripcion: "Unidades contadas que coinciden con el sistema.",
      },
      {
        nombre: "Implementar el conteo cíclico en las tres bodegas",
        peso: 25, medida: "Se cumple / No se cumple", direccion: "Aumentar",
        inicial: 0, maximo: "", minimo: "", meta: 1,
        descripcion: "Se cumple con el conteo cíclico operando en las tres bodegas.",
      },
    ],
  },
];

/** Título de 174 caracteres, para disparar TITULO_MAX (límite 150). */
const TITULO_LARGO =
  "Aumentar de forma sostenida la participación de mercado de la línea de consumo masivo en los canales tradicional y moderno de las cinco regiones prioritarias durante el ciclo";

/**
 * Caso 2 — los tres estados de la revisión, con volumen suficiente para ver
 * cada variante dentro de cada pestaña.
 *
 * ALINEADOS — las únicas dos formas de un match confirmado, porque UBITS solo
 * identifica a una persona por su username o su correo:
 *   `martica` nickname · `crrincon@example.co` correo=username ·
 *   `surveys19@example.co` correo cuando el username es otro.
 *
 * Los dos documentos (`1032456789` y `52487931`) caen a POSIBLE ALINEACIÓN a
 * propósito: el documento identifica a la persona en la vida real, pero no es
 * con lo que UBITS la reconoce, así que hay que confirmarlo.
 *
 * POSIBLES ASOCIACIONES — todo lo que solo se puede PROPONER, porque el dato
 * que trae el archivo no identifica a una única persona:
 *   `Cristian Rincon` NOMBRE sin tilde (el caso más común: dos personas pueden
 *   llamarse igual) · `3004419978` TELÉFONO de Natalia (los números cambian de
 *   dueño) · `802345711` documento de Ricardo con un dígito extra ·
 *   `martica@gmail.com` mismo local part que un nickname (duplica a marta forero
 *   a propósito, para ver el aviso "Usuario repetido") ·
 *   `natalia.vargas` local part del correo de Natalia.
 *
 * SIN ALINEAR — sin nada que proponer, hay que elegir a mano o crear el usuario:
 *   `desconocido.persona@example.co`.
 *
 * CON ERRORES (6) — una violación distinta por usuario:
 *   `pobjetivos` R1 + R3 y pesos al 80% · `ctorres` R2 y pesos al 120% ·
 *   `usercreadorqa@example.co` R0b + PESO_MIN · `dcastano@example.co` TITULO_MAX ·
 *   `camila.rojas@proveedor-externo.com` sin usuario en UBITS **y además** R1 con
 *   pesos al 85%, que es el caso mezclado: la tarjeta tiene que reportar los dos
 *   bloqueos en un solo contador "por corregir" ·
 *   `operacion.aliada@tercero-externo.com` los TRES bloqueos juntos: sin usuario,
 *   pesos al 130% (se pasan) y R3 en una de sus filas.
 */
const TRES_ESTADOS = [
  // ===== ALINEADOS ==========================================================
  {
    username: "martica",
    rows: [
      {
        nombre: "Cerrar el plan de formación del equipo",
        peso: 40, medida: "Porcentaje", direccion: "Aumentar",
        inicial: 0, maximo: "", minimo: "", meta: 100,
        descripcion: "Colaboradores que completan la ruta asignada.",
      },
      {
        nombre: "Reducir la rotación voluntaria del área",
        peso: 35, medida: "Porcentaje", direccion: "Reducir",
        inicial: 18.5, maximo: 7, minimo: 15, meta: 12,
        descripcion: "Salidas voluntarias sobre la nómina promedio del ciclo.",
      },
      {
        nombre: "Levantar el plan de sucesión de posiciones clave",
        peso: 25, medida: "Se cumple / No se cumple", direccion: "Aumentar",
        inicial: 0, maximo: "", minimo: "", meta: 1,
        descripcion: "Se cumple con el plan aprobado por el comité.",
      },
    ],
  },
  {
    username: "crrincon@example.co",
    rows: [
      {
        nombre: "Migrar los servicios críticos a la nueva nube",
        peso: 45, medida: "Porcentaje", direccion: "Aumentar",
        inicial: 20, maximo: 100, minimo: 70, meta: 90,
        descripcion: "Servicios migrados sobre el total del inventario crítico.",
      },
      {
        nombre: "Reducir el costo de infraestructura mensual",
        peso: 30, medida: "Dinero", direccion: "Reducir",
        inicial: 92000000, maximo: 60000000, minimo: 85000000, meta: 74000000,
        descripcion: "Factura mensual promedio del ciclo.",
      },
      {
        nombre: "Subir la cobertura de pruebas automatizadas",
        peso: 25, medida: "Porcentaje", direccion: "Aumentar",
        inicial: 46, maximo: 90, minimo: 65, meta: 80,
        descripcion: "Líneas cubiertas sobre el total del repositorio principal.",
      },
    ],
  },
  {
    // En UBITS su username es "surveys19"; el archivo lo nombra por su correo.
    username: "surveys19@example.co",
    rows: [
      {
        nombre: "Aumentar la conversión del embudo comercial",
        peso: 60, medida: "Porcentaje", direccion: "Aumentar",
        inicial: 12, maximo: 26, minimo: 18, meta: 22,
        descripcion: "Oportunidades ganadas sobre oportunidades creadas.",
      },
      {
        nombre: "Reducir el tiempo de primera respuesta a leads",
        peso: 40, medida: "Numérico", direccion: "Reducir",
        inicial: 36, maximo: 4, minimo: 24, meta: 12,
        descripcion: "Horas entre el registro del lead y el primer contacto.",
      },
    ],
  },
  {
    username: "1032456789",
    rows: [
      {
        nombre: "Automatizar el cierre de inventario mensual",
        peso: 55, medida: "Numérico", direccion: "Reducir",
        inicial: 9, maximo: 2, minimo: 6, meta: 4,
        descripcion: "Días hábiles entre el cierre de mes y el inventario firmado.",
      },
      {
        nombre: "Subir la exactitud del inventario",
        peso: 45, medida: "Porcentaje", direccion: "Aumentar",
        inicial: 91, maximo: 99.5, minimo: 96, meta: 98,
        descripcion: "Unidades contadas que coinciden con el sistema.",
      },
    ],
  },
  {
    // Documento de Laura Gómez: match exacto contra UBITS_DIRECTORY.
    username: "52487931",
    rows: [
      {
        nombre: "Abrir la operación comercial en dos ciudades nuevas",
        peso: 60, medida: "Numérico", direccion: "Aumentar",
        inicial: 0, maximo: "", minimo: "", meta: 2,
        descripcion: "Identificada por documento y nueva en el ciclo.",
      },
      {
        nombre: "Reducir la cartera vencida a más de 60 días",
        peso: 40, medida: "Porcentaje", direccion: "Reducir",
        inicial: 14.5, maximo: 3, minimo: 10, meta: 6,
        descripcion: "Cartera vencida sobre la cartera total.",
      },
    ],
  },

  // ===== POSIBLES ASOCIACIONES ==============================================
  {
    // Mismo local part que el nickname "martica" pero en otro dominio. Al
    // confirmarlo choca con el primer grupo → aviso "Usuario repetido".
    username: "martica@gmail.com",
    rows: [
      {
        nombre: "Documentar los procesos críticos del área",
        peso: 100, medida: "Numérico", direccion: "Aumentar",
        inicial: 2, maximo: "", minimo: "", meta: 8,
        descripcion: "Procesos con su manual publicado y aprobado.",
      },
    ],
  },
  {
    // Coincide con el local part del correo de Natalia Vargas (username nvargas).
    username: "natalia.vargas",
    rows: [
      {
        nombre: "Publicar la nueva librería de componentes",
        peso: 55, medida: "Se cumple / No se cumple", direccion: "Aumentar",
        inicial: 0, maximo: "", minimo: "", meta: 1,
        descripcion: "Se cumple con la librería publicada y documentada.",
      },
      {
        nombre: "Reducir el tiempo de build del monorepo",
        peso: 45, medida: "Numérico", direccion: "Reducir",
        inicial: 14, maximo: 4, minimo: 10, meta: 7,
        descripcion: "Minutos del pipeline completo en CI.",
      },
    ],
  },
  {
    // Documento de Ricardo Mejía (80234571) con un dígito de verificación extra.
    username: "802345711",
    rows: [
      {
        nombre: "Estandarizar el proceso de despacho regional",
        peso: 100, medida: "Porcentaje", direccion: "Aumentar",
        inicial: 55, maximo: 100, minimo: 80, meta: 95,
        descripcion: "Despachos que siguen el procedimiento estándar.",
      },
    ],
  },
  {
    // NOMBRE en la columna de username. Es el caso más común de "posible
    // alineación": UBITS no acepta el nombre como identificador y dos personas
    // pueden llamarse igual, así que solo se puede proponer.
    // "Cristian Rincon" sin tilde, a propósito: el match ignora acentos.
    username: "Cristian Rincon",
    rows: [
      {
        nombre: "Consolidar el tablero financiero del área",
        peso: 60, medida: "Porcentaje", direccion: "Aumentar",
        inicial: 35, maximo: 100, minimo: 80, meta: 95,
        descripcion: "Match por nombre: hay que confirmar que es la persona correcta.",
      },
      {
        nombre: "Reducir el cierre contable mensual",
        peso: 40, medida: "Numérico", direccion: "Reducir",
        inicial: 11, maximo: 3, minimo: 8, meta: 5,
        descripcion: "Días hábiles del cierre.",
      },
    ],
  },
  {
    // TELÉFONO de Natalia Vargas. Tampoco identifica: los números cambian de
    // dueño, así que el sistema propone y el revisor confirma.
    username: "3004419978",
    rows: [
      {
        nombre: "Migrar el design system a tokens",
        peso: 100, medida: "Porcentaje", direccion: "Aumentar",
        inicial: 15, maximo: 100, minimo: 70, meta: 90,
        descripcion: "Match por teléfono: el sistema propone, el revisor confirma.",
      },
    ],
  },
  {
    // Nada que proponer: hay que elegir el usuario a mano.
    username: "desconocido.persona@example.co",
    rows: [
      {
        nombre: "Lanzar el programa de referidos",
        peso: 60, medida: "Numérico", direccion: "Aumentar",
        inicial: 0, maximo: "", minimo: "", meta: 40,
        descripcion: "Referidos registrados por colaboradores.",
      },
      {
        nombre: "Subir la tasa de aceptación de ofertas",
        peso: 40, medida: "Porcentaje", direccion: "Aumentar",
        inicial: 68, maximo: 95, minimo: 80, meta: 88,
        descripcion: "Ofertas aceptadas sobre ofertas enviadas.",
      },
    ],
  },

  // ===== CON ERRORES ========================================================
  {
    // R1 (meta bajo el inicial en incremento) + R3 (meta igual al inicial),
    // y los pesos suman 80%.
    username: "pobjetivos",
    rows: [
      {
        nombre: "Aumentar los leads calificados del trimestre",
        peso: 50, medida: "Numérico", direccion: "Aumentar",
        inicial: 120, maximo: "", minimo: "", meta: 80,
        descripcion: "R1: la meta quedó por debajo del valor inicial.",
      },
      {
        nombre: "Mantener el margen de contribución",
        peso: 30, medida: "Porcentaje", direccion: "Aumentar",
        inicial: 32, maximo: "", minimo: "", meta: 32,
        descripcion: "R3: la meta es idéntica al valor inicial.",
      },
    ],
  },
  {
    // R2 (meta sobre el inicial en reducción) y los pesos suman 120%.
    username: "ctorres",
    rows: [
      {
        nombre: "Reducir el gasto en pauta digital",
        peso: 60, medida: "Dinero", direccion: "Reducir",
        inicial: 40000000, maximo: "", minimo: "", meta: 65000000,
        descripcion: "R2: en una meta de reducción, la meta quedó por encima del inicial.",
      },
      {
        nombre: "Subir el alcance orgánico de la marca",
        peso: 60, medida: "Numérico", direccion: "Aumentar",
        inicial: 120000, maximo: "", minimo: "", meta: 260000,
        descripcion: "Fila válida, pero los pesos del usuario suman 120%.",
      },
    ],
  },
  {
    /*
      Un error por fila, y una fila con DOS.

      Las dos primeras aíslan un error cada una; la tercera es el caso que no se
      podía ver en ningún otro lado: un solo objetivo que rompe dos reglas a la
      vez, en dos campos distintos. Se marcan las dos celdas y se listan los dos
      mensajes en rojo, que es exactamente lo que hay que poder distinguir de un
      error acompañado de un aviso ámbar.

      Los tres pesos suman 100% a propósito (100 + 0 + 0): así la tarjeta no
      arrastra además un problema de peso y el caso queda puro.
    */
    username: "usercreadorqa@example.co",
    rows: [
      {
        nombre: "Dejar en cero los reprocesos de facturación",
        peso: 100, medida: "Numérico", direccion: "Reducir",
        inicial: "", maximo: "", minimo: "", meta: 0,
        descripcion: "R0b: sin valor inicial la meta no puede ser 0.",
      },
      {
        nombre: "Revisar la parametrización de descuentos",
        peso: 0, medida: "Porcentaje", direccion: "Aumentar",
        inicial: 10, maximo: "", minimo: "", meta: 40,
        descripcion: "PESO_MIN: el peso no puede ser inferior al 1%.",
      },
      {
        // DOS ERRORES EN LA MISMA FILA: PESO_MIN (peso 0) + R2 (en reducción la
        // meta 9 no puede superar el inicial 4). Marca la celda de Peso y la de
        // Meta, y lista los dos mensajes en rojo.
        nombre: "Bajar el índice de notas de crédito",
        peso: 0, medida: "Porcentaje", direccion: "Reducir",
        inicial: 4, maximo: "", minimo: "", meta: 9,
        descripcion: "Notas de crédito sobre el total facturado del mes.",
      },
    ],
  },
  {
    // SIN USUARIO + errores de datos en la misma tarjeta: nadie en UBITS
    // corresponde a este correo Y además R1 y pesos al 85%. Es el caso que
    // obliga a que el contador "por corregir" sume las dos cosas en vez de
    // repartirlas entre dos chips distintos.
    username: "camila.rojas@proveedor-externo.com",
    rows: [
      {
        nombre: "Levantar el inventario de proveedores críticos",
        peso: 50, medida: "Numérico", direccion: "Aumentar",
        inicial: 30, maximo: "", minimo: "", meta: 18,
        descripcion: "R1: la meta quedó por debajo del valor inicial, y el usuario no existe.",
      },
      {
        nombre: "Reducir el tiempo de homologación de proveedores",
        peso: 35, medida: "Numérico", direccion: "Reducir",
        inicial: 45, maximo: 15, minimo: 35, meta: 25,
        descripcion: "Fila válida, pero los pesos del usuario suman 85%.",
      },
    ],
  },
  {
    // LOS TRES BLOQUEOS A LA VEZ, que es el peor caso que la tarjeta tiene que
    // saber contar en una sola pantalla:
    //   1. usuario  — nadie en UBITS corresponde a este correo,
    //   2. peso     — los pesos suman 130%, así que se PASAN del 100%,
    //   3. objetivo — la primera fila viola R3 (meta idéntica al inicial).
    // Sirve para verificar que los tres se reportan sin pisarse: el campo de
    // usuario en rojo con su aviso, las dos celdas de peso en rojo con el suyo,
    // y el mensaje R3 bajo la fila que lo rompe.
    username: "operacion.aliada@tercero-externo.com",
    rows: [
      {
        nombre: "Sostener el nivel de servicio de la operación aliada",
        peso: 70, medida: "Porcentaje", direccion: "Aumentar",
        inicial: 94, maximo: "", minimo: "", meta: 94,
        descripcion: "R3: la meta es idéntica al valor inicial.",
      },
      {
        nombre: "Ampliar la cobertura de rutas atendidas",
        peso: 60, medida: "Numérico", direccion: "Aumentar",
        inicial: 12, maximo: 30, minimo: 20, meta: 26,
        descripcion: "Fila válida, pero entre las dos los pesos suman 130%.",
      },
    ],
  },
  {
    // TITULO_MAX: el título supera los 150 caracteres.
    username: "dcastano@example.co",
    rows: [
      {
        nombre: TITULO_LARGO,
        peso: 100, medida: "Porcentaje", direccion: "Aumentar",
        inicial: 8.5, maximo: 16, minimo: 11, meta: 14,
        descripcion: "TITULO_MAX: el título supera el límite de 150 caracteres.",
      },
    ],
  },
];

/**
 * Objetivos para gente que YA tiene objetivos en el ciclo.
 *
 * El caso que este archivo existe para mostrar: la regla del 100% no es sobre lo
 * que trae el archivo, es sobre todo lo que carga la persona. Un archivo
 * impecable puede ser incargable simplemente porque el usuario ya repartió su
 * peso, y el revisor no puede resolverlo sin ver las dos mitades — las que ya
 * están en UBITS y las que vienen — y decidir de dónde sale el espacio.
 *
 * Los tres primeros usuarios existen en `SEEDED_ASSIGNED_USERS` con sus
 * objetivos escritos uno por uno. Sus pesos actuales son 100%, 55% y 60%, así
 * que este archivo cubre los tres desenlaces posibles:
 *
 *  - `svalencia` está LLENA (100%) y el archivo le suma 40% → 140%. No hay un
 *    número obvio que bajar: hay que decidir.
 *  - `mtoro@example.co` va a medias (55%) y el archivo le suma 60% → 115%. Se
 *    pasa por poco; un ajuste chico en cualquiera de los dos lados lo arregla.
 *  - `apineda` tiene 60% y el archivo le trae exactamente el 40% que falta →
 *    100%. Cae en **Alineados**: el contraejemplo que evita leer "ya tiene
 *    objetivos" como sinónimo de error.
 *  - `crrincon@example.co` no trae nada previo y suma 100% él solo, para poder
 *    comparar en la misma pantalla una tarjeta de una mitad con las de dos.
 */
const PESO_OCUPADO = [
  // 1 · Sofía Valencia · ya tiene 100% repartido en 3 objetivos → 140%
  {
    username: "svalencia",
    rows: [
      {
        nombre: "Abrir el canal de aliados en la región andina",
        peso: 25, medida: "Dinero", direccion: "Aumentar",
        inicial: 0, maximo: 90000000, minimo: 40000000, meta: 70000000,
        descripcion: "Facturación cerrada a través de aliados nuevos.",
      },
      {
        nombre: "Certificar al equipo en la nueva propuesta de valor",
        peso: 15, medida: "Porcentaje", direccion: "Aumentar",
        inicial: 0, maximo: "", minimo: 80, meta: 100,
        descripcion: "Comerciales que aprueban la certificación interna.",
      },
    ],
  },
  // 2 · Mauricio Toro · ya tiene 55% repartido en 2 objetivos → 115%
  {
    username: "mtoro@example.co",
    rows: [
      {
        nombre: "Automatizar el cierre contable mensual",
        peso: 30, medida: "Numérico", direccion: "Reducir",
        inicial: 9, maximo: 3, minimo: 7, meta: 5,
        descripcion: "Días hábiles que toma cerrar el mes.",
      },
      {
        nombre: "Implementar el tablero de flujo de caja",
        peso: 30, medida: "Se cumple / No se cumple", direccion: "Aumentar",
        inicial: 0, maximo: "", minimo: "", meta: 1,
        descripcion: "Se cumple con el tablero en producción y en uso.",
      },
    ],
  },
  // 3 · Ana Pineda · tiene 60% y el archivo trae el 40% exacto → 100%
  {
    username: "apineda",
    rows: [
      {
        nombre: "Cerrar el plan de formación de líderes",
        peso: 40, medida: "Porcentaje", direccion: "Aumentar",
        inicial: 0, maximo: "", minimo: 70, meta: 100,
        descripcion: "Líderes que completan la ruta de formación del ciclo.",
      },
    ],
  },
  // 4 · Cristian Rincón · sin objetivos previos, suma 100% él solo
  {
    username: "crrincon@example.co",
    rows: [
      {
        nombre: "Migrar los servicios críticos a la nueva nube",
        peso: 60, medida: "Porcentaje", direccion: "Aumentar",
        inicial: 20, maximo: 100, minimo: 70, meta: 90,
        descripcion: "Servicios migrados sobre el inventario crítico.",
      },
      {
        nombre: "Reducir el costo de infraestructura mensual",
        peso: 40, medida: "Dinero", direccion: "Reducir",
        inicial: 92000000, maximo: 60000000, minimo: 85000000, meta: 74000000,
        descripcion: "Factura mensual promedio del ciclo.",
      },
    ],
  },
];

// ===========================================================================
// EDICIÓN — los mismos tres casos, pero apuntando a objetivos que ya existen
// ===========================================================================

/*
  En edición el archivo no describe objetivos nuevos: los busca. `nombre_objetivo`
  es el criterio de búsqueda contra los `cycleObjectives` de SEEDED_ASSIGNED_USERS,
  así que estos tres archivos ejercitan una alineación más que los de creación —
  la del objetivo, no solo la del usuario:

    match exacto        → la fila reescribe ese objetivo
    nombre parecido     → solo se PROPONE; hay que confirmarlo
    sin nada parecido   → se creará nuevo, o se asocia a mano

  Y la aritmética del peso cambia: una fila que reescribe un objetivo REEMPLAZA su
  peso en vez de sumarlo. Subir uno de 30% a 40% cuesta 10%, no 40%.

  Usuarios con objetivos escritos uno por uno (y sus pesos actuales):
    evargas@example.co  4 objetivos · 30/30/25/15
    lcastillo           3 objetivos · 40/35/25
    jromero@example.co  2 objetivos · 55/45
    svalencia           3 objetivos · 45/35/20
    mtoro@example.co    2 objetivos · 30/25  (solo 55% repartido)
    apineda             1 objetivo  · 60     (solo 60% repartido)
*/

/**
 * Caso 4 — Happy path de edición.
 *
 * Todas las filas encuentran su objetivo por nombre exacto y los totales quedan
 * en 100%, así que los tres usuarios caen directo en **Alineados**. Cubre además
 * las tres cosas que solo se pueden hacer editando:
 *
 *  - Renombrar, con `nombre_objetivo_nuevo` (evargas, primera fila).
 *  - Redistribuir pesos entre objetivos existentes sin tocar el total.
 *  - Corregir a alguien que estaba por debajo del 100% (apineda, 60% → 100%).
 */
const EDIT_HAPPY_PATH = [
  // 1 · Esteban Vargas · 4 match exactos, pesos redistribuidos 30/30/25/15 → 35/30/20/15
  {
    username: "evargas@example.co",
    rows: [
      {
        nombre: "Reducir el costo de infraestructura mensual",
        nombreNuevo: "Reducir el costo de infraestructura de nube",
        peso: 35, medida: "Dinero", direccion: "Reducir",
        inicial: 84000000, minimo: 76000000, maximo: 52000000, meta: 58000000,
        descripcion: "Se renombra y se le sube el peso: la meta bajó de 62M a 58M.",
      },
      {
        nombre: "Subir la cobertura de pruebas automatizadas",
        peso: 30, medida: "Porcentaje", direccion: "Aumentar",
        inicial: 48, minimo: 70, maximo: 95, meta: 88,
        descripcion: "Mismo objetivo, meta más ambiciosa.",
      },
      {
        nombre: "Bajar el tiempo de respuesta del API",
        peso: 20, medida: "Numérico", direccion: "Reducir",
        inicial: 480, minimo: 380, maximo: 150, meta: 200,
        descripcion: "Baja de 25% a 20% para hacerle espacio al primero.",
      },
      {
        nombre: "Documentar los servicios críticos",
        peso: 15, medida: "Se cumple / No se cumple", direccion: "Aumentar",
        inicial: 0, minimo: "", maximo: "", meta: 1,
        descripcion: "Sin cambios de peso.",
      },
    ],
  },
  // 2 · Lucía Castillo · 3 match exactos. Los dos "embudo" se distinguen porque
  //     el archivo trae el nombre completo de cada uno.
  {
    username: "lcastillo",
    rows: [
      {
        nombre: "Aumentar la conversión del embudo comercial",
        peso: 45, medida: "Porcentaje", direccion: "Aumentar",
        inicial: 12, minimo: 16, maximo: 26, meta: 21,
        descripcion: "Sube de 40% a 45%.",
      },
      {
        nombre: "Aumentar la conversión del embudo de marketing",
        peso: 30, medida: "Porcentaje", direccion: "Aumentar",
        inicial: 4.2, minimo: 5.5, maximo: 9, meta: 7.5,
        descripcion: "Baja de 35% a 30%.",
      },
      {
        nombre: "Reducir el ciclo de venta promedio",
        peso: 25, medida: "Numérico", direccion: "Reducir",
        inicial: 68, minimo: 56, maximo: 32, meta: 38,
        descripcion: "Mismo peso, meta más corta.",
      },
    ],
  },
  // 3 · Ana Pineda · su único objetivo está al 60%; el archivo lo lleva a 100%.
  {
    username: "apineda",
    rows: [
      {
        nombre: "Implementar el nuevo modelo de desempeño",
        peso: 100, medida: "Porcentaje", direccion: "Aumentar",
        inicial: 0, minimo: 75, maximo: "", meta: 100,
        descripcion: "Queda como único objetivo del ciclo, así que pasa a pesar 100%.",
      },
    ],
  },
];

/**
 * Caso 5 — Los estados de la revisión, en edición.
 *
 * Las cuatro pestañas a la vez, y esta vez con las dos alineaciones en juego.
 *
 * A NIVEL DE USUARIO, igual que en creación:
 *   `evargas@example.co` correo exacto · `Lucia Castillo` NOMBRE sin tilde, que
 *   solo se puede proponer · `nadie.externo@proveedor.com` sin nada que proponer.
 *
 * A NIVEL DE OBJETIVO, que es lo nuevo:
 *   · match exacto — "Documentar los servicios críticos"
 *   · **propuesto** por nombre contenido — "Reducir el costo de infraestructura"
 *     (le falta "mensual"), y "Bajar el tiempo de respuesta" (le falta "del API")
 *   · **sin match, se creará nuevo** — "Migrar el monolito a servicios", que
 *     Esteban no tiene
 *   · **ambiguo a propósito** — jromero pide "Reducir entregas", que se parece
 *     tanto a "Reducir las entregas fuera de tiempo" como a nada más; y lcastillo
 *     pide "Aumentar la conversión del embudo", que empata entre sus DOS embudos,
 *     así que el matcher no propone ninguno y hay que elegir a mano.
 */
const EDIT_TRES_ESTADOS = [
  // ===== Esteban Vargas · usuario alineado, objetivos en los tres estados =====
  {
    username: "evargas@example.co",
    rows: [
      {
        nombre: "Documentar los servicios críticos",
        peso: 10, medida: "Se cumple / No se cumple", direccion: "Aumentar",
        inicial: 0, minimo: "", maximo: "", meta: 1,
        // MATCH EXACTO → chip "Con cambios".
        descripcion: "Se cumple con el inventario documentado y revisado.",
      },
      {
        nombre: "Reducir el costo de infraestructura",
        peso: 25, medida: "Dinero", direccion: "Reducir",
        inicial: 84000000, minimo: 76000000, maximo: 52000000, meta: 60000000,
        // PROPUESTO: en UBITS dice "…infraestructura mensual" → chip "Por confirmar".
        descripcion: "Factura promedio de nube por mes.",
      },
      {
        nombre: "Bajar el tiempo de respuesta",
        peso: 20, medida: "Numérico", direccion: "Reducir",
        inicial: 480, minimo: 380, maximo: 150, meta: 210,
        // PROPUESTO: en UBITS dice "…del API" → chip "Por confirmar".
        descripcion: "Latencia p95 en milisegundos.",
      },
      {
        nombre: "Migrar el monolito a servicios",
        peso: 15, medida: "Porcentaje", direccion: "Aumentar",
        inicial: 0, minimo: 40, maximo: 100, meta: 80,
        // SIN MATCH: no lo tiene → chip "Nuevo".
        descripcion: "Servicios movidos fuera del monolito.",
      },
    ],
  },
  // ===== Lucía Castillo, nombrada por NOMBRE sin tilde → posible alineación ====
  {
    username: "Lucia Castillo Pena",
    rows: [
      {
        nombre: "Aumentar la conversión del embudo",
        peso: 40, medida: "Porcentaje", direccion: "Aumentar",
        inicial: 12, minimo: 16, maximo: 26, meta: 20,
        // AMBIGUO: empata entre sus dos embudos → sin propuesta, hay que elegir a mano.
        descripcion: "Oportunidades cerradas sobre oportunidades creadas.",
      },
      {
        nombre: "Reducir el ciclo de venta promedio",
        peso: 25, medida: "Numérico", direccion: "Reducir",
        inicial: 68, minimo: 56, maximo: 32, meta: 40,
        // MATCH EXACTO → chip "Con cambios".
        descripcion: "Días entre el primer contacto y la firma.",
      },
    ],
  },
  // ===== Javier Romero · propuesta + error de dato =============================
  //
  // Sus pesos cuadran en 100% EN CUANTO se confirme la propuesta, así que el único
  // bloqueo que sobrevive es el R2. Es el caso que muestra lo que tienen de
  // distinto las dos alineaciones: mientras "Reducir entregas" siga siendo una
  // propuesta, el objetivo que reescribiría sigue contando aparte y el total dice
  // 145%; confirmarla lo cuadra sin que nadie toque un peso.
  {
    username: "jromero@example.co",
    rows: [
      {
        nombre: "Reducir entregas",
        peso: 45, medida: "Porcentaje", direccion: "Reducir",
        inicial: 11.5, minimo: 8, maximo: 2, meta: 14,
        // PROPUESTO y además roto: R2, la meta (14) supera el inicial (11.5).
        descripcion: "Entregas que incumplen la promesa al cliente.",
      },
      {
        nombre: "Ampliar la cobertura de rutas atendidas",
        peso: 55, medida: "Numérico", direccion: "Aumentar",
        inicial: 14, minimo: 20, maximo: 34, meta: 30,
        // MATCH EXACTO y fila válida.
        descripcion: "Rutas con servicio en operación.",
      },
      {
        /*
          DOS ERRORES EN LA MISMA FILA: PESO_MIN (peso 0) + R1 (en incremento la
          meta 12 no puede ser menor al inicial 30). Marca la celda de Peso y la
          de Meta, y lista los dos mensajes en rojo.

          Encima no hace match con nada suyo, así que llega con el chip "Nuevo":
          las dos alineaciones y los dos errores conviven en una sola fila, que es
          lo que solo se puede ver editando.

          Peso 0 a propósito, para no mover los totales: con la propuesta
          confirmada sigue siendo 45 + 55 + 0 = 100%.
        */
        nombre: "Recuperar los envíos devueltos",
        peso: 0, medida: "Numérico", direccion: "Aumentar",
        inicial: 30, minimo: "", maximo: "", meta: 12,
        descripcion: "Envíos devueltos que se logran reentregar.",
      },
    ],
  },
  // ===== Sin usuario en UBITS: no hay nada que alinear, ni arriba ni abajo ====
  {
    username: "nadie.externo@proveedor.com",
    rows: [
      {
        nombre: "Cerrar el plan de auditoría externa",
        peso: 100, medida: "Se cumple / No se cumple", direccion: "Aumentar",
        inicial: 0, minimo: "", maximo: "", meta: 1,
        descripcion: "Sin usuario asociado, así que tampoco hay objetivos donde buscar.",
      },
    ],
  },
];

/**
 * Caso 6 — Edición que se pasa del 100%.
 *
 * El caso que solo existe editando: subir el peso de un objetivo sin bajar el de
 * ningún otro. Como la fila REEMPLAZA el peso del objetivo que reescribe, el
 * exceso es exactamente lo que subió — y por eso el aviso de la tarjeta puede
 * decir cuánto sobra sin que el revisor tenga que hacer la resta.
 *
 *  - `svalencia` reescribe 2 de sus 3 (45+35 → 60+50) y deja el tercero en 20%:
 *    60+50+20 = 130%. Se pasa 30%.
 *  - `jromero@example.co` reescribe 1 de 2 (55 → 80) y el otro sigue en 45%:
 *    80+45 = 125%. Se pasa 25%.
 *  - `mtoro@example.co` solo tenía 55% repartido: reescribe uno (30 → 40) y le
 *    agrega uno nuevo al 35%, con lo que llega a 40+25+35 = 100%. **Alineado** —
 *    el contraejemplo que evita leer "edición" como sinónimo de problema.
 */
const EDIT_PESO_EXCEDIDO = [
  {
    username: "svalencia",
    rows: [
      {
        nombre: "Sostener la cuota mensual del canal directo",
        peso: 60, medida: "Dinero", direccion: "Aumentar",
        inicial: 180000000, minimo: 200000000, maximo: 280000000, meta: 250000000,
        descripcion: "Sube de 45% a 60%.",
      },
      {
        nombre: "Elevar el ticket promedio por cliente",
        peso: 50, medida: "Dinero", direccion: "Aumentar",
        inicial: 3200000, minimo: "", maximo: "", meta: 4400000,
        descripcion: "Sube de 35% a 50%. Con el tercero sin tocar, el total llega a 130%.",
      },
    ],
  },
  {
    username: "jromero@example.co",
    rows: [
      {
        nombre: "Ampliar la cobertura de rutas atendidas",
        peso: 80, medida: "Numérico", direccion: "Aumentar",
        inicial: 14, minimo: 22, maximo: 36, meta: 32,
        descripcion: "Sube de 55% a 80%. El otro sigue en 45%: 125% en total.",
      },
    ],
  },
  {
    username: "mtoro@example.co",
    rows: [
      {
        nombre: "Cerrar el presupuesto anual sin desviaciones",
        peso: 40, medida: "Porcentaje", direccion: "Reducir",
        inicial: 8.4, minimo: 6, maximo: 1, meta: 2.5,
        descripcion: "Sube de 30% a 40%.",
      },
      {
        nombre: "Levantar el tablero de riesgos financieros",
        peso: 35, medida: "Se cumple / No se cumple", direccion: "Aumentar",
        inicial: 0, minimo: "", maximo: "", meta: 1,
        // SIN MATCH → chip "Nuevo". Con el de cartera en 25%, cuadra en 100%.
        descripcion: "Se cumple con el tablero publicado y en uso.",
      },
    ],
  },
];

/**
 * Caso 7 — Actualizar avances · happy path.
 *
 * Siete reportes limpios sobre objetivos que ya existen, con los tres
 * identificadores de usuario y toda la matriz de lo que un avance puede ser:
 *
 *  - Las cuatro medidas y las dos direcciones.
 *  - Un avance que llega justo a la meta (100%) y otros a medio camino.
 *  - Un objetivo binario que pasa de "no se cumple" a "se cumple".
 *  - Un objetivo sobre el que NADIE había reportado todavía: su `avance_actual`
 *    va vacío, que es distinto de ir en cero.
 *
 * Ni un solo error, ni un solo aviso: los tres usuarios caen en **Alineados**
 * directo. Es el archivo que muestra para qué sirve la operación antes de
 * mostrar en qué se puede equivocar.
 *
 * Los `valor_inicial`, `meta` y `avance_actual` son copia exacta de lo que
 * tienen estos objetivos en SEEDED_ASSIGNED_USERS. Si editas uno, edita el otro
 * — es contexto para quien llena el archivo, y verlo cuadrar contra la tabla es
 * lo que hace legible el caso.
 */
const PROGRESS_HAPPY_PATH = [
  // 1 · Esteban Vargas · correo · sus cuatro objetivos, uno de cada medida
  {
    username: "evargas@example.co",
    rows: [
      {
        nombre: "Reducir el costo de infraestructura mensual",
        inicial: 84000000, meta: 62000000, avanceActual: 79000000, nuevoAvance: 68000000,
      },
      {
        nombre: "Subir la cobertura de pruebas automatizadas",
        inicial: 48, meta: 82, avanceActual: 61, nuevoAvance: 74,
      },
      {
        nombre: "Bajar el tiempo de respuesta del API",
        inicial: 480, meta: 220, avanceActual: 395, nuevoAvance: 240,
      },
      {
        // Binario: pasa de 0 a 1, o sea de "no se cumple" a "se cumple" → 100%.
        nombre: "Documentar los servicios críticos",
        inicial: 0, meta: 1, avanceActual: 0, nuevoAvance: 1,
      },
    ],
  },

  // 2 · Mauricio Toro · correo · incluye el objetivo sin avance previo
  {
    username: "mtoro@example.co",
    rows: [
      {
        nombre: "Cerrar el presupuesto anual sin desviaciones",
        inicial: 8.4, meta: 3, avanceActual: 6.8, nuevoAvance: 4.1,
      },
      {
        // `avance_actual` vacío: nadie había reportado sobre este objetivo. La
        // tabla muestra "—", que no es lo mismo que ir en cero.
        nombre: "Reducir los días de cartera vencida",
        inicial: 62, meta: 38, avanceActual: "", nuevoAvance: 46,
      },
    ],
  },

  // 3 · Ana Pineda · nickname · el avance que llega a la meta exacta
  {
    username: "apineda",
    rows: [
      {
        nombre: "Implementar el nuevo modelo de desempeño",
        inicial: 0, meta: 100, avanceActual: 35, nuevoAvance: 100,
      },
    ],
  },
];

/**
 * Caso 8 — Actualizar avances · las 4 pestañas y todo lo que puede fallar.
 *
 * El equivalente del caso 2, pero con los problemas que solo existen cuando lo
 * que se carga es un avance. Dos son los mismos de siempre — el usuario no se
 * encontró, el usuario solo se pudo proponer — y el resto son nuevos:
 *
 * BLOQUEAN:
 *   · `nuevo_avance` vacío. Es el único dato que esta carga escribe; sin él la
 *     fila no hace nada.
 *   · El objetivo no existe en UBITS. Aquí NO se puede crear — no hay avance que
 *     reportar sobre algo que no existe — así que es un callejón sin salida y no
 *     un "se creará nuevo" como en edición. Es la diferencia más grande entre
 *     las dos operaciones y por eso el archivo trae dos casos: uno por nombre
 *     que no existe y otro por nombre ambiguo.
 *   · La propuesta de objetivo sin confirmar, igual que en edición.
 *
 * NO BLOQUEAN (avisan, y el revisor decide):
 *   · El avance retrocede respecto de lo que hay registrado.
 *   · No alcanza el mínimo → el cumplimiento quedará en 0%.
 *   · Supera el máximo → el cumplimiento se calcula hasta el tope.
 *
 * Lo que NO aparece por ningún lado, a propósito: el peso. Esta carga no mueve
 * pesos, así que la tarjeta no habla de 100% ni de cuánto falta.
 */
const PROGRESS_TRES_ESTADOS = [
  // ===== CON ERRORES · Esteban Vargas, un problema distinto por fila ========
  {
    username: "evargas@example.co",
    rows: [
      {
        // PROPUESTO: en UBITS dice "…infraestructura mensual" → "Por confirmar".
        nombre: "Reducir el costo de infraestructura",
        inicial: 84000000, meta: 62000000, avanceActual: 79000000, nuevoAvance: 68000000,
      },
      {
        // LIMPIA: el avance actual del archivo (55) ni se mira — el que sale en
        // la tabla es el que UBITS tiene hoy (61). Está aquí para verlo.
        nombre: "Subir la cobertura de pruebas automatizadas",
        inicial: 48, meta: 82, avanceActual: 55, nuevoAvance: 74,
      },
      {
        // VACÍO: la fila viaja sin el único dato que iba a escribir.
        nombre: "Bajar el tiempo de respuesta del API",
        inicial: 480, meta: 220, avanceActual: 395, nuevoAvance: "",
      },
      {
        // SIN MATCH: Esteban no tiene este objetivo. En edición se crearía; aquí
        // no hay nada sobre lo cual reportar.
        nombre: "Migrar el monolito a servicios",
        inicial: 0, meta: 80, avanceActual: 0, nuevoAvance: 45,
      },
      {
        // La única fila limpia de la tarjeta, para que se vea que el bloqueo es
        // de las otras y no del usuario.
        nombre: "Documentar los servicios críticos",
        inicial: 0, meta: 1, avanceActual: 0, nuevoAvance: 1,
      },
    ],
  },

  // ===== ALINEADO CON AVISOS · Javier Romero ===============================
  //
  // Las dos filas avisan y ninguna bloquea, así que la tarjeta llega a
  // "Alineados" con dos advertencias visibles. Es el contraejemplo que evita
  // leer "aviso" como sinónimo de "error".
  {
    username: "jromero@example.co",
    rows: [
      {
        // Retrocede (19 → 17) Y no alcanza el mínimo de 20 → cumplimiento 0%.
        nombre: "Ampliar la cobertura de rutas atendidas",
        inicial: 14, meta: 28, avanceActual: 19, nuevoAvance: 17,
      },
      {
        // Se pasa del máximo (2): el cumplimiento se cuenta como si hubiera
        // llegado justo al tope, no más.
        nombre: "Reducir las entregas fuera de tiempo",
        inicial: 11.5, meta: 4, avanceActual: 9.2, nuevoAvance: 1.5,
      },
    ],
  },

  // ===== POSIBLE ALINEACIÓN · Lucía nombrada por NOMBRE sin tilde ==========
  //
  // Hasta confirmar la persona no hay dónde buscar los objetivos, así que las
  // dos filas dicen "No existe en UBITS". Al confirmarla, "Reducir el ciclo de
  // venta promedio" hace match exacto y "Aumentar la conversión del embudo"
  // queda empatado entre sus dos embudos → hay que elegir a mano.
  {
    username: "Lucia Castillo Pena",
    rows: [
      {
        nombre: "Aumentar la conversión del embudo",
        inicial: 12, meta: 19, avanceActual: 14, nuevoAvance: 17,
      },
      {
        nombre: "Reducir el ciclo de venta promedio",
        inicial: 68, meta: 42, avanceActual: 59, nuevoAvance: 48,
      },
    ],
  },

  // ===== SIN ALINEAR · nadie detrás del correo =============================
  {
    username: "nadie.externo@proveedor.com",
    rows: [
      {
        nombre: "Cerrar el plan de auditoría externa",
        inicial: 0, meta: 1, avanceActual: 0, nuevoAvance: 1,
      },
    ],
  },
];

/** Convierte la estructura declarativa en las filas de la plantilla. */
function toRows(users) {
  return users.flatMap((user) =>
    user.rows.map((row) => [
      user.username,
      row.nombre,
      row.peso,
      row.medida,
      row.direccion,
      row.inicial,
      row.maximo,
      row.minimo,
      row.meta,
      row.descripcion,
    ])
  );
}

/**
 * Construye la hoja con las mismas validaciones de lista que la plantilla
 * oficial, extendidas a todas las filas de datos (la original solo valida la
 * fila 2, que es una limitación real de la plantilla que UBITS distribuye).
 */
function createSheet(users) {
  const rows = toRows(users);
  const sheet = XLSX.utils.aoa_to_sheet([CREATE_HEADER, ...rows]);
  const lastRow = rows.length + 1;

  sheet["!cols"] = [
    { wch: 34 }, // username
    { wch: 52 }, // nombre_objetivo
    { wch: 8 },  // peso
    { wch: 24 }, // tipo_medida
    { wch: 18 }, // aumentar_reducir
    { wch: 15 }, // valor_inicial
    { wch: 21 }, // cumplimiento_maximo
    { wch: 21 }, // cumplimiento_minimo
    { wch: 15 }, // meta
    { wch: 62 }, // descripcion_meta
  ];

  sheet["!dataValidation"] = [
    {
      sqref: `D2:D${lastRow}`,
      type: "list",
      formula1: '"Dinero,Porcentaje,Numérico,Se cumple / No se cumple"',
    },
    { sqref: `E2:E${lastRow}`, type: "list", formula1: '"Aumentar,Reducir"' },
  ];

  return sheet;
}

/** Las mismas filas, en el orden y con las columnas de la plantilla de edición. */
function toEditRows(users) {
  return users.flatMap((user) =>
    user.rows.map((row) => [
      user.username,
      row.nombre,
      // Vacío es lo normal: solo se llena cuando la edición además renombra.
      row.nombreNuevo ?? "",
      row.peso,
      row.medida,
      row.direccion,
      row.inicial,
      row.minimo,
      row.maximo,
      row.meta,
      row.descripcion,
    ])
  );
}

/** Hoja de edición, con las mismas validaciones de lista que la de creación. */
function createEditSheet(users) {
  const rows = toEditRows(users);
  const sheet = XLSX.utils.aoa_to_sheet([EDIT_HEADER, ...rows]);
  const lastRow = rows.length + 1;

  sheet["!cols"] = [
    { wch: 30 }, // username
    { wch: 48 }, // nombre_objetivo
    { wch: 48 }, // nombre_objetivo_nuevo
    { wch: 8 },  // peso
    { wch: 24 }, // tipo_medida
    { wch: 18 }, // aumentar_reducir
    { wch: 15 }, // valor_inicial
    { wch: 21 }, // cumplimiento_minimo
    { wch: 21 }, // cumplimiento_maximo
    { wch: 15 }, // meta
    { wch: 62 }, // descripcion_meta
  ];

  // Una columna más que en creación, así que las listas caen en E y F.
  sheet["!dataValidation"] = [
    {
      sqref: `E2:E${lastRow}`,
      type: "list",
      formula1: '"Dinero,Porcentaje,Numérico,Se cumple / No se cumple"',
    },
    { sqref: `F2:F${lastRow}`, type: "list", formula1: '"Aumentar,Reducir"' },
  ];

  return sheet;
}

/** Las filas de una carga de avances, en el orden de PROGRESS_HEADER. */
function toProgressRows(users) {
  return users.flatMap((user) =>
    user.rows.map((row) => [
      user.username,
      row.nombre,
      row.inicial,
      row.meta,
      // Se escribe "" cuando el export no traía avance previo, que es como se ve
      // un objetivo sobre el que nadie ha reportado todavía.
      row.avanceActual ?? "",
      row.nuevoAvance ?? "",
    ])
  );
}

/**
 * Hoja de actualización de avances.
 *
 * Sin validaciones de lista: no hay ninguna columna de opciones. Las tres
 * numéricas de contexto van sombreadas en gris para que se lea de entrada que
 * no son para tocar — la plantilla no puede impedirlo, pero sí puede decirlo.
 */
function createProgressSheet(users) {
  const rows = toProgressRows(users);
  const sheet = XLSX.utils.aoa_to_sheet([PROGRESS_HEADER, ...rows]);

  sheet["!cols"] = [
    { wch: 32 }, // username
    { wch: 52 }, // nombre_objetivo
    { wch: 16 }, // valor_inicial
    { wch: 16 }, // meta
    { wch: 16 }, // avance_actual
    { wch: 16 }, // nuevo_avance
  ];

  return sheet;
}

function writeWorkbook(fileName, sheets) {
  const workbook = XLSX.utils.book_new();
  sheets.forEach(({ name, ws }) => XLSX.utils.book_append_sheet(workbook, ws, name));
  XLSX.writeFile(workbook, path.join(OUT, fileName));
  console.log("✔", path.relative(path.join(__dirname, ".."), path.join(OUT, fileName)));
}

/*
  Los nombres de archivo dicen qué caso son, no de qué empresa salieron.

  Antes se llamaban cosas como "Objetivos Comercial Q3 2026.xlsx", que es lo que
  se llamaría un archivo real y por eso mismo era inútil aquí: abrir la carpeta no
  decía cuál subir para ver qué. Ahora cada nombre lleva tres cosas, y las tres
  hacen falta:

    1. El número, para que la carpeta se ordene en el orden de la demo.
    2. La OPERACIÓN. Es la parte más valiosa: hay que elegirla a mano en el drawer
       antes de subir el archivo, y equivocarse ahí no da error — da una revisión
       que no tiene nada que ver, porque las plantillas de crear y editar esperan
       columnas distintas.
    3. El caso, en las palabras en que se habla de él.

  Cuidado al renombrarlos: hay tokens en el nombre que disparan errores
  simulados — "pesado"/"grande", "corrupto"/"dañado", "sin-estructura"/"vacío"
  en `analyzeObjectivesFiles`, y "falla-carga"/"error-carga" en el momento de
  escribir. Los archivos 9 a 15 los llevan a propósito; del 1 al 8 ninguno debe
  contenerlos, o el caso que quieren mostrar no llegará a verse.
*/

// --- Caso 1 — Happy path ---------------------------------------------------

writeWorkbook("1 - Crear - happy path.xlsx", [
  { name: "Creación de objetivos", ws: createSheet(HAPPY_PATH) },
]);

// --- Caso 2 — Los cuatro estados de la revisión ----------------------------

writeWorkbook("2 - Crear - las 4 pestañas de la revisión.xlsx", [
  { name: "Creación de objetivos", ws: createSheet(TRES_ESTADOS) },
]);

// --- Caso 3 — Usuarios que ya tienen objetivos en el ciclo -----------------

writeWorkbook("3 - Crear - usuario que ya tiene objetivos.xlsx", [
  { name: "Creación de objetivos", ws: createSheet(PESO_OCUPADO) },
]);

// --- Casos 4, 5 y 6 — los mismos tres, para EDICIÓN ------------------------

writeWorkbook("4 - Editar - happy path.xlsx", [
  { name: "Edición de objetivos", ws: createEditSheet(EDIT_HAPPY_PATH) },
]);

writeWorkbook("5 - Editar - match de objetivos por nombre.xlsx", [
  { name: "Edición de objetivos", ws: createEditSheet(EDIT_TRES_ESTADOS) },
]);

writeWorkbook("6 - Editar - subir peso sin bajar otro.xlsx", [
  { name: "Edición de objetivos", ws: createEditSheet(EDIT_PESO_EXCEDIDO) },
]);

// --- Casos 7 y 8 — ACTUALIZAR avances --------------------------------------

writeWorkbook("7 - Actualizar - happy path.xlsx", [
  { name: "Actualización de avances", ws: createProgressSheet(PROGRESS_HAPPY_PATH) },
]);

writeWorkbook("8 - Actualizar - avances con errores y avisos.xlsx", [
  { name: "Actualización de avances", ws: createProgressSheet(PROGRESS_TRES_ESTADOS) },
]);

// --- Casos 9 a 15 — el archivo mismo falla ---------------------------------

/*
  Estos no ejercitan la revisión: ejercitan lo que pasa ANTES o DESPUÉS de ella.

  Cuatro de los cinco casos se disparan por un token en el nombre, y eso es una
  decisión deliberada del prototipo, no una limitación: un .xlsx de verdad
  corrupto no se puede versionar en el repo (git lo trata como binario roto y
  cualquier editor que lo abra lo "arregla"), y uno de 10 MB pesa 10 MB. El
  token hace que el mismo archivo válido reproduzca el error a voluntad.

  El quinto — el formato no soportado — sí es real: un .zip es un .zip, y lo
  bloquea la validación del dropzone antes de que nadie lo lea.

  Los tres primeros valen para las tres operaciones, porque el error salta antes
  de mirar las columnas. "Falla la carga" no: para llegar al momento de escribir
  hay que pasar la revisión, así que necesita un archivo válido por operación.
*/

writeWorkbook("9 - Error - archivo pesado.xlsx", [
  { name: "Creación de objetivos", ws: createSheet(HAPPY_PATH) },
]);

writeWorkbook("10 - Error - archivo corrupto.xlsx", [
  { name: "Creación de objetivos", ws: createSheet(HAPPY_PATH) },
]);

/*
  Sin estructura: este sí es honesto de punta a punta. Es un .xlsx legítimo con
  contenido que no es ninguna de las tres plantillas, así que el parser lo abre
  bien y no encuentra ni una columna que reconozca. El token del nombre coincide
  con lo que el archivo es.
*/
writeWorkbook("11 - Error - archivo sin-estructura.xlsx", [
  {
    name: "Hoja1",
    ws: XLSX.utils.aoa_to_sheet([
      ["Reporte de seguimiento comercial"],
      ["Generado el", "12/03/2026"],
      [],
      ["Zona", "Responsable", "Notas"],
      ["Norte", "Equipo 1", "Pendiente de revisión"],
      ["Sur", "Equipo 2", "Al día"],
    ]),
  },
]);

writeWorkbook("13 - Crear - falla-carga.xlsx", [
  { name: "Creación de objetivos", ws: createSheet(HAPPY_PATH) },
]);

writeWorkbook("14 - Editar - falla-carga.xlsx", [
  { name: "Edición de objetivos", ws: createEditSheet(EDIT_HAPPY_PATH) },
]);

writeWorkbook("15 - Actualizar - falla-carga.xlsx", [
  { name: "Actualización de avances", ws: createProgressSheet(PROGRESS_HAPPY_PATH) },
]);

/*
  Formato no soportado. No lleva número de operación porque no llega a elegirse
  ninguna: el dropzone solo acepta .csv, .xls y .xlsx, así que lo rechaza en el
  momento de soltarlo, con el mensaje inline y sin pasar por el análisis.
*/
fs.writeFileSync(
  path.join(OUT, "12 - Error - formato no soportado.zip"),
  Buffer.from("PK archivo de prueba: formato no soportado por la carga masiva de objetivos")
);
console.log("✔ demo-samples/objetivos/12 - Error - formato no soportado.zip");

// --- Resumen en consola ----------------------------------------------------

/** Suma de pesos por usuario, para verificar la regla del 100% de un vistazo. */
function summarise(label, dataset) {
  const objectives = dataset.reduce((total, user) => total + user.rows.length, 0);
  console.log(`\n${label}: ${dataset.length} usuarios · ${objectives} objetivos`);
  console.log(
    "  pesos: " +
      dataset
        .map((user) => `${user.username}=${user.rows.reduce((sum, row) => sum + row.peso, 0)}%`)
        .join(", ")
  );
}

summarise("Happy path", HAPPY_PATH);
summarise("Tres estados", TRES_ESTADOS);
summarise("Peso ya asignado", PESO_OCUPADO);

/**
 * Lo que suman los objetivos que YA existen en el ciclo, para poder verificar de
 * un vistazo que este archivo cae donde dice caer. Debe quedar igual a los
 * `cycleObjectives` de SEEDED_ASSIGNED_USERS; si editas uno, edita el otro.
 */
const PESO_PREVIO = { svalencia: 100, "mtoro@example.co": 55, apineda: 60 };

console.log("\nPeso ya asignado — total por usuario (previo + archivo):");
PESO_OCUPADO.forEach((user) => {
  const previo = PESO_PREVIO[user.username] ?? 0;
  const archivo = user.rows.reduce((sum, row) => sum + row.peso, 0);
  const total = previo + archivo;
  const verdict = total === 100 ? "alineado" : total > 100 ? `se pasa ${total - 100}%` : `falta ${100 - total}%`;
  console.log(`  ${user.username}: ${previo}% + ${archivo}% = ${total}% → ${verdict}`);
});

// --- Verificación de los archivos de edición -------------------------------

/**
 * Los objetivos que cada usuario tiene HOY en el ciclo, con su peso. Copia de los
 * `cycleObjectives` de SEEDED_ASSIGNED_USERS: si editas uno, edita el otro.
 */
const OBJETIVOS_ACTUALES = {
  "evargas@example.co": {
    "Reducir el costo de infraestructura mensual": 30,
    "Subir la cobertura de pruebas automatizadas": 30,
    "Bajar el tiempo de respuesta del API": 25,
    "Documentar los servicios críticos": 15,
  },
  lcastillo: {
    "Aumentar la conversión del embudo comercial": 40,
    "Aumentar la conversión del embudo de marketing": 35,
    "Reducir el ciclo de venta promedio": 25,
  },
  "jromero@example.co": {
    "Ampliar la cobertura de rutas atendidas": 55,
    "Reducir las entregas fuera de tiempo": 45,
  },
  svalencia: {
    "Sostener la cuota mensual del canal directo": 45,
    "Elevar el ticket promedio por cliente": 35,
    "Mantener la satisfacción posventa": 20,
  },
  "mtoro@example.co": {
    "Cerrar el presupuesto anual sin desviaciones": 30,
    "Reducir los días de cartera vencida": 25,
  },
  apineda: { "Implementar el nuevo modelo de desempeño": 60 },
};

/**
 * El total que quedará tras una edición.
 *
 * Una fila que hace match EXACTO reemplaza el peso del objetivo que reescribe; una
 * que no lo hace suma uno nuevo. Solo se cuenta el match exacto a propósito: los
 * nombres parecidos son propuestas, y hasta que alguien las confirme el archivo no
 * está reemplazando nada. Por eso un archivo con propuestas sin resolver puede dar
 * un total distinto al de la app hasta que se confirmen.
 */
function summariseEdit(label, dataset) {
  const objectives = dataset.reduce((total, user) => total + user.rows.length, 0);
  console.log(`\n${label}: ${dataset.length} usuarios · ${objectives} filas`);

  dataset.forEach((user) => {
    const actuales = OBJETIVOS_ACTUALES[user.username];
    if (!actuales) {
      console.log(`  ${user.username}: sin objetivos previos (usuario sin alinear)`);
      return;
    }

    const reemplazados = new Set();
    let nuevos = 0;
    let propuestos = 0;
    let deArchivo = 0;

    user.rows.forEach((row) => {
      deArchivo += row.peso;
      if (Object.prototype.hasOwnProperty.call(actuales, row.nombre)) {
        reemplazados.add(row.nombre);
      } else if (
        Object.keys(actuales).some(
          (name) => name.includes(row.nombre) || row.nombre.includes(name)
        )
      ) {
        propuestos += 1;
      } else {
        nuevos += 1;
      }
    });

    const intactos = Object.entries(actuales)
      .filter(([name]) => !reemplazados.has(name))
      .reduce((sum, [, weight]) => sum + weight, 0);
    const total = intactos + deArchivo;
    const verdict =
      total === 100 ? "alineado" : total > 100 ? `se pasa ${total - 100}%` : `falta ${100 - total}%`;
    const extras = [
      `${reemplazados.size} exacto${reemplazados.size === 1 ? "" : "s"}`,
      propuestos > 0 ? `${propuestos} propuesto${propuestos === 1 ? "" : "s"}` : null,
      nuevos > 0 ? `${nuevos} nuevo${nuevos === 1 ? "" : "s"}` : null,
    ].filter(Boolean);

    console.log(
      `  ${user.username}: intactos ${intactos}% + archivo ${deArchivo}% = ${total}% → ${verdict}  (${extras.join(", ")})`
    );
  });
}

summariseEdit("Editar · happy path", EDIT_HAPPY_PATH);
summariseEdit("Editar · tres estados", EDIT_TRES_ESTADOS);
summariseEdit("Editar · peso excedido", EDIT_PESO_EXCEDIDO);

// --- Verificación de los archivos de avances -------------------------------

/**
 * Lo que UBITS tiene HOY para cada objetivo sobre el que reportan estos
 * archivos: la meta, los topes y el avance registrado. Copia de los
 * `cycleObjectives` de SEEDED_ASSIGNED_USERS — si editas uno, edita el otro,
 * porque de esa coincidencia depende que los avisos que este script anuncia
 * (retrocede, no alcanza el mínimo, supera el máximo) sean los que de verdad
 * salen en la tabla.
 */
const AVANCES_ACTUALES = {
  "Reducir el costo de infraestructura mensual": { ini: 84000000, meta: 62000000, min: 78000000, max: 55000000, dir: "Reducir", actual: 79000000 },
  "Subir la cobertura de pruebas automatizadas": { ini: 48, meta: 82, min: 65, max: 92, dir: "Aumentar", actual: 61 },
  "Bajar el tiempo de respuesta del API": { ini: 480, meta: 220, min: 400, max: 180, dir: "Reducir", actual: 395 },
  "Documentar los servicios críticos": { ini: 0, meta: 1, min: null, max: null, dir: "Aumentar", actual: 0 },
  "Cerrar el presupuesto anual sin desviaciones": { ini: 8.4, meta: 3, min: 6, max: 1, dir: "Reducir", actual: 6.8 },
  "Reducir los días de cartera vencida": { ini: 62, meta: 38, min: 50, max: 30, dir: "Reducir", actual: null },
  "Implementar el nuevo modelo de desempeño": { ini: 0, meta: 100, min: 70, max: null, dir: "Aumentar", actual: 35 },
  "Ampliar la cobertura de rutas atendidas": { ini: 14, meta: 28, min: 20, max: 34, dir: "Aumentar", actual: 19 },
  "Reducir las entregas fuera de tiempo": { ini: 11.5, meta: 4, min: 8, max: 2, dir: "Reducir", actual: 9.2 },
  "Aumentar la conversión del embudo comercial": { ini: 12, meta: 19, min: 15, max: 24, dir: "Aumentar", actual: 14 },
  // El segundo embudo de Lucía: es lo que vuelve ambiguo el nombre a medias.
  "Aumentar la conversión del embudo de marketing": { ini: 4.2, meta: 7, min: 5.5, max: 9, dir: "Aumentar", actual: 5.1 },
  "Reducir el ciclo de venta promedio": { ini: 68, meta: 42, min: 58, max: 35, dir: "Reducir", actual: 59 },
};

/** El mismo cálculo de cumplimiento que hace la app (R4, R5 y R6a). */
function cumplimiento(obj, avance) {
  if (obj.min !== null) {
    const noAlcanza = obj.dir === "Aumentar" ? avance < obj.min : avance > obj.min;
    if (noAlcanza) return 0;
  }
  let efectivo = avance;
  if (obj.max !== null) {
    const sePasa = obj.dir === "Aumentar" ? avance > obj.max : avance < obj.max;
    if (sePasa) efectivo = obj.max;
  }
  return Math.max(0, Math.round(((efectivo - obj.ini) / (obj.meta - obj.ini)) * 1000) / 10);
}

/**
 * Qué va a decir la revisión de cada fila, calculado aquí para poder verificar
 * de un vistazo que el archivo ejercita los casos que dice ejercitar.
 */
function summariseProgress(label, dataset) {
  const filas = dataset.reduce((total, user) => total + user.rows.length, 0);
  console.log(`\n${label}: ${dataset.length} usuarios · ${filas} filas`);

  dataset.forEach((user) => {
    console.log(`  ${user.username}:`);
    user.rows.forEach((row) => {
      // Igual que el matcher de la app: nombre exacto primero, y si no, un
      // nombre que lo contenga (así "…de infraestructura" encuentra
      // "…de infraestructura mensual" y sale como propuesta, no como inexistente).
      const exacto = AVANCES_ACTUALES[row.nombre];
      const parecidos = exacto
        ? []
        : Object.keys(AVANCES_ACTUALES).filter(
            (name) => name.includes(row.nombre) || row.nombre.includes(name)
          );
      const obj = exacto ?? (parecidos.length === 1 ? AVANCES_ACTUALES[parecidos[0]] : undefined);
      if (!obj) {
        console.log(
          `    · "${row.nombre}" → ${
            parecidos.length > 1 ? "AMBIGUO entre " + parecidos.length + " objetivos" : "NO EXISTE en UBITS"
          } (bloquea)`
        );
        return;
      }
      const propuesta = exacto ? "" : `  [propuesto: "${parecidos[0]}" → hay que confirmarlo]`;
      if (row.nuevoAvance === "" || row.nuevoAvance === undefined) {
        console.log(`    · "${row.nombre}" → nuevo avance VACÍO (bloquea)`);
        return;
      }

      const avisos = [];
      if (obj.actual !== null) {
        const retrocede =
          obj.dir === "Aumentar" ? row.nuevoAvance < obj.actual : row.nuevoAvance > obj.actual;
        if (retrocede) avisos.push(`retrocede (${obj.actual} → ${row.nuevoAvance})`);
      }
      if (obj.min !== null) {
        const noAlcanza =
          obj.dir === "Aumentar" ? row.nuevoAvance < obj.min : row.nuevoAvance > obj.min;
        if (noAlcanza) avisos.push(`no alcanza el mínimo (${obj.min})`);
      }
      if (obj.max !== null) {
        const sePasa =
          obj.dir === "Aumentar" ? row.nuevoAvance > obj.max : row.nuevoAvance < obj.max;
        if (sePasa) avisos.push(`supera el máximo (${obj.max})`);
      }

      const pct = cumplimiento(obj, row.nuevoAvance);
      console.log(
        `    · "${row.nombre}" → ${row.nuevoAvance} = ${pct}%` +
          propuesta +
          (avisos.length ? `  [avisos: ${avisos.join(" · ")}]` : "")
      );
    });
  });
}

summariseProgress("Actualizar · happy path", PROGRESS_HAPPY_PATH);
summariseProgress("Actualizar · errores y avisos", PROGRESS_TRES_ESTADOS);
