# Carga masiva de objetivos con IA — Documentación técnica y funcional

> **Audiencia:** equipo de tecnología y PM.
> **Objetivo:** describir la funcionalidad completa del prototipo de carga masiva de objetivos, **todos** los casos de uso (las tres operaciones, la alineación de usuarios, la alineación de objetivos, las reglas de cálculo, los casos de error y los de fallo de escritura), y las instrucciones para reproducir cada uno archivo por archivo. Sirve como base para redactar las Historias de Usuario (HU) y los criterios de aceptación.
> **Estado:** prototipo (frontend). **El parseo es real**: los `.xlsx` de `demo-samples/objetivos/` se leen de verdad con `xlsx`, y toda la revisión (alineación, reglas, cálculo de cumplimiento, regla del 100%) corre sobre lo que traen. Lo simulado es la **escritura** contra el backend y **tres casos de archivo roto** que se disparan por el nombre (ver §11.2 y §14).

---

## 0. Cómo leer este documento

| Si buscas… | Ve a |
|---|---|
| Qué hace la funcionalidad y su flujo de pantallas | §1 |
| En qué archivo vive cada cosa | §2 |
| Qué formatos y tamaños se aceptan | §3 |
| Las tres operaciones y sus plantillas | §4 |
| **Qué pasa si el archivo no es de la operación elegida** | §4.1 |
| El camino feliz | §5 |
| Cómo se alinea el **usuario** (los 3 estados y sus 8 vías) | §6 |
| Cómo se alinea el **objetivo** (solo editar/actualizar) | §7 |
| Todas las reglas de validación y de cálculo (R0–R6) | §8 |
| La regla del 100% y cómo se cuenta el peso | §9 |
| Las 4 pestañas de la revisión y qué te mete en cada una | §10 |
| Los casos de error del archivo | §11 |
| La escritura, el fallo de carga y el reintento | §12 |
| **El instructivo: qué archivo subir para ver cada caso** | §13 |
| Deuda técnica y decisiones pendientes | §14 |
| Glosario | §15 |

---

## 1. Resumen de la funcionalidad

Permite **cargar objetivos en bloque dentro de un ciclo** a partir de un archivo Excel/CSV. A diferencia de una acción masiva sobre filas seleccionadas, la entrada es un archivo, así que la selección de la tabla no interviene.

El sistema:

1. Pide **elegir la operación** — crear, editar o actualizar avances — antes de subir nada. Cada una espera una plantilla distinta (§4).
2. Recibe los archivos y los **valida** (extensión y tamaño) antes de analizarlos.
3. **Lee la plantilla de verdad**: ubica el encabezado por nombre de columna, normaliza números en formato es-CO/en-US, e infiere tipo de medida y dirección (§3.3).
4. **Alinea cada identificador con un usuario de UBITS** por username o correo; si no hay coincidencia exacta, propone por documento, teléfono, nombre o parte del correo (§6).
5. En editar y actualizar, **alinea además cada fila con un objetivo existente** de esa persona, por nombre normalizado (§7).
6. Corre las **reglas de negocio** (R0–R6, límites de campo y la regla del 100%) sobre cada fila y sobre cada persona, **en cada tecla** (§8, §9).
7. Reparte a cada persona en **una de cuatro pestañas** según lo que le falta, y **solo carga las de "Alineados"** (§10).
8. Ejecuta la **carga en segundo plano**, con progreso visible en la pestaña "Cargas" y en una bandeja flotante, y con manejo de fallo parcial y de servicio caído + reintento (§12).

### Flujo de pantallas

```
                        ┌──────────────── tab "Nueva carga" ────────────────┐
dropzone ───────────────┤  1. elegir operación (crear | editar | actualizar) │
   │                    │  2. soltar archivo(s)                              │
   │                    └────────────────────────────────────────────────────┘
   │  └─────────────── tab "Cargas": cargas en vivo + historial 7 días
   │
   ▼ "Analizar"
[overlay "Analizando archivos" ~5.1 s + 550 ms de retención]
   │
   ├─ outcome.kind === 'error' ─────────────────► error   (pantalla completa)
   ├─ 0 objetivos detectados ───────────────────► empty   (pantalla completa)
   └─ N objetivos detectados ───────────────────► summary (revisión, 86vw)
                                                     │
                                                     ├─ "Minimizar" → bandeja flotante
                                                     ├─ "Cancelar"  → confirmación → descarta
                                                     └─ "Cargar N objetivos alineados"
                                                            │
                                                            ▼
                                          dropzone + tab "Cargas" (la escritura corre detrás)
```

Los estados `error` y `empty` ofrecen **"Subir otro archivo"**, que limpia el error y vuelve al dropzone.

**Regla de cierre:** con una revisión en curso (`step === 'summary'` y hay grupos), la X, Escape y el clic fuera **minimizan** en vez de descartar. Sin revisión en curso, descartan. Descartar siempre pregunta antes.

---

## 2. Arquitectura y puntos de código

| Capa | Archivo | Responsabilidad |
|---|---|---|
| Orquestación | `src/lib/objectivesImport/index.ts` → `analyzeObjectivesFiles()` | Valida, parsea, agrupa, enlaza y devuelve `AnalyzeObjectivesOutcome`. Define `BULK_UPLOAD_MODES`. |
| Parseo real | `src/lib/objectivesImport/parseTemplate.ts` | `parseObjectivesWorkbook` / `parseObjectivesSheet`. Ubica el encabezado por alias, coerciona valores, decide escala de pesos. |
| Alineación de usuarios | `src/lib/objectivesImport/matchUsers.ts` | `buildUserIndex`, `matchIdentifier`, `detectIdentifierType`, `searchDirectory`. También `bucketForGroup` / `groupHasStructuralErrors` (el reparto en pestañas). |
| Alineación de objetivos | `src/lib/objectivesImport/matchObjectives.ts` | `matchObjectiveName`, `unclaimedObjectives`, `searchObjectives`. |
| Reglas y cálculo | `src/lib/objectivesImport/rules.ts` | `validateObjective`, `validateProgressUpdate`, `computeCompliance`, `resolveInitialValue`, `groupWeightTotal`, `describeGroupWeight`. |
| Tipos y derivados | `src/lib/objectivesImport/types.ts` | `ParsedObjective`, `ObjectiveUserGroup`, `groupResultingObjectives`, `groupUntouchedObjectives`, `hasSavedEdits`. |
| Validación de subida | `src/components/upload/uploadUtils.ts` → `validateFiles()` | Extensión, tamaño y cantidad; mensajes en español. |
| Wizard | `src/components/objetivos/CargaMasivaDrawer.tsx` | Pasos, tabs, overlay de análisis, tareas de carga, bandeja, reintento. |
| Tabla de revisión | `src/components/objetivos/ObjectivesReviewTable.tsx` | Las 4 pestañas, filtros, búsqueda, detección de "Usuario repetido". |
| Tarjeta por usuario | `src/components/objetivos/ObjectiveGroupHeader.tsx` | Chips, aviso de peso, botón Confirmar y sus motivos de bloqueo, unificación. |
| Fila de objetivo | `src/components/objetivos/ObjectiveReviewRow.tsx` | Celdas editables, chips por fila, mensajes de violación. |
| Selector de usuario | `src/components/objetivos/UserMatchPicker.tsx` | Autocomplete del directorio (busca por nombre, username, correo o documento). |
| Selector de objetivo | `src/components/objetivos/ObjectiveMatchPicker.tsx` | Autocomplete entre los objetivos de esa persona. |
| Datos de demo | `src/mocks/objetivosMocks.ts` | `SEEDED_ASSIGNED_USERS` (roster del ciclo `cyc-001`) y `UBITS_DIRECTORY`. |
| Generador de muestras | `scripts/generate-objetivos-samples.cjs` | Produce los 15 `.xlsx`/`.zip` de `demo-samples/objetivos/`. |

**Pipeline de análisis** (el orden importa y está documentado en el código):

```
validateFiles ──► getImmediateValidationError ──► analyzeObjectivesFiles
                                                          │
                       parseObjectivesWorkbook ◄──────────┤  (por archivo)
                                                          │
                       groupByUser ──────────────────────►│  resuelve la PERSONA
                       linkGroupObjectives ──────────────►│  resuelve el OBJETIVO
                       finalizeInitialReviewState ───────►│  marca lo ya listo
```

`linkGroupObjectives` **tiene que correr después** de `groupByUser`: busca el objetivo dentro de lo que ya tiene esa persona, así que primero hay que saber quién es.

---

## 3. Formatos, validación y parseo

### 3.1 Validación de subida (antes de analizar)

- **Extensiones aceptadas:** `.csv`, `.xls`, `.xlsx` (`OBJECTIVES_IMPORT_ACCEPT`).
- **Tamaño máximo:** **10 MB** (`OBJECTIVES_IMPORT_MAX_MB`).
- **Múltiples archivos:** permitido.

Mensajes exactos (`validateFiles`), en su orden de evaluación:

| # | Condición | Mensaje |
|---|---|---|
| 1 | varios archivos sin `multiple` | `Solo se permite un archivo.` |
| 2 | supera `maxFiles` | `Máximo {maxFiles} archivos permitidos.` |
| 3 | `file.size > 10 MB` | `"{nombre}" supera el límite de 10 MB.` |
| 4 | extensión no aceptada | `El tipo de archivo "{.ext}" no está permitido. Acepta Excel, CSV.` |

El mensaje de tipo se **arma solo** a partir de la lista de aceptados (`describeAccepted`), así que si mañana se acepta PDF el texto lo dice sin tocar la cadena.

### 3.2 Estructura que se lee

El parser ubica las columnas **por nombre, nunca por posición**, y esto no es una preferencia: las plantillas oficiales se contradicen entre sí — `create-goals-template` pone `cumplimiento_maximo` **antes** de `cumplimiento_minimo`, y `edite-goals-template` al revés. Leer por índice cambiaría silenciosamente un piso por un techo.

**Alias aceptados por campo** (`COLUMN_ALIASES`; gana el primero que aparezca de izquierda a derecha):

| Campo | Encabezados aceptados |
|---|---|
| `username` | `username`, `usuario`, `user`, `correo`, `email`, `documento` |
| `title` | `nombre_objetivo`, `objetivo`, `titulo`, `nombre_del_objetivo` |
| `newTitle` | `nombre_objetivo_nuevo` |
| `weight` | `peso`, `peso_porcentaje`, `ponderacion` |
| `measureType` | `tipo_medida`, `tipo_de_medida`, `medida` |
| `trend` | `aumentar_reducir`, `tendencia`, `direccion` |
| `initialValue` | `valor_inicial`, `inicial` |
| `minProgress` | `cumplimiento_minimo`, `minimo_avance`, `avance_minimo`, `minimo` |
| `maxProgress` | `cumplimiento_maximo`, `maximo_avance`, `avance_maximo`, `maximo` |
| `target` | `meta`, `target` |
| `description` | `descripcion_meta`, `descripcion`, `descripcion_objetivo` |
| `currentProgress` | `avance_actual`, `avance` |
| `newProgress` | `nuevo_avance`, `avance_nuevo`, `avance_a_registrar` |

La comparación es sobre el encabezado **normalizado**: sin tildes, en minúsculas, y con todo lo que no sea `[a-z0-9]` convertido en `_`. Así `"Valor Inicial"`, `"valor inicial"` y `"VALOR_INICIAL"` son la misma columna.

**Localización del encabezado:**

