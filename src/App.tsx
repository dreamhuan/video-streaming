import React, { useEffect, useState } from "react";
import { Tree } from "antd";
import VideoPlayer from "./components/VideoPlayer";
import { fetchVideos, savePlayback } from "./api";
import PDFViewer from './components/PDFViewer';

function App() {
  const [videos, setVideos] = useState<any[]>([]);
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
  const [sidebarWidth, setSidebarWidth] = useState<number>(250);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [selectedFileType, setSelectedFileType] = useState<
    "video" | "pdf" | null
  >(null);

  // 从后端获取视频文件数据
  useEffect(() => {
    fetchVideos()
      .then((data) => {
        setVideos(data.videos);

        // 获取上次播放的视频路径
        const lastPlayedVideo = data.lastPlayedVideo;
        if (lastPlayedVideo) {
          setSelectedFilePath(lastPlayedVideo);
          setSelectedKeys([lastPlayedVideo]);
          if (
            lastPlayedVideo.endsWith(".mp4") ||
            lastPlayedVideo.endsWith(".mkv")
          ) {
            setSelectedFileType("video");
          } else if (lastPlayedVideo.endsWith(".pdf")) {
            setSelectedFileType("pdf");
          }

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

  // 处理选择文件
  const handleSelect = (selectedKeys: React.Key[]) => {
    const selectedFileKey = selectedKeys[0] as string;
    if (!selectedFileKey) {
      return;
    }
    if (selectedFileKey.endsWith(".mp4") || selectedFileKey.endsWith(".mkv")) {
      setSelectedFileType("video");
      setSelectedFilePath(selectedFileKey);
    } else if (selectedFileKey.endsWith(".pdf")) {
      setSelectedFileType("pdf");
      setSelectedFilePath(selectedFileKey);
      savePlayback(selectedFileKey, 0);
    }
    setSelectedKeys([selectedFileKey]);
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
        {selectedFilePath && selectedFileType === "video" ? (
          <VideoPlayer filename={selectedFilePath} />
        ) : selectedFilePath && selectedFileType === "pdf" ? (
          <PDFViewer 
            url={`http://${location.hostname}:5000/pdf/${encodeURIComponent(selectedFilePath)}`}
            filename={selectedFilePath}
          />
        ) : (
          <p>请选择一个视频或PDF文件</p>
        )}
      </main>
    </div>
  );
}

export default App;
