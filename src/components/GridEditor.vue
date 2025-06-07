<script setup lang="ts">
import {
  ref,
  h,
  computed,
  watch,
  createApp,
  defineComponent,
  onBeforeMount,
  shallowRef,
  nextTick,
} from "vue";
import { AgGridVue } from "ag-grid-vue3";
// import { ModuleRegistry, GridApi } from "@ag-grid-community/core";
// import "ag-grid-community/styles/ag-grid.css";
// import "ag-grid-community/styles/ag-theme-alpine.css";
import "ag-grid-enterprise";

// import { RowGroupingModule } from "@ag-grid-enterprise/row-grouping";

import {
  ClientSideRowModelModule,
  CustomEditorModule,
  ModuleRegistry,
  ValidationModule,
  ClientSideRowModelApiModule,
  NumberEditorModule,
  TextEditorModule,
} from "ag-grid-community";
import type {
  GetRowIdFunc,
  ColDef,
  ValueGetterParams,
  ValueSetterParams,
  CellValueChangedEvent,
  ColGroupDef,
  GridApi,
  GridOptions,
  GridReadyEvent,
} from "ag-grid-community";
import { TreeDataModule } from "ag-grid-enterprise";

import { TreeStore } from "../models/TreeStore";
import type { TreeItem } from "../models/TreeStore";

ModuleRegistry.registerModules([
  ClientSideRowModelModule,
  TreeDataModule,
  ValidationModule,
  TextEditorModule,
  ClientSideRowModelApiModule,
  CustomEditorModule,
]);

const isEditMode = ref(false);

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

// const rowData = ref(treeStore.value.getAll());

const rowData = computed(() => {
  return treeStore.value.getAll();
});

const gridApi = shallowRef<GridApi | null>(null);

const autoGroupColumnDef = ref<ColDef>({
  headerName: "Категория",
  field: "parent",
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
              style: {
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              },
            },
            [
              treeStore.value.getChildren(data.id).length > 0
                ? "Группа"
                : "Элемент",

              isEditMode.value &&
                h(
                  "button",
                  {
                    onClick: () => handleAddChild(data),
                    style: { padding: "2px 6px" },
                  },
                  "+"
                ),
              isEditMode.value &&
                h(
                  "button",
                  {
                    onClick: () => handleRemoveNode(data),
                    style: { padding: "2px 6px" },
                  },
                  "−"
                ),
            ]
          );
        };
      },
    }),
  },
});

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

const columnDefs = computed<ColDef[]>(() => [
  {
    headerName: "№ п/п",
    valueGetter: (params) => params.data.id,
  },
  {
    colId: "label",
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
    <div class="controls">
      <button @click="isEditMode = !isEditMode">
        {{
          isEditMode
            ? "Выключить режим редактирования"
            : "Включить режим редактирования"
        }}
      </button>
      <template v-if="isEditMode">
        <button @click="undo" :disabled="undoStack.length === 0">⟵</button>
        <button @click="redo" :disabled="redoStack.length === 0">⟶</button>
      </template>
    </div>
    <div class="ag-theme-alpine" style="height: 500px; width: 800px">
      <AgGridVue
        style="height: 500px; width: 800px"
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
  {{ JSON.stringify(treeStore.getAll(), null, 2) }}
</template>

<style scoped>
.controls {
  margin-bottom: 10px;
}
</style>
