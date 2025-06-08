<script setup lang="ts">
import { ref, h, computed, defineComponent, shallowRef } from "vue";
import { AgGridVue } from "ag-grid-vue3";

import {
  ClientSideRowModelModule,
  CustomEditorModule,
  ModuleRegistry,
  ValidationModule,
  ClientSideRowModelApiModule,
  TextEditorModule,
  ColumnAutoSizeModule,
} from "ag-grid-community";
import type {
  GetRowIdFunc,
  ColDef,
  ValueGetterParams,
  ValueSetterParams,
  GridApi,
  GridReadyEvent,
  SizeColumnsToContentStrategy,
  SizeColumnsToFitGridStrategy,
  SizeColumnsToFitProvidedWidthStrategy,
} from "ag-grid-community";
import { TreeDataModule } from "ag-grid-enterprise";

import { TreeStore } from "../models/TreeStore";
import type { TreeItem } from "../models/TreeStore";
import {
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
  PlusIcon,
  XMarkIcon,
} from "@heroicons/vue/24/outline";

ModuleRegistry.registerModules([
  ClientSideRowModelModule,
  TreeDataModule,
  ColumnAutoSizeModule,
  ValidationModule,
  TextEditorModule,
  ClientSideRowModelApiModule,
  CustomEditorModule,
]);

const isEditMode = ref(false);

const autoSizeStrategy = ref<
  | SizeColumnsToFitGridStrategy
  | SizeColumnsToFitProvidedWidthStrategy
  | SizeColumnsToContentStrategy
>({
  type: "fitGridWidth",
  defaultMinWidth: 100,
  columnLimits: [
    {
      colId: "rowIndex",
      minWidth: 50,
    },
  ],
});

const treeStore = ref<TreeStore<TreeItem>>(
  new TreeStore<TreeItem>([
    { id: 1, parent: null, label: "Айтем 1" },
    { id: "2", parent: 1, label: "Айтем 2" },
    { id: 3, parent: 1, label: "Айтем 3" },
    { id: 4, parent: "2", label: "Айтем 4" },
    { id: 5, parent: "2", label: "Айтем 5" },
    { id: 6, parent: "2", label: "Айтем 6" },
    { id: 7, parent: 4, label: "Айтем 7" },
    { id: 8, parent: 4, label: "Айтем 8" },
  ])
);

const getRowId = ref<GetRowIdFunc>((params) => {
  return params.data.id;
});

const rowData = computed(() => {
  return treeStore.value.getAll();
});

const gridApi = shallowRef<GridApi | null>(null);

const autoGroupColumnDef = ref<ColDef>({
  headerName: "Категория",
  flex: 2,
  field: "parent",
  cellClass: "w-full flex aaaa",
  valueGetter: (params) =>
    treeStore.value.getChildren(params.data.id).length > 0
      ? "Группа"
      : "Элемент",
  cellRenderer: "agGroupCellRenderer",
  cellRendererParams: {
    suppressCount: true,

    innerRenderer: defineComponent({
      props: ["params"],
      setup(props) {
        return () => {
          const { data } = props.params;
          console.log("data", data);

          return h(
            "span",
            {
              class: "flex flex-1  justify-between",
            },
            [
              treeStore.value.getChildren(data.id).length > 0
                ? "Группа"
                : "Элемент",

              isEditMode.value &&
                h("div", { class: "flex items-center gap-2" }, [
                  h(PlusIcon, {
                    onClick: () => handleAddChild(data),
                    class:
                      "bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center",
                  }),
                  h(XMarkIcon, {
                    // class: "w-4 h-4 text-white",

                    onClick: () => handleRemoveNode(data),
                    class:
                      "bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center",
                  }),
                ]),
            ]
          );
        };
      },
    }),
  },
});

const columnDefs = computed<ColDef[]>(() => [
  {
    colId: "rowIndex",
    width: 80,
    minWidth: 80,
    maxWidth: 80,
    lockPosition: "left",
    headerName: "№ п/п",
    valueGetter: (params) =>
      params.node?.rowIndex ? params.node?.rowIndex + 1 : "x",
  },
  {
    colId: "label",
    flex: 1,
    valueGetter: (params: ValueGetterParams) => {
      return params.data.label;
    },
    valueSetter: (params: ValueSetterParams) => {
      const newLabel = params.newValue || "";
      if (
        !newLabel ||
        newLabel === params.data.label ||
        newLabel.trim() === ""
      ) {
        return false; // No change
      }
      handleRenameNode(params.data, newLabel);
      return true;
    },
    editable: isEditMode.value,
  },
]);

