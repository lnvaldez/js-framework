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
  const dom = document.createElement(element.type);

  Object.entries(element.props || {}).forEach(([name, value]) => {
    if (name !== "children") {
      dom[name] = value;
    }
  });

  if (element.props.children) {
    if (typeof element.props.children === "string") {
      dom.textContent = element.props.children;
    } else if (Array.isArray(element.props.children)) {
      element.props.children.forEach((child) => render(child, dom));
    } else if (element.props.children) {
      render(element.props.children, dom);
    }
  }

  container.appendChild(dom);
}
