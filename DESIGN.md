---
name: Aforo
description: Cartelera e inscripción a eventos, con cada estado estampado como en una mesa de registro.
colors:
  barra-indigo: "#27348B"
  papel-azulado: "#EEF1FA"
  tinta: "#171C33"
  tinta-suave: "#43485F"
  superficie: "#FFFFFF"
  bruma: "#DFE4F3"
  borde: "#C4CBE1"
  rojo-sello: "#C60D30"
  verde-propio: "#0B7A53"
typography:
  headline:
    fontFamily: "Figtree, system-ui, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Figtree, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 800
    lineHeight: 1.25
  body:
    fontFamily: "Figtree, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Figtree, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.25
  sello:
    fontFamily: "Barlow Condensed, Figtree, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.06em"
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
  xl: "12px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.barra-indigo}"
    textColor: "{colors.superficie}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: "40px"
  button-outline:
    backgroundColor: "{colors.superficie}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: "40px"
  input:
    backgroundColor: "{colors.superficie}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.md}"
    height: "40px"
  event-card:
    backgroundColor: "{colors.superficie}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.xl}"
    padding: "16px"
  sello-inscrito:
    backgroundColor: "{colors.superficie}"
    textColor: "{colors.verde-propio}"
    typography: "{typography.sello}"
    rounded: "{rounded.md}"
    padding: "6px 12px"
  sello-lleno:
    backgroundColor: "{colors.superficie}"
    textColor: "{colors.rojo-sello}"
    typography: "{typography.sello}"
    rounded: "{rounded.md}"
    padding: "6px 12px"
---

# Design System: Aforo

## Overview

**Creative North Star: "La mesa de registro"**

Aforo se comporta como la mesa donde alguien revisa una lista y estampa cada entrada. La interfaz es plana, ordenada y discreta, y el único elemento ruidoso es el sello: una etiqueta girada, condensada y en mayúsculas que dice de un vistazo en qué estado está un evento. Todo lo demás existe para que ese sello se lea.

La pantalla responde tres preguntas: qué hay, qué queda y qué ya es tuyo. Cuando algo no se puede hacer, se dice por qué, en texto visible junto al control. El administrador trabaja en tablas densas con las mismas señales que ve el visitante.

**Características clave:**
- Papel azulado y tinta, sin sombras decorativas ni degradados.
- Una sola familia en toda la interfaz. La segunda solo aparece dentro de un sello.
- Los datos cambian en su sitio, y los números usan cifras tabulares.

## Colors

Índigo plano para la estructura, papel para el fondo, y dos colores de estado con función fija.

### Primary
- **Barra índigo** (#27348B, `--primary`, `--shell`): barra superior, acción principal y foco. En modo oscuro la barra baja a `232 56% 24%` y `--primary` sube a un índigo claro `230 80% 80%`.

### Neutral
- **Papel azulado** (#EEF1FA): fondo de página.
- **Superficie** (#FFFFFF): tarjetas, tablas, diálogos y el fondo de los sellos.
- **Tinta** (#171C33) y **tinta suave** (#43485F): texto principal y secundario.
- **Bruma** (#DFE4F3) y **borde** (#C4CBE1): relleno neutro y líneas.

### Estado
- **Rojo sello** (#C60D30): Lleno, Cancelado, Cancelada, errores y acciones destructivas.
- **Verde propio** (#0B7A53): lo que es del usuario, sobre todo el sello Inscrito.

**La regla del verde reservado.** El verde significa "esto es tuyo". La única excepción es el Badge de cupos disponibles de la cartelera, que pide CU02, y solo aparece mientras el evento admite inscripción.

## Typography

**Interfaz:** Figtree, con system-ui de respaldo.
**Sellos:** Barlow Condensed 700, con Figtree de respaldo.

**Carácter:** Figtree es amable y legible en tablas densas. Barlow Condensed aporta la voz de tampón, y aparece tan poco que nunca se gasta.

### Hierarchy
- **Headline** (800, 2.25rem, 1.1): título de cada página.
- **Title** (800, 1.25rem): nombre de evento en la tarjeta.
- **Body** (400, 1rem, 1.5): descripciones, con un ancho máximo de `max-w-prose`.
- **Label** (600, 0.875rem): etiquetas de formulario y metadatos.
- **Sello** (Barlow Condensed 700, 1.5rem, mayúsculas, tracking .06em): solo dentro de `Sello`. La variante plana de tablas usa 0.875rem.

**La regla de las cifras tabulares.** Horas, cupos y conteos usan `.tabular`, para que un dato no salte de ancho al cambiar.

## Layout

La cartelera es una rejilla de columnas enteras: 1 en móvil, 2 desde 640 px, 3 desde 1024 px y 4 desde 1280 px, con 24 px de separación. La barra superior mide 72 px.

Administración usa una barra lateral de 208 px desde 1024 px, que en móvil se vuelve un Sheet. Las tablas se apilan como fichas por debajo de 768 px usando las clases de `src/components/tablaApilada.ts`, y las celdas numéricas llevan su etiqueta visible porque la cabecera desaparece.

## Elevation & Depth

Sistema plano. La jerarquía viene del borde y del contraste entre papel y superficie. El hover de una tarjeta cambia el color del borde a índigo y no la levanta. Las únicas sombras son las de capas flotantes de shadcn: menús, popovers, diálogos y toasts.

## Shapes

Radios moderados: 8 px en controles y contenedores de tabla, 12 px en tarjetas de evento e imágenes. El sello es la única forma girada del sistema, a -6 grados, con borde de 3 px en `currentColor`. Su versión plana para tablas no gira y usa borde de 2 px.

## Components

### Sello
La pieza que define el sistema. Estados: Inscrito, Lleno, Finalizado, Cancelado y Cancelada. El orden de prioridad vive en `selloDeEvento`. Fondo siempre opaco, porque se apoya sobre fotos externas arbitrarias. Va en la esquina inferior derecha de la imagen, y al confirmar una inscripción cae con `sello-cae` en 200 ms.

### Tarjeta de evento
Enlace completo con imagen 16:10, sello, título, fecha, ubicación y cupos. El Badge de cupos solo aparece si aún se puede reservar. Un evento en marcha dice "En curso".

### Botón con motivo
`BotonConMotivo` nunca deshabilita en silencio: el motivo aparece como texto visible debajo. Los elementos de menú deshabilitados siguen la misma regla.

### Formularios
Eventos en Sheet lateral y ubicaciones en Dialog. Los errores del backend se pintan encima de los botones, en un bloque `role="alert"`, y el panel sigue abierto.

### Confirmación
`ConfirmDialog` usa "Volver" como salida, y una acción con verbo concreto, como "Sí, cancelar evento".

## Do's and Don'ts

### Do:
- **Do** estampar el estado con `Sello` en vez de inventar un Badge nuevo. La excepción documentada es Activa/Inactiva en ubicaciones, que pide CU07.
- **Do** mostrar el motivo de todo control deshabilitado en texto visible.
- **Do** actualizar los datos en su sitio, respetando `motion-reduce`.
- **Do** anunciar cupos solo cuando se pueda actuar sobre ellos.

### Don't:
- **Don't** usar degradados, efecto vidrio ni sombras duras.
- **Don't** usar Barlow Condensed fuera de un sello.
- **Don't** poner eyebrows sobre los títulos.
- **Don't** usar verde para algo que no sea del usuario, salvo el Badge de CU02.
- **Don't** imitar tinta, textura o relieve en el sello. Es una etiqueta plana, no una simulación de material.
