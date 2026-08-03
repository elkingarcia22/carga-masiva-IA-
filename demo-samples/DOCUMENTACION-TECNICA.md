# Carga histórica de encuestas — Documentación técnica y funcional

> **Audiencia:** equipo de tecnología y PM.
> **Objetivo:** describir la funcionalidad completa del prototipo de carga de encuestas, todos los casos de uso (happy path, por formato, por tipo de pregunta, **por participantes/visibilidad** y de error), y las instrucciones para reproducir cada uno. Sirve como base para redactar las Historias de Usuario (HU) y los criterios de aceptación.
> **Estado:** prototipo (frontend). La detección/parseo real está implementada para el formato de exportación actual; varios casos "atípicos" y de error se **simulan de forma determinista** para la demo (ver §7). En producción deben implementarse contra el backend real.

---

## 0. Novedades de la última iteración

1. **Visibilidad Pública vs. Anónima como regla, no como elección** (§6 bis). Una encuesta solo
   puede ser pública si los archivos traen las respuestas de cada participante; en cualquier otro caso la
   opción se deshabilita y se explica por qué. Dos archivos demo:
   `Clima con participantes 2025.xlsx` y `Clima participantes sin respuestas 2025.xlsx`.
2. **Participantes detectados con tres escenarios de match** (§6 bis): hacen match, posibles match
   por nombre (requieren decisión humana) y **sin match en UBITS**, que se crean solo en la encuesta.
   Sección propia en el resumen, con un acordeón por escenario.
3. **El match automático es por `username` o por `correo`** (§6 bis). Antes se documentaba y se
   comunicaba en la UI como "solo por username" (presentando el correo como *una forma de* username).
   La regla correcta: el identificador del archivo se compara con el username del usuario y, si no
   coincide, con su **correo registrado** — aunque su username sea otro.
4. **Toda fila se puede corregir, incluido un match automático** (§6 bis). Un match automático es una
   suposición fuerte, no un hecho: cada participante ofrece **Dejar sin match** y **Asociar usuario**.
   Rechazar o re-apuntar un match **libera** el usuario que tenía tomado, para que quede disponible
   para otro participante.
5. **Asociar usuario en dos pasos, igual en los tres acordeones** (§6 bis). El botón abre —en la misma
   fila— un autocomplete del directorio más un botón **Asociar**: seleccionar no vincula, solo
   confirmar vincula. Antes el grupo sin match tenía un select suelto que vinculaba al instante.
   **Bug corregido de paso:** el autocomplete filtraba solo por `username`, así que buscar "isidora"
   devolvía *"Ningún usuario coincide"* aunque esa usuaria existiera. Ahora el filtro corre sobre el
   nombre visible **y** el username (`SearchableSelect`, usado también fuera de este flujo).
6. **Estado intermedio tras iniciar una carga** (F4b, §5): cuando el lote trae más encuestas sin
   cargar, ya no se cae al tab "Cargas"; aparece "Carga iniciada" con la **carga en curso y su
   progreso arriba** y dos caminos, para que las pendientes no queden inalcanzables.
7. **Lenguaje unificado** (transversal). Se eliminó "persona" del producto y de este documento. Se
   distingue **usuario** (existe en UBITS) de **participante** (fila detectada en el archivo, que puede
   no tener usuario detrás): llamar "usuario" a un participante sin match sería falso justo donde
   importa.
8. **"Tipo de encuesta" ya no se pre-rellena ni se infiere: el usuario lo elige, y es obligatorio**
   (§4, §9). Antes, en ningún paso del wizard existía un campo para el tipo — se adivinaba a partir del
   texto del nombre (`inferSurveyType`, ya eliminado) recién al iniciar la carga, así que dos encuestas
   con nombres ambiguos podían quedar mal clasificadas sin que nadie lo revisara. Ahora "Datos
   generales" pide explícitamente **Clima / Cultura / NPS** (sin ninguna opción preseleccionada) y el
   botón **Siguiente permanece deshabilitado** hasta elegir uno, igual que con nombre y fechas.

---

## 1. Resumen de la funcionalidad

Permite **cargar encuestas históricas** (de tipo Clima, Cultura o NPS) subiendo uno o varios archivos exportados. El sistema:

1. Recibe los archivos y los **valida** (tipo y tamaño).
2. **Analiza y detecta** automáticamente la estructura: participación, favorabilidad, eNPS, demográficos, secciones (dimensiones) y preguntas (con su **tipo/escala/valoración** según la taxonomía UBITS).
3. Cuando los archivos traen participantes, **los detecta** y los resuelve contra UBITS por username o correo: match automático, posible match por nombre (requiere decisión) o sin match (§6 bis).
4. **Deriva la visibilidad**: solo puede ser pública si hay respuestas por participante; si no, se fuerza anónima y se explica el motivo (§6 bis).
5. Agrupa por **ola/año** (una encuesta por año; nunca mezcla años distintos).
6. Presenta un **asistente (wizard)** para confirmar datos generales y revisar indicadores, participantes y estructura antes de cargar.
7. Ejecuta la **carga** mostrando progreso, con manejo de éxito y de error. Si el lote trae más encuestas sin cargar, ofrece un **estado intermedio** para continuar con ellas (F4b).

