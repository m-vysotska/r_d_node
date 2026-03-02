export enum FileStatus {
  PENDING = 'pending',
  READY = 'ready',
}

export enum FileVisibility {
  PRIVATE = 'private',
  PUBLIC = 'public',
}

export type FileEntityType = 'user' | 'product';
