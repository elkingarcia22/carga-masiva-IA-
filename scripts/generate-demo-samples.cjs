/**
 * Genera los archivos de muestra para la demo de carga de encuestas.
 *
 * Uso:  node scripts/generate-demo-samples.cjs
 * Salida: carpeta demo-samples/ en la raíz del repo.
 *
 * Cada archivo está pensado para disparar un escenario concreto del flujo
 * (ver demo-samples/README.md). Los archivos "reales" (xlsx bien formados) se
 * procesan de verdad; los que llevan tokens en el nombre (corrupto/pesado/
 * sin-estructura) o extensión pdf/imagen disparan escenarios forzados/mock.
 */
const fs = require("fs");
const path = require("path");
const XLSX = require(path.join(__dirname, "..", "node_modules", "xlsx"));

const OUT = path.join(__dirname, "..", "demo-samples");
fs.mkdirSync(OUT, { recursive: true });

/** Construye una hoja "Clima" en el layout por-área que entiende parseGerenciaReport. */
function climaSheet({ surveyName, sections }) {
  // sections: [{ name, questions: [text, ...] }]
  const groupRow = ["", "", "", "", "Indicador Clave"];
  const headerRow = ["Área:", "", "Respuestas", "Invitados", "Favorabilidad"];
  const neg = ["Quillayes Surlat", "", 480, 520, 10];
  const neu = ["", "", "", "", 20];
  const pos = ["", "", "", "", 70];
  sections.forEach((sec) => {
    groupRow.push("Dimension");
    headerRow.push(sec.name);
    neg.push(12); neu.push(20); pos.push(70);
    sec.questions.forEach((q) => {
      groupRow.push("Pregunta");
      headerRow.push(q);
      neg.push(11); neu.push(19); pos.push(70);
    });
  });
  const aoa = [
    ["Reporte de Gerencia"],
    ["Área: Quillayes Surlat"],
    [`Encuesta: ${surveyName}`],
    [],
    ["Fecha: 26-MAR-2026"],
    groupRow,
    headerRow,
    neg, neu, pos,
  ];
  return XLSX.utils.aoa_to_sheet(aoa);
}

/** Hoja eNPS con preguntas sin dimensión (quedan section-less). */
function enpsSheet() {
  const groupRow = ["", "", "", "", "Indicador Clave", "Pregunta", "Pregunta"];
  const headerRow = [
    "Área:", "", "Respuestas", "Invitados", "eNPS",
    "En una escala de 0 a 10, ¿qué tan probable es que recomiendes a la empresa como un buen lugar para trabajar?",
    "¿Qué es lo que más valoras de trabajar aquí? (respuesta abierta)",
  ];
  return XLSX.utils.aoa_to_sheet([
    ["Reporte"], ["Área: Quillayes Surlat"], ["Encuesta: eNPS 2025"], [], ["Fecha: 26-MAR-2026"],
    groupRow, headerRow,
    ["Quillayes Surlat", "", 480, 520, 30, 10, 20],
    ["", "", "", "", 30, 20, 30],
    ["", "", "", "", 40, 70, 50],
  ]);
}

function writeWorkbook(fileName, sheets) {
  const wb = XLSX.utils.book_new();
  sheets.forEach(({ name, ws }) => XLSX.utils.book_append_sheet(wb, ws, name));
  XLSX.writeFile(wb, path.join(OUT, fileName));
  console.log("✓", fileName);
}

const CLIMA_SECTIONS = [
  { name: "Seguridad", questions: [
    "Las condiciones en las que realizo mi trabajo son seguras.",
    "Los aspectos de seguridad son una prioridad dentro de los objetivos de la empresa.",
    "Conozco la forma para reportar las acciones y condiciones inseguras de mi área.",
  ] },
  { name: "Liderazgo", questions: [
    "Mi jefatura me entrega retroalimentación oportuna.",
    "Confío en las decisiones que toma el equipo directivo.",
  ] },
  { name: "Desarrollo", questions: [
    "Tengo oportunidades reales de crecimiento en la empresa.",
  ] },
];

// --- Acto 1: happy path (real) ---
writeWorkbook("Clima 2025.xlsx", [{ name: "Clima", ws: climaSheet({ surveyName: "Encuesta de Clima 2025", sections: CLIMA_SECTIONS }) }]);

