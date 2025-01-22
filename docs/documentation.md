### createElement

```js
function createElement(type, props, ...children) {
  return {
    type,
    props: {
      ...props,
      children: children.flat(),
    },
  };
}
```

**Purpose**: Converts JSX syntax into Virtual DOM objects

- Input:

  - `type`: Element type (e.g., 'div', Component class)
  - `props`: Element properties
  - `children`: Child elements

- Output: Virtual DOM node object

### Component

```js
class Component {
  constructor(props) {
    this.props = props || {};
    this.state = {};
    this._renderCallback = null;
  }

  setState(newState) {
    this.state = { ...this.state, ...newState };
    if (this._renderCallback) {
      this._renderCallback();
    }
  }

  componentDidMount() {}
  componentDidUpdate() {}
  render() {
    return null;
  }
}
```

**Purpose**: Base class for creating components

- Key Methods:
  - `setState`: Updates component state and triggers re-render
  - `componentDidMount`: Lifecycle method after initial render
  - `componentDidUpdate`: Lifecycle method after updates
  - `render`: Returns virtual DOM structure

### createDom.js

```js
function createDom(vNode) {
  // Text node handling
  if (typeof vNode === "string" || typeof vNode === "number") {
    return document.createTextNode(vNode);
  }

  // Null/undefined handling
  if (vNode === null || vNode === undefined) {
    return document.createTextNode("");
  }

  // Component handling
  if (typeof vNode.type === "function") {
    const component = new vNode.type(vNode.props);
    const renderedVNode = component.render();
    const dom = createDom(renderedVNode);

    // Setup re-render mechanism
    component._renderCallback = () => {
      const newVNode = component.render();
      updateDom(dom, renderedVNode, newVNode);
    };

    component.componentDidMount();
    return dom;
  }

  // HTML Element handling
  const dom = document.createElement(vNode.type);
  const props = vNode.props || {};

  // Property handling
  Object.entries(props).forEach(([key, value]) => {
    if (key === "children") return;

    if (key.startsWith("on") && typeof value === "function") {
      const eventName = key.toLowerCase().substring(2);
      dom.addEventListener(eventName, value);
    } else if (key === "className") {
      dom.setAttribute("class", value);
    } else if (key === "style") {
      if (typeof value === "string") {
        dom.setAttribute("style", value);
      } else if (typeof value === "object") {
        Object.entries(value).forEach(([cssKey, cssValue]) => {
          dom.style[cssKey] = cssValue;
        });
      }
    } else {
      dom.setAttribute(key, value);
    }
  });

  // Handle children
  if (props.children) {
    props.children.forEach((child) => {
      const childDom = createDom(child);
      if (childDom) {
        dom.appendChild(childDom);
      }
    });
  }

  return dom;
}
```

**Purpose**: Converts virtual DOM nodes into real DOM elements

- Input: Virtual DOM node (`vNode`)
- Output: Real DOM element
- Key Operations:

1. Text node creation
2. Component instantiation and setup
3. HTML element creation
4. Property and event handling
5. Style processing
6. Child element rendering

### updateDom

```js
function updateDom(dom, oldVNode, newVNode) {
  // Handle removal
  if (!newVNode) {
    dom.remove();
    return;
  }

  // Handle creation
  if (!oldVNode) {
    const newDom = createDom(newVNode);
    dom.parentNode.replaceChild(newDom, dom);
    return;
  }

  // Handle text nodes
  if (typeof newVNode === "string" || typeof newVNode === "number") {
    if (oldVNode !== newVNode) {
      dom.textContent = newVNode;
    }
    return;
  }

  // Handle Component updates
  if (typeof newVNode.type === "function") {
    const component = new newVNode.type(newVNode.props);
    const newRenderedVNode = component.render();
    updateDom(dom, oldVNode, newRenderedVNode);
    component.componentDidUpdate();
    return;
  }

  // Update properties
  const newProps = newVNode.props || {};
  const oldProps = oldVNode.props || {};

  // Update/add new properties
  Object.entries(newProps).forEach(([key, value]) => {
    if (key === "children") return;
    // Event handlers
    if (key.startsWith("on") && typeof value === "function") {
      const eventName = key.toLowerCase().substring(2);
      dom.addEventListener(eventName, value);
    }
    // Class names
    else if (key === "className") {
      dom.setAttribute("class", value);
    }
    // Styles
    else if (key === "style") {
      if (typeof value === "string") {
        dom.setAttribute("style", value);
      } else if (typeof value === "object") {
        Object.entries(value).forEach(([cssKey, cssValue]) => {
          dom.style[cssKey] = cssValue;
        });
      }
    }
    // Other attributes
    else {
      dom.setAttribute(key, value);
    }
  });

  // Remove old properties
  Object.keys(oldProps).forEach((key) => {
    if (!(key in newProps)) {
      dom.removeAttribute(key);
    }
  });

  // Update children
  const newChildren = newProps.children || [];
  const oldChildren = oldProps.children || [];
  const maxLength = Math.max(newChildren.length, oldChildren.length);

  for (let i = 0; i < maxLength; i++) {
    if (i >= newChildren.length) {
      dom.removeChild(dom.childNodes[i]);
    } else if (i >= oldChildren.length) {
      dom.appendChild(createDom(newChildren[i]));
    } else {
      updateDom(dom.childNodes[i], oldChildren[i], newChildren[i]);
    }
  }
}
```

- Inputs:

  - `dom`: Current DOM element
  - `oldVNode`: Previous virtual node
  - `newVNode`: New virtual node

- Key Operations:

1. Node removal/creation handling
2. Text node updates
3. Component updates
4. Property updates
5. Child node reconciliation

### diff and renderWithVDOM

```js
function diff(vNode, container, oldDom) {
  const newDom = createDom(vNode);
  if (oldDom) {
    container.replaceChild(newDom, oldDom);
  } else {
    container.appendChild(newDom);
  }
  return newDom;
}

function renderWithVDOM(vNode, container) {
  const oldDom = container.firstChild;
  diff(vNode, container, oldDom);
}
```

**Purpose**:

- `diff`: Handles root-level DOM updates
- `renderWithVDOM`: Entry point for rendering virtual DOM to container

### createStore

```js
function createStore(reducer) {
  let state = reducer(undefined, { type: "__INIT__" });
  const listeners = [];

  function dispatch(action) {
    state = reducer(state, action);
    listeners.forEach((listener) => listener());
  }

  function subscribe(listener) {
    listeners.push(listener);
    return () => {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }

  function getState() {
    return state;
  }

  return { dispatch, subscribe, getState };
}
```
