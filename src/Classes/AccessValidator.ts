import { AccessLevel, ACCESS_LEVEL } from "../enums/AccessLevel";

const getKeyByValue = (object: { [key: string]: any }, value: number) => {
  return Object.entries(object).find(([_, val]) => val === value)?.[0];
};

const raise = (message: string): never => {
  throw new Error(message);
};

class AccessValidator {
  private level: AccessLevel;
  private resource: AccessLevel;

  constructor(level: string | number, resource: string | number) {
    this.level =
      typeof level === "number"
        ? ACCESS_LEVEL[getKeyByValue(ACCESS_LEVEL, level) ?? raise("Invalid Access Level")]
        : ACCESS_LEVEL[level];

    this.resource =
      typeof resource === "number"
        ? ACCESS_LEVEL[getKeyByValue(ACCESS_LEVEL, resource) ?? raise("Invalid Access Level")]
        : ACCESS_LEVEL[resource];
  }

  validate(): boolean {
    return this.level <= this.resource;
  }
}

export default AccessValidator;
