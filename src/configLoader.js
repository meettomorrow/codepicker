import { cosmiconfig } from 'cosmiconfig';

const defaultConfig = {
  excludedDirs: ['node_modules', '.git', 'dist', 'build', 'test'],
  fileExtensions: ['js', 'jsx', 'ts', 'tsx', 'md'],
  specialDirs: [
    'app',
    'app/spaces',
    'lib'
  ],
};

export async function loadConfig(configPath) {
  const explorer = cosmiconfig('codepicker');
  try {
    const result = configPath
      ? await explorer.load(configPath)
      : await explorer.search();
    const config = { ...defaultConfig, ...(result ? result.config : {}) };
    console.log('Loaded configuration:', config);
    return config;
  } catch (error) {
    console.warn(`Failed to load config: ${error.message}`);
    console.log('Using default configuration:', defaultConfig);
    return defaultConfig;
  }
}
