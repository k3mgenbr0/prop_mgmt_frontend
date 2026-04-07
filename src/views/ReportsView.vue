<template>
  <section class="stack-lg">
    <div class="hero card">
      <div>
        <p class="eyebrow">Reports</p>
        <h2>Portfolio Reports</h2>
        <p class="muted">
          Print-friendly summaries built from the same live property, income, expense, and totals data powering the dashboard.
        </p>
      </div>
      <div class="card-actions">
        <button class="button button-secondary" :disabled="loading" @click="loadReports">
          {{ loading ? 'Refreshing...' : 'Refresh' }}
        </button>
        <button class="button button-secondary" :disabled="loading" @click="printReport">
          Print Report
        </button>
        <button class="button button-primary" :disabled="loading" @click="exportSummary">
          Export Summary CSV
        </button>
      </div>
    </div>

    <AlertMessage :message="errorMessage" variant="error" />
    <LoadingSkeleton v-if="loading" :count="6" />

    <template v-else>
      <div class="stats-grid">
        <StatCard label="Properties" :value="String(snapshot.summary.totalProperties)" />
        <StatCard label="Income Records" :value="String(snapshot.summary.totalIncomeRecords)" />
        <StatCard label="Expense Records" :value="String(snapshot.summary.totalExpenseRecords)" />
        <StatCard label="Monthly Rent" :value="formatCurrency(snapshot.summary.estimatedMonthlyRentTotal)" />
        <StatCard label="Total Income" :value="formatCurrency(snapshot.summary.totalIncomeAmount)" />
        <StatCard label="Net Cash Flow" :value="formatCurrency(snapshot.summary.netCashFlowAmount)" />
      </div>

      <section class="card report-card">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Executive Summary</p>
            <h3>Portfolio performance at a glance</h3>
          </div>
          <span class="muted">Updated {{ formatDateTime(snapshot.lastRefreshed) }}</span>
        </div>

        <div class="mini-stats mini-stats-wide">
          <div>
            <span class="mini-label">Occupied Properties</span>
            <strong>{{ snapshot.summary.occupiedProperties }}</strong>
          </div>
          <div>
            <span class="mini-label">Vacant Properties</span>
            <strong>{{ snapshot.summary.vacantProperties }}</strong>
          </div>
          <div>
            <span class="mini-label">Properties Paid This Month</span>
            <strong>{{ snapshot.summary.paidPropertyCount }}</strong>
          </div>
          <div>
            <span class="mini-label">Partial / Late</span>
            <strong>{{ snapshot.summary.partialPropertyCount }} / {{ snapshot.summary.latePropertyCount }}</strong>
          </div>
          <div>
            <span class="mini-label">Current Rent Gap</span>
            <strong :class="snapshot.summary.paymentGapTotal > 0 ? 'amount-negative' : 'amount-positive'">
              {{ formatCurrency(snapshot.summary.paymentGapTotal) }}
            </strong>
          </div>
          <div>
            <span class="mini-label">Average Net Cash Flow</span>
            <strong>{{ formatCurrency(averageNetCashFlow) }}</strong>
          </div>
        </div>
      </section>

      <div class="detail-grid">
        <section class="card report-card">
          <div class="section-heading">
            <div>
              <p class="eyebrow">Top Performers</p>
              <h3>Best net cash flow</h3>
            </div>
          </div>

          <div class="record-list">
            <article v-for="property in topPerformers" :key="property.property_id" class="card record-card">
              <div class="card-header">
                <div>
                  <strong>{{ property.name }}</strong>
                  <p class="muted">{{ property.city }}, {{ property.state }}</p>
                </div>
                <strong class="amount-positive">{{ formatCurrency(property.netCashFlowValue) }}</strong>
              </div>
            </article>
          </div>
        </section>

        <section class="card report-card">
          <div class="section-heading">
            <div>
              <p class="eyebrow">Attention Needed</p>
              <h3>Largest current rent gaps</h3>
            </div>
          </div>

          <EmptyState
            v-if="rentGapLeaders.length === 0"
            title="No rent gaps right now"
            description="Occupied properties are currently fully paid based on this month’s income."
          />

          <div v-else class="record-list">
            <article v-for="property in rentGapLeaders" :key="property.property_id" class="card record-card">
              <div class="card-header">
                <div>
                  <strong>{{ property.name }}</strong>
                  <p class="muted">{{ property.tenant_name || 'No tenant on file' }}</p>
                </div>
                <strong class="amount-negative">{{ formatCurrency(property.paymentGapValue) }}</strong>
              </div>
            </article>
          </div>
        </section>
      </div>

      <section class="card report-card">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Printable Table</p>
            <h3>Property-by-property summary</h3>
          </div>
        </div>

        <table class="data-table">
          <thead>
            <tr>
              <th>Property</th>
              <th>Rent Status</th>
              <th>Monthly Rent</th>
              <th>Total Income</th>
              <th>Total Expenses</th>
              <th>Net Cash Flow</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="property in snapshot.properties" :key="property.property_id">
              <td>{{ property.name }}</td>
              <td>{{ getRentStatusLabel(property.rentStatus) }}</td>
              <td>{{ property.monthly_rent }}</td>
              <td>{{ property.totals.total_income }}</td>
              <td>{{ property.totals.total_expenses }}</td>
              <td>{{ property.totals.net_cash_flow }}</td>
            </tr>
          </tbody>
        </table>
      </section>
    </template>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { getPortfolioSnapshot } from '../api/dashboardService'
