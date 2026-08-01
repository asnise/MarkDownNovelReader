// =============================================================
// Diagram & Marked Custom Parser Module
// =============================================================

// Helper: Custom Builtin Graph HTML Generator
function buildBuiltinGraphHtml(cleanCode) {
  try {
    let lines = cleanCode.split('\n');
    let data = {
      title: 'แผนผังความสัมพันธ์',
      subgraphs: [],
      edges: []
    };

    let currentSubgraph = null;

    lines.forEach(line => {
      let l = line.trim();
      if (!l || l.startsWith('%%')) return;

      if (l.startsWith('subgraph')) {
        let titleMatch = l.match(/subgraph\s+["']?([^"']+)["']?/i);
        let title = titleMatch ? titleMatch[1] : 'กลุ่มตัวละคร';
        currentSubgraph = { title: title, nodes: [] };
        data.subgraphs.push(currentSubgraph);
        return;
      }

      if (l === 'end') {
        currentSubgraph = null;
        return;
      }

      if (l.includes('-->') || l.includes('---') || l.includes('-.->') || l.includes('<-->') || l.includes('==>')) {
        let edgeRegex = /([A-Za-z0-9_]+)\s*(<-->|-->|---|==>|-\.-\.>)\s*(?:\|([^|]+)\|)?\s*([A-Za-z0-9_]+)/;
        let match = l.match(edgeRegex);
        if (match) {
          let fromId = match[1];
          let typeSymbol = match[2];
          let labelText = match[3] || '';
          let toId = match[4];

          let isBidi = typeSymbol === '<-->';
          let edgeType = 'solid';
          if (typeSymbol === '-.->') edgeType = 'dashed';
          if (typeSymbol === '==>') edgeType = 'thick';

          data.edges.push({
            from: fromId,
            to: toId,
            label: labelText,
            isBidi: isBidi,
            type: edgeType
          });
        }
        return;
      }

      let nodeRegex = /([A-Za-z0-9_]+)\[["']?([^"'\]]+)["']?\]/;
      let nodeMatch = l.match(nodeRegex);
      if (nodeMatch) {
        let id = nodeMatch[1];
        let rawLabel = nodeMatch[2];

        let labelParts = rawLabel.split('<br/>');
        let title = labelParts[0].trim();
        let subtext = labelParts[1] ? labelParts[1].replace(/<[^>]+>/g, '').trim() : '';

        let nodeObj = { id: id, label: title, subtext: subtext };

        if (currentSubgraph) {
          currentSubgraph.nodes.push(nodeObj);
        } else {
          if (data.subgraphs.length === 0) {
            data.subgraphs.push({ title: 'ตัวละครหลัก', nodes: [] });
          }
          data.subgraphs[0].nodes.push(nodeObj);
        }
      }
    });

    let nodeMap = {};
    data.subgraphs.forEach(sub => {
      sub.nodes.forEach(node => {
        nodeMap[node.id] = node;
      });
    });

    let treeConnectionsMap = {};
    Object.keys(nodeMap).forEach(id => {
      treeConnectionsMap[id] = [];
    });

    data.edges.forEach(edge => {
      let fromNode = nodeMap[edge.from];
      let toNode = nodeMap[edge.to];
      if (!fromNode || !toNode) return;

      let arrow = edge.isBidi ? '⇹' : '➔';
      if (edge.type === 'dashed') arrow = '⇢';

      if (treeConnectionsMap[edge.from]) {
        treeConnectionsMap[edge.from].push({
          targetLabel: toNode.label,
          label: edge.label,
          type: edge.type,
          arrow: arrow
        });
      }

      if (edge.isBidi && treeConnectionsMap[edge.to]) {
        treeConnectionsMap[edge.to].push({
          targetLabel: fromNode.label,
          label: edge.label,
          type: edge.type,
          arrow: '⇹'
        });
      }
    });

    let html = `<div class="tree-graph-wrapper">`;
    html += `
      <div class="tree-graph-header">
        <span>แผนผังต้นไม้ความสัมพันธ์ (Character Relationship Tree)</span>
      </div>
    `;

    html += `<div class="tree-nodes-list">`;
    data.subgraphs.forEach(sub => {
      if (!sub.nodes || sub.nodes.length === 0) return;

      html += `<div class="tree-subgraph-group">`;
      html += `<div class="tree-subgraph-title">${sub.title}</div>`;
      html += `<div class="tree-cards-list">`;

      sub.nodes.forEach(node => {
        let connections = treeConnectionsMap[node.id] || [];

        html += `
          <div class="tree-character-card" id="tree-node-${node.id}">
            <div class="tree-char-header">
              <span class="tree-char-title">${node.label}</span>
              ${node.subtext ? `<span class="tree-char-subtext">(${node.subtext})</span>` : ''}
            </div>
        `;

        if (connections.length > 0) {
          html += `<div class="tree-branches">`;
          connections.forEach((conn, index) => {
            let isLast = index === connections.length - 1;
            let symbol = isLast ? '└─' : '├─';

            html += `
              <div class="tree-branch">
                <span class="tree-branch-symbol">${symbol}</span>
                <span class="tree-branch-target">${conn.targetLabel}</span>
                <span class="tree-branch-arrow">${conn.arrow}</span>
                ${conn.label ? `<span class="tree-branch-badge ${conn.type}">${conn.label}</span>` : ''}
              </div>
            `;
          });
          html += `</div>`;
        } else {
          html += `<div style="font-size:0.78rem; color:var(--text-muted); padding-left:16px;">ไม่มีสายสัมพันธ์เพิ่มเติม</div>`;
        }

        html += `</div>`;
      });

      html += `</div></div>`;
    });

    html += `</div></div>`;
    return html;

  } catch (e) {
    console.error('Error building builtin graph html:', e);
    return `<pre><code>${cleanCode}</code></pre>`;
  }
}

