// Reading practice content written for ReSpeako, following PTE Academic formats.
// In passage text, {n} marks blank number n.

// Reading & Writing: Fill in the Blanks (choose from a dropdown per blank).
export const rwFillBlanksBank = [
  {
    id: 'rwfib-001',
    title: 'Coral reefs',
    text: 'Coral reefs cover less than one percent of the ocean floor, {0} they support about a quarter of all marine species. Reefs also {1} coastlines from storms by absorbing the energy of waves. However, rising sea temperatures cause corals to expel the algae that live inside them, a process {2} as bleaching. If temperatures remain high for too long, the corals may die, and the {3} ecosystem can collapse.',
    blanks: [
      { options: ['because', 'yet', 'so', 'unless'], answer: 'yet' },
      { options: ['protect', 'prevent', 'avoid', 'resist'], answer: 'protect' },
      { options: ['called', 'known', 'named', 'referred'], answer: 'known' },
      { options: ['entire', 'total', 'full of', 'whole of'], answer: 'entire' },
    ],
  },
  {
    id: 'rwfib-002',
    title: 'Online learning',
    text: 'The growth of online learning has made higher education more {0} to people who work full time or live far from a university. Nevertheless, research suggests that students who study entirely online are more likely to {1} out than those on campus. One explanation is that online learners often feel {2} from their peers and teachers. Courses that include regular live discussions tend to {3} this problem and achieve higher completion rates.',
    blanks: [
      { options: ['accessible', 'possible', 'approachable', 'reachable'], answer: 'accessible' },
      { options: ['drop', 'fall', 'give', 'leave'], answer: 'drop' },
      { options: ['isolated', 'lonely', 'solitary', 'alone'], answer: 'isolated' },
      { options: ['reduce', 'decline', 'lower down', 'diminish of'], answer: 'reduce' },
    ],
  },
  {
    id: 'rwfib-003',
    title: 'Urban transport',
    text: 'Many cities are investing in public transport in an {0} to reduce traffic congestion and air pollution. Studies show that a well-designed bus or rail network can {1} the number of private cars on the road. {2}, transport planners warn that new lines alone are not enough. Fares must be affordable, and services must run frequently, or commuters will continue to {3} on their cars.',
    blanks: [
      { options: ['effort', 'attempt to', 'intention', 'trial'], answer: 'effort' },
      { options: ['decrease', 'fall', 'drop off', 'lessen to'], answer: 'decrease' },
      { options: ['However', 'Therefore', 'Moreover', 'Similarly'], answer: 'However' },
      { options: ['rely', 'trust', 'base', 'need'], answer: 'rely' },
    ],
  },
];

// Reading: Fill in the Blanks (drag words from a shared word bank).
export const fillBlanksBank = [
  {
    id: 'rfib-001',
    title: 'The scientific method',
    text: 'The scientific method begins with an observation that leads to a question. Scientists then form a {0}, which is a possible explanation that can be tested. Experiments are carefully {1} so that only one factor changes at a time. If the results {2} the prediction, the explanation gains support, but it is never considered absolutely proven.',
    answers: ['hypothesis', 'designed', 'match'],
    distractors: ['result', 'invented', 'equal'],
  },
  {
    id: 'rfib-002',
    title: 'Migration of birds',
    text: 'Every year, billions of birds {0} thousands of kilometres between their breeding and wintering grounds. Researchers believe that birds use several cues to {1} their way, including the position of the sun, the stars and the Earth\'s magnetic field. Young birds often complete their first journey without adult guidance, which suggests that the route is at least partly {2}.',
    answers: ['travel', 'find', 'inherited'],
    distractors: ['visit', 'search', 'learned'],
  },
  {
    id: 'rfib-003',
    title: 'Working memory',
    text: 'Working memory is the system that allows us to hold information in mind for a short period while we use it. Its {0} is limited: most adults can keep only four or five items active at once. This is why teachers are advised to {1} complex tasks into smaller steps, which places less {2} on students\' working memory.',
    answers: ['capacity', 'break', 'demand'],
    distractors: ['volume', 'reduce', 'weight'],
  },
];

