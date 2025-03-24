import { useEffect, useRef } from "react";
import Player from "xgplayer";
import "xgplayer/dist/index.min.css";

const VideoPlayer = ({ filename }: { filename: string }) => {
  console.log("filename", filename);
  const playerRef = useRef<Player | null>(null);

  useEffect(() => {
    if (playerRef.current) {
      playerRef.current.destroy();
    }
    playerRef.current = new Player({
      id: "video-player",
      url: `http://localhost:5000/video/${encodeURIComponent(filename)}`,
      autoplay: true,
      controls: true,
      width: "100%", // 设置播放器宽度为100%
      height: "90%", // 设置播放器高度为100%
      lang: "zh-cn",
      playbackRate: [2, 1.75, 1.5, 1, 0.5],
      volume: 1,
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
      <p className="video-title">播放视频: {filename}</p>
      <div id="video-player"></div>
    </div>
  );
};

export default VideoPlayer;
