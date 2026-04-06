import { createRouter, createWebHistory } from 'vue-router'
import PropertiesListView from '../views/PropertiesListView.vue'
import PropertyCreateView from '../views/PropertyCreateView.vue'
import PropertyEditView from '../views/PropertyEditView.vue'
import PropertyDetailView from '../views/PropertyDetailView.vue'

const routes = [
  { path: '/', name: 'properties', component: PropertiesListView },
  { path: '/properties/new', name: 'property-create', component: PropertyCreateView },
  { path: '/properties/:id/edit', name: 'property-edit', component: PropertyEditView, props: true },
  { path: '/properties/:id', name: 'property-detail', component: PropertyDetailView, props: true }
]

export default createRouter({
  history: createWebHistory(),
  routes
})