- Se escanean las primeras **25 filas** (`HEADER_SEARCH_DEPTH`).
- El encabezado es la primera fila que contenga a la vez una columna de `username` **y** una de `title` (`REQUIRED_COLUMNS`).
- Si ninguna de las 25 cumple → el parser devuelve `null` y esa hoja se descarta.
- `parseObjectivesWorkbook` recorre **todas las hojas** del libro y devuelve la primera que parezca plantilla. Una hoja con encabezado válido y cero filas **sí** cuenta como plantilla: se reporta vacía en vez de seguir a la siguiente hoja.

**Fin del bloque de datos:** **15 filas vacías consecutivas** (`BLANK_ROW_RUN_LIMIT`) cierran la lectura. Menos de 15 se tratan como separadores y se saltan.

**Filas descartadas:** las que llegan sin `username` o sin `title`. Se cuentan y se reportan como nota.

### 3.3 Coerción de valores

**Números (`toNumber`)** — devuelve `null` para vacíos, y eso importa: *un valor inicial ausente tiene que seguir siendo distinguible de un cero*, porque las reglas R6b/R6c dependen de esa diferencia.

| Entrada | Resultado |
|---|---|
| `(1.200)` | `-1200` — paréntesis contables = negativo |
| `-1.200,50` | `-1200.5` — el separador decimal es **el que aparece de último** |
| `1,200.50` | `1200.5` — misma regla, al revés |
| `1,200` | `1200` — patrón `\d{1,3}(,\d{3})+` = miles |
| `0,5` | `0.5` — coma sola sin patrón de miles = decimal español |
| `$ 1 200 000` | `1200000` — se limpian `$`, `%`, `#`, espacios y NBSP |
| `""` / `null` | `null` |
| `true` | `1` |

**Tipo de medida (`toMeasureType`)** — coincide por igualdad **o por prefijo**, en este orden: `Dinero` (`dinero`, `money`, `moneda`, `currency`, `monto`, `valor`) → `Porcentaje` (`porcentaje`, `porcentual`, `percent`, `percentage`, `pct`) → `Numérico` (`numerico`, `numero`, `number`, `cantidad`, `unidades`, `num`) → `Se cumple / No se cumple` (`se_cumple_no_se_cumple`, `se_cumple`, `cumple`, `binario`, `si_no`, `boolean`, `booleano`).

**Dirección (`toTrend`)** — `Aumentar` (`aumentar`, `incremento`, `incrementar`, `subir`, `directo`, `increase`, `up`) o `Reducir` (`reducir`, `decremento`, `disminuir`, `bajar`, `inverso`, `decrease`, `down`). `directo`/`inverso` están incluidos porque es como lo dicen los archivos de evaluación de desempeño.

**Valores por defecto:** medida en blanco → `Numérico`; dirección en blanco → `Aumentar`. Ambos se avisan como nota y el revisor puede cambiarlos antes de cargar. Una medida en blanco es mucho más veces "Numérico" que una fila rota.

### 3.4 Escala de pesos — `shouldScaleWeights`

Un archivo puede traer los pesos como `30` o como `0.3`. La decisión se toma **por archivo, no por fila**, y solo si se cumplen las **tres** condiciones:

1. Hay al menos un peso finito.
2. **Ningún** peso supera `1`.
3. Al menos **un usuario** tiene sus pesos sumando `1.0` con tolerancia `< 0.01`.

Ese par de hechos es exactamente como se ve un archivo en fracciones, y un archivo en porcentajes prácticamente nunca cumple los dos. Decidirlo por fila haría que un legítimo peso del 1% se leyera como 100%.

Si se escala, se avisa: *"Los pesos venían como fracción (0,1) y se convirtieron a porcentaje (10%)."*

### 3.5 Notas informativas (`notes`)

Se muestran en un `Alert` azul sobre la tabla de revisión. Son cuatro, y solo salen si aplican:

1. `Los pesos venían como fracción (0,1) y se convirtieron a porcentaje (10%).`
2. `{n} fila(s) no traía(n) un tipo de medida reconocible; se asumió "Numérico".`
3. `{n} fila(s) no traía(n) dirección reconocible; se asumió "Aumentar".`
4. `{n} fila(s) se omitió/omitieron por no tener usuario o título.`

Las notas se **deduplican** entre archivos del mismo lote.

---

## 4. Las tres operaciones

La operación **se elige a mano antes de subir**. Si el archivo no corresponde a la operación elegida, el sistema **lo detecta al analizar y lo dice en la misma pantalla de carga** (§4.1).

Cambiar de operación **borra la selección de archivos** (`handleModeChange`), para que no quede un archivo de crear cargándose como edición.

| | **Cargar objetivos** (`crear`) | **Editar objetivos** (`editar`) | **Actualizar objetivos** (`actualizar`) |
|---|---|---|---|
| **Descripción en la UI** | Crea objetivos nuevos para los usuarios del ciclo. | Cambia el nombre, el peso o la meta de objetivos que ya existen. | Registra el avance de objetivos existentes sin tocar su definición. |
| **Intención** | Se crearán objetivos nuevos. Los que ya existen no se modifican. | Se reemplazará la definición de cada objetivo indicado. El avance registrado no cambia. | Solo se actualizará el avance. El nombre, el peso y la meta se mantienen. |
| **Columnas** | `username`, `nombre_objetivo`, `peso`, `tipo_medida`, `aumentar_reducir`, `valor_inicial`, **`cumplimiento_maximo`**, **`cumplimiento_minimo`**, `meta`, `descripcion_meta` | `username`, `nombre_objetivo`, **`nombre_objetivo_nuevo`**, `peso`, `tipo_medida`, `aumentar_reducir`, `valor_inicial`, **`cumplimiento_minimo`**, **`cumplimiento_maximo`**, `meta`, `descripcion_meta` | `username`, `nombre_objetivo`, `valor_inicial`, `meta`, `avance_actual`, `nuevo_avance` |
| **`nombre_objetivo` es…** | el título | el **criterio de búsqueda** (el título nuevo va en `nombre_objetivo_nuevo`) | el **criterio de búsqueda** |
| **¿Alinea objetivos?** | No (`linkByName: false`) | Sí | Sí |
| **Verbo del botón** | `Cargar` | `Editar` | `Actualizar` |
| **Encabezado de filas** | Objetivos a crear | Objetivos a editar | Avances a registrar |

> **Los topes van en orden opuesto entre crear y editar.** No es un error de este prototipo: es como están las plantillas oficiales. El parser lo absorbe leyendo por nombre.

> **Ninguna plantilla trae fechas.** Las fechas son del ciclo, no del objetivo.

### 4.1 Archivo que no corresponde a la operación (M1)

**El problema que resuelve:** subir un archivo de *actualizar* con la operación *cargar objetivos* no daba error. Las columnas que esa operación busca no estaban, así que la revisión salía llena de filas sin meta y sin peso, y **el archivo quedaba acusado de traer datos rotos cuando lo único mal era en qué pestaña se soltó**.

**Cuándo se dice:** justo al terminar el análisis, **sin salir de la pantalla de carga**. No va a la pantalla de error porque no hay nada roto que reparar: el archivo está bien y la operación correcta está dos dedos más arriba. Mandarlo a otra pantalla obligaría a volver para arreglar algo que se arregla ahí mismo.

**Cómo se detecta.** Solo se miran **dos columnas**, no la lista entera. Las tres plantillas se solapan casi por completo — `editar` es `crear` más una columna de renombre — así que *"tiene las columnas de X"* no prueba nada. Estas dos sí, porque existen en una sola plantilla:

| Columna | Solo existe en |
|---|---|
| `nuevo_avance` | Actualizar objetivos |
| `nombre_objetivo_nuevo` | Editar objetivos |

De ahí salen **las tres únicas afirmaciones que se pueden sostener**:

| # | Situación | Mensaje | ¿Ofrece corregir? |
|---|---|---|---|
| M1a | El archivo trae `nuevo_avance` y la operación **no** es actualizar | **Este archivo es para actualizar avances** — *Trae la columna "nuevo_avance", que solo existe en la plantilla de Actualizar objetivos, y elegiste "{operación}". Cambia la operación y vuelve a analizarlo.* | **Sí** → *Cambiar a "Actualizar objetivos" y analizar* |
| M1b | El archivo trae `nombre_objetivo_nuevo` y la operación **no** es editar | **Este archivo es para editar objetivos** — *Trae la columna "nombre_objetivo_nuevo", que solo existe en la plantilla de Editar objetivos, y elegiste "{operación}".* | **Sí** → *Cambiar a "Editar objetivos" y analizar* |
| M1c | La operación es actualizar y al archivo le **falta** `nuevo_avance` | **Este archivo no trae avances** — *Le falta la columna "nuevo_avance", que es el único dato que esta operación registra. Revisa si querías cargar o editar objetivos en vez de actualizar avances.* | **No** — sin esa columna sabemos que no es de actualizar, pero no si es de crear o de editar. Proponer una de las dos sería adivinar |

> **Lo que NO se avisa, a propósito:** elegir *editar* y subir un archivo sin `nombre_objetivo_nuevo`. Quien no va a renombrar nada puede haber borrado esa columna, y acusarlo sería inventarse un error sobre un archivo que funciona. La regla es no pronunciarse salvo que la respuesta sea segura.

**El botón de corrección conserva el archivo.** Es la única vía que no descarta la selección, justo al contrario de cambiar la operación a mano. Ahí el archivo se tira porque queda en duda si sirve; aquí no hay duda — se acaban de leer sus columnas y decir de cuál es. Volver a pedirlo sería castigar al usuario por seguir la propia recomendación del sistema. Tras cambiarla, **reanaliza solo**.

El aviso se limpia solo al cambiar de operación a mano o al soltar otro archivo: hablaba del anterior.

**Puntos de código:** `TemplateSignature` y el campo `signature` de `TemplateParseResult` (`parseTemplate.ts`) · `detectTemplateMismatch()` y la variante `kind: 'mismatch'` de `AnalyzeObjectivesOutcome` (`index.ts`) · el estado `mismatch` y `applyMismatchSuggestion()` (`CargaMasivaDrawer.tsx`).

### 4.2 Lo que hace única a "Actualizar"

Es la operación más distinta de las tres, y no por el archivo sino por lo que se revisa. Crear y editar discuten **cómo es** un objetivo; actualizar da por sentado que ya está bien definido y discute **un solo número**.

De las seis columnas, **solo `nuevo_avance` se escribe**. Las otras tres numéricas salen de UBITS y vuelven tal cual, porque un avance suelto no se puede revisar: `38` no dice nada, `38 con meta 40 viniendo de 62` se lee de un vistazo.

En la tabla de revisión eso se traduce en dos cosas:

1. **Todo es de solo lectura menos una celda.** La medida, la dirección, el inicial, la meta y el avance actual **salen del objetivo tal como está en UBITS, no del archivo** (`adoptTargetDefinition`: la fila adopta el objetivo destino entero y conserva solo su nuevo avance).
2. Aparece una columna que las otras dos no tienen: **Cumplimiento**, el porcentaje que va a quedar registrado (§8.4). Calcularlo a mano cuarenta veces es justamente lo que una carga masiva debería evitar.

| | Editar | Actualizar |
|---|---|---|
| Fila **sin objetivo encontrado** | se crea como objetivo nuevo (salida válida) | **bloquea**: no hay avance que reportar sobre algo que no existe, y este archivo no puede crearlo |
| Botón "Crear como objetivo nuevo" en el selector | sí | **no aparece** |
| Regla del 100% | aplica | **no aplica**: esta carga no mueve pesos |
| Objetivos que el archivo no menciona | se listan y cuentan para el 100% | no se listan; el chip del header dice `+ N en UBITS` con la nota de que se quedan como están |

