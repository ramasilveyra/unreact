export const rootName = 'Template';
export const createRoot = () => ({
  type: rootName,
  children: []
});

export const elementName = 'Element';
export const createElement = (tagName, attributes = []) => ({
  type: elementName,
  tagName,
  attributes,
  children: []
});

export const textName = 'Text';
export const createText = value => ({
  type: textName,
  value
});

export const attributeName = 'Attribute';
export const createAttribute = (name, value, expression = false) => ({
  type: attributeName,
  name,
  value,
  expression
});

export const templateEscapedName = 'TemplateEscaped';
export const createTemplateEscaped = value => ({
  type: templateEscapedName,
  value
});
