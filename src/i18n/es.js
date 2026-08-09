/* Traducción al español. Debe tener la misma forma que en.js: las mismas
 * claves, las mismas firmas de función, la misma longitud de array. Quien
 * cambie algo aquí lo cambia en CADA archivo de idioma — la estructura es
 * el contrato que src/i18n/index.js da por hecho.
 *
 * Se usa "tú" en todo momento — un diario de sueños personal no trata de
 * usted a nadie.
 */
export default {
  tabs: {
    home: "Inicio",
    journal: "Diario",
    symbols: "Símbolos",
    profile: "Perfil",
    sleep: "Sueño",
    newDream: "Grabar un sueño nuevo",
  },

  splash: {
    loading: "Dream Rushes está cargando",
  },

  home: {
    greeting: {
      night: "Aún despierto",
      morning: "Buenos días",
      afternoon: "Buenas tardes",
      evening: "Buenas noches",
    },
    title: "¿Qué soñaste?",
    lede: "Cuéntalo mientras aún está fresco — funciona mejor medio dormido.",
    cta: "Grabarlo",
    streak: (n) => `${n} día${n === 1 ? "" : "s"}`,
    lastHeading: "Anoche",
    menagerieHeading: "Tu colección",
    menagerieEmpty: "Todavía no hay criaturas. Cada sueño que escribes deja una atrás.",
    untitled: "Sueño sin título",
  },

  journal: {
    viewList: "Ver como lista",
    viewDeck: "Ver como tarjetas",
    library: "Tu reparto",
    libraryLede: "Personas, mascotas y lugares de los que pueden surgir tus sueños.",
    libraryCount: (n) =>
      n === 0 ? "Todavía nadie — añade las caras que deben usar tus sueños"
              : `${n} ${n === 1 ? "entrada" : "entradas"} · personas, mascotas, lugares`,
    title: "Diario",
    count: (n) => (n === 1 ? "1 sueño" : `${n} sueños`),
    search: "Buscar en tus sueños…",
    searchLabel: "Buscar en tus sueños",
    empty: "Todavía no hay sueños anotados.",
    emptySearch: "No se encontró nada.",
    untitled: "Sueño sin título",
    close: "Cerrar",
    referencesUsed: "Fotos de referencia usadas:",
    delete: "Eliminar entrada",
    deleted: "Entrada eliminada",
    menu: "Más acciones",
    edit: "Editar texto",
    editing: "Editando",
    save: "Guardar",
    cancelEdit: "Descartar cambios",
    edited: "Cambios guardados",
    correct: "Corregir ortografía y gramática",
    rewrite: "Reescribirlo mejor",
    elaborate: "Desarrollar la narrativa",
    working: "Trabajando en ello…",
    refineTitle: "Aquí está, la versión reelaborada",
    refineLede: "Tu texto actual se conserva hasta que aceptes este.",
    before: "Ahora",
    after: "Reelaborado",
    keep: "Quedarme con el mío",
    accept: "Usar esta versión",
    share: "Compartir",
    sharing: "Preparando…",
    shared: "Compartido",
    shareUnsupported: "Compartir no está disponible aquí — los archivos se descargaron en su lugar.",
    shareNothing: "Todavía nada que compartir — este sueño no tiene imágenes.",
    noCredits: "No hay créditos suficientes. La recarga llega pronto.",
    original: "Escrito originalmente",
    showOriginal: "Mostrar lo que escribí primero",
    hideOriginal: "Ocultar el original",
    months: ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"],
    actRemix: "Remix",
    actRewrite: "Reescribir",
    actEdit: "Editar",
    actShare: "Compartir",
    remixLede: "Estas son las palabras con las que se hicieron tus imágenes. Cámbialas, " +
               "y el siguiente conjunto seguirá la nueva versión.",
    remixLabel: "El sueño del que están hechas tus imágenes",
    remixGo: "Hacer imágenes nuevas",
    filmRendering: "Tu película todavía se está renderizando — llegará aquí cuando esté lista.",
    filmArrived: "✦ Tu película está lista",
    makeLede: "Todavía no hay imágenes. ¿Quieres algunas?",
    makeImages: "Hacer las imágenes",
    makeFilmLede: "Ahora dale vida.",
    makeFilm: "Hacer un cortometraje",
    calendar: "Calendario de sueños",
    calLabel: "Días con un sueño registrado — toca uno para abrirlo",
    calPrev: "Mes anterior",
    calNext: "Mes siguiente",
    calMonths: ["enero", "febrero", "marzo", "abril", "mayo", "junio",
                "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"],
    calWeekdays: ["lu", "ma", "mi", "ju", "vi", "sá", "do"],
    calDreamt: (day, n) =>
      n === 1 ? `Día ${day}: abrir este sueño` : `Día ${day}: ${n} sueños`,
    calSeveral: (n) => `${n} sueños esa noche`,
  },

  symbols: {
    title: "Símbolos",
    subtitle: "Motivos que siguen reapareciendo",
    empty: "Todavía no hay símbolos. Escribe algunos sueños y aparecerán aquí.",
    close: "Cerrar",
    disclaimer: "Una interpretación común, para reflexionar — no un diagnóstico.",
    occurrences: (n) => (n === 1 ? "En 1 sueño" : `En ${n} sueños`),
    untitled: "Sueño sin título",
  },

  profile: {
    title: "Perfil",
    credits: "créditos",
    creditsSoon: "La recarga llega pronto",
    you: "Tú",
    meSet: "Toca para cambiar tu foto",
    meEmpty: "Añade una foto para que los sueños puedan mostrarte",
    addPhoto: "Añadir tu foto",
    changePhoto: "Cambiar tu foto",
    statDreams: "sueños",
    statStreak: "días seguidos",
    people: "Personas",
    pets: "Mascotas",
    places: "Lugares",
    new: "Nuevo",
    deleteLabel: (tag) => `Eliminar @${tag}`,
    editLabel: (tag) => `Editar @${tag}`,
    referenceFor: (tag) => `Foto de referencia para @${tag}`,
    removed: (tag) => `@${tag} eliminado`,
  },

  avatarDialog: {
    titleFor: { person: "Añadir una persona", pet: "Añadir una mascota", place: "Añadir un lugar" },
    editTitleFor: { person: "Editar persona", pet: "Editar mascota", place: "Editar lugar" },
    meTitle: "Este eres tú",
    nameLabel: (tag) => `Nombre (se convierte en @${tag})`,
    photoLabel: "Foto de referencia",
    photoAdd: "Añadir una foto",
    photoReplace: "Reemplazar la foto",
    photoRemove: "Quitar la foto",
    descLabel: "Descríbelo",
    descLabelOptional: "Descríbelo (opcional)",
    descPlaceholder: "alto, pelo rizado oscuro, siempre con un abrigo verde",
    previewAlt: "Vista previa de la foto seleccionada",
    privacy: "Esta foto se envía a fal.ai cuando se renderiza un sueño.",
    cancel: "Cancelar",
    save: "Guardar",
    saveChanges: "Guardar cambios",
    needName: "⚠ Usa solo letras o números para el nombre.",
    needPhotoOrDesc: "⚠ Añade una foto o descríbelo — el renderizador necesita uno de los dos.",
    needPhotoOrDescHint: "Añade una foto o una descripción. Sin ninguna de las dos no hay nada de qué partir.",
    exists: (tag) => `⚠ @${tag} ya existe.`,
    created: (tag) => `@${tag} añadido`,
    saved: (tag) => `@${tag} actualizado`,
    readFailed: "⚠ No se pudo leer esa foto.",
  },

  tagCard: {
    label: (tag) => `Sobre @${tag}`,
    categories: { person: "Persona", pet: "Mascota", place: "Lugar" },
    photoOnly: "Sin descripción — la foto se usa por sí sola.",
    close: "Cerrar",
  },

  guide: [
    {
      title: "Comprobaciones de realidad",
      text: "Pregúntate varias veces al día si estás soñando — y compruébalo de verdad: " +
            "cuenta tus dedos, mira un reloj, aparta la vista, vuelve a mirar. " +
            "En un sueño, la respuesta cambia.",
    },
    {
      title: "MILD",
      text: "Al quedarte dormido, repite: “Esta noche notaré que estoy soñando”. " +
            "Imagina un sueño que hayas tenido e imagínate dándote cuenta dentro de él.",
    },
    {
      title: "WBTB",
      text: "Despierta brevemente tras unas cinco horas, quédate despierto 20–30 minutos, " +
            "y vuelve a dormirte usando MILD. El método más fiable — y el que te cuesta sueño.",
    },
    {
      title: "Escríbelo",
      text: "Anota tus sueños justo al despertar, antes de levantarte. Quienes escriben " +
            "con regularidad recuerdan más — y empiezan a ver sus propios patrones.",
    },
  ],

  dream: {
    title: "Graba tu sueño",
    cancel: "Cancelar",
    label: "Anoche soñé…",
    placeholder: "…caía de espaldas por una ciudad que se convertía en agua, " +
                 "y las farolas se volvían medusas…",
    textLabel: "Texto del sueño",
    modeLegend: "¿Cómo debería salir?",
    modeImages: "Historia en fotos",
    modeImagesHint: "Una secuencia de imágenes fijas",
    modeFilm: "Película",
    modeFilmHint: "Un clip corto en movimiento",
    privacy: "El texto de tu sueño va a fal.ai (y a DeepSeek, para ayudar a escribir el prompt). " +
             "Las fotos de referencia y las grabaciones de voz van solo a fal.ai. Tu diario se queda en este dispositivo.",
    submit: "✦ Invocar el sueño",
    submitting: "Invocando…",
    tooShort: "⚠ Escribe un poco más primero.",
    caught: (name) => `✦ ${name} se unió a tu colección`,
    interview: "Contarlo en voz alta",
    interviewHint: "Yo pregunto, tú hablas — con los ojos cerrados si quieres",
    reading: "Leyendo tu sueño…",
    readingHint: "Le está poniendo nombre y viendo quién estaba ahí.",
    or: "o escríbelo",
    loading: [
      "Revelando tus fotogramas…",
      "Editando la niebla…",
      "Coloreando tu subconsciente…",
      "Invocando lo que viste…",
      "Casi lúcido…",
    ],
  },

  wizard: {
    back: "Atrás",
    cancel: "Cancelar",
    next: "Continuar",
    free: "Gratis",
    from: "desde",
    credit: "crédito",
    credits: "créditos",
    tooShort: "⚠ Escribe un poco más primero.",
    noCredits: "No hay créditos suficientes. La recarga llega pronto.",
    progress: (n, total) => `Paso ${n} de ${total}`,

    step1: {
      title: "¿Qué soñaste?",
      improve: "Mejorar con IA",
      reading: "Leyendo tu sueño…",
      why: "La IA vuelve a contar tu sueño en tu propio idioma y averigua quién y " +
           "dónde aparece en él. Todo lo que viene después — los personajes, los " +
           "lugares, las imágenes — se construye sobre eso.",
      previewTitle: "Aquí está, ordenado",
      previewLede: "Tus propias palabras se conservan siempre, elijas lo que elijas.",
      yours: "Como lo escribiste",
      improved: "Mejorado",
      keepMine: "Quedarme con mis palabras",
      useImproved: "Usar esta versión",
    },

    step2: {
      title: "¿Qué debería pasar con él?",
      saveOnly: "Solo guardarlo",
      saveOnlyHint: "En tu diario, sin generar nada",
      images: "Una historia en fotos",
      imagesHint: "Imágenes fijas de tu sueño, en orden",
      film: "Una película",
      filmHint: "Primero renderiza una imagen fija, luego le da vida",
      saved: "Sueño guardado",
    },

    step3: {
      title: "¿Quién aparece?",
      lede: "Cualquiera que ya esté en tu biblioteca se reconoce automáticamente. Para el " +
            "resto, dinos quiénes son — o deja que la IA los invente.",
      empty: "No se encontró a nadie en este sueño. No pasa nada — sigamos.",
    },

    step4: {
      title: "¿Dónde ocurre?",
      lede: "Un sueño que se mueve de un lugar a otro necesita ambos. Las mismas " +
            "opciones que antes.",
      empty: "No se encontró ningún lugar en este sueño. La IA imaginará uno.",
    },

    cast: {
      choose: "De la biblioteca",
      change: "Cambiar",
      createNew: "Crear nuevo",
      letAi: "Dejar que la IA decida",
      freeSet: "La IA los inventa",
      undecided: "Aún sin decidir",
      note: "Todo lo que quede sin decidir lo inventa la IA.",
      removeLabel: (name) => `Quitar a ${name}`,
      pickTitle: (name) => `¿Quién es “${name}”?`,
      libraryEmpty: "Tu biblioteca todavía está vacía.",
    },

    step5: {
      title: "¿Cómo debería verse?",
      countLabel: "Cuántas imágenes",
      countNames: { 3: "Principio, medio, final", 5: "Todo el arco", 10: "Cada giro" },
      styleLabel: "Estilo",
      formatLabel: "Formato",
      portrait: "Móvil, historias",
      landscape: "Panorámico",
      keyframeLabel: "¿Qué imagen cobra vida?",
      keyframeHint: "La película empieza desde esta imagen — su estilo se mantiene.",
      filmModelLabel: "Qué renderizador",
      filmModels: {
        standard: { name: "Estándar", hint: "hasta 15s · 1 crédito por segundo" },
        premium:  { name: "Premium",  hint: "hasta 30s en una sola toma · 6 por segundo" },
      },
      lengthLabel: "Cuánto dura",
      posterLabel: "El póster",
      posterTitleLabel: "Título de la película",
      posterTitlePlaceholder: "Título en el póster",
      posterTaglineLabel: "Eslogan",
      posterTaglinePlaceholder: "Una línea que venda el sueño (opcional)",
      posterHint: "Tu sueño se abre como una película: la primera imagen es su póster, " +
                  "con este título en ella. Borra el título si prefieres solo imágenes de escena.",
      generate: "Crearlo",
      progress: (done, total) => `${done} de ${total} listas`,
      summaryImages: (n) => `${n} imágenes en una secuencia continua.`,
      summaryFilm: "Una imagen fija, cobrando vida.",
      summaryFilmLength: (s) => `${s} segundos de película. Renderizar tarda unos minutos — puedes irte y volver.`,
      summaryRefs: (n) =>
        n === 0 ? "Sin fotos de referencia — todo se inventa."
                : n === 1 ? "Se usará 1 foto de referencia."
                          : `Se usarán ${n} fotos de referencia.`,
    },

    step6: {
      title: "Tu sueño",
      save: "Guardar en el diario",
      added: "Añadido a tu sueño",
      saveWhileRendering: "Guardar — volveré a por él",
      rendering: "Tu película se está creando…",
      renderingHint: "Esto tarda unos minutos. Puedes irte — estará " +
                     "esperando en tu diario cuando esté lista.",
      renderFailed: "La película no llegó. Tus créditos se gastaron en " +
                    "el intento — avísanos y lo investigaremos.",
      nothing: "No volvió nada. Inténtalo de nuevo desde el último paso.",
    },
  },

  sleep: {
    title: "Sueño",
    subtitle: "Todo lo que rodea al sueño — completamente gratis.",
    free: "Los sueños cuestan créditos. El sueño, nunca.",
    tiles: {
      checklist: {
        emoji: "🌜",
        title: "Relajarse",
        text: "La lista de esta noche para dormirte más rápido",
      },
      sounds: {
        emoji: "🌊",
        title: "Sonidos para dormir",
        text: "Mezcla colores de ruido y déjalos sonar",
      },
      guide: {
        emoji: "🧠",
        title: "Sueños lúcidos",
        text: "Comprobaciones de realidad, MILD, WBTB, diario",
      },
      symbols: {
        emoji: "✧",
        title: "Símbolos de sueños",
        text: "Lo que sigue apareciendo en tus sueños",
      },
    },
    checklist: {
      lede: "El ritual de esta noche — las marcas se reinician solas cada día.",
      progressLabel: "Pasos hechos esta noche",
      remaining: (n) => (n === 0 ? "Todo listo — que duermas bien." : `Quedan ${n}`),
      hint: "¿Sigues despierto tras ~20 minutos? Levántate, haz algo tranquilo con " +
            "luz tenue, y vuelve cuando tengas sueño — quedarte despierto en la cama " +
            "le enseña a la cama a significar “despierto”.",
      items: [
        { id: "light",    title: "Baja todas las luces",
          text: "Poca luz durante la última hora — o ninguna: una habitación a oscuras o un antifaz." },
        { id: "shower",   title: "Ducha o baño caliente",
          text: "Unos 90 minutos antes de dormir. El enfriamiento posterior es la propia señal de sueño del cuerpo." },
        { id: "cool",     title: "Enfría el dormitorio",
          text: "Entre 16 y 19 °C. Una habitación fresca bajo una manta caliente le gana a una habitación caliente." },
        { id: "caffeine", title: "Nada de cafeína después de media tarde",
          text: "Bloquea la presión de sueño durante seis horas o más — el café de la tarde es cansancio por la mañana." },
        { id: "screens",  title: "Aparta las pantallas",
          text: "La última media hora es para papel, sonido, o nada. El diario es para la mañana." },
        { id: "relax",    title: "Suelta cada músculo",
          text: "De los dedos de los pies a la mandíbula: tensa cada grupo cinco segundos, suelta, sigue. El truco mejor probado de esta lista." },
        { id: "breathe",  title: "Ralentiza tu respiración",
          text: "4 segundos inhalando, 7 conteniendo, 8 exhalando — varias rondas. Las exhalaciones largas ponen el cuerpo en modo descanso." },
      ],
    },
    sounds: {
      lede: "Tres colores de ruido, mezclables a tu gusto. Suenan en bucle " +
            "hasta que los detengas — y siguen sonando mientras usas el resto de la app.",
      names: { white: "Ruido blanco", pink: "Ruido rosa", brown: "Ruido marrón" },
      descs: { white: "estática brillante, tapa todo lo demás", pink: "como lluvia constante", brown: "como un océano lejano" },
      autoStart: "Iniciar mi mezcla al abrir la app",
      autoStartHint: "Los navegadores piden un primer toque — tu mezcla empieza con el primer toque.",
      background: "La mezcla sigue sonando vayas donde vayas en la app. El botón " +
                  "de altavoz en la esquina superior la silencia en cualquier momento.",
    },
    soundsMute: "Silenciar sonidos para dormir",
    soundsUnmute: "Activar sonidos para dormir",
  },

  onboarding: {
    tagline: "Tus sueños, revelados.",
    swipe: "desliza",
    slides: [
      { title: "Guarda cada sueño",
        text: "Cuéntalo medio dormido, en voz alta — el asistente hace las " +
              "preguntas correctas y anota la noche por ti." },
      { title: "Visualiza tu sueño",
        text: "Se convierte en una secuencia de imágenes cinematográficas — con las " +
              "caras reales de las personas, mascotas y lugares que aparecen. Elige " +
              "tu favorita y dale vida como un cortometraje." },
      { title: "Hay más, gratis",
        text: "Una guía de sueños lúcidos, y lo que podrían significar tus símbolos " +
              "recurrentes — cuando quieras." },
    ],
    start: "Empezar",
    gateTitle: "Hazlo tuyo",
    gateText: "Una charla de dos minutos con el asistente personaliza tu " +
              "perfil — cómo sueñas, qué se repite, cómo quieres que te llamen. " +
              "Puedes saltarte cualquier pregunta.",
    gateReward: "✦ 3 créditos gratis al terminar",
    gateStart: "Vamos a hablar",
    gateLater: "Quizá luego",
    surveyTitle: "conociéndote",
    selfieTitle: "Una última cosa",
    selfieText: "Añade una foto tuya y tus sueños pueden protagonizarte a TI — " +
                "las imágenes usan tu cara real. Siempre puedes hacerlo más tarde.",
    selfieAdd: "Añadir mi foto",
    selfieSkip: "Ahora no",
    granted: "✦ Bienvenido — se añadieron 3 créditos",
    thanks: "✦ Gracias — tu perfil está listo",
    profileCard: "Termina tu perfil con una charla de 2 minutos",
    profileCardHint: "✦ 3 créditos gratis si lo haces",
    startMenuTitle: "Antes de entrar",
    startMenuText: "¿Ver el proceso de bienvenida, o saltar directo a la app?",
    startMenuOnboarding: "Mostrar bienvenida",
    startMenuSkip: "Saltar a la app",
  },

  voice: {
    title: "contando un sueño",
    cancel: "Cerrar",
    connecting: "Despertando…",
    yourTurn: "Solo habla — estoy escuchando",
    listening: "…",
    type: "escribir",
    finish: "listo",
    send: "Enviar",
    typePlaceholder: "O escríbelo en su lugar…",
    errors: {
      NO_GEMINI_KEY: "⚠ No hay clave de voz en el servidor. Configura GEMINI_KEY y reinicia.",
      MIC_DENIED: "⚠ Se bloqueó el acceso al micrófono. Permítelo en la configuración de tu navegador.",
      UPSTREAM: "⚠ El servicio de voz se cortó. Inténtalo de nuevo.",
      SOCKET: "⚠ No se pudo conectar con el servicio de voz.",
      CLOSED: "⚠ La conexión se cerró. Inténtalo de nuevo.",
    },
  },

  paywall: {
    title: "Dream Rushes Plus",
    close: "Cerrar",
    headline: "Tus sueños, como películas.",
    lede: "Escribir, la voz y todo en la pestaña de Sueño siguen siendo gratis. Los créditos son solo para lo que un renderizador tiene que dibujar.",
    tabSub: "Suscribirse",
    tabPack: "Comprar créditos",
    periodName: { month: "Mensual", year: "Anual" },
    packName: (n) => `${n} créditos`,
    per: { month: "al mes", year: "al año" },
    oneTime: "pago único",
    save: (pct) => `Ahorra ${pct}`,
    creditsPerMonth: (n) => `${n} créditos cada mes`,
    creditsOnce: (n) => `${n} créditos, nunca caducan`,
    yield: (credits, five, three) =>
      `${credits} créditos — unos ${five} sueños con 5 imágenes, o ${three} con 3. Una película cuesta lo mismo que 5 imágenes.`,
    included: "Siempre incluido, gratis",
    chips: [
      "Diario ilimitado", "Grabación de voz", "Reescritura con IA",
      "Sonidos para dormir", "Lista para relajarte", "Guía de sueños lúcidos", "Símbolos de sueños",
    ],
    freeNote: "Solo la generación de imágenes y películas cuesta créditos — es la parte que le pagamos a un renderizador.",
    cta: "Continuar",
    notYet: "⚠ El pago aún no está conectado — esto es una vista previa de los planes.",
    balance: (n) => `Actualmente tienes ${n} créditos.`,
  },

  errors: {
    storageFull: "⚠ Almacenamiento lleno — elimina entradas antiguas o fotos de referencia.",
    unexpected: "Respuesta inesperada del servidor.",
    serverStatus: (s) => `El servidor respondió con ${s}.`,
  },
};
