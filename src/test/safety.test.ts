import assert from 'assert';
import * as path from 'path';
import { validateWorkspacePath, validateFileCount } from '../utils/fileSysUtils';
import { SYSTEM_PATHS, MAX_FILES_LIMIT } from '../constants';

suite('Safety Validations', () => {
    suite('Workspace Path Validation', () => {
        test('should reject system paths', () => {
            SYSTEM_PATHS.forEach(systemPath => {
                assert.strictEqual(
                    validateWorkspacePath(systemPath),
                    false,
                    `Should reject system path: ${systemPath}`
                );
            });
        });
        test('should reject system paths with one level child', () => {
            SYSTEM_PATHS.forEach(systemPath => {
                const testPath = path.join(systemPath, 'childPath');
                assert.strictEqual(
                    validateWorkspacePath(testPath),
                    false,
                    `Should reject system path with one level child: ${testPath}`
                );
            });
        });
        test('should accept non-system paths', () => {
            const safePaths = [
                SYSTEM_PATHS[0] + '/Documents/projects/myapp',
                SYSTEM_PATHS[0] + '/Documents/projects/myapp/childPath'
            ];

            safePaths.forEach(safePath => {
                assert.strictEqual(
                    validateWorkspacePath(safePath),
                    true,
                    `Should accept safe path: ${safePath}`
                );
            });
        });

        test('should handle paths with mixed separators', () => {
            const mixedPath = 'C:\\Windows/System32';
            assert.strictEqual(
                validateWorkspacePath(mixedPath),
                false,
                'Should normalize and reject system path with mixed separators'
            );
        });

        test('should be case insensitive', () => {
            const upperCasePath = 'C:\\WINDOWS\\System32';
            const lowerCasePath = 'c:\\windows\\system32';
            
            assert.strictEqual(
                validateWorkspacePath(upperCasePath),
                false,
                'Should reject uppercase system path'
            );
            assert.strictEqual(
                validateWorkspacePath(lowerCasePath),
                false,
                'Should reject lowercase system path'
            );
        });
    });

    suite('File Count Validation', () => {
        type ProjectName = 'small-project' | 'medium-project' | 'large-project' | 'too-large-project';
        const mockDirectories: Record<ProjectName, number> = {
            'small-project': 50,
            'medium-project': 500,
            'large-project': MAX_FILES_LIMIT,
            'too-large-project': MAX_FILES_LIMIT + 1
        };

        let originalCountFunction: any;

        setup(() => {
            originalCountFunction = require('../utils/fileSysUtils').countConcernedFilesInDirectory;

            require('../utils/fileSysUtils').countConcernedFilesInDirectory = (path: string) => {
                const projectName = path.split('/').pop() as ProjectName;
                return mockDirectories[projectName] || 0;
            };
        });

        teardown(() => {
            require('../utils/fileSysUtils').countConcernedFilesInDirectory = originalCountFunction;
        });

        test('should accept projects with files under limit', () => {
            (['small-project', 'medium-project', 'large-project'] as ProjectName[]).forEach(project => {
                assert.strictEqual(
                    validateFileCount(`/path/to/${project}`),
                    true,
                    `Should accept project with ${mockDirectories[project]} files`
                );
            });
        });

        test('should reject projects exceeding file limit', () => {
            assert.strictEqual(
                validateFileCount('/path/to/too-large-project'),
                false,
                `Should reject project with ${mockDirectories['too-large-project']} files`
            );
        });

        test('should handle edge cases', () => {
            assert.strictEqual(
                validateFileCount('/path/to/empty-project'),
                true,
                'Should accept empty project'
            );
            require('../utils/fileSysUtils').countConcernedFilesInDirectory = () => MAX_FILES_LIMIT;
            assert.strictEqual(
                validateFileCount('/path/to/exact-limit-project'),
                true,
                `Should accept project with exactly ${MAX_FILES_LIMIT} files`
            );
        });
    });
}); 