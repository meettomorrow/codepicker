import fs from 'fs-extra';
import path from 'path';

export async function writeTokenInfo(outputDir, processedFiles, totalTokens) {
  const infoFile = path.join(outputDir, 'token_info.txt');
  let content = `Total Tokens: ${totalTokens}\n\n`;
  content += 'Files:\n';
  for (const file of processedFiles) {
    content += `${file.path}: ${file.tokens} tokens\n`;
  }
  await fs.writeFile(infoFile, content);
}
