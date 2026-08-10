# Archivos de muestra para la demo de carga masiva de objetivos

Súbelos desde **Ciclo → Carga masiva**. Para regenerarlos:
`node scripts/generate-objetivos-samples.cjs`.

| # | Archivo | Operación a elegir en el drawer |
|---|---|---|
| 1 | `1 - Crear - happy path.xlsx` | **Cargar objetivos** |
| 2 | `2 - Crear - las 4 pestañas de la revisión.xlsx` | **Cargar objetivos** |
| 3 | `3 - Crear - usuario que ya tiene objetivos.xlsx` | **Cargar objetivos** |
| 4 | `4 - Editar - happy path.xlsx` | **Editar objetivos** |
| 5 | `5 - Editar - match de objetivos por nombre.xlsx` | **Editar objetivos** |
| 6 | `6 - Editar - subir peso sin bajar otro.xlsx` | **Editar objetivos** |
| 7 | `7 - Actualizar - happy path.xlsx` | **Actualizar objetivos** |
| 8 | `8 - Actualizar - avances con errores y avisos.xlsx` | **Actualizar objetivos** |
| 9 | `9 - Error - archivo pesado.xlsx` | cualquiera |
| 10 | `10 - Error - archivo corrupto.xlsx` | cualquiera |
| 11 | `11 - Error - archivo sin-estructura.xlsx` | cualquiera |
| 12 | `12 - Error - formato no soportado.zip` | ninguna (no llega a elegirse) |
| 13 | `13 - Crear - falla-carga.xlsx` | **Cargar objetivos** |
| 14 | `14 - Editar - falla-carga.xlsx` | **Editar objetivos** |
| 15 | `15 - Actualizar - falla-carga.xlsx` | **Actualizar objetivos** |

> **La operación hay que elegirla a mano antes de subir**, y equivocarse no da error:
> da una revisión que no tiene sentido, porque las tres plantillas esperan columnas
> distintas. Por eso el nombre de cada archivo empieza por la suya.

> A diferencia de la demo de encuestas, estos archivos **no disparan nada por su nombre**:
> se parsean de verdad en `src/lib/objectivesImport/parseTemplate.ts`. Si cambias los datos
> del `.xlsx`, la tabla de revisión cambia con ellos. (La única excepción son los casos de
> archivo roto, que sí se simulan por nombre — ver *Pendientes*.)

## Estructura que se lee

La hoja replica la plantilla oficial `create-goals-template.xlsx`, con su orden real de
columnas — que en *crear* pone `cumplimiento_maximo` **antes** de `cumplimiento_minimo`
(en la plantilla de *editar* está al revés). El parser ubica las columnas **por nombre**,
nunca por posición, justamente por esa inconsistencia.

```
username | nombre_objetivo | peso | tipo_medida | aumentar_reducir |
valor_inicial | cumplimiento_maximo | cumplimiento_minimo | meta | descripcion_meta
```

Los `username` coinciden con `SEEDED_ASSIGNED_USERS` de `src/mocks/objetivosMocks.ts`,
así que el match contra el ciclo es real. **Si editas uno, edita el otro.**

## Caso 1 — Happy path · cobertura completa

| Archivo | Qué demuestra |
|---------|----------------|
| `1 - Crear - happy path.xlsx` | **8 usuarios · 26 objetivos**, todos con match exacto y pesos que suman 100%. Los 8 caen en **Alineados** y la carga entra sin corregir nada. |

Un solo archivo ejercita toda la matriz de casos de un objetivo:

