<script setup lang="ts">
import { ref, defineProps, defineEmits, watch } from "vue";
const props = defineProps<{
  selectedItem: { id: number | string; label: string };
}>();

const itemLabelClone = ref(props.selectedItem);

watch(
  () => props,
  () => {
    console.log("Selected item changed:", props);
    itemLabelClone.value = props.selectedItem;
  },
  { immediate: true }
);

const emit = defineEmits<{
  (
    e: "update:selectedItem",
    item: { id: number | string; label: string }
  ): void;
}>();

function saveLabel() {
  // Logic to save the label of the selected item
  console.log(`Saving label: ${props.selectedItem.label}`);
  emit("update:selectedItem", props.selectedItem);
}
</script>

<template>
  <div class="label-editor">
    <h2>Label Editor</h2>
    <p>
      This component allows you to edit labels of items in a tree structure.
    </p>
    <p>Use the input field below to change the label of the selected item.</p>
    <!-- <input type="text" v-model="selectedItem.label" placeholder="Edit label" />
    <button @click="saveLabel">Save</button> -->
  </div>
</template>
