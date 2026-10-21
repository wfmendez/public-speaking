import type { DeckDef } from '../deck'
import { slides as design } from './design'
import { slides as failure } from './failure'

export const decks: DeckDef[] = [
  { path: '/failure', title: 'The Importance of Failure in Success', minutes: 5, slides: failure },
  { path: '/design', title: 'Good Design Makes a Product Useful', minutes: 3, slides: design },
]
