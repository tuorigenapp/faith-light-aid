/** Biblioteca Digital ORIGEN — portadas + enlaces de descarga */
export type Ebook = {
  id: string;
  title: string;
  cover: string;
  /** texto de referencia (tema, sinónimos) usado para la búsqueda */
  keywords: string;
  /** uno o varios ebooks del mismo tema */
  files: string[];
};

const IBB = "https://i.ibb.co/";
const drive = (id: string) => `https://drive.google.com/uc?export=download&id=${id}`;

/** Quita acentos y normaliza a minúsculas para comparar texto sin distinción de mayúsculas/tildes */
export function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/** true si el libro coincide con la búsqueda por título o palabras clave de la portada */
export function matchesQuery(book: Ebook, query: string): boolean {
  const q = normalizeText(query);
  if (!q) return true;
  const haystack = normalizeText(`${book.title} ${book.keywords}`);
  return haystack.includes(q);
}

function book(id: string, title: string, cover: string, ...fileIds: string[]): Ebook {
  return {
    id,
    title,
    cover: IBB + cover,
    keywords: `${title} sanacion emocional autoestima crecimiento personal biblioteca origen`,
    files: fileIds.map(drive),
  };
}

export const EBOOKS: Ebook[] = [
  book("b01", "Sanando las Heridas del Pasado", "cS2nq7th/61k4-G8y-F8-PL-AC-UF1000-1000-QL80.jpg", "1sy__6MoEEcfpY-9mqlUp8McBsi8uP4Ix"),
  book("b02", "El Arte de Soltar el Control", "QFvMtzzb/71-N7-P-i-HIXL-AC-UF1000-1000-QL80.jpg", "1P9PjuL49TA-LhsMwYNboTIgJH4HGHrsf"),
  book("b03", "Reconecta con tu Niño Interior", "ZRbN6pKW/71-XY-4bez-AL-AC-UF1000-1000-QL80.jpg", "1432KsBf903Wbfb6jqRzQaN9c-Eg6CDxl"),
  book("b04", "Vivir en el Presente", "20hmZDW8/img-5960.jpg", "1luzRqJhJi04EwR7T0pRVVOEg-VdBqouv"),
  book("b05", "El Poder de la Autocompasión", "tpsHPVZg/Screenshot-20260804-165758-1.png", "1otFJEC9aGniA7bxHIYkNxAREG4uG6vT5"),
  book("b06", "Rompiendo Ciclos Familiares", "MxWtnLNS/Screenshot-20260810-010235-624.png", "1ONuHz4J3bteBty5QMaC2j0tlLfaW3yj4"),
  book("b07", "La Fuerza de tus Emociones", "XZdvfWDh/Screenshot-20260804-165816-1.png", "1AgK7npdBflYg4DXgss9NOqI79RvxDl1B"),
  book("b08", "Aprendiendo a Perdonar", "vCp3TCxz/Screenshot-20260804-165822-1.png", "1m2gLkK8_z510vdtpSQ_hSCm2kH1Wm7c_"),
  book("b09", "El Camino hacia la Calma", "TD1xP8yL/Screenshot-20260804-165826-1.png", "15pESaGUovZ6Rhr3cYY3ZPMU--OfyH7mr"),
  book("b10", "Amor Propio: Guía Práctica", "bgpN5Ng8/Screenshot-20260804-165835-1.png", "1L6DggGDO6ilZ2B3n0acp_MqHxnaCNEGK"),
  book("b11", "Superando el Miedo al Abandono", "JjcYdY1G/Screenshot-20260804-165839-1.png", "1yGL_zHjd3ZGyaNLLlS5WjPqJpkcK0UIh"),
  book("b12", "El Vacío que Nadie Ve", "j9R1zmFS/Screenshot-20260804-165848-1.png", "1DPe99FpZZDIEsEfK7EeW6VMnoEJBHelO"),
  book("b13", "Renacer Después del Dolor", "Y44Sq6hs/Screenshot-20260805-102510-339.png", "1J2ponca1_Jr7zYv79nfUJnPeP1trDfS3"),
  book("b14", "Límites Sanos, Vida Sana", "yBZMT1Zc/Screenshot-20260805-102621-624.png", "1OUUBC8uYXSodtxde601o_dF4dHMejhHB"),
  book("b15", "Desapego Consciente", "dJGVbdMT/Screenshot-20260805-102640-095.png", "1VGsjHv1K67GDT9x_0WOShd8uHrSr_WK6"),
  book("b16", "La Voz de tu Intuición", "1fh4VyzX/Screenshot-20260805-102821-384.png", "1bgKF2znv-KrDUbsvHpWPcgxUUJdiT2Cu"),
  book("b17", "Sanar la Ansiedad desde Adentro", "DfDWY7zB/Screenshot-20260805-102841-830.png", "1cL7rFA_bNuDIIVgexOHmszsbGlzI4L3I"),
  book("b18", "El Espejo de tus Relaciones", "JR9cZyrg/Screenshot-20260805-102907-735.png", "17DvXeABzjaybECFKo8Ez9y12jKA1itV6"),
  book("b19", "Volver a Confiar", "kgB6zyzm/Screenshot-20260805-102926-664.png", "1ebROOo3NYLeZmh-iciIqVMnpQXCKhIUE"),
  book("b20", "La Trampa de la Perfección", "GQcnt1v4/Screenshot-20260805-102940-996.png", "1nyeTPFK_WiX-ShGw4sdQGHTKaCJRo_lU"),
  book("b21", "Habitar tu Cuerpo con Amor", "KjjXdVjM/Screenshot-20260805-103001-703.png", "1gqxR0-9FOVjy5PehSkuuyYANEDXfened"),
  book("b22", "El Duelo como Puerta de Crecimiento", "xbgpzRL/Screenshot-20260805-103020-713.png", "1w6MCbpWwMENbBJnj3KQObx5i2FMXQ3oF"),
  book("b23", "Reconstruyendo la Autoestima", "pj6PpHRq/Screenshot-20260805-103037-014.png", "1qvpIHPAHOVIhg2miGF7TAEE7bxrcjp7G"),
  book("b24", "El Silencio que Sana", "Q3cXdGMQ/Screenshot-20260805-103054-566.png", "1VLUUtFabbsUCwoDle2WUYMEYFxlfD0rn"),
  book("b25", "Mente Clara, Corazón Ligero", "VY7vq8q1/Screenshot-20260805-103133-325.png", "12PBTFs6BlT3i95Ye7Ny8RpnMjao9DeDi"),
  book("b26", "Vivir sin Culpa", "bh7mLPZ/Screenshot-20260805-103147-522.png", "1PioNJEIhFA0xYmVuQ1HAHxjHi0QfjzM5"),
  book("b27", "El Regalo de la Vulnerabilidad", "h1tBVLkg/Screenshot-20260805-103209-811.png", "1G9eiQYe-YQ0lTRX7tgIx_u2ZaAL8Q3KS"),
  book("b28", "Transformando la Rabia en Fuerza", "5gZ1mZsB/Screenshot-20260805-103236-058.png", "1C-Y3Sfwd-8fdhp6caXO7OChz6nkbkCbJ"),
  book("b29", "El Poder del Ahora Emocional", "zWrFRwZ4/Screenshot-20260805-103338-072.png", "1tM7sA24qzkvrL7VtSuMF9RE3-9VQ6vry"),
  book("b30", "Sanar en Comunidad", "Kzbbsz9c/Screenshot-20260805-103404-393.png", "1zA83vhD7ByGTyEK4kYxIiDIPE6eWNcqT"),
  book("b31", "La Ruta hacia tu Propósito", "fY0VM9hm/Screenshot-20260805-103425-322.png", "1ZCUhc-pnKuISWZHNRaJzT74S_e55BLRX"),
  book("b32", "Aceptar lo que No Puedes Cambiar", "jP1JxcG2/Screenshot-20260805-103442-506.png", "1rPNdFAup7idwV6cwJfpEILkGxjC2d44V"),
  book("b33", "El Lenguaje del Cuerpo Herido", "0R0Bj7hG/Screenshot-20260805-103534-623.png", "1p6a9b_vC83qSZb1hZM66tdnAUaXPcvVE"),
  book("b34", "Del Miedo a la Libertad", "NgMQFHc3/Screenshot-20260809-232842-736.png", "18le7M0iJz0nzcbEXOjuClMT7isGDS742"),
  book("b35", "Reconstruir la Confianza en Ti", "TBmgyfp2/Screenshot-20260809-233021-155.png", "1l_ES_lDND1HIhKso75wX8iJt-2Gmzw6D"),
  book("b36", "El Ciclo de la Sanación Emocional", "1fnrtJ9n/Screenshot-20260809-233105-286.png", "1ZLdLKk2Xs0hG4sTGEz-kQVgsKLTOlHPk"),
  book("b37", "Cómo Dejar de Complacer a Todos", "jZr9fjjw/Screenshot-20260809-233127-505.png", "19JCx5F2UXPVV8hKnc86SfznkRXtrRInb"),
  book("b38", "El Peso de las Expectativas", "p9gk3Cb/Screenshot-20260809-233150-085.png", "1QkatAbmERJIjeYDhgd3rLRaWMpIxNCfF"),
  book("b39", "Vivir con el Corazón Abierto", "jPDLyKfv/Screenshot-20260809-233215-376.png", "1w_ZgQEW3yb5bxavFmuXazGJuhFaRQIL8"),
  book("b40", "La Sombra que Habita en Ti", "tTv2BhZc/Screenshot-20260809-233231-046.png", "1HKURftIt4xC4i41SkS4gxjA9bwK_4kdM"),
  book("b41", "Recuperando tu Voz", "nsts56Yq/Screenshot-20260809-233253-426.png", "1UhTejKUWY_i7W1HXm7M1o7zEJKJKCP4c"),
  book("b42", "El Arte de Empezar de Nuevo", "7Jvb7X8Q/Screenshot-20260809-233310-742.png", "1AhW8LARHccNIM-V365Bvj2gzHlCFmkmi"),
  book("b43", "Sanar la Relación con tu Madre", "Kj2nVRBy/Screenshot-20260809-233328-432.png", "1DdSJMf7u2WbIURzVBccUaKqkzf76mqk5"),
  book("b44", "Sanar la Relación con tu Padre", "3nG69ys/Screenshot-20260809-233341-008.png", "1MuZj2D7_DFk6CuZY1BdrbNLgP_T50ZEv"),
  book("b45", "El Apego Ansioso Explicado", "MkbFNhwg/Screenshot-20260809-233358-523.png", "1yb8eJrIfTcOPVQCcwquqwRx8ZU9VMJEx"),
  book("b46", "Vivir sin Miedo al Rechazo", "ZR9JBnRB/Screenshot-20260809-233421-406.png", "1kfc8H2Knxt7DBdq0FZ8Kzq5NbrvaTzFp"),
  book("b47", "La Paz que Viene de Adentro", "j9SqdKTp/Screenshot-20260809-233440-255.png", "13br5ysjq5gEFziNK8L_kpz0mUjFiIYfX"),
  book("b48", "El Poder de Decir No", "JFkj6bXV/Screenshot-20260809-233457-009.png", "1sx1U4XaEN8TFYDg54Wll2LdE5Y3XV3Ty"),
  book("b49", "Reencontrarte a Ti Mismo", "c76tDSh/Screenshot-20260809-233516-222.png", "1sYK3qK8n_FN2RBFXkgwxIdynrED8bjcF"),
  book("b50", "La Ansiedad no te Define", "TMBgBwxZ/Screenshot-20260809-233534-716.png", "1izJ0EXOTxDQSYlUJn9PfK0M1XATTyL_Z"),
  book("b51", "Del Trauma a la Transformación", "YB7qvpxB/Screenshot-20260809-233557-292.png", "1GRJ34VHQmaWqfagi6ya4BjQIy2UfTxEY"),
  book("b52", "El Cuerpo Recuerda lo que la Mente Olvida", "3Ystkfyq/Screenshot-20260809-233613-999.png", "1R8PAY1ScKPMnPfgPPhhU2nNk_nq81pWf"),
  book("b53", "Aprender a Estar Solo", "Y7zxQk0s/Screenshot-20260809-233635-009.png", "1SOXp-pYHo3CyHrCvH0un9wpFVT04-zsg"),
  book("b54", "El Valor de Pedir Ayuda", "LDmqVKwJ/Screenshot-20260809-233655-240.png", "1qGHnFaFdpQW9YCV1i19Wo_j8dGKZB8jm"),
  book("b55", "Cómo Sanar una Ruptura", "xSNv8xz6/Screenshot-20260809-233708-900.png", "1CS34jCxb7WIKhuKKyhD2gM7KSiVMBHOf"),
  book("b56", "El Perdón como Liberación", "ZR8d3hq9/Screenshot-20260809-233727-012.png", "10WcYD_HuxnQAETHx8HYU8F1KWvtl2OYY"),
  book("b57", "Vivir el Presente sin Culpas", "Vs6FxtV/Screenshot-20260809-233755-439.png", "1fwaGmgPJJisKORegGEATSielPjgY9wZ6"),
  book("b58", "La Resiliencia como Estilo de Vida", "RkzZMVDN/Screenshot-20260809-233812-173.png", "1Yge2Q6ZI_bBhFoZA_rnt48I8nFsj85li"),
  book("b59", "El Amor que Sana", "qMX0dLfD/Screenshot-20260809-233828-877.png", "15-C6gPK_DbaGjiIqqoVmGFmJvEw6FQZN"),
  book("b60", "Reconociendo tus Patrones Tóxicos", "tMxrvWFM/Screenshot-20260809-233850-884.png", "1qwgXrKhnoSZ_DROEMqU5A1QpCIoEzp2T"),
  book("b61", "El Camino del Autoconocimiento", "KxWDcCYD/Screenshot-20260810-003140-380.png", "1LzAbogZmHNtYPyWSkJMHDAe-vT4ckmgO"),
  book("b62", "Sanar desde la Raíz", "Zp1R7PKm/Screenshot-20260810-003200-253.png", "16XlunO_mIcnvQw7oKc3obJ3_viXiJFAY"),
  book("b63", "La Fortaleza Emocional", "hJGqtW5q/Screenshot-20260810-003256-813.png", "1xnKUbdtuCOxteSvg9PhjmT0wA7Xwt2Ie"),
  book("b64", "Vivir en Paz con tu Pasado", "HDLXsCGW/Screenshot-20260810-003315-265.png", "12x_SMPTGo9_Kf8Au-Ju4eDhgD_yGuWQv"),
  book("b65", "El Poder de la Gratitud", "G41yCqGd/Screenshot-20260810-003406-919.png", "1i9Pb-fX9qlAqsEocicpUR0FtcT4dy2Tc"),
  book("b66", "Aceptación Radical", "hF7mkc56/Screenshot-20260810-003442-491.png", "16GH_MaTUww7Uge4ds8aEr4cPBCHTtd63"),
  book("b67", "El Miedo a la Soledad", "Wv5TSsFd/Screenshot-20260810-003502-410.png", "1v4ETSFWZ-vRPcU7u_w-g3WS9SCBmDIUg"),
  book("b68", "Reconstruyendo tu Identidad", "ycZYFWsY/Screenshot-20260810-003535-317.png", "13Kd2_z9T1xeIgxadNS3u3hefasVYhD_E"),
  book("b69", "La Búsqueda de la Felicidad Real", "Z67dKRxr/Screenshot-20260810-003607-017.png", "1XtXfN_wk_7JS3faNxSlq5z0225TIjFBt"),
  book("b70", "El Sentido de Pertenencia", "ZzLrMsVK/Screenshot-20260810-003623-912.png", "10GDoEc6DrLTFogQ_byPUHJspGMxf7zJE"),
  book("b71", "Cómo Sanar el Corazón Roto", "gZkvdc7j/Screenshot-20260810-003640-215.png", "1DmcbtTdIkZV2DQSgAlm_n_OOJSlFjSnR"),
  book("b72", "La Fuerza de Empezar de Cero", "KpVNmXFF/Screenshot-20260810-003706-218.png", "1PWioMAYlfvKtYcHvIgWEDEj8o0MfMm6m"),
  book("b73", "Vivir sin Máscaras", "L4qCgFP/Screenshot-20260810-003737-305.png", "1LiipgQ4aj72D9v1Wq6Dq0Q64VKSuN3Oh"),
  book("b74", "El Poder de la Autenticidad", "WCPv5rq/Screenshot-20260810-003805-130.png", "1JWUWtbZpHrJgAw553JfjPbl72sY9HIXZ"),
  book("b75", "Recuperar la Alegría de Vivir", "Y7F4ccpS/Screenshot-20260810-003840-999.png", "1upVjQlnYlBCkokXcAWVFffLuOdOdDxuf"),
  book(
    "b76",
    "El Eco de las Palabras No Dichas",
    "ccJ4zvbb/Screenshot-20260810-003928-505.png",
    "1pLxchnKiwlRcnX4qBnUvG0B0YdZfguFt",
    "11pL8gAZ1LahFjo4K2obEIRV9M6S7R2t3",
  ),
  book(
    "b77",
    "Volver a Empezar sin Miedo",
    "NgLKwtXw/Screenshot-20260810-003954-676.png",
    "1EA_3IvRfLPGvQJu57o_7yM8SmQLWWdjZ",
    "1EA_3IvRfLPGvQJu57o_7yM8SmQLWWdjZ",
    "1sy__6MoEEcfpY-9mqlUp8McBsi8uP4Ix",
  ),
  book("b78", "El Arte de Cuidarte a Ti Mismo", "rfsLrPWC/61g-Afk1lx-DL-AC-UF1000-1000-QL80.jpg", "1A1hGre__5q8jkfq5fMafvT8OouxyQbeb"),
  book("b79", "Sanar las Relaciones Tóxicas", "27brs83g/Screenshot-20260810-004034-694.png", "1GAHdgNH4nw2KflMxQhXHv-Y0PdvrKNMD"),
  book("b80", "El Despertar Emocional", "W4Vw8P0g/Screenshot-20260810-004112-335.png", "1KluwMeQ0_l0EsF3VmrrJcuFFh9m4iSkH"),
  book("b81", "Vivir en Equilibrio", "N2t35Qvp/Screenshot-20260810-004150-721.png", "1F6_6b35LdcbyLdTogyupKeUsSVCmAmJ_"),
  book("b82", "La Voz Interior que Sana", "3mDfjM1m/715-UQzk-Xp2-L-AC-UF1000-1000-QL80.jpg", "10_dEJOYqBfPvKlrh_1LnsvF5w5vo0PvF"),
];

/** Lunes de la semana en curso, en ISO date (para el cupo semanal) */
export function weekStartIso(d = new Date()) {
  const c = new Date(d);
  const day = (c.getDay() + 6) % 7;
  c.setDate(c.getDate() - day);
  return c.toISOString().slice(0, 10);
}

export const LIBRARY_RULES = {
  freeTotal: 1,
  paidPerWeek: 2,
} as const;
