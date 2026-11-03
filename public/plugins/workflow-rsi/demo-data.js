// Illustrative data for this page, not a live plugin connection.
window.PLUGIN_DEMO = {
  "title": "改进对象与一次真实闭环",
  "description": "先说明 workflow-rsi 改进的是什么样的 Workflow，再看一个已接入的多阶段 Workflow 在同一份输入上的两轮。事件取自闭环账本，时间为 UTC，诊断一行依次为处理方式、所属层、置信度。",
  "blocks": [
    {
      "type": "text",
      "title": "什么是静态工作流",
      "text": "静态工作流是结构随版本固定的 Workflow：有哪些阶段和节点、节点之间交接什么、在哪里分支、重试和设门禁，都写在 Workflow 仓的源码里；同一个版本对每个输入都按同一张结构图执行。每个节点用的模型、提示、Skill 和工具也随版本固定。运行时由 Agent 按输入临时决定步骤的编排属于动态工作流，不在 workflow-rsi 的改进范围内。"
    },
    {
      "type": "text",
      "title": "为什么只针对 ToD",
      "text": "ToD 即 to Developer：workflow-rsi 改进的是面向开发者、替开发者完成开发任务的静态工作流，例如从需求、分析、设计、计划到实现、构建与验证按固定阶段推进的工作流。这类工作流每个阶段都有可以自动判定的结果（构建是否通过、测试通过多少、覆盖率多少），能给出可重复的评测信号；改动可以用测试证明、以 PR 交付、合入后重跑同一任务复核。面向 ToB、ToC 业务的工作流，例如客服对话、业务审批、数据处理，暂不作为改进对象。"
    },
    {
      "type": "code",
      "title": "一个 ToD 静态工作流的结构",
      "codeLabel": "阶段与交接（示例中的 Workflow）",
      "code": "generate      准备任务与需求说明\n  ↓\nanalysis      分析代码与依赖\n  ↓\ndesign        设计改动方案\n  ↓\nplan          拆成可执行的步骤\n  ↓\nexecution     实现与构建\n  ↓\nverification  运行测试；失败时由 Repair 决定去向\n                safe_fix          → 有限修复后复测\n                request_redesign  → 交给 Redesign 重新设计\n                no_action         → 结束（no_safe_repair）"
    },
    {
      "type": "list",
      "title": "workflow-rsi 在这张结构图上能改什么",
      "items": [
        "结构：插入已审步骤、删除可选步骤、调整允许的交接、切换已审策略；门禁和受保护路径不能动。",
        "节点内容：指令、Skill、工具说明和模型选择，经 skill / agent RSI 接口改进。",
        "两类改动都在整个 Workflow 上分级评测，产出的是一个新的静态版本，以 PR 交付。"
      ]
    },
    {
      "type": "code",
      "title": "流程图：一轮改进",
      "codeLabel": "流程",
      "code": "改进入口：闭环、Memory 共性、请求、工作计划、假设驱动\n  ↓\n诊断：沿 Workflow 结构回溯，区分结构问题与节点内容问题\n  ↓\n生成候选\n  结构问题：已审批的结构算子 + 受约束搜索\n  节点内容问题：交给 skill / agent RSI 接口\n  ↓\n整体评测：分级打分；validation 选候选，holdout 定发布\n  ↓\nPR：人审、合入；合入后重跑原任务，跟踪改动是否被保留\n  ↓\nTrial 记录 → 评估改进方法，按收益分配预算"
    },
    {
      "type": "code",
      "title": "第 1 轮：诊断、改动、验证、提出 PR",
      "codeLabel": "闭环事件（UTC）",
      "code": "17:24  run.started\n17:26  stage generate    passed\n17:32  stage analysis    passed\n17:42  stage design      passed\n17:55  stage plan        passed\n17:59  stage execution   failed\n17:59  triage.decided    diagnose\n18:45  loop.escalated    diagnosis_low_confidence\n18:47  loop.resumed      fix\n21:07  loop.escalated    agent_failed\n21:10  loop.resumed      fix\n21:18  loop.escalated    diagnosis_low_confidence\n21:27  loop.resumed      fix\n21:50  diagnosis         engine_fix / contract / 0.9\n22:06  candidate         2 files, 45 lines\n22:07  validation        L1 passed, L2 passed, L3 inconclusive\n22:07  pr.opened         #469"
    },
    {
      "type": "text",
      "text": "第 1 轮在第 5 个阶段停下，报“输入无法准备”。workflow-rsi 确认输入本身合法，问题出在节点的输入检查规则；中间三次停下等人（两次把握不足，一次诊断 Agent 自身失败），人确认后继续。第四次诊断置信度 0.9，随后在独立分支生成 45 行改动和测试，L1、L2 通过后提出 PR，PR 合入。从 Run 停下到提出 PR 用时 4 小时 8 分钟，其中等人 14 分钟；模型用量约 3113 万 token，其中 2908 万为缓存命中。"
    },
    {
      "type": "code",
      "title": "第 2 轮：验证不过就不提交",
      "codeLabel": "闭环事件（UTC，节选）",
      "code": "09:01  run.started\n09:32  stage plan        passed\n10:03  stage execution   failed\n10:03  triage.decided    diagnose\n15:50  diagnosis         engine_fix / contract / 0.82\n17:20  candidate 1       timed_out, 0 files\n18:50  candidate 2       4 files, 133 lines\n                         scope: the fix agent named no test_command\n                         scope: spec: no change spec was delivered\n18:50  loop.gave_up      validation_exhausted"
    },
    {
      "type": "text",
      "text": "PR 合入后同一份输入再跑，Run 越过了原来的停止点，停在同一阶段的后一个节点。诊断指出这个节点只支持一种处理方式；第一次修复超时没有改动，第二次改动没有给出测试命令和改动说明，没有通过改动范围检查。workflow-rsi 不提 PR，把诊断结论留给人决定。"
    },
    {
      "type": "code",
      "title": "结构问题：补上阶段之间的交接",
      "codeLabel": "Repair 角色任务说明 · 改动前后",
      "code": "改动前\nApply one bounded safe fix, request Redesign, or report that\nno safe action exists from frozen verification evidence.\n\n改动后\nFrom frozen verification evidence, apply one bounded safe fix\n(safe_fix), or choose request_redesign, the only route to\nRedesign: use it when no bounded safe fix exists but a redesign\ncould address the failure. no_action ends Verification with\nno_safe_repair; choose it only when neither a safe fix nor a\nredesign can address the failure."
    },
    {
      "type": "text",
      "text": "另一次运行停在最后一个阶段：修复角色选择“不处理”之后流程没有出口，以修复预算耗尽结束。诊断定位到任务说明没有写清三种决定各自的去向，属于阶段之间的交接问题。修复只改了一句话并加了一条测试；再跑时，修复角色要求重新设计，流程正确交给了重新设计角色。"
    },
    {
      "type": "code",
      "title": "在 DSH 操作台里查看闭环并给出决定",
      "codeLabel": "发送给 DSH",
      "code": "/wrsi loop \u003cloop id>\n/wrsi loop-resume \u003cloop id> fix --confirm"
    },
    {
      "type": "image",
      "title": "安装后：插件页出现操作台",
      "src": "assets/console-plugins.jpg",
      "alt": "DSH 网页端「插件」页，已安装 workflow-rsi-dsh-console 并启用。",
      "caption": "真实截图：DSH 0.1.6-alpha.2 网页端，dsh plugin add 安装的 @fuxi-ailabs/workflow-rsi-dsh-console 0.1.0-alpha.1。"
    },
    {
      "type": "image",
      "title": "向 Agent 提问，它调用只读工具",
      "src": "assets/console-agent.jpg",
      "alt": "DSH 会话中 Agent 调用 wrsi_loop_status，再按状态汇总 11 个闭环。",
      "caption": "真实截图：Agent 调用 wrsi_loop_status，按真实闭环账本回答每个闭环的状态和停止原因。"
    },
    {
      "type": "image",
      "title": "/wrsi 命令：查看闭环，写操作先确认",
      "src": "assets/console-commands.jpg",
      "alt": "/wrsi status 与 /wrsi loop 的返回，以及 /wrsi loop-resume 不带 --confirm 时的 Not run 提示。",
      "caption": "真实截图：/wrsi status、/wrsi loop \u003cloop id> 返回原始数据；/wrsi loop-resume 不带 --confirm 时只显示将要执行的操作。"
    },
    {
      "type": "list",
      "title": "闭环停下时人可以给出的决定",
      "items": [
        "fix：重新诊断，再生成修复候选。",
        "rerun：不改动，重跑 Workflow，例如环境恢复之后。",
        "give-up：结束这个闭环。",
        "merge-done：PR 已在 Workflow 仓合入，开始重跑。",
        "写命令不带 --confirm 时只显示将要执行的操作，不执行。"
      ]
    }
  ],
  "note": "事件为真实闭环账本的原始记录，按时间排版。",
  "prompt": "/wrsi status\n/wrsi loop",
  "video": {
    "title": "安装并在 DSH 操作台查看闭环",
    "description": "前半段是安装：从 npm 装本体和操作台插件、启动 wrsi-server、写配置；后半段是 DSH 网页端的真实录屏：插件页、Agent 调用只读工具回答闭环状态、/wrsi status、/wrsi loop、不带 --confirm 的 /wrsi loop-resume。终端画面按实际命令输出与时间回放，服务 key 与网页 token 已打码；等待模型回答的部分 6 倍速。闭环数据是真实闭环账本的副本，由单独启动的 wrsi-server 提供。",
    "src": "assets/console-demo.mp4",
    "poster": "assets/console-demo-poster.jpg",
    "captions": "assets/console-demo-zh.vtt"
  }
};