### Flujo de pantallas (wizard)
```
dropzone → [analizando…] → select (si hay varias encuestas)
                          → general (datos generales) → summary (estructura) → Cargar
                                                                                │
                     ┌──────────────────────────────────────────────────────────┤
                     │ ¿quedan encuestas del mismo lote?                        │
                     ▼ sí                                                       ▼ no
              next-action (estado intermedio)                             loading (tab "Cargas")
              │  (arriba: la carga en curso con su progreso en vivo)
              ├─ Cargar otra encuesta  → select (si ≥2) | general (si queda 1)
              └─ Cargar una nueva encuesta → dropzone (descarta las pendientes)

Estados transversales: error (bloqueante de análisis) · empty (nada detectado)
```

---

## 2. Arquitectura y puntos de código

| Capa | Archivo | Responsabilidad |
|------|---------|-----------------|
| Orquestación de análisis | `src/lib/surveyImport/index.ts` → `analyzeUploaded()` | Decide escenario demo o pipeline real; devuelve `AnalyzeOutcome`. |
| Escenarios demo | `src/lib/surveyImport/demoScenarios.ts` | Dispara casos por nombre/tipo de archivo; helpers `resolveDemoScenario`, `buildMockExtractionResult`, `buildEmptyStructureResult`, `buildParticipantsWithAnswersResult`, `buildParticipantsWithoutAnswersResult`, `findExistingDuplicate`, `isEmptyAnalysis`. |
| Visibilidad y participantes | `src/lib/surveyImport/visibility.ts` | Decide si la encuesta puede ser Pública (`publicVisibilityBlock`) y sus mensajes de bloqueo; agrupa los participantes en los tres escenarios de match (`splitParticipantsByMatch`, `effectiveMatchStatus`) y evita vincular un mismo usuario dos veces (`linkedUsernames`). |
| Mocks de participantes | `src/mocks/participantsMocks.ts` | `DEMO_PARTICIPANT_ROSTER` (los 28 participantes de los archivos demo) y `UBITS_DIRECTORY` (directorio que alimenta el autocomplete). |
| Parseo real | `src/lib/surveyImport/parseFile.ts` (`detectFormat`), `parseGerenciaReport.ts`, `parseRawFormat.ts` | Lee el Excel y extrae la estructura. |
| Agregación | `src/lib/surveyImport/aggregate.ts` → `aggregateParsedFiles()` | Agrupa por año, combina archivos, calcula métricas ponderadas. Deja `participants: null` (ningún formato agregado trae participantes). |
| Validación de archivos | `src/components/upload/uploadUtils.ts` → `validateFiles()`, `getFileKind()` | Tipo y tamaño; mensajes en español. |
| UI del flujo | `src/screens/EncuestasDashboard.tsx` | Wizard y sus estados (incluido `next-action`), clasificación de preguntas (`classifyQuestion`), secciones del resumen, `ParticipantRow`, lista/tray de cargas. Tipo de encuesta: `SURVEY_TYPE_OPTIONS` (`Clima`/`Cultura`/`NPS`) y `SurveyReviewItem.type`, sin valor por defecto — se exige en `canProceedFromGeneral`. |
| Tarjeta de carga | `src/screens/EncuestasDashboard.tsx` → `UploadTaskCard` | Una carga de esta sesión con su progreso en vivo. **Compartida** por el tab "Cargas" y el estado intermedio (F4b), para que la carga en curso se vea igual en los dos sitios. |
| Autocomplete | `src/components/forms/SearchableSelect.tsx` | Combobox con búsqueda. El filtro corre sobre `label + value`, así que se busca **por nombre o por username** (antes solo matcheaba el `value`, de modo que buscar por nombre no encontraba nada). |

**Pipeline real:** `parseSurveyFiles` → `parseSurveyFile` → `detectFormat` → `parseGerenciaReport` | `parseRawFormat` → `aggregateParsedFiles`.

---

## 3. Formatos soportados y validación

- **Aceptados (validación de subida):** `.csv, .xls, .xlsx, .pdf, .png, .jpg, .jpeg`. **Tamaño máx.: 10 MB.**
- **Parseables realmente (hoy):**
  - **`gerencia-report`** — Excel con hojas `Clima` / `Engagement` / `eNPS` (pivotes por área o por demográfico). Es el formato de la exportación real.
  - **`raw`** — Excel con hojas `answers` / `Dimensions` / `colaboradores` (una fila por respondiente). Único que da **participación exacta** y **eNPS real** (calculado de puntajes 0–10).
- **Limitaciones conocidas (deuda para producción):**
  - **CSV** se acepta pero **no se reconoce** (el parser identifica el formato por nombres de hoja). → HU: soportar CSV real.
  - **PDF / imágenes** se aceptan pero la extracción es **simulada** (mock). → HU: extracción real (OCR/IA).
  - **Hoja `participantes`** (una fila por participante con su identificador y sus respuestas): los dos archivos
    demo de §6 bis la traen con datos reales y consistentes, pero **hoy no se parsea** — esos casos se
    disparan por el nombre del archivo. → HU: parser real de este formato, que es el único que
    habilita la carga pública.

