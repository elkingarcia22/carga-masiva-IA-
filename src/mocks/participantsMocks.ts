/**
 * Participant roster used by the "encuesta con participantes" demo scenarios.
 *
 * Covers the three scenarios the review step has to show:
 *  - `matched`: the file's identifier IS a UBITS username (a corporate email, a
 *    document number, or an assigned username — all three appear here).
 *  - `possible`: the identifier is unknown to UBITS, but the person's full name
 *    is identical to a UBITS user's. Requires a human decision.
 *  - `unmatched`: nothing to link to; created inside the survey only.
 *
 * ⚠️ Mirrored in `scripts/generate-demo-samples.cjs` so the generated .xlsx
 * holds these exact rows. Keep both lists in sync when editing.
 */
import type { DetectedParticipant, UbitsDirectoryUser } from "@/lib/surveyImport";

export const DEMO_PARTICIPANT_ROSTER: DetectedParticipant[] = [
  // --- Match por correo corporativo ---
  { name: "Camila Rojas Mena", identifier: "camila.rojas@quillayes.cl", identifierType: "correo", matchStatus: "matched" },
  { name: "Diego Fuentes Soto", identifier: "diego.fuentes@quillayes.cl", identifierType: "correo", matchStatus: "matched" },
  { name: "Valentina Muñoz Paredes", identifier: "valentina.munoz@quillayes.cl", identifierType: "correo", matchStatus: "matched" },
  { name: "Ignacio Herrera Lagos", identifier: "ignacio.herrera@quillayes.cl", identifierType: "correo", matchStatus: "matched" },
  { name: "Josefa Contreras Vidal", identifier: "josefa.contreras@quillayes.cl", identifierType: "correo", matchStatus: "matched" },
  { name: "Matías Bravo Cárdenas", identifier: "matias.bravo@quillayes.cl", identifierType: "correo", matchStatus: "matched" },

  // --- Match por número de documento ---
  { name: "Antonia Salazar Pinto", identifier: "16452398", identifierType: "numero", matchStatus: "matched" },
  { name: "Cristóbal Reyes Aguirre", identifier: "13987541", identifierType: "numero", matchStatus: "matched" },
  { name: "Fernanda Olivares Ruiz", identifier: "18234670", identifierType: "numero", matchStatus: "matched" },
  { name: "Rodrigo Sepúlveda Tapia", identifier: "15008923", identifierType: "numero", matchStatus: "matched" },
  { name: "Paula Navarrete Silva", identifier: "17650412", identifierType: "numero", matchStatus: "matched" },
  { name: "Sebastián Quiroz Molina", identifier: "14320877", identifierType: "numero", matchStatus: "matched" },

  // --- Match por username asignado ---
  { name: "Daniela Cáceres Rivas", identifier: "dcaceres", identifierType: "username", matchStatus: "matched" },
  { name: "Andrés Villalobos Peña", identifier: "avillalobos", identifierType: "username", matchStatus: "matched" },
  { name: "Catalina Espinoza Lara", identifier: "cespinoza", identifierType: "username", matchStatus: "matched" },
  { name: "Tomás Guzmán Alarcón", identifier: "tguzman", identifierType: "username", matchStatus: "matched" },
  { name: "Isidora Peralta Nieto", identifier: "iperalta", identifierType: "username", matchStatus: "matched" },
  { name: "Joaquín Maldonado Cid", identifier: "jmaldonado", identifierType: "username", matchStatus: "matched" },

  // --- Posible match: el identificador no existe en UBITS, pero el nombre y
  // apellido son idénticos a los de un usuario. Alguien tiene que confirmarlo. ---
  {
    name: "Francisca Leiva Toro",
    identifier: "fran.leiva88@gmail.com",
    identifierType: "correo",
    matchStatus: "possible",
    suggestion: {
      name: "Francisca Leiva Toro",
      username: "francisca.leiva@quillayes.cl",
      identifierType: "correo",
      context: "Producción · Analista · Osorno",
    },
  },
  {
    name: "Pedro Pérez González",
    identifier: "0091",
    identifierType: "numero",
    matchStatus: "possible",
    suggestion: {
      name: "Pedro Pérez González",
      username: "12876543",
      identifierType: "numero",
      context: "Logística · Operario · Puerto Montt",
    },
  },
  {
    name: "María José Silva Rojas",
    identifier: "mjsilva",
    identifierType: "username",
    matchStatus: "possible",
    suggestion: {
      name: "María José Silva Rojas",
      username: "mariajose.silva@quillayes.cl",
      identifierType: "correo",
      context: "Comercial · Jefatura · Santiago",
    },
  },
  {
    name: "Luis Alberto Muñoz",
    identifier: "lmunoz.temporal",
    identifierType: "username",
    matchStatus: "possible",
    suggestion: {
      name: "Luis Alberto Muñoz",
      username: "lamunoz",
      identifierType: "username",
      context: "Producción · Operario · Osorno",
    },
  },

  // --- Sin match en UBITS: se crean solo dentro de la encuesta ---
  { name: "Bárbara Ortiz Leiva", identifier: "barbara.ortiz@contratistas.cl", identifierType: "correo", matchStatus: "unmatched" },
  { name: "Emilio Zúñiga Fuenzalida", identifier: "emilio.zuniga@externo.cl", identifierType: "correo", matchStatus: "unmatched" },
  { name: "Trinidad Godoy Bustos", identifier: "99001245", identifierType: "numero", matchStatus: "unmatched" },
  { name: "Renato Alarcón Vega", identifier: "99003871", identifierType: "numero", matchStatus: "unmatched" },
  { name: "Amanda Cifuentes Rojas", identifier: "acifuentes.temp", identifierType: "username", matchStatus: "unmatched" },
  { name: "Gonzalo Miranda Soto", identifier: "gmiranda.ext", identifierType: "username", matchStatus: "unmatched" },
];

