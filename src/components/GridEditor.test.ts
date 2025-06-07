import { describe, it, expect, beforeEach } from "vitest";
import { TreeStore } from "../models/TreeStore";
import type { TreeItem } from "../models/TreeStore";

// Мокаем минимальную логику undo/redo из GridEditor
function createTestEnv() {
  const initial = [
    { id: 1, parent: null, label: "A" },
    { id: 2, parent: 1, label: "B" },
    { id: 3, parent: 1, label: "C" },
    { id: 4, parent: 2, label: "D" },
  ];
  const treeStore = new TreeStore<TreeItem>(initial);
  type ActionAdd = { type: "add"; item: TreeItem };
  type ActionRemove = { type: "remove"; item: TreeItem; children: TreeItem[] };
  type ActionUpdate = { type: "update"; oldItem: TreeItem; newItem: TreeItem };
  type Action = ActionAdd | ActionRemove | ActionUpdate;
  const undoStack: Action[] = [];
  const redoStack: Action[] = [];
  function pushAction(action: Action) {
    undoStack.push(action);
    redoStack.length = 0;
  }
  function handleAddChild(parent: TreeItem, label = "X") {
    const newId = Date.now() + Math.random();
    const newItem = { id: newId, parent: parent.id, label };
    treeStore.addItem(newItem);
    pushAction({ type: "add", item: newItem });
    return newItem;
  }
  function handleRemoveNode(item: TreeItem) {
    const children = treeStore.getAllChildren(item.id);
    treeStore.removeItem(item.id);
    pushAction({ type: "remove", item, children });
  }
  function handleRenameNode(item: TreeItem, newLabel: string) {
    const oldItem = { ...item };
    const newItem = { ...item, label: newLabel };
    treeStore.updateItem(newItem);
    pushAction({ type: "update", oldItem, newItem });
  }
  function undo() {
    const action = undoStack.pop();
    if (!action) return;
    if (action.type === "add") {
      treeStore.removeItem(action.item.id);
    } else if (action.type === "remove") {
      treeStore.addItem(action.item);
      for (const child of action.children) treeStore.addItem(child);
    } else if (action.type === "update") {
      treeStore.updateItem(action.oldItem);
    }
    redoStack.push(action);
  }
  function redo() {
    const action = redoStack.pop();
    if (!action) return;
    if (action.type === "add") {
      treeStore.addItem(action.item);
    } else if (action.type === "remove") {
      treeStore.removeItem(action.item.id);
    } else if (action.type === "update") {
      treeStore.updateItem(action.newItem);
    }
    undoStack.push(action);
  }
  return {
    treeStore,
    undoStack,
    redoStack,
    handleAddChild,
    handleRemoveNode,
    handleRenameNode,
    undo,
    redo,
  };
}

describe("GridEditor logic", () => {
  let env: ReturnType<typeof createTestEnv>;
  beforeEach(() => {
    env = createTestEnv();
  });

  it("add child", () => {
    const parent = env.treeStore.getItem(2)!;
    const newItem = env.handleAddChild(parent, "Z");
    expect(env.treeStore.getItem(newItem.id)).toMatchObject({
      label: "Z",
      parent: 2,
    });
    expect(env.undoStack.at(-1)).toMatchObject({ type: "add", item: newItem });
  });

  it("remove node and descendants", () => {
    const item = env.treeStore.getItem(2)!;
    env.handleRemoveNode(item);
    expect(env.treeStore.getItem(2)).toBeUndefined();
    expect(env.treeStore.getItem(4)).toBeUndefined();
    expect(env.undoStack.at(-1)?.type).toBe("remove");
  });

  it("rename node", () => {
    const item = env.treeStore.getItem(3)!;
    env.handleRenameNode(item, "NEW");
    expect(env.treeStore.getItem(3)?.label).toBe("NEW");
    expect(env.undoStack.at(-1)?.type).toBe("update");
  });

  it("undo add", () => {
    const parent = env.treeStore.getItem(1)!;
    const newItem = env.handleAddChild(parent, "Y");
    env.undo();
    expect(env.treeStore.getItem(newItem.id)).toBeUndefined();
    expect(env.redoStack.at(-1)?.type).toBe("add");
  });

  it("undo remove", () => {
    const item = env.treeStore.getItem(2)!;
    env.handleRemoveNode(item);
    env.undo();
    expect(env.treeStore.getItem(2)).toBeDefined();
    expect(env.treeStore.getItem(4)).toBeDefined();
  });

  it("undo update", () => {
    const item = env.treeStore.getItem(3)!;
    env.handleRenameNode(item, "NEW");
    env.undo();
    expect(env.treeStore.getItem(3)?.label).toBe("C");
  });

  it("redo add", () => {
    const parent = env.treeStore.getItem(1)!;
    const newItem = env.handleAddChild(parent, "Y");
    env.undo();
    env.redo();
    expect(env.treeStore.getItem(newItem.id)).toBeDefined();
  });

  it("redo remove", () => {
    const item = env.treeStore.getItem(2)!;
    env.handleRemoveNode(item);
    env.undo();
    env.redo();
    expect(env.treeStore.getItem(2)).toBeUndefined();
    expect(env.treeStore.getItem(4)).toBeUndefined();
  });

  it("redo update", () => {
    const item = env.treeStore.getItem(3)!;
    env.handleRenameNode(item, "NEW");
    env.undo();
    env.redo();
    expect(env.treeStore.getItem(3)?.label).toBe("NEW");
  });

  it("undo/redo do nothing on empty stack", () => {
    expect(() => env.undo()).not.toThrow();
    expect(() => env.redo()).not.toThrow();
  });

  it("redoStack clears on new action", () => {
    const item = env.treeStore.getItem(3)!;
    env.handleRenameNode(item, "NEW");
    env.undo();
    expect(env.redoStack.length).toBe(1);
    env.handleRenameNode(item, "NEW2");
    expect(env.redoStack.length).toBe(0);
  });

  it("full undo/redo cycle restores state", () => {
    const item = env.treeStore.getItem(3)!;
    env.handleRenameNode(item, "X");
    env.handleRenameNode(item, "Y");
    env.handleRenameNode(item, "Z");
    env.undo();
    env.undo();
    env.undo();
    expect(env.treeStore.getItem(3)?.label).toBe("C");
    env.redo();
    expect(env.treeStore.getItem(3)?.label).toBe("X");
    env.redo();
    expect(env.treeStore.getItem(3)?.label).toBe("Y");
    env.redo();
    expect(env.treeStore.getItem(3)?.label).toBe("Z");
  });
});
