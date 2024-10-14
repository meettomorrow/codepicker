import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import llamaTokenizer from 'llama-tokenizer-js';

const FILE_DELIMITER = '=== FILE BOUNDARY ====';

export async function processDirectory(inputDir, outputDir, config, forceOverwrite = false) {
  try {
    validateConfig(config);

    await fs.ensureDir(outputDir);

    // Create a temporary directory
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'file-processor-'));

    const result = await processDirectoryRecursive(inputDir, tempDir, '', config, false);

    // Compare and copy files from temp to output directory
    await compareAndCopyFiles(tempDir, outputDir, forceOverwrite);

    // Clean up temp directory
    await fs.remove(tempDir);

    return result;
  } catch (error) {
    console.error('Error in processDirectory:', error);
    throw error;
  }
}

function validateConfig(config) {
  if (!config) {
    throw new Error('Configuration is missing');
  }
  if (!config.fileExtensions || !Array.isArray(config.fileExtensions)) {
    throw new Error('Invalid or missing fileExtensions in configuration');
  }
  if (!config.excludedDirs || !Array.isArray(config.excludedDirs)) {
    throw new Error('Invalid or missing excludedDirs in configuration');
  }
  if (!config.specialDirs || !Array.isArray(config.specialDirs)) {
    throw new Error('Invalid or missing specialDirs in configuration');
  }
}

async function compareAndCopyFiles(tempDir, outputDir, forceOverwrite) {
  const tempFiles = await fs.readdir(tempDir);

  for (const file of tempFiles) {
    const tempFilePath = path.join(tempDir, file);
    const outputFilePath = path.join(outputDir, file);

    const tempStats = await fs.stat(tempFilePath);

    if (forceOverwrite || !await fs.pathExists(outputFilePath)) {
      await fs.copy(tempFilePath, outputFilePath, { overwrite: true });
      console.log(`Copied ${file} to output directory.`);
    } else {
      const outputStats = await fs.stat(outputFilePath);
      if (tempStats.size !== outputStats.size) {
        await fs.copy(tempFilePath, outputFilePath, { overwrite: true });
        console.log(`Updated ${file} in output directory.`);
      } else {
        console.log(`Skipped ${file} (no changes).`);
      }
    }
  }
}

async function processDirectoryRecursive(inputDir, outputDir, relativePath, config, isParentSpecial, parentOutputFile = null) {
  const fullPath = path.join(inputDir, relativePath);

  if (config.excludedDirs.includes(relativePath)) {
    return { processedFiles: [], totalTokens: 0 };
  }

  const isSpecial = isSpecialDirectory(relativePath, config.specialDirs);

  const outputFile = isParentSpecial ?
    path.join(outputDir, `${relativePath.replace(/\//g, '_') || 'root'}.txt`) :
    parentOutputFile || path.join(outputDir, 'root.txt');

  let processedFiles = [];
  let totalTokens = 0;

  const files = await getMatchingFiles(fullPath, config);
  if (files.length > 0) {
    const result = await processFiles(inputDir, fullPath, outputFile, files, config);
    processedFiles.push(...result.processedFiles);
    totalTokens += result.totalTokens;
  }

  const subDirs = await getSubdirectories(fullPath);
  for (const subDir of subDirs) {
    const subDirRelativePath = path.join(relativePath, subDir);
    const result = await processDirectoryRecursive(
      inputDir,
      outputDir,
      subDirRelativePath,
      config,
      isSpecial,
      outputFile,
    );
    processedFiles.push(...result.processedFiles);
    totalTokens += result.totalTokens;
  }

  return { processedFiles, totalTokens };
}

function isSpecialDirectory(dir, specialDirs) {
  return dir === '' || specialDirs.some(specialDir => dir === specialDir);
}

async function getMatchingFiles(dirPath, config) {
  const allFiles = await fs.readdir(dirPath);
  return allFiles.filter(file =>
    !file.startsWith('.') &&
    config.fileExtensions.includes(path.extname(file).slice(1))
  );
}

async function getSubdirectories(dirPath) {
  const allItems = await fs.readdir(dirPath, { withFileTypes: true });
  return allItems
    .filter(item => item.isDirectory() && !item.name.startsWith('.'))
    .map(item => item.name);
}

async function processFiles(rootDir, inputDir, outputFile, files) {
  let totalTokens = 0;
  const processedFiles = [];

  const writeStream = fs.createWriteStream(outputFile, { flags: 'a' });

  for (const file of files) {
    const filePath = path.join(inputDir, file);
    const relativePath = path.relative(rootDir, filePath);
    const content = await processFile(filePath);

    const outputContent = `${FILE_DELIMITER}\n// File path: ${relativePath}\n${content}\n`;
    const tokens = llamaTokenizer.encode(outputContent).length;

    writeStream.write(outputContent);
    totalTokens += tokens;
    processedFiles.push({ path: relativePath, tokens });
  }

  writeStream.end();
  console.log(`Finished processing files in: ${inputDir}. Total tokens: ${totalTokens}`);
  return { processedFiles, totalTokens };
}

async function processFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    return content.replace(/^\s*[\r\n]/gm, '');
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error);
    throw error;
  }
}
