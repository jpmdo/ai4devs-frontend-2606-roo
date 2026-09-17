## Why

El botón "Ver proceso" en `Positions.tsx` no hace nada hoy (sin `onClick` ni `Link`), y los
endpoints de backend para ver candidatos por posición y su flujo de entrevistas
(`GET /position/:id/candidates`, `GET /position/:id/interviewflow`) y para mover a un candidato
de etapa (`PUT /candidates/:id`) ya existen pero no los consume ningún componente. El reclutador
no tiene forma de ver ni gestionar el pipeline de candidatos de una posición desde la UI.

## What Changes

- Wirear el botón "Ver proceso" de `Positions.tsx` para navegar a `/positions/:id/process`
  (patrón `<Link>`, consistente con `RecruiterDashboard.js`).
- Alinear los `id` de los mocks de `Positions.tsx` con los `id` reales del seed (`1` = Senior
  Full-Stack Engineer, `2` = Data Scientist) para que la página de detalle pueda traer datos
  reales del backend sin necesidad de un endpoint de lista de posiciones (que no existe).
- Nueva página `/positions/:id/process`: kanban con el título de la posición y una flecha para
  volver al listado en la parte superior, y una columna por etapa del flujo de entrevistas de la
  posición (`GET /position/:id/interviewflow`, ordenadas por `orderIndex`) con una tarjeta por
  candidato (`GET /position/:id/candidates`, nombre completo + puntuación media) en la columna
  que corresponde a su `currentInterviewStep`.
- Layout responsive: en móvil las columnas se apilan verticalmente ocupando todo el ancho, en
  vez de mostrarse una al lado de la otra.
- La página es solo el contenido interno (se asume una estructura global de header/footer ya
  existente que la envuelve); no se añade ningún menú ni footer propio.
- Drag & drop de tarjetas entre columnas: al soltar una tarjeta en otra columna, se actualiza la
  etapa del candidato vía `PUT /candidates/:id` con el `id` (integer) del `InterviewStep`
  destino — no el nombre que devuelve el endpoint de lectura.
- Nueva dependencia de frontend: `@dnd-kit/core` + `@dnd-kit/sortable` (aprobado con el usuario)
  para la interacción de arrastre.

## Capabilities

### New Capabilities
- `position-process-view`: navegar desde la lista de posiciones al detalle de una posición y
  visualizar el pipeline de candidatos como kanban (título + flecha de volver, columnas por
  etapa de entrevista ordenadas, tarjetas con nombre y puntaje del candidato, layout responsive
  que apila las columnas en móvil).
- `candidate-stage-drag-drop`: dentro del kanban, arrastrar la tarjeta de un candidato a otra
  columna para actualizar su etapa de entrevista actual, persistiendo el cambio en el backend.

### Modified Capabilities
(ninguna — no hay specs existentes en `openspec/specs/`; este es el primer conjunto de
capabilities del proyecto)

## Impact

- **Frontend**:
  - `frontend/src/components/Positions.tsx`: mocks con `id` real + botón "Ver proceso" enlazado.
  - `frontend/src/App.js`: nueva ruta `/positions/:id/process`.
  - Nuevo componente de página (kanban) y, si aplica, un servicio en `frontend/src/services/`
    para las llamadas a `GET /position/:id/candidates` y `GET /position/:id/interviewflow`
    (siguiendo la convención de `AGENTS.md` de centralizar la URL base ahí).
  - `frontend/package.json`: se añaden `@dnd-kit/core` y `@dnd-kit/sortable`.
- **Backend**: sin cambios — los tres endpoints necesarios ya existen
  (`GET /position/:id/candidates`, `GET /position/:id/interviewflow`, `PUT /candidates/:id`).
- **Sin breaking changes**: no se modifica ningún endpoint ni contrato existente.
