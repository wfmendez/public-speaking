import '@fontsource/inter-tight/500.css'
import '@fontsource/inter-tight/700.css'
import './print.css'
import { useEffect, type ReactNode } from 'react'
import { Face, FEELINGS } from './faces'
import { FORMS, MATCH_FACES, MATCH_WORDS, PAIRS, PICK, STRONGER } from './tasks'

/**
 * The printed material of the emotions lesson, on A4: /emotions/print shows all of it (Ctrl+P prints it).
 * `?part=worksheet`, `cards` or `key` shows one part; tools/make-print.py turns each one into a PDF.
 */

const DRAW = ['today', 'before an exam', 'on your birthday']

const PLAN: [string, string][] = [
  ['3 min', 'Opening: the first two slides.'],
  ['12 min', 'Emotions: the four slides of faces, then tasks 1 and 3.'],
  ['5 min', '-ed or -ing: the slide, then task 2.'],
  ['10 min', 'Comparatives: the rules and the "who is more…?" slides, then tasks 4 to 6.'],
  ['10 min', 'Card games in groups.'],
  ['5 min', 'Your turn: task 7, and each student says one sentence aloud.'],
]

const Foot = ({ part, n }: { part: string; n: string }) => (
  <div className="pr-foot"><span>Emotions &amp; emojis · {part}</span><span>{n}</span></div>
)

const Task = ({ n, title, hint }: { n: number; title: string; hint?: string }) => (
  <div className="pr-task"><b>{n}</b><h2>{title}</h2>{hint && <p>{hint}</p>}</div>
)

function WorksheetFront() {
  return (
    <section className="pr-page pr-fill">
      <div className="pr-top">
        <div><h1>How do you feel?</h1><p>Emotions &amp; emojis</p></div>
        <div className="pr-who"><div>Name <span style={{ width: '42mm' }} /></div><div>Date <span style={{ width: '22mm' }} /></div></div>
      </div>

      <div className="pr-note">
        <h2>Did you know?</h2>
        <p><big>Emoji</big> is a Japanese word: 絵 <b>e</b> = picture &nbsp;+&nbsp; 文字 <b>moji</b> = character</p>
      </div>

      <div>
        <Task n={1} title="Match the emojis" hint="Write the letter of the adjective in the box." />
        <div className="pr-faces">
          {MATCH_FACES.map((f, i) => (
            <div key={f} className="pr-face"><i>{i + 1}</i><Face name={f} size="25mm" /><span className="pr-box" /></div>
          ))}
        </div>
        <div className="pr-words">
          {MATCH_WORDS.map((w, i) => <span key={w}><b>{'ABCDEFGH'[i]}</b>{w}</span>)}
        </div>
      </div>

      <div>
        <Task n={2} title="-ed or -ing?" hint="Circle the correct word." />
        <div className="pr-note" style={{ marginBottom: '2.5mm' }}>
          <p><b>-ed</b> = how you feel: <i>I am bored.</i> &nbsp;&nbsp; <b>-ing</b> = what makes you feel that way: <i>This class is boring.</i></p>
        </div>
        <ol className="pr-pick" style={{ listStylePosition: 'inside' }}>
          {PICK.map(([before, a, b, after]) => (
            <li key={a}>{before} <em>{a}</em> / <em>{b}</em>{after}</li>
          ))}
        </ol>
      </div>

      <div>
        <Task n={3} title="Draw your emoji" hint="How do you feel? Draw a face and finish the sentence." />
        <div className="pr-draw">
          {DRAW.map((w) => (
            <div key={w}><p>{w}</p><i /><p>I feel <span className="pr-blank" />.</p></div>
          ))}
        </div>
      </div>

      <Foot part="worksheet" n="1 / 2" />
    </section>
  )
}

function WorksheetBack() {
  return (
    <section className="pr-page pr-fill">
      <div>
        <Task n={4} title="Comparatives" hint="Use them to compare two people or things." />
        <div className="pr-rules">
          <div className="pr-note"><b>Short: add -er</b><br />calm → calm<b>er</b><br />sad → sad<b>der</b><br />happy → happ<b>ier</b></div>
          <div className="pr-note"><b>Long or -ed: use more</b><br /><b>more</b> excited<br /><b>more</b> worried<br /><b>more</b> annoyed</div>
          <div className="pr-note"><b>Irregular</b><br />good → <b>better</b><br />bad → <b>worse</b><br /><i>Ana is happier <b>than</b> Ben.</i></div>
        </div>
        <p className="pr-then">Now write the comparative of each adjective.</p>
        <div className="pr-forms">
          {FORMS.map(([w]) => <span key={w}>{w}<i className="pr-line" /></span>)}
        </div>
      </div>

      <div>
        <Task n={5} title="Compare the emojis" hint="Write a sentence with the word in brackets." />
        <div className="pr-pairs">
          {PAIRS.map(({ left, right, word }) => (
            <div key={word} className="pr-pair">
              <figure><Face name={left[1]} size="15mm" />{left[0]}</figure>
              <figure><Face name={right[1]} size="15mm" />{right[0]}</figure>
              <p>({word})</p>
              <span className="pr-line" />
            </div>
          ))}
        </div>
      </div>

      <div>
        <Task n={6} title="Which is stronger?" hint="Put the words in order, from weak to strong." />
        <div className="pr-steps">
          {STRONGER.map(({ mixed }) => (
            <div key={mixed} className="pr-step"><p>{mixed}</p><span />→<span />→<span /></div>
          ))}
        </div>
      </div>

      <div>
        <Task n={7} title="Your turn" hint="Finish the sentences, then tell a partner." />
        <p style={{ lineHeight: 2.1 }}>
          The last time I felt <span className="pr-blank" /> was when <span className="pr-blank" style={{ minWidth: '84mm' }} />.<br />
          Today I feel <span className="pr-blank" /> than yesterday because <span className="pr-blank" style={{ minWidth: '74mm' }} />.
        </p>
      </div>

      <Foot part="worksheet" n="2 / 2" />
    </section>
  )
}

