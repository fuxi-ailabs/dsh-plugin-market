// Illustrative data for this page, not a live plugin connection.
window.PLUGIN_DEMO = {
  "title": "同一后端问题，四个 Agent",
  "description": "GET 与 POST 共用一段 HTTP 处理代码，四个独立工作区遇到同类请求错误。上排先修复 GET，下排接手 POST。",
  "blocks": [
    {
      "type": "list",
      "items": [
        "左上 A：独立定位和修复 GET，不写共享记忆。",
        "左下 B：在新工作区接手 POST，独立排查并补接口测试。",
        "右上 C：修复 GET 并测试后，用 memory_note 记录修法和适用条件。",
        "右下 D：用 memory_search、memory_read 读取 C 的记录，核对公共 HTTP 层，再修改 POST 并测试。"
      ]
    }
  ],
  "note": "左列独立排查，右列通过同一 Runtime 共享记忆。四个 Agent 在独立工作区运行，截图按任务阶段整理；任务条件和结果概述见后端接口示例运行说明。",
  "video": {
    "title": "鸿蒙 PC Python 三方库适配中的组织经验复用",
    "description": "约 153 秒连续中文配音，画面标注开发版 / trial。剪辑展示组织中心、双 Runtime 与 Adapter 配置、证据聚合和组织试推发布，再看 DSH 中卡片推送、读取、RDKit 脚本修改与复测。两个节点在本机运行，核验范围为启动脚本的环境传递。视频为 1080p。",
    "src": "assets/harmony-python-demo-1080p-redacted.mp4",
    "poster": "assets/harmony-python-preview-redacted.jpg",
    "qualities": [
      {
        "label": "1080p",
        "src": "assets/harmony-python-demo-1080p-redacted.mp4"
      }
    ],
    "captions": "assets/harmony-python-zh.vtt",
    "captionsBurnedIn": true,
    "standalone": true
  },
  "prompt": "在 CrowdMemory 的干净源码工作区中，检查 distributions/memory-runtime/src/crowdmemory_runtime/server.py：带协议头的 GET /v1/status 遇到 Content-Length: abc 时直接断连。先用真实 HTTP/Unix socket 测试复现，再修复为结构化 JSON 400，确认正常请求和过大请求的行为不回归。验证后记录实际经验；再让独立工作区的 Agent 读取记录，核对并修复 POST 入口，运行接口测试。确保 Python 3.11、pytest 和项目依赖已就绪，且实际导入当前工作区的源码。"
};
