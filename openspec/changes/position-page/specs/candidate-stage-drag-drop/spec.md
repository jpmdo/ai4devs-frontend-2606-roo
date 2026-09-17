## ADDED Requirements

### Requirement: Arrastrar una tarjeta a otra columna actualiza la fase del candidato
El sistema SHALL permitir mover a un candidato a otra fase del proceso de contratación
arrastrando su tarjeta desde su columna actual y soltándola sobre otra columna, persistiendo el
cambio en el backend.

#### Scenario: Drag & drop exitoso actualiza la fase del candidato
- **WHEN** el usuario arrastra la tarjeta de un candidato desde la columna de su fase actual y
  la suelta sobre una columna de otra fase
- **THEN** la tarjeta se muestra en la nueva columna y el sistema persiste el cambio de fase del
  candidato en el backend

#### Scenario: Falla la actualización en el backend
- **WHEN** el usuario suelta la tarjeta de un candidato sobre otra columna y la actualización en
  el backend falla
- **THEN** la tarjeta vuelve a mostrarse en su columna original y el sistema muestra un mensaje
  de error al usuario

### Requirement: Soltar una tarjeta en su misma columna no genera cambios
Soltar la tarjeta de un candidato dentro de la misma columna en la que ya se encontraba SHALL
dejar su fase sin cambios y SHALL NOT disparar una actualización al backend.

#### Scenario: Soltar en la misma columna no actualiza nada
- **WHEN** el usuario arrastra la tarjeta de un candidato y la suelta dentro de la misma columna
  en la que ya estaba
- **THEN** la fase del candidato no cambia y el sistema no realiza ninguna llamada de
  actualización al backend