// Initialize Custom Marked Parser
function initMarkedParser() {
  if (!window.marked) return;

  const renderer = new marked.Renderer();

  renderer.code = function (code, lang) {
    let textCode = typeof code === 'object' ? code.text : code;
    let language = typeof code === 'object' ? (code.lang || '') : (lang || '');
    let trimmed = (textCode || '').trim();

    if (language === 'mermaid' || trimmed.startsWith('graph ') || trimmed.startsWith('sequenceDiagram') || trimmed.startsWith('flowchart') || trimmed.startsWith('gantt') || trimmed.startsWith('classDiagram')) {
      let cleanCode = removeAllEmojis(textCode);
      return buildBuiltinGraphHtml(cleanCode);
    }
    return `<pre><code class="language-${language}">${textCode}</code></pre>`;
  };

  renderer.table = function (headerOrToken, bodyArg) {
    let headerHtml = '';
    let bodyHtml = '';

    if (headerOrToken && typeof headerOrToken === 'object') {
      const token = headerOrToken;
      if (token.header && Array.isArray(token.header)) {
        headerHtml = '<tr>' + token.header.map(cell => {
          const cellText = window.marked ? window.marked.parseInline(cell.text || '') : cell.text;
          const align = cell.align ? ` style="text-align:${cell.align}"` : '';
          return `<th${align}>${cellText}</th>`;
        }).join('') + '</tr>';
      }

      if (token.rows && Array.isArray(token.rows)) {
        bodyHtml = token.rows.map(row => {
          const cellsHtml = row.map(cell => {
            let cellText = window.marked ? window.marked.parseInline(cell.text || '') : cell.text;
            cellText = cellText.replace(/\[THREAT-([A-Z0-9]+)\]/gi, (match, p1) => {
              const classKey = 'threat-' + p1.toLowerCase();
              return `<span class="threat-tag-badge ${classKey}">[THREAT-${p1.toUpperCase()}]</span>`;
            });
            const align = cell.align ? ` style="text-align:${cell.align}"` : '';
            return `<td${align}>${cellText}</td>`;
          }).join('');
          return `<tr>${cellsHtml}</tr>`;
        }).join('');
      }
    } else {
      headerHtml = headerOrToken || '';
      bodyHtml = bodyArg || '';
      bodyHtml = bodyHtml.replace(/\[THREAT-([A-Z0-9]+)\]/gi, (match, p1) => {
        const classKey = 'threat-' + p1.toLowerCase();
        return `<span class="threat-tag-badge ${classKey}">[THREAT-${p1.toUpperCase()}]</span>`;
      });
    }

    return `<div class="table-container">
      <table>
        <thead>${headerHtml}</thead>
        <tbody>${bodyHtml}</tbody>
      </table>
    </div>`;
  };

  marked.use({
    renderer: renderer,
    breaks: true,
    gfm: true
  });
}

// Render Mermaid Diagrams Dynamically
async function renderMermaidDiagrams() {
  if (!elements || !elements.readerContent) return;
  const mermaidNodes = elements.readerContent.querySelectorAll('.mermaid');
  if (mermaidNodes.length === 0) return;

  if (window.mermaid) {
    try {
      mermaid.initialize({
        startOnLoad: false,
        theme: STATE.theme === 'dark' ? 'dark' : 'neutral',
        securityLevel: 'loose',
        fontFamily: 'Inter, Sarabun, sans-serif',
        suppressErrorRendering: true
      });

      for (let i = 0; i < mermaidNodes.length; i++) {
        const node = mermaidNodes[i];
        const rawCode = node.getAttribute('data-mermaid-code') || node.textContent;
        if (!node.getAttribute('data-mermaid-code')) {
          node.setAttribute('data-mermaid-code', rawCode);
        }

        let cleanCode = rawCode.trim();

        try {
          const id = 'mermaid_svg_' + Date.now() + '_' + i;
          const renderResult = await mermaid.render(id, cleanCode);
          node.innerHTML = renderResult.svg;
        } catch (err) {
          console.warn('Mermaid render warning for diagram:', err);
          node.innerHTML = `<div style="padding:12px; font-family:var(--font-sans); font-size:0.85rem; opacity:0.8;"><pre><code>${cleanCode}</code></pre></div>`;
        }
      }
    } catch (e) {
      console.error('Error rendering Mermaid diagrams:', e);
    }
  }
}
