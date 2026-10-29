const requireText = (value, name) => {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`Missing page content: ${name}`);
};
const requireList = (value, name, min) => {
  if (!Array.isArray(value) || value.length < min) throw new Error(`Expected ${min}+ items: ${name}`);
};
export function validateContent(p) {
  if (!/^[a-z0-9-]+$/.test(p.slug)) throw new Error('Invalid plugin slug');
  for (const key of ['name','version','compatibility','description']) requireText(p[key], key);
  for (const key of ['code','codeLabel','note']) requireText(p.install?.[key], `install.${key}`);
  for (const key of ['headline']) {
    requireList(p[key], key, 2); p[key].forEach(v => requireText(v, key));
  }
  for (const key of ['image','alt','title']) requireText(p.heroMedia?.[key], `heroMedia.${key}`);
  if (!/^assets\/[a-z0-9-]+\.jpg$/.test(p.heroMedia.image)) throw new Error('Hero image must be a local reviewed JPEG');
  const x = p.example;
  requireText(x?.title, 'example.title');
  if (x.blocks !== undefined) requireList(x.blocks, 'example.blocks', 0);
  for (const block of x.blocks || []) {
    switch (block.type) {
      case 'text': requireText(block.text, 'demo text'); break;
      case 'list': requireList(block.items, 'demo list', 1); block.items.forEach(item => requireText(item, 'demo list item')); break;
      case 'code': requireText(block.code, 'demo code'); break;
      case 'image':
        requireText(block.alt, 'demo image alt');
        if (!/^assets\/[a-z0-9-]+\.jpg$/.test(block.src)) throw new Error('Demo image must be a local reviewed JPEG');
        break;
      default: throw new Error(`Unknown demo block: ${block.type}`);
    }
  }
  if (x.video) {
    requireText(x.video.title, 'video.title');
    if (x.video.loop !== undefined && typeof x.video.loop !== 'boolean') throw new Error('video.loop must be true or false');
    if (!/^assets\/[a-z0-9-]+\.(mp4|webm)$/.test(x.video.src) || !/^assets\/[a-z0-9-]+\.jpg$/.test(x.video.poster) || !/^assets\/[a-z0-9-]+\.vtt$/.test(x.video.captions)) throw new Error('Video, poster and captions must be reviewed local assets');
  }
  if (x.interactive) {
    const d = x.interactive;
    if (d.type !== 'file-history') throw new Error('Unknown interactive demo');
    for (const key of ['label','file','question','answer','session']) requireText(d[key], `interactive.${key}`);
    for (const key of ['events','context','changeTab','evidenceTab','action','contextField','request','result','resultText','status']) requireText(d.ui?.[key], `interactive.ui.${key}`);
    requireList(d.operations, 'interactive.operations', 2);
    for (const op of d.operations) {
      for (const key of ['tool','title','description','result','requestRef','resultRef']) requireText(op[key], `operation.${key}`);
      for (const key of ['removed','added']) { requireList(op[key], key, 0); op[key].forEach(v=>requireText(v,key)); }
    }
  }
  if (!x.blocks?.length && !x.interactive && !x.video) throw new Error('Add demo content, an interactive demo or a video');
  requireText(p.comparison?.title, 'comparison.title');
  for (const kind of ['before','after']) {
    for (const key of ['title','description','image','alt']) requireText(p.comparison[kind]?.[key], `comparison.${kind}.${key}`);
    if (!/^assets\/[a-z0-9-]+\.jpg$/.test(p.comparison[kind].image)) throw new Error('Screenshot must be a local reviewed JPEG');
  }
  requireList(p.comparison.takeaways, 'comparison.takeaways', 1);
  p.comparison.takeaways.forEach(v=>requireText(v,'takeaway'));
  requireList(p.useCases, 'useCases', 2);
  for (const c of p.useCases) for (const key of ['audience','title','question','prompt']) requireText(c[key], `useCase.${key}`);
  requireText(p.quickstart?.title, 'quickstart.title');
  requireList(p.quickstart.steps, 'quickstart.steps', 1);
  if (p.quickstart.steps.length > 5) throw new Error('Quickstart must have at most five steps');
  for (const s of p.quickstart.steps) for (const key of ['title','description','code','codeLabel','expected']) requireText(s[key], `step.${key}`);
  requireList(p.boundaries, 'boundaries', 1);
  for (const b of p.boundaries) for (const key of ['title','description']) requireText(b[key], `boundary.${key}`);
  requireText(p.requirements?.summary, 'requirements.summary');
  requireList(p.requirements.items, 'requirements.items', 1);
  for (const item of p.requirements.items) for (const key of ['label','value']) requireText(item[key], `requirement.${key}`);
  requireList(p.faq, 'faq', 1);
  for (const item of p.faq) for (const key of ['question','answer']) requireText(item[key], `faq.${key}`);
  requireList(p.links, 'links', 1);
  for (const l of p.links) {
    requireText(l.label, 'link.label');
    const url = new URL(l.url);
    if (url.protocol !== 'https:' || url.username || url.password) throw new Error('Documentation links must be HTTPS');
  }
}

