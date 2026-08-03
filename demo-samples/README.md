# Archivos de muestra para la demo de carga de encuestas

Estos archivos disparan cada escenario del flujo **por su nombre/tipo**. Súbelos desde el
panel "Cargar encuestas". Para regenerarlos: `node scripts/generate-demo-samples.cjs`.

> El disparo por nombre está en `src/lib/surveyImport/demoScenarios.ts`. Si nada matchea,
> corre el pipeline real (`parseSurveyFiles`).

## Acto 1 — Happy path (REAL)

### Opción A — Datos reales (carpeta `encuesta-real/`) ⭐ recomendado para demo
Archivos reales de Quillayes Surlat (formato de exportación real). Se parsean de verdad con
`parseGerenciaReport` / `parseRawFormat`.

| Cómo subir | Qué muestra |
|------------|-------------|
| **Solo** `Resultdos Clima total QS 2025.xlsx` (1 archivo) | Real: favorabilidad, eNPS (aprox.), demográficos, 7 secciones · 44 preguntas. Participación = N/D (viene del archivo raw). |
| **Todo el set 2025** (los 10 archivos `*2025*.xlsx`, sin el de 2024) | Real y completo: **Participación 86.9%**, favorabilidad 66.6, **eNPS real -0.2**, 10 demográficos, 7 secciones · 44 preguntas. Se agrupan en una sola encuesta 2025. |
| Incluir además `Resultados Encuesta de Clima 2024.xlsx` | Se detectan 2 encuestas (2024 y 2025) → paso "Selecciona la encuesta". |

> Nota: son datos reales de encuesta (agregados). El archivo raw incluye respuestas por
> colaborador; considera esto antes de commitear la carpeta a un repo compartido.

### Opción B — Datos sintéticos (generados)
| Archivo | Qué demuestra |
|---------|----------------|
| `Clima 2025.xlsx` | Parseo real de un archivo generado: datos generales → estructura → cargar. |

## Acto 2 — Casos de error
| Archivo | Qué demuestra | Real/Mock |
|---------|----------------|-----------|
| `no-soportado.zip` | Tipo de archivo no permitido (bloqueo en validación al seleccionarlo). | REAL |
| `pesado.xlsx` | "Archivo demasiado grande" (forzado por el token `pesado`; simula el límite de 10 MB sin necesitar un archivo real pesado). | forzado por token |
| `corrupto.xlsx` | "No pudimos leer el archivo" (dañado/protegido). | forzado por token |
| `sin-estructura.xlsx` | Formato aceptado pero sin secciones/preguntas reconocibles. | forzado por token |
| `falla-carga 2025.xlsx` | Archivo válido que recorre todo el wizard, pero **falla en el paso final "Cargar encuesta"** con un error humano ("No pudimos cargar la encuesta, estamos teniendo problemas técnicos…") y botón **Reintentar**. Independiente de los demás casos. | forzado por token |

## Acto 3 — Casos atípicos
| Archivo | Qué demuestra | Real/Mock |
|---------|----------------|-----------|
| `Clima 2024.xlsx` + `Clima 2025.xlsx` (juntos) | Varias encuestas detectadas → paso "Selecciona la encuesta". Al cargar una, aparece el estado intermedio **"Carga iniciada"** con la carga en curso y su progreso arriba, y dos caminos: cargar la otra encuesta del lote / cargar una nueva. Las ya cargadas quedan con check y "Ya la cargaste". | REAL |
| `preguntas-sin-seccion.xlsx` | Preguntas que no mapean a una dimensión → grupos `eNPS` y `Sin sección` con nota aclaratoria. | REAL |
| `Encuesta tipos variados 2025.xlsx` | **Match completo de la taxonomía UBITS**: detecta tipo de pregunta / escala / valoración (Likert Acuerdo·Frecuencia·Satisfacción·Probabilidad, NPS, Estrellas, Emociones, Lineal, Abierta, Opción única, Múltiples, Desplegable). Las 2 preguntas de ranking/matriz caen en el grupo **"Sin reconocer"** con aviso de que no aportan a métricas ni se pueden filtrar/segmentar. | REAL |
| `reporte-clima.pdf` / `encuesta.png` | Extracción **simulada** desde PDF/imagen (banner "Estructura estimada (simulada)"). | MOCK |
| `Clima Organizacional - Q1 2025.xlsx` | Choca con una encuesta ya cargada → el campo "Nombre de la encuesta" queda en error y bloquea "Siguiente" hasta usar otro nombre (UBITS no permite duplicados). | REAL contra mock |

## Acto 4 — Participantes y visibilidad (pública vs. anónima)

La visibilidad **no la elige libremente el usuario**: una encuesta solo puede cargarse como
**Pública** si los archivos traen **una fila por participante con las respuestas de ese participante**.
El criterio de match con UBITS es el **username**, que puede ser el correo, el número de
documento o un username asignado.

| Archivo | Qué demuestra | Real/Mock |
|---------|----------------|-----------|
| `Clima con participantes 2025.xlsx` | Hoja `participantes` con **1 fila por participante + sus respuestas**. Se detecta automáticamente como **Pública** (queda preseleccionada) y aparece la sección **PARTICIPANTES DETECTADOS · 28** con 3 acordeones: **Hacen match con UBITS** (18, su identificador coincide con el username o el correo de un usuario; cada fila puede corregirse con *"Dejar sin match"* o **Asociar usuario**), **Posibles match** (4, mismo nombre y apellido que un usuario pero identificador que no coincide → *"Sí, es el mismo usuario"*, *"Dejar sin match"* o **Asociar usuario**) y **Sin match en UBITS** (6, con el botón **Asociar usuario** que abre un autocomplete + botón **Asociar** para vincularlos a mano a cualquier usuario del directorio). | forzado por token |
| `Clima participantes sin respuestas 2025.xlsx` | Hoja `participantes` **sin columnas de respuesta**: sabemos quiénes participaron, pero no qué respondió cada uno. La opción **Pública queda deshabilitada** con el mensaje de por qué, se fuerza **Anónima** y aparece el "Umbral de anonimato". La sección de participantes se muestra igual (con la nota de anonimato). | forzado por token |
| Cualquier otro archivo de este README | Ningún archivo agregado trae participantes con respuestas individuales, así que **todos** bloquean la opción Pública con el mensaje "Los archivos traen resultados agregados…". | REAL |

> Tokens en el nombre: `participantes` activa el caso público; si además contiene
> `sin respuestas` / `sin-respuestas` / `anonima`, activa el caso anónimo forzado.
> La regla vive en `src/lib/surveyImport/visibility.ts` (`publicVisibilityBlock`); el roster de
> participantes y el directorio de UBITS que alimenta el autocomplete, en
> `src/mocks/participantsMocks.ts` (`DEMO_PARTICIPANT_ROSTER` y `UBITS_DIRECTORY`).

## Notas
- Los `.xlsx` reales (`Clima 2025`, `Clima 2024`, `preguntas-sin-seccion`, `Clima Organizacional - Q1 2025`) se parsean de verdad.
- Los dos archivos de participantes traen el roster real de 28 participantes en la hoja `participantes`,
  así que abrir el `.xlsx` corrobora lo que muestra la UI. El roster está espejado entre
  `src/mocks/participantsMocks.ts` y `scripts/generate-demo-samples.cjs`: si editas uno, edita el otro.
- `pesado`/`corrupto` tienen contenido válido pero se fuerzan por el token del nombre, para que la demo sea robusta en vivo.
- El PDF y el PNG tienen contenido mínimo: la estructura mostrada es un mock rotulado como simulado.