| Caso | Dónde |
|---|---|
| Los 4 tipos de medida (`Dinero`, `Porcentaje`, `Numérico`, `Se cumple / No se cumple`) | repartidos entre los 8 usuarios |
| Ambas direcciones (`Aumentar`, `Reducir`) | 15 y 11 filas |
| **Con** valor inicial → **R6a** | 20 filas |
| **Sin** valor inicial + meta positiva → **R6b-1** (inicial implícito = 0) | `martica` · 2 filas |
| **Meta negativa con** inicial → R6a con signo invertido | `crrincon@example.co` · 2 filas |
| **Sin** inicial + `Aumentar` + meta negativa → **R6b-2** (referencia = 2 × meta) | `pobjetivos` · "Llevar el EBITDA…" |
| **Sin** inicial + `Reducir` + meta negativa → **R6c-2** (inicial asumido = 0) | `pobjetivos` · "Llevar el balance de mermas…" |
| Con mínimo **y** máximo → **R4** / **R5** | 14 filas |
| **Solo** mínimo (sin techo) | `surveys19` · "Bajar el costo por adquisición" |
| **Solo** máximo (sin piso) | `surveys19` · "Incrementar las oportunidades" |
| **Sin** topes | 9 filas |
| Objetivo binario (`0 → 1`) | 5 filas de `Se cumple / No se cumple` |
| **Aviso R4 ámbar que NO bloquea** | `jlopezsincrorolesypermisos01@example.co` · "Aumentar la disponibilidad" (mínimo 99.8 con meta 99.5) |
| Match por **nickname** / **correo** / **documento** | `martica` · `usercreadorqa@example.co` · `1032456789` |
| Usuario que existe en UBITS pero **no está en el ciclo** | `lgomez@example.co` y `1032456789` → se alinean igual; la carga los agrega al ciclo |

## Caso 2 — Las 4 pestañas de la revisión

| Archivo | Qué demuestra |
|---------|----------------|
| `2 - Crear - las 4 pestañas de la revisión.xlsx` | **17 identificadores · 33 objetivos** repartidos entre las cuatro pestañas: **3** sin alinear, **6** con posible alineación, **4** con errores, **4** alineados. Abre en "Sin alinear" porque ahí está el bloqueo más duro, y el botón marca `Cargar 10 objetivos alineados`. |

### Alineados — todas las formas de un match confirmado

| Identificador | Por qué resuelve |
|---|---|
| `martica` | nickname del ciclo |
| `crrincon@example.co` | el correo **es** el username |
| `surveys19@example.co` | correo, cuando el username en UBITS es `surveys19` → muestra "En el archivo: … (correo)" |
| `1032456789` | documento; existe en UBITS pero todavía no en el ciclo |
| `52487931` | documento de Laura Gómez, también fuera del ciclo |

Estar o no en el ciclo **no cambia el estado**: lo único que importa es que exista una
alineación con un usuario de UBITS. La carga agrega al ciclo a quien haga falta, pero nunca
crea personas nuevas.

### Sin alinear — nada que proponer

| Identificador | Por qué |
|---|---|
| `desconocido.persona@example.co` | ningún usuario de UBITS corresponde y no hay nada parecido |
| `camila.rojas@proveedor-externo.com` | igual, y **además** trae un R1 con pesos al 85%: la tarjeta no muestra esos errores hasta que tenga dueño |
| `operacion.aliada@tercero-externo.com` | los tres bloqueos juntos: sin usuario, pesos al 130% y un R3 |

Su propia pestaña y no "Con errores", porque un usuario que UBITS no tiene todavía no es
un defecto del archivo: es un contratista, alguien que acaba de entrar, un correo personal.
La carga de objetivos **no crea usuarios**, así que hay que elegirlo a mano.

### Posible alineación — lo que solo se puede proponer

| Identificador | Propuesta |
|---|---|
| `martica@gmail.com` | mismo *local part* que el nickname `martica` → propone `marta forero`. **Duplica al primer grupo a propósito**, para ver el aviso "Usuario repetido" |
| `natalia.vargas` | *local part* del correo de Natalia Vargas → propone `nvargas` |
| `802345711` | documento de Ricardo Mejía (`80234571`) con un dígito extra |

En esta pestaña **lo único naranja es el chip "Por confirmar"**. La tarjeta, el campo del
nombre y el banner de la propuesta van en gris, igual que en *Alineados*: el color marca la
excepción, no el contenedor.

### Con errores — una violación distinta por usuario

| Identificador | Qué rompe |
|---|---|
| `pobjetivos` | **R1** (meta bajo el inicial en incremento) + **R3** (meta igual al inicial), pesos al **80%** |
| `ctorres` | **R2** (meta sobre el inicial en reducción), pesos al **120%** |
| `usercreadorqa@example.co` | tres filas en progresión: **R0b** (sin inicial y meta 0) · **PESO_MIN** (peso 0) · y una con **los dos a la vez** — `PESO_MIN` + `R2` en la misma fila, que marca la celda de Peso **y** la de Meta y lista dos mensajes rojos. Sus pesos suman 100%, así que el único bloqueo son los datos |
| `dcastano@example.co` | **TITULO_MAX** (título de 174 caracteres) |

