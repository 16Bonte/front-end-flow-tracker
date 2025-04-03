import express from "express";
import * as vscode from "vscode";
import { ADD_LOG_ROUTE, PORT } from "./constants";
import { createLogGrouper } from "./logGrouper";
import { findAvailablePort, notifyPortIssue } from "./utils/portUtils";
import { Server } from "http";

const app = express();
app.use(express.json());

let serverPort: number | null = null;
let serverInstance: Server | null = null;
let logFlushInterval: NodeJS.Timeout | null = null;

export const getServerPort = (): number | null => {
  return serverPort;
};

export const startServer = async () => {
  if (serverInstance) {
    return;
  }

  const logGrouper = createLogGrouper();

  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    next();
  });

  app.post(ADD_LOG_ROUTE, (req, res) => {
    const { message } = req.body;
    if (typeof message === "string") {
      console.log(`Received message: ${message}`);
      logGrouper.processLog(message);
      res.send("VS Code function executed successfully!");
    } else {
      res
        .status(400)
        .send(
          "Invalid request body. Expected an object with a 'message' string."
        );
    }
  });

  logFlushInterval = setInterval(() => {
    logGrouper.writePendingLogs();
  }, 1000);

  const availablePort = await findAvailablePort(PORT);
  
  if (!availablePort) {
    notifyPortIssue(PORT, null);
    return;
  }
  
  if (availablePort !== PORT) {
    notifyPortIssue(PORT, availablePort);
  }
  
  serverPort = availablePort;

  serverInstance = app.listen(availablePort, '127.0.0.1', (err?: any) => {
    if (err) {
      console.error("❌ Server failed to start:", err);
      vscode.window.showErrorMessage(`Failed to start server: ${err.message}`);
    } else {
      console.log(`🚀 Server running at http://localhost:${availablePort}`);
    }
  });
};

export const stopServer = (): Promise<void> => {
  return new Promise<void>((resolve) => {
    if (!serverInstance) {
      resolve();
      return;
    }

    if (logFlushInterval) {
      clearInterval(logFlushInterval);
      logFlushInterval = null;
    }

    serverInstance.close(() => {
      console.log("🛑 Server stopped");
      serverInstance = null;
      serverPort = null;
      resolve();
    });
  });
};
