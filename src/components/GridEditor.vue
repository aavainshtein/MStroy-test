<script setup lang="ts">
import {
  ref,
  computed,
  watch,
  createApp,
  defineComponent,
  onBeforeMount,
  shallowRef,
} from "vue";
import { AgGridVue } from "ag-grid-vue3";
// import { ModuleRegistry, GridApi } from "@ag-grid-community/core";
// import "ag-grid-community/styles/ag-grid.css";
// import "ag-grid-community/styles/ag-theme-alpine.css";
import "ag-grid-enterprise";
import { getData } from "../models/data";

// import { RowGroupingModule } from "@ag-grid-enterprise/row-grouping";

import {
  ClientSideRowModelModule,
  ColDef,
  ColGroupDef,
  GetRowIdFunc,
  GridApi,
  GridOptions,
  GridReadyEvent,
  ModuleRegistry,
  ValidationModule,
} from "ag-grid-community";
import { TreeDataModule } from "ag-grid-enterprise";

import { TreeStore } from "../models/TreeStore";
import type { TreeItem } from "../models/TreeStore";

ModuleRegistry.registerModules([
  ClientSideRowModelModule,
  TreeDataModule,
  ValidationModule,
]);

const treeStore = ref(
  new TreeStore([
    { id: 1, parent: null, label: "Айтем 1" },
    { id: "2", parent: 1, label: "Айтем 2 - строка id" },
    { id: 2, parent: 1, label: "Айтем 2 - номер id" },
    { id: 3, parent: 1, label: "Айтем 3" },
    { id: 4, parent: "2", label: "Айтем 4" },
    { id: 5, parent: "2", label: "Айтем 5" },
    { id: 6, parent: "2", label: "Айтем 6" },
  ])
);

// const rowData = ref<any[] | null>(getData());
const rowData = computed(() => treeStore.value.getAll());

const gridApi = shallowRef<GridApi | null>(null);
const columnDefs = ref<ColDef[]>([
  {
    field: "id",
  },
  {
    field: "label",
  },
]);
const defaultColDef = ref<ColDef>({
  flex: 1,
});
const autoGroupColumnDef = ref<ColDef>({
  headerName: "Name",
  field: "parent",
  cellRendererParams: {
    suppressCount: true,
  },
});
// const rowData = ref<any[] | null>(getData());
const getRowId = ref<GetRowIdFunc>((params) => {
  if (params.data && params.data.id) {
    if (typeof params.data.id === "number") {
      return params.data.id.toString() + "_number"; // Convert number to string for consistency
    }
    if (typeof params.data.id === "string") {
      return params.data.id; // Keep string as is
    }
    return;
  }
});
const treeDataParentIdField = ref("parent");
const groupDefaultExpanded = ref(-1);

const onGridReady = (params: GridReadyEvent) => {
  gridApi.value = params.api;
};
</script>

<template>
  <div class="grid-editor">
    <div class="controls"></div>
    <div class="ag-theme-alpine" style="height: 500px; width: 800px">
      <AgGridVue
        style="height: 500px; width: 800px"
        @grid-ready="onGridReady"
        :columnDefs="columnDefs"
        :defaultColDef="defaultColDef"
        :autoGroupColumnDef="autoGroupColumnDef"
        :rowData="rowData"
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
</style>
