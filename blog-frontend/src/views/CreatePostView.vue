<template>
  <div class="create-post-view">
    <h2 class="title">Create New Post</h2>
    <form @submit.prevent="handleSubmit" class="post-form">
      <div class="form-group">
        <label for="title">Title:</label>
        <input v-model="title" id="title" type="text" placeholder="Enter post title" required>
      </div>
      <div class="form-group">
        <label for="content">Content:</label>
        <textarea v-model="content" id="content" placeholder="Write your post content here" required></textarea>
      </div>
      <div class="form-group">
        <label for="photo" class="file-label">Photo:</label>
        <input type="file" id="photo" @change="handlePhotoUpload" accept="image/*" class="file-input">
        <div v-if="photoPreview" class="file-preview">
          <img :src="photoPreview" alt="Photo Preview" class="preview-image">
        </div>
      </div>
      <div class="form-group">
        <label for="video" class="file-label">Video:</label>
        <input type="file" id="video" @change="handleVideoUpload" accept="video/*" class="file-input">
        <div v-if="videoPreview" class="file-preview">
          <video :src="videoPreview" controls class="preview-video"></video>
        </div>
      </div>
      <button type="submit" class="submit-btn">Create Post</button>
    </form>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

export default {
  name: 'CreatePostView',
  setup() {
    const title = ref('')
    const content = ref('')
    const photo = ref(null)
    const video = ref(null)
    const photoPreview = computed(() => photo.value ? URL.createObjectURL(photo.value) : null)
    const videoPreview = computed(() => video.value ? URL.createObjectURL(video.value) : null)
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

    return { title, content, handleSubmit, handlePhotoUpload, handleVideoUpload, photoPreview, videoPreview }
  }
}
</script>

<style scoped>
.create-post-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.title {
  font-size: 24px;
  margin-bottom: 20px;
}

.post-form {
  width: 100%;
  background-color: #f9f9f9;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  padding: 20px;
}

.form-group {
  margin-bottom: 20px;
}

label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

input[type="text"], textarea, input[type="file"] {
  width: 100%;
  max-width: 100%;
  border: 1px solid #ddd;
  border-radius: 5px;
  padding: 10px;
}

textarea {
  resize: vertical;
  min-height: 100px;
}

.file-label {
  margin-top: 10px;
}

.file-input {
  border: none;
  padding: 0;
}

.file-preview {
  margin-top: 10px;
}

.preview-image, .preview-video {
  width: 100%;
  max-height: 200px;
  border-radius: 5px;
}

.preview-video {
  height: auto;
}

.submit-btn {
  background-color: #007bff;
  color: #fff;
  border: none;
  padding: 15px 20px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
}

.submit-btn:hover {
  background-color: #0056b3;
}
</style>
