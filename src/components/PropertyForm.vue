<template>
  <form class="card form-card" @submit.prevent="handleSubmit">
    <div class="form-grid">
      <label>
        Property Name
        <input v-model.trim="form.name" required maxlength="100" />
      </label>

      <label>
        Property Type
        <input v-model.trim="form.property_type" required maxlength="50" />
      </label>

      <label class="full-width">
        Address
        <input v-model.trim="form.address" required maxlength="200" />
      </label>

      <label>
        City
        <input v-model.trim="form.city" required maxlength="100" />
      </label>

      <label>
        State
        <input v-model.trim="form.state" required maxlength="2" />
      </label>

      <label>
        Postal Code
        <input v-model.trim="form.postal_code" required maxlength="10" />
      </label>

      <label>
        Tenant Name
        <input v-model.trim="form.tenant_name" maxlength="100" />
      </label>

      <label>
        Monthly Rent
        <input v-model="form.monthly_rent" required min="0" step="0.01" type="number" />
      </label>
    </div>

    <AlertMessage :message="errorMessage" variant="error" />

    <div class="form-actions">
      <button class="button button-primary" :disabled="submitting" type="submit">
        {{ submitting ? submitLabelBusy : submitLabel }}
      </button>
      <RouterLink class="button button-secondary" to="/properties">Cancel</RouterLink>
    </div>
  </form>
</template>

<script setup>
import { reactive, watch } from 'vue'
import { RouterLink } from 'vue-router'
import AlertMessage from './AlertMessage.vue'

const props = defineProps({
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
  },
  submitLabel: {
    type: String,
    default: 'Save Property'
  },
  submitLabelBusy: {
    type: String,
    default: 'Saving...'
  }
})

const emit = defineEmits(['submit'])

const form = reactive(getDefaultValues(props.initialValues))

watch(
  () => props.initialValues,
  (nextValues) => {
    Object.assign(form, getDefaultValues(nextValues))
  },
  { deep: true }
)

function handleSubmit() {
  emit('submit', {
    name: form.name,
    address: form.address,
    city: form.city,
    state: form.state,
    postal_code: form.postal_code,
    property_type: form.property_type,
    tenant_name: form.tenant_name || null,
    monthly_rent: Number(form.monthly_rent)
  })
}

function getDefaultValues(values = {}) {
  return {
    name: values.name || '',
    address: values.address || '',
    city: values.city || '',
    state: values.state || '',
    postal_code: values.postal_code || '',
    property_type: values.property_type || '',
    tenant_name: values.tenant_name || '',
    monthly_rent: values.monthly_rent ?? ''
  }
}
</script>
