const canvas = document.getElementById('canvas');
const connectionsSvg = document.getElementById('connections');
const exportBtn = document.getElementById('exportBtn');
const importFile = document.getElementById('importFile');

// Create label
const clearLabel = document.createElement('label');
clearLabel.textContent = 'Clear Canvas';
clearLabel.style.display = 'block'; // make it appear above
clearLabel.style.textAlign = 'center';
clearLabel.style.marginTop = '10px';
document.getElementById('sidebar').appendChild(clearLabel);

// Add Clear Canvas button dynamically
const clearBtn = document.createElement('button');
clearBtn.textContent = 'Clear';
clearBtn.style.display = 'block';
clearBtn.style.marginTop = '5px';
clearBtn.style.margin = '0 auto'; 
document.getElementById('sidebar').appendChild(clearBtn);

// Create label
const configLabel = document.createElement('label');
configLabel.textContent = 'Configuration Options';
configLabel.style.display = 'block'; // make it appear above
configLabel.style.textAlign = 'center';
configLabel.style.marginTop = '20px';
document.getElementById('sidebar').appendChild(configLabel);

// Add Export Configuration button dynamically
const exportConfigBtn = document.createElement('button');
exportConfigBtn.textContent = 'Download Configuration';
exportConfigBtn.style.display = 'block';
exportConfigBtn.style.margin = '0 auto'; 
exportConfigBtn.style.marginTop = '10px';
document.getElementById('sidebar').appendChild(exportConfigBtn);

// Add Save Configuration button dynamically
const saveConfigBtn = document.createElement('button');
saveConfigBtn.textContent = 'Commit Configuration';
saveConfigBtn.style.display = 'block';
saveConfigBtn.style.margin = '0 auto'; 
saveConfigBtn.style.marginTop = '10px';
document.getElementById('sidebar').appendChild(saveConfigBtn);

// Add input field for configuration URL
const urlInputLabel = document.createElement('label');
urlInputLabel.textContent = 'NodeRed URL:';
urlInputLabel.style.display = 'block';
urlInputLabel.style.textAlign = 'center';
urlInputLabel.style.marginTop = '10px';
document.getElementById('sidebar').appendChild(urlInputLabel);

const urlInput = document.createElement('input');
urlInput.type = 'text';
urlInput.style.width = '90%';
urlInput.style.display = 'block';
urlInput.style.margin = '0 auto'; 
urlInput.style.marginTop = '10px';
urlInput.placeholder = 'Enter NodeRed URL (e.g. http://192.168.1.10:1880)';
const savedUrl = localStorage.getItem('configUrl');
if (savedUrl) urlInput.value = savedUrl; // ✅ only set if it exists
document.getElementById('sidebar').appendChild(urlInput);

let nodes = [];
let nodeId = 0;

const allowedChildren = {
  collector: ["gate", "tool"],
  gate: ["gate", "tool"],
  tool: []
};

// URL Cleanup

// Clean URL function
function cleanUrl(url) {
    try {
        const u = new URL(url);
        // Keep protocol + hostname + optional port
        let cleaned = u.protocol + '//' + u.hostname;
        if (u.port) cleaned += ':' + u.port;
        return cleaned;
    } catch (e) {
        // If URL constructor fails, fallback to trimming slashes
        return url.replace(/\/+$/, '');
    }
}

// Listen for input blur (or Enter)
urlInput.addEventListener('blur', () => {
    urlInput.value = cleanUrl(urlInput.value);
    localStorage.setItem('configUrl', urlInput.value); // optional: save
});

// Optional: also clean when Enter is pressed
urlInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        urlInput.value = cleanUrl(urlInput.value);
        localStorage.setItem('configUrl', urlInput.value);
    }
});

// ---------------------- Local Storage ----------------------
function saveDiagramToLocalStorage() {
  nodes.forEach(n => {
    const el = document.querySelector(`.node[data-id='${n.id}']`);
    if (el) {
      const transform = el.style.transform;
      const translate = transform.match(/translate\((.*)px, (.*)px\)/);
      const dx = translate ? parseFloat(translate[1]) : 0;
      const dy = translate ? parseFloat(translate[2]) : 0;

      n.x = parseFloat(el.style.left) + dx;
      n.y = parseFloat(el.style.top) + dy;
      n.name = el.querySelector('.name-input').value;

      if (n.type === 'gate') {
        const gateInput = el.querySelector('.gate-input');
        n.gateNumber = parseFloat(gateInput.value) || 0;
      }

      if (n.type === 'tool') {
        const toolInput = el.querySelector('.current-input');
        n.current = parseFloat(toolInput.value) || 0;
      }

      el.style.left = `${n.x}px`;
      el.style.top = `${n.y}px`;
      el.style.transform = '';
      el.removeAttribute('data-x');
      el.removeAttribute('data-y');
    }
  });

  localStorage.setItem('diagram', JSON.stringify(nodes));
}