// --- Acto 3: varias encuestas (real) — un segundo año ---
writeWorkbook("Clima 2024.xlsx", [{ name: "Clima", ws: climaSheet({ surveyName: "Encuesta de Clima 2024", sections: CLIMA_SECTIONS }) }]);

// --- Acto 3: preguntas sin sección + eNPS (real) ---
writeWorkbook("preguntas-sin-seccion.xlsx", [
  { name: "Clima", ws: climaSheet({ surveyName: "Encuesta de Clima 2025", sections: CLIMA_SECTIONS.slice(0, 2) }) },
  { name: "eNPS", ws: enpsSheet() },
]);

// --- Acto 3: duplicado vs. encuesta existente (real-contra-mock) ---
writeWorkbook("Clima Organizacional - Q1 2025.xlsx", [
  { name: "Clima", ws: climaSheet({ surveyName: "Clima Organizacional", sections: CLIMA_SECTIONS }) },
]);

// --- Acto 3: tipos de pregunta variados (para mostrar el match completo de la
// taxonomía UBITS) + preguntas que no hacen match (van al grupo "Sin reconocer") ---
const TIPOS_VARIADOS_SECTIONS = [
  { name: "Compromiso", questions: [
    "Estoy de acuerdo con la dirección que está tomando la empresa.",            // Likert · Acuerdo
    "¿Con qué frecuencia recibes reconocimiento por tu trabajo?",                // Likert · Frecuencia
    "¿Qué tan satisfecho estás con tu equipo de trabajo?",                       // Likert · Satisfacción
    "¿Qué tan probable es que asumas nuevos retos este año?",                    // Likert · Probabilidad
  ] },
  { name: "Experiencia", questions: [
    "En una escala de 0 a 10, ¿qué tan probable es que recomiendes a la empresa como un buen lugar para trabajar?", // NPS
    "Califica con estrellas tu experiencia general en la empresa.",              // Estrellas
    "¿Cómo te sientes al iniciar tu jornada laboral?",                           // Emociones
    "En una escala de 1 a 7, evalúa el ambiente de tu área.",                    // Lineal
  ] },
  { name: "Preferencias", questions: [
    "Cuéntanos con tus palabras qué mejorarías de la empresa (comentario).",     // Abierta
    "Selecciona tu sede principal.",                                             // Opción única
    "Selecciona todas las prestaciones que utilizas.",                           // Múltiples respuestas
    "Elige de la lista tu área de trabajo.",                                     // Desplegable
    "Ordena de mayor a menor los beneficios según su importancia para ti.",      // Sin reconocer (ranking)
    "Distribuye 100 puntos entre las siguientes iniciativas.",                   // Sin reconocer (matriz)
  ] },
];
writeWorkbook("Encuesta tipos variados 2025.xlsx", [
  { name: "Clima", ws: climaSheet({ surveyName: "Encuesta de tipos variados 2025", sections: TIPOS_VARIADOS_SECTIONS }) },
]);

