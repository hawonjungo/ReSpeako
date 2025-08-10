import React, { useEffect, useRef, useState } from 'react';

const LoopLab = () => {
  const playerRef = useRef(null);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(30);
  const [loopDelay, setLoopDelay] = useState(0);
  const [isLooping, setIsLooping] = useState(false);
  const [loopForever, setLoopForever] = useState(true);
  const [videoTitle, setVideoTitle] = useState('');
  // Use demo subtitles only
  const [subtitles] = useState([
    { start: 0, end: 5, text: 'Welcome to LoopLab!' },
    { start: 6, end: 15, text: 'Practice your listening skills here.' },
    { start: 16, end: 30, text: 'Enjoy looping and subtitles!' },
  ]);
  const [currentSubtitle, setCurrentSubtitle] = useState('');
  const loopIntervalRef = useRef(null);

  useEffect(() => {
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

    window.onYouTubeIframeAPIReady = () => {
      playerRef.current = new window.YT.Player('player', {
        height: '360',
        width: '640',
        videoId: 'jU9ssDa_IVY',
        playerVars: {
          autoplay: 0,
          cc_load_policy: 1,
        },
        events: {
          onReady: () => {
            fetchVideoTitle();
          },
        },
      });
    };

    return () => {
      clearInterval(loopIntervalRef.current);
    };
  }, []);

  const fetchVideoTitle = async () => {
    try {
      const response = await fetch(
        'https://noembed.com/embed?url=https://www.youtube.com/watch?v=jU9ssDa_IVY'
      );
      const data = await response.json();
      setVideoTitle(data.title || '');
    } catch (err) {
      console.error('Failed to fetch video title:', err);
    }
  };

  // Loop logic: always running while isLooping and loopForever are true
  useEffect(() => {
    clearInterval(loopIntervalRef.current);
    if (isLooping && loopForever) {
      loopIntervalRef.current = setInterval(() => {
        if (playerRef.current && playerRef.current.getCurrentTime) {
          const currentTime = playerRef.current.getCurrentTime();
          // Loop video
          if (currentTime >= endTime) {
            playerRef.current.pauseVideo();
            setTimeout(() => {
              playerRef.current.seekTo(startTime);
              playerRef.current.playVideo();
            }, loopDelay * 1000);
          }
          // Show subtitle
          const sub = subtitles.find((s) => currentTime >= s.start && currentTime <= s.end);
          setCurrentSubtitle(sub ? sub.text : '');
        }
      }, 300);
    }
    return () => clearInterval(loopIntervalRef.current);
  }, [isLooping, loopForever, startTime, endTime, loopDelay, subtitles]);

  // Stop loop when checkbox unticked or button clicked
  const stopLoop = () => {
    setIsLooping(false);
    clearInterval(loopIntervalRef.current);
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">🎧 LoopLab - YouTube Loop Practice</h1>

      {videoTitle && (
        <p className="text-lg text-gray-700 font-medium">🎬 {videoTitle}</p>
      )}

      <div className="flex gap-4 flex-wrap">
        <label>
          Start (seconds):
          <input
            type="number"
            value={startTime}
            onChange={(e) => setStartTime(Number(e.target.value))}
            className="ml-2 border px-2 py-1 rounded"
          />
        </label>

        <label>
          End (seconds):
          <input
            type="number"
            value={endTime}
            onChange={(e) => setEndTime(Number(e.target.value))}
            className="ml-2 border px-2 py-1 rounded"
          />
        </label>

        <label>
          Delay (seconds):
          <input
            type="number"
            value={loopDelay}
            onChange={(e) => setLoopDelay(Number(e.target.value))}
            className="ml-2 border px-2 py-1 rounded"
          />
        </label>

        <label className="flex items-center">
          <input
            type="checkbox"
            checked={loopForever}
            onChange={(e) => {
              setLoopForever(e.target.checked);
              if (!e.target.checked) stopLoop();
            }}
            className="mr-2"
          />
          Loop Forever
        </label>
      </div>

      <div className="flex gap-4">
        <button
          onClick={() => {
            setIsLooping(true);
            playerRef.current.seekTo(startTime);
            playerRef.current.playVideo();
          }}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Start Loop
        </button>
        <button
          onClick={stopLoop}
          className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
        >
          Stop
        </button>
      </div>

      <div className="mt-6">
        <div id="player"></div>
        <div className="mt-4 text-center text-xl font-semibold text-purple-700 min-h-[2em]">
          {currentSubtitle}
        </div>
      </div>
    </div>
  );
};

export default LoopLab;