---

## 4. Happy path (camino feliz) — REAL

**Descripción:** el usuario sube un archivo (o set) válido y bien formado; el sistema detecta toda la estructura y permite cargar la encuesta.

**Pasos:**
1. Clic en el ícono **Subir** (flecha ↑) en la barra de "Lista de encuestas" → abre el panel "Cargar encuestas".
2. Arrastra o selecciona el/los archivo(s) → clic en **Analizar archivos**.
3. Pantalla **"Analizando archivos"** (progreso).
4. **Datos generales**: nombre (pre-rellenado, editable), **tipo de encuesta** (Clima/Cultura/NPS — **sin preseleccionar, obligatorio**, ver §9), visibilidad (Pública/Anónima — derivada, ver §6 bis), umbral de anonimato, fechas de inicio/cierre (pre-rellenados, editables) → **Siguiente** (deshabilitado hasta completar nombre, tipo y fechas).
5. **Estructura**: el resumen se lee en tres secciones — **Indicadores detectados**, **Participantes detectados** (solo si los archivos traen participantes) y **Estructura detectada** → **Cargar encuesta**.
6. **Cargando** con barra de progreso → **completada** (aparece "Ver encuesta" en la lista de cargas). Si el lote traía más encuestas, primero aparece el estado intermedio de F4b.

**Datos que se detectan y muestran:**
- **Indicadores:** **Participación** (%, respondieron / invitados), **Favorabilidad neta** (%positivos − %negativos), **eNPS** (real o aproximado, marcado con `*`).
- **Participantes** (cuando los hay): hacen match con UBITS · posibles match por nombre · sin match en UBITS (§6 bis).
- **Estructura:** **Demográficos** (cortes detectados), **Secciones** (dimensiones) y **Preguntas** (agrupadas por sección, con badges de tipo/escala/valoración).

**Reproducir (demo):**
- **1 archivo real:** `demo-samples/encuesta-real/Resultdos Clima total QS 2025.xlsx` → favorabilidad, eNPS, demográficos, 7 secciones · 44 preguntas (participación N/D con este archivo solo).
- **Set completo real:** subir los 10 archivos `*2025*.xlsx` de `demo-samples/encuesta-real/` juntos → participación 86.9%, eNPS real, todo completo (una sola encuesta 2025).
- **Sintético:** `demo-samples/Clima 2025.xlsx`.

**Criterios de aceptación (HU):**
- Dado un archivo válido, cuando se analiza, entonces se muestran datos generales pre-rellenados y la estructura detectada.
- Dado el paso "Datos generales", cuando se entra a él, entonces el campo **"Tipo de encuesta" llega vacío** (ninguna opción preseleccionada) y el botón **Siguiente** permanece deshabilitado hasta que el usuario elija Clima, Cultura o NPS.
- Los indicadores sin dato muestran **N/D** (no 0).
- El eNPS aproximado (derivado de favorabilidad) se marca con `*`; el eNPS real (de puntajes 0–10) no.

---

## 5. Casos de uso POR FORMATO

| # | Formato | Comportamiento | Archivo demo | Estado |
|---|---------|----------------|--------------|--------|
| F1 | Excel `gerencia-report` (Clima/Engagement/eNPS) | Parseo real completo. | `encuesta-real/*` , `Clima 2025.xlsx` | REAL |
| F2 | Excel `raw` (answers/colaboradores) | Parseo real con participación y eNPS exactos. | `encuesta-real/Resultados Encuesta de Clima 2025.xlsx` | REAL |
| F3 | Varios Excel del mismo año | Se combinan en **una sola encuesta** (consolidado + por área + raw). | set `*2025*` | REAL |
| F4 | Varios Excel de **años distintos** | Se detectan **varias encuestas** → paso **"Selecciona la encuesta"** (una a la vez). Al cargar una, el lote no se pierde: ver F4b. | `Clima 2024.xlsx` + `Clima 2025.xlsx` | REAL |
| F4b | **Lote con encuestas pendientes** | Al pulsar "Cargar encuesta" con otras encuestas del mismo lote sin cargar, **no cae en el tab "Cargas"**: aparece el estado intermedio **"Carga iniciada"**. Arriba, la **carga en curso con su progreso en vivo** (encabezado *"Carga en curso"* + chip *"En segundo plano"*; al terminar pasa a *"Última carga"*), usando la **misma tarjeta** que el tab "Cargas" (`UploadTaskCard`). Debajo, *"¿Qué quieres hacer ahora?"* con dos caminos — (1) **cargar otra encuesta** del lote (va a "Selecciona la encuesta" si quedan ≥2, o directo a datos generales si queda 1), (2) **cargar una nueva encuesta** (reinicia y descarta las pendientes). Ya **no existe** la opción "ver el estado de la carga actual": el progreso está a la vista, no detrás de un clic. En "Selecciona la encuesta" las ya cargadas quedan con check verde, "Ya la cargaste" y no se pueden elegir. El tab "Cargas" muestra un aviso **"N encuesta(s) pendiente(s) → Continuar"** para que nunca queden inalcanzables. Cuando ya no queda nada pendiente, se va directo al tab "Cargas" como antes. | `Clima 2024.xlsx` + `Clima 2025.xlsx` | REAL |
| F5 | **PDF / imagen** | Extracción **simulada**: muestra estructura estimada con **banner "Estructura estimada (simulada)"**. | `reporte-clima.pdf`, `encuesta.png` | MOCK |
| F6 | **CSV** | Aceptado en subida pero **no reconocido** (cae en "sin estructura"). | — | Limitación |
| F7 | Tipo no permitido (`.zip`, `.docx`, …) | **Bloqueado en validación** al seleccionarlo (toast). | `no-soportado.zip` | REAL |

