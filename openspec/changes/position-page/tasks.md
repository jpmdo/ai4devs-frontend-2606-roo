## 1. Dependencias

- [x] 1.1 Añadir `@dnd-kit/core` a `frontend/package.json` (aprobado con el usuario; no añadir
      `@dnd-kit/sortable`, no hace falta — ver design.md decisión 5)

## 2. Positions.tsx: ids reales y navegación

- [x] 2.1 Añadir `id: number` al tipo `Position` y a los mocks de `Positions.tsx`, alineado con
      el seed (`1` = Senior Full-Stack Engineer, `2` = Data Scientist)
- [x] 2.2 Envolver el botón "Ver proceso" en `<Link to={`/positions/${position.id}/process`}>`

## 3. Ruta

- [x] 3.1 Registrar `<Route path="/positions/:id/process" element={<PositionProcess />} />` en
      `frontend/src/App.js`

## 4. Servicio de datos

- [x] 4.1 Crear `frontend/src/services/positionService.ts` con `getCandidatesByPosition(id)`,
      `getInterviewFlowByPosition(id)` y `updateCandidateStage(candidateId, applicationId, currentInterviewStep)`,
      usando `fetch` nativo contra `http://localhost:3010` (no `axios`)
- [x] 4.2 Tipar en TS las respuestas de ambos GET y el body del PUT, evitando `any`

## 5. Componente de página `PositionProcess`

- [x] 5.1 Crear `frontend/src/components/PositionProcess.tsx`: leer `id` con `useParams`, y
      disparar `getInterviewFlowByPosition` + `getCandidatesByPosition` al montar
- [x] 5.2 Título de la posición (`positionName` de `interviewflow`) + flecha `ArrowLeft`
      (`react-bootstrap-icons`) a la izquierda, envuelta en `<Link to="/positions">`
- [x] 5.3 Estado de carga (`Spinner`) mientras resuelven ambos fetch; estado de error si la
      posición no existe (404 de `interviewflow`)
- [x] 5.4 Construir el mapa `name → id` a partir de `interviewSteps` y agrupar los candidatos por
      columna; si un candidato no matchea ningún step, loguear con `console.error` y mostrarlo en
      la primera columna como fallback (no ocultarlo)

## 6. Kanban — render

- [x] 6.1 Layout flex responsive: `flex-column flex-md-row`, columnas `flex-fill` (equivale a
      ancho completo en móvil por el `align-items: stretch` por defecto de flexbox), contenedor
      con `overflow-x-auto` en desktop; una columna por `interviewStep`, ordenadas por
      `orderIndex`
- [x] 6.2 Tarjeta de candidato: nombre completo + puntuación como dots
      (`CircleFill`/`Circle` de `react-bootstrap-icons`, escala 0–5,
      `Math.round(averageScore)` acotado a `[0, 5]`)

## 7. Drag & drop

- [x] 7.1 Envolver el kanban en `DndContext` (`@dnd-kit/core`); cada columna como
      `useDroppable`, cada tarjeta como `useDraggable`
- [x] 7.2 En `onDragEnd`: si la columna destino es distinta a la actual, mover la tarjeta en el
      estado local (optimista) y llamar a `updateCandidateStage` con el `id` del step destino
- [x] 7.3 Si `updateCandidateStage` falla, revertir la tarjeta a su columna original y mostrar un
      `Alert` (react-bootstrap) con el error
- [x] 7.4 Soltar la tarjeta dentro de la misma columna no dispara ninguna llamada al backend

## 8. Verificación

- [x] 8.1 `cd frontend && npm run build` compila sin errores
- [ ] 8.2 Prueba manual en navegador (`npm start` en frontend + backend levantado con
      `npm run dev` y datos del seed): navegar desde `/positions`, confirmar columnas y tarjetas
      reales, arrastrar una tarjeta y verificar que persiste tras recargar, y comprobar en un
      viewport móvil (DevTools) que las columnas se apilan a ancho completo
      — PENDIENTE: no hay herramienta de automatización de navegador disponible en esta sesión;
      requiere verificación manual del usuario (ver nota de cierre)
- [x] 8.3 Confirmar que en `backend` `npx tsc --noEmit` y `npx jest src` siguen en el mismo
      baseline que antes del cambio (no se tocó código de backend): `tsc` limpio, `jest src` →
      3 pasan / 1 falla (la misma falla preexistente documentada en `AGENTS.md`)
