# AGENTS.md — LTI Talent Tracking System

Guía operativa para agentes de IA que trabajan en este repo. Complementa (no sustituye) al
`README.md`, `backend/ManifestoBuenasPracticas.md`, `backend/api-spec.yaml` y `backend/ModeloDatos.md`.

## Visión general

ATS (Applicant Tracking System) full-stack. Monorepo sin workspaces: dos paquetes npm independientes.

| Paquete     | Stack                                                          | Puerto |
|-------------|----------------------------------------------------------------|--------|
| `backend/`  | Node 20 · Express 4 · TypeScript 4.9 · Prisma 5 · PostgreSQL   | 3010   |
| `frontend/` | Create React App 5 · React 18 · react-bootstrap 5 · react-router 6 | 3000 |

Idioma: código e identificadores en inglés; comentarios, UI y documentación en español. Mantén esa mezcla.

## Setup y comandos

```bash
# 1. Base de datos (desde la raíz; usa las variables de ./.env)
docker-compose up -d

# 2. Backend
cd backend && npm install
npx prisma generate && npx prisma migrate dev   # crea/actualiza esquema
npx ts-node prisma/seed.ts                       # datos de ejemplo (posiciones, flujos, candidatos)
npm run dev                                      # ts-node-dev con hot reload
npm run build && npm start                       # producción: compila a dist/ y arranca

# 3. Frontend (otra terminal)
cd frontend && npm install
npm start
```

Verificación antes de dar por terminado un cambio de backend:

```bash
cd backend
npx tsc --noEmit        # type-check estricto, debe salir limpio
npx jest src            # NO uses `npm test` a secas (ver "Trampas conocidas")
```

Frontend: no hay suite de tests operativa (ver "Trampas conocidas"). Verifica con `npm start`
y comprobando la vista en el navegador; `npm run build` debe compilar sin errores.

## Arquitectura backend (respétala al añadir funcionalidad)

Flujo de una petición: `src/index.ts` → `routes/` → `presentation/controllers/` → `application/services/` → `domain/models/` → Prisma.

- `routes/<recurso>Routes.ts`: solo declara rutas y delega en controladores. Se montan en `index.ts`
  (`/candidates`, `/position`, `/upload`).
- `presentation/controllers/`: parsea `req`, valida IDs (`parseInt` + `isNaN` → 400), llama al servicio y
  mapea errores a códigos HTTP (`400` validación, `404` no encontrado, `500` resto). Sin lógica de negocio.
- `application/services/`: lógica de aplicación. Validación de entrada en `application/validator.ts`.
- `domain/models/`: clases con `constructor(data)`, `save()` y `static findOne()`; cada modelo
  instancia su propio `PrismaClient`. Es el patrón vigente — sigue el mismo aunque no sea ideal.
- Respuestas de error en JSON: `{ message, error }` o `{ error }`. Éxito en creación: `201`.

Para un endpoint nuevo: ruta + controlador + servicio + (si aplica) modelo + test unitario del servicio y
del controlador + entrada en `backend/api-spec.yaml`. Si tocas `prisma/schema.prisma`, genera migración con
`npx prisma migrate dev --name <descripcion>` y actualiza `ModeloDatos.md`.

## Arquitectura frontend

- Entrypoint real: `src/App.js` (webpack resuelve `.js` antes que `.tsx`). `src/App.tsx` es residuo de CRA:
  ignóralo y no lo edites.
- Rutas en `App.js`: `/` (`RecruiterDashboard`), `/add-candidate` (`AddCandidateForm`), `/positions` (`Positions`).
- Componentes en `src/components/`, uno por archivo, export default. Los nuevos van en **`.tsx`**
  (como `Positions.tsx`); los `.js` existentes se dejan como están salvo que se pida migrarlos.
- UI con `react-bootstrap` (+ `react-bootstrap-icons`, `react-datepicker`). No introduzcas otra librería de UI.
- Llamadas a la API con `fetch` nativo contra `http://localhost:3010` (hardcodeado hoy). Si creas un
  servicio de API, ponlo en `src/services/` y centraliza ahí la URL base.
- `Positions.tsx` usa datos mock. Los mockups de destino están en `backend/src/prompts/mockups/`
  (`Posiciones.avif`: lista con filtros; `Lista-detalle.avif`: kanban de candidatos por etapa de entrevista).
  Los endpoints que los alimentan ya existen: `GET /position/:id/candidates`,
  `GET /position/:id/interviewflow`, `PUT /candidates/:id` (body `{ applicationId, currentInterviewStep }`).

## Estilo de código

