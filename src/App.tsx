import { useEffect } from 'react'
import Home from './Home'
import Presenter from './Presenter'
import { decks } from './decks'

/** "/" lists every talk; "/failure", "/design", "/leaders" open one. */
export default function App() {
  const path = location.pathname.replace(/\/+$/, '') || '/'
  const deck = decks.find((d) => d.path === path)

  useEffect(() => {
    document.title = deck ? deck.title : 'Talks'
    if (deck?.accent) document.documentElement.style.setProperty('--accent', deck.accent)
  }, [deck])

  return deck ? <Presenter key={deck.path} slides={deck.slides} /> : <Home />
}
