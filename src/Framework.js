let globalId = 0;
let globalParent;
const componentState = new Map();

export function createElement(type, props, ...children) {
  return {
    type,
    props: {
      ...props,
      children: children.length === 1 ? children[0] : children,
    },
  };
}

export function render(element, container) {
  if (typeof element === "string" || typeof element === "number") {
    container.appendChild(document.createTextNode(element));
    return;
  }

  if (typeof element.type === "function") {
    const component = element.type(element.props);
    render(component, container);
    return;
  }

  const dom = document.createElement(element.type);

  Object.entries(element.props || {}).forEach(([name, value]) => {
    if (name.startsWith("on")) {
      const eventName = name.toLowerCase().substring(2);
      dom.addEventListener(eventName, value);
    } else if (name !== "children") {
      dom[name] = value;
    }
  });

  if (element.props.children) {
    if (Array.isArray(element.props.children)) {
      element.props.children.forEach((child) => render(child, dom));
    } else {
      render(element.props.children, dom);
    }
  }

  container.appendChild(dom);
}

export function useState(initialState) {
  const id = globalId;
  const parent = globalParent;
  globalId++;

  const state = componentState.get(parent) || { cache: [] };
  componentState.set(parent, state);

  if (state.cache[id] == null) {
    state.cache[id] = {
      value: typeof initialState === "function" ? initialState() : initialState,
    };
  }

  const setState = (newValue) => {
    const state = componentState.get(parent);
    if (!state) return;

    state.cache[id].value = newValue;
    console.log("State updated to:", state.cache[id].value);
  };

  return [state.cache[id].value, setState];
}