---

## 6. Casos de uso POR TIPO DE PREGUNTA (taxonomía UBITS)

La clasificación es **presentacional** (badges, agrupación, filtro); **no** altera el cálculo de métricas. Se infiere por heurística de texto (prototipo). El importador productivo debería leer el tipo real del origen.

### Taxonomía detectada
- **Tipo de pregunta:** Escala de valoración · Pregunta abierta · Opción única · Múltiples respuestas · Desplegable · **Sin reconocer**.
- **Tipo de escala** (si Escala de valoración): Likert · NPS · Visual por estrellas · Visual por emociones · Escala lineal.
- **Tipo de valoración** (si Likert): Acuerdo · Frecuencia · Satisfacción · Probabilidad.

### Cómo se agrupan en "Estructura → Secciones y preguntas"
- Preguntas **reconocidas** → bajo su **sección** (dimensión), cada una con sus badges.
- **eNPS**: preguntas NPS sin sección → grupo propio **"eNPS"**.
- **Sin sección**: preguntas reconocidas sin dimensión → grupo **"Sin sección"** con nota (no afectan métricas; son independientes).
- **Sin reconocer**: preguntas que no calzan con ningún tipo UBITS → **acordeón separado "Preguntas sin reconocer"** + **Alert ámbar prominente** por fuera (ver T-SR abajo).
- Filtros: por **sección** y por **tipo** (opciones dinámicas según lo detectado).

| # | Tipo/Escala | Cómo se demuestra (texto de la pregunta) |
|---|-------------|------------------------------------------|
| T1 | Likert · **Acuerdo** | Enunciado de acuerdo (default). "Estoy de acuerdo con…" |
| T2 | Likert · **Frecuencia** | "¿Con qué frecuencia…?", "nunca/siempre" |
| T3 | Likert · **Satisfacción** | "¿Qué tan satisfecho…?" |
| T4 | Likert · **Probabilidad** | "¿Qué tan probable…?" (sin recomendación) |
| T5 | **NPS** | "…recomiendes…", "escala de 0 a 10" |
| T6 | **Estrellas** | "Califica con estrellas…" |
| T7 | **Emociones** | "¿Cómo te sientes…?" |
| T8 | **Lineal** | "En una escala de 1 a 7…" |
| T9 | **Pregunta abierta** | "Cuéntanos…", "comentario", "describe" |
| T10 | **Opción única** | "Selecciona tu…", "elige tu…" |
| T11 | **Múltiples respuestas** | "Selecciona todas las que apliquen" |
| T12 | **Desplegable** | "Elige de la lista…" |
| T-SR | **Sin reconocer** | Ranking/matriz: "Ordena de mayor a menor…", "Distribuye 100 puntos…" |

**Reproducir:** `demo-samples/Encuesta tipos variados 2025.xlsx` (incluye una de cada tipo + 2 sin reconocer).

**Caso especial — "Sin reconocer" (T-SR):**
- Se muestra en un **acordeón aparte** ("Preguntas sin reconocer") con conteo, fuera de "Secciones y preguntas".
- **Alert ámbar prominente** (siempre visible): *"No coinciden con los tipos de UBITS. Si cargas la encuesta así, estas preguntas no aportarán a las métricas (favorabilidad/eNPS) ni podrán filtrarse ni segmentarse."*
- **Criterio de aceptación:** la encuesta **sí se puede cargar** con esas preguntas (no bloquea), pero el usuario queda advertido.

---

## 6 bis. Casos de uso POR PARTICIPANTES (visibilidad Pública vs. Anónima)

**Regla de negocio:** la visibilidad **no es una elección libre del usuario**. Una encuesta solo
puede cargarse como **Pública** (con nombre y apellido) si los archivos traen **una fila por
participante con las respuestas de ese participante**. Sin ese vínculo respuesta↔participante no hay nada que
mostrar identificado, así que la opción Pública se **deshabilita** y se explica por qué.

**Criterio de match con UBITS:** el identificador que trae el archivo (un correo, un número de
documento o un username) se compara con el **username** del usuario en UBITS y, si no coincide, con su
**correo registrado** — así un participante identificado por correo hace match aunque su username sea
otro. Esos dos son los únicos criterios automáticos: **el nombre nunca vincula solo**.

