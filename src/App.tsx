import React, { useEffect, useState } from "react";
import { Tree } from "antd";
import VideoPlayer from "./components/VideoPlayer";

function App() {
  const [videos, setVideos] = useState<any[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
  const [sidebarWidth, setSidebarWidth] = useState<number>(250);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  // 从后端获取视频文件数据
  useEffect(() => {
    fetch(`http://${location.hostname}:5000/videos`)
      .then((res) => res.json())
      .then((data) => {
        setVideos(data.videos);

        // 获取上次播放的视频路径
        const lastPlayedVideo = data.lastPlayedVideo;
        if (lastPlayedVideo) {
          setSelectedVideo(lastPlayedVideo);
          setSelectedKeys([lastPlayedVideo]);

          const pathArr = lastPlayedVideo?.split("\\");
          const len = pathArr.length;
          const expKeys = [];
          for (let i = 0; i < len; i++) {
            expKeys.push(pathArr.slice(0, i).join("\\"));
          }
          setExpandedKeys(expKeys);
        }
      })
      .catch((error) => console.error("Error fetching videos:", error));
  }, []);

  // 将后端返回的文件列表转换成树形结构
  const renderFileTree = (files: any[]): any[] => {
    return files.map((item) => ({
      title: item.title,
      key: item.key,
      children: item.children ? renderFileTree(item.children) : undefined,
      isLeaf: item.isLeaf,
    }));
  };

  // 转换后的树数据
  const treeData = renderFileTree(videos);

  // 处理选择视频
  const handleSelect = (selectedKeys: React.Key[]) => {
    const selectedVideoKey = selectedKeys[0] as string;
    if (!selectedVideoKey || !selectedVideoKey.endsWith(".mp4")) {
      return;
    }
    setSelectedVideo(selectedVideoKey);
    setSelectedKeys([selectedVideoKey]);
  };

  // 处理鼠标按下事件
  const handleMouseDown = () => {
    setIsResizing(true);
  };

  // 处理鼠标移动事件
  const handleMouseMove = (e: MouseEvent) => {
    if (isResizing) {
      const newWidth = e.clientX;
      if (newWidth > 150 && newWidth < 500) {
        setSidebarWidth(newWidth);
      }
    }
  };

  // 处理鼠标抬起事件
  const handleMouseUp = () => {
    setIsResizing(false);
  };

  // 处理侧栏展开收起
  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  useEffect(() => {
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  return (
    <div className="container">
      <div>
        <button
          className="menu-btn"
          onClick={toggleSidebar}
          style={{ position: "fixed", zIndex: 1 }}
        >
          ≡
        </button>
        {/* <p className="video-title">{selectedVideo}</p> */}
      </div>
      {!isSidebarCollapsed && (
        <aside className="sidebar" style={{ width: sidebarWidth }}>
          <Tree
            treeData={treeData}
            selectedKeys={selectedKeys}
            onSelect={(selectedKeys) => handleSelect(selectedKeys)}
            expandedKeys={expandedKeys}
            onExpand={(expandedKeys) =>
              setExpandedKeys(expandedKeys as string[])
            }
            showLine
          />
          <div className="resize-handle" onMouseDown={handleMouseDown} />
        </aside>
      )}
      <main className="video-container">
        {selectedVideo ? (
          <VideoPlayer filename={selectedVideo} />
        ) : (
          <p>请选择一个视频</p>
        )}
      </main>
    </div>
  );
}

export default App;
