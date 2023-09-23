const ACCESS_LEVEL: { [key: string]: number } = {
  OWNER: 1,
  ADMIN: 2,
  EDITOR: 3,
  MODERATOR: 4,
  CONTRIBUTOR: 5,
  MAINTAINER: 6,
  USER: 7,
  GUEST: 8,
} as const;

type ObjectValues<T> = T[keyof T];
type AccessLevel = ObjectValues<typeof ACCESS_LEVEL>;

export { ACCESS_LEVEL, AccessLevel };
