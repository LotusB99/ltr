/* =========================================================
   VECINDARIO DE TUPLANETXO
   LotusB99 / LTR

   Primera versión:
   - Usuarios online
   - XO original recoloreado mediante Canvas
   - Posiciones aleatorias
   - Nombre al pasar el mouse
   - Actualización automática
========================================================= */

import {
  initializeApp,
  getApps,
  getApp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";

import {
  getFirestore,
  collection,
  getDocs,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


/* =========================================================
   FIREBASE
========================================================= */

const firebaseConfig = {

  apiKey:
    "AIzaSyBQ8DLcKgnftOGGTpv_BJHcxhzUk8nKNnw",

  authDomain:
    "tuplanetxo.firebaseapp.com",

  projectId:
    "tuplanetxo",

  storageBucket:
    "tuplanetxo.firebasestorage.app",

  messagingSenderId:
    "313965563157",

  appId:
    "1:313965563157:web:7fbe11ad11ad7bba2d1c"

};


/* =========================================================
   UTILIZAR INSTANCIA EXISTENTE
========================================================= */

let app;

try {

  if (getApps().length > 0) {

    app = getApp();

  } else {

    app = initializeApp(firebaseConfig);

  }

} catch (error) {

  console.error(
    "VECINDARIO: error inicializando Firebase",
    error
  );

  throw error;

}


const db =
  getFirestore(app);


/* =========================================================
   LOGO ORIGINAL DEL XO
========================================================= */

const XO_LOGO_URL =
  "https://raw.githubusercontent.com/LotusB99/ltr/main/XO_Logo.svg.png";


/* =========================================================
   ELEMENTOS
========================================================= */

const area =
  document.getElementById(
    "txo-vecindario-area"
  );

const loading =
  document.getElementById(
    "txo-vecindario-loading"
  );

const empty =
  document.getElementById(
    "txo-vecindario-empty"
  );

const errorBox =
  document.getElementById(
    "txo-vecindario-error"
  );


/* =========================================================
   COMPROBAR ELEMENTOS
========================================================= */

if (!area) {

  console.error(
    "VECINDARIO: no existe #txo-vecindario-area"
  );

}


/* =========================================================
   COLORES XO
========================================================= */

const XO_COLORES = [

  {
    exterior: "#00AEEF",
    interior: "#BDEEFF"
  },

  {
    exterior: "#00A651",
    interior: "#BFF2D2"
  },

  {
    exterior: "#ED1C24",
    interior: "#FFC2C5"
  },

  {
    exterior: "#FF7F00",
    interior: "#FFD5AD"
  },

  {
    exterior: "#8E44AD",
    interior: "#E4C5F3"
  },

  {
    exterior: "#F1C40F",
    interior: "#FFF2A8"
  },

  {
    exterior: "#3498DB",
    interior: "#C7E6FA"
  },

  {
    exterior: "#E91E63",
    interior: "#F8B9D0"
  },

  {
    exterior: "#00A99D",
    interior: "#BDEDEA"
  }

];


/* =========================================================
   IMAGEN ORIGINAL
========================================================= */

const logoOriginal =
  new Image();

logoOriginal.crossOrigin =
  "anonymous";

logoOriginal.src =
  XO_LOGO_URL;


/* =========================================================
   CACHE
========================================================= */

const cacheXO =
  new Map();


/* =========================================================
   ESPERAR IMAGEN
========================================================= */

function esperarLogo() {

  return new Promise(
    (resolve, reject) => {

      if (
        logoOriginal.complete &&
        logoOriginal.naturalWidth > 0
      ) {

        resolve();

        return;

      }


      logoOriginal.onload =
        function() {

          resolve();

        };


      logoOriginal.onerror =
        function() {

          reject(
            new Error(
              "No se pudo cargar XO_Logo.svg.png"
            )
          );

        };

    }
  );

}


/* =========================================================
   HEX → RGB
========================================================= */

function hexRGB(hex) {

  hex =
    hex.replace(
      "#",
      ""
    );

  return {

    r:
      parseInt(
        hex.substring(0, 2),
        16
      ),

    g:
      parseInt(
        hex.substring(2, 4),
        16
      ),

    b:
      parseInt(
        hex.substring(4, 6),
        16
      )

  };

}


/* =========================================================
   RGB → HSL
========================================================= */

function rgbToHsl(
  r,
  g,
  b
) {

  r /= 255;
  g /= 255;
  b /= 255;

  const max =
    Math.max(
      r,
      g,
      b
    );

  const min =
    Math.min(
      r,
      g,
      b
    );

  let h;
  let s;

  const l =
    (max + min) / 2;


  if (
    max === min
  ) {

    h = 0;
    s = 0;

  } else {

    const d =
      max - min;

    s =
      l > 0.5
        ? d /
          (
            2 -
            max -
            min
          )
        : d /
          (
            max +
            min
          );


    switch (max) {

      case r:

        h =
          (
            g - b
          ) /
          d +
          (
            g < b
              ? 6
              : 0
          );

        break;


      case g:

        h =
          (
            b - r
          ) /
          d +
          2;

        break;


      case b:

        h =
          (
            r - g
          ) /
          d +
          4;

        break;

    }


    h /= 6;

  }


  return {
    h,
    s,
    l
  };

}


/* =========================================================
   RECOLOREAR XO
========================================================= */

function crearXORecoloreado(
  color
) {

  const canvas =
    document.createElement(
      "canvas"
    );


  const ancho =
    logoOriginal.naturalWidth;

  const alto =
    logoOriginal.naturalHeight;


  canvas.width =
    ancho;

  canvas.height =
    alto;


  const ctx =
    canvas.getContext(
      "2d",
      {
        willReadFrequently: true
      }
    );


  ctx.clearRect(
    0,
    0,
    ancho,
    alto
  );


  ctx.drawImage(
    logoOriginal,
    0,
    0,
    ancho,
    alto
  );


  const imagen =
    ctx.getImageData(
      0,
      0,
      ancho,
      alto
    );


  const pixeles =
    imagen.data;


  const exterior =
    hexRGB(
      color.exterior
    );


  const interior =
    hexRGB(
      color.interior
    );


  /*
     Procesamos los colores del logo.

     La idea es conservar:
     - transparencia
     - blanco
     - sombras
     - forma original

     y cambiar únicamente
     las zonas coloreadas.
  */

  for (
    let i = 0;
    i < pixeles.length;
    i += 4
  ) {

    const r =
      pixeles[i];

    const g =
      pixeles[i + 1];

    const b =
      pixeles[i + 2];

    const a =
      pixeles[i + 3];


    if (
      a === 0
    ) {

      continue;

    }


    const max =
      Math.max(
        r,
        g,
        b
      );


    const min =
      Math.min(
        r,
        g,
        b
      );


    const diferencia =
      max - min;


    /*
       Zonas prácticamente grises/blancas:
       mantenerlas.
    */

    if (
      diferencia < 20
    ) {

      continue;

    }


    const hsl =
      rgbToHsl(
        r,
        g,
        b
      );


    /*
       Saturación suficiente para considerarlo
       parte coloreada del logo.
    */

    if (
      hsl.s < 0.15
    ) {

      continue;

    }


    /*
       Oscuros = contorno.
       Claros = interior.

       Conservamos una parte de la luminosidad
       para mantener las sombras y detalles.
    */

    if (
      hsl.l < 0.48
    ) {

      const factor =
        Math.max(
          0.55,
          Math.min(
            1,
            hsl.l / 0.48
          )
        );


      pixeles[i] =
        Math.round(
          exterior.r *
          factor
        );


      pixeles[i + 1] =
        Math.round(
          exterior.g *
          factor
        );


      pixeles[i + 2] =
        Math.round(
          exterior.b *
          factor
        );

    } else {

      const factor =
        Math.max(
          0.70,
          Math.min(
            1.10,
            0.70 +
            (
              hsl.l -
              0.48
            ) *
            1.2
          )
        );


      pixeles[i] =
        Math.min(
          255,
          Math.round(
            interior.r *
            factor
          )
        );


      pixeles[i + 1] =
        Math.min(
          255,
          Math.round(
            interior.g *
            factor
          )
        );


      pixeles[i + 2] =
        Math.min(
          255,
          Math.round(
            interior.b *
            factor
          )
        );

    }

  }


  ctx.putImageData(
    imagen,
    0,
    0
  );


  return canvas.toDataURL(
    "image/png"
  );

}


/* =========================================================
   OBTENER XO DESDE CACHE
========================================================= */

function obtenerImagenXO(
  color
) {

  const clave =
    color.exterior +
    "|" +
    color.interior;


  if (
    cacheXO.has(
      clave
    )
  ) {

    return cacheXO.get(
      clave
    );

  }


  const imagen =
    crearXORecoloreado(
      color
    );


  cacheXO.set(
    clave,
    imagen
  );


  return imagen;

}


/* =========================================================
   COLOR SEGÚN USUARIO
========================================================= */

function obtenerColorXO(
  uid
) {

  let numero =
    0;


  for (
    let i = 0;
    i < uid.length;
    i++
  ) {

    numero =
      (
        numero * 31 +
        uid.charCodeAt(i)
      ) >>> 0;

  }


  return XO_COLORES[
    numero %
    XO_COLORES.length
  ];

}


/* =========================================================
   GENERAR POSICIONES
========================================================= */

function generarPosiciones(
  cantidad
) {

  const posiciones = [];


  const margenX = 7;
  const margenY = 9;


  /*
     Cuando hay pocos usuarios,
     los dejamos bastante separados.
  */

  let distanciaMinima =
    12;


  if (
    cantidad > 10
  ) {

    distanciaMinima =
      9;

  }


  if (
    cantidad > 20
  ) {

    distanciaMinima =
      7;

  }


  for (
    let i = 0;
    i < cantidad;
    i++
  ) {

    let posicion;

    let valido =
      false;

    let intentos =
      0;


    while (
      !valido &&
      intentos < 250
    ) {

      posicion = {

        x:
          margenX +
          Math.random() *
          (
            100 -
            margenX * 2
          ),

        y:
          margenY +
          Math.random() *
          (
            100 -
            margenY * 2
          )

      };


      valido =
        true;


      for (
        const otra
        of posiciones
      ) {

        const dx =
          posicion.x -
          otra.x;


        const dy =
          posicion.y -
          otra.y;


        const distancia =
          Math.sqrt(
            dx * dx +
            dy * dy
          );


        if (
          distancia <
          distanciaMinima
        ) {

          valido =
            false;

          break;

        }

      }


      intentos++;

    }


    /*
       Si no encontró posición después
       de muchos intentos, aceptamos
       la última.
    */

    posiciones.push(
      posicion
    );

  }


  return posiciones;

}


/* =========================================================
   CREAR XO DE USUARIO
========================================================= */

function crearUsuarioXO(
  usuario,
  indice,
  posicion
) {

  const contenedor =
    document.createElement(
      "div"
    );


  contenedor.className =
    "txo-xo-user";


  contenedor.style.left =
    posicion.x +
    "%";


  contenedor.style.top =
    posicion.y +
    "%";


  /*
     Color asociado al UID.
  */

  const color =
    obtenerColorXO(
      usuario.uid
    );


  /*
     Imagen real recoloreada.
  */

  const imagen =
    document.createElement(
      "img"
    );


  imagen.src =
    obtenerImagenXO(
      color
    );


  imagen.alt =
    usuario.nombreUsuario ||
    "Usuario";


  /*
     Tooltip.
  */

  const tooltip =
    document.createElement(
      "div"
    );


  tooltip.className =
    "txo-xo-tooltip";


  tooltip.textContent =
    usuario.nombreUsuario ||
    usuario.nombre ||
    usuario.email ||
    "Usuario";


  contenedor.appendChild(
    imagen
  );


  contenedor.appendChild(
    tooltip
  );


  return contenedor;

}


/* =========================================================
   CONSULTAR USUARIOS ONLINE
========================================================= */

async function obtenerUsuariosOnline() {

  const usuariosOnline =
    [];


  /*
     Obtener usuarios.
  */

  const usuariosSnapshot =
    await getDocs(
      collection(
        db,
        "usuarios"
      )
    );


  /*
     Consultar presencia.
  */

  for (
    const usuarioDoc
    of usuariosSnapshot.docs
  ) {

    const uid =
      usuarioDoc.id;


    const usuario =
      usuarioDoc.data();


    const presenciaRef =
      doc(
        db,
        "presencia",
        uid
      );


    const presenciaSnap =
      await getDoc(
        presenciaRef
      );


    if (
      !presenciaSnap.exists()
    ) {

      continue;

    }


    const presencia =
      presenciaSnap.data();


    if (
      presencia.online !== true
    ) {

      continue;

    }


    if (
      !presencia.ultimoAcceso
    ) {

      continue;

    }


    const ultimoAcceso =
      presencia
        .ultimoAcceso
        .toMillis();


    const diferencia =
      Date.now() -
      ultimoAcceso;


    /*
       Mismo criterio de tu sistema actual:
       120 segundos.
    */

    if (
      diferencia >
      120000
    ) {

      continue;

    }


    usuariosOnline.push({

      uid,

      ...usuario,

      presencia

    });

  }


  return usuariosOnline;

}


/* =========================================================
   DIBUJAR
========================================================= */

async function dibujarVecindario() {

  try {

    if (!area) {
      return;
    }


    loading.style.display =
      "block";


    empty.style.display =
      "none";


    errorBox.style.display =
      "none";


    /*
       Esperar logo.
    */

    await esperarLogo();


    /*
       Eliminar XO anteriores.
    */

    area
      .querySelectorAll(
        ".txo-xo-user"
      )
      .forEach(
        elemento =>
          elemento.remove()
      );


    /*
       Firebase.
    */

    const usuarios =
      await obtenerUsuariosOnline();


    loading.style.display =
      "none";


    /*
       Ninguno.
    */

    if (
      usuarios.length === 0
    ) {

      empty.style.display =
        "block";

      return;

    }


    /*
       Posiciones.
    */

    const posiciones =
      generarPosiciones(
        usuarios.length
      );


    /*
       Crear XO.
    */

    usuarios.forEach(
      (
        usuario,
        indice
      ) => {

        const xo =
          crearUsuarioXO(
            usuario,
            indice,
            posiciones[indice]
          );


        area.appendChild(
          xo
        );

      }
    );


  } catch (error) {

    console.error(
      "VECINDARIO:",
      error
    );


    loading.style.display =
      "none";


    errorBox.style.display =
      "block";


    errorBox.textContent =
      "No se pudo cargar el Vecindario.";

  }

}


/* =========================================================
   INICIO
========================================================= */

dibujarVecindario();


/* =========================================================
   ACTUALIZACIÓN
========================================================= */

setInterval(
  dibujarVecindario,
  20000
);