function loadDiagramFromLocalStorage() {
  const saved = localStorage.getItem('diagram');
  if (saved) {
    nodes = JSON.parse(saved);
    connectionsSvg.innerHTML = '';
    document.querySelectorAll('.line-delete-btn').forEach(btn => btn.remove());
    document.querySelectorAll('.node').forEach(n => n.remove());

    nodes.forEach(n => createNode(n.type, n.x, n.y, n.name, n.id, n.children, n.gateNumber ?? 0, n.current ?? 0));

    const maxId = nodes.reduce((max, n) => Math.max(max, parseInt(n.id)), 0);
    nodeId = maxId + 1;

    updateConnections();
  }
}

// ---------------------- Drag from Sidebar ----------------------
interact('.draggable').draggable({
  listeners: {
    start(event) {
      // Clone the element for drag preview
      const clone = event.target.cloneNode(true);
      clone.id = 'drag-preview';
      clone.style.position = 'absolute';
      clone.style.pointerEvents = 'none';
      clone.style.zIndex = '9999';
      clone.style.opacity = '0.85';
      clone.style.left = event.pageX + 'px';
      clone.style.top = event.pageY + 'px';
      document.body.appendChild(clone);
      event.interaction.dragClone = clone;
    },
    move(event) {
      const clone = event.interaction.dragClone;
      if (clone) {
        clone.style.left = event.pageX + 'px';
        clone.style.top = event.pageY + 'px';
      }
    },
    end(event) {
      const clone = event.interaction.dragClone;
      if (clone) clone.remove();

      const canvasRect = canvas.getBoundingClientRect();
      const type = event.target.dataset.type;
      const x = event.pageX - canvasRect.left;
      const y = event.pageY - canvasRect.top;

      // Only create if dropped inside canvas
      if (
        event.pageX >= canvasRect.left &&
        event.pageX <= canvasRect.right &&
        event.pageY >= canvasRect.top &&
        event.pageY <= canvasRect.bottom
      ) {
        createNode(type, x, y);
      }
    }
  },
  inertia: true
});


function dragMoveListener(event) {
  const target = event.target;
  target.style.zIndex = 1000; // Always on top while dragging
  const x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
  const y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;
  target.style.transform = `translate(${x}px, ${y}px)`;
  target.setAttribute('data-x', x);
  target.setAttribute('data-y', y);
}

// ---------------------- Node Creation ----------------------
function createNode(type, x, y, name = '', id = null, children = [], gateNumber = 1, current = 0) {
  const node = document.createElement('div');
  node.classList.add('node');
  node.dataset.type = type;
  node.dataset.id = id ?? nodeId++;
  node.style.left = `${x}px`;
  node.style.top = `${y}px`;
  node.style.width = '270px'; // fixed width
  node.style.zIndex = 10;

  let html = `<button class="delete-btn">×</button>
              <strong>${type.charAt(0).toUpperCase() + type.slice(1)}</strong><br>
              <span style="display:block;">Name: <input class="name-input" value="${name}" placeholder="name" name="name-${node.dataset.id}"></span>`;

  if (type === 'gate') {
    html += `<span style="display:block;">Gate #: <input type="number"  min="1" max="10" class="gate-input" value="${gateNumber}" name="gate-${node.dataset.id}"></span>`;
  }

  if (type === 'tool') {
    html += `<span style="display:block;">Trigger Current: <input type="number" step="0.01" class="current-input" value="${current}" name="current-${node.dataset.id}"></span>`;
  }

  node.innerHTML = html;

  // Delete button
  node.querySelector('.delete-btn').addEventListener('click', () => {
    confirmAndDelete(node.dataset.id);
  });

  // Input changes
  node.querySelector('.name-input').addEventListener('input', saveDiagramToLocalStorage);
  if (type === 'gate') node.querySelector('.gate-input').addEventListener('input', saveDiagramToLocalStorage);
  if (type === 'tool') node.querySelector('.current-input').addEventListener('input', saveDiagramToLocalStorage);

  // Make draggable
  interact(node).draggable({
    listeners: {
		start(event) {
		  const target = event.target;
		  // Move node to end of parent container so it's visually on top
		  target.parentNode.appendChild(target);
		  target.style.zIndex = '9999'; // bring node to top while dragging
		},
		move(event) {
		  const target = event.target;
		  const x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
		  const y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;

		  target.style.transform = `translate(${x}px, ${y}px)`;
		  target.setAttribute('data-x', x);
		  target.setAttribute('data-y', y);

		  updateConnections(target.dataset.id);
		},
		end(event) {
		  const target = event.target;
		  target.style.zIndex = '10'; // restore normal stacking order
		  saveDiagramToLocalStorage();   // save final position after drag
		}
	  },
	  inertia: true
  });

  // Dropzone
  interact(node).dropzone({
    accept: '.node',
    overlap: 0.5,
    ondrop: event => {
		const parentId = node.dataset.id;           // drop target
		const childNode = event.relatedTarget;      // dragged node
		const childId = childNode.dataset.id;

		// Prevent dropping parent onto its descendant
		if (isDescendant(childId, parentId)) {
		  alert("Cannot drop a parent onto its own child or descendant!");
		  return;
		}

		const parent = nodes.find(n => n.id === parentId);
		const child = nodes.find(n => n.id === childId);
		if (!parent || !child) return;

		// Validate allowed children
		if (!allowedChildren[parent.type].includes(child.type)) {
		  alert(`Cannot add ${child.type} to ${parent.type}`);
		  return; // KEEP existing parent relationship!
		}

		// ✅ Only remove old parent if valid
		nodes.forEach(n => n.children = n.children.filter(cId => cId !== childId));

		// Add new parent-child connection
		parent.children.push(childId);

		updateConnections();
		saveDiagramToLocalStorage();
	  }
  });

  canvas.appendChild(node);

  if (!id) {
    nodes.push({ id: node.dataset.id, type, name, x, y, children: [], gateNumber: type === 'gate' ? gateNumber : undefined, current: type === 'tool' ? current : undefined });
    saveDiagramToLocalStorage();
  } else {
    const existing = nodes.find(n => n.id === id);
    if (!existing) nodes.push({ id, type, name, x, y, children, gateNumber: type === 'gate' ? gateNumber : undefined, current: type === 'tool' ? current : undefined });
  }

  return node;
}

