<template>
  <div class="create-post-view">
    <h2>Create New Post</h2>
    <form @submit.prevent="handleSubmit">
      <input v-model="title" type="text" placeholder="Title" required>
      <textarea v-model="content" placeholder="Content" required></textarea>
      <div>
        <label for="photo">Photo:</label>
        <input type="file" id="photo" @change="handlePhotoUpload" accept="image/*">
      </div>
      <div>
        <label for="video">Video:</label>
        <input type="file" id="video" @change="handleVideoUpload" accept="video/*">
      </div>
      <button type="submit">Create Post</button>
    </form>
  </div>
</template>

<script>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

export default {
  name: 'CreatePostView',
  setup() {
    const title = ref('')
    const content = ref('')
    const photo = ref(null)
    const video = ref(null)
    const router = useRouter()

    const handlePhotoUpload = (event) => {
      photo.value = event.target.files[0]
    }

    const handleVideoUpload = (event) => {
      video.value = event.target.files[0]
    }

    const handleSubmit = async () => {
      const token = localStorage.getItem('token')
      if (!token) {
        alert('Please login first')
        router.push('/login')
        return
      }

      try {
        const formData = new FormData()
        formData.append('title', title.value)
        formData.append('content', content.value)
        if (photo.value) {
          formData.append('image', photo.value)
        }
        if (video.value) {
          formData.append('video', video.value)
        }

        const response = await fetch('http://localhost:3000/posts', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        })
        const data = await response.json()
        if (response.ok) {
          alert('Post created successfully')
          router.push('/')
        } else {
          alert(data.message)
        }
      } catch (error) {
        console.error('Error creating post:', error)
        alert('Failed to create post')
      }
    }

    return { title, content, handleSubmit, handlePhotoUpload, handleVideoUpload }
  }
}
</script>

<style scoped>
form {
  display: flex;
  flex-direction: column;
  align-items: center;
}

input, textarea {
  width: 100%;
  max-width: 300px;
  margin-bottom: 10px;
}

div {
  margin-bottom: 10px;
}
</style>