import { Router } from 'express'
import votes        from './votes.js'
import history      from './history.js'
import affinity     from './affinity.js'
import dilema       from './dilema.js'
import missions     from './missions.js'
import achievements from './achievements.js'
import daily        from './daily.js'
import interrogation from './interrogation.js'
import modes        from './modes.js'
import customChars  from './customChars.js'
import guess        from './guess.js'

const router = Router()

router.use(votes)
router.use(history)
router.use(affinity)
router.use(dilema)
router.use(missions)
router.use(achievements)
router.use(daily)
router.use(interrogation)
router.use(modes)
router.use(customChars)
router.use(guess)

export default router
