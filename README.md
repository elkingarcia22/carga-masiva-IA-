# Carga masiva de objetivos — prototipo

Prototipo de frontend para la **carga masiva de objetivos de un ciclo** en UBITS: subir un Excel, revisar lo que se detectó y cargarlo. Incluye también el flujo de **carga histórica de encuestas** del que partió este proyecto.

No tiene backend: los datos vienen de mocks y la escritura está simulada. El **parseo de los archivos sí es real** — los `.xlsx` se leen de verdad y toda la revisión (alineación, reglas de negocio, cálculo de cumplimiento) corre sobre lo que traen.

## Correr en local

```bash
npm install
npm run dev
```

Abre `http://localhost:5173`.

| Script | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo (Vite) |
| `npm run build` | Build de producción a `dist/` |
| `npm run preview` | Sirve el build ya hecho |
| `npm run lint` | ESLint |
| `npm run type-check` | `tsc -b` |

> `npm run build` no corre el chequeo de tipos (Vite transpila sin verificar). Para validar tipos usa `npm run type-check` — hoy reporta errores preexistentes en el módulo de *survey-analytics*, ajenos a la carga de objetivos.

## Probar la carga masiva

1. Entra al ciclo **"prueba nobis sin inicial reducir"** — es el único con objetivos previos escritos a mano, así que es donde se reproducen todos los casos.
2. En la lista de usuarios asignados, clic en **Carga masiva**.
3. Elige la operación, suelta un archivo de `demo-samples/objetivos/` y pulsa **Analizar**.

Los 15 archivos de muestra cubren el camino feliz, las cuatro pestañas de la revisión, los errores de archivo y el fallo de carga. Cuál subir para ver cada caso está en:

- **[demo-samples/objetivos/DOCUMENTACION-TECNICA.md](demo-samples/objetivos/DOCUMENTACION-TECNICA.md)** — documentación técnica y funcional completa: reglas, casos de uso, casos de error y el instructivo de reproducción archivo por archivo.
- [demo-samples/objetivos/README.md](demo-samples/objetivos/README.md) — guía rápida de los archivos de muestra.
- [demo-samples/DOCUMENTACION-TECNICA.md](demo-samples/DOCUMENTACION-TECNICA.md) — lo mismo para la carga histórica de encuestas.

Para regenerar las muestras:

```bash
node scripts/generate-objetivos-samples.cjs
node scripts/generate-demo-samples.cjs
```

## Estructura

```
src/
├── components/
│   ├── objetivos/        Drawer de carga masiva, tabla de revisión, selectores
│   ├── upload/           Dropzone y validación de archivos
│   ├── overlays/         DrawerShell
│   └── ui/               Primitivas (shadcn/ui)
├── lib/objectivesImport/ El núcleo: parseo, alineación, reglas y cálculo
├── mocks/                Ciclos, usuarios y directorio de UBITS
└── screens/              Dashboards de ciclos, detalle de ciclo y encuestas

demo-samples/objetivos/   Los 15 archivos de prueba (sintéticos, generados)
scripts/                  Generadores de las muestras
```

El módulo `src/lib/objectivesImport/` es donde vive la lógica que importa:

| Archivo | Responsabilidad |
|---|---|
| `parseTemplate.ts` | Lee el Excel: ubica columnas por nombre, normaliza números y tipos |
| `matchUsers.ts` | Alinea cada identificador con un usuario de UBITS |
| `matchObjectives.ts` | Alinea cada fila con un objetivo existente (editar/actualizar) |
| `rules.ts` | Reglas R0–R6, límites de campo y la regla del 100% |
| `index.ts` | Orquesta el pipeline y define las tres operaciones |

## Stack

React 19 · TypeScript · Vite · Tailwind CSS · shadcn/ui (Radix) · ECharts · SheetJS (`xlsx`)

## Despliegue

Configurado para **Vercel** vía [`vercel.json`](vercel.json) — framework Vite, build `npm run build`, salida en `dist/`. No necesita variables de entorno: no hay backend ni servicios externos.
