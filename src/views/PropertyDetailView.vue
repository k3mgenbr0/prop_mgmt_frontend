<template>
  <section class="stack-lg">
    <AlertMessage :message="flashMessage" variant="success" />
    <AlertMessage :message="pageError" variant="error" />

    <LoadingState v-if="loading" label="Loading property details..." />

    <template v-else-if="summary">
      <div class="detail-hero card">
        <div class="stack-sm">
          <p class="eyebrow">Property Detail</p>
          <h2>{{ summary.property.name }}</h2>
          <p>{{ summary.property.address }}</p>
          <p class="muted">
            {{ summary.property.city }}, {{ summary.property.state }} {{ summary.property.postal_code }}
          </p>
          <p class="muted">
            {{ summary.property.property_type }} · Tenant: {{ summary.property.tenant_name || 'Vacant / not listed' }}
          </p>
        </div>

        <div class="card-actions">
          <RouterLink class="button button-secondary" :to="`/properties/${props.id}/edit`">Edit</RouterLink>
          <button class="button button-danger" :disabled="deleting" @click="handleDelete">
            {{ deleting ? 'Deleting...' : 'Delete Property' }}
          </button>
        </div>
      </div>

      <div class="stats-grid">
        <StatCard label="Monthly Rent" :value="summary.property.monthly_rent" />
        <StatCard label="Total Income" :value="summary.totals.total_income" />
        <StatCard label="Total Expenses" :value="summary.totals.total_expenses" />
        <StatCard label="Net Cash Flow" :value="summary.totals.net_cash_flow" />
      </div>

      <div class="detail-grid">
        <section class="stack-md">
          <div class="section-heading">
            <div>
              <h3>Income Records</h3>
              <p class="muted">All income for this property, newest first.</p>
            </div>
          </div>

          <AlertMessage :message="incomeSuccess" variant="success" />

          <RecordForm
            type="income"
            :error-message="incomeError"
            :initial-values="incomeDefaults"
            :submitting="savingIncome"
            @submit="handleIncomeSubmit"
          />

          <LoadingState v-if="loadingIncome" label="Loading income..." />

          <EmptyState
            v-else-if="incomeRecords.length === 0"
            title="No income records yet"
            description="Add the first rent or income payment for this property."
          />

          <div v-else class="record-list">
            <article v-for="income in incomeRecords" :key="income.income_id" class="card record-card">
              <div class="card-header">
                <strong>{{ income.amount }}</strong>
                <span class="muted">{{ formatDate(income.date) }}</span>
              </div>
              <p class="muted">{{ income.description || 'No description provided.' }}</p>
            </article>
          </div>
        </section>

        <section class="stack-md">
          <div class="section-heading">
            <div>
              <h3>Expense Records</h3>
              <p class="muted">Track repairs, mortgage payments, utilities, and supplies.</p>
            </div>
          </div>

          <AlertMessage :message="expenseSuccess" variant="success" />

          <RecordForm
            type="expense"
            :error-message="expenseError"
            :initial-values="expenseDefaults"
            :submitting="savingExpense"
            @submit="handleExpenseSubmit"
          />

          <LoadingState v-if="loadingExpenses" label="Loading expenses..." />

          <EmptyState
            v-else-if="expenseRecords.length === 0"
            title="No expense records yet"
            description="Add the first expense so this property’s cash flow is complete."
          />

          <div v-else class="record-list">
            <article v-for="expense in expenseRecords" :key="expense.expense_id" class="card record-card">
              <div class="card-header">
                <strong>{{ expense.amount }}</strong>
                <span class="muted">{{ formatDate(expense.date) }}</span>
              </div>
              <p>{{ expense.category }}<span v-if="expense.vendor"> · {{ expense.vendor }}</span></p>
              <p class="muted">{{ expense.description || 'No description provided.' }}</p>
            </article>
          </div>
        </section>
      </div>
    </template>
  </section>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import {
  createExpense,
  createIncome,
  deleteProperty,
  getExpenses,
  getIncome,
  getPropertyTotals,
  getPropertySummary
} from '../api/propertyService'
import { formatDate } from '../utils/formatters'
import AlertMessage from '../components/AlertMessage.vue'
import EmptyState from '../components/EmptyState.vue'
import LoadingState from '../components/LoadingState.vue'
import RecordForm from '../components/RecordForm.vue'
import StatCard from '../components/StatCard.vue'

const props = defineProps({
  id: {
    type: [String, Number],
    required: true
  }
})

const route = useRoute()
const router = useRouter()

const summary = ref(null)
const incomeRecords = ref([])
const expenseRecords = ref([])

const loading = ref(true)
const loadingIncome = ref(true)
const loadingExpenses = ref(true)
const deleting = ref(false)
const savingIncome = ref(false)
const savingExpense = ref(false)

const pageError = ref('')
const flashMessage = ref('')
const incomeError = ref('')
const expenseError = ref('')
const incomeSuccess = ref('')
const expenseSuccess = ref('')

const incomeDefaults = ref({
  date: new Date().toISOString().slice(0, 10)
})

const expenseDefaults = ref({
  date: new Date().toISOString().slice(0, 10)
})

async function loadSummary() {
  loading.value = true
  pageError.value = ''

  try {
    summary.value = await getPropertySummary(props.id)
  } catch (error) {
    pageError.value = error.message
  } finally {
    loading.value = false
  }
}

async function loadIncome() {
  loadingIncome.value = true
  incomeError.value = ''

  try {
    incomeRecords.value = await getIncome(props.id)
  } catch (error) {
    incomeError.value = error.message
  } finally {
    loadingIncome.value = false
  }
}

async function loadExpenses() {
  loadingExpenses.value = true
  expenseError.value = ''

  try {
    expenseRecords.value = await getExpenses(props.id)
  } catch (error) {
    expenseError.value = error.message
  } finally {
    loadingExpenses.value = false
  }
}

async function handleIncomeSubmit(payload) {
  savingIncome.value = true
  incomeError.value = ''
  incomeSuccess.value = ''

  try {
    await createIncome(props.id, payload)
    incomeSuccess.value = 'Income record added successfully.'
    incomeDefaults.value = { date: payload.date }
    summary.value.totals = await getPropertyTotals(props.id)
    await loadIncome()
  } catch (error) {
    incomeError.value = error.message
  } finally {
    savingIncome.value = false
  }
}

async function handleExpenseSubmit(payload) {
  savingExpense.value = true
  expenseError.value = ''
  expenseSuccess.value = ''

  try {
    await createExpense(props.id, payload)
    expenseSuccess.value = 'Expense record added successfully.'
    expenseDefaults.value = { date: payload.date }
    summary.value.totals = await getPropertyTotals(props.id)
    await loadExpenses()
  } catch (error) {
    expenseError.value = error.message
  } finally {
    savingExpense.value = false
  }
}

async function handleDelete() {
  if (!window.confirm('Delete this property and all related income and expense records?')) {
    return
  }

  deleting.value = true
  pageError.value = ''

  try {
    await deleteProperty(props.id)
    router.push({
      name: 'properties',
      query: { message: 'Property deleted successfully.' }
    })
  } catch (error) {
    pageError.value = error.message
  } finally {
    deleting.value = false
  }
}

onMounted(async () => {
  flashMessage.value = route.query.message || ''
  await Promise.all([loadSummary(), loadIncome(), loadExpenses()])
})
</script>
