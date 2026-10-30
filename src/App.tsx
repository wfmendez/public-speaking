import { useEffect } from 'react'
import Home from './Home'
import Presenter from './Presenter'
import { decks } from './decks'
import EmotionsActivity from './decks/emotions/Activity'
import EmotionsPrint from './decks/emotions/Print'

/** "/" lists every talk; "/failure", "/design", "/leaders" open one; "/emotions/print" and "/feel" are the printed material and the phone activity of that lesson. */
export default function App() {
  const path = location.pathname.replace(/\/+$/, '') || '/'
  const deck = decks.find((d) => d.path === path)

  useEffect(() => {
    document.title = deck ? deck.title : 'Talks'
    if (deck?.accent) document.documentElement.style.setProperty('--accent', deck.accent)
  }, [deck])

  if (path === '/emotions/print') return <EmotionsPrint />
  if (path === '/feel') return <EmotionsActivity />
  return deck ? <Presenter key={deck.path} slides={deck.slides} theme={deck.theme} Backdrop={deck.Backdrop} /> : <Home />
}