import AlertMessage from '../components/AlertMessage.vue'
import EmptyState from '../components/EmptyState.vue'
import LoadingSkeleton from '../components/LoadingSkeleton.vue'
import StatCard from '../components/StatCard.vue'
import { downloadCsv } from '../utils/exporters'
import { formatCurrency, formatDateTime } from '../utils/formatters'
import { pushToast } from '../utils/toasts'

const loading = ref(true)
const errorMessage = ref('')
const snapshot = ref({
  properties: [],
  summary: {
    totalProperties: 0,
    occupiedProperties: 0,
    vacantProperties: 0,
    totalIncomeRecords: 0,
    totalExpenseRecords: 0,
    estimatedMonthlyRentTotal: 0,
    paymentGapTotal: 0,
    paidPropertyCount: 0,
    partialPropertyCount: 0,
    latePropertyCount: 0,
    totalIncomeAmount: 0,
    totalExpenseAmount: 0,
    netCashFlowAmount: 0
  },
  lastRefreshed: ''
})

const topPerformers = computed(() =>
  [...snapshot.value.properties].sort((left, right) => right.netCashFlowValue - left.netCashFlowValue).slice(0, 5)
)

const rentGapLeaders = computed(() =>
  [...snapshot.value.properties]
    .filter((property) => property.paymentGapValue > 0)
    .sort((left, right) => right.paymentGapValue - left.paymentGapValue)
    .slice(0, 5)
)

const averageNetCashFlow = computed(() => {
  if (!snapshot.value.summary.totalProperties) {
    return 0
  }

  return snapshot.value.summary.netCashFlowAmount / snapshot.value.summary.totalProperties
})

function getRentStatusLabel(status) {
  if (status === 'paid') return 'Paid'
  if (status === 'partial') return 'Partial'
  if (status === 'late') return 'Late'
  return 'Vacant'
}

async function loadReports() {
  loading.value = true
  errorMessage.value = ''

  try {
    snapshot.value = await getPortfolioSnapshot()
  } catch (error) {
    errorMessage.value = error.message
  } finally {
    loading.value = false
  }
}

function exportSummary() {
  downloadCsv(
    'portfolio-report-summary.csv',
    snapshot.value.properties.map((property) => ({
      property: property.name,
      city: property.city,
      state: property.state,
      rent_status: getRentStatusLabel(property.rentStatus),
      monthly_rent: property.monthly_rent,
      total_income: property.totals.total_income,
      total_expenses: property.totals.total_expenses,
      net_cash_flow: property.totals.net_cash_flow
    }))
  )

  pushToast({
    title: 'Report export ready',
    message: 'The portfolio summary report was downloaded as CSV.',
    variant: 'success'
  })
}

function printReport() {
  window.print()
}

onMounted(loadReports)
</script>
