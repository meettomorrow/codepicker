import { Command } from 'commander';
import { processDirectory } from './fileProcessor.js';
import { loadConfig } from './configLoader.js';
import { writeTokenInfo } from './utils.js';

export function run(argv) {
  const program = new Command();
  program
    .version('0.1.0')
    .option('-i, --input <directory>', 'Input directory', process.cwd())
    .option('-o, --output <directory>', 'Output directory', './codepicker-output')
    .option('-c, --config <file>', 'Config file path')
    .option('-f, --force', 'Force overwrite all output files')
    .parse(argv);

  const options = program.opts();

  loadConfig(options.config)
    .then(config => {
      if (!config) {
        throw new Error('Failed to load configuration');
      }
      console.log('Loaded configuration:', config);
      return processDirectory(options.input, options.output, config, options.force);
    })
    .then(({ processedFiles, totalTokens }) => {
      console.log(`Processed ${processedFiles.length} files.`);
      console.log(`Total tokens: ${totalTokens}`);
      return writeTokenInfo(options.output, processedFiles, totalTokens);
    })
    .then(() => console.log('Token info written to output directory.'))
    .catch(error => {
      console.error('Error:', error.message);
      console.error('Stack trace:', error.stack);
      process.exit(1);
    });
}
