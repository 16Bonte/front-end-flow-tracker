import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { LOG_FILE_NAME, LOGS_FOLDER_NAME, SUPPORTED_FILE_EXTENSIONS, IGNORED_DIRECTORIES, SYSTEM_PATHS, MAX_FILES_LIMIT } from "../constants";
import * as babelParser from "@babel/parser";
import traverse from "@babel/traverse";
import { shouldSkipFunction } from "../commands";

export const getWorkspacePath = (): string | null => {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders) {
    vscode.window.showErrorMessage("No workspace folder found.");
    return null;
  }
  return workspaceFolders[0].uri.fsPath;
};

export const countConcernedFilesInDirectory = (directoryPath: string): number => {
  const directoryName = path.basename(directoryPath);
  if (IGNORED_DIRECTORIES.includes(directoryName)) {
    return 0;
  }

  try {
    const files = fs.readdirSync(directoryPath);
    let count = 0;

    for (const file of files) {
      const filePath = path.join(directoryPath, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        count += countConcernedFilesInDirectory(filePath);
      } else if (isSupportedFile(file) && containsConcernedFunctions(filePath)) {
        count++;
      }
    }

    return count;
  } catch (error) {
    console.error(`Error accessing directory ${directoryPath}:`, error);
    return 0;
  }
};

export const isSupportedFile = (fileName: string): boolean => {
  return SUPPORTED_FILE_EXTENSIONS.some(ext => fileName.endsWith(ext));
};


const containsConcernedFunctions = (filePath: string): boolean => {
  try {
    const fileContent = fs.readFileSync(filePath, "utf8");
    const ast = babelParser.parse(fileContent, {
      sourceType: "module",
      plugins: ["typescript", "jsx"],
    });
    
    let hasConcernedFunctions = false;
    traverse(ast, {
      "FunctionDeclaration|FunctionExpression|ClassMethod|ObjectMethod|ArrowFunctionExpression"(path) {
        if (!shouldSkipFunction(path)) {
          hasConcernedFunctions = true;
          path.stop();
        }
      },
    });

    return hasConcernedFunctions;
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error);
    return false;
  }
};

const createDirectoryIfNotExists = (directoryPath: string): void => {
  if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath);
  }
};

const createFileIfNotExists = (
  filePath: string,
  initialContent: string = ""
): void => {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, initialContent, "utf8");
  }
};

export const createLogFileIfNotExists = (workspacePath: string): string | null => {

  const logsFolderPath = path.join(workspacePath, LOGS_FOLDER_NAME);
  const logFilePath = path.join(logsFolderPath, LOG_FILE_NAME);

  createDirectoryIfNotExists(logsFolderPath);
  createFileIfNotExists(logFilePath);

  return logFilePath;
};

export const getLastTwoPathSegments = (filePath: string): string => {
  const parts = filePath.split(path.sep);
  const lastTwoParts = parts.slice(-2);
  return lastTwoParts.join("/");
};

export const validateWorkspacePath = (workspacePath: string): boolean => {
  const normalizedWorkspacePath = normalizePath(workspacePath);
  
  return !isPathInSystemDirectory(normalizedWorkspacePath);
};

const normalizePath = (path: string): string => {
  return path.replace(/\\/g, '/').toLowerCase();
};

const isPathInSystemDirectory = (normalizedPath: string): boolean => {
  return SYSTEM_PATHS.some(systemPath => {
    const normalizedSystemPath = normalizePath(systemPath);
    return isExactSystemPathOrDirectChild(normalizedPath, normalizedSystemPath);
  });
};

const isExactSystemPathOrDirectChild = (normalizedPath: string, normalizedSystemPath: string): boolean => {
  const isExactMatch = normalizedPath === normalizedSystemPath;
  const isDirectChild = normalizedPath.startsWith(normalizedSystemPath + '/') && 
                       normalizedPath.split('/').length === normalizedSystemPath.split('/').length + 1;
  
  return isExactMatch || isDirectChild;
};  

export const validateFileCount = (workspacePath: string): boolean => {
  const filesAmount = countConcernedFilesInDirectory(workspacePath);
  return filesAmount <= MAX_FILES_LIMIT;
};