**Los tres escenarios de participante.** Viven en su **propia sección del resumen**
("PARTICIPANTES DETECTADOS · N"), al mismo nivel que "Indicadores detectados" y "Estructura
detectada", con **un acordeón independiente por escenario**:

| Acordeón | Estado | Qué significa |
|----------|--------|----------------|
| **Hacen match con UBITS** | `matched` | Su identificador coincide con el **username** o el **correo registrado** de un usuario de UBITS. Se vincula automáticamente; sus respuestas suman a los reportes y segmentaciones de UBITS. Un match automático es una **suposición fuerte, no un hecho**: cada fila ofrece *"Dejar sin match"* (pasa a "Sin match en UBITS") y **Asociar usuario** (lo apunta a otro usuario). |
| **Posibles match** | `possible` | Su identificador **no** coincide con el username ni con el correo de ningún usuario, pero su **nombre y apellido son idénticos** a los de uno. **No se vincula solo**: se muestra el usuario candidato con su username y su contexto (área · cargo · sede, para distinguir homónimos) y tres acciones — *"Sí, es el mismo usuario"* (pasa a "Hacen match"), *"Dejar sin match"* (pasa a "Sin match en UBITS") o **Asociar usuario** (lo apunta a otro usuario del directorio). |
| **Sin match en UBITS** | `unmatched` | Ni el username, ni el correo, ni el nombre coinciden con un usuario de UBITS. Se crean como participantes solo de esta encuesta. Además ofrecen **Asociar usuario** para vincularlos a mano: el botón abre, en la misma fila, un **autocomplete** del directorio de UBITS más un botón **Asociar** que confirma (nada se vincula al solo seleccionar). Se busca por nombre o username, cada opción muestra su contexto, y los usuarios ya vinculados a otro participante aparecen **deshabilitados** ("ya vinculado a otro participante") para que un mismo usuario no quede atado a dos participantes. Rechazar o re-apuntar un match **libera** el usuario que tenía tomado. |

Toda decisión (confirmar, rechazar o vincular a mano) queda **visible y reversible** con un chip
*"Vinculado a {usuario}"* / *"Sin usuario · se crea en la encuesta"* + **Deshacer**, desde el acordeón
donde haya quedado el participante. Con una decisión tomada la fila se reduce al chip: los datos del
candidato solo se muestran mientras la decisión está pendiente. Los contadores de los tres acordeones se recalculan en vivo.

**Tratamiento visual del recuadro de candidato** (posibles match): recuadro **neutro** (gris, borde
sutil, radio pequeño), no ámbar. El único color de la fila es el resultado — chip verde al vincular,
chip gris al dejar sin match. Un posible match no es un error ni una advertencia: es una decisión
pendiente, y pintarla de ámbar competía con los estados que sí importan. Por la misma razón se quitó
el alert ámbar *"N posibles match por nombre"* que iba sobre los acordeones.

El contador del acordeón **Posibles match** es el único aviso de que quedan decisiones pendientes: si
se carga sin decidir, esos participantes se crean sin usuario dentro de la encuesta, como dice su nota.

Sobre los tres acordeones, una nota corta explica el criterio: *"Como la encuesta es **pública**, cada
respuesta queda asociada a un usuario. Vinculamos por **username** o **correo** de UBITS. El nombre
nunca vincula solo."* No enumera las formas que puede tomar un username (correo / número de documento /
username asignado) porque **cada fila ya rotula la suya** debajo del identificador.

| # | Caso | Disparador (demo) | Comportamiento esperado | Estado |
|---|------|-------------------|-------------------------|--------|
| P1 | **Participantes con sus respuestas** | Nombre con `participantes` (ej. `Clima con participantes 2025.xlsx`) | Se detecta automáticamente como **Pública** (radio preseleccionado, ambos habilitados). Aparece la sección **PARTICIPANTES DETECTADOS · 28** con los tres acordeones (Hacen match 18 · Posibles match 4 · Sin match 6). | token demo |
| P2 | **Participantes sin respuestas individuales** | Nombre con `participantes` **+** `sin respuestas` / `sin-respuestas` / `anonima` | **Pública deshabilitada** (gris, no clickeable) + nota con candado: *"Detectamos participantes, pero sus respuestas no están asociadas a cada participante. Sin ese vínculo la encuesta solo puede cargarse como anónima."* Se fuerza **Anónima** y aparece el **Umbral de anonimato**. La sección de participantes se muestra igual, con la aclaración de anonimato en su nota. | token demo |
| P3 | **Archivos agregados (todos los demás casos)** | Cualquier otro archivo del set demo y el pipeline real | **Pública deshabilitada** + nota: *"Los archivos traen resultados agregados, no participantes con sus respuestas individuales. Por eso esta encuesta solo puede cargarse como anónima."* Se fuerza Anónima. Aplica a `Clima 2025`, `encuesta-real/*`, PDF/imagen, etc. | REAL |

**Cifras de los archivos demo** (para verificar que la demo corre bien):

