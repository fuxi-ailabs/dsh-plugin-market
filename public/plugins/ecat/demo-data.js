// Illustrative data for this page, not a live plugin connection.
window.PLUGIN_DEMO = {
  "title": "怎么用：把一个安卓仓迁移到鸿蒙仓",
  "description": "每步发一条命令。",
  "note": "交互使用固定示意数据，不读取你的工程；下方对比图是两种做法的差别示意。",
  "prompt": "/ecat-setup 把安卓工程 ./android 迁移到鸿蒙工程 ./harmony，编译必须通过",
  "interactive": {
    "type": "file-history",
    "label": "操作演示 · 固定示意",
    "file": "DSH 输入框",
    "question": "把安卓工程迁移到鸿蒙工程，按什么顺序发？",
    "answer": "setup 写判据 → preflight 核对 → start 跑起来 → status 看分数 → stop 收手。",
    "session": "demo-usage",
    "ui": {
      "events": "步骤",
      "context": "发送位置",
      "changeTab": "发送内容",
      "evidenceTab": "会发生什么",
      "action": "命令",
      "contextField": "位置",
      "request": "发送",
      "result": "返回",
      "resultText": "结果",
      "status": "已完成"
    },
    "operations": [
      {
        "tool": "setup",
        "title": "写判据",
        "description": "描述任务与验收标准。",
        "removed": [],
        "added": [
          "/ecat-setup 把安卓工程 ./android 迁移到鸿蒙工程 ./harmony，编译必须通过"
        ],
        "result": "访谈后生成 ecat.config.yaml 和维度插件",
        "requestRef": "DSH 输入框",
        "resultRef": "ecat.config.yaml + 维度插件"
      },
      {
        "tool": "preflight",
        "title": "核对配置",
        "description": "只检查，不改动。",
        "removed": [],
        "added": [
          "/ecat-refine preflight"
        ],
        "result": "列出配置项与 FAIL/WARN 计数",
        "requestRef": "DSH 输入框",
        "resultRef": "终端输出"
      },
      {
        "tool": "start",
        "title": "启动",
        "description": "后台跑。",
        "removed": [],
        "added": [
          "/ecat-refine start"
        ],
        "result": "返回 pid 与日志路径，循环开始迭代",
        "requestRef": "DSH 输入框",
        "resultRef": ".ecat/runs_*/run.log"
      },
      {
        "tool": "status",
        "title": "看分数",
        "description": "查进度。",
        "removed": [],
        "added": [
          "/ecat-refine status"
        ],
        "result": "最新 H、各维度得分、最近 8 轮曲线",
        "requestRef": "DSH 输入框",
        "resultRef": "终端输出"
      },
      {
        "tool": "stop",
        "title": "停止",
        "description": "收手。",
        "removed": [],
        "added": [
          "/ecat-refine stop"
        ],
        "result": "停止循环，记录留在 .ecat/runs_*/",
        "requestRef": "DSH 输入框",
        "resultRef": ".ecat/runs_*/ 保留"
      }
    ]
  },
  "video": {
    "title": "用右侧栏面板跑一轮 ECAT",
    "description": "约 64 秒演示：/ecat-setup 访谈 → 环境自检 → /ecat-refine ui 打开右侧栏面板 → 开始 / 停止、实时看生成器与判别器在做什么 → 6 轮 H 从 0.8250 收敛到 0.0000 → 装到模拟器验收。",
    "src": "assets/ecat-demo-1080p.mp4",
    "poster": "assets/ecat-demo-poster.jpg",
    "qualities": [
      {
        "label": "1080p · 流畅",
        "src": "assets/ecat-demo-1080p.mp4"
      },
      {
        "label": "720p · 省流",
        "src": "assets/ecat-demo-720p.mp4"
      }
    ],
    "captions": "assets/ecat-demo-zh.vtt"
  }
};
