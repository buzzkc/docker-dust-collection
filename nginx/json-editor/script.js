const canvas = document.getElementById('canvas');
const connectionsSvg = document.getElementById('connections');
const exportBtn = document.getElementById('exportBtn');
const importFile = document.getElementById('importFile');

// Add Clear Canvas button dynamically
const clearBtn = document.createElement('button');
clearBtn.textContent = 'Clear Canvas';
clearBtn.style.marginTop = '10px';
document.getElementById('sidebar').appendChild(clearBtn);

let nodes = [];
let nodeId = 0;

const allowedChildren = {
  collector: ["gate", "tool"],
  gate: ["gate", "tool"],
  tool: []
};

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
      } else if (n.type === 'tool') {
        const currentInput = el.querySelector('.current-input');
        n.current = parseFloat(currentInput.value) || 0;
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
    move: event => {
      // optional: highlight the dragged sidebar item
    },
    end(event) {
      const type = event.target.dataset.type;
      const x = event.pageX - canvas.offsetLeft;
      const y = event.pageY - canvas.offsetTop;
      createNode(type, x, y);
      event.target.style.transform = '';
      event.target.removeAttribute('data-x');
      event.target.removeAttribute('data-y');
    }
  },
  inertia: true,
  modifiers: [
    interact.modifiers.restrictRect({
      restriction: 'parent',
      endOnly: true
    })
  ]
});

// ---------------------- Node Creation ----------------------
function createNode(type, x, y, name = '', id = null, children = [], gateNumber = 0, current = 0) {
  const node = document.createElement('div');
  node.classList.add('node');
  node.dataset.type = type;
  node.dataset.id = id ?? nodeId++;
  node.style.left = `${x}px`;
  node.style.top = `${y}px`;
  node.style.width = '250px'; // fixed width
  node.style.zIndex = 10;

  let html = `<button class="delete-btn">×</button>
              <strong>${type.charAt(0).toUpperCase() + type.slice(1)}</strong><br>
              <span style="display:block;">Name: <input class="name-input" value="${name}" placeholder="name" name="name-${node.dataset.id}"></span>`;

  if (type === 'gate') {
    html += `<span style="display:block;">Gate #: <input type="number" class="gate-input" value="${gateNumber}" name="gate-${node.dataset.id}"></span>`;
  } else if (type === 'tool') {
    html += `<span style="display:block;">Current Trigger: <input type="number" step="0.01" class="current-input" value="${current}" name="current-${node.dataset.id}"></span>`;
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

  // ---------------- Canvas Node Dragging ----------------
  interact(node).draggable({
    listeners: {
      start(event) {
        event.target.style.zIndex = 1000;
      },
      move(event) {
        const target = event.target;
        const dx = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
        const dy = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;
        target.style.transform = `translate(${dx}px, ${dy}px)`;
        target.setAttribute('data-x', dx);
        target.setAttribute('data-y', dy);
        updateConnections();
      },
      end(event) {
        const target = event.target;
        const dx = parseFloat(target.getAttribute('data-x')) || 0;
        const dy = parseFloat(target.getAttribute('data-y')) || 0;
        target.style.left = parseFloat(target.style.left) + dx + "px";
        target.style.top = parseFloat(target.style.top) + dy + "px";
        target.style.transform = '';
        target.setAttribute('data-x', 0);
        target.setAttribute('data-y', 0);
        target.style.zIndex = 10;
        saveDiagramToLocalStorage();
      }
    }
  });

  // ---------------- Dropzone ----------------
  interact(node).dropzone({
    accept: '.node',
    overlap: 0.5,
    ondrop: event => {
      const parentId = node.dataset.id;
      const childId = event.relatedTarget.dataset.id;

      // Prevent dropping parent onto its descendant
      if (isDescendant(childId, parentId)) {
        alert("Cannot drop a parent onto its own child or descendant!");
        return;
      }

      connectNodes(parentId, childId);
      saveDiagramToLocalStorage();
    }
  });

  canvas.appendChild(node);

  if (!id) {
    nodes.push({
      id: node.dataset.id,
      type,
      name,
      x,
      y,
      children: [],
      gateNumber: type === 'gate' ? gateNumber : undefined,
      current: type === 'tool' ? current : undefined
    });
    saveDiagramToLocalStorage();
  } else {
    const existing = nodes.find(n => n.id === id);
    if (!existing) {
      nodes.push({
        id,
        type,
        name,
        x,
        y,
        children,
        gateNumber: type === 'gate' ? gateNumber : undefined,
        current: type === 'tool' ? current : undefined
      });
    }
  }

  return node;
}

// ---------------- Descendant Check ----------------
function isDescendant(parentId, childId) {
  const parent = nodes.find(n => n.id === parentId);
  if (!parent) return false;
  if (parent.children.includes(childId)) return true;
  return parent.children.some(cId => isDescendant(cId, childId));
}

// ---------------- Connect Nodes ----------------
function connectNodes(parentId, childId) {
  if (parentId === childId) return;
  const parent = nodes.find(n => n.id === parentId);
  const child = nodes.find(n => n.id === childId);
  if (!parent || !child) return;

  // Only one parent allowed per child
  nodes.forEach(n => {
    n.children = n.children.filter(cId => cId !== childId);
  });

  if (!allowedChildren[parent.type].includes(child.type)) {
    alert(`Cannot add ${child.type} to ${parent.type}`);
    return;
  }

  parent.children.push(childId);
  updateConnections();
  saveDiagramToLocalStorage();
}

// ---------------- Delete / Cascade ----------------
function confirmAndDelete(id) {
  const node = nodes.find(n => n.id === id);
  if (!node) return;

  const descendants = getAllDescendants(id);
  const count = descendants.length;

  const message = count > 0
    ? `This will delete "${node.type}" and ${count} descendant object${count > 1 ? 's' : ''}. Continue?`
    : `Delete "${node.type}"?`;

  if (confirm(message)) deleteCascade(id);
}

function getAllDescendants(id) {
  const node = nodes.find(n => n.id === id);
  if (!node) return [];
  let descendants = [...node.children];
  node.children.forEach(cId => {
    descendants = descendants.concat(getAllDescendants(cId));
  });
  return descendants;
}

function deleteCascade(id) {
  const allToDelete = [id, ...getAllDescendants(id)];

  allToDelete.forEach(delId => {
    const nodeEl = document.querySelector(`.node[data-id='${delId}']`);
    if (nodeEl) nodeEl.remove();
  });

  nodes = nodes.filter(n => !allToDelete.includes(n.id));
  nodes.forEach(n => {
    n.children = n.children.filter(childId => !allToDelete.includes(childId));
  });

  updateConnections();
  saveDiagramToLocalStorage();
}

// ---------------- Update Connections ----------------
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

// ---------------- Export / Import ----------------
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

// ---------------- Clear Canvas ----------------
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

// ---------------- Load on Page Load ----------------
window.addEventListener('DOMContentLoaded', () => {
  loadDiagramFromLocalStorage();
});
