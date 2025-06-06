import { describe, it, expect } from "vitest";
import { TreeStore } from "./TreeStore";
import type { TreeItem } from "./TreeStore";
import _ from "lodash";

describe("TreeStore with mixed id types", () => {
  const items: TreeItem[] = [
    { id: 1, parent: null, label: "Айтем 1" },
    { id: "2", parent: 1, label: "Айтем 2 - строка id" },
    { id: 2, parent: 1, label: "Айтем 2 - номер id" },
    { id: 3, parent: 1, label: "Айтем 3" },
    { id: 4, parent: "2", label: "Айтем 4" },
    { id: 5, parent: "2", label: "Айтем 5" },
    { id: 6, parent: "2", label: "Айтем 6" },
  ];

  it("should return all items", () => {
    const treeStore = new TreeStore(items);
    const allItems = treeStore.getAll();
    expect(allItems).toHaveLength(7);
  });

  it("should return a specific item by string id", () => {
    const treeStore = new TreeStore(items);
    const item = treeStore.getItem("2");
    expect(item).toEqual({ id: "2", parent: 1, label: "Айтем 2 - строка id" });
  });

  it("should return a specific item by number id", () => {
    const treeStore = new TreeStore(items);
    const item = treeStore.getItem(2);
    expect(item).toEqual({ id: 2, parent: 1, label: "Айтем 2 - номер id" });
  });

  it("should return children of a specific item", () => {
    const treeStore = new TreeStore(items);
    const children = treeStore.getChildren(1);
    expect(children).toEqual([
      { id: "2", parent: 1, label: "Айтем 2 - строка id" },
      { id: 2, parent: 1, label: "Айтем 2 - номер id" },
      { id: 3, parent: 1, label: "Айтем 3" },
    ]);
  });

  it("should return all descendants of a specific item", () => {
    const treeStore = new TreeStore(items);
    const allChildren = treeStore.getAllChildren(1);

    const expectedChildren = [
      { id: "2", parent: 1, label: "Айтем 2 - строка id" },
      { id: 2, parent: 1, label: "Айтем 2 - номер id" },
      { id: 3, parent: 1, label: "Айтем 3" },
      { id: 4, parent: "2", label: "Айтем 4" },
      { id: 5, parent: "2", label: "Айтем 5" },
      { id: 6, parent: "2", label: "Айтем 6" },
    ];

    expect(
      _.isEqual(_.sortBy(allChildren, "id"), _.sortBy(expectedChildren, "id"))
    ).toBe(true);

    expect(
      _.isEqual(_.sortBy(expectedChildren, "id"), _.sortBy(allChildren, "id"))
    ).toBe(true);
  });

  it("should return all parents of a specific item", () => {
    const treeStore = new TreeStore(items);
    const allParents = treeStore.getAllParents(4);
    expect(allParents).toEqual([
      { id: 4, parent: "2", label: "Айтем 4" },
      { id: "2", parent: 1, label: "Айтем 2 - строка id" },
      { id: 1, parent: null, label: "Айтем 1" },
    ]);
  });

  it("should add a new item", () => {
    const treeStore = new TreeStore(items);
    treeStore.addItem({ id: "7", parent: 3, label: "Айтем 7" });
    const item = treeStore.getItem("7");
    expect(item).toEqual({ id: "7", parent: 3, label: "Айтем 7" });
  });

  it("should remove an item and its descendants", () => {
    const treeStore = new TreeStore(items);
    treeStore.removeItem("2");
    const allItems = treeStore.getAll();
    expect(allItems).toEqual([
      { id: 1, parent: null, label: "Айтем 1" },

      { id: 2, parent: 1, label: "Айтем 2 - номер id" },
      { id: 3, parent: 1, label: "Айтем 3" },
    ]);
  });

  it("should update an item", () => {
    const treeStore = new TreeStore(items);
    treeStore.updateItem({ id: "2", parent: null, label: "Updated Айтем 2" });
    const item = treeStore.getItem("2");
    expect(item).toEqual({ id: "2", parent: null, label: "Updated Айтем 2" });
  });
});
