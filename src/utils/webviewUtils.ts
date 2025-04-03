import * as vscode from 'vscode';

enum WebviewCommand {
  continue = 'continue',
  cancel = 'cancel'
}

interface WebviewMessage {
  command: WebviewCommand;
}

interface ConfirmationOptions {
  filesAmount: number;
  folderName: string;
}

const createWebviewPanel = () => 
  vscode.window.createWebviewPanel(
    'logStatements.confirm',
    'Add Log Statements Confirmation',
    vscode.ViewColumn.One,
    { enableScripts: true }
  );

const getWebviewContent = ({ filesAmount, folderName }: ConfirmationOptions): string => `
  <!DOCTYPE html>
  <html>
    <head>
      <style>
        body { 
          padding: 20px;
          font-family: var(--vscode-font-family);
          max-width: 600px;
          margin: 0 auto;
        }
        .warning-container {
          background: var(--vscode-inputValidation-warningBackground);
          border: 1px solid var(--vscode-inputValidation-warningBorder);
          border-radius: 4px;
          padding: 15px;
          margin: 20px 0;
        }
        .warning-title {
          color: var(--vscode-inputValidation-warningForeground);
          font-weight: bold;
          margin-bottom: 10px;
        }
        .warning-list {
          margin: 0;
          padding-left: 20px;
          color: var(--vscode-inputValidation-warningForeground);
        }
        .button-container { 
          margin-top: 25px;
          display: flex;
          gap: 10px;
          justify-content: flex-end;
        }
        button {
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
        }
        .cancel-button {
          background: var(--vscode-button-secondaryBackground);
          color: var(--vscode-button-secondaryForeground);
        }
        .cancel-button:hover {
          background: var(--vscode-button-secondaryHoverBackground);
        }
        .continue-button {
          background: var(--vscode-button-background);
          color: var(--vscode-button-foreground);
        }
        .continue-button:hover {
          background: var(--vscode-button-hoverBackground);
        }
        .files-count {
          font-weight: bold;
          color: var(--vscode-editor-foreground);
        }
      </style>
    </head>
    <body>
      <h2>Add Log Statements</h2>
      <p>You are about to add log statements to <span class="files-count">${filesAmount} files located in ${folderName}</span>.</p>
      
      <div class="warning-container">
        <div class="warning-title">⚠️ Please be aware of the following:</div>
        <ul class="warning-list">
          <li>This will modify your source files directly</li>
          <li>The changes will affect all functions in the selected files</li>
          <li>This operation cannot be automatically undone</li>
          <li>Make sure you have committed your changes to version control</li>
          <li>Large projects might take some time to process</li>
        </ul>
      </div>

      <div class="button-container">
        <button class="cancel-button" onclick="cancel()">Cancel</button>
        <button class="continue-button" onclick="confirm()">Continue</button>
      </div>

      <script>
        const vscode = acquireVsCodeApi();
        function cancel() { vscode.postMessage({ command: 'cancel' }); }
        function confirm() { vscode.postMessage({ command: 'continue' }); }
      </script>
    </body>
  </html>
`;

export const confirmLogInjection = (filesAmount: number, folderName: string): Promise<boolean> => {
  const panel = createWebviewPanel();
  const options: ConfirmationOptions = { filesAmount, folderName };
  
  panel.webview.html = getWebviewContent(options);

  return new Promise<boolean>((resolve) => {
    panel.webview.onDidReceiveMessage(
      (message: WebviewMessage) => {
        panel.dispose();
        resolve(message.command === WebviewCommand.continue);
      },
      undefined
    );
  });
};