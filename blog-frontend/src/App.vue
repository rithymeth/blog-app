<!-- src/App.vue -->
<template>
  <div id="app">
    <!-- Top Navigation Bar -->
    <nav class="top-nav">
      <div class="nav-left">
        <router-link to="/" class="logo">B</router-link>
        <input type="text" placeholder="Search Blogbook" class="search-input">
      </div>
      <div class="nav-right" v-if="isAuthenticated">
        <router-link :to="'/profile/' + currentUserId" class="nav-item">Profile</router-link>
        <a href="#" @click.prevent="logout" class="nav-item">Logout</a>
      </div>
      <div class="nav-right" v-else>
        <router-link to="/login" class="nav-item">Login</router-link>
        <router-link to="/register" class="nav-item">Register</router-link>
      </div>
    </nav>

    <!-- Main Content Area -->
    <div class="main-content">
      <!-- Left Sidebar -->
      <aside class="sidebar left-sidebar" v-if="isAuthenticated">
        <router-link to="/" class="sidebar-item">Home</router-link>
        <router-link :to="'/profile/' + currentUserId" class="sidebar-item">My Profile</router-link>
        <router-link to="/friends" class="sidebar-item">Friends</router-link>
      </aside>

      <!-- Center Content -->
      <main class="content">
        <router-view/>
      </main>

      <!-- Right Sidebar -->
      <aside class="sidebar right-sidebar" v-if="isAuthenticated">
        <h3>Online Friends</h3>
        <!-- Add online friends list here -->
      </aside>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

export default {
  setup() {
    const isAuthenticated = ref(!!localStorage.getItem('token'))
    const router = useRouter()

    const currentUserId = computed(() => {
      const token = localStorage.getItem('token')
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]))
        return payload.userId
      }
      return null
    })

    const logout = () => {
      localStorage.removeItem('token')
      isAuthenticated.value = false
      router.push('/login')
    }

    return { isAuthenticated, logout, currentUserId }
  }
}
</script>

<style>
body {
  margin: 0;
  font-family: Arial, sans-serif;
  background-color: #f0f2f5;
}

#app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.top-nav {
  background-color: #ffffff;
  padding: 10px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.nav-left {
  display: flex;
  align-items: center;
}

.logo {
  font-size: 24px;
  font-weight: bold;
  color: #1877f2;
  text-decoration: none;
  margin-right: 10px;
}

.search-input {
  padding: 5px 10px;
  border-radius: 20px;
  border: 1px solid #ddd;
  background-color: #f0f2f5;
}

.nav-right {
  display: flex;
}

.nav-item {
  margin-left: 20px;
  text-decoration: none;
  color: #050505;
}

.main-content {
  display: flex;
  flex: 1;
  padding: 20px;
}

.sidebar {
  width: 200px;
  padding: 20px;
}

.left-sidebar {
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.sidebar-item {
  display: block;
  padding: 10px;
  text-decoration: none;
  color: #050505;
}

.sidebar-item:hover {
  background-color: #f0f2f5;
  border-radius: 8px;
}

.content {
  flex: 1;
  margin: 0 20px;
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  padding: 20px;
}

.right-sidebar {
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
</style>