> **El `avance_actual` del archivo no se valida contra UBITS.** Se descarta en el parseo (`currentProgress: null`) y el valor real se lee en vivo del objetivo enlazado. La columna existe como contexto para quien llena la plantilla, no como un dato que la app crea.

---

## 5. Happy path

**Descripción:** el usuario elige la operación, sube un archivo bien formado, todas las personas se alinean, todos los datos pasan las reglas y todos los pesos cuadran en 100%. Las cuatro pestañas muestran a todo el mundo en "Alineados" y la carga entra sin corregir nada.

**Pasos:**

1. En el detalle del ciclo, clic en **Carga masiva** (barra de "Lista de usuarios asignados").
2. Tab **"Nueva carga"** → elegir la operación en **"Qué quieres hacer"**.
3. Arrastrar o seleccionar el archivo → **"Analizar (1)"**.
4. Overlay **"Analizando archivos"** (~5.1 s), con seis fases que van reportando lo que se encontró (§5.1).
5. **Revisión** (`summary`): el panel se ensancha a 86vw. Cuatro pestañas y, dentro, una tarjeta por persona con sus objetivos en una tabla editable.
6. **"Cargar 26 objetivos alineados"** → el drawer vuelve al dropzone en el tab **"Cargas"** y la escritura corre en segundo plano.

**Criterios de aceptación (HU):**

- Dado un archivo válido para la operación elegida, cuando se analiza, entonces cada persona aparece en la pestaña que corresponde a lo que le falta, y las que no necesitan nada quedan en **"Alineados"** ya confirmadas.
- El botón de carga dice el verbo de la operación y el número de objetivos que va a escribir, y **solo cuenta los de "Alineados"**.
- Con cero objetivos alineados, el botón queda deshabilitado con el motivo: *"Resuelve al menos un usuario en la pestaña «Alineados» para poder cargar"*.

### 5.1 El overlay de análisis

Constantes: `ANALYSIS_TICK_MS = 150`, `ANALYSIS_STEP = 3`, `ANALYSIS_HOLD_MS = 550` → 34 ticks ≈ **5.1 s**, más **550 ms** de retención al 100%.

La barra lleva el reloj; el parseo real corre en paralelo y va soltando sus conteos en `findings`, así que **los textos son datos de verdad en cuanto están disponibles**, no una animación decorativa:

| Progreso | Qué dice |
|---|---|
| `< 16%` | `Abriendo {n} archivo(s)...` |
| `< 34%` | `Leyendo la hoja "{nombre}"...` (o `Leyendo la estructura del archivo...`) |
| `< 54%` | `{n} objetivos en {m} usuarios` |
| `< 74%` | `{n} identificadores sin usuario en UBITS` › `{n} usuarios por confirmar` › `{n} usuarios alineados por username o correo` |
| `< 92%` | `{n} objetivos con datos por corregir` › `Pesos, metas y direcciones sin errores` |
| `< 100%` | `Ordenando el resultado...` |
| `100%` | `Análisis completo` |

El overlay es `absolute inset-4` — vive dentro del panel, no tapa la aplicación.

---

## 6. Alineación del USUARIO

Antes de mirar un solo dato, cada identificador del archivo tiene que resolverse a un usuario de UBITS. La carga de objetivos **no crea usuarios**.

### 6.1 Roster vs. directorio

Se indexan **juntos**, en un solo índice:

- **Roster** — los usuarios ya asignados al ciclo. Se marcan `onCycle: true`.
- **Directorio** — el resto de UBITS. `onCycle: false`.

La distinción **no cambia el algoritmo**: solo decide quién gana una colisión (los del ciclo se indexan al final, así que sobrescriben) y permite decir "existe en UBITS pero hay que agregarlo al ciclo". **Estar o no en el ciclo no cambia el estado de alineación**; la carga agrega al ciclo a quien haga falta.

### 6.2 Tipo de identificador — `detectIdentifierType`

Orden estricto de prioridad:

| Orden | Tipo | Criterio |
|---|---|---|
| 1 | `correo` | `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` |
| 2 | `documento` | ≥ **5 dígitos** y solo dígitos tras quitar `.`, `-`, espacios |
| 3 | `nombre` | **dos o más palabras** de solo letras |
| 4 | `username` | todo lo demás (fallback) |

Una sola palabra nunca se detecta como nombre. Un código numérico de menos de 5 dígitos es un username, no un documento.

### 6.3 Los tres estados

`UserMatchStatus = 'matched' | 'possible' | 'unmatched'`

#### `matched` — coincidencia exacta

**Solo el username y el correo registrado producen `matched`.** Nada más.

```ts
const exact = index.byUsername.get(key) ?? index.byEmail.get(key);
```

> **El documento NO alinea automáticamente**, aunque sea un identificador válido y único en el archivo. UBITS no autentica por documento y dos registros pueden compartirlo tras una migración, así que un documento siempre pasa por confirmación humana.

#### `possible` — hay a quién proponer, pero no basta

Siete vías, evaluadas en este orden. Todas exigen confirmación:

| # | Vía | Cuándo | `basis` | Mensaje |
|---|---|---|---|---|
| a | **Nombre** | el identificador es un nombre y coincide con `byName` | `nombre` o `nombre · N homónimos` | *El archivo trae el nombre, no un username. Coincide con esta persona, pero dos usuarios pueden llamarse igual.* / *Hay N usuarios de UBITS con este mismo nombre. Revisa cuál es antes de confirmar.* |
| b | **Teléfono** | los dígitos coinciden con un teléfono registrado | `teléfono` | *Es el teléfono registrado de "{nombre}". Un número puede haber cambiado de dueño, así que conviene confirmarlo.* |
| c | **Documento** | los dígitos coinciden con un documento | `documento` | *Es el documento de "{nombre}". UBITS solo identifica a una persona por su username o su correo, así que el documento hay que confirmarlo.* |
| d | **Correo → username** | la parte local del correo **es** un username | `parte del correo` | *El usuario "{username}" coincide con la parte inicial de este correo.* |
| e | **Correo → otro dominio** | la parte local coincide con la de otro correo | `parte del correo` | *El correo de "{nombre}" usa la misma parte inicial en otro dominio.* |
| f | **Username → correo** | el username coincide con la parte local de un correo | `parte del correo` | *Coincide con la parte inicial del correo de "{nombre}".* |
| g | **Documento casi idéntico** | quitando el **último** dígito (verificador) o el **primero** | `documento parecido` | *El documento de "{nombre}" es casi idéntico ({documento}).* |

No hay distancia de edición difusa: la vía (g) es literalmente quitar un dígito de un extremo.

#### `unmatched` — nada que proponer

Ni el username, ni el correo, ni el nombre, ni el documento, ni el teléfono, ni la parte local llevan a nadie.

Va a **su propia pestaña**, no a "Con errores", y esto es una decisión de producto: *un usuario que UBITS todavía no tiene no es un defecto del archivo* — es un contratista, alguien que acaba de entrar, un correo personal. Antes vivía entre los errores, lo que presentaba un paso rutinario como un daño y lo enterraba bajo rojo.

**Sus violaciones no se muestran** mientras esté sin alinear: hasta que alguien sea dueño de esos objetivos no hay para quién arreglarlos.

### 6.4 Resolver a mano

El **nombre del usuario en la cabecera de la tarjeta es el selector**. No hay botón de "cambiar" aparte: reasociar no es un trámite lateral, es lo que este paso existe para hacer.

- Placeholder de búsqueda: `Nombre, username, correo o documento` — busca por los cuatro (`searchDirectory` filtra con OR sobre `name`, `username`, `email`, `area` y los dígitos del documento). Máximo **40** resultados.
- El estado vacío se dibuja en **azul de marca**, no en rojo: una persona sin alinear es trabajo por hacer, no una falla del archivo.
- **Elegir no aplica: prepara.** El picker deja el usuario "en escena" (`stagedUser`) y el identificador muestra `· sin confirmar`; hay que pulsar **Confirmar**. Vaciar el selector, en cambio, sí aplica de inmediato.
- Reasignar el usuario de una tarjeta **borra los enlaces a objetivos** y los recalcula contra los del nuevo usuario (`forgetObjectiveLink`), y retira la confirmación previa.

### 6.5 "Usuario repetido"

Cuando dos identificadores distintos del archivo terminan apuntando **al mismo usuario**, ambas tarjetas muestran un chip rojo **"Usuario repetido"**:

> *Otro identificador del archivo también apunta a {nombre}. Si cargas los dos, sus pesos se sumarán por encima del 100%.*

Se calcula en la tabla contando `matchedUser.username` repetidos. **Avisa pero no bloquea** (§14).

La respuesta prevista es **unificar**: al confirmar un usuario que ya está en la carga, la tarjeta pregunta en línea

> *{nombre} ya está en la carga como {identificador}, con N objetivos.* → **Unificar** / **Cancelar**

y "Unificar" pasa los objetivos de una tarjeta a la otra.

---

## 7. Alineación del OBJETIVO (solo editar y actualizar)

En estas dos operaciones hay que alinear **dos cosas**: la persona y, dentro de ella, el objetivo que cada fila viene a tocar. Y se hace en el mismo sitio y con el mismo gesto: **el nombre del objetivo es el desplegable**.

### 7.1 El algoritmo

**Normalización** (más agresiva que la de usuarios): sin tildes, minúsculas, y **toda puntuación convertida en espacio**. `"Aumentar el NPS."` → `"aumentar el nps"`.

**Palabras significativas:** se descartan 25 palabras vacías (`el`, `la`, `de`, `del`, `en`, `y`, `o`, `con`, `por`, `para`, `que`, `se`, `su`, `mas`, `sin`, …).

**Similitud:** índice de **Jaccard** sobre palabras significativas — `|intersección| / |unión|`. No es distancia de edición, y es a propósito: estos nombres derivan ganando y perdiendo **palabras completas**, y una distancia por caracteres cobra eso por letra.

**Umbrales exactos:**

| Valor | Significado |
|---|---|
| **1.0** (igualdad exacta del normalizado) | `matched` — única vía automática |
| **≥ 0.75** o **contención** (una cadena contiene a la otra) | `possible`, `basis: 'nombre contenido'` |
| **≥ 0.5** | `possible`, `basis: 'nombre parecido'` |
| **< 0.5** | `unmatched` |

`0.5` es "dos de tres palabras significativas en común". Por debajo se deja sin alinear, donde el peor caso es un objetivo creado que no debía crearse — no uno **reescrito** por error.

**Empate ⇒ `unmatched`, no `possible`.** Si dos objetivos puntúan igual, no se propone ninguno. Proponer a cara o cruz aquí significa reescribir el objetivo equivocado. El picker pregunta.

### 7.2 Un objetivo, una fila

Doble mecanismo para que dos filas no reescriban el mismo objetivo:

1. `matchObjectiveName` recibe un set `taken` y **filtra los candidatos antes de puntuar**.
2. `linkGroup` hace **dos pasadas**: primero los enlaces que un humano fijó (`isManual`) reclaman su objetivo, y solo después se resuelven los automáticos con lo que queda. Sin ese orden, re-ejecutar tras una selección manual podría entregarle el objetivo recién elegido a otra fila que puntuara mejor.

