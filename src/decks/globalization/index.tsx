import './globalization.css'
import { useContext, type ReactNode } from 'react'
import { StepContext } from '../../components/Draw'
import type { SlideDef } from '../../deck'
import { Flag, type Country } from './Flag'

/*
 * "Globalisation is a Myth": a 3-minute persuasive talk told as the campus group chat.
 * Every click drops one new message in; once it lands, nothing moves (attention stays on the speaker).
 * Speaker notes are written above each slide.
 */

const useS = () => useContext(StepContext)

type Person = { name: string; c: Country; color: string }
const P = {
  mia: { name: 'Mia', c: 'us', color: '#53bdeb' },
  lara: { name: 'Lara', c: 'ar', color: '#f5a623' },
  joao: { name: 'João', c: 'br', color: '#2bd17e' },
  cami: { name: 'Camila', c: 'pe', color: '#ff7b9c' },
  jonas: { name: 'Jonas', c: 'de', color: '#c39bff' },
  admin: { name: 'Campus Admin', c: 'cz', color: '#ffd166' },
} satisfies Record<string, Person>

/** The chat window: header, wallpaper and a column of messages pinned to the bottom. */
function Chat({ children, center }: { children: ReactNode; center?: boolean }) {
  return (
    <foreignObject x={0} y={0} width={1600} height={900}>
      <div className="gc">
        <header className="gc-top">
          <div className="gc-av">🌍</div>
          <div>
            <div className="gc-name">International Campus <Flag c="cz" size={34} /></div>
            <div className="gc-sub">Lara, João, Mia, Camila, Jonas, You + 44</div>
          </div>
        </header>
        <div className={`gc-body${center ? ' center' : ''}`}>{children}</div>
      </div>
    </foreignObject>
  )
}

/** One message; it appears at click `at` and leaves at click `until`. */
function Msg({ from, at = 0, until, big, react, children }: {
  from?: Person; at?: number; until?: number; big?: boolean; react?: string; children: ReactNode
}) {
  const s = useS()
  const shown = s >= at && (until === undefined || s < until)
  if (until !== undefined && s >= until) return null
  return (
    <div className={`msg${from ? '' : ' me'}${big ? ' big' : ''}${shown ? ' in' : ''}`}>
      {from && <div className="who" style={{ color: from.color }}>{from.name} <Flag c={from.c} size={26} /></div>}
      <div className="txt">{children}</div>
      {react && <div className="react">{react}</div>}
    </div>
  )
}

/** A centred chip: a time, or something the group did. */
function Chip({ at = 0, until, hot, children }: { at?: number; until?: number; hot?: boolean; children: ReactNode }) {
  const s = useS()
  if (until !== undefined && s >= until) return null
  return <div className={`chip${hot ? ' hot' : ''}${s >= at ? ' in' : ''}`}>{children}</div>
}

/** A shared song, like a music link in the chat. */
function Song({ from, at, title, by, react }: { from?: Person; at: number; title: string; by: string; react: string }) {
  return (
    <Msg from={from} at={at} react={react}>
      <div className="song"><span className="disc">♪</span><span><b>{title}</b><br /><em>{by}</em></span></div>
    </Msg>
  )
}

