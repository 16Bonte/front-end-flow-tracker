import assert from 'assert';
import * as vscode from 'vscode';

suite('Extension Test Suite', () => {
	test('Commands should be registered', async () => {
		try {  
			await vscode.commands.executeCommand('front-end-flow-tracker.addLogs');
		} catch (error) {
			console.log('Expected command execution error during test:', error);
		}
		
		const commands = await vscode.commands.getCommands(true);
		assert.ok(commands.includes('front-end-flow-tracker.addLogs'), 'Add logs command should be registered');
	});
});