Además, el enlace se **reconstruye entero** en cada recálculo en vez de fusionarse: una re-ejecución que ya no encuentra nada tiene que **borrar** el destino anterior, no conservarlo.

### 7.3 Los chips por fila

| Chip | Significado | Al cargar |
|---|---|---|
| **Con cambios** | encontró su objetivo (exacto o confirmado a mano) | lo reescribe |
| **Por confirmar** | solo se pudo **proponer**; el nombre queda con borde ámbar | **bloquea** hasta confirmarlo |
| **Se creará nuevo** | no se encontró nada parecido *(solo en editar)* | se crea como objetivo nuevo |
| **Sin cambios** | objetivo que ya tiene y que ninguna fila toca | se queda igual, pero cuenta para el 100% |
| **Ya en UBITS** → **Se actualizará** | objetivo existente que el revisor ajustó a mano | se escribe **antes** que los nuevos |

En una fila de edición **el nombre no se puede reescribir a mano**, porque ahí el nombre no es texto libre: es la respuesta a "¿cuál de sus objetivos es este?". El renombre lo hace el archivo con `nombre_objetivo_nuevo`.

### 7.4 El selector de objetivo

Al hacer clic en el nombre se abre un panel con:

- **Buscador entre los objetivos de esa persona** (insensible a tildes, mayúsculas y puntuación).
- **El peso y la meta de cada candidato** — es lo que permite distinguir dos objetivos parecidos.
- **"Crear como objetivo nuevo"** — solo en `editar`. En `actualizar` **no aparece**.
- Los objetivos que otra fila ya está reescribiendo **no se ofrecen** (`unclaimedObjectives`).
- Si es una propuesta, el panel lo dice: *"Te proponemos esta asociación por nombre"*.

---

## 8. Reglas de validación y de cálculo

Implementan la *"Tabla de reglas de cálculo actualizada — Objetivos"*. El modelo mental es una **carrera**: el objetivo es una pista con una salida (valor inicial), una meta (target), una marca clasificatoria opcional (mínimo) y un techo opcional (máximo). En un objetivo de incremento la pista se lee salida → mínimo → meta → máximo; en uno de reducción, al revés. **Los negativos son válidos** — solo importa el orden relativo.

Todo corre **en cada tecla**. No hay aprobación por fila: lo que decide si un objetivo se carga es que su dato sea válido y su persona esté resuelta.

### 8.1 Límites de campo

| Regla | Campo | Condición | Mensaje | Severidad |
|---|---|---|---|---|
| `TITULO_VACIO` | título | vacío | `El objetivo necesita un título.` | **error** |
| `TITULO_MAX` | título | > **150** caracteres | `El título supera los 150 caracteres (tiene {n}).` | **error** |
| `PESO_MIN` | peso | no finito o **< 1** | `El peso no puede ser inferior al 1%.` | **error** |
| `META_VACIA` | meta | no finita | `La meta es obligatoria.` | **error** |

`META_VACIA` **corta la validación ahí mismo**: todas las reglas siguientes comparan contra la meta, así que no hay nada más que decir.

### 8.2 Reglas de definición (bloquean)

Se evalúan en este orden, y el orden importa: **R3 va antes que R1/R2** porque la igualdad también los dispara, y *"la meta no puede ser igual al valor inicial"* es el mensaje que de verdad explica el problema.

| Regla | Condición | Mensaje |
|---|---|---|
| **R0b** | sin valor inicial **y** meta `= 0` | `Sin valor inicial, la meta no puede ser 0.` |
| **R3** | meta `=` valor inicial | `La meta no puede ser igual al valor inicial.` |
| **R1** | `Aumentar` y meta `<` inicial | `En metas de incremento, el valor meta debe ser mayor al valor inicial.` |
| **R2** | `Reducir` y meta `>` inicial | `En metas de reducción, el valor meta debe ser menor al valor inicial.` |

R0b existe porque sin valor inicial la fórmula divide por la meta.

### 8.3 Avisos de posición (NO bloquean)

| Regla | Condición | Mensaje |
|---|---|---|
| **R4** | el mínimo queda **más allá** de la meta | `El mínimo queda más allá de la meta: ningún avance podría alcanzarlo.` |
| **R5** | el máximo queda **antes** de la meta | `El máximo queda antes de la meta: el cumplimiento nunca llegaría al 100%.` |

> **R4 y R5 se callan cuando la meta ya está mal.** Los topes son posiciones medidas *contra la meta*; medirlos contra una meta que R1/R2/R3/R0b acaba de rechazar es medir contra una línea de llegada que no está. Producía veredictos que eran puro ruido: una fila `inicial 11.5 · meta 14 · mínimo 8` en una reducción recibía R2 por la meta **y** un R4 ámbar diciendo que el mínimo era inalcanzable — pero el mínimo estaba bien, y corregir la meta hacía desaparecer el R4 solo. Un campo roto, dos acusaciones, en dos colores, y el revisor sin forma de saber cuál perseguir.

### 8.4 Cálculo del cumplimiento (`computeCompliance`)

Orden de aplicación:

1. **Valor inicial resuelto** (`resolveInitialValue`). Las cuatro variantes R6b-1/R6b-2/R6c-1/R6c-2 colapsan en una sola decisión:
   - Si el signo de la meta **concuerda** con la dirección (`Aumentar` y meta ≥ 0, o `Reducir` y meta < 0) → referencia = **0**.
   - Si no → referencia = **2 × meta**, que es lo que pone la línea de salida al otro lado de la llegada.

   Sustituir `inicial = 2 × meta` en R6a reproduce exactamente el `(2 − actual/meta) × 100` de la especificación:
   `(A − 2M) / (M − 2M) = (A − 2M) / (−M) = 2 − A/M`

2. Si `meta === inicial resuelto` → **0**.
3. **R4** — por debajo de la marca clasificatoria, **0**.
4. **R5** — pasado el techo, el techo sustituye al avance reportado. *El tope frena el **valor**, no el porcentaje*: si el máximo está más allá de la meta, cumplir hasta el tope da **más de 100%**, y eso es correcto.
5. **R6a** — `((avance efectivo − inicial resuelto) / (meta − inicial resuelto)) × 100`
6. **R0a** — los negativos se truncan a **0**.

| Caso | Condición | Referencia |
|---|---|---|
| **R6a** | hay valor inicial | el valor inicial |
| **R6b-1** | sin inicial, `Aumentar`, meta ≥ 0 | 0 |
| **R6b-2** | sin inicial, `Aumentar`, meta < 0 | 2 × meta |
| **R6c-1** | sin inicial, `Reducir`, meta < 0 | 2 × meta |
| **R6c-2** | sin inicial, `Reducir`, meta ≥ 0 | 0 |

### 8.5 Reglas de la carga de avances (`validateProgressUpdate`)

Deliberadamente mucho más pequeña. Para cuando se juzga una fila de avance, su objetivo **ya existe en UBITS y fue lo bastante correcto como para guardarse**, así que re-litigar su forma solo produciría errores sobre datos de otro que este archivo no puede arreglar.

**Bloquean — dos cosas, y las dos son "no sabemos dónde va esto" o "no hay qué poner":**

| Regla | Condición | Mensaje |
|---|---|---|
| `OBJETIVO_NO_ENCONTRADO` | el enlace no encontró objetivo (y no es una propuesta pendiente) | `Ningún objetivo de esta persona se llama "{nombre}". Elige a cuál corresponde, o quita la fila.` |
| `AVANCE_VACIO` | `nuevo_avance` vacío o no numérico | `El nuevo avance es obligatorio: es el único dato que esta carga registra.` |

`AVANCE_VACIO` también **corta la validación**: todo lo de abajo lee el valor que falta.

**Avisan y dejan pasar** — porque son cosas que de verdad ocurren y quien revisa es quien sabe si están bien. Refusarlas sería la herramienta pasando por encima del revisor:

| Regla | Condición | Mensaje |
|---|---|---|
| `AVANCE_RETROCEDE` | el avance va para atrás respecto de lo registrado | `El avance retrocede: pasa de {x} a {y} en un objetivo de {aumentar\|reducir}.` |
| `R4` | no alcanza el mínimo | `No alcanza el mínimo ({min}), así que el cumplimiento quedará en 0%.` |
| `R5` | supera el máximo | `Supera el máximo ({max}): el cumplimiento se calcula hasta el tope, no más allá.` |

Retroceder es legítimo si es una corrección, y sospechoso si es una columna pegada una fila corrida — por eso se dice en voz alta en vez de bloquear.

> **Aquí R4 y R5 se enuncian como consecuencias, no como faltas.** Los topes están funcionando exactamente como se configuraron; lo que el revisor necesita saber es **qué va a puntuar** este número cuando aterrice.

---

## 9. La regla del 100%

A diferencia de todas las reglas de §8, esta **no pertenece a una fila sino al conjunto**: ningún peso está mal por sí solo, están mal **juntos**. Por eso se responde **una vez por tarjeta**, y el trabajo de la tabla es solo delinear las celdas que pueden moverse.

### 9.1 Qué se suma

`groupWeightTotal` suma **`groupResultingObjectives`** = los objetivos que la persona ya tiene y que **ninguna fila del archivo reescribe**, más todas las filas del archivo.

Esto encoda la diferencia que importa: **una fila que reescribe un objetivo reemplaza su peso; una que crea uno nuevo lo suma.** Subir un objetivo de 30% a 40% cuesta 10%, no 40%.

Consecuencia útil: **confirmar una propuesta puede cuadrar el peso solo.** Mientras la propuesta esté sin confirmar, el objetivo que reescribiría sigue contando aparte, así que el total está inflado; al confirmarla, desaparece de la suma.

### 9.2 Solo el exceso bloquea

`groupHasStructuralErrors` compara `> 100`. Quedarse **por debajo** del 100% nunca bloquea: es el estado normal de media revisión — filas todavía en arreglo, filas recién borradas — y anunciar "faltan 20%" en cada una sería gritar que viene el lobo. Pasarse es el único total que ningún "todavía no" explica.

### 9.3 Los mensajes (`describeGroupWeight`)

**Persona sin objetivos previos** — solo se reporta el exceso:

> **El peso total se pasa del 100%.** *Los pesos de este usuario suman {total}% y deben sumar exactamente 100%. Reparte {exceso}% menos entre sus {n} objetivos — por ejemplo, {exceso/n}% menos en cada uno — o quita alguno de la carga.*

**Persona que ya tenía objetivos** — **todos** los totales llevan frase, incluida la correcta. El revisor no puede saber de otro modo a dónde se fue el peso, y *"el archivo trae 40% pero ya había 100% repartido"* es la explicación completa de por qué un archivo perfectamente válido no carga:

```
Tiene {n} objetivos en UBITS con {x}% y el archivo suma {y}% más: {total}% en total.
```

| Estado | Tono | Titular | Cierre |
|---|---|---|---|
| `> 100%` | **error** | El peso total se pasa del 100%. | Baja {exceso}% entre los {n} objetivos, o quita alguno de la carga. |
| `< 100%` | aviso | Falta {gap}% por repartir. | Sube el peso de cualquiera de los {n} objetivos. |
| `= 100%` | info | El peso cuadra en 100%. | No hay nada que ajustar. |

> **Presente, no pasado, y a propósito.** *"Ya tenía 100%"* sería mentira en el momento en que el revisor baja uno de esos pesos para hacer sitio: la frase seguiría citando un total viejo mientras muestra el ajustado. Decir cuánto suman **las dos mitades ahora mismo** sigue siendo cierto en cada edición, que es lo que permite que la misma frase narre el arreglo mientras ocurre.

