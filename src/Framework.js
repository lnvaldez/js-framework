let globalId = 0;
let globalParent;
const componentState = new Map();

export function useState(initialState) {
  const id = globalId;
  const parent = globalParent;
  globalId++;

  return (() => {
    const state = componentState.get(parent) || { cache: [] };
    componentState.set(parent, state);

    if (state.cache[id] == null) {
      state.cache[id] = {
        value:
          typeof initialState === "function" ? initialState() : initialState,
      };
    }

    const setState = (stateUpdate) => {
      const parentState = componentState.get(parent);
      if (!parentState) return;

      if (typeof stateUpdate === "function") {
        state.cache[id].value = stateUpdate(state.cache[id].value);
      } else {
        state.cache[id].value = stateUpdate;
      }

      queueMicrotask(() => {
        const currentGlobalId = globalId;
        globalId = 0;
        render(parentState.component, parentState.props, parent);
        globalId = currentGlobalId;
      });
    };

    return [state.cache[id].value, setState];
  })();
}

export function render(element, props, parent) {
  if (!element) return;

  const state = componentState.get(parent) || { cache: [] };

  componentState.set(parent, {
    ...state,
    component: element,
    props: props,
  });

  globalParent = parent;

  const currentGlobalId = globalId;
  globalId = 0;

  let output;
  if (typeof element.type === "function") {
    output = element.type(element.props);
  } else {
    output = element;
  }

  globalId = currentGlobalId;

  if (output) {
    parent.innerHTML = "";
    renderVirtualDOM(output, parent);
  }
}

export function createElement(type, props, ...children) {
  const flatChildren = children.flat().filter((child) => child != null);
  return {
    type,
    props: {
      ...props,
      children: flatChildren.length === 1 ? flatChildren[0] : flatChildren,
    },
  };
}

export function renderVirtualDOM(vnode, container) {
  if (!vnode) return;

  if (typeof vnode === "string" || typeof vnode === "number") {
    container.appendChild(document.createTextNode(vnode));
    return;
  }

  if (Array.isArray(vnode)) {
    vnode.forEach((child) => renderVirtualDOM(child, container));
    return;
  }

  const dom = document.createElement(vnode.type);

  if (vnode.props) {
    Object.entries(vnode.props).forEach(([name, value]) => {
      if (name === "style" && typeof value === "object") {
        Object.assign(dom.style, value);
      } else if (name === "className") {
        dom.setAttribute("class", value);
      } else if (name !== "children") {
        if (name.startsWith("on") && typeof value === "function") {
          const eventName = name.toLowerCase().substring(2);
          dom.addEventListener(eventName, value);
        } else {
          if (value !== false && value !== null) {
            dom.setAttribute(name, value);
          }
        }
      }
    });
  }

  if (vnode.props && vnode.props.children) {
    if (Array.isArray(vnode.props.children)) {
      vnode.props.children.forEach((child) => renderVirtualDOM(child, dom));
    } else {
      renderVirtualDOM(vnode.props.children, dom);
    }
  }

  container.appendChild(dom);
}

const store = {
  state: {},
  listeners: [],
  setState(newState) {
    this.state = { ...this.state, ...newState };
    this.listeners.forEach((listener) => listener());
  },
  subscribe(listener) {
    this.listeners.push(listener);
  },
};

export default store;
