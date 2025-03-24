# 局域网视频列表播放器

因为某些教程类视频是下载到电脑的，方便局域网下观看就整了这个项目。实际上chatgpt老师和deepseek老师开发量比较多一些。我就给他们打打下手修修bug，一晚上就搞定了还是很强的。


clone后在项目根目录下创建.env 文件，并写上

```
VIDEO_DIR="你的视频文件夹绝对路径"
PORT="后端服务端口号"   （这行可以不写）
```

# 安装依赖

```
npm i
```

# 开发时运行前端

```
npm run dev
```

# 开发时运行后端

```
npm run s:dev
```

# 打包

```
npm run build
npm run s:build
```

# 运行

```
npm run s:start
```