const Cards = ({ page, children }: { page: string; children: ReactNode }) => (
  <section className="pr-page" style={{ padding: '8mm 13mm 13mm', gap: '2mm' }}>
    <p className="pr-cut">✂ Cut along the dashed lines. Print on one side only, on thick paper if you can.</p>
    <div className="pr-cards">{children}</div>
    <Foot part="cards" n={page} />
  </section>
)

function FaceCards() {
  return <Cards page="1 / 2">{FEELINGS.map((f) => <div key={f} className="pr-card"><Face name={f} size="35mm" /></div>)}</Cards>
}

function WordCards() {
  return <Cards page="2 / 2">{FEELINGS.map((f) => <div key={f} className="pr-card"><p>{f}</p></div>)}</Cards>
}

function TeacherKey() {
  return (
    <section className="pr-page">
      <div className="pr-top">
        <div><h1>Teacher's page</h1><p>Answers, card games and lesson plan · do not hand out</p></div>
      </div>
      <div className="pr-keys">
        <div>
          <h2>1 · Match the emojis</h2>
          <p>1 H worried · 2 C delighted · 3 A annoyed · 4 G terrified · 5 B bored · 6 D disappointed · 7 E excited · 8 F surprised</p>
        </div>
        <div>
          <h2>2 · -ed or -ing?</h2>
          <p>1 boring · 2 excited · 3 surprising · 4 disappointed · 5 annoying · 6 terrified</p>
        </div>
        <div>
          <h2>4 · Comparatives</h2>
          <p>sadder · happier · calmer · angrier · more excited · more worried · better · worse</p>
        </div>
        <div>
          <h2>6 · Which is stronger?</h2>
          <p>annoyed → angry → furious<br />pleased → happy → delighted<br />worried → scared → terrified</p>
        </div>
        <div className="pr-wide">
          <h2>5 · Compare the emojis (model answers)</h2>
          <ul className="pr-cols">
            <li>Ben is happier than Ana.</li>
            <li>Sara is angrier than Tom.</li>
            <li>Mia is more worried than Leo.</li>
            <li>Kai is sadder than Zoe.</li>
            <li>Eva is more excited than Max.</li>
            <li>Noa is calmer than Ivan.</li>
          </ul>
        </div>
        <div className="pr-wide">
          <h2>Card games (one set for every 3 or 4 students)</h2>
          <ul>
            <li><b>Memory:</b> all the cards face down. Turn over two: a face and its word make a pair. Say a sentence with the word to keep them.</li>
            <li><b>Act it out:</b> take a face card and act it. The first student to say "You look ..." takes the card.</li>
            <li><b>Compare:</b> take two face cards and say a sentence: "This one is more scared than that one." The group decides if it is correct.</li>
            <li><b>Stories:</b> take three word cards and tell a short story that uses all three.</li>
          </ul>
        </div>
        <div className="pr-wide">
          <h2>Suggested lesson (45 minutes)</h2>
          <table className="pr-plan">
            <tbody>
              {PLAN.map(([time, what]) => <tr key={what}><th>{time}</th><td>{what}</td></tr>)}
            </tbody>
          </table>
        </div>
        <div className="pr-wide">
          <h2>Printing</h2>
          <ul>
            <li><b>Worksheet:</b> one copy per student, on both sides of the page.</li>
            <li><b>Cards:</b> one set per group, one side only. Cut them before class or let the students do it.</li>
            <li><b>Colour is optional:</b> the faces also read well in black and white.</li>
          </ul>
        </div>
      </div>
      <Foot part="teacher" n="1 / 1" />
    </section>
  )
}

const PARTS = {
  worksheet: { title: 'Emotions and emojis: worksheet', pages: [WorksheetFront, WorksheetBack] },
  cards: { title: 'Emotions and emojis: cards', pages: [FaceCards, WordCards] },
  key: { title: "Emotions and emojis: teacher's page", pages: [TeacherKey] },
}

export default function EmotionsPrint() {
  const part = new URLSearchParams(location.search).get('part') as keyof typeof PARTS | null
  const chosen = part && PARTS[part]
  useEffect(() => { document.title = chosen ? chosen.title : 'Emotions and emojis: printables' }, [chosen])
  const pages = chosen ? chosen.pages : Object.values(PARTS).flatMap((p) => p.pages)
  return <main className="pr">{pages.map((Page, i) => <Page key={i} />)}</main>
}
