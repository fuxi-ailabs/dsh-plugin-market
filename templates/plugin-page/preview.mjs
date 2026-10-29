// Code-native wireframes, deliberately labelled as placeholders, not screenshots.
export function heroPlaceholder() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720"><style>text{font-family:'Segoe UI','Microsoft YaHei',sans-serif;text-anchor:middle}.title{font-size:38px;fill:#1c2b35}.body{font-size:28px;fill:#52616d}</style><rect width="1280" height="720" fill="#f1f6f4"/><rect x="48" y="48" width="1184" height="624" rx="16" fill="#fff" stroke="#aacbbc" stroke-width="2" stroke-dasharray="12 10"/><g fill="none" stroke="#75a991" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><rect x="588" y="168" width="104" height="80" rx="10"/><circle cx="660" cy="192" r="9"/><path d="m596 236 27-29 21 22 14-13 26 23"/></g><text x="640" y="338" class="title">插件截图 / 概览图 / 代表图</text><text x="640" y="572" class="body">图片占位</text></svg>\n`;
}

export function comparisonPlaceholder(after) {
  const color = after ? '#17634d' : '#52616d';
  const cards = after
    ? `<path d="M405 324h45m335 0h45" stroke="#75a991" stroke-width="2"/><path d="m441 318 9 6-9 6m335-12 9 6-9 6" fill="none" stroke="#17634d" stroke-width="2"/>${['最小输入','插件处理','可核对的输出'].map((t,i)=>`<rect x="${70+i*380}" y="240" width="335" height="170" rx="10" fill="#edf7f2" stroke="#aacbbc"/><text x="${100+i*380}" y="282" class="small">0${i+1}</text><text x="${100+i*380}" y="335" class="label">${t}</text><text x="${100+i*380}" y="373" class="body">示意内容</text>`).join('')}`
    : `${['手动准备输入','逐项执行操作','自己核对结果'].map((t,i)=>`<rect x="70" y="${196+i*112}" width="1140" height="90" rx="8" fill="#ffffff" stroke="#d6e0e5"/><text x="99" y="${250+i*112}" class="small">0${i+1}</text><text x="171" y="${251+i*112}" class="label">${t}</text><path d="M750 ${228+i*112}h410m-410 18h285m-285 18h360" stroke="#dce5eb" stroke-width="5" stroke-linecap="round"/>`).join('')}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720"><style>text{font-family:'Segoe UI','Microsoft YaHei',sans-serif}.small{font-size:18px;fill:${color};letter-spacing:2px}.label{font-size:25px;fill:#1c2b35}.body{font-size:18px;fill:#626f7a}</style><rect width="1280" height="720" fill="#f7f9fb"/><rect x="28" y="28" width="1224" height="664" rx="14" fill="none" stroke="#d6e0e5"/><text x="70" y="94" class="small">${after ? '使用后' : '使用前'}</text><text x="70" y="146" class="label">${after ? '输入、操作与结果' : '原有操作流程'}</text>${cards}<path d="M70 596h1140" stroke="#d6e0e5"/><text x="70" y="641" class="body">截图占位</text></svg>\n`;
}

export function previewContent(starter) {
  const p = structuredClone(starter);
  p.heroMedia.image = 'assets/overview.svg';
  p.heroMedia.alt = '插件截图、概览图或代表图占位。';
  for (const block of p.example.blocks || []) {
    if (block.type === 'image' && block.src === 'assets/demo.jpg') block.src = 'assets/demo.svg';
  }
  p.comparison.before.image = 'assets/before.svg';
  p.comparison.before.alt = '布局占位示意：手动准备输入、逐项执行、核对结果；不是真实运行截图。';
  p.comparison.after.image = 'assets/after.svg';
  p.comparison.after.alt = '布局占位示意：最小输入、插件处理、可核对的输出；不是真实运行截图。';
  p.links = [
    {label:'模板文档 ↗',url:'https://github.com/fuxi-ailabs/dsh-plugin-market/blob/main/docs/plugin-page-template.md'},
    {label:'AgentLineage ↗',url:'https://fuxi-ailabs.github.io/dsh-plugin-market/plugins/agentlineage/'},
  ];
  return p;
}
