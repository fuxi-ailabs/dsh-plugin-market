export function renderFileHistory(x, e) {
  return `<div class="demo-shell"><div class="demo-toolbar"><span>${e(x.file)}</span><span class="demo-badge">${e(x.label)}</span></div>
        <div class="demo-question"><p>${e(x.question)}</p><button id="play-demo" type="button" class="play-button"><span aria-hidden="true">▶</span> 自动演示</button></div>
        <div class="demo-workspace"><aside class="demo-timeline" aria-label="选择一次演示操作"><div class="timeline-label"><span>${e(x.ui.events)}</span><span>${x.operations.length} 条</span></div>
          ${x.operations.map((op,i)=>`<button type="button" class="event-button${i===x.operations.length-1?' is-active':''}" data-operation="${i}" aria-pressed="${i===x.operations.length-1}"><span class="event-index">0${i+1}</span><span><strong>${e(op.title)}</strong><small>${e(op.tool)} <span aria-hidden="true">·</span> ${e(x.ui.status)}</small></span><span class="event-arrow" aria-hidden="true">↗</span></button>`).join('')}
          <div class="timeline-session"><span class="mono">${e(x.ui.context)}</span><code>${e(x.session)}</code></div></aside>
          <div class="demo-detail"><div class="detail-top"><p class="mono" id="operation-label">${e(x.operations.at(-1).tool.toUpperCase())} / ${String(x.operations.length).padStart(2,'0')}</p><span class="success-badge">✓ ${e(x.ui.status)}</span></div><h3 id="operation-title">${e(x.operations.at(-1).title)}</h3><p id="operation-description">${e(x.operations.at(-1).description)}</p>
            <div class="demo-tabs" role="tablist" aria-label="查看演示结果"><button id="tab-diff" type="button" role="tab" aria-selected="true" aria-controls="panel-diff" tabindex="0">${e(x.ui.changeTab)}</button><button id="tab-evidence" type="button" role="tab" aria-selected="false" aria-controls="panel-evidence" tabindex="-1">${e(x.ui.evidenceTab)}</button></div>
            <div id="panel-diff" role="tabpanel" aria-labelledby="tab-diff"><div class="diff-file mono">${e(x.file)}</div><pre class="diff-lines" id="diff-lines"></pre></div>
            <div id="panel-evidence" role="tabpanel" aria-labelledby="tab-evidence" hidden><dl class="evidence-list"><div><dt>${e(x.ui.action)}</dt><dd id="evidence-tool"></dd></div><div><dt>${e(x.ui.contextField)}</dt><dd>${e(x.session)}</dd></div><div><dt>${e(x.ui.request)}</dt><dd id="request-ref"></dd></div><div><dt>${e(x.ui.result)}</dt><dd id="result-ref"></dd></div><div><dt>${e(x.ui.resultText)}</dt><dd id="evidence-result"></dd></div></dl></div>
          </div></div>
        <div class="demo-answer"><span class="answer-icon" aria-hidden="true">↳</span><p><strong>结果</strong>${e(x.answer)}</p></div>
      </div>`;
}
