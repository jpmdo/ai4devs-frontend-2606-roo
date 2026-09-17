## ADDED Requirements

### Requirement: Navigate from positions list to a position's process view
El sistema SHALL permitir navegar desde el listado de posiciones a la vista de proceso de una
posición específica al hacer click en su botón "Ver proceso".

#### Scenario: Click en "Ver proceso" navega a la vista de proceso
- **WHEN** el usuario está en `/positions` y hace click en el botón "Ver proceso" de una tarjeta
  de posición con `id` `X`
- **THEN** el sistema navega a `/positions/X/process`

### Requirement: Título de la posición y navegación de vuelta
La vista de proceso SHALL mostrar el título de la posición en la parte superior y SHALL ofrecer
una forma de volver al listado de posiciones mediante una flecha a la izquierda del título.

#### Scenario: Se muestra el título de la posición
- **WHEN** el usuario abre `/positions/X/process` para una posición existente
- **THEN** el sistema muestra el nombre de esa posición en la parte superior de la página

#### Scenario: La flecha de volver regresa al listado
- **WHEN** el usuario hace click en la flecha ubicada a la izquierda del título
- **THEN** el sistema navega de vuelta a `/positions`

### Requirement: Columnas dinámicas según las fases del proceso de contratación
La vista de proceso SHALL mostrar una columna por cada fase (`InterviewStep`) del flujo de
entrevistas configurado para esa posición, ordenadas por su orden de secuencia
(`orderIndex`), sin asumir un número fijo de columnas.

#### Scenario: Se muestra una columna por cada fase del flujo
- **WHEN** el flujo de entrevistas de la posición tiene N fases configuradas
- **THEN** el sistema muestra N columnas, en el mismo orden que el `orderIndex` de cada fase

### Requirement: Tarjetas de candidato en la columna de su fase actual
Cada candidato de la posición SHALL mostrarse como una tarjeta dentro de la columna que
corresponde a su fase actual del proceso, mostrando su nombre completo y su puntuación media.

#### Scenario: La tarjeta del candidato aparece en la columna correcta
- **WHEN** un candidato de la posición tiene como fase actual una de las fases del flujo de
  entrevistas
- **THEN** el sistema muestra una tarjeta con el nombre completo y la puntuación media del
  candidato dentro de la columna correspondiente a esa fase

#### Scenario: Candidato sin entrevistas puntuadas todavía
- **WHEN** un candidato no tiene ninguna entrevista con puntaje registrado
- **THEN** su tarjeta muestra una puntuación media de cero, sin ocultar la tarjeta ni mostrar un
  error

### Requirement: Layout responsive de las columnas
La vista de proceso SHALL adaptar la disposición de las columnas al ancho de la pantalla: en
viewports angostos (móvil) las columnas se apilan verticalmente ocupando todo el ancho
disponible; en viewports anchos se muestran una al lado de la otra.

#### Scenario: En móvil las columnas se apilan verticalmente
- **WHEN** el usuario abre la vista de proceso en un viewport de ancho móvil
- **THEN** las columnas se muestran apiladas verticalmente, cada una ocupando el ancho completo
  disponible

#### Scenario: En desktop las columnas se muestran en fila
- **WHEN** el usuario abre la vista de proceso en un viewport de escritorio
- **THEN** las columnas se muestran una al lado de la otra en una sola fila
