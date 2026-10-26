// Illustrative data for this page, not a live plugin connection.
window.PLUGIN_DEMO = {
  "title": "一份发布说明，三次操作。",
  "description": "不用安装，先点下面的记录：看看一句“改好了”，如何拆成可以核对的修改过程。",
  "label": "交互演示 · 固定示意数据",
  "file": "release-note.md",
  "question": "谁把发布说明的状态改成了“待评审”？",
  "answer": "第 3 次操作：来源会话 demo-session-01，用 edit 把“草稿”改为“待评审”，并收到了成功回执。",
  "session": "demo-session-01",
  "ui": {
    "events": "文件操作",
    "context": "SOURCE SESSION",
    "contextNote": "每条操作都有对应来源",
    "changeTab": "文件变化",
    "evidenceTab": "调用与回执",
    "action": "工具",
    "contextField": "来源会话",
    "request": "调用引用",
    "result": "成功回执引用",
    "resultText": "回执内容",
    "status": "成功回执"
  },
  "initial": "# 搜索功能发布说明\n功能：新增搜索\n状态：草稿",
  "operations": [
    {
      "tool": "write",
      "title": "创建发布说明",
      "description": "写入最初的功能说明与草稿状态。",
      "removed": [],
      "added": [
        "# 搜索功能发布说明",
        "功能：新增搜索",
        "状态：草稿"
      ],
      "result": "文件创建成功",
      "requestRef": "demo:call-01",
      "resultRef": "demo:result-01"
    },
    {
      "tool": "edit",
      "title": "补充搜索范围",
      "description": "把功能描述细化为标题与标签搜索。",
      "removed": [
        "功能：新增搜索"
      ],
      "added": [
        "功能：支持标题和标签搜索"
      ],
      "result": "文本替换成功",
      "requestRef": "demo:call-02",
      "resultRef": "demo:result-02"
    },
    {
      "tool": "edit",
      "title": "更新评审状态",
      "description": "把状态从草稿改成待评审。",
      "removed": [
        "状态：草稿"
      ],
      "added": [
        "状态：待评审"
      ],
      "result": "文本替换成功",
      "requestRef": "demo:call-03",
      "resultRef": "demo:result-03"
    }
  ],
  "prompt": "请用 DSH 的 write 工具创建 release-note.md，内容为“# 搜索功能发布说明\\n功能：新增搜索\\n状态：草稿”；再用 edit 分两次修改：先把“新增搜索”改为“支持标题和标签搜索”，再把“草稿”改为“待评审”。不要使用 shell 写文件。完成后刷新当前会话的 Lineage 快照，查询这个文件的三次写入，给出来源会话、调用、成功回执和原文引用。",
  "note": "上方交互使用固定示意数据，不连接你的会话。下方视频录自真实 DSH 操作；复制提示词可在自己的 DSH 中复现。",
  "video": {
    "label": "REAL DSH RECORDING",
    "title": "52 秒真实操作：从发布说明到原始证据",
    "description": "DSH 实际执行一次 write、两次 edit，再查询三次确认写入并在 Viewer 展开 diff 与原文。静音录像，默认中文字幕；登录与等待已剪去，本机路径已隐藏。",
    "src": "assets/dsh-release-note-demo.mp4",
    "poster": "assets/dsh-release-note-poster.jpg",
    "captions": "assets/dsh-release-note-zh.vtt"
  }
};
