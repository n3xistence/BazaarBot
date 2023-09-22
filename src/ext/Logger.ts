import { wrapInColor } from "./Helper";

const getTimestamp = (): string => new Date().toLocaleTimeString();

const __INFO = (...args: Array<string>): void => {
  console.log(
    `${wrapInColor("blue", `${getTimestamp()} [INFO]`.padEnd(18, " "))} ${args.join(" ")}`
  );
};

const __ERROR = (...args: Array<string>): void => {
  console.log(
    `${wrapInColor("red", `${getTimestamp()} [ERROR]`.padEnd(18, " "))} ${args.join(" ")}`
  );
};

const __WARN = (...args: Array<string>): void => {
  console.log(
    `${wrapInColor("yellow", `${getTimestamp()} [WARN]`.padEnd(18, " "))} ${args.join(" ")}`
  );
};

const __SUCCESS = (...args: Array<string>): void => {
  console.log(
    `${wrapInColor("green", `${getTimestamp()} [SUCCESS]`.padEnd(18, " "))} ${args.join(" ")}`
  );
};

const log = (logLevel: string | null, ...args: Array<string>): void => {
  switch (logLevel?.toLowerCase() ?? "") {
    case "info":
      __INFO(...args);
      break;
    case "error":
      __ERROR(...args);
      break;
    case "warn":
    case "warning":
      __WARN(...args);
      break;
    case "success":
      __SUCCESS(...args);
      break;
    default:
      console.log(...args);
  }
};

export default { log };
