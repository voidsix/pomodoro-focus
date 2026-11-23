# Foco Pomodoro 🍅

App web instalable (PWA) para hacer pomodoros personalizados y mejorar la concentración. Funciona en el celular y la computadora, y también sin conexión.

**Online:** https://focoestudio.app

## Funciones

- **Ritmos predefinidos**: Clásico (25/5), Arranque suave (15/3), Profundo (50/10) y Flow (90/20).
- **Tiempos a medida**: foco, descanso corto, descanso largo y cada cuántos pomodoros va el largo.
- **Materias**: cargás tus materias y cada pomodoro se guarda en la que estás estudiando.
- **Cuenta regresiva a finales**: "Faltan 12 días para el final de Análisis II".
- **Plan de estudio**: cargás los temas de cada materia y la app calcula cuántos pomodoros hacer hoy para llegar al final (el día antes queda para repasar), te dice si vas en ritmo y te sugiere el próximo tema.
- **Horas por materia**: cuánto le dedicaste a cada una en los últimos 7 días.
- **Tarea actual**: queda guardada junto a cada sesión.
- **Anotador de distracciones**: anotás lo que se te cruza y seguís.
- **Progreso**: pomodoros y minutos del día, racha de días seguidos, gráfico de 7 días e historial.
- **Sonidos de fondo**: lluvia, olas, chimenea, ruido marrón, ruido blanco y tic-tac, con volumen. Cada uno suena en dos bucles de distinto largo para que no se note la repetición. Suenan mientras corre el pomodoro (opcional también en descansos). Se generan con Web Audio, sin archivos, así que funcionan sin conexión.
- **Frecuencias de concentración**: pulso beta 16 Hz (sin auriculares), binaural beta 14 Hz (con auriculares) y alfa 10 Hz para descansos.
- **Modo zen**: pantalla completa con solo el reloj; los controles se esconden solos y la pantalla no se apaga (tecla Z).
- **Avisos**: cuatro sonidos a elegir (campanitas, gong, digital, suave), vibración y notificaciones al terminar cada bloque.
- **Encadenado automático** opcional entre foco y descanso.
- Atajo de teclado: barra espaciadora para empezar o pausar.

Todo se guarda en el navegador (`localStorage`). No hay servidor ni cuentas.

## Probarla en tu PC

No necesita instalar dependencias. Desde la carpeta del proyecto:

```bash
npx serve .
# o
python3 -m http.server 8000
```

Después abrí `http://localhost:8000` (o la dirección que indique `serve`).

## Publicarla gratis con GitHub Pages

1. Subí el proyecto a un repositorio de GitHub.
2. En el repo: **Settings → Pages → Source: Deploy from a branch → main / (root)**.
3. En un par de minutos queda en `https://TU-USUARIO.github.io/NOMBRE-DEL-REPO/`.
4. Abrila desde el celular y elegí **"Agregar a pantalla de inicio"** para instalarla como app.

## Estructura

| Archivo | Para qué sirve |
| --- | --- |
| `index.html` | Estructura de la pantalla |
| `styles.css` | Diseño (rojo tomate para foco, verde azulado para descanso) |
| `app.js` | Lógica del temporizador, ajustes, distracciones y estadísticas |
| `sw.js` | Service worker para uso sin conexión |
| `manifest.webmanifest` | Datos para instalarla como app |
| `icon.svg` | Ícono |

## Ideas para seguir

- Estadísticas por tarea y comparación entre ritmos para ver cuál te rinde más.
- Exportar e importar el historial.
- Empaquetarla para Play Store con [Capacitor](https://capacitorjs.com/) o [PWABuilder](https://www.pwabuilder.com/).
