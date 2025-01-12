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
    const state = componentState.get(container) || { cache: [] };
    componentState.set(container, {
      ...state,
      component: element,
      props: element.props,
    });
    globalParent = container;

    const currentGlobalId = globalId;
    globalId = 0;
    const output = element.type(element.props);
    globalId = currentGlobalId;

    container.innerHTML = "";
    render(output, container);
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
    const parentState = componentState.get(parent);
    if (!parentState) return;

    if (typeof newValue === "function") {
      state.cache[id].value = newValue(state.cache[id].value);
    } else {
      state.cache[id].value = newValue;
    }

    render(parentState.component, parent);
  };

  return [state.cache[id].value, setState];
}

export function useEffect(callback, dependencies) {
  const id = globalId;
  const parent = globalParent;
  globalId++;

  const state = componentState.get(parent) || { cache: [] };
  componentState.set(parent, state);

  if (state.cache[id] == null) {
    state.cache[id] = { dependencies: undefined };
  }

  const dependenciesChanged =
    !dependencies ||
    !state.cache[id].dependencies ||
    dependencies.some((dep, i) => dep !== state.cache[id].dependencies[i]);

  if (dependenciesChanged) {
    if (state.cache[id].cleanup) {
      state.cache[id].cleanup();
    }
    state.cache[id].cleanup = callback();
    state.cache[id].dependencies = dependencies;
  }
}
