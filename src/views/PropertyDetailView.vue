<template>
  <section class="stack-lg">
    <AlertMessage :message="flashMessage" variant="success" />
    <AlertMessage :message="pageError" variant="error" />

    <LoadingState v-if="loading" label="Loading property details..." />

    <template v-else-if="summary">
      <RouterLink class="back-link" to="/">&#60; Back to Dashboard</RouterLink>

      <section class="property-spotlight">
        <div class="property-identity">
          <div class="property-thumb">
            <span>{{ propertyInitials }}</span>
          </div>

          <div class="stack-sm">
            <h2 class="detail-title">{{ summary.property.name }}</h2>
            <p class="detail-address">
              {{ summary.property.address }}, {{ summary.property.city }}, {{ summary.property.state }}
              {{ summary.property.postal_code }}
            </p>

            <div class="detail-badges">
              <span class="pill pill-type">{{ summary.property.property_type }}</span>
              <span :class="['pill', summary.property.tenant_name ? 'pill-occupied' : 'pill-vacant']">
                Tenant: {{ summary.property.tenant_name || 'Vacant' }}
              </span>
            </div>
          </div>
        </div>

        <div class="property-actions">
          <RouterLink class="button button-secondary" :to="`/properties/${props.id}/edit`">Edit</RouterLink>
          <button class="button button-secondary" :disabled="deleting" @click="handleDelete">
            {{ deleting ? 'Deleting...' : 'Delete' }}
          </button>
          <button class="button button-income" @click="openIncomeForm">+ Add Income</button>
          <button class="button button-expense" @click="openExpenseForm">+ Add Expense</button>
        </div>
      </section>

      <div class="stats-grid">
        <section class="card statement-card">
          <p class="statement-label">Total Income</p>
          <strong class="statement-value">{{ summary.totals.total_income }}</strong>
        </section>
        <section class="card statement-card">
          <p class="statement-label">Total Expenses</p>
          <strong class="statement-value">{{ summary.totals.total_expenses }}</strong>
        </section>
        <section class="card statement-card statement-card-net">
          <p class="statement-label">Net Income</p>
          <strong class="statement-value">{{ summary.totals.net_cash_flow }}</strong>
        </section>
      </div>

      <section class="card tabbed-panel">
        <div class="property-tabs">
          <button :class="['property-tab', activeTab === 'overview' ? 'property-tab-active' : '']" @click="activeTab = 'overview'">
            Overview
          </button>
          <button :class="['property-tab', activeTab === 'income' ? 'property-tab-active' : '']" @click="activeTab = 'income'">
            Income
          </button>
          <button :class="['property-tab', activeTab === 'expenses' ? 'property-tab-active' : '']" @click="activeTab = 'expenses'">
            Expenses
          </button>
        </div>

        <div v-if="activeTab === 'overview'" class="stack-lg">
          <div class="mini-stats mini-stats-wide">
            <div>
              <span class="mini-label">Monthly Rent</span>
              <strong>{{ summary.property.monthly_rent }}</strong>
            </div>
            <div>
              <span class="mini-label">Income Records</span>
              <strong>{{ incomeRecords.length }}</strong>
            </div>
            <div>
              <span class="mini-label">Expense Records</span>
              <strong>{{ expenseRecords.length }}</strong>
            </div>
          </div>

          <div class="detail-grid">
            <SimpleBarChart
              eyebrow="Overview"
              title="Income by year"
              :items="incomeByYear"
              :value-formatter="formatCurrency"
            />
            <SimpleDoughnutChart
              eyebrow="Overview"
              title="Expenses by category"
              :items="expensesByCategory"
              center-label="Expenses"
              :value-formatter="formatCurrency"
            />
          </div>
        </div>

        <div v-else-if="activeTab === 'income'" class="stack-lg">
          <AlertMessage :message="incomeSuccess" variant="success" />

          <RecordForm
            v-if="visibleForm === 'income'"
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

          <table v-else class="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="income in incomeRecords" :key="income.income_id">
                <td>{{ formatDate(income.date) }}</td>
                <td>{{ income.description || 'No description provided.' }}</td>
                <td class="amount-positive">{{ income.amount }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-else class="stack-lg">
          <AlertMessage :message="expenseSuccess" variant="success" />

          <RecordForm
            v-if="visibleForm === 'expense'"
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

          <table v-else class="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Category</th>
                <th>Vendor</th>
                <th>Description</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="expense in expenseRecords" :key="expense.expense_id">
                <td>{{ formatDate(expense.date) }}</td>
                <td><span class="table-tag">{{ expense.category }}</span></td>
                <td>{{ expense.vendor || 'No vendor listed' }}</td>
                <td>{{ expense.description || 'No description provided.' }}</td>
                <td class="amount-negative">{{ expense.amount }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </template>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
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
import { formatCurrency, formatDate, parseCurrencyString } from '../utils/formatters'
import AlertMessage from '../components/AlertMessage.vue'
import EmptyState from '../components/EmptyState.vue'
import LoadingState from '../components/LoadingState.vue'
import RecordForm from '../components/RecordForm.vue'
import SimpleBarChart from '../components/SimpleBarChart.vue'
import SimpleDoughnutChart from '../components/SimpleDoughnutChart.vue'

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
const activeTab = ref('overview')
const visibleForm = ref('')

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

const propertyInitials = computed(() =>
  summary.value?.property.name
    ?.split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'PM'
)

const incomeByYear = computed(() => {
  const buckets = new Map()

  incomeRecords.value.forEach((record) => {
    const year = record.date.slice(0, 4)
    buckets.set(year, (buckets.get(year) || 0) + parseCurrencyString(record.amount))
  })

  return [...buckets.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([label, value]) => ({ label, value }))
})

const expensesByCategory = computed(() => {
  const buckets = new Map()

  expenseRecords.value.forEach((record) => {
    buckets.set(record.category, (buckets.get(record.category) || 0) + parseCurrencyString(record.amount))
  })

  return [...buckets.entries()]
    .sort((left, right) => right[1] - left[1])
    .map(([label, value]) => ({ label, value }))
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

function openIncomeForm() {
  activeTab.value = 'income'
  visibleForm.value = visibleForm.value === 'income' ? '' : 'income'
}

function openExpenseForm() {
  activeTab.value = 'expenses'
  visibleForm.value = visibleForm.value === 'expense' ? '' : 'expense'
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
    visibleForm.value = ''
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
    visibleForm.value = ''
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