### 9.4 Ajustar objetivos existentes

Los objetivos que ya existen **se pueden editar en la misma tabla**: bajarle el peso a uno de ellos es muchas veces la única forma de hacerle espacio a los nuevos. Al tocarlo:

- su chip pasa de **"Ya en UBITS"** a **"Se actualizará"**,
- aparece un botón para deshacer,
- y la carga **lo escribe antes** que los objetivos nuevos, porque si no la plataforma rechazaría los nuevos por reventar el 100% a mitad de camino.

---

## 10. Las 4 pestañas de la revisión

`bucketForGroup` — el orden de decisión es literal y **la identidad decide primero y sola**:

```ts
if (group.matchStatus === 'unmatched') return 'sinAlinear';
if (group.matchStatus === 'possible')  return 'asociaciones';
if (groupHasStructuralErrors(group))   return 'errores';
return group.reviewConfirmed ? 'alineados' : 'errores';
```

| Pestaña | Qué la define | Qué falta hacer |
|---|---|---|
| **Sin alinear** | `matchStatus === 'unmatched'` | Elegir a mano el usuario dueño de esos objetivos |
| **Posible alineación** | `matchStatus === 'possible'` | Confirmar o rechazar la propuesta |
| **Con errores** | identidad resuelta **y** hay errores estructurales, **o** falta el clic de Confirmar | Corregir datos / confirmar |
| **Alineados** | identidad resuelta, sin errores, **y** `reviewConfirmed === true` | Nada. Es lo único que se carga |

Dos consecuencias que conviene tener claras:

1. **Un grupo sin alinear va a "Sin alinear" aunque sus números estén rotos.** Hasta que alguien sea dueño de esos objetivos no hay para quién arreglarlos, así que sus violaciones ni se muestran.
2. **Datos válidos no bastan para "Alineados".** Hace falta `reviewConfirmed`, que es el clic humano en **Confirmar**. Una tarjeta impecable se queda en "Con errores" sin nada que reportar más que ese botón.

`finalizeInitialReviewState` corre **una sola vez**, al terminar el análisis: marca `reviewConfirmed` en los grupos alineados que no tienen nada roto. Todo cambio posterior es una edición humana, y **cada una retira el flag** en vez de ponerlo.

### 10.1 `groupHasStructuralErrors` en detalle

```ts
if (group.objectives.some(isObjectiveLinkPending)) return true;   // (1)

if (group.mode === 'actualizar') {                                 // (2)
  return group.objectives.some(
    (o) => o.link?.targetId === undefined || !isProgressUpdateValid(o)
  );
}

if (groupResultingObjectives(group).some((o) => !isObjectiveValid(o))) return true;  // (3)
return groupWeightTotal(group) > TOTAL_WEIGHT_PERCENT;             // (4)
```

1. **Un enlace de objetivo sin confirmar bloquea siempre, en cualquier modo.** Cargarlo escribiría sobre el objetivo que la suposición eligió, y el revisor nunca dijo que fuera ese.
2. **`actualizar` se juzga en términos completamente distintos**: no valida definiciones ni aplica la regla del 100%, porque una carga de avance no escribe definiciones ni mueve pesos.
3. Se mide sobre los objetivos **resultantes**, no sobre las filas del archivo.
4. Solo el exceso.

### 10.2 El botón "Confirmar" y sus motivos de bloqueo

Cadena de evaluación, en este orden de prioridad:

| # | Condición | Motivo (tooltip del botón deshabilitado) |
|---|---|---|
| 1 | no hay usuario ni propuesta | `Elige el usuario dueño de estos objetivos para poder confirmar.` |
| 2 | hay un usuario en escena | *(habilitado — hay una identidad que confirmar)* |
| 3 | enlaces de objetivo pendientes | `Confirma a qué objetivo de UBITS corresponde(n) N fila(s) del archivo.` |
| 4 | filas huérfanas *(solo actualizar)* | `N fila(s) no corresponde(n) a ningún objetivo de esta persona. Elige a cuál corresponde cada una, o quítalas de la carga.` |
| 5 | filas inválidas | actualizar: `Completa el nuevo avance en N fila(s).` · resto: `Corrige N objetivos con datos que UBITS rechaza.` |
| 6 | peso > 100% *(no aplica en actualizar)* | con previos: `Entre los N objetivos que ya tiene en UBITS y los del archivo, los pesos suman X% y deben sumar 100%.` · sin previos: `Los pesos suman X% y deben sumar 100%.` |

Todos los conteos se hacen sobre el **conjunto completo de filas**, no sobre las visibles tras filtrar, para que el botón nunca contradiga a la pestaña.

### 10.3 Los chips de la tarjeta

| Chip | Cuándo | Texto |
|---|---|---|
| Conteo | siempre | `{n} objetivos` (+ ` del archivo` si hay previos) · `{visibles} de {total} objetivos` si hay filtros activos |
| Previos | `savedCount > 0` | `+ {n} en UBITS` |
| Peso | salvo carga de avance sin usuario | `Peso 100%` · `Peso 120% · sobra 20%` · `Peso 60% · falta 40%` |
| Asociado | asignado a mano | `Asociado` |
| Repetido | dos identificadores → mismo usuario | `Usuario repetido` (rojo) |

El chip de peso **solo se pinta de rojo al pasarse**; quedarse corto se queda en gris.

> **Lo que se quitó a propósito:** no hay chip "Sin alinear", ni "Por confirmar", ni "N por corregir". Cada uno solo repetía la pestaña en la que la tarjeta ya estaba. Sobreviven los totales y las excepciones.

---

## 11. Casos de ERROR del archivo

Estos no ejercitan la revisión: ejercitan lo que pasa **antes** de ella.

| # | Caso | Cuándo salta | Qué se ve | Bloquea | Estado |
|---|---|---|---|---|---|
| **E1** | **Formato no soportado** (`.zip`, `.docx`, …) | al soltarlo, sin analizar | el dropzone se pone rojo: *"El tipo de archivo «.zip» no está permitido. Acepta Excel, CSV."* El archivo **no se adjunta** y **Analizar** sigue deshabilitado | Sí | **REAL** |
| **E2** | **Archivo demasiado grande** | al soltarlo | mismo lugar, mismo tratamiento: *"El archivo supera el límite de 10 MB. Comprímelo o divídelo e inténtalo de nuevo."* No hace falta leerlo para saber que no cabe | Sí | tamaño **REAL** / token demo |
| **E3** | **Archivo dañado o protegido** | al analizar | pantalla completa: **"No pudimos leer el archivo"** — *"El archivo parece estar dañado o protegido con contraseña. Verifica que se haya exportado correctamente e inténtalo de nuevo."* + **Subir otro archivo** | Sí | token demo (real: el parser lanza → mismo error) |
| **E4** | **Reconocido pero sin estructura** | al analizar | pantalla completa distinta: **"No encontramos objetivos"** — *"Revisa que el archivo tenga las columnas de la plantilla (username, nombre_objetivo, peso, tipo_medida...) y al menos una fila con datos."* | Sí | **REAL** |
| **E5** | **Ningún archivo seleccionado** | al analizar | **"No seleccionaste archivos"** — *"Sube al menos un archivo para continuar."* | Sí | **REAL** |
| **E6** | **Excepción al leer un archivo del lote** | al analizar | **"No pudimos leer el archivo"** — *"«{nombre}» no se pudo abrir. Verifica que sea un CSV, XLS o XLSX válido y que no esté protegido con contraseña."* | Sí | **REAL** |
| **E7** | **Falla la escritura** | al cargar, pasada la revisión | ver §12 | El ítem (reintentable) | token demo |

Los estados `error` y `empty` se dibujan **sin contenedor y centrados verticalmente** en el panel, con ícono, título y descripción — no como una tarjeta con borde.

**E4 no es un error del archivo**: es que **no es la plantilla**. Por eso tiene su propia pantalla y dice qué columnas esperaba, en vez de decir que algo está roto.

### 11.1 Los cuatro primeros valen para las tres operaciones

El error salta **antes de mirar las columnas**, así que se puede subir cualquiera de esos archivos con la operación que se quiera.

### 11.2 Por qué tres se disparan por el nombre

Es una decisión del prototipo, no una limitación del diseño:

- Un `.xlsx` **de verdad corrupto** no se puede versionar — git lo trata como binario roto y cualquier editor que lo abra lo "arregla".
- Uno **de 10 MB pesa 10 MB**.
- **Falla de carga** necesita un archivo válido que pase la revisión entera para llegar al momento de escribir.

El token en el nombre hace que un archivo válido reproduzca el error a voluntad, tantas veces como se quiera.

**Tokens activos** (substring, insensible a mayúsculas, sobre el nombre del archivo):

| Token | Efecto |
|---|---|
| `pesado`, `grande` | E2 — Archivo demasiado grande |
| `corrupto`, `danado`, `dañado` | E3 — No pudimos leer el archivo |
| `sin-estructura`, `vacio`, `vacío` | E4 — No encontramos objetivos (atajo; el caso también es real) |
| `falla-carga`, `error-carga` | E7 — Falla de escritura al 60% |

> ⚠️ **Estos tokens están activos en el camino de producción**, no detrás de un flag. Un archivo real llamado `objetivos-ciclo-grande.xlsx` sería rechazado como "demasiado grande" sin mirar su tamaño. Es la primera cosa a quitar al conectar el backend (§14).

**Los que sí son reales:** el `.zip` es un `.zip` de verdad, y el "sin estructura" es un `.xlsx` legítimo con un reporte comercial adentro — el parser lo abre bien y no reconoce ni una columna.

---

## 12. La carga: escritura, fallo y reintento

### 12.1 Qué se envía y en qué orden

Solo los grupos en **"Alineados"** — el mismo conjunto que contó el botón. Dentro de cada grupo:

1. Primero, los **objetivos existentes que el revisor ajustó** (`hasSavedEdits`) y que ninguna fila del archivo ya reescribe.
2. Después, las **filas del archivo**.

Ese orden es obligatorio: un objetivo cuyo peso se bajó para hacer sitio tiene que escribirse **antes** que las filas que necesitan ese sitio, o la plataforma las rechazaría por reventar el 100% a mitad de carga.

### 12.2 La escritura es una tarea de fondo

No hay paso `loading` en el wizard. Al confirmar, el drawer **vuelve al dropzone en el tab "Cargas"** y la escritura corre detrás, a **una fila cada 900 ms** (`UPLOAD_TICK_MS`) — deliberadamente lento, para que los fallos se puedan leer.

El progreso es **derivado, nunca almacenado**: `filas con respuesta / total`. Por eso todas las superficies (tarjeta, bandeja, historial) coinciden siempre.

### 12.3 Fallo por fila vs. servicio caído — dos noticias, dos colores

| | **Ámbar, sin botón** | **Rojo, con Reintentar** |
|---|---|---|
| Qué pasó | la plataforma **rechazó** filas concretas por sus datos | la plataforma **no rechazó nada**: dejó de responder |
| Mensaje | `{n} cargados · {m} con error` | `La carga se interrumpió: {n} objetivos alcanzaron a cargarse y quedaron {m} sin cargar.` |
| ¿Reintentar? | **No** — mandarlas otra vez daría el mismo no | **Sí** — los datos estaban bien |

Por eso el botón cuelga de `serviceFailed` y **no** del conteo de errores.

**Qué filas fallan (rechazo por dato):** decidido por posición, sin azar, para que el mismo archivo falle siempre las mismas filas:

