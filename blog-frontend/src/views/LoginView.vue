<template>
  <div class="login-view">
    <h2>Login</h2>
    <form @submit.prevent="handleSubmit">
      <input v-model="username" type="text" placeholder="Username" required>
      <input v-model="password" type="password" placeholder="Password" required>
      <button type="submit">Login</button>
    </form>
  </div>
</template>

<script>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

export default {
  name: 'LoginView',
  setup() {
    const username = ref('')
    const password = ref('')
    const router = useRouter()

    const handleSubmit = async () => {
      try {
        const response = await fetch('http://localhost:3000/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: username.value, password: password.value })
        })
        const data = await response.json()
        if (response.ok) {
          localStorage.setItem('token', data.token)
          router.push('/')
        } else {
          alert(data.message)
        }
      } catch (error) {
        console.error('Error during login:', error)
        alert('Login failed')
      }
    }

    return { username, password, handleSubmit }
  }
}
</script>