export const slides: SlideDef[] = [
  // 0 · Title, on screen while you walk up
  {
    steps: 0,
    Slide: () => (
      <Chat center>
        <Chip>📌 Pinned message</Chip>
        <Msg big>Globalisation<br />is a <span className="red">myth.</span></Msg>
      </Chat>
    ),
  },

  // 1 · Set-up (≈30 s)
  // "Fifty of us, twenty-three countries, one building in the Czech Republic. We study together, eat together,
  //  even fight for the same washing machine together. So we are global now… aren't we? Today I'll tell you
  //  why I don't think so."
  {
    steps: 2,
    Slide: () => (
      <Chat center>
        <Chip>You were added to <b>International Campus</b></Chip>
        <Msg from={P.admin} at={1}>Welcome! 🏠 <b>1 building · 23 countries · 50 people</b></Msg>
        <Msg from={P.mia} at={2}>So we're all global citizens now, right? 🌍</Msg>
      </Chat>
    ),
  },

  // 2 · Proposition (≈30 s)
  // "My answer is no. Globalisation, the idea that living together turns us into one global culture, is a myth.
  //  Our passports cross borders, sure. But our habits, our food, our music, our hearts… they stay at home."
  {
    steps: 1,
    Slide: () => (
      <Chat center>
        <Msg big>No. Globalisation is a <span className="red">myth.</span></Msg>
        <Msg at={1} react="😮 12  🤔 9">Our passports cross borders.<br />Our habits stay home. 🏠</Msg>
      </Chat>
    ),
  },

  // 3 · Objections (≈30 s)
  // "I know what you're thinking. We have classes together in English, we have lunch together, we travel to
  //  Vienna together. On paper we look very global. Isn't that proof? Well… from nine to seven, maybe."
  {
    steps: 2,
    Slide: () => (
      <Chat>
        <Chip>9:00 AM</Chip>
        <Msg from={P.jonas}>Class in room 204, don't be late 📚</Msg>
        <Msg from={P.mia} at={1}>Lunch together after? 🍝</Msg>
        <Msg from={P.cami} at={1}>Weekend trip to Vienna?? 🚆</Msg>
        <Msg at={2} react="👍 18">OK… isn't this proof we're global? 🤔</Msg>
      </Chat>
    ),
  },

  // 4 · Evidence 1: the 7:01 PM clock (≈30 s)
  // "But watch what happens at 7:01 PM. Class is over, and suddenly English disappears. Spanish over here,
  //  Portuguese over there. And poor Mia is left asking: guys… English?"
  {
    steps: 2,
    Slide: () => (
      <Chat>
        <Chip>7:00 PM</Chip>
        <Msg from={P.jonas}>Great class today, everyone!</Msg>
        <Chip at={1} hot>7:01 PM</Chip>
        <Msg from={P.lara} at={1}>¿Alguien quiere tomar mate? 🧉</Msg>
        <Msg from={P.joao} at={1}>Bora, galera! Quem vem? 🙌</Msg>
        <Msg from={P.mia} at={2} react="😂 41">guys… english? 😅</Msg>
      </Chat>
    ),
  },

  // 5 · Evidence 2: our stomachs have a flag (≈30 s)
  // "Second: our stomachs. Lara never goes anywhere without her mate. João's pão de queijo, rice and beans.
  //  Camila's ceviche. And me? I'd cross the whole city for an arepa. We share a kitchen, not a cuisine."
  {
    steps: 2,
    Slide: () => (
      <Chat>
        <Chip>Shared kitchen 🍳</Chip>
        <Msg from={P.lara}>Mate at mine 🧉</Msg>
        <Msg from={P.joao} at={1}>Pão de queijo + arroz e feijão 🧀</Msg>
        <Msg from={P.cami} at={1}>Ceviche tonight 🍋🐟</Msg>
        <Msg at={2} react="❤️ 50">I'm making arepas 🫓 Who's in?</Msg>
      </Chat>
    ),
  },

  // 6 · Evidence 3: the party test (≈30 s)
  // "And the final test: the party. International pop plays… polite dancing. Then Brazilian funk: the Brazilians
  //  explode. Salsa, reggaeton: the Latinos take over the floor. Our energy comes from home."
  {
    steps: 2,
    Slide: () => (
      <Chat>
        <Chip>Party, Saturday 10 PM 🎉</Chip>
        <Song from={P.jonas} at={0} title="Global Pop Hit" by="Played in every airport" react="👍 3" />
        <Song from={P.joao} at={1} title="Funk Brasileiro" by="Volume: maximum" react="🔥 22  💃 19" />
        <Song at={2} title="Salsa → Reggaeton" by="Latin America takes the floor" react="🔥 47  💃 38  🙌 30" />
      </Chat>
    ),
  },

  // 7 · Wrap-up (≈30 s)
  // "So, is globalisation real? I don't think it is. And honestly, that's the best part. We don't become one
  //  culture; we bring fifty of them. We always carry our home country in our backpack. The choice is ours:
  //  open it and share it. That's what makes this place special, isn't it?"
  {
    steps: 2,
    Slide: () => (
      <Chat center>
        <Msg big>We always carry home in our backpack 🎒</Msg>
        <Msg at={1}>Let's open it and share it.</Msg>
        <Msg from={P.mia} at={2} react="❤️ 50">That's what makes this place special, isn't it? 🌍</Msg>
      </Chat>
    ),
  },
]
