function normalizePropertyName(name) {
  switch (name) {
    case 'className':
      return 'class';
    case 'htmlFor':
      return 'for';
    case 'tabIndex':
      return 'tabindex';
    case 'defaultValue':
      return 'value';
    default:
      return name;
  }
}

export default normalizePropertyName;
