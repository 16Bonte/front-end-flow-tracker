import * as fs from "fs";
import * as path from "path";

import * as babelParser from "@babel/parser";
import * as t from "@babel/types";
import * as vscode from "vscode";

import {
  MAX_BATCH_SIZE,
  IGNORED_DIRECTORIES,
  LOG_FILE_NAME,
  LOGS_FOLDER_NAME,
  MAX_FILES_LIMIT,
} from "./constants";
import generate from "@babel/generator";
import traverse, { NodePath } from "@babel/traverse";
import { insertLogStatement } from "./utils/generalUtils";
import {
  countConcernedFilesInDirectory,
  createLogFileIfNotExists,
  getLastTwoPathSegments,
  getWorkspacePath,
  validateWorkspacePath,
  validateFileCount,
  isSupportedFile,
} from "./utils/fileSysUtils";
import {
  getFunctionName,
  isArrayIteratorMethod,
  isAllowedFunction,
  isInsideStyledComponent,
} from "./utils/astUtils";
import { confirmLogInjection } from "./utils/webviewUtils";

export const writeLog = (message: string) => {
  const workspacePath = getWorkspacePath();
  if (!workspacePath) {
    return;
  }

  const filePath = path.join(workspacePath, LOGS_FOLDER_NAME, LOG_FILE_NAME);

  fs.appendFileSync(filePath, message + "\n", "utf8");
};

const trackOperationProgress = async <T>(
  title: string,
  totalItems: number,
  operation: (progressCallback: (filePath: string) => void) => Promise<T>
): Promise<T> => {
  return vscode.window.withProgress({
    location: vscode.ProgressLocation.Notification,
    title,
    cancellable: false
  }, async (progress) => {
    progress.report({ increment: 0, message: "Starting..." });
    
    let processedItems = 0;
    const increment = 100 / totalItems;
    
    const result = await operation((filePath: string) => {
      processedItems++;
      progress.report({ 
        increment, 
        message: `Processing file ${processedItems}/${totalItems}: ${filePath}`
      });
    });

    progress.report({ increment: 100, message: "Completed!" });
    return result;
  });
};

export const handleAddLogStatements = async () => {
  const workspacePath = getWorkspacePath();
  if (!workspacePath) {
    return null;
  }

  if (!validateWorkspacePath(workspacePath)) {
    vscode.window.showErrorMessage(
      `You can not run the extension in system directories (${workspacePath}) for safety reasons. Please select a project-specific directory.`
    );
    return;
  }

  const filesAmount = await countConcernedFilesInDirectory(workspacePath);

  if (!validateFileCount(workspacePath)) {
    vscode.window.showErrorMessage(
      `Too many files to process (${filesAmount}). The maximum limit is ${MAX_FILES_LIMIT} files for safety. Please run the command on a smaller directory.`
    );
    return;
  }

  const shouldContinue = await confirmLogInjection(filesAmount, workspacePath);
  if (!shouldContinue) {
    return;
  }

  const logFilePath = createLogFileIfNotExists(workspacePath);
  if (!logFilePath) {
    return;
  }

  await trackOperationProgress(
    "Adding log statements",
    filesAmount,
    async (progressCallback) => {
      await addLogsStatementsToDirectory(workspacePath, logFilePath, progressCallback);
      vscode.window.showInformationMessage("Log statements added successfully!");
    }
  );
};

export const addLogsStatementsToDirectory = async (
  dirPath: string,
  logFilePath: string,
  progressCallback?: (filePath: string) => void
): Promise<void> => {
  const files = fs.readdirSync(dirPath);
  let logEntries: string[] = [];
  let currentBatch: Promise<string | null>[] = [];

  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      if (IGNORED_DIRECTORIES.includes(file)) {
        continue;
      }
      await addLogsStatementsToDirectory(filePath, logFilePath, progressCallback);
    } else if (isSupportedFile(file)) {
      currentBatch.push(addLogStatementsToFile(filePath));
      
      if (currentBatch.length >= MAX_BATCH_SIZE) {
        const batchResults = await Promise.all(currentBatch);
        logEntries.push(...batchResults.filter((result): result is string => result !== null));
        currentBatch = [];
      }

      if (progressCallback) {
        progressCallback(filePath);
      }
    }
  }

  if (currentBatch.length > 0) {
    const batchResults = await Promise.all(currentBatch);
    logEntries.push(...batchResults.filter((result): result is string => result !== null));
  }

  if (logEntries.length > 0) {
    fs.appendFileSync(logFilePath, logEntries.join("\n") + "\n", "utf8");
  }
  return Promise.resolve();
};

const transformFunctionBody = (
  path: NodePath<t.Node>,
  functionName: string,
  pathToDisplay: string
): void => {
  if (!isAllowedFunction(path)) {
    return;
  }

  const logStatement = insertLogStatement(`${pathToDisplay} - ${functionName}`);

  if (t.isBlockStatement(path.node.body)) {
    path.node.body.body.unshift(logStatement);
  } else {
    const originalBody = path.node.body;
    path.node.body = t.blockStatement([
      logStatement,
      t.returnStatement(originalBody),
    ]);
  }
};

export const shouldSkipFunction = (path: NodePath<t.Node>): boolean =>
  isInsideStyledComponent(path) ||
  !isAllowedFunction(path) ||
  isArrayIteratorMethod(path.parent);

export const addLogStatementsToFile = async (
  filePath: string
): Promise<string | null> => {
  let fileContent: string;
  try {
    fileContent = fs.readFileSync(filePath, "utf8");
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    return null;
  }

  const pathToDisplay = getLastTwoPathSegments(filePath);
  let modified = false;

  try {
    const ast = babelParser.parse(fileContent, {
      sourceType: "module",
      plugins: ["typescript", "jsx"],
    });

    traverse(ast, {
      "FunctionDeclaration|FunctionExpression|ClassMethod|ObjectMethod|ArrowFunctionExpression"(
        path: NodePath<t.Node>
      ) {
        if (shouldSkipFunction(path)) {
          return;
        }

        transformFunctionBody(path, getFunctionName(path), pathToDisplay);
        modified = true;
      },
    });

    if (modified) {
      const { code: modifiedCode } = generate(ast, { retainLines: true });
      try {
        fs.writeFileSync(filePath, modifiedCode, "utf8");
        return `Modified: ${filePath}`;
      } catch (error) {
        console.error(`Error writing file ${filePath}:`, error);
        return null;
      }
    }
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error);
    return null;
  }

  return null;
};