Los usuarios del directorio viven en `UBITS_DIRECTORY` (`src/mocks/objetivosMocks.ts`) y los del
ciclo en `SEEDED_ASSIGNED_USERS`. **Si editas uno, edita el otro.**

### Qué probar con este archivo

| Acción | Resultado esperado |
|---|---|
| Abrir el resumen | arranca en **Sin alinear**; los contadores son 3 / 6 / 4 / 4 y el botón marca `Cargar 10 objetivos alineados` |
| Borrar todos los grupos alineados | el botón se desactiva y el footer dice "Ningún usuario alineado todavía" |
| Pulsar **"Sí, es"** en una propuesta | el grupo salta a **Alineados** y el conteo del botón sube |
| Pulsar **"No"** | queda **"Sin usuario asignado"** y el grupo baja a **Con errores** |
| Asignar un usuario a mano en un grupo sin match | sale de **Con errores** y sube a **Alineados** |
| Clic en el **nombre del usuario** → buscar `52487931` | el nombre es el selector; encuentra a Laura Gómez **por documento**, y también sirve nombre, username o correo |
| Confirmar `martica@gmail.com` como `marta forero` | ambos grupos se marcan **"Usuario repetido"**: dos identificadores apuntan a la misma persona y sus pesos se sumarían por encima del 100% |
| Corregir R1/R3 y dejar los pesos en 100% en `pobjetivos` | el grupo sale de **Con errores** y baja a la pestaña que le corresponda |

## Caso 3 — Usuarios que **ya tienen** objetivos en el ciclo

| Archivo | Qué demuestra |
|---------|----------------|
| `3 - Crear - usuario que ya tiene objetivos.xlsx` | **4 usuarios · 7 objetivos**, todos con match exacto y todas las filas válidas. Aun así **2 caen en "Con errores"**: la regla del 100% no es sobre lo que trae el archivo, es sobre todo lo que carga la persona. |

Cuando un identificador resuelve a alguien que ya tiene objetivos en el ciclo, esos
objetivos aparecen **en la misma tabla y con los mismos campos editables**, marcados con un
chip. Primero las filas del archivo, después lo que ya estaba:

```
   1  Abrir el canal de aliados…      25%
   2  Certificar al equipo…           15%
   3  Sostener la cuota mensual…      45%   [Ya en UBITS]
   4  Elevar el ticket promedio…      35%   [Ya en UBITS]
   5  Mantener la satisfacción…       20%   [Ya en UBITS]
```

Los objetivos que ya existen **se pueden ajustar**: bajarle el peso a uno de ellos es
muchas veces la única forma de hacerle espacio a los nuevos. Al tocarlo, su chip pasa de
**"Ya en UBITS"** a **"Se actualizará"**, aparece un botón para deshacer el cambio y la
carga lo escribe *antes* que los objetivos nuevos.

| Usuario | Ya tenía | El archivo trae | Total | Dónde cae |
|---|---|---|---|---|
| `svalencia` | 3 objetivos · **100%** | 2 · 40% | **140%** | **Con errores** — está llena; no hay un número obvio que bajar, hay que decidir de dónde sale el 40% |
| `mtoro@example.co` | 2 objetivos · **55%** | 2 · 60% | **115%** | **Con errores** — se pasa por poco; un ajuste chico en cualquiera de los dos lados lo arregla |
| `apineda` | 1 objetivo · **60%** | 1 · 40% | **100%** | **Alineados** — el archivo trae exactamente el espacio que faltaba |
| `crrincon@example.co` | — | 2 · 100% | **100%** | **Alineados** — sin mitad previa, la tarjeta se ve como siempre |

`apineda` está en el archivo justamente para que "ya tiene objetivos" no se lea como
sinónimo de error: su tarjeta muestra las dos mitades y un aviso **neutro** confirmando que
cuadran en 100%.

Los objetivos previos se declaran uno por uno en `cycleObjectives` dentro de
`SEEDED_ASSIGNED_USERS` (`src/mocks/objetivosMocks.ts`). **Si editas uno, edita el otro** —
el script imprime el total por usuario al regenerar, justamente para verificarlo.

### Qué probar con este archivo

