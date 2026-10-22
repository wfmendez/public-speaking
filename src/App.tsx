import Presenter from './Presenter'
import { slides } from './decks/failure'

export default function App() {
  return <Presenter slides={slides} />
}
