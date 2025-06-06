export type IdType = string | number;

export interface TreeItem {
  id: IdType;
  parent: IdType | null;
  [key: string]: unknown;
}

export class TreeStore<T extends TreeItem = TreeItem> {
  private items: T[];

  constructor(items: T[]) {
    this.items = [...items];
  }

  getAll(): T[] {
    return this.items;
  }

  getItem(id: IdType): T | undefined {
    return this.items.find((item) => item.id === id);
  }

  getChildren(id: IdType): T[] {
    return this.items.filter((item) => item.parent === id);
  }

  getAllChildren(id: IdType): T[] {
    const result: T[] = [];
    const queue = this.getChildren(id);

    while (queue.length > 0) {
      const current = queue.shift() as T;
      result.push(current);
      queue.push(...this.getChildren(current.id));
    }

    return result;
  }

  getAllParents(id: IdType): T[] {
    const result: T[] = [];
    let current: T | undefined = this.getItem(id);

    while (current) {
      result.push(current);
      current = current.parent !== null ? this.getItem(current.parent) : undefined;
    }

    return result;
  }

  addItem(item: T): void {
    this.items.push(item);
  }

  removeItem(id: IdType): void {
    const toRemove = new Set<IdType>();
    const queue: IdType[] = [id];

    while (queue.length > 0) {
      const currentId = queue.shift() as IdType;
      toRemove.add(currentId);
      for (const child of this.getChildren(currentId)) {
        queue.push(child.id);
      }
    }

    this.items = this.items.filter((item) => !toRemove.has(item.id));
  }

  updateItem(updated: T): void {
    const index = this.items.findIndex((item) => item.id === updated.id);
    if (index !== -1) {
      this.items[index] = { ...this.items[index], ...updated };
    }
  }
}