| Acción | Resultado esperado |
|---|---|
| Abrir el resumen | arranca en **Con errores** con `svalencia` y `mtoro@example.co`; el chip del header dice `+ 3 en UBITS` y `Peso 140% · sobra 40%` |
| Bajar el peso de un objetivo **ya existente** de `svalencia` | el chip de esa fila pasa a **"Se actualizará"**, el total del header baja y aparece el botón de deshacer |
| Dejar el total en 100% (por cualquiera de los dos lados) | la tarjeta sale de **Con errores** y el aviso pasa a neutro: "El peso cuadra en 100%" |
| Deshacer el ajuste | la fila vuelve a **"Ya en UBITS"** y el total regresa a 140% |
| Quitar de la carga las 2 filas del archivo de `svalencia` | la tarjeta desaparece: sin filas del archivo no hay nada que cargar para ella |
| Cargar después de ajustar | la carga escribe primero los objetivos ajustados y después los nuevos: los nuevos no caben hasta que el peso se libera |
| Abrir `apineda` | sus dos objetivos en una lista, aviso neutro, y su tarjeta ya está en **Alineados** |

## Casos 4, 5 y 6 — los mismos tres, para **editar**

Súbelos con la operación **Editar objetivos**. La plantilla es la de edición, que se
diferencia en dos cosas reales:

```
username | nombre_objetivo | nombre_objetivo_nuevo | peso | tipo_medida |
aumentar_reducir | valor_inicial | cumplimiento_minimo | cumplimiento_maximo |
meta | descripcion_meta
```

1. Trae `nombre_objetivo_nuevo`, así que **`nombre_objetivo` deja de ser un título**:
   pasa a ser el criterio con el que se busca el objetivo en UBITS.
2. Los topes van **al revés** que en creación (`minimo` antes de `maximo`). El parser
   ubica las columnas por nombre justo por esto.

### La alineación que solo existe editando

Además de alinear al **usuario**, hay que alinear el **objetivo**. Y se hace en el mismo
sitio y con el mismo gesto: **el nombre del objetivo es el desplegable**, igual que el
nombre del usuario lo es en la cabecera de la tarjeta. No hay columna aparte ni botón de
"cambiar" — reasociar no es un trámite lateral, es lo que este paso existe para hacer.

Lo que dice cada fila lo dice su **chip**:

| Chip | Qué significa | Al cargar |
|---|---|---|
| **Con cambios** | la fila encontró su objetivo (match exacto o confirmado a mano) | lo reescribe |
| **Por confirmar** | solo se pudo **proponer** cuál es; el nombre queda con borde ámbar | **bloquea** hasta confirmarlo |
| **Se creará nuevo** | no se encontró nada parecido | se crea como objetivo nuevo |
| **Sin cambios** | objetivo que ya tiene y que ninguna fila del archivo toca | se queda igual, pero cuenta para el 100% |

El match es por nombre normalizado (sin tildes, sin mayúsculas, sin puntuación). Cuando
no es exacto, se propone solo si comparten la mayoría de las palabras o si un nombre
contiene al otro — y **si dos objetivos empatan, no se propone ninguno**: proponer a cara
o cruz aquí significa reescribir el objetivo equivocado.

Al hacer clic en el nombre se abre un panel con **buscador entre los objetivos de ese
usuario**, el peso y la meta de cada uno para distinguir los parecidos, y la opción
**"Crear como objetivo nuevo"**. Un objetivo que otra fila ya está reescribiendo **no se
ofrece**: dos ediciones al mismo objetivo se pisarían.

> En una fila de edición el nombre **no se puede reescribir a mano**, porque ahí el nombre
> no es texto libre: es la respuesta a "¿cuál de sus objetivos es este?". El renombre lo
> hace el archivo con `nombre_objetivo_nuevo`.

### La tarjeta es una sola lista

No hay secciones. Las filas del archivo van primero — ahí está el trabajo — y después los
objetivos que el archivo no cambia, todos numerados de corrido. El chip de cada fila dice
cuál es cuál, y a diferencia de un encabezado no se va con el scroll cuando la tarjeta
tiene doce filas.

### El peso se calcula distinto

Una fila que reescribe un objetivo **reemplaza** su peso; una que crea uno nuevo lo
**suma**. Subir un objetivo de 30% a 40% cuesta 10%, no 40%.

Consecuencia útil: **confirmar una propuesta puede cuadrar el peso solo**. Mientras la
propuesta esté sin confirmar el objetivo que reescribiría sigue contando aparte, así
que el total está inflado; al confirmarla, desaparece de la suma.

