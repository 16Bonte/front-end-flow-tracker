# Front End Flow Tracker - JS/TS

## What Is This?

Front End Flow Tracker - JS/TS (FEFT) is a Visual Studio Code extension that helps you understand your code's execution flow by automatically inserting tracking statements at the beginning of all your JavaScript and TypeScript functions.

⚠️ **Important Disclaimers**:
- This extension is intended for local development and debugging purposes only. It should not be commited or used in production environments.
- Developers using this extension are solely responsible for its usage and any modifications made to their codebase. Please review all code changes before committing them.
- It is strongly recommended to commit your changes before using this extension, as it will modify your source files.
- The extension may modify your code formatting.

## How It Works: Step-by-Step

### 1. Installation

#### Option A: Local Development

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/front-end-flow-tracker.git
   cd front-end-flow-tracker
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Run the extension by using "Run Extension" in the "Run and Debug" section of VS Code

#### Option B: VS Code Marketplace (Production)

1. Install extension directly the extension from the VS code marketplace 

### 2. Adding Log Statements

1. Open your JS/TS project in VS Code
2. Run the command by pressing `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
3. Type "WTH: Add logs" and select it
4. Review and confirm the changes in the dialog
5. The extension will:
   - Scan your project files (only .js, .jsx, .ts, .tsx)
   - Parse each file using Babel
   - Inject network requests at the beginning of each function
   - Show a progress indicator during this process

### 3. What Gets Added to Your Code

The extension adds a simple `fetch()` call at the beginning of each function:

```javascript
// Your original function
function calculateTotal(items) {
  // Your code
}

// After WTH runs
function calculateTotal(items) {
  fetch("http://localhost:3049/add-log", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: "abc123: path/to/file.js - calculateTotal" })
  });
  // Your code
}
```

### 4. How the Logs Are Collected

1. When you run the "WTH: Add logs" command, the extension starts a local HTTP server on port 3049
2. When you run your application, each function execution sends a log message to this server
3. The server:
   - Receives the log messages
   - Groups related function calls (those happening close together in time)
   - Marks each group with a distinct colored emoji (🔵, 🟣, 🟢, etc.)
   - Saves logs to a file in your project at `frontEndFlowTracker/logs`

### 5. Viewing the Execution Flow

1. Run your application normally after adding the logs
2. Open the `frontEndFlowTracker/logs` file in VS Code
3. You'll see entries like:
   ```
   🔵 abc123: src/components/App.js - render
   🔵 def456: src/utils/formatter.js - formatDate
   🔵 ghi789: src/utils/formatter.js - formatCurrency
   🟣 jkl012: src/api/userApi.js - fetchUserData
   ```
4. Functions called together share the same emoji marker
5. New "waves" of execution get different emoji markers

## Important Details

- **Safety Measures**: The extension won't modify system directories and is limited to processing 500 files max
- **File Filtering**: Only processes JS/TS files (.js, .jsx, .ts, .tsx) and skips node_modules, .git, dist, etc.
- **Server**: Runs locally on port 3049 (or alternative if busy) and only accepts connections from localhost
- **Log Groups**: Execution "waves" are grouped by timing (functions called within 1 second)
- **Log Storage**: All logs are saved to `frontEndFlowTracker/logs` in your project root

## Common Troubleshooting

- **Port Issue**: If port 3049 is busy, the extension will try to use an alternative port
- **No Logs Appearing**: Make sure your application is running
- **Too Many Files**: If your project has over 500 JS/TS files, try running on a specific directory

## Limitations

- Only works with JavaScript and TypeScript files
- May fail on complex or experimental syntax

## Technical Implementation

Under the hood, the extension:
1. Uses Babel to parse and transform your code
2. Injects fetch requests that report function execution
3. Runs an Express HTTP server to capture these requests
4. Groups related function calls by timing
5. Writes formatted logs to a file in your workspace

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Release Notes

### 1.0.0 (2025-04-03)

- Initial release
- Automatic log statement insertion for JavaScript/TypeScript functions
- Local HTTP server for log collection (port 3049)
- Log grouping with visual markers
- Safety features to prevent system directory modifications
- Progress indicators for log insertion process
- Central log file creation in frontEndFlowTracker/logs

---
### 1.0.0 (2025-04-09)

- Improve the list of directories that should not be updated
- Add logo
- Fill missing infos in package.json