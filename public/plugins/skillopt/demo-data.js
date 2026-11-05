// Illustrative data for this page, not a live plugin connection.
window.PLUGIN_DEMO = {
  "title": "从已有条款到独立复测",
  "description": "参考 MigBot-Lab 与 a2h-opt-loop 的通用主链，运行在本机 DSH，不依赖 Android 或 HarmonyOS。",
  "blocks": [
    {
      "type": "list",
      "items": [
        "选择已有 skill → 固定文本快照，读取可选证据。",
        "分析真实条款 → 训练作者和独立作者分别出题 → 校验引用与正反样例。",
        "原生 DSH 重复执行基线 → 修改候选 → 逐题保留无回归的改进，最多三个候选。",
        "最终独立复测 → 查看差异 → 合格后由人应用 → 新会话加载，必要时回退。"
      ]
    },
    {
      "type": "image",
      "src": "assets/automatic-suite.jpg",
      "alt": "真实说人话实验的自动出题、样例自检和基线评测结果",
      "caption": "真实 skill 副本，合成验收样例。自动准备提取5条约束、生成2道训练题和2道独立题；4组正反样例检查通过。基线2题各跑2次均通过，实验停止为 no_change，没有进入候选修改或独立准出。"
    },
    {
      "type": "text",
      "text": "提供资产发现、选定轨迹取证、问题归因、自动出题、反思式候选优化、独立语义判据，以及项目版本应用与回退。"
    }
  ]
};
