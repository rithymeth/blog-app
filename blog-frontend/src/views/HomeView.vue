<template>
  <div class="home-view">
    <!-- Profile Picture Upload -->
    <div class="profile-picture-upload" v-if="isAuthenticated">
      <img :src="userProfilePic" alt="User" class="user-pic" @click="triggerFileInput">
      <input 
        type="file" 
        ref="fileInput" 
        style="display: none" 
        @change="uploadProfilePicture" 
        accept="image/*"
      >
    </div>

    <!-- Create Post Area -->
    <div class="create-post" v-if="isAuthenticated">
      <img :src="userProfilePic" alt="User" class="user-pic">
      <input 
        type="text" 
        placeholder="What's on your mind?" 
        @click="goToCreatePost"
        class="create-post-input"
      >
    </div>

    <!-- Posts Feed -->
    <div v-for="post in posts" :key="post._id" class="post-card">
      <div class="post-header">
        <img :src="getProfilePic(post.author)" alt="Author" class="author-pic">
        <div class="post-info">
          <router-link :to="'/profile/' + post.author._id" class="author-name">{{ post.author.username }}</router-link>
          <span class="post-date">{{ formatDate(post.createdAt) }}</span>
        </div>
        <button v-if="isAuthor(post)" @click="deletePost(post._id)" class="delete-btn">&#8942;</button>
      </div>
      <p class="post-content">{{ post.content }}</p>
      <img v-if="post.imageUrl" :src="getFullUrl(post.imageUrl)" alt="Post image" class="post-image">
      <video v-if="post.videoUrl" :src="getFullUrl(post.videoUrl)" controls class="post-video"></video>
      <div class="post-stats">
        <span>{{ post.likes ? post.likes.length : 0 }} likes</span>
        <span>{{ post.comments ? post.comments.length : 0 }} comments</span>
      </div>
      <div class="post-actions">
        <button @click="likePost(post)" :class="['action-btn', { 'liked': isLiked(post) }]">
          {{ isLiked(post) ? 'Unlike' : 'Like' }}
        </button>
        <button class="action-btn" @click="toggleComments(post)">Comment</button>
        <button class="action-btn" @click="sharePost(post)">Share</button>
      </div>
      <div v-if="post.showComments" class="comments-section">
        <div v-for="comment in post.comments" :key="comment._id" class="comment">
          <strong>{{ comment.author.username }}:</strong> {{ comment.content }}
        </div>
        <form @submit.prevent="addComment(post)" class="comment-form">
          <input v-model="post.newComment" placeholder="Write a comment..." class="comment-input">
          <button type="submit" class="comment-submit">Post</button>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'

