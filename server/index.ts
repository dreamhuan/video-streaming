import * as Koa from "koa";
import * as Router from "koa-router";
import * as cors from "koa2-cors";
import * as KoaStatic from "koa-static";
import * as path from "path";
import * as fs from "fs-extra";
import * as dotenv from "dotenv";
import * as os from "os";
import * as bodyParser from "koa-bodyparser";

dotenv.config();

const app = new Koa();
const router = new Router();

app.use(bodyParser());
app.use(cors());
app.use(KoaStatic(path.join(__dirname, "public")));
app.use(router.routes()).use(router.allowedMethods());

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  const addresses = [];

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === "IPv4" && !iface.internal) {
        addresses.push(iface.address);
      }
    }
  }
  return addresses;
}

const VIDEO_DIR = path.resolve(
  process.env.VIDEO_DIR || path.join(__dirname, "../videos")
);

const PLAYBACK_RECORDS_FILE = path.join(
  __dirname,
  process.env.NODE_ENV === "development"
    ? "playback_records_dev"
    : "playback_records_prod"
);

// 读取播放记录
const getPlaybackRecords = async () => {
  if (!fs.existsSync(PLAYBACK_RECORDS_FILE)) {
    return {
      lastPlayedVideo: null,
      historyRecords: {},
    };
  }
  return await fs.readJson(PLAYBACK_RECORDS_FILE);
};

// 保存播放记录
const savePlaybackRecord = async (filename: string, time: number) => {
  let records = await getPlaybackRecords();
  records.lastPlayedVideo = filename;
  records.historyRecords[filename] = time;
  await fs.writeJson(PLAYBACK_RECORDS_FILE, records);
};

// 递归获取视频文件
const getVideoFiles = async (dir: string, basePath = ""): Promise<any[]> => {
  let result: any[] = [];
  const files = await fs.readdir(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const relativePath = path.join(basePath, file);
    const stat = await fs.stat(fullPath);
    if (stat.isDirectory()) {
      const subFiles = await getVideoFiles(fullPath, relativePath);
      result.push({
        title: file,
        key: relativePath, // Ensure key is a string representing file path
        children: subFiles,
      });
    } else if (
      file.endsWith(".mp4") ||
      file.endsWith(".mkv") ||
      file.endsWith(".pdf")
    ) {
      result.push({
        title: file,
        key: relativePath, // Ensure key is a string representing file path
        isLeaf: true,
      });
    }
  }
  return result;
};

// 获取视频文件列表（返回tree结构）
router.get("/videos", async (ctx) => {
  try {
    const videos = await getVideoFiles(VIDEO_DIR);
    const records = await getPlaybackRecords();
    ctx.body = { videos, lastPlayedVideo: records.lastPlayedVideo || null };
  } catch (err) {
    ctx.status = 500;
    ctx.body = { error: "无法获取视频列表" };
  }
});

// 提供视频流
router.get(/^\/video(\/.*)?$/, async (ctx) => {
  const subPath = ctx.path.replace("/video", ""); // 提取子路径
  const videoPath = decodeURIComponent(subPath);
  const filePath = path.join(VIDEO_DIR, videoPath);

  console.log("Requested path:", filePath);

  if (!fs.existsSync(filePath)) {
    ctx.status = 404;
    ctx.body = "视频不存在";
    return;
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = ctx.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

    if (start >= fileSize) {
      ctx.status = 416;
      ctx.body =
        "Requested range not satisfiable\n" + start + " >= " + fileSize;
      return;
    }

    const chunkSize = end - start + 1;
    const file = fs.createReadStream(filePath, { start, end });
    const head = {
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": chunkSize + "",
      "Content-Type": "video/mp4",
    };

    ctx.set(head);
    ctx.status = 206;
    ctx.body = file;
  } else {
    const head = {
      "Content-Length": fileSize + "",
      "Content-Type": "video/mp4",
    };
    ctx.set(head);
    ctx.status = 200;
    ctx.body = fs.createReadStream(filePath);
  }
});

// 提供PDF文件
router.get("/pdf/:filename", async (ctx) => {
  const filename = decodeURIComponent(ctx.params.filename);
  const filePath = path.join(VIDEO_DIR, filename);

  if (!fs.existsSync(filePath)) {
    ctx.status = 404;
    ctx.body = "PDF文件不存在";
    return;
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;

  ctx.set({
    "Content-Length": fileSize + "",
    "Content-Type": "application/pdf",
  });
  ctx.status = 200;
  ctx.body = fs.createReadStream(filePath);
});

// 保存播放进度
router.post("/save-playback", async (ctx) => {
  const { filename, time } = ctx.request.body as {
    filename: string;
    time: number;
  };
  if (!filename || time === undefined) {
    ctx.status = 400;
    ctx.body = { error: "参数错误" };
    return;
  }
  await savePlaybackRecord(filename, time);
  ctx.body = { success: true };
});

// 获取播放记录
router.get("/playback-record", async (ctx) => {
  try {
    const records = await getPlaybackRecords();
    ctx.body = records;
  } catch (err) {
    ctx.status = 500;
    ctx.body = { error: "无法获取播放记录" };
  }
});

const PORT: number = Number(process.env.PORT) || 5000;
app.listen(PORT, "0.0.0.0", () => {
  const localIPs = getLocalIP();
  console.log("\x1B[32m%s\x1B[0m", "服务已启动：");

  localIPs.forEach((ip) => {
    console.log(`- 局域网访问地址：http://${ip}:${PORT}`);
  });

  console.log(`- 本机访问地址：http://localhost:${PORT}`);
});
