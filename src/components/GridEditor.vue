<script setup lang="ts">
import { ref } from "vue";
import { AgGridVue } from "ag-grid-vue3";
import { ModuleRegistry } from "@ag-grid-community/core";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import "ag-grid-enterprise";
import { RowGroupingModule } from "@ag-grid-enterprise/row-grouping";
import { TreeStore } from "../models/TreeStore";
import type { TreeItem } from "../models/TreeStore";

// Sample data for TreeStore
const treeData: TreeItem[] = [
  { id: 1, parent: null, name: "Group 1" },
  { id: 2, parent: 1, name: "Element 1.1" },
  { id: 3, parent: 1, name: "Element 1.2" },
  { id: 4, parent: null, name: "Group 2" },
  { id: 5, parent: 4, name: "Element 2.1" },
];

ModuleRegistry.registerModules([RowGroupingModule]);

const treeStore = new TreeStore(treeData);
const rowData = ref(treeStore.getAll());

const columnDefs = ref([
  { field: "name", headerName: "Name", sortable: true, filter: true },
  {
    field: "category",
    headerName: "Category",
    valueGetter: (params: any) => {
      const children = treeStore.getChildren(params.data.id);
      return children.length > 0 ? "Group" : "Element";
    },
  },
]);
</script>

<template>
  <div class="grid-editor">
    <h1>Grid Editor</h1>
    <div class="ag-theme-alpine" style="height: 500px; width: 600px">
      <AgGridVue
        class="ag-theme-alpine"
        style="height: 500px; width: 600px"
        :rowData="rowData"
        :columnDefs="columnDefs"
        :treeData="true"
        :getDataPath="(data) => [data.name]"
        :autoGroupColumnDef="{
          headerName: 'Name',
          cellRendererParams: { suppressCount: true },
        }"
      />
    </div>
  </div>
</template>
