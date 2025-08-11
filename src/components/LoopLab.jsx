import React, { useEffect, useRef, useState } from 'react';

const LoopLab = () => {
  const playerRef = useRef(null);
  const loopIntervalRef = useRef(null);

  const [playerReady, setPlayerReady] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(30);
  const [loopDelay, setLoopDelay] = useState(0);
  const [isLooping, setIsLooping] = useState(false);
  const [loopForever, setLoopForever] = useState(true);
  const [videoTitle, setVideoTitle] = useState('');
  const [currentSubtitle, setCurrentSubtitle] = useState('');
  const [lastSubtitle, setLastSubtitle] = useState('');

  // Demo subtitles
  const [subtitles] = useState([
    { start: 0, end: 5, text: 'Welcome to LoopLab!' },
    { start: 6, end: 15, text: 'Practice your listening skills here.' },
    { start: 16, end: 30, text: 'Enjoy looping and subtitles!' },
  ]);

  // Load YouTube IFrame API and create player safely
  useEffect(() => {
    function onYouTubeIframeAPIReady() {
      playerRef.current = new window.YT.Player('player', {
        width: '100%',
        height: '100%',
        videoId: 'jU9ssDa_IVY',
        playerVars: {
          autoplay: 0,
          cc_load_policy: 1,
        },
        events: {
          onReady: () => {
            setPlayerReady(true);
            fetchVideoTitle();
          },
        },
      });
    }

    if (!window.YT) {
      window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.body.appendChild(tag);
    } else {
      onYouTubeIframeAPIReady();
    }

    return () => {
      clearInterval(loopIntervalRef.current);
      if (playerRef.current && playerRef.current.destroy) {
        playerRef.current.destroy();
      }
    };
  }, []);

  // Fetch video title from noembed.com
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

  // Loop & subtitle update logic
  useEffect(() => {
    clearInterval(loopIntervalRef.current);

    if (isLooping && loopForever && playerReady && playerRef.current?.getCurrentTime) {
      loopIntervalRef.current = setInterval(() => {
        const currentTime = playerRef.current.getCurrentTime();

        // Loop logic
        if (currentTime >= endTime) {
          playerRef.current.pauseVideo();
          setTimeout(() => {
            if (playerRef.current && playerRef.current.seekTo) {
              playerRef.current.seekTo(startTime);
              playerRef.current.playVideo();
            }
          }, loopDelay * 1000);
        }

        // Subtitle update - chỉ set khi khác phụ đề hiện tại để tránh render thừa
        const sub = subtitles.find((s) => currentTime >= s.start && currentTime <= s.end);
        const newSubtitle = sub ? sub.text : '';
        if (newSubtitle !== lastSubtitle) {
          setCurrentSubtitle(newSubtitle);
          setLastSubtitle(newSubtitle);
        }
      }, 100);
    }

    return () => clearInterval(loopIntervalRef.current);
  }, [isLooping, loopForever, startTime, endTime, loopDelay, subtitles, playerReady, lastSubtitle]);

  // Stop loop & clear interval
  const stopLoop = () => {
    setIsLooping(false);
    clearInterval(loopIntervalRef.current);
  };

  // Validate start/end time before starting loop
  const handleStartLoop = () => {
    if (!playerReady) return alert('Player chưa sẵn sàng.');
    if (startTime >= endTime) return alert('Start time phải nhỏ hơn End time.');
    setIsLooping(true);
    if (playerRef.current && playerRef.current.seekTo) {
      playerRef.current.seekTo(startTime);
      playerRef.current.playVideo();
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold">🎧 LoopLab - YouTube Loop Practice</h1>

      {videoTitle && (
        <p className="text-lg text-gray-700 font-medium">🎬 {videoTitle}</p>
      )}

      <div className="relative w-full aspect-video mt-6 rounded overflow-hidden shadow-lg">
        <div id="player" className="absolute top-0 left-0 w-full h-full"></div>
      </div>

      <div className="mt-4 text-center text-xl font-semibold text-purple-700 min-h-[2em]">
        {currentSubtitle}
      </div>

      <div className="flex gap-4 flex-wrap">
        <label>
          Start (seconds):
          <input
            type="number"
            min={0}
            max={endTime - 1}
            value={startTime}
            onChange={(e) => setStartTime(Number(e.target.value))}
            className="ml-2 border px-2 py-1 rounded"
          />
        </label>

        <label>
          End (seconds):
          <input
            type="number"
            min={startTime + 1}
            value={endTime}
            onChange={(e) => setEndTime(Number(e.target.value))}
            className="ml-2 border px-2 py-1 rounded"
          />
        </label>

        <label>
          Delay (seconds):
          <input
            type="number"
            min={0}
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
          onClick={handleStartLoop}
          disabled={!playerReady}
          className={`px-4 py-2 rounded text-white ${
            playerReady ? 'bg-blue-500 hover:bg-blue-600' : 'bg-blue-300 cursor-not-allowed'
          }`}
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
    </div>
  );
};

export default LoopLab;
