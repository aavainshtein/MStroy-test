<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { AgGridVue } from 'ag-grid-vue3';
import { ModuleRegistry, GridApi } from '@ag-grid-community/core';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import 'ag-grid-enterprise';
import { RowGroupingModule } from '@ag-grid-enterprise/row-grouping';
import { TreeStore } from '../models/TreeStore';
import type { TreeItem } from '../models/TreeStore';

ModuleRegistry.registerModules([RowGroupingModule]);

// initial data
const treeData: TreeItem[] = [
  { id: 1, parent: null, name: 'Group 1' },
  { id: 2, parent: 1, name: 'Element 1.1' },
  { id: 3, parent: 1, name: 'Element 1.2' },
  { id: 4, parent: null, name: 'Group 2' },
  { id: 5, parent: 4, name: 'Element 2.1' }
];

let nextId = 6;
let treeStore = new TreeStore<TreeItem>(treeData);
const rowData = ref<any[]>([]);
const isEditing = ref(false);
const gridApi = ref<GridApi>();

// history for undo/redo
const history = ref<TreeItem[][]>([]);
const historyIndex = ref(-1);

function pushHistory() {
  const snapshot = treeStore.getAll().map((i) => ({ ...i }));
  history.value.splice(historyIndex.value + 1);
  history.value.push(snapshot);
  historyIndex.value = history.value.length - 1;
}

pushHistory();
refresh();

function toggleEdit() {
  isEditing.value = !isEditing.value;
}

function addChild(parentId: number | string) {
  const newItem: TreeItem = { id: nextId++, parent: parentId, name: 'Новый элемент' };
  treeStore.addItem(newItem);
  pushHistory();
  refresh();
  gridApi.value?.expandAll();
}

function removeItem(id: number | string) {
  treeStore.removeItem(id);
  pushHistory();
  refresh();
}

function updateName(item: TreeItem, name: string) {
  treeStore.updateItem({ ...item, name });
  pushHistory();
  refresh();
}

function undo() {
  if (historyIndex.value > 0) {
    historyIndex.value--;
    treeStore = new TreeStore(history.value[historyIndex.value]);
    refresh();
  }
}

function redo() {
  if (historyIndex.value < history.value.length - 1) {
    historyIndex.value++;
    treeStore = new TreeStore(history.value[historyIndex.value]);
    refresh();
  }
}

function getPath(item: TreeItem): string[] {
  return treeStore
    .getAllParents(item.id)
    .reverse()
    .map((i) => i.name);
}

function buildRowData() {
  return treeStore.getAll().map((item) => ({
    ...item,
    hierarchy: getPath(item),
  }));
}

function refresh() {
  rowData.value = buildRowData();
}

function onCellValueChanged(event: any) {
  if (event.colDef.field === 'name') {
    updateName(event.data, event.newValue);
  }
}

function onGridReady(params: any) {
  gridApi.value = params.api;
}

watch(isEditing, () => {
  gridApi.value?.refreshCells({ force: true });
});

const ActionsRenderer = function (this: any) {} as any;
ActionsRenderer.prototype.init = function (params: any) {
  this.params = params;
  this.eGui = document.createElement('span');
  this.update();
};
ActionsRenderer.prototype.update = function () {
  this.eGui.innerHTML = '';
  if (isEditing.value) {
    const addBtn = document.createElement('button');
    addBtn.textContent = '+';
    addBtn.addEventListener('click', () => addChild(this.params.data.id));
    const removeBtn = document.createElement('button');
    removeBtn.textContent = 'x';
    removeBtn.addEventListener('click', () => removeItem(this.params.data.id));
    this.eGui.appendChild(addBtn);
    this.eGui.appendChild(removeBtn);
  }
};
ActionsRenderer.prototype.getGui = function () {
  return this.eGui;
};
ActionsRenderer.prototype.refresh = function () {
  this.update();
  return true;
};

const columnDefs = computed(() => {
  const cols: any[] = [
    { field: 'id', headerName: '№', width: 70 },
    {
      headerName: 'Категория',
      valueGetter: (params: any) =>
        treeStore.getChildren(params.data.id).length > 0 ? 'Группа' : 'Элемент',
      width: 120,
    },
  ];
  if (isEditing.value) {
    cols.push({ headerName: '', cellRenderer: ActionsRenderer, width: 90 });
  }
  return cols;
});

const autoGroupColumnDef = computed(() => ({
  headerName: 'Наименование',
  field: 'name',
  editable: () => isEditing.value,
}));
</script>

<template>
  <div class="grid-editor">
    <div class="controls">
      <button @click="toggleEdit">{{ isEditing ? 'Завершить' : 'Редактировать' }}</button>
      <button @click="undo" :disabled="historyIndex <= 0 || !isEditing">&#8592;</button>
      <button @click="redo" :disabled="historyIndex >= history.length - 1 || !isEditing">&#8594;</button>
    </div>
    <div class="ag-theme-alpine" style="height: 500px; width: 600px">
      <AgGridVue
        :rowData="rowData"
        :columnDefs="columnDefs"
        :treeData="true"
        :getDataPath="(data) => data.hierarchy"
        :autoGroupColumnDef="autoGroupColumnDef"
        :context="{ addChild, removeItem }"
        @cell-value-changed="onCellValueChanged"
        @grid-ready="onGridReady"
      />
    </div>
  </div>
</template>

<style scoped>
.controls {
  margin-bottom: 10px;
}
</style>
