// Illustrative data for this page, not a live plugin connection.
window.PLUGIN_DEMO = {
  "title": "查清发布说明的三次改动",
  "description": "",
  "prompt": "请用 DSH 的 write 工具创建 release-note.md，内容为“# 搜索功能发布说明\\n功能：新增搜索\\n状态：草稿”；再用 edit 分两次修改：先把“新增搜索”改为“支持标题和标签搜索”，再把“草稿”改为“待评审”。不要使用 shell 写文件。完成后刷新当前会话的 Lineage 快照，查询这个文件的三次写入，给出来源会话、调用、成功回执和原文引用。",
  "note": "页面演示使用固定示例数据；视频录自真实的 DSH 会话。",
  "video": {
    "title": "52 秒：查询改动，查看原始记录",
    "description": "录屏包含创建文件、两次修改、查询，以及在 Viewer 中展开 diff 和原文的操作。附中文字幕，已剪去登录和等待过程。",
    "src": "assets/dsh-release-note-demo.mp4",
    "poster": "assets/dsh-release-note-poster.jpg",
    "captions": "assets/dsh-release-note-zh.vtt"
  },
  "interactive": {
    "type": "file-history",
    "label": "交互演示 · 固定示例数据",
    "file": "release-note.md",
    "question": "谁把发布说明的状态改成了“待评审”？",
    "answer": "第 3 次操作来自会话 demo-session-01：用 edit 把“草稿”改为“待评审”，并收到成功回执。",
    "session": "demo-session-01",
    "ui": {
      "events": "文件操作",
      "context": "来源会话",
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
        "description": "写入最初的功能说明，状态为“草稿”。",
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
        "description": "把“新增搜索”改为“支持标题和标签搜索”。",
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
        "description": "把状态从“草稿”改为“待评审”。",
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
    ]
  }
};
