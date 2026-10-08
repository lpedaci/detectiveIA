# Misión: Detective de la IA

Tablero de autoseguimiento para la actividad gamificada «Misión: Detective de la IA» (Programa de formación docente, 4.º año). Cada participante marca las tareas que completó en el aula virtual, suma XP, desbloquea niveles y gana insignias.

Es un sitio estático, sin dependencias ni servidor.

## Estructura

```
detectiveIA/
├── index.html              Página (estructura y textos fijos)
├── assets/
│   ├── css/styles.css      Estilos, temas claro/oscuro y animaciones
│   ├── js/data.js          Contenido del caso: niveles, tareas, XP, pistas y rangos
│   ├── js/app.js           Lógica del tablero (progreso, guardado, animaciones)
│   └── img/
│       ├── favicon.svg         Ícono de pestaña
│       ├── apple-touch-icon.png Ícono al guardar en el celular
│       └── og-image.png        Vista previa al compartir el enlace (1200×630)
├── .nojekyll               Indica a GitHub Pages que publique los archivos tal cual
└── README.md
```

## Cómo se guarda el avance

El avance se guarda en el `localStorage` del navegador (clave `detective-ia-v1`):

- Se guarda solo, en cada marca y al escribir el nombre.
- Persiste al cerrar la pestaña o apagar la computadora.
- Es **por navegador y por dispositivo**: si alguien abre el tablero en el celular, no ve lo que marcó en la computadora.
- Se pierde en modo incógnito, al borrar los datos de navegación o al tocar «Reiniciar tablero».
- Si el navegador bloquea el almacenamiento, el tablero muestra un aviso y ofrece abrirse en una pestaña nueva.
- Si está abierto en dos pestañas, se sincroniza entre ellas.

No se envía ningún dato a ningún servidor.

## Publicar con GitHub Pages

1. En el repositorio: **Settings → Pages**.
2. En *Source* elegir **Deploy from a branch**, rama `main` (o la que corresponda) y carpeta `/ (root)`.
3. Guardar. A los pocos minutos queda disponible en `https://lpedaci.github.io/detectiveIA/`.

## Vincularlo al LMS

**Opción recomendada: enlace (URL) que abre en ventana nueva.** En Moodle: *Agregar actividad o recurso → URL*, pegar la dirección de GitHub Pages y en *Apariencia* elegir «En ventana emergente» o «Nueva ventana». Así el navegador guarda el avance sin restricciones.

**Opción incrustada (iframe).** Funciona, pero algunos navegadores (sobre todo Safari) limitan el almacenamiento de páginas incrustadas desde otro dominio, y el avance podría no conservarse. Si se incrusta, el tablero muestra un enlace «Abrir en pestaña nueva».

```html
<iframe src="https://lpedaci.github.io/detectiveIA/" title="Misión: Detective de la IA"
        width="100%" height="900" style="border:0" loading="lazy"></iframe>
```

## Editar el contenido

Los niveles, tareas, XP, pistas y rangos están en `assets/js/data.js` (constantes `LEVELS` y `RANKS`). No hace falta tocar `app.js`. El XP total, las marcas de la barra y los rangos se calculan solos. Si se cambian los `id` de las tareas, el avance guardado de esas tareas se descarta.

## Reglas del juego

- Un nivel se desbloquea al completar todas las tareas del anterior.
- Si alguien desmarca una tarea, los niveles siguientes vuelven a bloquearse; sus marcas se conservan y vuelven a sumar al reabrirse.
- Insignias: «Primera pista» (primera tarea marcada) y una por nivel completo.
- Rangos: Aprendiz (0 XP), Detective (50), Detective senior (100), Jefe/a de investigación (140). Total: 150 XP.

## Accesibilidad y movimiento

Contraste en modo claro y oscuro (según el sistema), navegación con teclado, anuncios para lectores de pantalla y animaciones desactivadas si la persona tiene activado «reducir movimiento».

## Referencias

MDN Web Docs. (s.f.). *Window: localStorage property*. Mozilla. https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage

WebKit. (2020, 24 de marzo). *Full third-party cookie blocking and more*. https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/
