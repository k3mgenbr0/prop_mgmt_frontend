<template>
  <form class="card form-card" @submit.prevent="handleSubmit">
    <div class="form-grid">
      <label>
        Amount
        <input v-model="form.amount" required min="0.01" step="0.01" type="number" />
      </label>

      <label>
        Date
        <input v-model="form.date" required type="date" />
      </label>

      <label v-if="type === 'expense'">
        Category
        <input v-model.trim="form.category" required maxlength="100" />
      </label>

      <label v-if="type === 'expense'">
        Vendor
        <input v-model.trim="form.vendor" maxlength="100" />
      </label>

      <label class="full-width">
        Description
        <textarea v-model.trim="form.description" maxlength="250" rows="3" />
      </label>
    </div>

    <AlertMessage :message="errorMessage" variant="error" />

    <div class="form-actions">
      <button class="button button-primary" :disabled="submitting" type="submit">
        {{ submitting ? busyLabel : submitLabel }}
      </button>
    </div>
  </form>
</template>

<script setup>
import { reactive, watch } from 'vue'
import AlertMessage from './AlertMessage.vue'

const props = defineProps({
  type: {
    type: String,
    required: true
  },
  initialValues: {
    type: Object,
    default: () => ({})
  },
  submitting: {
    type: Boolean,
    default: false
  },
  errorMessage: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['submit'])

const form = reactive(getDefaultValues(props.initialValues, props.type))

watch(
  () => [props.initialValues, props.type],
  ([nextValues, nextType]) => {
    Object.assign(form, getDefaultValues(nextValues, nextType))
  },
  { deep: true }
)

const submitLabel = props.type === 'income' ? 'Add Income' : 'Add Expense'
const busyLabel = props.type === 'income' ? 'Saving Income...' : 'Saving Expense...'

function handleSubmit() {
  const payload = {
    amount: Number(form.amount),
    date: form.date,
    description: form.description || null
  }

  if (props.type === 'expense') {
    payload.category = form.category
    payload.vendor = form.vendor || null
  }

  emit('submit', payload)
}

function getDefaultValues(values = {}, type = 'income') {
  return {
    amount: values.amount ?? '',
    date: values.date || '',
    description: values.description || '',
    category: type === 'expense' ? values.category || '' : '',
    vendor: type === 'expense' ? values.vendor || '' : ''
  }
}
</script>
