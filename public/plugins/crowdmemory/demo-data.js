// Illustrative data for this page, not a live plugin connection.
window.PLUGIN_DEMO = {
  "title": "libpng：从信息读取到图片读写",
  "description": "两个独立工程接入真实 libpng 1.6.59。A 先处理 PNG 信息读取工具的链接失败；B 接手另一个图片读写工程，核对 A 的经验后重新构建与测试。",
  "blocks": [
    {
      "type": "list",
      "items": [
        "左侧 A：实际构建，复现 png_image_* 未定义符号，核对 CMake 链接配置。",
        "A：修复链接与本机头文件版本混用，运行测试，再用 memory_note 记录原因、条件和命令。",
        "右侧 B：在新工作区复现另一个目标的失败，用 memory_search、memory_read 核对 A 的来源记录。",
        "B：按当前目标调整配置，验证 PNG 解码、编码、重新读取后的像素一致性。"
      ]
    }
  ],
  "note": "这是可复现的三方库接入示例，libpng 本身未修改。两个 Agent 在同一台机器的独立工作区依次运行，按阶段并排回看；不比较耗时。原始提示、人工恢复、测试和读取回执见运行依据。",
  "video": {
    "title": "两个 Agent，一份可核对的 libpng 构建经验",
    "description": "约 77 秒中文配音讲解，字幕已嵌入画面，建议全屏观看。双屏交代两个 Agent 的关系，讲到关键步骤时切换放大查看；Runtime 与适配器均为 0.1.1。",
    "src": "assets/coding-agent-demo.mp4",
    "poster": "assets/coding-agent-poster.jpg",
    "captions": "assets/coding-agent-zh.vtt",
    "captionsBurnedIn": true
  },
  "prompt": "在 libpng 接入示例的独立工作区中，先构建 info 目标并复现失败，核对 CMake 依赖、头文件与二进制版本，修复后运行 PNG 信息读取测试；用 memory_note 记录实际原因、修法、验证和适用条件，scope=global，topic_key=libpng/cmake-link-target。再让另一个独立 Agent 处理 roundtrip 目标，先复现失败，再搜索和读取记忆，核对当前目标名与环境，修复后验证 PNG 解码、编码、重新读取的像素一致性。不要修改三方库或用硬编码输出代替测试。"
};