/**
 * The UBITS user directory the review step searches when someone links a
 * participant by hand. Holds every user the roster above resolves to (so a
 * confirmed match can be shown by name) plus users nobody matched, which is
 * what makes searching worthwhile.
 */
export const UBITS_DIRECTORY: UbitsDirectoryUser[] = [
  // Usuarios a los que el roster hace match automático.
  { name: "Camila Rojas Mena", username: "camila.rojas@quillayes.cl", identifierType: "correo", context: "Producción · Analista · Osorno" },
  { name: "Diego Fuentes Soto", username: "diego.fuentes@quillayes.cl", identifierType: "correo", context: "Comercial · Analista · Santiago" },
  { name: "Valentina Muñoz Paredes", username: "valentina.munoz@quillayes.cl", identifierType: "correo", context: "Administración · Jefatura · Osorno" },
  { name: "Ignacio Herrera Lagos", username: "ignacio.herrera@quillayes.cl", identifierType: "correo", context: "Logística · Operario · Puerto Montt" },
  { name: "Josefa Contreras Vidal", username: "josefa.contreras@quillayes.cl", identifierType: "correo", context: "Producción · Analista · Osorno" },
  { name: "Matías Bravo Cárdenas", username: "matias.bravo@quillayes.cl", identifierType: "correo", context: "Comercial · Jefatura · Santiago" },
  { name: "Antonia Salazar Pinto", username: "16452398", identifierType: "numero", context: "Producción · Operario · Osorno" },
  { name: "Cristóbal Reyes Aguirre", username: "13987541", identifierType: "numero", context: "Logística · Operario · Puerto Montt" },
  { name: "Fernanda Olivares Ruiz", username: "18234670", identifierType: "numero", context: "Administración · Analista · Santiago" },
  { name: "Rodrigo Sepúlveda Tapia", username: "15008923", identifierType: "numero", context: "Producción · Jefatura · Osorno" },
  { name: "Paula Navarrete Silva", username: "17650412", identifierType: "numero", context: "Comercial · Analista · Santiago" },
  { name: "Sebastián Quiroz Molina", username: "14320877", identifierType: "numero", context: "Logística · Operario · Puerto Montt" },
  { name: "Daniela Cáceres Rivas", username: "dcaceres", identifierType: "username", context: "Administración · Analista · Osorno" },
  { name: "Andrés Villalobos Peña", username: "avillalobos", identifierType: "username", context: "Producción · Operario · Osorno" },
  { name: "Catalina Espinoza Lara", username: "cespinoza", identifierType: "username", context: "Comercial · Analista · Santiago" },
  { name: "Tomás Guzmán Alarcón", username: "tguzman", identifierType: "username", context: "Logística · Jefatura · Puerto Montt" },
  { name: "Isidora Peralta Nieto", username: "iperalta", identifierType: "username", context: "Administración · Analista · Santiago" },
  { name: "Joaquín Maldonado Cid", username: "jmaldonado", identifierType: "username", context: "Producción · Operario · Osorno" },

  // Candidatos de los posibles match por nombre.
  { name: "Francisca Leiva Toro", username: "francisca.leiva@quillayes.cl", identifierType: "correo", context: "Producción · Analista · Osorno" },
  { name: "Pedro Pérez González", username: "12876543", identifierType: "numero", context: "Logística · Operario · Puerto Montt" },
  { name: "María José Silva Rojas", username: "mariajose.silva@quillayes.cl", identifierType: "correo", context: "Comercial · Jefatura · Santiago" },
  { name: "Luis Alberto Muñoz", username: "lamunoz", identifierType: "username", context: "Producción · Operario · Osorno" },

  // Usuarios que nadie matcheó: el resto del directorio, para que buscar sirva.
  { name: "Alejandra Vergara Soto", username: "alejandra.vergara@quillayes.cl", identifierType: "correo", context: "Personas · Jefatura · Santiago" },
  { name: "Bastián Cortés Muñoz", username: "bastian.cortes@quillayes.cl", identifierType: "correo", context: "Producción · Operario · Osorno" },
  { name: "Carolina Fuentealba Díaz", username: "carolina.fuentealba@quillayes.cl", identifierType: "correo", context: "Marketing · Analista · Santiago" },
  { name: "Esteban Riquelme Soto", username: "esteban.riquelme@quillayes.cl", identifierType: "correo", context: "Supply Chain · Jefatura · Puerto Montt" },
  { name: "Gabriela Astudillo Rojas", username: "gastudillo", identifierType: "username", context: "Administración · Analista · Osorno" },
  { name: "Héctor Sandoval Pino", username: "16788201", identifierType: "numero", context: "Producción · Operario · Osorno" },
  { name: "Javiera Toledo Cárdenas", username: "jtoledo", identifierType: "username", context: "Comercial · Analista · Santiago" },
  { name: "Lucas Bustamante Ríos", username: "lbustamante", identifierType: "username", context: "Logística · Operario · Puerto Montt" },
  { name: "Macarena Vidal Soto", username: "macarena.vidal@quillayes.cl", identifierType: "correo", context: "Personas · Analista · Santiago" },
  { name: "Nicolás Aravena Leiva", username: "15672340", identifierType: "numero", context: "Producción · Jefatura · Osorno" },
  { name: "Pía Cárdenas Muñoz", username: "pcardenas", identifierType: "username", context: "Administración · Analista · Puerto Montt" },
  { name: "Vicente Morales Tapia", username: "vicente.morales@quillayes.cl", identifierType: "correo", context: "Supply Chain · Analista · Osorno" },
];