### Caso 4 · `4 - Editar - happy path.xlsx`

**3 usuarios · 8 filas**, todas con match exacto y totales en 100% → los tres caen en
**Alineados** y el botón marca `Editar 8 objetivos alineados`.

| Usuario | Qué demuestra |
|---|---|
| `evargas@example.co` | 4 match exactos con pesos redistribuidos (30/30/25/15 → 35/30/20/15) y **un renombre** vía `nombre_objetivo_nuevo` |
| `lcastillo` | los dos objetivos "embudo" se distinguen porque el archivo trae el nombre completo de cada uno |
| `apineda` | tenía **60%** (por debajo del 100%) y el archivo lo lleva a 100%: editar también sirve para corregir |

### Caso 5 · `5 - Editar - match de objetivos por nombre.xlsx`

**4 usuarios · 10 filas**. Las cuatro pestañas a la vez, con **las dos alineaciones** en
juego: abre en **Sin alinear** con 1 / 1 / 2 / 0.

| Usuario | Alineación de usuario | Alineación de objetivos |
|---|---|---|
| `evargas@example.co` | correo exacto | los tres estados en una tarjeta: 1 exacto, **2 propuestos** ("Reducir el costo de infraestructura" le falta *mensual*; "Bajar el tiempo de respuesta" le falta *del API*) y 1 **sin match** |
| `Lucia Castillo Pena` | **nombre sin tilde** → solo se propone | hasta confirmar el usuario no hay dónde buscar, así que todo dice "Se creará nuevo". Al confirmarlo, "Reducir el ciclo de venta promedio" hace match exacto y **"Aumentar la conversión del embudo" empata entre sus dos embudos** → hay que elegir a mano |
| `jromero@example.co` | correo exacto | 1 propuesto + 1 exacto, y la fila propuesta **además** rompe **R2** |
| `nadie.externo@proveedor.com` | **sin nada que proponer** | sin usuario no hay objetivos donde buscar |

#### Qué probar con este archivo

| Acción | Resultado esperado |
|---|---|
| Abrir `evargas@example.co` en **Con errores** | `Peso 155% · sobra 55%` y el botón Confirmar deshabilitado diciendo "Confirma a qué objetivo de UBITS corresponden 2 filas del archivo" |
| Confirmar las **dos propuestas** | la tarjeta pasa a **Alineados** y el aviso cambia solo a "El peso cuadra en 100%" — sin tocar un peso |
| Confirmar a `Lucia Castillo Pena` | sus enlaces **se recalculan**: uno hace match exacto y el otro queda ambiguo |
| Abrir el picker del ambiguo | los **dos** embudos aparecen sin badge "Propuesto"; el peso y la meta de cada uno son lo que permite elegir |
| Asociarlo al embudo **comercial** | pasa a **Alineados** con 100% |
| En `jromero@example.co`, confirmar la propuesta | el peso cuadra en 100% y quedan los errores de dato |
| Abrir la tercera fila de `jromero@example.co` ("Recuperar los envíos devueltos") | el caso de **dos errores en una sola fila**: `PESO_MIN` + `R1`, con la celda de Peso **y** la de Meta marcadas y dos mensajes rojos. Llega además con chip **Nuevo**, así que las dos alineaciones y los dos errores conviven en la misma fila |
| Cambiar el usuario de una tarjeta ya alineada | los enlaces se **borran** y se recalculan contra los objetivos del nuevo usuario |

### Caso 6 · `6 - Editar - subir peso sin bajar otro.xlsx`

**3 usuarios · 5 filas**, todas con match exacto y todas válidas. Aun así **2 caen en
"Con errores"**: el caso que solo existe editando es subirle el peso a un objetivo sin
bajárselo a ningún otro.

| Usuario | Reescribe | Intactos | Total | Dónde cae |
|---|---|---|---|---|
| `svalencia` | 2 de 3 (45→60, 35→50) | 20% | **130%** | **Con errores** — sobra 30% |
| `jromero@example.co` | 1 de 2 (55→80) | 45% | **125%** | **Con errores** — sobra 25% |
| `mtoro@example.co` | 1 de 2 (30→40) **+ 1 nuevo** al 35% | 25% | **100%** | **Alineados** |

