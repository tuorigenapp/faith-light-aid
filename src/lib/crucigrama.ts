/** Crucigrama Bíblico: 8 niveles de 5 palabras con pista (sin IA, sin créditos). */
export type Clue = { word: string; clue: string };

export const CRUCI_LEVELS: Clue[][] = [
  [{ word: "NOE", clue: "Construyó el arca" }, { word: "EDEN", clue: "Primer jardín" }, { word: "ADAN", clue: "Primer hombre" }, { word: "EVA", clue: "Madre de todos los vivientes" }, { word: "ARCA", clue: "Salvó a la familia de Noé" }],
  [{ word: "MOISES", clue: "Recibió las tablas de la ley" }, { word: "EGIPTO", clue: "Tierra de la esclavitud" }, { word: "MANA", clue: "Pan del cielo en el desierto" }, { word: "SINAI", clue: "Monte de los mandamientos" }, { word: "AARON", clue: "Hermano de Moisés" }],
  [{ word: "DAVID", clue: "Venció a Goliat" }, { word: "SAUL", clue: "Primer rey de Israel" }, { word: "SALMOS", clue: "Libro de cánticos" }, { word: "ARPA", clue: "Instrumento de David" }, { word: "PASTOR", clue: "El Señor es mi ___" }],
  [{ word: "JONAS", clue: "Estuvo en el vientre de un gran pez" }, { word: "NINIVE", clue: "Ciudad que se arrepintió" }, { word: "DANIEL", clue: "Fiel en el foso de los leones" }, { word: "ESTER", clue: "Reina valiente" }, { word: "RUT", clue: "A donde tú vayas, iré yo" }],
  [{ word: "BELEN", clue: "Ciudad donde nació Jesús" }, { word: "MARIA", clue: "Madre de Jesús" }, { word: "JOSE", clue: "Carpintero de Nazaret" }, { word: "PESEBRE", clue: "Primera cuna de Jesús" }, { word: "ESTRELLA", clue: "Guió a los magos" }],
  [{ word: "PEDRO", clue: "Caminó sobre el agua" }, { word: "JUAN", clue: "Discípulo amado" }, { word: "PABLO", clue: "Escribió muchas cartas" }, { word: "SAULO", clue: "Nombre anterior de Pablo" }, { word: "DAMASCO", clue: "Camino de la conversión de Pablo" }],
  [{ word: "FE", clue: "Certeza de lo que se espera" }, { word: "GRACIA", clue: "Favor inmerecido de Dios" }, { word: "PERDON", clue: "Setenta veces siete" }, { word: "AMOR", clue: "Es paciente, es bondadoso" }, { word: "PAZ", clue: "Mi ___ os dejo" }],
  [{ word: "CRUZ", clue: "Donde Jesús dio su vida" }, { word: "TUMBA", clue: "La encontraron vacía" }, { word: "PASCUA", clue: "Fiesta de la resurrección" }, { word: "CORDERO", clue: "Quita el pecado del mundo" }, { word: "VIDA", clue: "Yo soy el camino, la verdad y la ___" }],
];

export const normalize = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
