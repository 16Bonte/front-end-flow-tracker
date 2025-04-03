import * as t from "@babel/types";
import { NodePath } from "@babel/traverse";

export const isStyledComponentTag = (tag: t.Node): boolean => {
  if (t.isMemberExpression(tag) && t.isIdentifier(tag.object) && tag.object.name === "styled") {
    return true;
  }

  if (t.isCallExpression(tag) && t.isIdentifier(tag.callee) && tag.callee.name === "styled") {
    return true;
  }

  return false;
};

export const isInsideStyledComponent = (path: NodePath): boolean => {
  let currentPath: NodePath | null = path;

  while (currentPath) {
    const parent: t.Node | null = currentPath.parent;

    if (
      t.isTemplateElement(currentPath.node) ||
      t.isTemplateLiteral(currentPath.node)
    ) {
      if (parent && t.isTaggedTemplateExpression(parent)) {
        const tag = parent.tag;
        if (
          t.isMemberExpression(tag) &&
          t.isIdentifier(tag.object) &&
          tag.object.name === "styled"
        ) {
          return true;
        }

        if (
          t.isCallExpression(tag) &&
          t.isIdentifier(tag.callee) &&
          tag.callee.name === "styled"
        ) {
          return true;
        }
      }
    }

    currentPath = currentPath.parentPath;
  }

  return false;
};

export const isArrayIteratorMethod = (node: t.Node): boolean =>
  t.isCallExpression(node) &&
  t.isMemberExpression(node.callee) &&
  t.isIdentifier(node.callee.property) &&
  [
    "map",
    "filter",
    "forEach",
    "reduce",
    "some",
    "every",
    "find",
    "findIndex",
    "flatMap",
    "sort",
    "includes",
  ].includes(node.callee.property.name);

export const isAllowedFunction = (
  path: NodePath<t.Node>
): path is NodePath<
  | t.FunctionDeclaration
  | t.FunctionExpression
  | t.ClassMethod
  | t.ObjectMethod
  | t.ArrowFunctionExpression
> =>
  t.isFunctionDeclaration(path.node) ||
  t.isFunctionExpression(path.node) ||
  t.isClassMethod(path.node) ||
  t.isObjectMethod(path.node) ||
  t.isArrowFunctionExpression(path.node);

export const getArrowFunctionName = (path: NodePath<t.ArrowFunctionExpression>): string => {
  if (path.parent && t.isVariableDeclarator(path.parent) && t.isIdentifier(path.parent.id)) {
    return path.parent.id.name;
  }
  
  if (path.parentPath?.parentPath?.node &&
      t.isExportDefaultDeclaration(path.parentPath?.parentPath?.node) &&
      path.parent &&
      t.isVariableDeclarator(path.parent) &&
      t.isIdentifier(path.parent.id)) {
    return path.parent.id.name;
  }

  return "anonymous function";
};

export const getFunctionName = (path: NodePath<t.Node>): string => {
  if (t.isCallExpression(path.parent) && t.isIdentifier(path.parent.callee) && path.parent.callee.name === "useEffect") {
    return "useEffect";
  }
  
  if (t.isCallExpression(path.parent) && t.isIdentifier(path.parent.callee) && path.parent.callee.name === "useMemo") {
    return "useMemo";
  }

  if (t.isFunctionDeclaration(path.node) || t.isFunctionExpression(path.node)) {
    return path.node.id?.name || "anonymous function";
  }

  if (t.isClassMethod(path.node) || t.isObjectMethod(path.node)) {
    return t.isIdentifier(path.node.key) ? path.node.key.name : "anonymous function";
  }

  if (t.isArrowFunctionExpression(path.node)) {
    return getArrowFunctionName(path as NodePath<t.ArrowFunctionExpression>);
  }

  return "anonymous function";
};