`mtoro@example.co` está en el archivo para que "edición" no se lea como sinónimo de
problema, y de paso muestra el caso mixto: una fila que reescribe y otra que crea, en
la misma tarjeta.

Los objetivos previos de cada usuario se declaran en `cycleObjectives` dentro de
`SEEDED_ASSIGNED_USERS` (`src/mocks/objetivosMocks.ts`). **Si editas uno, edita el
otro** — el script imprime el total por usuario al regenerar, distinguiendo match
exacto, propuesto y nuevo, justamente para verificarlo.

## Casos 7 y 8 — **actualizar avances**

La tercera operación es la más distinta de las tres, y no por el archivo sino por lo que
se está revisando. Crear y editar discuten **cómo es** un objetivo; actualizar da por
sentado que ya está bien definido y discute **un solo número**: cuánto se lleva avanzado.

### La plantilla trae contexto, no definición

```
username | nombre_objetivo | valor_inicial | meta | avance_actual | nuevo_avance
```

Seis columnas, y **solo `nuevo_avance` se escribe**. Las tres numéricas de antes salen de
UBITS y vuelven tal cual, porque un avance suelto no se puede revisar: `38` no dice nada,
`38 con meta 40 viniendo de 62` se lee de un vistazo. `peso`, `tipo_medida` y los topes no
viajan — no hacen falta para decidir el número, y cada columna de más es una que alguien
puede editar por error creyendo que sirve.

En la tabla de revisión eso se ve directo: **todo es de solo lectura menos una celda**. La
medida, la dirección, el inicial, la meta y el avance actual salen del objetivo tal como
está en UBITS —no del archivo— y a la derecha aparece una columna que las otras dos
operaciones no tienen: **Cumplimiento**, el porcentaje que va a quedar registrado.
Calcularlo a mano cuarenta veces es justamente lo que una carga masiva debería evitar.

### Lo que cambia respecto de editar

| | Editar | Actualizar |
|---|---|---|
| Fila **sin match** | se crea como objetivo nuevo (válido) | **bloquea**: no hay avance que reportar sobre algo que no existe, y este archivo no puede crearlo |
| Botón "Crear como objetivo nuevo" en el selector | sí | **no aparece** |
| Regla del 100% | aplica: la fila reemplaza el peso del objetivo | **no aplica**: esta carga no mueve pesos, así que la tarjeta no habla de porcentajes ni de cuánto falta |
| Objetivos que el archivo no menciona | se listan como peso intacto | no se listan; el header los cuenta como **"N sin reportar"** |

### Lo que bloquea y lo que solo avisa

Solo dos cosas impiden cargar, y las dos son "no sabemos dónde va esto" o "no hay qué
poner":

| Bloquea | Cuándo |
|---|---|
| `AVANCE_VACIO` | la fila viaja sin `nuevo_avance` — el único dato que esta carga escribe |
| **No existe en UBITS** | ningún objetivo de esa persona se llama así, o el nombre a medias empata entre dos |
| **Por confirmar** | solo se pudo *proponer* a qué objetivo corresponde |

El resto avisa y deja pasar, porque **son cosas que de verdad ocurren** y quien revisa es
quien sabe si están bien:

| Avisa | Qué significa |
|---|---|
| `AVANCE_RETROCEDE` | el avance va para atrás respecto de lo registrado. Legítimo si es una corrección; sospechoso si es una columna pegada una fila corrida |
| `R4` | no alcanza el mínimo → el cumplimiento quedará en **0%** |
| `R5` | supera el máximo → se calcula como si hubiera llegado justo al tope. Ojo: si el tope está más allá de la meta, eso da **más de 100%**, y es correcto |

### Caso 7 · `7 - Actualizar - happy path.xlsx`

Siete reportes limpios sobre tres usuarios (correo, correo y nickname), sin un solo error
ni aviso: los tres caen en **Alineados** directo. Cubre las cuatro medidas, las dos
direcciones, un avance que llega justo a la meta (**100%**), un objetivo binario que pasa
de *no se cumple* a *se cumple*, y —el que más se olvida— un objetivo sobre el que **nadie
había reportado todavía**: su `avance_actual` va vacío y la tabla muestra `—`, que no es lo
mismo que ir en cero.

### Caso 8 · `8 - Actualizar - avances con errores y avisos.xlsx`

Las cuatro pestañas a la vez, con un problema distinto por fila.

