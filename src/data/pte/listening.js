// Listening practice content written for ReSpeako, following PTE Academic formats.
// Audio is read by text-to-speech.

// Highlight Incorrect Words: {shown|spoken} marks a word that differs from the audio.
export const highlightBank = [
  {
    id: 'hiw-001',
    title: 'Student housing',
    text: 'Finding {cheap|affordable} accommodation is one of the biggest challenges for new students. Many universities now offer shared flats close to the campus, which allow students to save money on {travel|transport} and meet people from different {countries|backgrounds}. However, places are limited, so students are advised to {submit|send} their applications as early as possible.',
  },
  {
    id: 'hiw-002',
    title: 'Solar power',
    text: 'Solar power has become one of the {fastest|quickest} growing sources of energy in the world. The cost of solar panels has fallen {dramatically|significantly} over the past decade, making them affordable for many {families|households}. The main limitation is that the sun does not shine at night, so better storage {systems|technology} will be essential.',
  },
  {
    id: 'hiw-003',
    title: 'Language and thought',
    text: 'Some researchers argue that the language we speak {shapes|influences} the way we think. For example, speakers of languages with many words for colours may notice {minor|subtle} differences more quickly. Critics reply that these effects are {small|limited} and that human thinking is largely {universal|similar} across cultures.',
  },
];

// Listening: Fill in the Blanks. The audio reads the full text; {n} marks blank n.
export const listeningBlanksBank = [
  {
    id: 'lfib-001',
    title: 'Ancient libraries',
    text: 'The Library of Alexandria was one of the largest and most {0} libraries of the ancient world. Scholars travelled from across the Mediterranean to study its {1}, which may have included hundreds of thousands of scrolls. Contrary to popular belief, the library was not destroyed in a single fire; instead, it {2} gradually over several centuries as funding and political {3} declined.',
    answers: ['significant', 'collection', 'declined', 'support'],
  },
  {
    id: 'lfib-002',
    title: 'Sleep and teenagers',
    text: 'Biological changes during adolescence shift the body clock, so teenagers naturally feel {0} later in the evening. When schools start early, many students are {1} deprived of sleep. Several school districts that moved their start times later reported better {2} and fewer car accidents among young {3}.',
    answers: ['sleepy', 'chronically', 'attendance', 'drivers'],
  },
  {
    id: 'lfib-003',
    title: 'Microplastics',
    text: 'Microplastics are tiny pieces of plastic smaller than five {0}. They come from larger items that break down, as well as from synthetic {1} released when clothes are washed. Scientists have found them in oceans, soil and even drinking water, and they are now {2} how these particles affect human {3}.',
    answers: ['millimetres', 'fibres', 'investigating', 'health'],
  },
];

// Select Missing Word: the audio stops before the last words and a beep replaces them.
export const missingWordBank = [
  {
    id: 'smw-001',
    title: 'Exercise and the brain',
    text: 'Regular physical exercise increases blood flow to the brain and encourages the growth of new nerve cells. Studies of older adults show that those who walk briskly several times a week perform better on memory tests. In short, staying active is good not only for the body but also for the',
    options: [
      { id: 'A', text: 'mind' },
      { id: 'B', text: 'heart' },
      { id: 'C', text: 'economy' },
      { id: 'D', text: 'environment' },
    ],
    answers: ['A'],
  },
  {
    id: 'smw-002',
    title: 'Supply and demand',
    text: 'When a product becomes popular and many people want to buy it, but the quantity available stays the same, sellers are able to charge more. On the other hand, when there is more of a product than people want, prices tend to',
    options: [
      { id: 'A', text: 'rise sharply' },
      { id: 'B', text: 'stay the same' },
      { id: 'C', text: 'fall' },
      { id: 'D', text: 'double' },
    ],
    answers: ['C'],
  },
  {
    id: 'smw-003',
    title: 'Peer review',
    text: 'Before a scientific article is published, it is usually sent to other experts in the same field. These reviewers check the methods, question the conclusions and suggest improvements. This process, known as peer review, is designed to protect the quality and reliability of',
    options: [
      { id: 'A', text: 'university buildings' },
      { id: 'B', text: 'published research' },
      { id: 'C', text: 'student grades' },
      { id: 'D', text: 'online advertising' },
    ],
    answers: ['B'],
  },
];

// Highlight Correct Summary: summaries of the Retell Lecture lectures (same audio).
export const summaryChoiceBank = [
  {
    id: 'hcs-001',
    lectureId: 'rl-001',
    title: 'Why we sleep',
    options: [
      { id: 'A', text: 'Students should study late at night because the brain is most active before sleep.' },
      { id: 'B', text: 'Sleep helps move new information into long-term memory, so students who sacrifice sleep before exams usually remember less.' },
      { id: 'C', text: 'Deep sleep reduces concentration, so students should limit how long they sleep before an exam.' },
      { id: 'D', text: 'Research shows that short-term memory is more important than long-term memory for exam success.' },
    ],
    answers: ['B'],
  },
  {
    id: 'hcs-002',
    lectureId: 'rl-002',
    title: 'Urban heat islands',
    options: [
      { id: 'A', text: 'Cities are warmer than the countryside because of heat-absorbing materials, a lack of vegetation and extra heat from human activity, but trees and reflective roofs can help.' },
      { id: 'B', text: 'The countryside is warmer than cities because it has more trees and fewer buildings.' },
      { id: 'C', text: 'Air conditioners are the only reason why cities are warmer, so they should be banned.' },
      { id: 'D', text: 'Urban heat islands mainly occur during the day, when concrete releases the heat it has stored.' },
    ],
    answers: ['A'],
  },
  {
    id: 'hcs-003',
    lectureId: 'rl-004',
    title: 'Bees and food production',
    options: [
      { id: 'A', text: 'The main value of bees is honey production, which is threatened by disease.' },
      { id: 'B', text: 'Bee populations are growing because farmers use fewer pesticides than in the past.' },
      { id: 'C', text: 'Bees are essential pollinators for much of our food, but their numbers are falling because of pesticides, habitat loss and disease.' },
      { id: 'D', text: 'Only apples and almonds depend on bees, so their decline has little effect on food security.' },
    ],
    answers: ['C'],
  },
];
