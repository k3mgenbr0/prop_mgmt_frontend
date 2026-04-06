<template>
  <section class="stack-lg">
    <div class="page-heading">
      <div>
        <p class="eyebrow">Create</p>
        <h2>Add Property</h2>
      </div>
    </div>

    <AlertMessage :message="successMessage" variant="success" />

    <PropertyForm
      :error-message="errorMessage"
      :submitting="submitting"
      submit-label="Create Property"
      submit-label-busy="Creating..."
      @submit="handleSubmit"
    />
  </section>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { createProperty } from '../api/propertyService'
import AlertMessage from '../components/AlertMessage.vue'
import PropertyForm from '../components/PropertyForm.vue'

const router = useRouter()
const submitting = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

async function handleSubmit(payload) {
  submitting.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const property = await createProperty(payload)
    successMessage.value = 'Property created successfully.'
    router.push({
      name: 'property-detail',
      params: { id: property.property_id },
      query: { message: 'Property created successfully.' }
    })
  } catch (error) {
    errorMessage.value = error.message
  } finally {
    submitting.value = false
  }
}
</script>