| Usuario | Pestaña | Qué trae |
|---|---|---|
| `evargas@example.co` | Con errores | las cinco filas: una **propuesta** por nombre a medias, una con el **avance vacío**, una que **no existe** en UBITS, y dos limpias |
| `jromero@example.co` | **Alineados** | dos filas que **solo avisan**: una retrocede *y* no alcanza el mínimo (cumplimiento **0%**), la otra se pasa del máximo (**126.7%**). Es el contraejemplo que evita leer "aviso" como "error" |
| `Lucia Castillo Pena` | Posible alineación | nombre sin tilde → hay que confirmar la persona. Al confirmarla, uno de sus dos objetivos hace match exacto y el otro **empata entre sus dos embudos** → hay que elegir a mano |
| `nadie.externo@proveedor.com` | Sin alinear | ningún usuario de UBITS detrás del correo |

#### Qué probar con este archivo

| Acción | Resultado esperado |
|---|---|
| Abrir el selector de una fila **Por confirmar** | el panel dice *"Te proponemos esta asociación por nombre"* y **no ofrece** "Crear como objetivo nuevo" |
| Confirmar esa propuesta | la fila se llena de golpe: medida, dirección, inicial, meta y avance actual aparecen —salen del objetivo, no del archivo— y el cumplimiento se calcula |
| Mirar las filas **sin objetivo resuelto** | todas sus columnas dicen `—`. No se rellenan con lo que trae el archivo: eso sería presentar como dato una afirmación sin verificar |
| Escribir el avance que falta en la fila vacía | el error desaparece y el contador *"Por corregir"* baja |
| Confirmar a `Lucia Castillo Pena` | sus enlaces se recalculan: uno hace match exacto y el otro queda ambiguo, así que la tarjeta pasa a **Con errores** |
| Buscar la regla del 100% | no está en ninguna parte, y es a propósito |

## Casos 9 a 15 — cuando falla el archivo, no los datos

Estos no ejercitan la revisión: ejercitan lo que pasa **antes** y **después** de
ella. Son los mismos cinco que la carga histórica de encuestas.

| Caso | Cuándo salta | Qué se ve |
|---|---|---|
| **Formato no soportado** (`.zip`) | al soltarlo, sin analizar nada | el dropzone se pone rojo con *"El tipo de archivo `.zip` no está permitido. Acepta Excel o CSV."* El archivo no se adjunta y **Analizar** sigue deshabilitado |
| **Archivo pesado** | al soltarlo | mismo lugar, mismo tratamiento: *"El archivo supera el límite de 10 MB. Comprímelo o divídelo e inténtalo de nuevo."* No hace falta leerlo para saber que no cabe |
| **Archivo corrupto** | al analizar | pantalla completa del drawer: *"No pudimos leer el archivo — parece estar dañado o protegido con contraseña"*, con **Subir otro archivo** |
| **Archivo sin estructura** | al analizar | pantalla completa distinta: *"No encontramos objetivos"*, y dice qué columnas esperaba. No es un error del archivo, es que **no es la plantilla** |
| **Falla la carga** | al escribir, pasada la revisión | ver abajo |

### Por qué tres de ellos se disparan por el nombre

Es una decisión del prototipo, no una limitación. Un `.xlsx` de verdad corrupto
no se puede versionar —git lo trata como binario roto y cualquier editor que lo
abra lo "arregla"— y uno de 10 MB pesa 10 MB. El token en el nombre hace que un
archivo válido reproduzca el error a voluntad, tantas veces como se quiera.

Los dos que **sí son reales**: el `.zip` es un `.zip`, y el "sin estructura" es
un `.xlsx` legítimo con un reporte comercial adentro — el parser lo abre bien y
no reconoce ni una columna.

Los primeros cuatro valen para las tres operaciones, porque el error salta antes
de mirar las columnas. Sube cualquiera con la operación que quieras.

### Caso 13, 14 y 15 · falla la carga

Uno por operación, y ahí sí hace falta: para llegar al momento de escribir hay
que **pasar la revisión**, así que cada uno es un archivo válido para su
plantilla. Los tres son copia del happy path correspondiente.

Lo que pasa al darle **Cargar**:

1. La carga arranca normal y la barra avanza.
2. **Pasado el 60% se cae.** Las filas que ya entraron **se quedan como
   entraron** — eso es lo que de verdad pasa y es justo lo que hay que poder
   ver: la carga no se deshace sola.
