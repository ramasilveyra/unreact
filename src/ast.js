// Root.
export const rootName = 'Program';
export const createRoot = () => ({
  type: rootName,
  children: []
});

// HTML elements.
export const elementName = 'Element';
export const createElement = (tagName, attributes = []) => ({
  type: elementName,
  tagName,
  attributes,
  children: []
});

// HTML text elements.
export const textName = 'Text';
export const createText = value => ({
  type: textName,
  value
});

// HTML attributes.
export const attributeName = 'Attribute';
export const createAttribute = (name, value, expression = false) => ({
  type: attributeName,
  name,
  value,
  expression
});

// Template engine syntax for inline JavaScript.
export const scriptletName = 'Scriptlet';
export const createScriptlet = value => ({
  type: scriptletName,
  value
});

// Template engine syntax for escaped interpolation.
export const interpolationEscapedName = 'InterpolationEscaped';
export const createInterpolationEscaped = value => ({
  type: interpolationEscapedName,
  value
});

// Template engine syntax for unescaped interpolation.
export const interpolationUnescapedName = 'InterpolationUnescaped';
export const createInterpolationUnescaped = value => ({
  type: interpolationUnescapedName,
  value
});

// Template engine syntax for condition.
export const conditionName = 'Condition';
export const createCondition = (test, consequent, alternate = null) => ({
  type: conditionName,
  test,
  consequent,
  alternate
});

// Template engine syntax for iteration.
export const iterationName = 'Iteration';
export const createIteration = (test, consequent, alternate = null) => ({
  type: iterationName,
  test,
  consequent,
  alternate
});
