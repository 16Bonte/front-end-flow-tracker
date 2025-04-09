export const LOGS_FOLDER_NAME = "frontEndFlowTracker";
export const LOG_FILE_NAME = "logs";
export const IGNORED_DIRECTORIES = [
  "node_modules",
  ".git",
  "frontEndFlowTracker",
  "dist",
  "build",
  "coverage",
  ".next",
  ".cache",
  ".turbo",
  "out",
  ".tsbuildinfo",
  ".svelte-kit",
  ".angular",
  ".nuxt",
  ".gatsby",
  ".remix",
  ".vite",
  ".astro",
  ".parcel-cache",
  ".webpack"
];
export const SYSTEM_PATHS = [
  "/home",
  "/root",
  "/etc",
  "/usr",
  "/var",
  '/bin',
  '/sbin',
  '/opt',
  '/Users',
  '/System',
  '/Library',
  '/Applications',
  'C:\\Windows',
  'C:\\Program Files',
  'C:\\Program Files (x86)',
  'C:\\Users',
  'C:\\ProgramData',
  'C:\\System32',
];
export const SUPPORTED_FILE_EXTENSIONS = [".js", ".jsx", ".ts", ".tsx"];
export const MAX_FILES_LIMIT = 500;
export const MAX_BATCH_SIZE = 10;

export const PORT = 3049;
export const ADD_LOG_ROUTE = "/add-log";