```ts
function failureFor(index: number): boolean {
  return index % 13 === 6 || index % 7 === 4 || index % 11 === 9;
}
```

Y solo se aplica si el archivo **no llegó limpio**:

```ts
const cameInClean = analysis?.groups.every((g) => bucketForGroup(g) === 'alineados') ?? true;
willFail: !cameInClean && failureFor(index)
```

→ el happy path carga con **cero** fallos de escritura; el archivo de las 4 pestañas sí los tiene, incluso en filas que el revisor acaba de arreglar.

**Servicio caído:** se dispara con `/falla-carga|error-carga/i` sobre el nombre, y cae en

```ts
Math.max(1, Math.ceil(rows.length * 0.6))
```

es decir, pasado el **60%**, para que se vea lo que importa: **unas filas ya entraron y no se van a deshacer solas.**

### 12.4 El reintento

```ts
rows: task.rows.map((row) =>
  row.status === 'failed' ? { ...row, status: 'pending', willFail: false } : row
)
```

- Reenvía **solo lo que nunca entró**. Las filas ya escritas se dejan en paz: reescribirlas las duplicaría.
- **Retoma desde donde estaba, no desde 0%.** Con las 26 filas del happy path: falla en la 16, así que el reintento arranca en `16/26` = **62%** y sube desde ahí.
- **Siempre entra**, por dos motivos: cada fila reintentada recibe `willFail: false`, y `runUploadProgress` se llama **sin** `failsAtRow`. El fallo que responde es un servicio caído, y la demo no tiene forma de dejarlo caído; un reintento que fallara siempre sería un callejón sin salida, no un caso.
- Botón: **"Reintentar"** + la línea *"Estamos teniendo problemas técnicos. Lo que ya cargó se mantiene."*

### 12.5 La bandeja flotante

Aparece **solo con el drawer cerrado**, y por dos motivos: una revisión aparcada o una carga en marcha.

```ts
const isTrayVisible = !open && (isMinimized || (showTray && uploadTasks.length > 0));
```

| Situación | Título | Contenido |
|---|---|---|
| Carga en curso | `Cargando objetivos…` + `{n} en curso` | nombre + porcentaje por tarea |
| Terminada | `Carga completada` | `{n} objetivos no se pudieron guardar` o *La carga se interrumpió. Ábrela para reintentar.* |
| Revisión aparcada | `Carga masiva en revisión` | **Revisión sin terminar** · `{x} de {y} listos · faltan {n} usuarios` + **Retomar** |

Cerrar la bandeja con una revisión aparcada pregunta: **"¿Descartar esta carga?"** — *"Se pierde todo lo que resolviste en el archivo."* → **Conservarla** / **Descartar**.

### 12.6 Al terminar

Se dispara `onUploaded(n)` con el número de filas **no fallidas**, y el detalle del ciclo **recarga el roster en silencio** (`reloadRoster`) volviendo a la página 1. Sin toast: el drawer ya reportó el resultado, y un segundo *"lista actualizada"* encima sería ruido.

### 12.7 El historial

La pestaña "Cargas" muestra las cargas de esta sesión arriba y, debajo, **"Historial de cargas · Últimos 7 días"** con cuatro cargas sembradas — **todas con 0 errores, a propósito**. Un historial que recibe al revisor con conteos rojos se lee como un producto que pierde datos de rutina, y volvería insignificante el rojo de su propia carga.

---

## 13. Instructivo: cómo reproducir cada caso

### 13.1 Preparación

```bash
# 1. Generar los archivos de muestra (crea/actualiza demo-samples/objetivos/)
node scripts/generate-objetivos-samples.cjs

# 2. Levantar el proyecto
npm install   # solo la primera vez
npm run dev   # abre http://localhost:5173
```

### 13.2 Cómo abrir el drawer

1. Abrir `http://localhost:5173`.
2. En **"Ciclos de objetivos"**, entrar al ciclo **"prueba nobis sin inicial reducir"** (`cyc-001`).

   > Es el **único ciclo con objetivos previos escritos uno por uno** en `cycleObjectives`. En los demás el roster se genera y nadie trae objetivos previos, así que los casos de §9 no se reproducen ahí.
3. En la barra de **"Lista de usuarios asignados"**, clic en **Carga masiva**.
4. Tab **"Nueva carga"** → elegir la operación → soltar el archivo → **Analizar**.

### 13.3 Tabla rápida: archivo → operación → caso

| # | Archivo | Operación | Qué demuestra |
|---|---|---|---|
| 1 | `1 - Crear - happy path.xlsx` | **Cargar objetivos** | Happy path. 8 usuarios · 26 objetivos, todos en Alineados |
| 2 | `2 - Crear - las 4 pestañas de la revisión.xlsx` | **Cargar objetivos** | Las 4 pestañas a la vez: 3 / 6 / 4 / 4 |
| 3 | `3 - Crear - usuario que ya tiene objetivos.xlsx` | **Cargar objetivos** | La regla del 100% contra objetivos previos |
| 4 | `4 - Editar - happy path.xlsx` | **Editar objetivos** | Happy path de edición. 3 usuarios · 8 filas |
| 5 | `5 - Editar - match de objetivos por nombre.xlsx` | **Editar objetivos** | Las dos alineaciones (usuario + objetivo) en juego |
| 6 | `6 - Editar - subir peso sin bajar otro.xlsx` | **Editar objetivos** | El caso de peso que solo existe editando |
| 7 | `7 - Actualizar - happy path.xlsx` | **Actualizar objetivos** | Happy path de avances. 3 usuarios · 7 filas |
| 8 | `8 - Actualizar - avances con errores y avisos.xlsx` | **Actualizar objetivos** | Las 4 pestañas con los problemas propios de un avance |
| 9 | `9 - Error - archivo pesado.xlsx` | cualquiera | **E2** — rechazado al soltarlo |
| 10 | `10 - Error - archivo corrupto.xlsx` | cualquiera | **E3** — pantalla "No pudimos leer el archivo" |
| 11 | `11 - Error - archivo sin-estructura.xlsx` | cualquiera | **E4** — pantalla "No encontramos objetivos" |
| 12 | `12 - Error - formato no soportado.zip` | ninguna | **E1** — ni siquiera se adjunta |
| 13 | `13 - Crear - falla-carga.xlsx` | **Cargar objetivos** | **E7** — falla al 60% + Reintentar |
| 14 | `14 - Editar - falla-carga.xlsx` | **Editar objetivos** | **E7** en edición |
| 15 | `15 - Actualizar - falla-carga.xlsx` | **Actualizar objetivos** | **E7** en avances |

---

### 13.4 Caso 1 · `1 - Crear - happy path.xlsx` → **Cargar objetivos**

**8 usuarios · 26 objetivos.** Todos con alineación exacta y pesos que suman 100%. Los 8 caen en **Alineados** y la carga entra sin corregir nada. Un solo archivo ejercita toda la matriz de un objetivo:

| Qué se ejercita | Dónde |
|---|---|
| Los 4 tipos de medida | repartidos entre los 8 usuarios |
| Ambas direcciones | 15 `Aumentar` y 11 `Reducir` |
| **Con** valor inicial → **R6a** | 20 filas |
| **Sin** inicial + meta positiva → **R6b-1** | `martica` · 2 filas |
| Meta negativa **con** inicial → R6a con signo invertido | `crrincon@example.co` · 2 filas |
| **Sin** inicial + `Aumentar` + meta negativa → **R6b-2** | `pobjetivos` · "Llevar el EBITDA…" |
| **Sin** inicial + `Reducir` + meta negativa → **R6c-2** | `pobjetivos` · "Llevar el balance de mermas…" |
| Con mínimo **y** máximo → R4 / R5 | 14 filas |
| **Solo** mínimo (sin techo) | `surveys19` · "Bajar el costo por adquisición" |
| **Solo** máximo (sin piso) | `surveys19` · "Incrementar las oportunidades" |
| **Sin** topes | 9 filas |
| Objetivo binario (`0 → 1`) | 5 filas de `Se cumple / No se cumple` |
| **Aviso R4 ámbar que NO bloquea** | `jlopezsincrorolesypermisos01@example.co` · "Aumentar la disponibilidad" (mínimo 99.8 con meta 99.5) |
| Alineación por **nickname / correo / documento** | `martica` · `usercreadorqa@example.co` · `1032456789` |
| Usuario que existe en UBITS pero **no está en el ciclo** | `lgomez@example.co` y `1032456789` — se alinean igual; la carga los agrega al ciclo |

**Qué verificar:** los 4 contadores marcan `0 / 0 / 0 / 8`, el botón dice **"Cargar 26 objetivos alineados"**, y al cargar **no falla ninguna fila** (§12.3).

---

### 13.5 Caso 2 · `2 - Crear - las 4 pestañas de la revisión.xlsx` → **Cargar objetivos**

**17 identificadores · 33 objetivos.** Abre en **"Sin alinear"** porque ahí está el bloqueo más duro. Contadores: **3 / 6 / 4 / 4**, botón **"Cargar 10 objetivos alineados"**.

**Alineados — todas las formas de una alineación confirmada:**

| Identificador | Por qué resuelve |
|---|---|
| `martica` | nickname del ciclo |
| `crrincon@example.co` | el correo **es** el username |
| `surveys19@example.co` | correo, cuando el username en UBITS es `surveys19` → muestra "En el archivo: … (correo)" |
| `1032456789` | documento; existe en UBITS pero todavía no en el ciclo |
| `52487931` | documento de Laura Gómez, también fuera del ciclo |

**Sin alinear — nada que proponer:**

| Identificador | Por qué |
|---|---|
| `desconocido.persona@example.co` | ningún usuario corresponde y no hay nada parecido |
| `camila.rojas@proveedor-externo.com` | igual, y **además** trae un R1 con pesos al 85%: la tarjeta no muestra esos errores hasta que tenga dueño |
| `operacion.aliada@tercero-externo.com` | los tres bloqueos juntos: sin usuario, pesos al 130% y un R3 |

**Posible alineación — lo que solo se puede proponer:**

| Identificador | Propuesta |
|---|---|
| `martica@gmail.com` | misma parte local que el nickname `martica` → propone `marta forero`. **Duplica al primer grupo a propósito**, para ver el aviso "Usuario repetido" |
| `natalia.vargas` | parte local del correo de Natalia Vargas → propone `nvargas` |
| `802345711` | documento de Ricardo Mejía (`80234571`) con un dígito extra |

> En esta pestaña **lo único naranja es el chip "Por confirmar"**. La tarjeta, el campo del nombre y el banner de la propuesta van en gris: el color marca la excepción, no el contenedor.

**Con errores — una violación distinta por usuario:**

| Identificador | Qué rompe |
|---|---|
| `pobjetivos` | **R1** (meta bajo el inicial en incremento) + **R3** (meta igual al inicial), pesos al **80%** |
| `ctorres` | **R2** (meta sobre el inicial en reducción), pesos al **120%** |
| `usercreadorqa@example.co` | tres filas en progresión: **R0b** · **PESO_MIN** · y una con **los dos a la vez** — `PESO_MIN` + `R2` en la misma fila, que marca la celda de Peso **y** la de Meta y lista dos mensajes rojos. Sus pesos suman 100%, así que el único bloqueo son los datos |
| `dcastano@example.co` | **TITULO_MAX** (título de 174 caracteres) |

**Qué probar:**

