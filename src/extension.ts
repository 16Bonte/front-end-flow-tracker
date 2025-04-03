import * as vscode from "vscode";
import { startServer, stopServer } from "./server";
import { handleAddLogStatements } from "./commands";

export async function activate(context: vscode.ExtensionContext) {
  try {
    await startServer();
  } catch (error) {
    vscode.window.showErrorMessage(`Failed to start the extension: ${error}`);
    return;
  }

  const addLogsStatementsCommand = vscode.commands.registerCommand(
    "front-end-flow-tracker.addLogs",
    () => {
      handleAddLogStatements();
    }
  );

  context.subscriptions.push(
    addLogsStatementsCommand,
  );
}

export function deactivate() {
  return stopServer();
}
