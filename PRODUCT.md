# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Fijado por el usuario: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, React Router v6, TanStack Query, react-hook-form + zod, date-fns (locale es), lucide-react. Repositorio separado que consume una API REST existente (Spring Boot 3.5 + PostgreSQL). Modo mock opcional con MSW.

## Users

- **Visitante:** persona que busca eventos, se inscribe y cancela su asistencia.
- **Administrador:** gestiona eventos, ubicaciones y asistentes.
- **Evaluador del curso:** recorre los casos de uso CU01 a CU07 para calificar la entrega.

## Product Purpose

Sistema web de gestión de eventos, desarrollado como tarea académica. Permite consultar eventos, inscribirse y administrar eventos, ubicaciones y asistentes. El éxito es que cada caso de uso funcione completo contra la API y se pueda demostrar con claridad, incluidos los errores y las reglas de negocio.

## Positioning

El cupo es el centro del sistema: cada acción respeta la capacidad de la ubicación, el límite del evento y el horario del usuario, y la interfaz explica por qué algo no se puede hacer.

## Operating Context

Se usa en navegador, en móvil y escritorio, con sesión por cookie y dos roles (ADMIN y VISITANTE). La demostración de la entrega puede hacerse con el backend real o en modo mock. Toda la interfaz está en español.

## Capabilities and Constraints

- Casos de uso: iniciar sesión, consultar eventos, inscribirse, cancelar asistencia, CRUD de eventos, gestionar asistentes y CRUD de ubicaciones.
- El backend es la fuente de verdad; el frontend anticipa las reglas y muestra sus mensajes.
- Un evento dura un solo día. Eliminar un evento lo cancela y eliminar una ubicación la desactiva.
- Las imágenes son URLs externas; no hay subida de archivos.
- Tipos de evento: mezcla general, sin una categoría dominante.

## Brand Commitments

- Nombre propuesto: **Aforo** (asignado por el usuario al diseñador; pendiente de su aprobación en el documento de diseño). Sin logo existente: logotipo tipográfico sencillo.

## Evidence on Hand

No hay marca, fotografías ni datos reales. Los datos de ejemplo del modo mock son sintéticos y deben identificarse como tales. No inventar clientes, cifras ni testimonios.

## Product Principles

1. Cada regla se explica: un botón deshabilitado siempre dice por qué.
2. El backend decide; la interfaz anticipa y nunca contradice su respuesta.
3. Cada caso de uso se puede demostrar de principio a fin.
4. Los estados de carga, vacío y error son parte de la función, no un añadido.
