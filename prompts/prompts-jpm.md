# Prompts usados en el Ejercicio del Módulo 10 del curso AI4DEVS

Cohort: AI4DEVS 2026/06 Rookies
Alumno: Jaime Pinal Maldonado
Herramienta: Claude Code

---
## Prompt 1. Harness del proyecto
Eres un Ingeniero de Inteligencia Artificial e Ingeniero de Software Full-Stack Senior.

Explora el codebase de este proyecto y después crea el archivo AGENTS.md de menos de 200 líneas, que será el harness que usarás para ejecutar cambios y desarrollar nuevas funcionalidades. Sigue las pautas recomendadas en https://agents.md/


---
## Prompt 2. En conjunto con OpenSpec Explore
/opsx:explore

Explora la página positions (/frontend/src/components/Positions.tsx). Quiero reusar el estilo y lo necesario para implementar posteriormente una nueva página que va a mostrar el detalle de la vacante de trabajo cuando se haga click al botón “Ver Proceso”

### Prompt 2 - Complemento: Decisiones tomadas después de ejecutar el prompt
1. **Ruta**: `/positions/:id/process` (no `/positions/:id` a secas).
2. **IDs mock alineados al seed**: los mocks de `Positions.tsx` deben usar los `id` reales del
   seed (`1` = Senior Full-Stack Engineer, `2` = Data Scientist) en vez de datos inventados, para
   que el detalle sí traiga datos reales del backend sin necesidad de crear un endpoint de lista.
3. **Alcance**: el kanban incluye **drag & drop** (no solo lectura). Implica usar
   `PUT /candidates/:id` con el `currentInterviewStep` (id, integer) de la columna destino.
4. **Homologación de tipos confirmada**: `currentInterviewStep` es `Integer` (FK al `id` de
   `InterviewStep`) en escritura; en lectura llega como nombre (string) y hay que resolverlo
   contra `interviewflow` en el cliente.
5. Mockup de referencia visual: `/mockups/interfaz-kanban-ejemplo.png`

### Prompt 2 - Preguntas abiertas (sin resolver todavía)
- Conversión de `averageScore` (número) a dots — escala y regla de redondeo; caso `0`/sin
  entrevistas.
- Alineación del título (`text-center` como el resto de la app vs. alineado a la izquierda como
  el mockup).
- Comportamiento del kanban con muchas columnas (scroll horizontal vs. wrap responsivo).
- Librería/mecanismo de drag & drop a usar (no se ha decidido todavía; no hay ninguna ya instalada
  en `frontend/package.json`, así que cualquier elección de librería requiere confirmar con el
  usuario antes de añadir la dependencia, según `AGENTS.md`).
- Manejo de estado optimista vs. esperar confirmación del `PUT` antes de mover la tarjeta en UI.



---
## Prompt 3. En conjunto con OpenSpec Propose
/opsx:propose position-page

La interfaz "position" debe ser una página para visualizar y gestionar los diferentes candidatos de una posición específica.

Se ha decidido que la interfaz sea tipo kanban, mostrando los candidatos como tarjetas en diferentes columnas que representan las fases del proceso de contratación, y pudiendo actualizar la fase en la que se encuentra un candidato solo arrastrando su tarjeta. 

Algunos requerimientos de diseño:
- Mostrar el título de la posición en la parte superior, para dar contexto
- Añadir una flecha a la izquierda del título que permita volver al listado de posiciones
- Mostrar tantas columnas como fases haya en el proceso
- La tarjeta de cada candidato debe situarse en la fase correspondiente, y debe mostrar su nombre completo y su puntuación media
- Si es posible, debe mostrarse adecuadamente en móvil (las fases en vertical ocupando todo el ancho)

Considera las siguientes suposiciones:
- Asume que la página de posiciones la encuentras 
- Asume que existe la estructura global de la página, la cual incluye los elementos comunes como menú superior y footer. Lo que estás creando es el contenido interno de la página.

Interacciones mínimas necesarias:
- Si el usuario está en la página positions y da click en el botón "Ver Proceso" de cualquier de las posiciones, lo debe llevar a la interfaz de cada posición, denominada "position"
- En la interfaz "position", si el usuario hace drag-and-drop sobre una tarjeta y la mueve a otro columna, se debe actualizar el step en donde el candidato se encuentra.


### Prompt 3 - Complemento 1: Preguntas abiertas antes de pasar a implementación
1. Ruta: ¿/positions/:id (consistente con el resto) o algo como /positions/:id/process?
2. Ids mock vs reales: ¿alineo los mocks de Positions.tsx con los ids reales del seed (1 y 2) para poder probar el detalle con datos reales del backend, sin tocar el endpoint de lista?
3. Alcance del kanban: ¿solo lectura (mostrar candidatos por etapa) o también drag-and-drop que dispare el PUT /candidates/:id? Eso cambia bastante la complejidad.
4. El mockup Lista-detalle.avif no lo pude visualizar (el formato AVIF no lo renderiza mi herramienta de lectura) — si tienes el PNG/JPG equivalente o puedes describírmelo, ayuda a afinar el layout del kanban antes de proponer el cambio.

**Mi Respuesta**: usa ruta tipo /positions/:id/process, alinea los mocks con los ids reales del seed, el alcance del kanban incluye drag-and-drop

### Prompt 3 - Obvervación sobre Discrepancia en tipo de dato currentInterviewStep
Nota importante para cuando implementemos el drag & drop: hay una asimetría de tipos entre lectura y escritura que conviene tener presente desde ya —

- GET /position/:id/candidates devuelve currentInterviewStep como string (el name del step).
- PUT /candidates/:id espera currentInterviewStep como integer (según api-spec.yaml) — casi seguro es el orderIndex o el id del InterviewStep, no el nombre.

Así que al soltar una tarjeta en una columna, el payload debe mapear la columna (que internamente tendrás como {id, name, orderIndex} desde interviewflow) a ese entero — no se puede reenviar el currentInterviewStep string que trae la tarjeta. Vale la pena confirmar contra ModeloDatos.md o el propio modelo Prisma qué campo exacto espera antes de dar por buena la implementación, porque si asumimos mal el service fallará en silencio o guardará un valor incorrecto.

**Mi Respuesta**: se debe homologar currentInterviewStep, es de tipo Integer.

---
## Prompt 4. OpenSpec Apply para implementar la interfaz con base en el explore y el propose
/opsx:apply 

### Prompt 4 - Notas
Claude me pidió aprobación para instalar (@dnd-kit/core@^6.3.1) para el drag-and-drop

---
## Promopt 5. ESLint + Prettier
npx eslint src --ext .js,.jsx,.ts,.tsx

### Prompt 5 - Results
Solo el warning preexistente de AddCandidateForm.js (unrelacionado a este cambio). Los archivos nuevos del proposal (PositionProcess.tsx, positionService.ts, y los edits en Positions.tsx/App.js) pasan limpio: 0 errores, 1 warning.