import { useEffect, useRef } from "react";
import Player from "xgplayer";
import "xgplayer/dist/index.min.css";

const VideoPlayer = ({ filename }: { filename: string }) => {
  const playerRef = useRef<Player | null>(null);

  useEffect(() => {
    if (playerRef.current) {
      playerRef.current.destroy();
    }
    playerRef.current = new Player({
      id: "video-player",
      url: `http://${location.hostname}:5000/video/${encodeURIComponent(
        filename
      )}`,
      autoplay: false,
      width: "100%",
      height: document.body.clientHeight,
      lang: "zh-cn",
      playbackRate: [2, 1.75, 1.5, 1, 0.5],
      volume: 1,
      controls: {
        autoHide: true,
        initShow: true,
      },
      keyShortcut: true,
    });

    const savePlaybackData = async (filename: string, time: number) => {
      fetch(`http://${location.hostname}:5000/save-playback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filename,
          time,
        }),
      });
    };

    const fetchPlaybackData = async () => {
      const recordResponse = await fetch(
        `http://${location.hostname}:5000/playback-record`
      );

      const record = await recordResponse.json();
      const curTime = record.historyRecords[filename];

      if (playerRef.current) {
        playerRef.current.currentTime = curTime || 0;
        savePlaybackData(filename, playerRef.current.currentTime);
      }
    };

    fetchPlaybackData();

    let lastSaveTime = 0;
    const handleTimeUpdate = () => {
      if (playerRef.current) {
        const currentTime = Date.now();
        // 播放状态下每2秒保存一次播放进度
        if (currentTime - lastSaveTime >= 2000 && playerRef.current.isPlaying) {
          lastSaveTime = currentTime;
          savePlaybackData(filename, playerRef.current.currentTime);
        }
      }
    };

    playerRef.current.on("timeupdate", handleTimeUpdate);

    return () => {
      if (playerRef.current) {
        playerRef.current.off("timeupdate", handleTimeUpdate);
        playerRef.current.destroy();
      }
    };
  }, [filename]);

  return (
    <div className="video-wrapper">
      <div id="video-player"></div>
    </div>
  );
};

export default VideoPlayer;
