# Publicar en GitHub y Vercel

Todo está preparado. Faltan solo estos pasos, que requieren tus credenciales.

## 1. Crear el repositorio en GitHub

Con la CLI de GitHub (te pedirá login la primera vez):

```bash
gh repo create carga-masiva-objetivos --public --source=. --remote=origin
```

O a mano: crea el repo vacío en github.com (**sin** README ni .gitignore, ya los hay) y conéctalo:

```bash
git remote add origin https://github.com/TU-USUARIO/carga-masiva-objetivos.git
```

## 2. Subir

```bash
git push -u origin main
```

## 3. Desplegar en Vercel

Lo más simple es desde la web: entra a [vercel.com/new](https://vercel.com/new), importa el repo y pulsa **Deploy**. Vercel lee [`vercel.json`](vercel.json) y no hay nada que configurar — **no se necesitan variables de entorno**.

Con la CLI, si la prefieres:

```bash
npx vercel --prod
```

---

## Qué se dejó listo

| Archivo | Para qué |
|---|---|
| `README.md` | Portada del repo: cómo correrlo, estructura y por dónde probar |
| `vercel.json` | Framework Vite, build a `dist/`, y el rewrite a `index.html` |
| `.gitignore` | Excluye `node_modules`, `dist`, `.vercel`, ajustes locales y los datos reales |
| `DEPLOY.md` | Este archivo |

**Verificado antes de dejarlo listo:**

- `npm run build` compila limpio (903 kB JS, 280 kB gzip).
- No hay secretos, claves ni `.env` en el repo.
- El árbol de git está limpio y son 255 archivos versionados (752 KB).

## Lo que se sacó del repositorio

**`demo-samples/encuesta-real/`** — 11 archivos con datos reales de una encuesta de clima: 613 colaboradores con área, género, rango de edad, antigüedad y sede.

Estaban en el primer commit. Como el repo va a ser **público**, se reescribió el historial para que no existan en **ningún** commit, y se añadieron a `.gitignore` para que no vuelvan a entrar.

**Siguen en tu disco** en `demo-samples/encuesta-real/`, así que la demo de encuestas funciona igual: esos archivos se arrastran a mano y ningún código los referencia.

> Si algún día necesitas compartirlos con el equipo, hazlo por un canal privado —
> no por este repositorio.

## Nota sobre el historial

Los 11 commits se conservan, pero **cambiaron de hash** al reescribirse. Como el repo nunca se ha subido, no afecta a nadie. Si alguien ya tuviera una copia local, tendría que volver a clonarla.
