## Context

`Positions.tsx` es 100% mock (sin `id` en el tipo `Position`) y su botón "Ver proceso" no navega
a ningún sitio. El backend ya expone lo necesario para una vista de detalle por posición:

- `GET /position/:id/candidates` → `{ fullName, currentInterviewStep, averageScore, id, applicationId }[]`,
  donde `currentInterviewStep` es el **nombre** del step (string).
- `GET /position/:id/interviewflow` → `{ interviewFlow: { positionName, interviewFlow: { interviewSteps: [{ id, name, orderIndex }] } } }`
  (doblemente anidado bajo `interviewFlow`, tal cual lo arma `positionController.ts`).
- `PUT /candidates/:id` con body `{ applicationId, currentInterviewStep }`, donde
  `currentInterviewStep` es el **`id`** (integer) del `InterviewStep` destino (FK confirmada en
  `schema.prisma`: `Application.currentInterviewStep → InterviewStep.id`).

No existe `GET /position` (lista) ni `GET /position/:id` (detalle simple); la posición y su
nombre se obtienen a través de `interviewflow`.

El proyecto no tiene gestor de estado global (Redux, Zustand, etc.) ni ninguna librería de
drag & drop instalada. El único patrón de navegación existente es `<Link>` de `react-router-dom`
envolviendo un `<Button>`.

## Goals / Non-Goals

**Goals:**
- Navegar de `Positions.tsx` a `/positions/:id/process` con datos reales del backend.
- Renderizar un kanban con una columna por `InterviewStep` (ordenadas por `orderIndex`) y una
  tarjeta por candidato con nombre completo y puntuación media.
- Permitir mover una tarjeta a otra columna por drag & drop, persistiendo el cambio vía
  `PUT /candidates/:id`.
- Layout responsive: columnas en fila en desktop, apiladas a ancho completo en móvil.
- Botón/flecha de volver a `/positions`.

**Non-Goals:**
- Crear un endpoint `GET /position` (lista) o `GET /position/:id` (detalle) — se resuelve
  alineando los mocks de `Positions.tsx` con los `id` del seed.
- Reordenar candidatos dentro de una misma columna (el requerimiento es solo cambiar de columna).
- Edición de datos del candidato más allá de su etapa.
- Sincronización en tiempo real entre varios reclutadores viendo el mismo kanban a la vez.
- Cualquier gestor de estado global nuevo — basta con estado local de React para esta página.

## Decisions

### 1. Ruta y navegación: `<Link>`, no `useNavigate`
`/positions/:id/process` se añade en `App.js`. Tanto el botón "Ver proceso" (Positions → Process)
como la flecha de volver (Process → Positions) usan `<Link>`, siguiendo el único patrón de
navegación que ya existe en el repo (`RecruiterDashboard.js`). La flecha usa el icono
`ArrowLeft` de `react-bootstrap-icons` (ya es dependencia) envuelto en `<Link to="/positions">`,
en vez de `navigate(-1)`, para que el destino sea siempre predecible.

### 2. IDs mock alineados al seed, sin endpoint de lista nuevo
`Positions.tsx` pasa a tener `{ id: 1, title: 'Senior Full-Stack Engineer', ... }` y
`{ id: 2, title: 'Data Scientist', ... }`, calcados del `seed.ts`. Evita crear un endpoint de
lista solo para esta feature (fuera del alcance que pidió el usuario) y permite que el detalle
funcione contra datos reales desde el día uno.