- Backend: Prettier (`singleQuote: true`, `trailingComma: 'all'`) + ESLint `plugin:prettier/recommended`.
  El código existente mezcla 2 y 4 espacios; en archivos nuevos usa 4 en backend y 4 en frontend
  (coincide con la mayoría del código). No reformatees archivos que no estés cambiando.
- TypeScript `strict: true` en ambos paquetes. Evita `any` en código nuevo aunque los modelos actuales lo usen.
- Módulos ES (`import`/`export`). Excepción heredada: `positionRoutes.ts` usa `require`; no lo repliques.
- Nombres: `camelCase` para funciones/variables, `PascalCase` para clases, componentes y modelos Prisma.
  Servicios exportan funciones sueltas (`getCandidatesByPositionService`), no clases.
- Sin `console.log` de depuración en código entregado; `console.error` en catch está aceptado.

## Tests

- Backend: Jest + ts-jest, tests junto al código (`*.test.ts`). Los servicios mockean `@prisma/client`
  con `jest.mock`; los controladores mockean el módulo del servicio y `res` con `jest.fn().mockReturnThis()`.
  Copia ese patrón (ver `positionController.test.ts`).
- Baseline actual con `npx jest src`: 3 suites pasan, `positionService.test.ts` falla por una expectativa
  desactualizada (`id`/`applicationId`). No lo "arregles" de pasada; solo si la tarea lo pide.
- Todo endpoint o servicio nuevo lleva su test. No bajes la cobertura existente.

## Trampas conocidas (no las descubras de nuevo)

1. **`npm test` en backend ejecuta también `dist/**/*.test.js`** (tsc compila los tests) y esos fallan.
   Usa `npx jest src`, o borra `dist/` antes. No cambies `jest.config.js` sin avisar.
2. **`schema.prisma` tiene la URL de BD hardcodeada** e ignora `DATABASE_URL` del `.env`. Si la conexión
   falla, revisa esa línea. Nunca subas credenciales nuevas al esquema.
3. **`frontend/src/services/candidateService.js` importa `axios`, que NO está instalado.** No lo importes
   desde ningún componente ni añadas `axios` sin preguntar; usa `fetch` como el resto.
4. **`frontend` `npm test` apunta a un `jest.config.js` inexistente.** Si necesitas tests de frontend,
   usa `npx react-scripts test` y avisa antes de añadir configuración.
5. `fileUploadService.ts` guarda en `../uploads/` (relativo al cwd). El directorio no existe en el repo;
   créalo si vas a probar subida de CV. Solo PDF/DOCX, máx. 10 MB.
6. CORS solo permite `http://localhost:3000`. Si el frontend corre en otro puerto, fallará silenciosamente.
7. El `.env` de la raíz y el de `backend/` están commiteados con credenciales de desarrollo local.
   No añadas secretos reales ahí.

## Dependencias y cambios significativos

- **Pregunta antes de añadir cualquier dependencia** (backend o frontend), de cambiar `tsconfig`,
  `jest.config.js`, `.eslintrc.js`, `docker-compose.yml` o de tocar el esquema Prisma.
- Explica el enfoque y los tradeoffs antes de refactors que afecten a más de un archivo o a la API pública.
- Mantén las soluciones simples: no añadas capas, abstracciones ni features que no se hayan pedido.
  Las "mejoras propuestas" del Manifesto (repositorios, factories, eventos de dominio) se aplican
  solo cuando la tarea lo justifique, no de forma oportunista.

## Git y entregas

- Nunca hagas `commit`, `push` ni operaciones destructivas sin pedir confirmación explícita.
- Commits en inglés, imperativo, breves: `Add position kanban view`, `Fix stage update validation`.
- Antes de proponer un commit: `npx tsc --noEmit` y `npx jest src` en backend deben tener el mismo
  resultado o mejor que el baseline; el frontend debe compilar con `npm run build`.
- Al terminar una tarea, resume: qué archivos cambiaron, cómo verificarlo y qué quedó fuera.

## Referencias rápidas

- Endpoints documentados: `backend/api-spec.yaml` (OpenAPI). Mantenlo sincronizado.
- Modelo de datos y diagrama: `backend/ModeloDatos.md`; esquema fuente: `backend/prisma/schema.prisma`.
- Buenas prácticas del proyecto (DDD, SOLID, DRY): `backend/ManifestoBuenasPracticas.md`.
- Prompts y mockups de trabajo: `backend/src/prompts/`.
- Datos de ejemplo del seed: empresa `LTI`, 2 flujos de entrevista, 2 posiciones, 3 candidatos con 4
  aplicaciones y 1 entrevista puntuada. Útil para probar el kanban sin crear datos a mano.
