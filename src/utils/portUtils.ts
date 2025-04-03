import * as net from 'net';
import * as vscode from 'vscode';

/**
 * Checks if a port is available
 * @param port The port to check
 * @returns Promise that resolves to true if the port is available, false otherwise
 */
export const isPortAvailable = (port: number): Promise<boolean> => {
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.once('error', () => {
      resolve(false);
    });
    
    server.once('listening', () => {
      server.close();
      resolve(true);
    });
    
    server.listen(port);
  });
};

/**
 * Finds an available port starting from the given port
 * @param startPort The port to start checking from
 * @param maxAttempts Maximum number of ports to try (default: 10)
 * @returns Promise that resolves to an available port or null if none found
 */
export const findAvailablePort = async (startPort: number, maxAttempts: number = 10): Promise<number | null> => {
  for (let i = 0; i < maxAttempts; i++) {
    const portToTry = startPort + i;
    const available = await isPortAvailable(portToTry);
    
    if (available) {
      return portToTry;
    }
  }
  
  return null;
};

/**
 * Notifies the user about port issues and suggests solutions
 * @param originalPort The original port that was unavailable
 * @param newPort The new port that will be used (if found)
 */
export const notifyPortIssue = (originalPort: number, newPort: number | null): void => {
  if (newPort) {
    vscode.window.showWarningMessage(
      `Port ${originalPort} is already in use. The extension will use port ${newPort} instead.`,
      'OK'
    );
  } else {
    vscode.window.showErrorMessage(
      `Unable to find an available port. The extension may not function correctly. Please free up some ports and reload the extension.`,
      'OK'
    );
  }
}; 