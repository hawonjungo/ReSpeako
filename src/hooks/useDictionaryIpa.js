export default function useDictionaryIpa() {
  const fetchIpa = async (text) => {
    if (!text?.trim()) {
      throw new Error('Please enter a word first.');
    }

    try {
      const res = await fetch(
        `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(text)}`
      );

      const data = await res.json();

      if (!Array.isArray(data)) {
        throw new Error("Can't find IPA, should be one word.");
      }

      const phonetic =
        data[0]?.phonetics?.find((p) => p.text)?.text ||
        data[0]?.phonetic ||
        'No IPA found';

      const definition =
        data[0]?.meanings?.[0]?.definitions?.[0]?.definition || '';

      return {
        ipa: phonetic,
        definition,
      };
    } catch (error) {
      if (error.message) {
        throw error;
      }

      throw new Error('Error fetching IPA.');
    }
  };

  return { fetchIpa };
}