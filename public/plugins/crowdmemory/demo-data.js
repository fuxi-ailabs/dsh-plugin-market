// Illustrative data for this page, not a live plugin connection.
window.PLUGIN_DEMO = {
  "title": "两个 Agent，复用一条启动脚本经验",
  "description": "Agent 1 处理 apriltag-python 的启动脚本问题，组织中心结合 Pillow、TA-Lib 的记录形成 trial 卡片，Agent 2 在 RDKit 任务中采用并复测。",
  "blocks": [
    {
      "type": "list",
      "items": [
        "Agent 1 复现子进程未获得原生库目录的问题，修复启动脚本并运行测试，记录原因、修法和验证结果。",
        "中心聚合独立项目的来源，核对本机证据、修改约束与一致性，将卡片发布到组织 trial。",
        "Agent 2 收到组织卡片，调用 memory_read，按当前 RDKit 的 .libs 目录调整启动脚本，复测后通过 memory_note 引用该卡片。"
      ]
    }
  ],
  "note": "案例在本机两个独立 Runtime 中运行，验证范围为启动脚本的子进程环境传递。截图与视频对应同一份开发版 trial 任务记录，结果概述见视频运行说明。",
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
  "prompt": "在 macOS 或 Linux 中，使用已接入 Crowd Memory 的 DSH 重建视频的本机启动脚本任务。\n\n先确认两个 Runtime 使用独立端点和数据库，连接同一组织中心的 Raw、Release 和共享组，并启用本机取证。中心已载入 apriltag-python、Pillow、TA-Lib 的独立来源记录，按证据核验结果处理 trial 发布。来源为 https://gitcode.com/third-party-library-for-harmony/migbot-experience-raw，仅按需浅取所需记录。\n\n准备两个独立工作区。Agent 1 的 context.json 使用原生库目录 venv/lib/python3.12/site-packages/apriltag。Agent 2 使用 venv/lib/python3.12/site-packages/rdkit/.libs。任务核验父子进程的环境传递。两边使用下面的初始 launch-verification.sh。\n#!/usr/bin/env bash\nset -euo pipefail\nnative_dir=$1\nshift\nexec \"$@\"\n\n为每边准备 test-launch.py，使用 unittest 覆盖以下检查。\n1. 未继承路径时，子进程获得当前原生库目录。\n2. 继承已有路径时，结果为当前目录加原有路径。\n3. 搜索路径中没有空分量。测试通过启动脚本执行新的 Python 子进程读取 LD_LIBRARY_PATH。每次测试命令固定为 python3 test-launch.py。保存测试后，修复前后使用同一份测试文件。\n\nAgent 1 先运行测试记录失败，修复 launch-verification.sh，再运行同一命令复测。用 memory_note 记录原因、实际 diff、环境条件和测试结果，scope=global，topic_key=harmony/native-loader-launch。\n\n中心完成核验并发布 trial 后，确认节点 B 已同步卡片，再启动 Agent 2。Agent 2 先核对收到的组织卡片，用 memory_read 读取完整内容与出处，在自己的工作区复现失败，采用卡片中的做法并使用当前 RDKit 目录，只修改启动脚本，按原测试命令复测。最后用 memory_note 引用采用的组织卡片，展示推送、读取和引用记录。保留每次测试的退出码与输出。"
};
