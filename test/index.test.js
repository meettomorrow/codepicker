import { jest } from '@jest/globals';
import { processDirectory } from '../src/fileProcessor.js';
import fs from 'fs-extra';
import path from 'path';
import { glob } from 'glob';
import { encode } from 'llama-tokenizer-js';

jest.mock('fs-extra');
jest.mock('glob');
jest.mock('llama-tokenizer-js');

describe('CodePicker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('processDirectory should process files correctly', async () => {
    const mockFiles = [
      '/test/file1.js',
      '/test/file2.jsx',
    ];

    glob.sync.mockReturnValue(mockFiles);

    fs.readFile.mockImplementation((file) => {
      if (file === '/test/file1.js') {
        return Promise.resolve('const a = 1;\n\nconst b = 2;');
      }
      if (file === '/test/file2.jsx') {
        return Promise.resolve('function Component() {\n  return <div>Test</div>;\n}');
      }
    });

    encode.mockImplementation((text) => new Array(text.length));

    const result = await processDirectory('/test', '/output', {
      excludedDirs: [],
      fileExtensions: ['js', 'jsx'],
    });

    expect(result.processedFiles).toHaveLength(2);
    expect(result.totalTokens).toBeGreaterThan(0);

    expect(fs.createWriteStream).toHaveBeenCalledWith('/output/output.txt');
  });
});