// Reorder Paragraphs: paragraphs listed in the CORRECT order; the app shuffles them.
export const reorderBank = [
  {
    id: 'rop-001',
    title: 'The invention of paper',
    paragraphs: [
      'Paper was invented in China around two thousand years ago.',
      'Early paper was made from tree bark, old rags and fishing nets, which were soaked and pressed into thin sheets.',
      'Over the following centuries, the technique spread along trade routes to the Middle East and eventually to Europe.',
      'By the fifteenth century, cheap paper made it possible for the printing press to transform the spread of knowledge.',
    ],
  },
  {
    id: 'rop-002',
    title: 'A university research project',
    paragraphs: [
      'The first stage of any research project is to define a clear research question.',
      'Once the question is set, the researcher reviews existing studies to see what is already known.',
      'This review helps the researcher choose an appropriate method for collecting new data.',
      'Finally, the data are analysed and the findings are compared with those of earlier studies.',
    ],
  },
  {
    id: 'rop-003',
    title: 'Water scarcity',
    paragraphs: [
      'Around two billion people live in countries where fresh water is scarce.',
      'This problem is expected to grow as populations increase and the climate becomes less predictable.',
      'Agriculture is a major part of the challenge, since it uses roughly seventy percent of all fresh water.',
      'For this reason, many experts argue that more efficient irrigation is the most important solution.',
    ],
  },
];

// Multiple choice: `multiple` = choose several answers (negative marking).
export const multipleChoiceBank = [
  {
    id: 'mc-001',
    multiple: true,
    title: 'Remote work',
    passage: 'Since 2020, many companies have allowed employees to work from home for part of the week. Surveys show that most workers value the time saved on commuting and the greater control over their schedule. Managers, however, report concerns about weaker team relationships and the difficulty of training new staff remotely. Some firms have responded by asking teams to come to the office on the same days, so that face-to-face collaboration is not lost.',
    question: 'According to the passage, which of the following are concerns about remote work? Choose more than one.',
    options: [
      { id: 'A', text: 'Training new employees is harder.' },
      { id: 'B', text: 'Commuting takes more time.' },
      { id: 'C', text: 'Relationships within teams may weaken.' },
      { id: 'D', text: 'Workers have less control over their schedule.' },
      { id: 'E', text: 'Office rents have increased.' },
    ],
    answers: ['A', 'C'],
  },
  {
    id: 'mc-002',
    multiple: false,
    title: 'Plain language',
    passage: 'Government agencies in several countries now require official documents to be written in plain language. Supporters argue that clear writing saves money, because citizens make fewer mistakes when filling in forms and need less help from staff. Critics worry that simplifying legal texts could make them less precise. Early evaluations, however, suggest that well-written plain documents can be both clear and accurate.',
    question: 'What is the main point of the passage?',
    options: [
      { id: 'A', text: 'Legal documents must always be complex to be accurate.' },
      { id: 'B', text: 'Plain language in official documents can bring benefits without losing accuracy.' },
      { id: 'C', text: 'Citizens rarely make mistakes when completing forms.' },
      { id: 'D', text: 'Government staff prefer to help citizens in person.' },
    ],
    answers: ['B'],
  },
  {
    id: 'mc-003',
    multiple: true,
    title: 'Volcanic soil',
    passage: 'Although volcanoes are dangerous, people have farmed their slopes for thousands of years. Volcanic ash breaks down into soil that is rich in minerals such as potassium and phosphorus, which help crops grow. The soil also holds water well while still allowing roots to breathe. As a result, regions near volcanoes, from Indonesia to Italy, are often among the most productive farming areas in their countries.',
    question: 'Which of the following are given as reasons why volcanic soil is good for farming? Choose more than one.',
    options: [
      { id: 'A', text: 'It contains useful minerals.' },
      { id: 'B', text: 'It is protected from heavy rain.' },
      { id: 'C', text: 'It retains water but lets roots get air.' },
      { id: 'D', text: 'It is warmer than ordinary soil.' },
    ],
    answers: ['A', 'C'],
  },
];
