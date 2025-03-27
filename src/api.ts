const API_BASE_URL = `http://${location.hostname}:5000`;

// 获取视频文件列表
export const fetchVideos = async () => {
  const response = await fetch(`${API_BASE_URL}/videos`);
  return response.json();
};

// 获取播放记录
export const fetchPlaybackRecord = async () => {
  const response = await fetch(`${API_BASE_URL}/playback-record`);
  return response.json();
};

// 保存播放进度
export const savePlayback = async (filename: string, time: number) => {
  await fetch(`${API_BASE_URL}/save-playback`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ filename, time }),
  });
};

// 获取PDF文件URL
export const getPdfUrl = (filename: string) => {
  return `${API_BASE_URL}/pdf/${encodeURIComponent(filename)}`;
};
