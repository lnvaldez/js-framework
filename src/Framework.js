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

function createElement(type, props, ...children) {
  return { type, props: { ...props, children: children.flat() } };
}

function createDom(vNode) {
  if (typeof vNode === "string" || typeof vNode === "number") {
    return document.createTextNode(vNode);
  }

  if (vNode === null || vNode === undefined) {
    return document.createTextNode("");
  }

  if (typeof vNode.type === "function") {
    const component = new vNode.type(vNode.props);
    const renderedVNode = component.render();
    const dom = createDom(renderedVNode);
    component._renderCallback = () => {
      const newVNode = component.render();
      updateDom(dom, renderedVNode, newVNode);
    };
    component.componentDidMount();
    return dom;
  }

  const dom = document.createElement(vNode.type);

  const props = vNode.props || {};
  Object.entries(props).forEach(([key, value]) => {
    if (key === "children") {
      return;
    } else if (key.startsWith("on") && typeof value === "function") {
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

function updateDom(dom, oldVNode, newVNode) {
  if (!oldVNode && !newVNode) return;

  if (!newVNode) {
    dom.remove();
    return;
  }

  if (!oldVNode) {
    const newDom = createDom(newVNode);
    dom.parentNode.replaceChild(newDom, dom);
    return;
  }

  if (typeof newVNode === "string" || typeof newVNode === "number") {
    if (oldVNode !== newVNode) {
      dom.textContent = newVNode;
    }
    return;
  }

  if (typeof newVNode.type === "function") {
    const component = new newVNode.type(newVNode.props);
    const newRenderedVNode = component.render();
    updateDom(dom, oldVNode, newRenderedVNode);
    component.componentDidUpdate();
    return;
  }

  const newProps = newVNode.props || {};
  const oldProps = oldVNode.props || {};

  Object.entries(newProps).forEach(([key, value]) => {
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

  Object.keys(oldProps).forEach((key) => {
    if (!(key in newProps)) {
      dom.removeAttribute(key);
    }
  });

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

const Framework = {
  createElement,
  render: renderWithVDOM,
  createStore,
  jsx: createElement,
  Component,
};

export default Framework;
