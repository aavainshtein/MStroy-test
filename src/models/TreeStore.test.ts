import { describe, it, expect } from "vitest";
import { TreeStore } from "./TreeStore";
import type { TreeItem } from "./TreeStore";

describe("TreeStore", () => {
  const initialItems: TreeItem[] = [
    { id: 1, parent: null },
    { id: 2, parent: 1 },
    { id: 3, parent: 1 },
    { id: 4, parent: 2 },
    { id: 5, parent: 2 },
  ];

  const treeStore = new TreeStore(initialItems);

  it("should return all items", () => {
    const allItems = treeStore.getAll();
    expect(allItems).toHaveLength(5);
  });

  it("should return a specific item by id", () => {
    const item = treeStore.getItem(2);
    expect(item).toEqual({ id: 2, parent: 1 });
  });

  it("should return children of a specific item", () => {
    const children = treeStore.getChildren(1);
    expect(children).toEqual([
      { id: 2, parent: 1 },
      { id: 3, parent: 1 },
    ]);
  });

  it("should return all descendants of a specific item", () => {
    const allChildren = treeStore.getAllChildren(1);
    expect(allChildren).toEqual([
      { id: 2, parent: 1 },
      { id: 3, parent: 1 },
      { id: 4, parent: 2 },
      { id: 5, parent: 2 },
    ]);
  });

  it("should return all parents of a specific item", () => {
    const allParents = treeStore.getAllParents(4);
    expect(allParents).toEqual([
      { id: 4, parent: 2 },
      { id: 2, parent: 1 },
      { id: 1, parent: null },
    ]);
  });

  it("should add a new item", () => {
    treeStore.addItem({ id: 6, parent: 3 });
    const item = treeStore.getItem(6);
    expect(item).toEqual({ id: 6, parent: 3 });
  });

  it("should remove an item and its descendants", () => {
    treeStore.removeItem(2);
    const allItems = treeStore.getAll();
    expect(allItems).toEqual([
      { id: 1, parent: null },
      { id: 3, parent: 1 },
    ]);
  });

  it("should update an item", () => {
    treeStore.updateItem({ id: 3, parent: null });
    const item = treeStore.getItem(3);
    expect(item).toEqual({ id: 3, parent: null });
  });
});

describe("TreeStore with mixed id types", () => {
  const items: TreeItem[] = [
    { id: 1, parent: null, label: "Айтем 1" },
    { id: "2", parent: 1, label: "Айтем 2" },
    { id: 3, parent: 1, label: "Айтем 3" },
    { id: 4, parent: "2", label: "Айтем 4" },
    { id: 5, parent: "2", label: "Айтем 5" },
    { id: 6, parent: "2", label: "Айтем 6" },
  ];

  const treeStore = new TreeStore(items);

  it("should return all items", () => {
    const allItems = treeStore.getAll();
    expect(allItems).toHaveLength(6);
  });

  it("should return a specific item by id", () => {
    const item = treeStore.getItem("2");
    expect(item).toEqual({ id: "2", parent: 1, label: "Айтем 2" });
  });

  it("should return children of a specific item", () => {
    const children = treeStore.getChildren(1);
    expect(children).toEqual([
      { id: "2", parent: 1, label: "Айтем 2" },
      { id: 3, parent: 1, label: "Айтем 3" },
    ]);
  });

  it("should return all descendants of a specific item", () => {
    const allChildren = treeStore.getAllChildren(1);
    expect(allChildren).toEqual([
      { id: "2", parent: 1, label: "Айтем 2" },
      { id: 3, parent: 1, label: "Айтем 3" },
      { id: 4, parent: "2", label: "Айтем 4" },
      { id: 5, parent: "2", label: "Айтем 5" },
      { id: 6, parent: "2", label: "Айтем 6" },
    ]);
  });

  it("should return all parents of a specific item", () => {
    const allParents = treeStore.getAllParents(4);
    expect(allParents).toEqual([
      { id: 4, parent: "2", label: "Айтем 4" },
      { id: "2", parent: 1, label: "Айтем 2" },
      { id: 1, parent: null, label: "Айтем 1" },
    ]);
  });

  it("should add a new item", () => {
    treeStore.addItem({ id: "7", parent: 3, label: "Айтем 7" });
    const item = treeStore.getItem("7");
    expect(item).toEqual({ id: "7", parent: 3, label: "Айтем 7" });
  });

  it("should remove an item and its descendants", () => {
    treeStore.removeItem("2");
    const allItems = treeStore.getAll();
    expect(allItems).toEqual([
      { id: 1, parent: null, label: "Айтем 1" },
      { id: 3, parent: 1, label: "Айтем 3" },
    ]);
  });

  it("should update an item", () => {
    treeStore.updateItem({ id: "2", parent: null, label: "Updated Айтем 2" });
    const item = treeStore.getItem("2");
    expect(item).toEqual({ id: "2", parent: null, label: "Updated Айтем 2" });
  });
});
