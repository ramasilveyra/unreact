export const rootName = 'Template';
export const createRoot = () => ({
  type: rootName,
  children: []
});

export const elementName = 'Element';
export const createElement = (tagName, properties = null) => ({
  type: elementName,
  tagName,
  properties,
  children: []
});

export const textName = 'Text';
export const createText = value => ({
  type: textName,
  value
});

export const EJSEscapedName = 'EJSEscaped';
export const createEJSEscaped = value => ({
  type: EJSEscapedName,
  value
});
