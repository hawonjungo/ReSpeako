// Pronunciation Coach content: sound groups that Vietnamese learners commonly
// find difficult. `symbols` use the American IPA returned by Azure, so scores
// for exactly these sounds can be pulled out of each assessment.

export const diagnosticSentences = [
  'I think the weather will be better this week.',
  'She sells fresh fish at the shop by the shore.',
  'The red light is on the right side of the road.',
  'He walked to the bank and asked for his cards.',
  'Please leave the ship and sit on the green seat.',
  'The man had a bad pen in his black bag.',
];

export const pronunciationSets = [
  {
    id: 'final-td',
    title: { en: 'Final /t/ and /d/', vi: 'Âm cuối /t/ và /d/' },
    symbols: ['t', 'd'],
    tip: {
      vi: 'Tiếng Việt hay "nuốt" âm cuối. Với /t/ và /d/ ở cuối từ, hãy chạm đầu lưỡi vào lợi phía sau răng cửa trên rồi bật nhẹ ra. /d/ có rung dây thanh và nguyên âm đứng trước nó kéo dài hơn một chút (bed dài hơn bet).',
      en: 'Do not drop final sounds. Touch the tongue tip to the ridge behind the top teeth and release gently. /d/ is voiced, and the vowel before it is slightly longer (bed is longer than bet).',
    },
    pairs: [['bet', 'bed'], ['cart', 'card'], ['right', 'ride'], ['wrote', 'road'], ['seat', 'seed']],
    sentences: [
      'I need to get the right card for the bed.',
      'She wrote a short note and sent it at eight.',
      'Don\'t forget to add the date at the end.',
      'The cat sat next to the old red bird.',
    ],
  },
  {
    id: 'th-voiceless',
    title: { en: '/θ/ as in think', vi: '/θ/ như trong think' },
    symbols: ['θ'],
    tip: {
      vi: 'Đặt đầu lưỡi nhẹ giữa hai hàm răng (hơi thè ra), rồi thổi hơi qua khe đó. Không rung dây thanh. Đừng thay bằng /t/ (tree) hay /s/ (sink).',
      en: 'Put the tongue tip lightly between the teeth and blow air through. No voicing. Do not replace it with /t/ (tree) or /s/ (sink).',
    },
    pairs: [['think', 'sink'], ['thick', 'tick'], ['three', 'tree'], ['path', 'pass'], ['thought', 'taught']],
    sentences: [
      'I think three things are worth thinking about.',
      'Thank you for the thoughtful birthday gift.',
      'The author\'s theory was thoroughly tested.',
      'Both of them walked along the north path.',
    ],
  },
  {
    id: 'th-voiced',
    title: { en: '/ð/ as in this', vi: '/ð/ như trong this' },
    symbols: ['ð'],
    tip: {
      vi: 'Vị trí lưỡi giống /θ/ (đầu lưỡi giữa hai hàm răng) nhưng CÓ rung dây thanh: đặt tay lên cổ sẽ thấy rung. Đừng đọc thành /d/ (day) hay /z/.',
      en: 'Same tongue position as /θ/, but voiced: you should feel a buzz in your throat. Do not turn it into /d/ (day) or /z/.',
    },
    pairs: [['then', 'den'], ['they', 'day'], ['those', 'doze'], ['breathe', 'breeze'], ['though', 'dough']],
    sentences: [
      'They said that the weather was better than this.',
      'My mother and father live together there.',
      'Those are the clothes that they bought.',
      'Breathe slowly, then rest for a while.',
    ],
  },
  {
    id: 'final-sz',
    title: { en: 'Final /s/ and /z/ (plurals)', vi: 'Âm cuối /s/ và /z/ (số nhiều, -s)' },
    symbols: ['s', 'z'],
    tip: {
      vi: 'Đuôi -s rất hay bị bỏ khi nói nhanh. Sau âm vô thanh (cats, books) đọc /s/; sau âm hữu thanh (dogs, plays) đọc /z/ có rung. Kéo dài âm cuối một chút khi mới tập.',
      en: 'Final -s is easy to drop. After voiceless sounds (cats, books) say /s/; after voiced sounds (dogs, plays) say a buzzing /z/. Exaggerate the ending at first.',
    },
    pairs: [['price', 'prize'], ['place', 'plays'], ['bus', 'buzz'], ['ice', 'eyes'], ['rice', 'rise']],
    sentences: [
      'She likes cats, dogs and birds.',
      'The prices of houses rose in most cities.',
      'He reads books and writes notes every day.',
      'Students\' results depend on their efforts.',
    ],
  },
  {
    id: 'sh-s',
    title: { en: '/ʃ/ vs /s/', vi: '/ʃ/ và /s/' },
    symbols: ['ʃ', 's'],
    tip: {
      vi: '/ʃ/ (she): tròn môi đẩy ra trước, lưỡi lùi về sau một chút, hơi thoát ra rộng như tiếng "suỵt". /s/ (see): môi dẹt, đầu lưỡi gần lợi trên, tiếng xì hẹp và cao.',
      en: '/ʃ/ (she): round and push the lips forward, tongue slightly back, a wide "shh". /s/ (see): spread lips, tongue tip near the ridge, a narrow high hiss.',
    },
    pairs: [['ship', 'sip'], ['she', 'see'], ['shoe', 'sue'], ['sheet', 'seat'], ['shore', 'sore']],
    sentences: [
      'She sells fresh fish in a small shop.',
      'The ship sails to the shore at sunset.',
      'Please wash the dishes and push them aside.',
      'Sharing information is essential for success.',
    ],
  },
  {
    id: 'long-short-i',
    title: { en: '/iː/ vs /ɪ/', vi: 'Nguyên âm dài /iː/ và ngắn /ɪ/' },
    symbols: ['i', 'ɪ'],
    tip: {
      vi: '/iː/ (sheep): môi kéo căng sang hai bên như cười, âm dài. /ɪ/ (ship): miệng thả lỏng, hàm hạ nhẹ, âm ngắn và gọn, gần với "i" ngắn pha "ê". Sai cặp này có thể đổi nghĩa (leave/live).',
      en: '/iː/ (sheep): spread lips like a smile, long sound. /ɪ/ (ship): relaxed mouth, jaw slightly lower, short sound. Mixing them changes meaning (leave/live).',
    },
    pairs: [['sheep', 'ship'], ['leave', 'live'], ['seat', 'sit'], ['feel', 'fill'], ['heat', 'hit']],
    sentences: [
      'Please leave the green tea on the seat.',
      'This big ship will sink if it is hit.',
      'We need to keep the sheep in the field.',
      'Will you fill in the sheet with ink?',
    ],
  },
  {
    id: 'ae-e',
    title: { en: '/æ/ vs /e/', vi: '/æ/ và /e/' },
    symbols: ['æ', 'ɛ'],
    tip: {
      vi: '/æ/ (bad): mở miệng rộng, hạ hàm nhiều, lưỡi thấp và phẳng, giống giữa "a" và "e". /e/ (bed): miệng mở vừa, giống "e" tiếng Việt.',
      en: '/æ/ (bad): open the mouth wide, jaw low, flat tongue, between "a" and "e". /e/ (bed): mouth half open.',
    },
    pairs: [['bad', 'bed'], ['man', 'men'], ['sat', 'set'], ['pan', 'pen'], ['had', 'head']],
    sentences: [
      'The man had a bad headache after lunch.',
      'Let the cat sit on the mat next to the bed.',
      'Ten men sat at the back of the class.',
      'Pack the black bag and the red pen.',
    ],
  },
  {
    id: 'r-l',
    title: { en: '/r/ vs /l/', vi: '/r/ và /l/' },
    symbols: ['ɹ', 'l'],
    tip: {
      vi: '/r/ (right): cong đầu lưỡi lên và lùi về sau, KHÔNG chạm vòm miệng, môi hơi tròn; không rung lưỡi và không đọc thành /z/. /l/ (light): đầu lưỡi chạm lợi sau răng cửa trên, hơi đi ra hai bên lưỡi.',
      en: '/r/ (right): curl the tongue tip up and back without touching the roof of the mouth, lips slightly rounded; no trill, no /z/. /l/ (light): tongue tip touches the ridge behind the top teeth.',
    },
    pairs: [['right', 'light'], ['rice', 'lice'], ['road', 'load'], ['read', 'lead'], ['pray', 'play']],
    sentences: [
      'Read the red letter really slowly.',
      'The light on the right is still on.',
      'Learning a language requires regular practice.',
      'Larry rarely rides along the river road.',
    ],
  },
  {
    id: 'ed-endings',
    title: { en: '-ed endings', vi: 'Đuôi -ed' },
    symbols: ['t', 'd'],
    tip: {
      vi: 'Đuôi -ed có 3 cách đọc: /t/ sau âm vô thanh (walked, stopped), /d/ sau âm hữu thanh (played, called), /ɪd/ sau /t/ và /d/ (wanted, needed). Đừng bỏ đuôi: nghe sẽ thành thì hiện tại.',
      en: '-ed has three sounds: /t/ after voiceless sounds (walked), /d/ after voiced sounds (played), /ɪd/ after /t/ or /d/ (wanted). Dropping it makes the verb sound present tense.',
    },
    pairs: [['walk', 'walked'], ['play', 'played'], ['want', 'wanted'], ['stop', 'stopped'], ['need', 'needed']],
    sentences: [
      'She walked home and cooked dinner.',
      'We wanted to know why the plan failed.',
      'He stopped, looked around and smiled.',
      'The project ended earlier than expected.',
    ],
  },
];
