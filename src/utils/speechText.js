export const joinText = (...parts) => parts.map((part) => part.trim()).filter(Boolean).join(' ');

// Rebuilds the whole session transcript from a Web Speech result list, so a repeated
// or revised result event can never append text twice.
export const sessionTranscript = (results) => {
  let finalText = '';
  let interimText = '';
  for (let i = 0; i < results.length; i += 1) {
    const text = results[i][0]?.transcript || '';
    if (results[i].isFinal) finalText = joinText(finalText, text);
    else interimText = joinText(interimText, text);
  }
  return joinText(finalText, interimText);
};

// Chrome stops long utterances silently after ~15s, so web speech is queued in short chunks.
const MAX_CHUNK_CHARS = 180;

export const splitIntoChunks = (text) => {
  const sentences = text.replace(/\s+/g, ' ').trim().match(/[^.!?;:]+[.!?;:]*\s*/g) || [text];
  const chunks = [];

  sentences.forEach((sentence) => {
    let rest = sentence.trim();
    while (rest.length > MAX_CHUNK_CHARS) {
      const cut = rest.lastIndexOf(' ', MAX_CHUNK_CHARS);
      const at = cut > 0 ? cut : MAX_CHUNK_CHARS;
      chunks.push(rest.slice(0, at));
      rest = rest.slice(at).trim();
    }
    if (!rest) return;

    const last = chunks[chunks.length - 1];
    if (last && last.length + rest.length + 1 <= MAX_CHUNK_CHARS) chunks[chunks.length - 1] = `${last} ${rest}`;
    else chunks.push(rest);
  });

  return chunks;
};