| Qué mostrar | `Clima con participantes 2025.xlsx` (P1) | `Clima participantes sin respuestas 2025.xlsx` (P2) |
|---|---|---|
| Visibilidad | **Pública** (preseleccionada, editable) | **Anónima** forzada, Pública deshabilitada |
| Participación | 87.5% (28 de 32) | 87.5% (28 de 32) |
| Favorabilidad neta | 65 (74% fav. − 9% desfav.) | 60 (71% − 11%) |
| eNPS | **50**, real (18 promotores / 6 neutrales / 4 detractores) | **40\***, aproximado de datos agregados |
| Participantes | 28 → 18 match · 4 posibles · 6 sin match | 28 → 18 match · 4 posibles · 6 sin match |
| Secciones · preguntas | 4 · 11 | 4 · 11 |
| Demográficos | 4 (Área, Cargo, Sede, Antigüedad) | 3 (Área, Cargo, Sede) |

El eNPS de P1 no lleva `*` porque las respuestas 0–10 vienen por participante; el de P2 sí, porque solo
hay agregados.

**Puntos de código:**
- Regla: `src/lib/surveyImport/visibility.ts` → `publicVisibilityBlock()`, `PUBLIC_VISIBILITY_BLOCK_MESSAGE`, `splitParticipantsByMatch()`, `effectiveMatchStatus()`, `linkedUsernames()`.
- Tipos: `ParticipantsDetection` / `DetectedParticipant` / `UbitsDirectoryUser` / `ParticipantResolution` en `src/lib/surveyImport/types.ts` y `visibility.ts`; `DetectedSurveyAnalysis.participants` (null = agregado).
- Roster demo + directorio de UBITS para el autocomplete: `src/mocks/participantsMocks.ts` → `DEMO_PARTICIPANT_ROSTER` (espejado en `scripts/generate-demo-samples.cjs`) y `UBITS_DIRECTORY`.
- UI: sección "Participantes detectados", `ParticipantRow` y radio bloqueado en `src/screens/EncuestasDashboard.tsx`; el autocomplete reutiliza `src/components/forms/SearchableSelect.tsx` (dentro de `ParticipantRow`, `associateRow` y `associateTrigger` son la **misma** pieza en los tres acordeones).

**Criterios de aceptación (HU):**
- Dado un archivo con participantes y sus respuestas, cuando se analiza, entonces la visibilidad queda en **Pública** por defecto y se listan los participantes con y sin match en UBITS.
- Dado un archivo sin respuestas por participante (o agregado), cuando se llega a "Datos generales", entonces **Pública está deshabilitada** con el motivo visible y la encuesta solo puede cargarse **Anónima**.
- El match automático compara el identificador del archivo con el **username** del usuario (que puede ser un correo, un número de documento o un username asignado) y, si no coincide, con su **correo registrado** — así un participante identificado por correo hace match aunque su username sea otro. Los no encontrados se crean dentro de la encuesta y se informan explícitamente antes de cargar.
- Dado un participante cuyo **nombre y apellido** coinciden con los de un usuario de UBITS pero cuyo identificador no, entonces **no se vincula automáticamente**: se muestra como *posible match* con el usuario candidato y su contexto, y solo se vincula si el revisor lo confirma.
- Dado un participante con match automático, cuando el revisor elige **"Dejar sin match"**, entonces pasa a "Sin match en UBITS" y el usuario que tenía tomado **queda disponible** para otro participante.
- Dado un participante ya resuelto (por cualquier vía), entonces su fila se reduce al **chip de resultado + Deshacer**: los datos del usuario candidato solo se muestran mientras la decisión está pendiente.
- Si se carga la encuesta con posibles match sin resolver, esos participantes **se crean dentro de la encuesta** (comportamiento por defecto, explicado en la nota del acordeón).
- Dado cualquier participante, cuando se pulsa **Asociar usuario**, se busca en el autocomplete (por nombre o por username) y se confirma con **Asociar**, entonces queda **vinculado a ese usuario** y pasa al acordeón "Hacen match con UBITS". Seleccionar sin confirmar no vincula nada.
- Un usuario de UBITS **no puede vincularse a dos participantes** del mismo lote: en el autocomplete aparece deshabilitado indicando que ya está vinculado.
- Toda vinculación manual o decisión sobre un match es **reversible** con "Deshacer", que devuelve al participante al grupo donde lo dejó la detección.

**Deuda para producción:** hoy P1/P2 se disparan por token, y tanto el roster como el directorio de
UBITS son mock. En backend: leer el roster real del archivo, resolver el identificador (username y correo) contra el
directorio real de UBITS, servir el autocomplete con búsqueda paginada en el backend (hoy filtra en
cliente sobre una lista fija), y decidir `answersLinked` a partir de la estructura real del origen
(no del nombre del archivo).

---

## 7. Casos de ERROR (separados)

