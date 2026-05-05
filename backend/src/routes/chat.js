import { Router } from 'express'
import baseRouter from './chat/base.js'
import storyRouter from './chat/story.js'
import missionRouter from './chat/mission.js'
import fightRouter from './chat/fight.js'
import guessRouter from './chat/guess.js'
import swipeRouter from './chat/swipe.js'
import dilemaRouter from './chat/dilema.js'
import esteOEseRouter from './chat/esteoese.js'
import ultimaCenaRouter from './chat/ultima-cena.js'
import customRouter from './chat/custom.js'

const router = Router()

router.use('/', baseRouter)
router.use('/', storyRouter)
router.use('/', missionRouter)
router.use('/', fightRouter)
router.use('/', guessRouter)
router.use('/', swipeRouter)
router.use('/', dilemaRouter)
router.use('/', esteOEseRouter)
router.use('/', ultimaCenaRouter)
router.use('/', customRouter)

// Error handler para rutas de chat: convierte errores del service layer en JSON
router.use((err, req, res, next) => {
  const status = err.statusCode || err.status || 500
  const message = err.message || 'Error interno del servidor'
  const code = err.code || 'INTERNAL_ERROR'

  if (status === 500) {
    console.error('[chat error]', err)
  }

  res.status(status).json({ error: message, code })
})

export default router
