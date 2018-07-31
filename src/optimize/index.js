/* eslint-disable no-param-reassign */
import htmlTags from 'html-tags';
import _ from 'lodash';
import traverser from '../traverser';
import createInliningVisitor from './create-inlining-visitor';
import deadCodeEliminationVisitor from './dead-code-elimination-visitor';
import setRequiredFlagVisitor from './set-is-required-flag-visitor';
import mergeVisitors from './merge-visitors';

export default function optimize(ast, table) {
  traverser(ast, mergeVisitors(createMainVisitor(table), deadCodeEliminationVisitor));
  return ast;
}

function createMainVisitor(table) {
  return {
    Mixin: {
      exit(node) {
        const tableRC = getTableComponent(node.name, table);
        traverser(node, setRequiredFlagVisitor(tableRC.definitions));
      }
    },
    Element: {
      exit(node) {
        const name = node.tagName;
        const isRC = !htmlTags.includes(name);
        const tableRC = getTableComponent(name, table);
        if (isRC && tableRC) {
          // Generate collection of props name and value.
          const propsToInline =
            tableRC.node.props &&
            tableRC.node.props.map(prop => {
              const definition =
                tableRC.definitions && tableRC.definitions.find(def => def.name === prop);
              if (prop === 'children' && node.children) {
                return { name: prop, value: node.children, definition };
              }
              return {
                name: prop,
                value: node.attributes.find(attr => attr.name === prop),
                definition
              };
            });
          // Clone Mixin.
          const componentNode = _.merge({}, tableRC.node);
          // Convert Element in Mixin.
          Object.assign(node, componentNode);
          delete node.tagName;
          delete node.attributes;
          // Inline props.
          if (propsToInline) {
            inlinepProps(node, propsToInline);
          }
          // Check again if new Mixin has React Components.
          optimize(node, table);
        }
      }
    }
  };
}

function getTableComponent(name, table) {
  if (table.components[name]) {
    return table.components[name];
  }
  const tableDep = table.dependencies[name];
  if (tableDep) {
    const component = Object.values(table.components).find(
      rc => rc.createdFrom === tableDep.path && rc.defaultExport
    );
    return component;
  }
  return null;
}

function inlinepProps(ast, props) {
  traverser(ast, mergeVisitors(createInliningVisitor(props), deadCodeEliminationVisitor));
}
