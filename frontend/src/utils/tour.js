import { driver } from 'driver.js'
import 'driver.js/dist/driver.css'

export function startTour(force = false) {
  if (!force && localStorage.getItem('tour_completado')) return

  const driverObj = driver({
    showProgress: true,
    animate: true,
    overlayColor: 'rgba(2,6,23,0.85)',
    stagePadding: 8,
    popoverClass: 'liga-tour-popover',
    steps: [
      {
        popover: {
          title: '¡Bienvenido a LigaManager Pro!',
          description: 'Te mostramos cómo sacar el máximo partido en 8 pasos rápidos.',
          align: 'center',
        },
      },
      {
        element: '[data-tour="dashboard"]',
        popover: {
          title: 'Dashboard',
          description: 'Aquí tienes un resumen de todo: equipos, jornadas, cobros y estado de licencia.',
          side: 'right',
        },
      },
      {
        element: '[data-tour="ligas"]',
        popover: {
          title: 'Crea tu liga',
          description: 'Crea una liga, configura días, canchas, horarios y cuotas en minutos.',
          side: 'right',
        },
      },
      {
        element: '[data-tour="equipos"]',
        popover: {
          title: 'Agrega equipos',
          description: 'Registra equipos con logo, color y hora fija de juego.',
          side: 'right',
        },
      },
      {
        element: '[data-tour="jornadas"]',
        popover: {
          title: 'Genera jornadas',
          description: 'El algoritmo Round Robin asigna horarios automáticamente respetando horas fijas.',
          side: 'right',
        },
      },
      {
        element: '[data-tour="cobros"]',
        popover: {
          title: 'Controla cobros',
          description: 'Registra pagos de inscripción, cuota fija y arbitrajes por equipo.',
          side: 'right',
        },
      },
      {
        element: '[data-tour="public"]',
        popover: {
          title: 'Página pública',
          description: 'Tu liga tiene una URL pública para que los participantes vean tabla, goleadores y resultados.',
          side: 'right',
        },
      },
      {
        element: '[data-tour="chatbot"]',
        popover: {
          title: 'Asistente IA',
          description: 'Pregúntale sobre tu liga: deudas, resultados, quién puede ganar. 30 mensajes/día.',
          side: 'right',
        },
      },
    ],
    onDestroyed: () => {
      localStorage.setItem('tour_completado', '1')
    },
  })

  driverObj.drive()
}
