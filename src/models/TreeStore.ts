export interface TreeItem {
  id: number | string;
  parent: number | string | null;
  [key: string]: any;
}

export class TreeStore<T extends TreeItem> {
  private itemsMap: Map<number | string, T> = new Map();

  constructor(initialItems: T[]) {
    for (const item of initialItems) {
      this.itemsMap.set(item.id, item);
    }
  }

  public getAll(): T[] {
    return Array.from(this.itemsMap.values());
  }

  public getItem(id: number | string): T | undefined {
    for (const [key, value] of this.itemsMap.entries()) {
      if (key === id) {
        return value;
      }
    }
    return undefined;
  }

  public getChildren(id: number | string): T[] {
    const result: T[] = [];
    for (const item of this.itemsMap.values()) {
      if (item.parent === id) {
        result.push(item);
      }
    }
    return result;
  }

  public getAllChildren(id: number | string): T[] {
    const allDesc: T[] = [];
    const visited = new Set<string | number>();

    const collect = (curId: number | string) => {
      if (visited.has(curId)) return;
      visited.add(curId);

      const kids = this.getChildren(curId);
      for (const c of kids) {
        collect(c.id); // Collect children first
        allDesc.push(c); // Then add to the list
      }
    };

    collect(id);
    return allDesc;
  }

  public getAllParents(id: number | string): T[] {
    const path: T[] = [];
    let cur = this.getItem(id);
    while (cur) {
      path.push(cur);
      if (cur.parent === null) break;
      cur = this.getItem(cur.parent);
    }
    return path;
  }

  public addItem(newItem: T): void {
    this.itemsMap.set(newItem.id, newItem);
  }

  public removeItem(id: number | string): void {
    const allKids = this.getAllChildren(id);
    for (const kid of allKids) {
      this.itemsMap.delete(kid.id);
    }
    this.itemsMap.delete(id);
  }

  public updateItem(updatedItem: T): void {
    this.itemsMap.set(updatedItem.id, updatedItem);
  }
}