| Acción | Resultado esperado |
|---|---|
| Abrir el resumen | arranca en **Sin alinear**; contadores 3 / 6 / 4 / 4; botón `Cargar 10 objetivos alineados` |
| Borrar todos los grupos alineados | el botón se desactiva con el motivo *"Resuelve al menos un usuario…"* |
| Pulsar **"Sí, es"** en una propuesta | el grupo salta a **Alineados** y el conteo del botón sube |
| Pulsar **"No"** | queda **"Sin usuario asignado"** y el grupo baja a **Con errores** |
| Asignar un usuario a mano en un grupo sin alinear | sale de **Sin alinear** y sube a **Alineados** |
| Clic en el **nombre del usuario** → buscar `52487931` | el nombre es el selector; encuentra a Laura Gómez **por documento**; también sirve nombre, username o correo |
| Confirmar `martica@gmail.com` como `marta forero` | la tarjeta pregunta si **unificar**; si no se unifica, ambos grupos muestran **"Usuario repetido"** |
| Corregir R1/R3 y dejar los pesos en 100% en `pobjetivos` | el grupo sale de **Con errores** |

---

### 13.6 Caso 3 · `3 - Crear - usuario que ya tiene objetivos.xlsx` → **Cargar objetivos**

**4 usuarios · 7 objetivos**, todos con alineación exacta y **todas las filas válidas**. Aun así **2 caen en "Con errores"**: la regla del 100% no es sobre lo que trae el archivo, es sobre **todo lo que carga la persona**.

Los objetivos previos aparecen **en la misma tabla y con los mismos campos editables**, marcados con un chip. Primero las filas del archivo, después lo que ya estaba:

```
   1  Abrir el canal de aliados…      25%
   2  Certificar al equipo…           15%
   3  Sostener la cuota mensual…      45%   [Ya en UBITS]
   4  Elevar el ticket promedio…      35%   [Ya en UBITS]
   5  Mantener la satisfacción…       20%   [Ya en UBITS]
```

| Usuario | Ya tenía | El archivo trae | Total | Dónde cae |
|---|---|---|---|---|
| `svalencia` | 3 objetivos · **100%** | 2 · 40% | **140%** | **Con errores** — está llena; no hay un número obvio que bajar |
| `mtoro@example.co` | 2 · **55%** | 2 · 60% | **115%** | **Con errores** — se pasa por poco |
| `apineda` | 1 · **60%** | 1 · 40% | **100%** | **Alineados** — el archivo trae exactamente el espacio que faltaba |
| `crrincon@example.co` | — | 2 · 100% | **100%** | **Alineados** — sin mitad previa, la tarjeta se ve como siempre |

`apineda` está justamente para que "ya tiene objetivos" no se lea como sinónimo de error: su tarjeta muestra las dos mitades y un aviso **neutro** confirmando que cuadran.

**Qué probar:**

| Acción | Resultado esperado |
|---|---|
| Abrir el resumen | arranca en **Con errores** con `svalencia` y `mtoro@example.co`; el chip dice `+ 3 en UBITS` y `Peso 140% · sobra 40%` |
| Bajar el peso de un objetivo **ya existente** de `svalencia` | su chip pasa a **"Se actualizará"**, el total baja y aparece el botón de deshacer |
| Dejar el total en 100% | la tarjeta sale de **Con errores** y el aviso pasa a neutro: *"El peso cuadra en 100%"* |
| Deshacer el ajuste | la fila vuelve a **"Ya en UBITS"** y el total regresa a 140% |
| Quitar de la carga las 2 filas del archivo de `svalencia` | la tarjeta desaparece: sin filas del archivo no hay nada que cargar |
| Cargar tras ajustar | la carga escribe **primero los ajustados** y después los nuevos |
| Abrir `apineda` | sus dos objetivos en una lista, aviso neutro, y ya está en **Alineados** |

---

### 13.7 Casos 4, 5 y 6 · **Editar objetivos**

#### Caso 4 · `4 - Editar - happy path.xlsx`

**3 usuarios · 8 filas**, todas con alineación exacta de usuario **y** de objetivo, y totales en 100%. Botón: **"Editar 8 objetivos alineados"**.

| Usuario | Qué demuestra |
|---|---|
| `evargas@example.co` | 4 alineaciones exactas con pesos redistribuidos (30/30/25/15 → 35/30/20/15) y **un renombre** vía `nombre_objetivo_nuevo` |
| `lcastillo` | los dos objetivos "embudo" se distinguen porque el archivo trae el nombre completo de cada uno |
| `apineda` | tenía **60%** y el archivo lo lleva a 100%: editar también sirve para corregir |

#### Caso 5 · `5 - Editar - match de objetivos por nombre.xlsx`

**4 usuarios · 10 filas.** Las cuatro pestañas a la vez, con **las dos alineaciones** en juego. Abre en **Sin alinear** con **1 / 1 / 2 / 0**.

| Usuario | Alineación de usuario | Alineación de objetivos |
|---|---|---|
| `evargas@example.co` | correo exacto | los tres estados en una tarjeta: 1 exacto, **2 propuestos** ("Reducir el costo de infraestructura" le falta *mensual*; "Bajar el tiempo de respuesta" le falta *del API*) y 1 sin alinear |
| `Lucia Castillo Pena` | **nombre sin tilde** → solo se propone | hasta confirmar el usuario no hay dónde buscar, así que todo dice "Se creará nuevo". Al confirmarlo, uno hace match exacto y **"Aumentar la conversión del embudo" empata entre sus dos embudos** → hay que elegir a mano |
| `jromero@example.co` | correo exacto | 1 propuesto + 1 exacto, y la fila propuesta **además** rompe **R2** |
| `nadie.externo@proveedor.com` | **sin nada que proponer** | sin usuario no hay objetivos donde buscar |

**Qué probar:**

| Acción | Resultado esperado |
|---|---|
| Abrir `evargas@example.co` en **Con errores** | `Peso 155% · sobra 55%` y Confirmar deshabilitado: *"Confirma a qué objetivo de UBITS corresponden 2 filas del archivo"* |
| Confirmar las **dos propuestas** | la tarjeta pasa a **Alineados** y el aviso cambia a *"El peso cuadra en 100%"* — **sin tocar un solo peso** (§9.1) |
| Confirmar a `Lucia Castillo Pena` | sus enlaces **se recalculan**: uno exacto, el otro ambiguo |
| Abrir el picker del ambiguo | los **dos** embudos aparecen sin badge "Propuesto"; el peso y la meta son lo que permite elegir |
| Asociarlo al embudo **comercial** | pasa a **Alineados** con 100% |
| En `jromero@example.co`, confirmar la propuesta | el peso cuadra en 100% y quedan los errores de dato |
| Abrir "Recuperar los envíos devueltos" | **dos errores en una fila**: `PESO_MIN` + `R1`, celdas de Peso **y** Meta marcadas, dos mensajes rojos. Llega además con chip **Nuevo** |
| Cambiar el usuario de una tarjeta ya alineada | los enlaces se **borran** y se recalculan contra los objetivos del nuevo usuario |

#### Caso 6 · `6 - Editar - subir peso sin bajar otro.xlsx`

**3 usuarios · 5 filas**, todas con alineación exacta y todas válidas. Aun así **2 caen en "Con errores"**: el caso que solo existe editando es **subirle el peso a un objetivo sin bajárselo a ningún otro**.

| Usuario | Reescribe | Intactos | Total | Dónde cae |
|---|---|---|---|---|
| `svalencia` | 2 de 3 (45→60, 35→50) | 20% | **130%** | **Con errores** — sobra 30% |
| `jromero@example.co` | 1 de 2 (55→80) | 45% | **125%** | **Con errores** — sobra 25% |
| `mtoro@example.co` | 1 de 2 (30→40) **+ 1 nuevo** al 35% | 25% | **100%** | **Alineados** |

`mtoro@example.co` muestra de paso el caso mixto: una fila que reescribe y otra que crea, en la misma tarjeta.

---

### 13.8 Casos 7 y 8 · **Actualizar objetivos**

#### Caso 7 · `7 - Actualizar - happy path.xlsx`

**3 usuarios · 7 filas** (correo, correo y nickname), **sin un solo error ni aviso**. Los tres caen en **Alineados** directo. Cubre:

- Las cuatro medidas y las dos direcciones.
- Un avance que llega **justo a la meta** (100%).
- Un objetivo **binario** que pasa de *no se cumple* a *se cumple*.
- Y el que más se olvida: un objetivo sobre el que **nadie había reportado todavía** — su `avance_actual` va vacío y la tabla muestra `—`, que **no es lo mismo que ir en cero**.

**Qué verificar:** todas las columnas salvo *Nuevo avance* son de solo lectura, y la columna **Cumplimiento** muestra el porcentaje calculado (§8.4).

#### Caso 8 · `8 - Actualizar - avances con errores y avisos.xlsx`

Las cuatro pestañas a la vez, con un problema distinto por fila.

| Usuario | Pestaña | Qué trae |
|---|---|---|
| `evargas@example.co` | Con errores | una **propuesta** por nombre a medias, una con el **avance vacío**, una que **no existe** en UBITS, y filas limpias |
| `jromero@example.co` | **Alineados** | dos filas que **solo avisan**: una retrocede *y* no alcanza el mínimo (cumplimiento **0%**), la otra se pasa del máximo (**126.7%**). Es el contraejemplo que evita leer "aviso" como "error" |
| `Lucia Castillo Pena` | Posible alineación | nombre sin tilde → hay que confirmar la persona. Al confirmarla, uno de sus objetivos hace match exacto y el otro **empata entre sus dos embudos** |
| `nadie.externo@proveedor.com` | Sin alinear | ningún usuario de UBITS detrás del correo |

**Qué probar:**

| Acción | Resultado esperado |
|---|---|
| Abrir el selector de una fila **Por confirmar** | dice *"Te proponemos esta asociación por nombre"* y **no ofrece** "Crear como objetivo nuevo" |
| Confirmar esa propuesta | la fila se llena de golpe: medida, dirección, inicial, meta y avance actual aparecen — **salen del objetivo, no del archivo** — y el cumplimiento se calcula |
| Mirar las filas **sin objetivo resuelto** | todas sus columnas dicen `—`. No se rellenan con lo que trae el archivo: eso sería presentar como dato una afirmación sin verificar |
| Escribir el avance que falta en la fila vacía | el error desaparece y el grupo puede confirmarse |
| Confirmar a `Lucia Castillo Pena` | sus enlaces se recalculan: uno exacto y el otro ambiguo, así que la tarjeta pasa a **Con errores** |
| Buscar la regla del 100% | **no está en ninguna parte**, y es a propósito |

---

### 13.9 Casos 9 a 12 · errores de archivo

Los cuatro valen para **las tres operaciones** — el error salta antes de mirar las columnas.

| Archivo | Cómo se prueba | Qué se ve |
|---|---|---|
| `12 - Error - formato no soportado.zip` | soltarlo en el dropzone | el dropzone se pone **rojo**: *"El tipo de archivo «.zip» no está permitido. Acepta Excel, CSV."* El archivo **no se adjunta** y **Analizar** sigue deshabilitado |
| `9 - Error - archivo pesado.xlsx` | soltarlo | mismo lugar: *"El archivo supera el límite de 10 MB…"* |
| `10 - Error - archivo corrupto.xlsx` | soltarlo → **Analizar** | pantalla completa: **"No pudimos leer el archivo"** + **Subir otro archivo** |
| `11 - Error - archivo sin-estructura.xlsx` | soltarlo → **Analizar** | pantalla completa: **"No encontramos objetivos"**, con las columnas que esperaba |

