export const rootName = 'Template';
export const createRoot = () => ({
  type: rootName,
  children: []
});

export const elementName = 'Element';
export const createElement = (tagName, properties = []) => ({
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

export const propertyName = 'Property';
export const createProperty = (name, value, expression = false) => ({
  type: propertyName,
  name,
  value,
  expression
});

export const TemplateEscapedName = 'TemplateEscaped';
export const createTemplateEscaped = value => ({
  type: TemplateEscapedName,
  value
});
