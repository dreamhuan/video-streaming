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
      autoplay: true,
      width: "100%", // 设置播放器宽度为100%
      height: "100%", // 设置播放器高度为100%
      lang: "zh-cn",
      playbackRate: [2, 1.75, 1.5, 1, 0.5],
      volume: 1,
      controls: {
        autoHide: true,
        initShow: true,
      },
      keyShortcut: true,
    });

    const savedTime = localStorage.getItem(`video-progress-${filename}`);
    if (playerRef.current && savedTime) {
      playerRef.current.currentTime = parseFloat(savedTime);
    }

    const handleTimeUpdate = () => {
      if (playerRef.current) {
        localStorage.setItem(
          `video-progress-${filename}`,
          playerRef.current.currentTime.toString()
        );
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