### 3. Nuevo servicio `frontend/src/services/positionService.ts`
Centraliza `fetch` contra `http://localhost:3010` (mismo host hardcodeado que ya usa
`candidateService.js`) con tres funciones: `getCandidatesByPosition(id)`,
`getInterviewFlowByPosition(id)`, `updateCandidateStage(candidateId, applicationId, currentInterviewStep)`.
Se usa `fetch` nativo, no `axios` (no está instalado; ver gotcha #3 de `AGENTS.md`). Archivo en
TypeScript (`.ts`), consistente con que los componentes nuevos van en `.tsx`.

### 4. Resolución de `currentInterviewStep`: string (lectura) → id (escritura), en el cliente
El backend no resuelve esto por nosotros. Al cargar la página:
1. Se pide `interviewflow` → se obtiene `interviewSteps: [{ id, name, orderIndex }]`, ordenado
   por `orderIndex`, que define las columnas.
2. Se pide `candidates` → cada candidato trae `currentInterviewStep` como nombre (string).
3. Se construye un mapa `name → id` a partir de los steps, y se usa para ubicar cada tarjeta en
   su columna y para saber qué `id` mandar al backend cuando se suelta en otra columna.

Si un candidato trae un `currentInterviewStep` que no matchea ningún `name` de `interviewSteps`
(dato inconsistente), la tarjeta no se descarta silenciosamente: se loguea con `console.error` y
se muestra en la primera columna como fallback, para que el problema sea visible en vez de que el
candidato desaparezca de la vista.

### 5. Drag & drop: `@dnd-kit/core` únicamente (sin `@dnd-kit/sortable`)
Se aprobó `@dnd-kit/core` con el usuario por ser mantenido activamente y accesible (soporta
teclado), frente a la alternativa sin dependencias (HTML5 Drag and Drop API nativo, descartada
por peor accesibilidad y comportamiento inconsistente entre navegadores) y frente a
`@hello-pangea/dnd` (fork más chico, API pensada para listas ordenables).

Al escribir el diseño técnico se afina el alcance: el requerimiento es solo mover una tarjeta
*entre columnas*, no reordenar tarjetas *dentro* de una columna — por lo tanto no hace falta
`@dnd-kit/sortable` (que existe para listas ordenables). Con `DndContext` +
`useDraggable`/`useDroppable` de `@dnd-kit/core` alcanza. Evita instalar una dependencia que no
se va a usar (regla del proyecto: no añadir lo que no se necesita).

### 6. Puntuación como "dots", no como número crudo
Siguiendo el mockup de referencia (`interfaz-kanban-ejemplo.png`), la tarjeta muestra la
puntuación media como puntos llenos/vacíos sobre una escala de 5
(`Math.round(averageScore)`, acotado a `[0, 5]`), usando los iconos `CircleFill`/`Circle` de
`react-bootstrap-icons` (ya instalada — no se añade ninguna librería de rating nueva). Un
candidato con `averageScore === 0` (sin entrevistas puntuadas todavía, típico en la primera
columna) se muestra con los 5 puntos vacíos. Es una decisión de UI, fácil de cambiar por un
número si en el futuro se prefiere.

### 7. Layout responsive sin grid de 12 columnas
El grid `Row`/`Col` de Bootstrap (12 columnas) no encaja bien con "N columnas iguales que se
apilan en móvil" cuando N es dinámico (2, 4, 6 steps según el flujo). Se usa un contenedor flex
propio: `d-flex flex-column flex-md-row` — en móvil (`<md`) cada columna es `w-100` y se apilan;
en desktop (`≥md`) quedan en fila, con `overflow-x-auto` en el contenedor para el caso de muchas
columnas que no quepan en pantalla (scroll horizontal en vez de comprimir columnas
ilegiblemente).

### 8. Actualización optimista con rollback
Al soltar una tarjeta en otra columna, se mueve inmediatamente en el estado local (UI optimista)
y se dispara el `PUT /candidates/:id` en paralelo. Si falla, la tarjeta vuelve a su columna
original y se muestra un `Alert` (react-bootstrap, ya disponible) con el error. No se bloquea la
interacción esperando la respuesta del servidor — el flujo de arrastre debe sentirse inmediato.

## Risks / Trade-offs

- [Riesgo] Desajuste entre el `name` de un step en `candidates` y en `interviewflow` (typo, caso,
  espacios) deja una tarjeta sin columna clara → Mitigación: comparación case-sensitive exacta
  (misma fuente de datos — `InterviewStep.name` — así que en teoría siempre matchea) + fallback
  visible con log en vez de ocultar el dato silenciosamente (decisión 4).
- [Riesgo] `@dnd-kit/core` es una dependencia nueva, con su propio bundle size y curva de
  aprendizaje → Mitigación: ya evaluado y aprobado explícitamente con el usuario; se limita el
  alcance a los paquetes estrictamente necesarios (decisión 5).
- [Riesgo] Actualización optimista puede mostrar momentáneamente un estado que luego se revierte
  si el `PUT` falla, lo cual puede confundir al usuario → Mitigación: rollback inmediato + alerta
  visible explicando el error, en vez de fallar en silencio.
- [Riesgo] Muchas columnas (flujos de entrevista largos) en pantallas medianas quedan apretadas
  → Mitigación: scroll horizontal en vez de forzar que quepan (decisión 7).

## Migration Plan

Cambio puramente aditivo en el frontend: nueva ruta, nuevo componente, nuevo servicio, una
dependencia nueva. No hay cambios de backend, de esquema, ni de datos existentes. Se despliega
como cualquier cambio de frontend (merge → build); revertir es simplemente revertir el PR, sin
pasos de rollback adicionales.

## Open Questions

Ninguna bloqueante. Quedan como decisiones de implementación con criterio ya fijado arriba
(puntuación como dots, columnas con scroll horizontal, fallback visible ante datos
inconsistentes) que se pueden ajustar si al implementar surge algo que las contradiga.