3. La tarjeta se pone en **rojo**, no en ámbar: *"La carga se interrumpió: 16
   objetivos alcanzaron a cargarse y quedaron 10 sin cargar."*
4. Aparece **Reintentar 10** con la línea *"Estamos teniendo problemas técnicos.
   Lo que ya cargó se mantiene."*
5. El reintento manda **solo las 10 que faltaban** —retoma en 62%, no en 0%— y
   esta vez entra. Nada se duplica.

> **Rojo vs. ámbar.** Son dos noticias distintas y por eso tienen dos colores.
> Ámbar y sin botón: la plataforma **rechazó** algunas filas por sus datos —
> mandarlas otra vez daría el mismo no. Rojo y con **Reintentar**: la plataforma
> no rechazó nada, dejó de responder; los datos estaban bien y lo único sensato
> es volver a intentar. Por eso el botón cuelga de la interrupción y no del
> conteo de errores.

## Qué se puede probar en la tabla de revisión

Todo lo que sigue es reactivo: las reglas corren en cada tecla. **No hay aprobación por
fila**: lo que decide si un objetivo se carga es que su dato sea válido y su persona esté
resuelta, y eso es exactamente lo que separa las tres pestañas.

| Acción | Resultado esperado |
|---|---|
| Bajar la `meta` por debajo del `valor inicial` en una fila `Aumentar` | error **R1**, el campo se marca en rojo y el grupo pasa a **Con errores** |
| Subir la `meta` por encima del inicial en una fila `Reducir` | error **R2** |
| Poner `meta` igual al `valor inicial` | error **R3** |
| Borrar el `valor inicial` y poner `meta = 0` | error **R0b** |
| Poner `peso` en `0` | error `PESO_MIN` ("no puede ser inferior al 1%") |
| Pegar un título de más de 150 caracteres | error `TITULO_MAX`, con el contador `x/150` bajo el campo |
| Mover el `mínimo` más allá de la `meta` | aviso **R4** (ámbar, no bloquea) |
| Dejar el `máximo` antes de la `meta` | aviso **R5** (ámbar, no bloquea) |
| Romper la `meta` (R0b/R1/R2/R3) con un `mínimo` o `máximo` puestos | **solo** el error rojo de la meta. R4 y R5 se callan cuando la meta ya está mal: son posiciones medidas contra ella, así que acusarían al mínimo de un problema que se arregla corrigiendo la meta |
| Eliminar una fila | el total del usuario deja de sumar 100%, el chip pasa a ámbar y el grupo cae a **Con errores** |
| Editar un objetivo que **ya existe en UBITS** | su chip pasa a **"Se actualizará"**; si el cambio lo vuelve inválido, la fila se marca en rojo igual que las del archivo |
| Corregir un grupo con errores | sale de **Con errores** y sus objetivos entran al conteo del botón de carga |

## Pendientes

- Al editar, una fila **sin match** se crea como objetivo nuevo. Está bien como
  comportamiento por defecto, pero falta decidir si UBITS debería permitirlo en una
  operación que el usuario pidió como "editar", o si tendría que ser un bloqueo
  explícito.
- El umbral de propuesta de objetivos (50% de palabras en común, o un nombre contenido
  en el otro) está calibrado a ojo sobre estos archivos. Con nombres reales habrá que
  medirlo: proponer de más aquí significa reescribir el objetivo equivocado.
- Faltan los formatos externos (evaluación de desempeño con bandas 80/100/120, y KDA
  con grupos anidados y metas en prosa).
- El chip **"Usuario repetido"** avisa de la colisión pero **no la bloquea**: la carga
  seguiría sumando los pesos de los dos grupos. Falta decidir si se fusionan, si se
  bloquea la confirmación, o si se deja como aviso.
- Si falla la escritura de un objetivo **ajustado** (el que libera peso), los objetivos
  nuevos que dependían de ese espacio se escribirían igual y el usuario quedaría por encima
  del 100%. El prototipo reparte los fallos por posición, así que el caso puede salir;
  falta definir si un fallo ahí debe abortar el resto de la carga de ese usuario.
- Solo el ciclo `cyc-001` tiene usuarios con `cycleObjectives` escritos uno por uno. En los
  demás ciclos el roster se genera y nadie trae objetivos previos, así que este caso no se
  reproduce ahí.
