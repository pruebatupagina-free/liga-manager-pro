const PLANES = {
  basico: {
    max_ligas: 1,
    max_equipos: 10,
    max_jugadores: 15,
    max_galeria: 5,
    puede_clonar: false,
    puede_marketplace: false,
    puede_chatbot: false,
  },
  pro: {
    max_ligas: 5,
    max_equipos: Infinity,
    max_jugadores: Infinity,
    max_galeria: 20,
    puede_clonar: true,
    puede_marketplace: true,
    puede_chatbot: true,
  },
  elite: {
    max_ligas: Infinity,
    max_equipos: Infinity,
    max_jugadores: Infinity,
    max_galeria: 20,
    puede_clonar: true,
    puede_marketplace: true,
    puede_chatbot: true,
  },
}

module.exports = PLANES
