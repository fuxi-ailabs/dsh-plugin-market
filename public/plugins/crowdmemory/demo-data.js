// Illustrative data for this page, not a live plugin connection.
window.PLUGIN_DEMO = {
  "title": "后端 API 修复与测试",
  "description": "真实 HTTP 接口遇到非法 Content-Length 时直接断连。Agent A 阅读 Python 服务端代码，复现 GET 请求并修复；Agent B 在独立工作区读取经验，核对 POST 入口并补接口回归测试。",
  "blocks": [
    {
      "type": "list",
      "items": [
        "Agent A：发送真实 HTTP 请求，复现异常断连，修改请求校验并补 pytest 测试。",
        "Agent B：读取修复记录与来源，核对 POST 入口，在另一份干净源码上修复并验证。",
        "接口测试经过实际 Unix socket，检查 HTTP 状态、JSON 错误结构和后续正常请求；本机复用，不是速度基准。"
      ]
    }
  ],
  "note": "真实 DSH 操作录像，包含运行后展开原始工具卡片；已剪去等待和设置，没有替换工具结果。示例源码测试需要 Python 3.11、pytest 及项目依赖；版本和运行依据见页脚链接。",
  "video": {
    "title": "从接口断连，到结构化错误响应与回归测试",
    "description": "DSH 0.1.6-alpha.2，记忆服务为 npm adapter/runtime 0.1.0；接口修复运行在独立源码快照上。中文字幕说明任务进展，原始工具结果保留原貌。",
    "src": "assets/coding-agent-demo.mp4",
    "poster": "assets/coding-agent-poster.jpg",
    "captions": "assets/coding-agent-zh.vtt"
  },
  "prompt": "在 CrowdMemory 的干净源码工作区中，检查 distributions/memory-runtime/src/crowdmemory_runtime/server.py：带协议头的 GET /v1/status 遇到 Content-Length: abc 时直接断连。先用真实 HTTP/Unix socket 测试复现，再修复为结构化 JSON 400，确认正常请求和过大请求的行为不回归。验证后记录实际经验；再让独立工作区的 Agent 读取记录，核对并修复 POST 入口，运行接口测试。确保 Python 3.11、pytest 和项目依赖已就绪，且实际导入当前工作区的源码。"
};