| # | Caso | Disparador (demo, por nombre/tipo) | Comportamiento esperado | Bloquea | Estado |
|---|------|-----------------------------------|-------------------------|---------|--------|
| E1 | **Tipo no permitido** | Extensión fuera de la lista (ej. `no-soportado.zip`) | Toast en español: *"El tipo de archivo ".zip" no está permitido…"*. No abre el panel/no analiza. | Sí | REAL |
| E2 | **Archivo muy grande** | Nombre con `pesado`/`grande` **o** >10 MB real | Pantalla de error: *"Archivo demasiado grande — El archivo supera el límite de 10 MB…"* | Sí | tamaño REAL / token demo |
| E3 | **Archivo dañado/no legible** | Nombre con `corrupto`/`danado`/`dañado` | Pantalla de error: *"No pudimos leer el archivo — parece estar dañado o protegido con contraseña…"* | Sí | token demo (real: parser lanza → error) |
| E4 | **Reconocido pero sin estructura** | Nombre con `sin-estructura`/`vacio` | **Empty state** (no ceros): *"No encontramos datos de encuesta…"* + botón **"Subir otra encuesta"**. | Sí | token demo (real: parseo vacío) |
| E5 | **Nada detectado en todo el lote** | (todos los archivos no reconocidos) | Empty state equivalente. | Sí | REAL |
| E6 | **Encuesta duplicada** | Nombre = encuesta ya cargada (ej. `Clima Organizacional - Q1 2025.xlsx`) | En "Datos generales", al pulsar **Siguiente**: el campo **"Nombre de la encuesta" se pone rojo** con hint *"Ya existe una encuesta llamada … Usa otro nombre para continuar."* No avanza. Al editar el nombre a uno libre, se limpia y avanza. El botón **Siguiente permanece habilitado** (valida al enviar). | Sí (hasta renombrar) | REAL-contra-mock |
| E7 | **Falla el paso final de carga** | Nombre con `falla-carga`/`error-carga` | La carga **avanza con progreso** y se **atasca a mitad (~62–80%)**; luego el ítem pasa a estado **fallido inline** en la **lista de cargas** y en el **tray minimizado**: ícono rojo, *"No pudimos cargarla — problemas técnicos"*, barra roja y botón **"Reintentar"**. No es pantalla completa. | El ítem (reintentable) | token demo |
| E8 | **Archivos excluidos** (lote mixto) | Algunos reconocidos + otros no | Alert *"Algunos archivos fueron excluidos"* con el detalle, visible aun cuando se detecta una sola encuesta. | No (informativo) | REAL |

**Validaciones de sanidad adicionales (en "Datos generales"):**
- Participación > 100% → nota de advertencia.
- Fecha de cierre anterior a la de inicio → mensaje inline + bloquea Siguiente.
- Umbral de anonimato no numérico o < 1 → mensaje inline + bloquea Siguiente.
- Año no detectado (grupo `unknown-year`) → nota "No detectamos el año…".

---

## 8. Instrucciones para ejecutar (paso a paso)

### Preparación
```bash
# 1. Generar los archivos de muestra (crea/actualiza demo-samples/)
node scripts/generate-demo-samples.cjs

# 2. Levantar el proyecto
npm install   # si es la primera vez
npm run dev   # abre http://localhost:5173
```

### Ejecutar un caso
1. Abrir `http://localhost:5173`.
2. En "Lista de encuestas", clic en el ícono **Subir** (flecha ↑).
3. Arrastrar/seleccionar el/los archivo(s) desde `demo-samples/` (ver tabla de disparadores).
4. Seguir el wizard según el caso.

### Tabla rápida archivo → caso
| Archivo | Caso |
|---------|------|
| `encuesta-real/*` (set 2025) | Happy path con datos reales (F1–F3) |
| `Clima 2025.xlsx` | Happy path sintético |
| `Clima 2024.xlsx` + `Clima 2025.xlsx` | Varias encuestas / select (F4) **y** estado intermedio tras cargar la primera (F4b) |
| `preguntas-sin-seccion.xlsx` | Grupos eNPS / Sin sección |
| `Encuesta tipos variados 2025.xlsx` | Taxonomía completa + Sin reconocer (§6) |
| `Clima con participantes 2025.xlsx` | Participantes con respuestas → Pública automática + sección "Participantes detectados" con los 3 acordeones y el autocomplete (P1) |
| `Clima participantes sin respuestas 2025.xlsx` | Participantes sin respuestas → Pública bloqueada, Anónima forzada (P2) |
| `reporte-clima.pdf` / `encuesta.png` | Extracción simulada (F5) |
| `no-soportado.zip` | Tipo no permitido (E1) |
| `pesado.xlsx` | Archivo muy grande (E2) |
| `corrupto.xlsx` | Dañado/no legible (E3) |
| `sin-estructura.xlsx` | Sin estructura / empty state (E4) |
| `Clima Organizacional - Q1 2025.xlsx` | Duplicado (E6) |
| `falla-carga 2025.xlsx` | Falla del paso final (E7) |

> **Convención de disparo (demo):** el escenario se decide por el **nombre/extensión** del archivo (case-insensitive). Si ningún token coincide, corre el **pipeline real**. Tokens: `pesado`/`grande`, `corrupto`/`danado`, `sin-estructura`/`vacio`, `participantes` (+ `sin respuestas`/`anonima` para la variante anónima), `falla-carga`/`error-carga`; extensiones `pdf`/`png`/`jpg`.

