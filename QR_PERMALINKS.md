# Enlaces fijos de FEMFORM para libro y ebook

Estas son las URLs exactas codificadas en los QR:

| Uso | URL fija | Destino actual |
| --- | --- | --- |
| Libro físico | `https://maferbel2026.github.io/go/?to=book` | `https://femform-nutricion-online.ma-fer-13.chatgpt.site/` |
| Ebook | `https://maferbel2026.github.io/go/?to=ebook` | `https://femform-nutricion-online.ma-fer-13.chatgpt.site/` |

El QR siempre abre la URL de GitHub Pages. La página `dist/go/index.html` lee la clave `to` y envía al destino correspondiente con JavaScript. Solo admite claves incluidas en su objeto `destinations`: no acepta una URL arbitraria desde el parámetro.

## Cambiar un destino sin tocar el QR

1. Abre [`dist/go/index.html`](dist/go/index.html) en este proyecto.
2. Localiza el bloque `const destinations`. Cambia **solo la URL a la derecha** de `book` o `ebook`, manteniendo la clave y las comillas. Usa una URL `https://` completa.
3. Publica el cambio en el repositorio `Maferbel2026/Maferbel2026.github.io`. El workflow de GitHub Pages publica la carpeta `dist/` al subir el cambio a `main`; espera a que termine correctamente. No hace falta cambiar el dominio principal ni publicar de nuevo el Site de FEMFORM para actualizar esta ruta.
4. Abre las dos URLs de la tabla en una ventana privada. Comprueba que solo la clave modificada lleve al destino nuevo. Prueba también `https://maferbel2026.github.io/go/?to=inexistente`: debe mostrar «Enlace no disponible» sin enviarte a una dirección externa.
5. Escanea los QR ya impresos con un teléfono y confirma que llegan a las páginas esperadas. No regeneres los QR existentes.

La actualización puede tardar unos minutos en reflejarse por la publicación y la caché de GitHub Pages. No uses una redirección HTTP 301 hacia un destino que quieras cambiar: los navegadores pueden conservarla.

## Agregar otro enlace

Elige una clave corta en minúsculas, por ejemplo `curso`. Añade una línea `curso: 'https://destino-elegido.example/',` al objeto `destinations`, publica y comprueba `https://maferbel2026.github.io/go/?to=curso` antes de crear su QR. Los enlaces `book` y `ebook` no cambian.

## Qué debes conservar durante la vida del libro

- La cuenta GitHub `Maferbel2026` y el repositorio `Maferbel2026.github.io`, con GitHub Pages activo.
- La ruta `/go/` y las claves `book` y `ebook` exactamente como se imprimieron.
- El acceso a GitHub y una copia de este proyecto. Si más adelante cambias el dominio principal de FEMFORM, deja esta ruta de GitHub Pages activa y modifica únicamente los destinos.
- Evita configurar un dominio personalizado en **este** GitHub Pages si eso hace que la URL `maferbel2026.github.io` redirija al dominio nuevo. El QR impreso necesita que su URL de GitHub siga abriendo.

Un enlace de GitHub no es una garantía de permanencia absoluta: depende de mantener esa cuenta y de que GitHub Pages siga disponible. Un dominio propio comprado **antes** de imprimir daría más control sobre el nombre, pero implicaría renovarlo periódicamente. Comprar un dominio después no cambia la URL que ya quedó dentro del QR.

## Archivos para impresión

| Uso | Vector SVG | PNG de alta resolución |
| --- | --- | --- |
| Libro físico | [`print/qr/femform-qr-libro.svg`](print/qr/femform-qr-libro.svg) | [`print/qr/femform-qr-libro.png`](print/qr/femform-qr-libro.png) |
| Ebook | [`print/qr/femform-qr-ebook.svg`](print/qr/femform-qr-ebook.svg) | [`print/qr/femform-qr-ebook.png`](print/qr/femform-qr-ebook.png) |

Ambos QR usan corrección de errores H, módulos negros sobre blanco, un margen libre de cuatro módulos y un corazón rosa empolvado pequeño en el centro. Los SVG tienen un tamaño nominal de 45 × 45 mm y pueden ampliarse sin perder nitidez; los PNG miden 3600 × 3600 px. Los prototipos y archivos finales se decodificaron automáticamente a varios tamaños hasta 135 × 135 px. Antes de mandar el libro a imprenta, imprime una prueba al tamaño real y escanéala con más de un teléfono.