// --- Acto 4: encuestas con participantes individuales ---
//
// Espejo de DEMO_PARTICIPANT_ROSTER en src/mocks/participantsMocks.ts.
// Mantener ambas listas en sync: la UI muestra la del mock, el .xlsx la de aquí.
const PARTICIPANT_ROSTER = [
  ["Camila Rojas Mena", "camila.rojas@quillayes.cl"],
  ["Diego Fuentes Soto", "diego.fuentes@quillayes.cl"],
  ["Valentina Muñoz Paredes", "valentina.munoz@quillayes.cl"],
  ["Ignacio Herrera Lagos", "ignacio.herrera@quillayes.cl"],
  ["Josefa Contreras Vidal", "josefa.contreras@quillayes.cl"],
  ["Matías Bravo Cárdenas", "matias.bravo@quillayes.cl"],
  ["Antonia Salazar Pinto", "16452398"],
  ["Cristóbal Reyes Aguirre", "13987541"],
  ["Fernanda Olivares Ruiz", "18234670"],
  ["Rodrigo Sepúlveda Tapia", "15008923"],
  ["Paula Navarrete Silva", "17650412"],
  ["Sebastián Quiroz Molina", "14320877"],
  ["Daniela Cáceres Rivas", "dcaceres"],
  ["Andrés Villalobos Peña", "avillalobos"],
  ["Catalina Espinoza Lara", "cespinoza"],
  ["Tomás Guzmán Alarcón", "tguzman"],
  ["Isidora Peralta Nieto", "iperalta"],
  ["Joaquín Maldonado Cid", "jmaldonado"],
  // Posible match: el identificador no existe en UBITS, pero el nombre y
  // apellido son idénticos a los de un usuario. Requieren decisión manual.
  ["Francisca Leiva Toro", "fran.leiva88@gmail.com"],
  ["Pedro Pérez González", "0091"],
  ["María José Silva Rojas", "mjsilva"],
  ["Luis Alberto Muñoz", "lmunoz.temporal"],
  // Sin match en UBITS: se crean solo dentro de la encuesta.
  ["Bárbara Ortiz Leiva", "barbara.ortiz@contratistas.cl"],
  ["Emilio Zúñiga Fuenzalida", "emilio.zuniga@externo.cl"],
  ["Trinidad Godoy Bustos", "99001245"],
  ["Renato Alarcón Vega", "99003871"],
  ["Amanda Cifuentes Rojas", "acifuentes.temp"],
  ["Gonzalo Miranda Soto", "gmiranda.ext"],
];

// Espejo de PARTICIPANT_QUESTION_DETAILS en src/lib/surveyImport/demoScenarios.ts.
const PARTICIPANT_SECTIONS = [
  { name: "Liderazgo", questions: [
    "Mi jefatura me entrega retroalimentación oportuna sobre mi trabajo.",
    "Confío en las decisiones que toma el equipo directivo.",
    "Mi jefatura reconoce el trabajo bien hecho.",
  ] },
  { name: "Comunicación", questions: [
    "La comunicación entre áreas es clara y oportuna.",
    "Recibo la información que necesito para hacer bien mi trabajo.",
  ] },
  { name: "Desarrollo", questions: [
    "Tengo oportunidades reales de crecimiento en la empresa.",
    "Recibo capacitación suficiente para mi rol.",
  ] },
  { name: "Bienestar", questions: [
    "Mi carga de trabajo me permite mantener un buen equilibrio de vida.",
    "Me siento seguro y respetado en mi entorno de trabajo.",
  ] },
];

const NPS_QUESTION =
  "En una escala de 0 a 10, ¿qué tan probable es que recomiendes a la empresa como un buen lugar para trabajar?";
const OPEN_QUESTION = "Cuéntanos con tus palabras qué mejorarías de la empresa (comentario).";

const AREAS = ["Producción", "Comercial", "Administración", "Logística"];
const CARGOS = ["Operario", "Analista", "Jefatura", "Gerencia"];
const SEDES = ["Osorno", "Santiago", "Puerto Montt"];
const ANTIGUEDADES = ["Menos de 1 año", "1 a 3 años", "3 a 5 años", "Más de 5 años"];
const COMENTARIOS = [
  "Más instancias de comunicación con la gerencia.",
  "Mejorar los turnos y la carga de trabajo.",
  "Más oportunidades de capacitación técnica.",
  "Reconocer más el trabajo del equipo.",
];

const FLAT_QUESTIONS = PARTICIPANT_SECTIONS.flatMap((s) => s.questions);

/**
 * Hoja "participantes": una fila por persona con su username y sus respuestas.
 * Este es el único formato que permite cargar la encuesta como pública.
 */
function participantesConRespuestasSheet() {
  const header = ["Nombre", "Usuario", "Área", "Cargo", "Sede", "Antigüedad", ...FLAT_QUESTIONS, NPS_QUESTION, OPEN_QUESTION];
  const rows = PARTICIPANT_ROSTER.map(([name, user], i) => [
    name,
    user,
    AREAS[i % AREAS.length],
    CARGOS[i % CARGOS.length],
    SEDES[i % SEDES.length],
    ANTIGUEDADES[i % ANTIGUEDADES.length],
    // Respuestas Likert 1-5 deterministas, con algo de dispersión por persona.
    ...FLAT_QUESTIONS.map((_, q) => 3 + ((i + q) % 3) - ((i + q) % 2)),
    // eNPS 0-10: 18 promotores, 6 neutrales, 4 detractores → eNPS real = 50.
    i < 18 ? 9 + (i % 2) : i < 24 ? 7 + (i % 2) : 3 + (i % 4),
    COMENTARIOS[i % COMENTARIOS.length],
  ]);
  return XLSX.utils.aoa_to_sheet([
    ["Encuesta: Encuesta de Clima con participantes 2025"],
    ["Fecha: 21-MAR-2025"],
    [],
    header,
    ...rows,
  ]);
}

