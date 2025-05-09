import { useEffect, useRef } from "react";
import Player from "xgplayer";
import "xgplayer/dist/index.min.css";
import { fetchPlaybackRecord, savePlayback } from "../api";

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
      height: window.innerHeight,
      lang: "zh-cn",
      playbackRate: [2, 1.75, 1.5, 1, 0.5],
      volume: 1,
      controls: {
        autoHide: true,
        initShow: true,
      },
      keyShortcut: true,
    });

    const fetchPlaybackData = async () => {
      const record = await fetchPlaybackRecord();
      const curTime = record.historyRecords[filename];

      if (playerRef.current) {
        playerRef.current.currentTime = curTime || 0;
        savePlayback(filename, playerRef.current.currentTime);
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
          savePlayback(filename, playerRef.current.currentTime);
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