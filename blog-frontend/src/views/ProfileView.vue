<template>
  <div class="profile-view">
    <!-- Cover Photo -->
    <div class="cover-photo">
      <img :src="coverPhotoUrl" alt="Cover Photo" class="cover-image">
      <button v-if="isOwnProfile" @click="triggerCoverPhotoUpload" class="edit-cover-photo">Change Cover Photo</button>
      <input 
        type="file" 
        ref="coverPhotoInput" 
        style="display: none" 
        @change="previewCoverPhoto" 
        accept="image/*"
      >
      <img v-if="previewCoverPhotoUrl" :src="previewCoverPhotoUrl" alt="Cover Photo Preview" class="cover-image-preview">
    </div>

    <!-- Profile Info Section -->
    <div class="profile-info">
      <div class="profile-picture-container">
        <img :src="profilePictureUrl" alt="Profile Picture" class="profile-picture">
        <button v-if="isOwnProfile" @click="triggerProfilePictureUpload" class="edit-profile-picture">
          <i class="fas fa-camera"></i>
        </button>
        <input 
          type="file" 
          ref="profilePictureInput" 
          style="display: none" 
          @change="previewProfilePicture" 
          accept="image/*"
        >
        <img v-if="previewProfilePictureUrl" :src="previewProfilePictureUrl" alt="Profile Picture Preview" class="profile-picture-preview">
      </div>
      <div class="user-info">
        <h1>{{ user.username }}</h1>
        <p v-if="!isEditing">{{ user.bio || 'No bio yet.' }}</p>
        <textarea v-else v-model="editedBio" class="bio-edit"></textarea>
        <button v-if="isOwnProfile && !isEditing" @click="startEditing" class="edit-profile-btn">Edit Profile</button>
        <div v-if="isEditing" class="edit-actions">
          <button @click="saveProfile" class="save-btn">Save</button>
          <button @click="cancelEditing" class="cancel-btn">Cancel</button>
        </div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="profile-tabs">
      <button @click="activeTab = 'posts'" :class="{ active: activeTab === 'posts' }">Posts ({{ user.postCount }})</button>
      <button @click="activeTab = 'about'" :class="{ active: activeTab === 'about' }">About</button>
      <button @click="activeTab = 'friends'" :class="{ active: activeTab === 'friends' }">Friends ({{ user.friends ? user.friends.length : 0 }})</button>
    </div>

    <!-- Tab Content -->
    <transition name="fade">
      <div :key="activeTab" class="tab-content">
        <!-- Posts Tab -->
        <div v-if="activeTab === 'posts'" class="posts-tab">
          <div v-for="post in userPosts" :key="post._id" class="post-card">
            <h3>{{ post.title }}</h3>
            <p>{{ post.content }}</p>
            <img v-if="post.imageUrl" :src="getFullUrl(post.imageUrl)" alt="Post image" class="post-image">
            <video v-if="post.videoUrl" :src="getFullUrl(post.videoUrl)" controls class="post-video"></video>
          </div>
        </div>
        <!-- About Tab -->
        <div v-if="activeTab === 'about'" class="about-tab">
          <h2>About {{ user.username }}</h2>
          <p>{{ user.bio || 'No bio available.' }}</p>
          <!-- Add more profile information here -->
        </div>
        <!-- Friends Tab -->
        <div v-if="activeTab === 'friends'" class="friends-tab">
          <h2>Friends</h2>
          <div v-if="user.friends && user.friends.length > 0" class="friends-grid">
            <div v-for="friend in user.friends" :key="friend._id" class="friend-card">
              <img :src="getProfilePic(friend)" alt="Friend's profile picture" class="friend-pic">
              <p>{{ friend.username }}</p>
            </div>
          </div>
          <p v-else>No friends to display.</p>
        </div>
      </div>
    </transition>
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
    const userPosts = ref([])
    const isEditing = ref(false)
    const editedBio = ref('')
    const activeTab = ref('posts')
    const profilePictureInput = ref(null)
    const coverPhotoInput = ref(null)
    const profilePictureUrl = ref('/path/to/default/profile/picture.jpg')
    const coverPhotoUrl = ref('/path/to/default/cover/photo.jpg')
    const previewProfilePictureUrl = ref(null)
    const previewCoverPhotoUrl = ref(null)

    const isOwnProfile = computed(() => {
      const token = localStorage.getItem('token')
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]))
        return payload.userId === route.params.id
      }
      return false
    })

    const fetchUserProfile = async () => {
      try {
        const response = await fetch(`http://localhost:3000/users/${route.params.id}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
        user.value = await response.json()
        editedBio.value = user.value.bio || ''
        if (user.value.profilePicture) {
          profilePictureUrl.value = `http://localhost:3000${user.value.profilePicture}`
        }
        if (user.value.coverPhoto) {
          coverPhotoUrl.value = `http://localhost:3000${user.value.coverPhoto}`
        }
      } catch (error) {
        handleError(error)
      }
    }

    const fetchUserPosts = async () => {
      try {
        const response = await fetch(`http://localhost:3000/users/${route.params.id}/posts`)
        userPosts.value = await response.json()
      } catch (error) {
        handleError(error)
      }
    }

    const getFullUrl = (path) => {
      return `http://localhost:3000${path}`
    }

    const getProfilePic = (user) => {
      return user.profilePicture 
        ? `http://localhost:3000${user.profilePicture}`
        : `https://via.placeholder.com/100?text=${user.username.charAt(0).toUpperCase()}`
    }

    const startEditing = () => {
      isEditing.value = true
      editedBio.value = user.value.bio || ''
    }

    const saveProfile = async () => {
      try {
        const response = await fetch(`http://localhost:3000/users/${route.params.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ bio: editedBio.value })
        })
        if (response.ok) {
          user.value.bio = editedBio.value
          isEditing.value = false
        } else {
          const data = await response.json()
          throw new Error(data.message || 'Failed to update profile')
        }
      } catch (error) {
        handleError(error)
      }
    }

    const cancelEditing = () => {
      isEditing.value = false
      editedBio.value = user.value.bio || ''
    }

    const triggerProfilePictureUpload = () => {
      profilePictureInput.value.click()
    }

    const previewProfilePicture = (event) => {
      const file = event.target.files[0]
      if (file) {
        previewProfilePictureUrl.value = URL.createObjectURL(file)
      }
    }

    const uploadProfilePicture = async (event) => {
      const file = event.target.files[0]
      if (!file) return

      const formData = new FormData()
      formData.append('profilePicture', file)

      try {
        const response = await fetch('http://localhost:3000/users/profile-picture', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: formData
        })

        const data = await response.json()
        if (response.ok) {
          profilePictureUrl.value = `http://localhost:3000${data.profilePicture}`
          user.value.profilePicture = data.profilePicture
        } else {
          throw new Error(data.message || 'Failed to update profile picture')
        }
      } catch (error) {
        handleError(error)
      }
    }

    const triggerCoverPhotoUpload = () => {
      coverPhotoInput.value.click()
    }

    const previewCoverPhoto = (event) => {
      const file = event.target.files[0]
      if (file) {
        previewCoverPhotoUrl.value = URL.createObjectURL(file)
      }
    }

    const uploadCoverPhoto = async (event) => {
      const file = event.target.files[0]
      if (!file) return

      const formData = new FormData()
      formData.append('coverPhoto', file)

      try {
        const response = await fetch('http://localhost:3000/users/cover-photo', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: formData
        })

        const data = await response.json()
        if (response.ok) {
          coverPhotoUrl.value = `http://localhost:3000${data.coverPhoto}`
          user.value.coverPhoto = data.coverPhoto
        } else {
          throw new Error(data.message || 'Failed to update cover photo')
        }
      } catch (error) {
        handleError(error)
      }
    }

    const handleError = (error) => {
      console.error(error)
      alert('An error occurred. Please try again.')
    }

    onMounted(() => {
      fetchUserProfile()
      fetchUserPosts()
    })

    return {
      user,
      userPosts,
      isEditing,
      editedBio,
      activeTab,
      profilePictureInput,
      coverPhotoInput,
      profilePictureUrl,
      coverPhotoUrl,
      previewProfilePictureUrl,
      previewCoverPhotoUrl,
      isOwnProfile,
      startEditing,
      saveProfile,
      cancelEditing,
      triggerProfilePictureUpload,
      previewProfilePicture,
      uploadProfilePicture,
      triggerCoverPhotoUpload,
      previewCoverPhoto,
      uploadCoverPhoto,
      getFullUrl,
      getProfilePic
    }
  }
}
</script>

