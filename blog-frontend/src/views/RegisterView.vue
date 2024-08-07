<template>
  <div class="register-view">
    <h2>Register</h2>
    <form @submit.prevent="handleSubmit">
      <input v-model="username" type="text" placeholder="Username" required>
      <input v-model="password" type="password" placeholder="Password" required>
      <button type="submit">Register</button>
    </form>
  </div>
</template>

<script>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

export default {
  name: 'RegisterView',
  setup() {
    const username = ref('')
    const password = ref('')
    const router = useRouter()

    const handleSubmit = async () => {
      try {
        const response = await fetch('http://localhost:3000/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: username.value, password: password.value })
        })
        const data = await response.json()
        if (response.ok) {
          alert(data.message)
          router.push('/login')
        } else {
          alert(data.message)
        }
      } catch (error) {
        console.error('Error during registration:', error)
        alert('Registration failed')
      }
    }

    return { username, password, handleSubmit }
  }
}
</script>