// ---------------------- Descendant Check ----------------------
function isDescendant(parentId, childId) {
  const parent = nodes.find(n => n.id === parentId);
  if (!parent) return false;
  if (parent.children.includes(childId)) return true;
  return parent.children.some(cId => isDescendant(cId, childId));
}

// ---------------------- Connect Nodes ----------------------
function connectNodes(parentId, childId) {
  if (parentId === childId) return;
  const parent = nodes.find(n => n.id === parentId);
  const child = nodes.find(n => n.id === childId);
  if (!parent || !child) return;

  nodes.forEach(n => n.children = n.children.filter(cId => cId !== childId));

  if (!allowedChildren[parent.type].includes(child.type)) {
    alert(`Cannot add ${child.type} to ${parent.type}`);
    return;
  }

  parent.children.push(childId);
  updateConnections();
  saveDiagramToLocalStorage();
}

// ---------------------- Delete / Cascade ----------------------
function confirmAndDelete(id) {
  const node = nodes.find(n => n.id === id);
  if (!node) return;

  const descendants = getAllDescendants(id);
  const count = descendants.length;

  const message = count > 0
    ? `This will delete "${node.type}" and ${count} descendant object${count > 1 ? 's' : ''}. Continue?`
    : `Delete "${node.type}"?`;

  if (confirm(message)) {
    deleteCascade(id);
  }
}

function getAllDescendants(id) {
  const node = nodes.find(n => n.id === id);
  if (!node) return [];

  let descendants = [...node.children];
  node.children.forEach(childId => descendants = descendants.concat(getAllDescendants(childId)));
  return descendants;
}

function deleteCascade(id) {
  const allToDelete = [id, ...getAllDescendants(id)];
  allToDelete.forEach(delId => {
    const nodeEl = document.querySelector(`.node[data-id='${delId}']`);
    if (nodeEl) nodeEl.remove();
  });

  nodes = nodes.filter(n => !allToDelete.includes(n.id));
  nodes.forEach(n => n.children = n.children.filter(cId => !allToDelete.includes(cId)));

  updateConnections();
  saveDiagramToLocalStorage();
}

