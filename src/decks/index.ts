import type { DeckDef } from '../deck'
import { AgentsBackdrop, slides as agents } from './agents'
import { slides as design } from './design'
import { EmotionsBackdrop, slides as emotions } from './emotions'
import { slides as failure } from './failure'
import { slides as leaders } from './leaders'

// Every talk made so far; the home page lists them in this order.
export const decks: DeckDef[] = [
  { path: '/failure', title: 'The Importance of Failure in Success', minutes: 5, slides: failure },
  { path: '/design', title: 'Good Design Makes a Product Useful', minutes: 3, slides: design },
  { path: '/leaders', title: 'Homeless to Leaders', minutes: 2, accent: '#c8102e', slides: leaders },
  { path: '/agents', title: 'Everyday AI Agents', minutes: 20, accent: '#2236c8', slides: agents, theme: 'kinetic', Backdrop: AgentsBackdrop },
  { path: '/emotions', title: 'How Do You Feel? Emotions & Emojis', minutes: 20, accent: '#0e7f86', slides: emotions, theme: 'feelings', Backdrop: EmotionsBackdrop },
]
