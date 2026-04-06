<template>
  <section class="stack-lg">
    <div class="page-heading">
      <div>
        <p class="eyebrow">Update</p>
        <h2>Edit Property</h2>
      </div>
    </div>

    <AlertMessage :message="pageError" variant="error" />
    <LoadingState v-if="loading" label="Loading property..." />

    <PropertyForm
      v-else
      :initial-values="initialValues"
      :error-message="submitError"
      :submitting="submitting"
      submit-label="Save Changes"
      submit-label-busy="Saving..."
      @submit="handleSubmit"
    />
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getProperty, updateProperty } from '../api/propertyService'
import { parseCurrencyString } from '../utils/formatters'
import AlertMessage from '../components/AlertMessage.vue'
import LoadingState from '../components/LoadingState.vue'
import PropertyForm from '../components/PropertyForm.vue'

const props = defineProps({
  id: {
    type: [String, Number],
    required: true
  }
})

const router = useRouter()
const loading = ref(true)
const submitting = ref(false)
const pageError = ref('')
const submitError = ref('')
const property = ref(null)

const initialValues = computed(() => {
  if (!property.value) {
    return {}
  }

  return {
    ...property.value,
    monthly_rent: parseCurrencyString(property.value.monthly_rent)
  }
})

async function loadProperty() {
  loading.value = true
  pageError.value = ''

  try {
    property.value = await getProperty(props.id)
  } catch (error) {
    pageError.value = error.message
  } finally {
    loading.value = false
  }
}

async function handleSubmit(payload) {
  submitting.value = true
  submitError.value = ''

  try {
    await updateProperty(props.id, payload)
    router.push({
      name: 'property-detail',
      params: { id: props.id },
      query: { message: 'Property updated successfully.' }
    })
  } catch (error) {
    submitError.value = error.message
  } finally {
    submitting.value = false
  }
}

onMounted(loadProperty)
</script>