// ---------------------- Update Connections ----------------------
function updateConnections() {
  connectionsSvg.innerHTML = '';
  document.querySelectorAll('.line-delete-btn').forEach(btn => btn.remove());

  nodes.forEach(parent => {
    parent.children.forEach(childId => {
      const parentEl = document.querySelector(`.node[data-id='${parent.id}']`);
      const childEl = document.querySelector(`.node[data-id='${childId}']`);
      if (!parentEl || !childEl) return;

      const parentRect = parentEl.getBoundingClientRect();
      const childRect = childEl.getBoundingClientRect();
      const canvasRect = canvas.getBoundingClientRect();

      const x1 = parentRect.left - canvasRect.left + parentRect.width / 2;
      const y1 = parentRect.top - canvasRect.top + parentRect.height;
      const x2 = childRect.left - canvasRect.left + childRect.width / 2;
      const y2 = childRect.top - canvasRect.top;
      const yC = (y1 + y2) / 2;

      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", `M ${x1} ${y1} C ${x1} ${yC}, ${x2} ${yC}, ${x2} ${y2}`);
      path.setAttribute("stroke", "#333");
      path.setAttribute("stroke-width", "2");
      path.setAttribute("fill", "none");
      connectionsSvg.appendChild(path);

      const mx = (x1 + x2) / 2;
      const my = yC;
      const deleteBtn = document.createElement('div');
      deleteBtn.classList.add('line-delete-btn');
      deleteBtn.textContent = '×';
      deleteBtn.style.position = 'absolute';
      deleteBtn.style.left = `${mx - 8}px`;
      deleteBtn.style.top = `${my - 8}px`;
      canvas.appendChild(deleteBtn);

      deleteBtn.addEventListener('click', () => {
        if (confirm(`Remove connection from ${parent.type} to ${nodes.find(n => n.id === childId).type}?`)) {
          parent.children = parent.children.filter(cId => cId !== childId);
          updateConnections();
          saveDiagramToLocalStorage();
        }
      });
    });
  });
}

// ---------------------- Export / Import ----------------------
exportBtn.onclick = () => {
  saveDiagramToLocalStorage();
  const json = JSON.stringify(nodes, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'diagram.json';
  a.click();
};

importFile.onchange = e => {
  const file = e.target.files[0];
  const reader = new FileReader();
  reader.onload = event => {
    nodes = JSON.parse(event.target.result);
    connectionsSvg.innerHTML = '';
    document.querySelectorAll('.node').forEach(n => n.remove());
    document.querySelectorAll('.line-delete-btn').forEach(btn => btn.remove());
    nodes.forEach(n => createNode(n.type, n.x, n.y, n.name, n.id, n.children, n.gateNumber ?? 0, n.current ?? 0));

    const maxId = nodes.reduce((max, n) => Math.max(max, parseInt(n.id)), 0);
    nodeId = maxId + 1;

    updateConnections();
    saveDiagramToLocalStorage();
  };
  reader.readAsText(file);
};

// ---------------------- Clear Canvas ----------------------
clearBtn.addEventListener('click', () => {
  if (confirm('Clear the entire canvas? This cannot be undone.')) {
    nodes = [];
    connectionsSvg.innerHTML = '';
    document.querySelectorAll('.node').forEach(n => n.remove());
    document.querySelectorAll('.line-delete-btn').forEach(btn => btn.remove());
    localStorage.removeItem('diagram');
    nodeId = 0;
  }
});

// ---------------------- Export Configuration ----------------------
exportConfigBtn.addEventListener('click', () => {
  const topNodes = nodes.filter(n => !nodes.some(p => p.children.includes(n.id)));

  function buildHierarchy(node) {
    const obj = { name: node.name, nodeType: node.type };
    if (node.type === 'gate') obj.gateNumber = node.gateNumber;
    if (node.type === 'tool') obj.triggerCurrent = node.current;

    if (node.children && node.children.length > 0) {
      obj.children = node.children.map(childId => {
        const childNode = nodes.find(n => n.id === childId);
        if (childNode) return buildHierarchy(childNode);
        return null;
      }).filter(Boolean);
    }

    return obj;
  }

  const hierarchy = topNodes.map(n => buildHierarchy(n));

  const json = JSON.stringify(hierarchy, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'configuration.json';
  a.click();
});

// ---------------------- Save Configuration ----------------------
saveConfigBtn.addEventListener('click', () => {
  let url = urlInput.value.trim();
  if (!url) {
    alert('Configuration URL is required!');
    return;
  }

  if (!url.endsWith('/dc-config-update')) {
    url = url.replace(/\/+$/,'') + '/dc-config-update';
  }
  loadDiagramFromLocalStorage();
  const topNodes = nodes.filter(n => !nodes.some(p => p.children.includes(n.id)));

  function buildHierarchy(node) {
    const obj = { name: node.name, nodeType: node.type };
    if (node.type === 'gate') obj.gateNumber = node.gateNumber;
    if (node.type === 'tool') obj.triggerCurrent = node.current;

    if (node.children && node.children.length > 0) {
      obj.children = node.children.map(childId => {
        const childNode = nodes.find(n => n.id === childId);
        if (childNode) return buildHierarchy(childNode);
        return null;
      }).filter(Boolean);
    }

    return obj;
  }

  const hierarchy = topNodes.map(n => buildHierarchy(n));
  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(hierarchy)
  })
    .then(res => {
      if (res.ok) alert('Configuration saved successfully!');
      else alert('Failed to save configuration!');
    })
    .catch(err => alert('Error saving configuration: ' + err));

  localStorage.setItem('configUrl', urlInput.value.trim());
});

// ---------------------- Load on Page Load ----------------------
window.addEventListener('DOMContentLoaded', () => {
  loadDiagramFromLocalStorage();
});