### 13.10 Casos 13, 14 y 15 · falla la carga

Uno por operación, y ahí sí hace falta: para llegar al momento de escribir hay que **pasar la revisión entera**, así que cada uno es un archivo **válido** para su plantilla (copia del happy path correspondiente).

**Secuencia esperada:**

1. Subir con la operación que dice el nombre → **Analizar** → la revisión se ve **idéntica al happy path** (todos en Alineados).
2. Pulsar **"Cargar / Editar / Actualizar N objetivos alineados"** → el drawer salta al tab **"Cargas"** y la barra avanza.
3. **Pasado el 60% se cae.** Las filas que ya entraron **se quedan como entraron**.
4. La tarjeta se pone en **rojo**: *"La carga se interrumpió: 16 objetivos alcanzaron a cargarse y quedaron 10 sin cargar."*
5. Aparece **Reintentar** con la línea *"Estamos teniendo problemas técnicos. Lo que ya cargó se mantiene."*
6. El reintento manda **solo las 10 que faltaban** — retoma en **62%** (`16/26`), no en 0% — y esta vez entra. **Nada se duplica.**

---

### 13.11 Archivo con la operación equivocada (M1)

No hace falta un archivo nuevo: se reproduce con los que ya hay, subiéndolos en la operación que no les toca.

| Operación a elegir | Archivo a subir | Qué debe pasar |
|---|---|---|
| **Cargar objetivos** | `7 - Actualizar - happy path.xlsx` | Al terminar el análisis vuelve a la pantalla de carga con **"Este archivo es para actualizar avances"** y el botón *Cambiar a "Actualizar objetivos" y analizar* |
| **Editar objetivos** | `7 - Actualizar - happy path.xlsx` | Igual: gana `nuevo_avance` sobre cualquier otra señal |
| **Cargar objetivos** | `4 - Editar - happy path.xlsx` | **"Este archivo es para editar objetivos"** + botón a *Editar objetivos* |
| **Actualizar objetivos** | `1 - Crear - happy path.xlsx` | **"Este archivo no trae avances"**, y **sin botón** — no se puede saber si era de crear o de editar |
| **Actualizar objetivos** | `4 - Editar - happy path.xlsx` | Mismo mensaje, pero **sí** ofrece botón a *Editar objetivos*: el archivo trae `nombre_objetivo_nuevo` |

**Qué más probar:**

| Acción | Resultado esperado |
|---|---|
| Pulsar el botón de corrección | Cambia la operación, **conserva el archivo** y reanaliza solo, hasta la revisión |
| Cambiar la operación a mano con el aviso en pantalla | El aviso desaparece **y el archivo se descarta** (es la ruta que sí duda) |
| Soltar otro archivo con el aviso en pantalla | El aviso desaparece: hablaba del anterior |
| Subir cada archivo en **su** operación | **No aparece ningún aviso** — pasa directo a la revisión |
| **Editar objetivos** + un archivo sin `nombre_objetivo_nuevo` | **No avisa**, a propósito: quien no renombra nada puede haber borrado esa columna |

### 13.12 Casos que se prueban editando, no subiendo

Todo lo que sigue es reactivo: las reglas corren **en cada tecla**. Se prueban sobre cualquier archivo ya analizado.

| Acción | Resultado esperado |
|---|---|
| Bajar la `meta` por debajo del `valor inicial` en una fila `Aumentar` | error **R1**, campo en rojo, el grupo pasa a **Con errores** |
| Subir la `meta` por encima del inicial en una fila `Reducir` | error **R2** |
| Poner `meta` igual al `valor inicial` | error **R3** |
| Borrar el `valor inicial` y poner `meta = 0` | error **R0b** |
| Vaciar la `meta` | error `META_VACIA`, y **ninguna otra regla se reporta** |
| Poner `peso` en `0` | error `PESO_MIN` |
| Pegar un título de más de 150 caracteres | error `TITULO_MAX`, con el contador `x/150` bajo el campo |
| Mover el `mínimo` más allá de la `meta` | aviso **R4** (ámbar, no bloquea) |
| Dejar el `máximo` antes de la `meta` | aviso **R5** (ámbar, no bloquea) |
| Romper la `meta` **con** un mínimo o máximo puestos | **solo** el error rojo de la meta — R4 y R5 se callan (§8.3) |
| Eliminar una fila | el total deja de sumar 100% y el grupo cae a **Con errores** si se pasa |
| Editar un objetivo que **ya existe en UBITS** | su chip pasa a **"Se actualizará"**; si el cambio lo vuelve inválido, se marca en rojo igual que las del archivo |
| Escribir pesos que sumen **menos** de 100% | **no bloquea** — el chip queda gris y el aviso es ámbar, no rojo |
| Escribir pesos que sumen **más** de 100% | bloquea, chip rojo `Peso X% · sobra Y%` |
| Minimizar con la revisión a medias | bandeja abajo a la derecha con **"Revisión sin terminar"** y **Retomar** |
| Cerrar el drawer con la X estando en la revisión | **minimiza**, no descarta |
| Pulsar **Cancelar** en la revisión | pregunta *"¿Descartar esta carga? Se pierden las N filas revisadas…"* |

---

## 14. Notas para el PM (redacción de HU)

### 14.1 Separación por épica

1. **Elección de operación y subida** — las tres plantillas, validación de extensión/tamaño.
2. **Análisis y parseo** — encabezado por alias, coerción de valores, escala de pesos, notas.
3. **Alineación de usuarios** — los tres estados y las siete vías de propuesta, el selector, la unificación.
4. **Alineación de objetivos** (editar/actualizar) — umbrales, empates, un objetivo por fila, el selector.
5. **Reglas de negocio** — R0–R6, límites de campo, la regla del 100%.
6. **Revisión** — las 4 pestañas, el botón Confirmar, edición de objetivos previos.
7. **Carga y resultado** — escritura en segundo plano, bandeja, fallo parcial, servicio caído + reintento.
8. **Manejo de errores** — E1–E7.

Cada caso de §5–§12 es candidato a HU con sus criterios Given/When/Then.

### 14.2 Deuda técnica explícita (lo que hoy es MOCK y debe ser real)

| # | Qué | Dónde |
|---|---|---|
| 1 | **Quitar los tokens por nombre de archivo** (`pesado`, `corrupto`, `falla-carga`, …). Hoy están activos en el camino de producción: un archivo real llamado `…-grande.xlsx` se rechaza sin mirar su tamaño | `index.ts` → `analyzeObjectivesFiles`, `getImmediateValidationError` |
| 2 | **La escritura entera es simulada.** `failureFor` reparte fallos por posición y el reintento siempre entra. Falta el error real de servidor + reintento **idempotente** | `CargaMasivaDrawer.tsx` → `runUploadProgress`, `retryUpload` |
| 3 | **El directorio de UBITS es mock** y se filtra en cliente sobre una lista fija. Falta búsqueda paginada en backend | `objetivosMocks.ts`, `searchDirectory` |
| 4 | **Las decisiones viven en estado de UI** — alineaciones manuales, ajustes de peso, confirmaciones. Se pierden al salir del wizard; deben viajar al backend con la carga | `CargaMasivaDrawer.tsx` |
| 5 | **CSV se acepta pero no se ha probado a fondo** — el parser va por `xlsx`, que lo lee, pero los casos de muestra son todos `.xlsx` | `parseTemplate.ts` |
| 6 | **Faltan los formatos externos**: evaluación de desempeño con bandas 80/100/120, y KDA con grupos anidados y metas en prosa | — |
| 7 | Solo el ciclo `cyc-001` tiene `cycleObjectives` escritos uno por uno. En los demás nadie trae objetivos previos, así que los casos de §9 no se reproducen ahí | `objetivosMocks.ts` |

### 14.3 Reglas de negocio a confirmar

- **"Usuario repetido" avisa pero no bloquea.** La carga sumaría los pesos de los dos grupos. ¿Se fusionan automáticamente, se bloquea la confirmación, o se deja como aviso?
- **Al editar, una fila sin objetivo encontrado se crea como objetivo nuevo.** Está bien como comportamiento por defecto, pero ¿debería UBITS permitirlo en una operación que el usuario pidió como *editar*, o tendría que ser un bloqueo explícito?
- **El umbral de propuesta de objetivos (0.5 de Jaccard, o contención)** está calibrado a ojo sobre estos archivos. Con nombres reales habrá que medirlo: **proponer de más aquí significa reescribir el objetivo equivocado.**
- **El documento no alinea automáticamente.** Confirmar que es la regla correcta para producción, o si un documento único debería bastar.
- **Si falla la escritura de un objetivo *ajustado*** (el que libera peso), los objetivos nuevos que dependían de ese espacio se escribirían igual y el usuario quedaría por encima del 100%. ¿Un fallo ahí debe abortar el resto de la carga de esa persona?
- **Quedarse por debajo del 100% no bloquea.** Confirmar que es correcto cargar a alguien con 80% repartido.
- **Los objetivos previos se pueden editar desde una carga de creación.** Confirmar que es deseable, o si debería exigir la operación *editar*.

---

## 15. Glosario

- **Ciclo:** el periodo al que pertenecen los objetivos. Es dueño de las fechas; ninguna plantilla las trae.
- **Operación:** cuál de las tres cosas hace la carga — crear, editar o actualizar avances. Se elige a mano y determina qué plantilla se espera.
- **Roster:** los usuarios ya asignados al ciclo.
- **Directorio:** todos los usuarios de UBITS. Un identificador puede alinearse con alguien del directorio que no está en el ciclo; la carga lo agrega, pero **nunca crea usuarios nuevos**.
- **Identificador:** lo que el archivo escribe en la columna `username`. Puede ser un username, un correo, un documento o un nombre.
- **Alineación exacta (`matched`):** el identificador coincide con el **username** o el **correo registrado** de un usuario. Es la única vía automática.
- **Posible alineación (`possible`):** hay a quién proponer — por nombre, documento, teléfono o parte del correo — pero nadie lo confirmó todavía. Nunca se vincula solo.
- **Sin alinear (`unmatched`):** nada lleva a un usuario. No es un defecto del archivo: es una decisión pendiente.
- **Enlace de objetivo:** en editar y actualizar, la relación entre una fila del archivo y un objetivo que ya existe. Se resuelve por nombre normalizado.
- **Objetivo resultante:** lo que la persona termina cargando = los objetivos que ya tenía y que el archivo no reescribe, más las filas del archivo. Es lo que mide la regla del 100%.
- **Regla del 100%:** los pesos de una persona deben sumar exactamente 100%. Solo el exceso bloquea.
- **Valor inicial resuelto:** la línea de salida que usa el cálculo. Cuando el archivo no trae valor inicial, es 0 o 2 × meta según el signo de la meta y la dirección (R6b/R6c).
- **Cumplimiento:** el porcentaje que queda registrado para un avance. Se trunca en 0 por abajo, y puede pasar de 100% si el máximo está más allá de la meta.
- **`reviewConfirmed`:** el clic humano en **Confirmar**. Necesario para que una tarjeta llegue a "Alineados", por limpia que esté.
- **Fallo por fila (ámbar):** la plataforma rechazó objetivos concretos por sus datos. No se reintenta.
- **Servicio caído (rojo):** la plataforma dejó de responder. Los datos estaban bien y lo único sensato es **Reintentar**.
- **Bandeja:** el panel flotante abajo a la derecha con el drawer cerrado. Lleva una revisión aparcada o una carga en marcha.
