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

const treeStore = ref(
  new TreeStore([
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

const columnDefs = computed<ColDef[]>(() => [
  {
    headerName: "№ п/п",
    valueGetter: (params) => {
      const id = getRowId.value?.(params);
      return id;
    },
  },
  {
    colId: "label",
    // field: "label",
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
      treeStore.value.updateItem({ ...params.data, label: newLabel });
    },
    // cellRenderer: LabelEditor,
    // cellEditor: LabelEditor,
    editable: isEditMode.value,
    // cellEditorParams: { selectedItem: (params) => params.data },
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
  const newItem = {
    id: newIndex,
    parent: item.id,
    label: `Новый элемент ${newIndex}`,
  };
  treeStore.value.addItem(newItem);

  // get the row node with ID 55
  await new Promise((resolve) => setTimeout(resolve, 1000));
  const rowNode = gridApi.value?.getRowNode(newIndex);
  console.log("rowNode", rowNode);

  const rowIndex = rowNode?.rowIndex!;
  gridApi.value!.startEditingCell({
    rowIndex: rowIndex,
    colKey: "label",
  });
}

function handleRemoveNode(item: TreeItem) {
  treeStore.value.removeItem(item.id);
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
