// Code-native wireframes, deliberately labelled as placeholders, not screenshots.
export function comparisonPlaceholder(after) {
  const color = after ? '#c1fa74' : '#9cabbc';
  const cards = after
    ? `<path d="M405 324h45m335 0h45" stroke="#6c8b47" stroke-width="2"/><path d="m441 318 9 6-9 6m335-12 9 6-9 6" fill="none" stroke="#c1fa74" stroke-width="2"/>${['最小输入','插件处理','可核对的输出'].map((t,i)=>`<rect x="${70+i*380}" y="240" width="335" height="170" rx="10" fill="#141e12" stroke="#526c37"/><text x="${100+i*380}" y="282" class="small">0${i+1}</text><text x="${100+i*380}" y="335" class="label">${t}</text><text x="${100+i*380}" y="373" class="body">替换为你的真实材料</text>`).join('')}`
    : `${['手动准备输入','逐项执行操作','自己核对结果'].map((t,i)=>`<rect x="70" y="${196+i*112}" width="1140" height="90" rx="8" fill="#121922" stroke="#303b48"/><text x="99" y="${250+i*112}" class="small">0${i+1}</text><text x="171" y="${251+i*112}" class="label">${t}</text><path d="M750 ${228+i*112}h410m-410 18h285m-285 18h360" stroke="#2b3643" stroke-width="5" stroke-linecap="round"/>`).join('')}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720"><style>text{font-family:'Segoe UI','Microsoft YaHei',sans-serif}.small{font-size:18px;fill:${color};letter-spacing:2px}.label{font-size:25px;fill:#edf2f7}.body{font-size:18px;fill:#8493a6}</style><rect width="1280" height="720" fill="#0a0e14"/><rect x="28" y="28" width="1224" height="664" rx="14" fill="none" stroke="#27313d"/><text x="70" y="94" class="small">${after ? 'AFTER / YOUR PLUGIN' : 'BEFORE / CURRENT WORKFLOW'}</text><text x="70" y="146" class="label">${after ? '让输入、操作和结果更清楚' : '说明用户原本如何完成这个任务'}</text>${cards}<path d="M70 596h1140" stroke="#27313d"/><text x="70" y="641" class="body">布局占位示意 · 请替换为同一个真实任务的截图</text></svg>\n`;
}

export function previewContent(starter) {
  const p = structuredClone(starter);
  p.category = 'PLUGIN PAGE / TEMPLATE';
  p.description = '在这里用一句话说明：插件解决什么问题，用户提供什么，以及最后会得到什么。';
  p.comparison.before.image = 'assets/before.svg';
  p.comparison.before.alt = '布局占位示意：手动准备输入、逐项执行、核对结果；不是真实运行截图。';
  p.comparison.after.image = 'assets/after.svg';
  p.comparison.after.alt = '布局占位示意：最小输入、插件处理、可核对的输出；不是真实运行截图。';
  p.example.note = '此处用于评审交互方式，步骤与结果均为占位示意。发布实际插件前，替换成可核对的最小例子。';
  p.links = [
    {label:'模板填写说明 ↗',url:'https://github.com/fuxi-ailabs/dsh-plugin-market/blob/main/docs/plugin-page-template.md'},
    {label:'查看已套用实例 ↗',url:'https://fuxi-ailabs.github.io/dsh-plugin-market/plugins/agentlineage/'},
  ];
  return p;
}