export default {
  name: 'HomeView',
  setup() {
    const posts = ref([])
    const router = useRouter()
    const fileInput = ref(null)

    const isAuthenticated = computed(() => !!localStorage.getItem('token'))

    const currentUser = computed(() => {
      const token = localStorage.getItem('token')
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]))
        return payload.userId
      }
      return null
    })

    const userProfilePic = ref('/path/to/default/profile/picture.jpg')

    const fetchPosts = async () => {
      try {
        const response = await fetch('http://localhost:3000/posts')
        posts.value = await response.json()
        posts.value.forEach(post => {
          post.showComments = false
          post.newComment = ''
        })
      } catch (error) {
        console.error('Error fetching posts:', error)
      }
    }

    const fetchUserProfile = async () => {
      if (currentUser.value) {
        try {
          const response = await fetch(`http://localhost:3000/users/${currentUser.value}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          })
          const userData = await response.json()
          if (userData.profilePicture) {
            userProfilePic.value = `http://localhost:3000${userData.profilePicture}`
          }
        } catch (error) {
          console.error('Error fetching user profile:', error)
        }
      }
    }

    const getFullUrl = (path) => {
      return `http://localhost:3000${path}`
    }

    const isAuthor = (post) => {
      return post.author._id === currentUser.value
    }

    const deletePost = async (postId) => {
      if (!confirm('Are you sure you want to delete this post?')) {
        return
      }

      const token = localStorage.getItem('token')
      if (!token) {
        alert('You must be logged in to delete a post')
        router.push('/login')
        return
      }

      try {
        const response = await fetch(`http://localhost:3000/posts/${postId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          posts.value = posts.value.filter(post => post._id !== postId)
        } else {
          const data = await response.json()
          alert(data.message || 'Failed to delete post')
        }
      } catch (error) {
        console.error('Error deleting post:', error)
        alert('An error occurred while deleting the post')
      }
    }

    const goToCreatePost = () => {
      router.push('/create-post')
    }

    const formatDate = (dateString) => {
      const options = { year: 'numeric', month: 'long', day: 'numeric' }
      return new Date(dateString).toLocaleDateString(undefined, options)
    }

    const getProfilePic = (author) => {
      return author.profilePicture 
        ? `http://localhost:3000${author.profilePicture}`
        : `https://via.placeholder.com/40?text=${author.username.charAt(0).toUpperCase()}`
    }

    const triggerFileInput = () => {
      fileInput.value.click()
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
          userProfilePic.value = `http://localhost:3000${data.profilePicture}`
          alert('Profile picture updated successfully')
        } else {
          alert(data.message || 'Failed to update profile picture')
        }
      } catch (error) {
        console.error('Error uploading profile picture:', error)
        alert('An error occurred while uploading the profile picture')
      }
    }

    const likePost = async (post) => {
      if (!isAuthenticated.value) {
        alert('You must be logged in to like a post')
        return
      }

      try {
        const response = await fetch(`http://localhost:3000/posts/${post._id}/like`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })
        const data = await response.json()
        post.likes = Array(data.likes).fill(currentUser.value)
      } catch (error) {
        console.error('Error liking post:', error)
      }
    }

    const isLiked = (post) => {
      return post.likes && post.likes.includes(currentUser.value)
    }

    const toggleComments = async (post) => {
      post.showComments = !post.showComments
      if (post.showComments && !post.comments) {
        try {
          const response = await fetch(`http://localhost:3000/posts/${post._id}/comments`)
          post.comments = await response.json()
        } catch (error) {
          console.error('Error fetching comments:', error)
        }
      }
    }

    const addComment = async (post) => {
      if (!isAuthenticated.value) {
        alert('You must be logged in to comment')
        return
      }

      try {
        const response = await fetch(`http://localhost:3000/posts/${post._id}/comments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ content: post.newComment })
        })
        const newComment = await response.json()
        if (!post.comments) post.comments = []
        post.comments.unshift(newComment)
        post.newComment = ''
      } catch (error) {
        console.error('Error adding comment:', error)
      }
    }

    const sharePost = (post) => {
      // This is a placeholder for the share functionality
      alert(`Sharing post: ${post._id}`)
      // In a real application, you might open a share dialog or copy a link to the clipboard
    }

    onMounted(() => {
      fetchPosts()
      fetchUserProfile()
    })

    return { 
      posts, 
      isAuthenticated,
      userProfilePic,
      getFullUrl, 
      isAuthor, 
      deletePost,
      goToCreatePost,
      formatDate,
      getProfilePic,
      fileInput,
      triggerFileInput,
      uploadProfilePicture,
      likePost,
      isLiked,
      toggleComments,
      addComment,
      sharePost
    }
  }
}
</script>

<style scoped>
.home-view {
  max-width: 680px;
  margin: 0 auto;
}

.profile-picture-upload {
  text-align: center;
  margin-bottom: 20px;
}

.profile-picture-upload .user-pic {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  cursor: pointer;
  object-fit: cover;
}

.create-post {
  background-color: #ffffff;
  border-radius: 8px;
  padding: 12px;
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.user-pic {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-right: 10px;
  object-fit: cover;
}

.create-post-input {
  flex-grow: 1;
  border: none;
  background-color: #f0f2f5;
  border-radius: 20px;
  padding: 8px 12px;
  cursor: pointer;
}

.post-card {
  background-color: #ffffff;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 20px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.post-header {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.author-pic {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-right: 10px;
  object-fit: cover;
}

.post-info {
  flex-grow: 1;
}

.author-name {
  font-weight: bold;
  color: #050505;
  text-decoration: none;
}

.post-date {
  font-size: 12px;
  color: #65676b;
}

.delete-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #65676b;
}

.post-content {
  margin-bottom: 10px;
}

.post-image, .post-video {
  width: 100%;
  border-radius: 8px;
  margin-bottom: 10px;
}

.post-stats {
  font-size: 14px;
  color: #65676b;
  margin-bottom: 10px;
}

.post-stats span {
  margin-right: 10px;
}

.post-actions {
  display: flex;
  justify-content: space-around;
  border-top: 1px solid #e4e6eb;
  padding-top: 10px;
}

.action-btn {
  background: none;
  border: none;
  color: #65676b;
  font-weight: 600;
  cursor: pointer;
  padding: 8px;
}

.action-btn:hover {
  background-color: #f0f2f5;
  border-radius: 4px;
}

.liked {
  color: #1877f2;
}

.comments-section {
  margin-top: 10px;
  border-top: 1px solid #e4e6eb;
  padding-top: 10px;
}

.comment {
  text-align: left;
  margin-bottom: 5px;
}

.comment-form {
  display: flex;
  margin-top: 10px;
}

.comment-input {
  flex-grow: 1;
  border: 1px solid #ccc;
  border-radius: 20px;
  padding: 5px 10px;
}

.comment-submit {
  background-color: #1877f2;
  color: white;
  border: none;
  border-radius: 20px;
  padding: 5px 10px;
  margin-left: 10px;
  cursor: pointer;
}
</style>
