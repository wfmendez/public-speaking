import { useEffect } from 'react'
import Home from './Home'
import Presenter from './Presenter'
import { decks } from './decks'

/** "/" shows the talk picker; "/failure", "/design" open a deck. */
export default function App() {
  const path = location.pathname.replace(/\/+$/, '') || '/'
  const deck = decks.find((d) => d.path === path)

  useEffect(() => {
    document.title = deck ? deck.title : 'Talks'
  }, [deck])

  return deck ? <Presenter key={deck.path} slides={deck.slides} /> : <Home />
}
