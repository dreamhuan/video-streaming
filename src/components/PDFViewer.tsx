import { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { fetchPlaybackRecord, savePlayback } from "../api";
import "pdfjs-dist/web/pdf_viewer.css";

// 设置 PDF.js worker 路径
pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

interface PDFViewerProps {
  url: string;
  filename: string; // 添加filename属性用于保存阅读进度
}

const PDFViewer = ({ url, filename }: PDFViewerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [pageNum, setPageNum] = useState(1);
  const [pageRendering, setPageRendering] = useState(false);
  const [scale, setScale] = useState(1.0);

  // 渲染PDF页面
  const renderPage = async (num: number) => {
    if (!canvasRef.current || !pdfDoc) return;

    setPageRendering(true);

    try {
      const page = await pdfDoc.getPage(num);

      // 获取容器宽度来计算合适的缩放比例
      const container = containerRef.current;
      if (!container) return;

      // 将容器滚动到顶部
      container.scrollTo({
        top: 0,
        behavior: "smooth", // 使用平滑滚动效果
      });

      const viewport = page.getViewport({ scale: 1.0 });

      // 计算适合容器宽度的缩放比例
      const containerWidth = container.clientWidth;
      const newScale = (containerWidth - 40) / viewport.width; // 减去40px作为边距
      setScale(newScale);
      console.log(scale)

      // 使用新的缩放比例创建viewport
      const scaledViewport = page.getViewport({ scale: newScale });

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d")!;

      // 设置canvas尺寸
      canvas.height = scaledViewport.height;
      canvas.width = scaledViewport.width;

      const renderContext = {
        canvasContext: ctx,
        viewport: scaledViewport,
      };

      await page.render(renderContext).promise;
      setPageRendering(false);

      // 保存阅读进度
      savePlayback(filename, num);
    } catch (error) {
      console.error("Error rendering page:", error);
      setPageRendering(false);
    }
  };

  // 处理页面切换
  const onPageChange = (delta: number) => {
    if (!pdfDoc || pageRendering) return;

    const newPageNum = pageNum + delta;
    if (newPageNum < 1 || newPageNum > pdfDoc.numPages) return;

    setPageNum(newPageNum);
  };

  // 监听窗口大小变化
  useEffect(() => {
    const handleResize = () => {
      if (pdfDoc) {
        renderPage(pageNum);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [pdfDoc, pageNum]);

  // 加载PDF文档并恢复阅读进度
  useEffect(() => {
    const loadPDF = async () => {
      try {
        const doc = await pdfjsLib.getDocument(url).promise;
        setPdfDoc(doc);

        // 获取上次阅读进度
        const record = await fetchPlaybackRecord();
        const lastPage = record.historyRecords[filename];
        if (lastPage) {
          setPageNum(lastPage);
        }
      } catch (error) {
        console.error("Error loading PDF:", error);
      }
    };

    loadPDF();
  }, [url, filename]);

  // 当文档加载完成或页码改变时重新渲染
  useEffect(() => {
    if (pdfDoc) {
      renderPage(pageNum);
    }
  }, [pdfDoc, pageNum]);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        overflow: "auto",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "20px",
        position: "relative",
        scrollBehavior: "smooth", // 添加平滑滚动效果
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          display: "block",
          maxWidth: "100%",
          height: "auto",
        }}
      />
      <div
        style={{
          position: "fixed",
          bottom: "20px",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 1000,
          backgroundColor: "rgba(255, 255, 255, 0.9)",
          padding: "10px",
          borderRadius: "5px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        }}
      >
        <button
          onClick={() => onPageChange(-1)}
          disabled={pageNum <= 1 || pageRendering}
          style={{
            padding: "5px 15px",
            cursor: pageNum <= 1 ? "not-allowed" : "pointer",
          }}
        >
          上一页
        </button>
        <span>
          第 {pageNum} 页 / 共 {pdfDoc?.numPages || "-"} 页
        </span>
        <button
          onClick={() => onPageChange(1)}
          disabled={(pdfDoc && pageNum >= pdfDoc.numPages) || pageRendering}
          style={{
            padding: "5px 15px",
            cursor:
              pdfDoc && pageNum >= pdfDoc.numPages ? "not-allowed" : "pointer",
          }}
        >
          下一页
        </button>
      </div>
    </div>
  );
};

export default PDFViewer;
