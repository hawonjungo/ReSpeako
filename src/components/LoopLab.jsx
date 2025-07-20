import React, { useRef, useState, useEffect } from 'react';

const LoopLab = () => {
  const videoRef = useRef(null);
  const [start, setStart] = useState(60); // in seconds
  const [end, setEnd] = useState(360);    // in seconds
  const [delay, setDelay] = useState(5);  // in seconds
  const [looping, setLooping] = useState(false);

  useEffect(() => {
    let interval;
    if (looping) {
      interval = setInterval(() => {
        const video = videoRef.current;
        if (video && video.currentTime >= end) {
          video.pause();
          setTimeout(() => {
            video.currentTime = start;
            video.play();
          }, delay * 1000);
        }
      }, 500);
    }
    return () => clearInterval(interval);
  }, [looping, start, end, delay]);

  const handleStart = () => {
    const video = videoRef.current;
    if (video) {
      video.currentTime = start;
      video.play();
      setLooping(true);
    }
  };

  const handleStop = () => {
    const video = videoRef.current;
    if (video) video.pause();
    setLooping(false);
  };

  return (
    <div className="p-4 max-w-xl mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-center">🎧 WFD Video Loop</h2>
      
      <video
        ref={videoRef}
        src="/videos/wfd350.mp4"
        controls
        className="w-full rounded shadow mb-4"
      />

      <div className="flex flex-col gap-2">
        <label>
          ⏱️ Start Time (mm:ss):
          <input
            type="text"
            value={secondsToMMSS(start)}
            onChange={(e) => setStart(mmssToSeconds(e.target.value))}
            className="border p-1 rounded ml-2"
          />
        </label>
        <label>
          ⏱️ End Time (mm:ss):
          <input
            type="text"
            value={secondsToMMSS(end)}
            onChange={(e) => setEnd(mmssToSeconds(e.target.value))}
            className="border p-1 rounded ml-2"
          />
        </label>
        <label>
          🔁 Delay (seconds):
          <input
            type="number"
            value={delay}
            onChange={(e) => setDelay(Number(e.target.value))}
            className="border p-1 rounded ml-2"
          />
        </label>
      </div>

      <div className="mt-4 flex justify-center gap-4">
        <button onClick={handleStart} className="px-4 py-2 bg-green-500 text-white rounded">▶️ Start Loop</button>
        <button onClick={handleStop} className="px-4 py-2 bg-red-500 text-white rounded">⏹️ Stop</button>
      </div>
    </div>
  );
};

const mmssToSeconds = (mmss) => {
  const [min, sec] = mmss.split(':').map(Number);
  return min * 60 + sec;
};

const secondsToMMSS = (secs) => {
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = Math.floor(secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

export default LoopLab;
