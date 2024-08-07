import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import RegisterView from '../views/RegisterView.vue'
import LoginView from '../views/LoginView.vue'
import CreatePostView from '../views/CreatePostView.vue'
import ProfileView from '../views/ProfileView.vue'

const routes = [
  { 
    path: '/', 
    name: 'HomeView', 
    component: HomeView,
    meta: { requiresAuth: true }
  },
  { 
    path: '/register', 
    name: 'RegisterView', 
    component: RegisterView 
  },
  { 
    path: '/login', 
    name: 'LoginView', 
    component: LoginView 
  },
  { 
    path: '/create-post', 
    name: 'CreatePostView', 
    component: CreatePostView,
    meta: { requiresAuth: true }
  },
  {
    path: '/profile/:id',
    name: 'Profile',
    component: ProfileView,
    meta: { requiresAuth: true }
  },
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

router.beforeEach((to, from, next) => {
  const isAuthenticated = !!localStorage.getItem('token')
  if (to.matched.some(record => record.meta.requiresAuth) && !isAuthenticated) {
    next('/login')
  } else {
    next()
  }
})

export default router