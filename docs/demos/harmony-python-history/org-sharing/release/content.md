# 启动脚本未导出 LD_LIBRARY_PATH 致 libapriltag.so 加载失败

launch-verification.sh 收了原生库目录却未导出给子进程，libapriltag.so 不在链接器搜索路径，三项测试全部失败。

## 适用范围

{"arch": [], "ecosystems": [], "evidence_refs": ["sha256:4cfde6905dfc6e7b7f5664c34d11d31ae6df0ceb46a4376f2fc5f5c149c7b4cd"], "excludes": [], "generalization_source": "agent_note", "generalized": {}, "libraries": [], "library_policy": "any", "observed": {"dimension:os": "darwin", "dimension:project": "org-python-adaptation", "files": [], "phase": "session", "project": "org-python-adaptation", "scope": "global", "signatures": ["sha256:0ea93b8c0674fabbce5171113b11d2855d71aa3393c7eed7fabe5a777c5257af", "sha256:298865b978c2ec32b5aeadf649bbe9bc952d5abc6cc2b2768c0f6a0728d26cd0"], "symbols": [], "template": "session-default@3", "tools": ["bash"], "topic_key": "harmony/native-loader-launch", "type": "bugfix", "where": "来源档案 am-347d912831feb751855892df；固定提交 343c60fd2309dbf1edf6d3169b80838c54e1f1cd；workspace 内 launch-verification.sh（apriltag-python 3.4.5 验证启动脚本）。"}, "os": ["darwin"], "requires": [], "runtimes": [], "sdk_range": null, "stages": ["session"], "toolchain": []}

## 症状

- [s-82e02a03f9e7f985] launch-verification.sh 收了原生库目录却未导出给子进程，libapriltag.so 不在链接器搜索路径，三项测试全部失败。（session，来源：agent_note）

## 根因

- [hypothesis/agent_note] musl 下 DT_NEEDED 只按动态链接器搜索路径解析；wheel 未嵌 RPATH，PYTHONPATH、运行时改 os.environ、预加载都无效。
- [hypothesis/agent_note] exec 前加 export LD_LIBRARY_PATH="$native_dir${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}"；换库改 native_dir 指新库 site-packages/<pkg>

## 尝试链

- 无可机械确认的尝试。
## 已通过修法

- 尚无机械验证通过的修法；本记录只能用于诊断。

## 不适用条件


## 验证标准


## 使用约束