---

## 9. Notas para el PM (redacción de HU)

- **Separar por épica:** (a) Subida y validación, (b) Análisis y detección, (c) Confirmación de datos generales, (d) **Participantes y visibilidad**, (e) Revisión de estructura, (f) Carga y resultado (incluido el lote con pendientes), (g) Manejo de errores.
- **Cada caso de §5–§7 = candidato a HU** con sus criterios de aceptación (Given/When/Then).
- **Marcar deuda técnica explícita** para lo que hoy es MOCK/heurística y debe ser real en backend:
  1. Extracción real de **PDF/imágenes** (F5).
  2. Soporte real de **CSV** (F6).
  3. **Detección real del tipo de pregunta** desde el origen, no por heurística de texto (§6).
  4. Errores reales de **archivo grande/corrupto/sin estructura** (E2–E4) contra validación/parseo real.
  5. **Duplicados**: definir la regla real de unicidad (nombre + año + tipo) en backend (E6).
  6. **Falla de carga** (E7): manejo real de error de servidor + reintento idempotente.
  7. **Participantes** (§6 bis): parsear la hoja `participantes` de verdad, resolver el identificador (username y correo) contra el directorio real de UBITS, derivar `answersLinked` de la estructura del origen, y servir el autocomplete con búsqueda paginada en backend (hoy filtra en cliente sobre una lista fija).
  8. **Persistencia de las decisiones** (§6 bis): hoy las vinculaciones manuales viven en estado de UI y se pierden al salir del wizard; deben viajar al backend junto con la carga.
- **Reglas de negocio a confirmar:**
  - ¿Las preguntas "Sin reconocer" se cargan igual (con advertencia) o se excluyen? Hoy: se cargan con advertencia.
  - ¿Los **posibles match sin resolver** se crean dentro de la encuesta (hoy) o deben **bloquear** la carga hasta decidirse?
  - ¿Se permite **cambiar a anónima** una encuesta que sí podría ser pública? Hoy sí: la regla solo bloquea el camino inverso.
  - ¿Qué pasa con las **encuestas pendientes de un lote** si el usuario elige "Cargar una nueva encuesta"? Hoy se descartan y se avisa en la tarjeta.
- **Tipos de encuesta permitidos:** Clima, Cultura, NPS. Desde esta iteración el usuario los **elige explícitamente** en "Datos generales" (radio sin preselección) y es **obligatorio** para avanzar — ya no se infiere del nombre de la encuesta. Pendiente de backend: validar que el tipo elegido sea consistente con el contenido real de los archivos (hoy solo se exige que el campo no esté vacío).

---

## 10. Glosario
- **Ola / año:** cada aplicación de la encuesta (ej. Clima 2024 vs 2025). Nunca se mezclan.
- **Favorabilidad neta:** %positivos − %negativos (estilo NPS).
- **eNPS:** %promotores − %detractores; **real** si viene de puntajes 0–10, **aproximado** (`*`) si se deriva de porcentajes por bucket.
- **Consolidado (total):** archivo que representa a toda la empresa; no se suma con los de área para evitar doble conteo.
- **Encuesta pública:** los resultados quedan asociados a cada usuario. Solo posible si el archivo trae las respuestas por participante.
- **Encuesta anónima:** los resultados no se atribuyen a nadie; se muestran por grupo respetando el **umbral de anonimato**.
- **Usuario de UBITS:** colaborador con cuenta en UBITS. Es a lo que se vincula un participante.
- **Participante:** fila detectada en el archivo. Puede tener un usuario de UBITS detrás o no — por eso no se le llama "usuario" hasta que haga match.
- **Username de UBITS:** identificador único del usuario; puede ser su correo, su número de documento o un username asignado.
- **Correo registrado:** el correo del usuario en UBITS. Segundo criterio de match, para cuando el username es otra cosa.
- **Match automático:** el identificador que trae el archivo coincide con el **username** o el **correo registrado** de un usuario de UBITS → se vincula sin intervención. Es reversible: el revisor puede dejarlo sin match o apuntarlo a otro usuario.
- **Posible match:** el identificador no coincide con el username ni con el correo de ningún usuario, pero el **nombre y apellido** son idénticos a los de uno. Nunca se vincula solo; requiere que el revisor confirme o rechace.
- **Sin match en UBITS:** ni el username, ni el correo, ni el nombre coinciden con un usuario. Se crea dentro de la encuesta y no queda atado a ningún usuario, salvo que se lo vincule a mano.
- **Asociar usuario:** vincular un participante a un usuario elegido en el autocomplete del directorio. Dos pasos: seleccionar y **confirmar con "Asociar"**. Reversible con "Deshacer".
- **Dejar sin match:** descartar el usuario que el sistema propuso (o encontró) para un participante. Lo manda a "Sin match en UBITS" y libera ese usuario.
- **Lote:** el conjunto de encuestas detectadas en una misma subida de archivos. Se carga **una a la vez**; las que quedan son las "pendientes" del lote (F4b).
