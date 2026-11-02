// Illustrative data for this page, not a live plugin connection.
window.PLUGIN_DEMO = {
  "title": "真实 coding 任务：修复移动导航并补回归测试",
  "description": "使用 dsh-plugin-market 仓库中现存的导航问题。Agent A 检查代码、复现并修复；Agent B 在另一个组件中核对并复用这条经验。两个任务都需要实际修改 JavaScript 和运行测试。",
  "blocks": [
    {
      "type": "list",
      "items": [
        "Agent A：复现菜单关闭后 aria-expanded 仍为 true 的问题，修复代码并补回归测试，再记录实际经验。",
        "Agent B：在独立工作区处理另一个组件，读取记录和来源，按当前代码调整修法并验证。",
        "本机两个 Agent 的经验复用；不是跨机器团队发布，也不是速度基准。"
      ]
    }
  ],
  "note": "真实 DSH 操作录像，包含运行后展开原始工具卡片；已剪去等待和设置，没有替换工具结果。请求模型名及完整版本见运行依据。",
  "video": {
    "title": "从读代码、修复、测试，到另一个 Agent 复用",
    "description": "npm adapter/runtime 0.1.0，DSH 0.1.6-alpha.2。中文字幕说明任务进展，原始工具结果保留原貌。",
    "src": "assets/coding-agent-demo.mp4",
    "poster": "assets/coding-agent-poster.jpg",
    "captions": "assets/coding-agent-zh.vtt"
  },
  "prompt": "在一个干净的 dsh-plugin-market 工作区中，检查 public/plugins/crowdmemory/docs.js 的移动导航：打开菜单后点击目录链接，视觉上菜单关闭，但 aria-expanded 状态是否一致？先补测试复现，再修复并验证，最后记录实际经验。另开独立工作区的 Agent，检查 workflow-rsi 的同类导航问题，查阅相关记忆、核对代码后修复并测试。"
};
