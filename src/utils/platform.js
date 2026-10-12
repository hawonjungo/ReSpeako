// Mobile browsers handle the Web Speech API and the microphone differently from desktop.
const userAgent = typeof navigator === 'undefined' ? '' : navigator.userAgent;

export const isMobileBrowser = /Android|iPhone|iPad|iPod/i.test(userAgent);
