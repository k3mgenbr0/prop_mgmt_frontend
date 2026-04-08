import { createRouter, createWebHistory } from 'vue-router'
import ApiStatusView from '../views/ApiStatusView.vue'
import DashboardView from '../views/DashboardView.vue'
import ExpensesOverviewView from '../views/ExpensesOverviewView.vue'
import IncomeOverviewView from '../views/IncomeOverviewView.vue'
import PropertiesListView from '../views/PropertiesListView.vue'
import PropertyCreateView from '../views/PropertyCreateView.vue'
import PropertyEditView from '../views/PropertyEditView.vue'
import PropertyDetailView from '../views/PropertyDetailView.vue'
import ReportsView from '../views/ReportsView.vue'

const routes = [
  { path: '/', name: 'dashboard', component: DashboardView },
  { path: '/dashboard', redirect: '/' },
  { path: '/properties', name: 'properties', component: PropertiesListView },
  { path: '/properties/new', name: 'property-create', component: PropertyCreateView },
  { path: '/properties/:id/edit', name: 'property-edit', component: PropertyEditView, props: true },
  { path: '/properties/:id', name: 'property-detail', component: PropertyDetailView, props: true },
  { path: '/income', name: 'income-overview', component: IncomeOverviewView },
  { path: '/expenses', name: 'expenses-overview', component: ExpensesOverviewView },
  { path: '/reports', name: 'reports', component: ReportsView },
  { path: '/api-status', name: 'api-status', component: ApiStatusView }
]

export default createRouter({
  history: createWebHistory(),
  routes
})
