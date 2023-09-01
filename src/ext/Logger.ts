const getTimestamp = (): string => new Date().toLocaleTimeString();

const wrapInColor = (color: string, str: string): string => {
  const resetColor = "\x1b[0m";

  let clr;
  switch (color) {
    case "blue":
      clr = "\x1b[94m";
      break;
    case "green":
      clr = "\x1b[32m";
      break;
    case "red":
      clr = "\x1b[31m";
      break;
    case "yellow":
      clr = `\x1b[33m`;
      break;
    default:
      clr = "\x1b[0m";
      break;
  }
  return `${clr}${str}${resetColor}`;
};

const __INFO = (...args: string[]): void => {
  console.log(`${wrapInColor("blue", `${getTimestamp()} [INFO]`)} - ${args.join(" ")}`);
};

const __ERROR = (...args: string[]): void => {
  console.log(`${wrapInColor("red", `${getTimestamp()} [ERROR]`)} - ${args.join(" ")}`);
};

const __WARN = (...args: string[]): void => {
  console.log(`${wrapInColor("yellow", `${getTimestamp()} [WARN]`)} - ${args.join(" ")}`);
};

const log = (logLevel: string, ...args: string[]): void => {
  switch (logLevel.toLowerCase()) {
    case "info":
      __INFO(...args);
      break;
    case "error":
      __ERROR(...args);
      break;
    case "warn":
      __WARN(...args);
      break;
    default:
      console.log(args);
  }
};

export default { log };
