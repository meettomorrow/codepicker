# Codepicker

This project processes files in a directory structure, tokenizes their content, and outputs the results to a specified directory.

## Features

- Processes files based on specified file extensions
- Handles special directories differently from regular directories
- Excludes specified directories from processing
- Calculates token count for processed files
- Avoids unnecessary file updates by comparing file sizes
- Provides an option to force overwrite all files

## Installation

1. Clone this repository
2. Run `npm install` to install dependencies
3. Run `npm link` to make the `codepicker` command available globally

## Usage

Run the script using the following command:

```
codepicker [options]
```

Options:
- `-i, --input <directory>`: Input directory (default: current working directory)
- `-o, --output <directory>`: Output directory (default: ./codepicker-output)
- `-c, --config <file>`: Config file path
- `-f, --force`: Force overwrite all output files
- `-V, --version`: Output the version number
- `-h, --help`: Display help for command

Example:
```
codepicker -i ./my-project -o ./processed-output -c ./my-config.json -f
```

## Configuration

The configuration file should contain the following:

- `fileExtensions`: An array of file extensions to process (e.g., `["js", "jsx", "ts", "tsx"]`)
- `excludedDirs`: An array of directory names to exclude from processing
- `specialDirs`: An array of directory names to treat as special cases

Example configuration file:

```json
{
  "fileExtensions": ["js", "jsx", "ts", "tsx"],
  "excludedDirs": ["node_modules", "build", "dist"],
  "specialDirs": ["src", "lib"]
}
```

## How it works

1. The script loads the configuration file.
2. It creates a temporary directory for processing files.
3. It recursively processes files in the input directory, respecting the configuration settings.
4. Processed files are written to the temporary directory.
5. After processing, the script compares the size of each file in the temporary directory with its counterpart in the output directory (if it exists).
6. Files are only copied to the output directory if:
   - They are new (don't exist in the output directory)
   - Their size has changed
   - The `--force` flag is used
7. The script writes token information to the output directory.
8. The temporary directory is cleaned up after processing.

This approach ensures that only necessary updates are made to the output directory, reducing I/O operations and preventing accidental overwrites of unchanged files.

## License

[MIT License](LICENSE)