/**
 * Hoja "participantes" sin columnas de respuesta: solo el listado de quiénes
 * participaron. Los resultados vienen agregados en otra hoja, así que ninguna
 * respuesta se puede atribuir a una persona → la encuesta es anónima a la fuerza.
 */
function participantesSinRespuestasSheet() {
  const header = ["Nombre", "Usuario", "Área", "Cargo", "Sede", "¿Participó?"];
  const rows = PARTICIPANT_ROSTER.map(([name, user], i) => [
    name,
    user,
    AREAS[i % AREAS.length],
    CARGOS[i % CARGOS.length],
    SEDES[i % SEDES.length],
    "Sí",
  ]);
  return XLSX.utils.aoa_to_sheet([
    ["Encuesta: Encuesta de Clima sin respuestas por persona 2025"],
    ["Fecha: 21-MAR-2025"],
    ["Nota: los resultados de esta encuesta se entregan agregados; no se registró qué respondió cada persona."],
    [],
    header,
    ...rows,
  ]);
}

writeWorkbook("Clima con participantes 2025.xlsx", [
  { name: "participantes", ws: participantesConRespuestasSheet() },
  { name: "Clima", ws: climaSheet({ surveyName: "Encuesta de Clima con participantes 2025", sections: PARTICIPANT_SECTIONS }) },
]);

writeWorkbook("Clima participantes sin respuestas 2025.xlsx", [
  { name: "participantes", ws: participantesSinRespuestasSheet() },
  { name: "Clima", ws: climaSheet({ surveyName: "Encuesta de Clima sin respuestas por persona 2025", sections: PARTICIPANT_SECTIONS }) },
]);

// --- Acto 2: falla el paso final de carga (error técnico), disparado por el
// nombre. El archivo es válido y recorre todo el wizard; solo falla al "Cargar". ---
writeWorkbook("falla-carga 2025.xlsx", [
  { name: "Clima", ws: climaSheet({ surveyName: "Encuesta de Clima 2025", sections: CLIMA_SECTIONS }) },
]);

// --- Acto 2: reconocido pero sin estructura (token 'sin-estructura', igual generamos un xlsx real vacío) ---
writeWorkbook("sin-estructura.xlsx", [{ name: "Hoja1", ws: XLSX.utils.aoa_to_sheet([["Datos"], ["sin estructura reconocible"]]) }]);

// --- Acto 2: placeholders por token (contenido irrelevante, disparan por nombre) ---
writeWorkbook("pesado.xlsx", [{ name: "Clima", ws: climaSheet({ surveyName: "Encuesta de Clima 2025", sections: CLIMA_SECTIONS }) }]);
writeWorkbook("corrupto.xlsx", [{ name: "Clima", ws: climaSheet({ surveyName: "Encuesta de Clima 2025", sections: CLIMA_SECTIONS }) }]);

// --- Acto 3: PDF e imagen (mock extraction, contenido irrelevante) ---
const MINIMAL_PDF = "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]>>endobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000052 00000 n \n0000000101 00000 n \ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n164\n%%EOF";
fs.writeFileSync(path.join(OUT, "reporte-clima.pdf"), MINIMAL_PDF, "latin1");
console.log("✓ reporte-clima.pdf");

// 1x1 PNG transparente
const PNG_1PX = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64"
);
fs.writeFileSync(path.join(OUT, "encuesta.png"), PNG_1PX);
console.log("✓ encuesta.png");

// --- Acto 2: tipo no soportado (bloqueado en validación) ---
fs.writeFileSync(path.join(OUT, "no-soportado.zip"), Buffer.from("PK archivo de prueba no soportado"));
console.log("✓ no-soportado.zip");

console.log("\nListo. Archivos en:", OUT);
