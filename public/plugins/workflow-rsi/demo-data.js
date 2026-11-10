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
      "type": "text",
      "title": "静态工作流插件与结构搜索（开发版）",
      "text": "在 DSH 里，静态工作流插件用 /workflow 运行定义文件里的工作流，会话里有运行节点和看板；/workflow-revisions 把 RSI 写出的修订文件导入会话，看板的演化视图在同一棵逻辑树上显示各版本的差分、其他候选没被选中的原因和验证阶梯。RSI 一侧，wie structure improve 用一条命令完成结构搜索、archive、提案和验证阶梯 L0～L3，最后写出修订文件。这两部分目前在 workflow-rsi 的开发分支 feat/dsh-native-workflow 上，尚未发布到 npm；下方的演示视频从源码安装一直录到第 2 版通过。"
    },
    {
      "type": "list",
      "title": "演示视频里的例子：依赖版本这一步怎样演进",
      "items": [
        "目的：从一次失败的真实运行出发，看 RSI 把「依赖版本选择」演进成「依赖版本求解」子图，并在另外四个库上验证后提出新版本。",
        "工作流：flow.yaml，六个阶段 generate、analysis、design、plan、execution、verification，每个阶段是一个子图；角色 adapter、checker。",
        "适配任务：airda 0.0.3，scikit-learn 1.9.1 要求 numpy ≥ 1.24.1，langchain 0.1.0 要求 numpy ≥ 1、\u003c 2；已适配仓库里的 numpy 为 1.21.6、1.26.4、2.5.1。",
        "RSI 的输入：停止记录、loop 配置、两个人准入的结构算子（插入依赖版本求解子图、删去旧的版本选择节点）、range-b 与 source-c 组成的验证集、range-d 与 source-e 组成的 holdout、judge。",
        "结果：第 1 版取最新的 numpy 2.5.1，运行测试失败；提案 s1/2 插入依赖版本求解子图，区间内取已适配的 1.26.4，第 2 版从分析阶段续跑，测试全部通过。依赖约束与版本是演示数据，节点由本地确定性替身模型执行。"
      ]
    },
    {
      "type": "code",
      "title": "开发版：从源码安装与配置",
      "codeLabel": "终端 · 开发版（演示视频中的步骤）",
      "code": "# 前提：Node 22、DSH 0.2.2、pnpm（dsh plugin 安装插件时使用），以及 GitCode 上 workflow-rsi 仓库的读权限\ngit clone -b feat/dsh-native-workflow https://gitcode.com/third-party-library-for-harmony/workflow-rsi.git workflow-rsi\n(cd workflow-rsi && npm ci && npm run build)\nnpm install --global --prefix tools ./workflow-rsi      # 得到 wie、wrsi-staticflow\nexport PATH=\"$PWD/tools/bin:$PATH\"\n\n# DSH：新建 profile，加载静态工作流插件的引擎和插件包\ndsh --profile staticflow --from-default-profile web --dump-config >/dev/null\ndsh plugin --profile staticflow add ./workflow-rsi/packages/dsh-static-workflow-engine ./workflow-rsi/packages/dsh-static-workflow-bundle\n# 再写 profile 补丁 \u003cDSH_HOME>/profiles/staticflow/cordis.patch.yml：\n# 模型的 provider 与密钥环境变量，staticflow-command 的 revisionsDir（修订收件目录）\n\n# RSI：judge 与停止族策略校验后提交待审，结构算子提交待审，由人准入\nwie judge import --dir \u003cjudge 与策略所在目录>\nwie asset register --kind structure-op --id \u003c算子 id> --file \u003c算子.json> --visibility infra-only --submit\nwie asset admit --uri \u003c资产 URI>\n# 基线 run、验证集与 holdout 准备好后，一条命令完成结构搜索与验证\nwie structure improve --loop-config \u003cloop 配置> --base-stop \u003c停止记录>"
    },
    {
      "type": "code",
      "title": "在 DSH 里：运行、导入修订、续跑",
      "codeLabel": "发送给 DSH",
      "code": "/workflow flow.yaml runs/demo\n/workflow-revisions\n/workflow --resume runs/demo --rerun analysis"
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
    "title": "静态工作流自演进：依赖版本节点的演化",
    "description": "约 234 秒中文配音，画面标注开发版 / 演示。先说明组件解决的问题和例子的输入，再从源码安装、配置 DSH 插件与 RSI；之后在 DSH 里运行第 1 版（停在运行测试），RSI 用一条命令完成结构搜索与验证阶梯 L0～L3，/workflow-revisions 导入修订后在看板的演化视图里查看新增的依赖版本求解子图，第 2 版从分析阶段续跑，测试全部通过。静态工作流插件与 wie structure improve 在开发分支 feat/dsh-native-workflow 上，尚未发布到 npm；依赖约束与版本是演示数据，节点由本地确定性替身模型执行，终端画面按实际命令输出回放。视频为 1080p，字幕已烧录，画面中的路径为演示目录。",
    "src": "assets/staticflow-rsi-demo-1080p.mp4",
    "poster": "assets/staticflow-rsi-demo-preview.jpg",
    "qualities": [
      {
        "label": "1080p",
        "src": "assets/staticflow-rsi-demo-1080p.mp4"
      }
    ],
    "captions": "assets/staticflow-rsi-demo-zh.vtt",
    "captionsBurnedIn": true,
    "standalone": true
  }
};