const defaultColDef = ref<ColDef>({
  flex: 1,
});

const treeDataParentIdField = ref("parent");
const groupDefaultExpanded = ref(-1);

const onGridReady = (params: GridReadyEvent) => {
  gridApi.value = params.api;
  console.log("gridApi", gridApi.value);
  // const updateData = (data) => (rowData.value = data);
};

// Типы для истории изменений
interface ActionAdd {
  type: "add";
  item: TreeItem;
}
interface ActionRemove {
  type: "remove";
  item: TreeItem;
  children: TreeItem[];
}
interface ActionUpdate {
  type: "update";
  oldItem: TreeItem;
  newItem: TreeItem;
}
type Action = ActionAdd | ActionRemove | ActionUpdate;

const undoStack = ref<Action[]>([]);
const redoStack = ref<Action[]>([]);

function pushAction(action: Action) {
  undoStack.value.push(action);
  redoStack.value = [];
}

async function handleAddChild(item: TreeItem) {
  const newIndex = Date.now().toString();
  const newItem: TreeItem = {
    id: newIndex,
    parent: item.id,
    label: `Новый элемент ${newIndex}`,
  };
  treeStore.value.addItem(newItem);
  pushAction({ type: "add", item: newItem });
  await new Promise((resolve) => setTimeout(resolve, 1000));
  const rowNode = gridApi.value?.getRowNode(newIndex);
  const rowIndex = rowNode?.rowIndex!;
  gridApi.value!.startEditingCell({ rowIndex, colKey: "label" });
}

function handleRemoveNode(item: TreeItem) {
  // Сохраняем удаляемый элемент и всех его потомков
  const children = treeStore.value.getAllChildren(item.id);
  treeStore.value.removeItem(item.id);
  pushAction({ type: "remove", item, children });
}

function handleRenameNode(item: TreeItem, newLabel: string) {
  const oldItem = { ...item };
  const newItem = { ...item, label: newLabel };
  treeStore.value.updateItem(newItem);
  pushAction({ type: "update", oldItem, newItem });
}

function undo() {
  const action = undoStack.value.pop();
  if (!action) return;
  if (action.type === "add") {
    treeStore.value.removeItem(action.item.id);
  } else if (action.type === "remove") {
    treeStore.value.addItem(action.item);
    for (const child of action.children) treeStore.value.addItem(child);
  } else if (action.type === "update") {
    treeStore.value.updateItem(action.oldItem);
  }
  redoStack.value.push(action);
}

function redo() {
  const action = redoStack.value.pop();
  if (!action) return;
  if (action.type === "add") {
    treeStore.value.addItem(action.item);
  } else if (action.type === "remove") {
    treeStore.value.removeItem(action.item.id);
  } else if (action.type === "update") {
    treeStore.value.updateItem(action.newItem);
  }
  undoStack.value.push(action);
}
</script>

<template>
  <div class="grid-editor">
    <div class="controls flex items-center gap-2 mb-2">
      <button
        class="p-2 text-blue-500 cursor-pointer"
        @click="isEditMode = !isEditMode"
      >
        {{ isEditMode ? "Режим: редактирование" : "Режим: просмотр" }}
      </button>
      <template v-if="isEditMode">
        <ArrowUturnLeftIcon
          class="w-6 h-6 text-blue-500 cursor-pointer"
          :class="!undoStack.length ? 'opacity-50 cursor-not-allowed' : ''"
          @click="undo"
        />
        <ArrowUturnRightIcon
          class="w-6 h-6 text-blue-500 cursor-pointer"
          :class="!!undoStack.length ? 'opacity-50 cursor-not-allowed' : ''"
          @click="redo"
        />
      </template>
    </div>
    <div class="w-full">
      <AgGridVue
        class="w-full"
        style="height: 500px"
        @grid-ready="onGridReady"
        :columnDefs="columnDefs"
        :defaultColDef="defaultColDef"
        :autoGroupColumnDef="autoGroupColumnDef"
        v-model="rowData"
        :getRowId="getRowId"
        :treeData="true"
        :treeDataParentIdField="treeDataParentIdField"
        :groupDefaultExpanded="groupDefaultExpanded"
      />
    </div>
  </div>
</template>

<style scoped>
.controls {
  margin-bottom: 10px;
}

:deep(.ag-group-value) {
  display: flex;
  flex-grow: 1;
}
</style>
