<template>
  <div class="register-view">
    <div class="register-container">
      <h2 class="title">Register</h2>
      <form @submit.prevent="handleSubmit" class="register-form">
        <div class="form-group">
          <label for="username">Username:</label>
          <input v-model="username" id="username" type="text" placeholder="Enter your username" required>
        </div>
        <div class="form-group">
          <label for="password">Password:</label>
          <input v-model="password" id="password" type="password" placeholder="Enter your password" required>
        </div>
        <button type="submit" class="submit-btn">Register</button>
      </form>
    </div>
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

<style scoped>
.register-view {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f0f2f5;
}

.register-container {
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  padding: 20px;
  max-width: 400px;
  width: 100%;
}

.title {
  font-size: 24px;
  margin-bottom: 20px;
  text-align: center;
}

.register-form {
  display: flex;
  flex-direction: column;
}

.form-group {
  margin-bottom: 20px;
}

label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
  box-sizing: border-box;
}

.submit-btn {
  background-color: #007bff;
  color: #ffffff;
  border: none;
  padding: 15px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.3s;
}

.submit-btn:hover {
  background-color: #0056b3;
}
</style>
