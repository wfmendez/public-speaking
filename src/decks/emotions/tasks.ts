import type { Feeling } from './faces'

// The exercises of the lesson with their answers, shared by the printed worksheet and the phone activity.

export const MATCH_FACES: Feeling[] = ['worried', 'delighted', 'annoyed', 'terrified', 'bored', 'disappointed', 'excited', 'surprised']
export const MATCH_WORDS = ['annoyed', 'bored', 'delighted', 'disappointed', 'excited', 'surprised', 'terrified', 'worried']

/** Sentence before the word, the two options, the rest of the sentence, and the right option. */
export const PICK: [string, string, string, string, string][] = [
  ['This film is so', 'bored', 'boring', '. I want to leave.', 'boring'],
  ["I'm really", 'excited', 'exciting', ' about the trip!', 'excited'],
  ['The news was very', 'surprised', 'surprising', '.', 'surprising'],
  ['We were', 'disappointed', 'disappointing', ' with our result.', 'disappointed'],
  ["My brother's loud music is", 'annoyed', 'annoying', '.', 'annoying'],
  ['I was', 'terrified', 'terrifying', ' on the roller coaster.', 'terrified'],
]

/** Each adjective with its comparative and two common mistakes. */
export const FORMS: [string, string, string, string][] = [
  ['sad', 'sadder', 'sader', 'saddier'],
  ['happy', 'happier', 'happyer', 'more happy'],
  ['calm', 'calmer', 'calmmer', 'calmier'],
  ['angry', 'angrier', 'angryer', 'angrer'],
  ['excited', 'more excited', 'exciteder', 'excitier'],
  ['worried', 'more worried', 'worrieder', 'worrier'],
  ['good', 'better', 'gooder', 'more good'],
  ['bad', 'worse', 'badder', 'worst'],
]

export const PAIRS: { left: [string, Feeling]; right: [string, Feeling]; word: string; answer: string; wrong: [string, string] }[] = [
  { left: ['Ana', 'happy'], right: ['Ben', 'delighted'], word: 'happy', answer: 'Ben is happier than Ana.', wrong: ['Ana is happier than Ben.', 'Ben is more happy than Ana.'] },
  { left: ['Sara', 'angry'], right: ['Tom', 'annoyed'], word: 'angry', answer: 'Sara is angrier than Tom.', wrong: ['Tom is angrier than Sara.', 'Sara is more angrier than Tom.'] },
  { left: ['Mia', 'worried'], right: ['Leo', 'happy'], word: 'worried', answer: 'Mia is more worried than Leo.', wrong: ['Leo is more worried than Mia.', 'Mia is worrieder than Leo.'] },
  { left: ['Kai', 'sad'], right: ['Zoe', 'happy'], word: 'sad', answer: 'Kai is sadder than Zoe.', wrong: ['Zoe is sadder than Kai.', 'Kai is sader than Zoe.'] },
  { left: ['Eva', 'excited'], right: ['Max', 'bored'], word: 'excited', answer: 'Eva is more excited than Max.', wrong: ['Max is more excited than Eva.', 'Eva is exciteder than Max.'] },
  { left: ['Noa', 'relaxed'], right: ['Ivan', 'terrified'], word: 'calm', answer: 'Noa is calmer than Ivan.', wrong: ['Ivan is calmer than Noa.', 'Noa is calmmer than Ivan.'] },
]

/** From weak to strong; `mixed` is how the worksheet shows them. */
export const STRONGER: { order: [string, string, string]; mixed: string }[] = [
  { order: ['annoyed', 'angry', 'furious'], mixed: 'furious · annoyed · angry' },
  { order: ['pleased', 'happy', 'delighted'], mixed: 'delighted · pleased · happy' },
  { order: ['worried', 'scared', 'terrified'], mixed: 'terrified · worried · scared' },
]
