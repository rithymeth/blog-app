<template>
    <div class="profile-view">
      <h1>{{ user.username }}'s Profile</h1>
      <p>Bio: {{ user.bio }}</p>
      <button v-if="!isOwnProfile" @click="toggleFriend">
        {{ isFriend ? 'Remove Friend' : 'Add Friend' }}
      </button>
      <div v-if="isOwnProfile">
        <h2>Edit Profile</h2>
        <form @submit.prevent="updateProfile">
          <textarea v-model="newBio" placeholder="Update your bio"></textarea>
          <button type="submit">Update Bio</button>
        </form>
      </div>
      <h2>Friends</h2>
      <ul>
        <li v-for="friend in user.friends" :key="friend._id">
          {{ friend.username }}
        </li>
      </ul>
      <h2>Posts</h2>
      <div v-for="post in posts" :key="post._id" class="post">
        <h3>{{ post.title }}</h3>
        <p>{{ post.content }}</p>
      </div>
    </div>
  </template>
  
  <script>
  import { ref, onMounted, computed } from 'vue'
  import { useRoute } from 'vue-router'
  
  export default {
    name: 'ProfileView',
    setup() {
      const route = useRoute()
      const user = ref({})
      const posts = ref([])
      const newBio = ref('')
      const isFriend = ref(false)
  
      const currentUser = computed(() => {
        const token = localStorage.getItem('token')
        if (token) {
          const payload = JSON.parse(atob(token.split('.')[1]))
          return payload.userId
        }
        return null
      })
  
      const isOwnProfile = computed(() => currentUser.value === route.params.id)
  
      const fetchUserProfile = async () => {
        try {
          const token = localStorage.getItem('token')
          const response = await fetch(`http://localhost:3000/users/${route.params.id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          user.value = await response.json()
          isFriend.value = user.value.friends.some(friend => friend._id === currentUser.value)
        } catch (error) {
          console.error('Error fetching user profile:', error)
        }
      }
  
      const fetchUserPosts = async () => {
        try {
          const response = await fetch(`http://localhost:3000/posts?author=${route.params.id}`)
          posts.value = await response.json()
        } catch (error) {
          console.error('Error fetching user posts:', error)
        }
      }
  
      const updateProfile = async () => {
        try {
          const token = localStorage.getItem('token')
          await fetch(`http://localhost:3000/users/${route.params.id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ bio: newBio.value })
          })
          user.value.bio = newBio.value
          newBio.value = ''
        } catch (error) {
          console.error('Error updating profile:', error)
        }
      }
  
      const toggleFriend = async () => {
        try {
          const token = localStorage.getItem('token')
          const method = isFriend.value ? 'DELETE' : 'POST'
          await fetch(`http://localhost:3000/users/${route.params.id}/friends`, {
            method,
            headers: { 'Authorization': `Bearer ${token}` }
          })
          isFriend.value = !isFriend.value
        } catch (error) {
          console.error('Error toggling friend status:', error)
        }
      }
  
      onMounted(() => {
        fetchUserProfile()
        fetchUserPosts()
      })
  
      return {
        user,
        posts,
        newBio,
        isOwnProfile,
        isFriend,
        updateProfile,
        toggleFriend
      }
    }
  }
  </script>