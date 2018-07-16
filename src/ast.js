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
export const createAttribute = ({
  name,
  value,
  valuePath,
  isBoolean = false,
  isString = false
}) => ({
  type: attributeName,
  name,
  value,
  valuePath,
  isBoolean,
  isString
});

// Template engine syntax for inline JavaScript.
// export const scriptletName = 'Scriptlet';
// export const createScriptlet = value => ({
//   type: scriptletName,
//   value
// });

// Template engine syntax for escaped interpolation.
export const interpolationEscapedName = 'InterpolationEscaped';
export const createInterpolationEscaped = valuePath => ({
  type: interpolationEscapedName,
  valuePath
});

// Template engine syntax for unescaped interpolation.
// export const interpolationUnescapedName = 'InterpolationUnescaped';
// export const createInterpolationUnescaped = value => ({
//   type: interpolationUnescapedName,
//   value
// });

// Template engine syntax for condition.
export const conditionName = 'Condition';
export const createCondition = ({ testPath, consequent, alternate = null }) => ({
  type: conditionName,
  testPath,
  consequent,
  alternate
});

// Template engine syntax for iteration.
export const iterationName = 'Iteration';
export const createIteration = ({
  iterablePath,
  currentValuePath,
  indexPath,
  arrayPath,
  body = null
}) => ({
  type: iterationName,
  iterablePath,
  currentValuePath,
  indexPath,
  arrayPath,
  body
});

// Template engine syntax for mixin.
export const mixinName = 'Mixin';
export const createMixin = (name, props) => ({
  type: mixinName,
  name,
  props,
  children: []
});