<style scoped>
.profile-view {
  display: flex;
  flex-direction: column;
  max-width: 1200px;
  margin: 0 auto;
}

.cover-photo {
  position: relative;
  width: 100%;
  height: 250px;
  overflow: hidden;
}

.cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-image-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border: 2px dashed #aaa;
}

.edit-cover-photo {
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 10px 20px;
  background-color: rgba(0, 0, 0, 0.5);
  color: #fff;
  border: none;
  cursor: pointer;
  border-radius: 5px;
}

.profile-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  background-color: #fff;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  margin-top: -60px; /* Overlap cover photo */
}

.profile-picture-container {
  position: relative;
}

.profile-picture {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #fff;
  box-shadow: 0 0 0 4px rgba(0, 0, 0, 0.2);
}

.profile-picture-preview {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px dashed #aaa;
}

.edit-profile-picture {
  position: absolute;
  bottom: 0;
  right: 0;
  background-color: rgba(0, 0, 0, 0.5);
  color: #fff;
  border: none;
  cursor: pointer;
  border-radius: 5px;
  padding: 5px;
}

.user-info {
  text-align: center;
}

.bio-edit {
  width: 100%;
  height: 100px;
  border: 1px solid #ddd;
  border-radius: 5px;
  padding: 10px;
  resize: none;
}

.edit-actions {
  margin-top: 10px;
}

.edit-profile-btn, .save-btn, .cancel-btn {
  background-color: #007bff;
  color: #fff;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  margin: 5px;
}

.edit-profile-btn:hover, .save-btn:hover, .cancel-btn:hover {
  background-color: #0056b3;
}

.profile-tabs {
  display: flex;
  justify-content: space-around;
  background-color: #f8f9fa;
  padding: 10px;
  border-bottom: 1px solid #ddd;
}

.profile-tabs button {
  background-color: transparent;
  border: none;
  padding: 10px;
  cursor: pointer;
  font-size: 16px;
}

.profile-tabs button.active {
  border-bottom: 2px solid #007bff;
  color: #007bff;
}

.tab-content {
  padding: 20px;
  background-color: #fff;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.post-card {
  border: 1px solid #ddd;
  padding: 15px;
  border-radius: 5px;
  margin-bottom: 15px;
}

.post-image, .post-video {
  max-width: 100%;
  height: auto;
  border-radius: 5px;
}

.friends-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.friend-card {
  border: 1px solid #ddd;
  padding: 10px;
  width: 100px;
  text-align: center;
  border-radius: 5px;
}

.friend-pic {
  width: 80px;
  height: 80px;
  border-radius: 50%;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity .5s;
}

.fade-enter, .fade-leave-to {
  opacity: 0;
}
</style>
