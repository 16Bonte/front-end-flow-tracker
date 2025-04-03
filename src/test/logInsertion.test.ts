import assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import { addLogStatementsToFile } from '../commands';

suite('Log Insertion Tests', () => {
    test('should skip styled components', async () => {
        const styledComponentCode = `
            const StyledDiv = styled.div\`
                color: red;
            \`;
        `;
        const tempFile = path.join(__dirname, 'temp-styled.tsx');
        fs.writeFileSync(tempFile, styledComponentCode);
        
        const result = await addLogStatementsToFile(tempFile);
        assert.strictEqual(result, null, 'Should not modify styled components');
        
        fs.unlinkSync(tempFile);
    });

    test('should skip array methods', async () => {
        const arrayMethodCode = `
            const arr = [1, 2, 3];
            arr.map(x => x * 2);
            arr.filter(x => x > 1);
        `;
        const tempFile = path.join(__dirname, 'temp-array.ts');
        fs.writeFileSync(tempFile, arrayMethodCode);
        
        const result = await addLogStatementsToFile(tempFile);
        assert.strictEqual(result, null, 'Should not modify array methods');
        
        fs.unlinkSync(tempFile);
    });

    test('should add logs to regular functions', async () => {
        const regularFunctionCode = `
            function testFunction() {
                console.log('test');
            }
            
            const arrowFunction = () => {
                console.log('test');
            }
            
            class TestClass {
                method() {
                    console.log('test');
                }
            }
        `;
        const tempFile = path.join(__dirname, 'temp-functions.ts');
        fs.writeFileSync(tempFile, regularFunctionCode);
        
        const result = await addLogStatementsToFile(tempFile);
        assert.notStrictEqual(result, null, 'Should modify regular functions');
        
        const modifiedContent = fs.readFileSync(tempFile, 'utf8');
        // Check for the specific log format we expect
        assert(modifiedContent.includes('fetch'), 'Should add fetch statements');
        assert(modifiedContent.includes('testFunction'), 'Should include function name');
        assert(modifiedContent.includes('arrowFunction'), 'Should include arrow function name');
        assert(modifiedContent.includes('method'), 'Should include class method name');
        
        fs.unlinkSync(tempFile);
    });

    test('should handle malformed code gracefully', async () => {
        const malformedCode = `
            function testFunction() {
                console.log('test');
            }
            
            // Missing closing brace
            function brokenFunction() {
                console.log('test');
        `;
        const tempFile = path.join(__dirname, 'temp-malformed.ts');
        fs.writeFileSync(tempFile, malformedCode);
        
        try {
            const result = await addLogStatementsToFile(tempFile);
            assert.strictEqual(result, null, 'Should not modify malformed code');
        } catch (error) {
            assert.ok(error instanceof Error, 'Should throw an error');
            assert.strictEqual(error.message.includes('Unexpected token'), true, 'Should be a syntax error');
        } finally {
            fs.unlinkSync(tempFile);
        }
    });
}); 