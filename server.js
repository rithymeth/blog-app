const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect('mongodb+srv://admin:1331@cluster0.qbwusi2.mongodb.net/')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Could not connect to MongoDB:', err));

// Models
const User = mongoose.model('User', {
  username: String,
  password: String,
  bio: { type: String, default: '' },
  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  friendRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  profilePicture: { type: String, default: '' },
  coverPhoto: { type: String, default: '' }
});

const BlogPost = mongoose.model('BlogPost', {
  title: String,
  content: String,
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  imageUrl: String,
  videoUrl: String,
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now }
});

const Comment = mongoose.model('Comment', {
  content: String,
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  post: { type: mongoose.Schema.Types.ObjectId, ref: 'BlogPost' },
  createdAt: { type: Date, default: Date.now }
});

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Authentication middleware
const auth = (req, res, next) => {
  try {
    const token = req.header('Authorization').replace('Bearer ', '');
    const decoded = jwt.verify(token, 'your_jwt_secret');
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).send({ error: 'Please authenticate.' });
  }
};

// Routes

// Register user
app.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).send({ message: 'Username and password are required' });
    }
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).send({ message: 'Username already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 8);
    const user = new User({ username, password: hashedPassword });
    await user.save();
    res.status(201).send({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Error in /register:', error);
    res.status(500).send({ message: 'An error occurred during registration' });
  }
});

// Login user
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).send({ message: 'Invalid login credentials' });
    }
    const token = jwt.sign({ userId: user._id }, 'your_jwt_secret');
    res.send({ token });
  } catch (error) {
    console.error('Error in /login:', error);
    res.status(400).send({ message: error.message });
  }
});

// Create blog post
app.post('/posts', auth, upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'video', maxCount: 1 }
]), async (req, res) => {
  try {
    const { title, content } = req.body;
    if (!title || !content) {
      return res.status(400).send({ message: 'Title and content are required' });
    }
    const post = new BlogPost({
      title,
      content,
      author: req.userId,
      imageUrl: req.files.image ? `/uploads/${req.files.image[0].filename}` : null,
      videoUrl: req.files.video ? `/uploads/${req.files.video[0].filename}` : null,
    });
    await post.save();
    res.status(201).send(post);
  } catch (error) {
    console.error('Error in POST /posts:', error);
    res.status(400).send({ message: error.message });
  }
});

// Read all blog posts
app.get('/posts', async (req, res) => {
  try {
    const posts = await BlogPost.find()
      .populate('author', 'username profilePicture')
      .sort({ createdAt: -1 });
    res.send(posts);
  } catch (error) {
    console.error('Error in GET /posts:', error);
    res.status(500).send({ message: error.message });
  }
});

// Read single blog post
app.get('/posts/:id', async (req, res) => {
  try {
    const post = await BlogPost.findById(req.params.id)
      .populate('author', 'username profilePicture')
      .populate({
        path: 'comments',
        populate: { path: 'author', select: 'username profilePicture' }
      });
    if (!post) {
      return res.status(404).send({ message: "Post not found" });
    }
    res.send(post);
  } catch (error) {
    console.error('Error in GET /posts/:id:', error);
    res.status(500).send({ message: error.message });
  }
});

// Update blog post
app.patch('/posts/:id', auth, upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'video', maxCount: 1 }
]), async (req, res) => {
  try {
    const post = await BlogPost.findOne({ _id: req.params.id, author: req.userId });
    if (!post) {
      return res.status(404).send({ message: "Post not found or you're not authorized to edit it" });
    }
    
    const updates = Object.keys(req.body);
    updates.forEach((update) => post[update] = req.body[update]);
    
    if (req.files.image) {
      post.imageUrl = `/uploads/${req.files.image[0].filename}`;
    }
    if (req.files.video) {
      post.videoUrl = `/uploads/${req.files.video[0].filename}`;
    }
    
    await post.save();
    res.send(post);
  } catch (error) {
    console.error('Error in PATCH /posts/:id:', error);
    res.status(400).send({ message: error.message });
  }
});

// Delete blog post
app.delete('/posts/:id', auth, async (req, res) => {
  try {
    const post = await BlogPost.findOneAndDelete({ _id: req.params.id, author: req.userId });
    if (!post) {
      return res.status(404).send({ message: "Post not found or you're not authorized to delete it" });
    }
    res.send({ message: "Post deleted successfully" });
  } catch (error) {
    console.error('Error in DELETE /posts/:id:', error);
    res.status(500).send({ message: error.message });
  }
});

// Get user profile
app.get('/users/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('friends', 'username profilePicture')
      .populate('friendRequests', 'username profilePicture');
    if (!user) {
      return res.status(404).send({ message: 'User not found' });
    }
    
    // Get post count for the user
    const postCount = await BlogPost.countDocuments({ author: req.params.id });
    
    res.send({
      ...user.toObject(),
      postCount
    });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

// Get posts for a specific user
app.get('/users/:id/posts', async (req, res) => {
  try {
    const posts = await BlogPost.find({ author: req.params.id })
      .populate('author', 'username profilePicture')
      .sort({ createdAt: -1 });
    res.send(posts);
  } catch (error) {
    console.error('Error in GET /users/:id/posts:', error);
    res.status(500).send({ message: error.message });
  }
});

// Update user profile
app.patch('/users/:id', auth, async (req, res) => {
  try {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['bio'];
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

    if (!isValidOperation) {
      return res.status(400).send({ error: 'Invalid updates!' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).send({ message: 'User not found' });
    }

    if (user._id.toString() !== req.userId) {
      return res.status(403).send({ message: 'You can only update your own profile' });
    }

    updates.forEach((update) => user[update] = req.body[update]);
    await user.save();

    res.send(user);
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
});

// Upload profile picture
app.post('/users/profile-picture', auth, upload.single('profilePicture'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send({ message: 'No file uploaded' });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).send({ message: 'User not found' });
    }

    user.profilePicture = `/uploads/${req.file.filename}`;
    await user.save();

    res.send({ message: 'Profile picture uploaded successfully', profilePicture: user.profilePicture });
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
});

// Upload cover photo
app.post('/users/cover-photo', auth, upload.single('coverPhoto'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send({ message: 'No file uploaded' });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).send({ message: 'User not found' });
    }

    user.coverPhoto = `/uploads/${req.file.filename}`;
    await user.save();

    res.send({ message: 'Cover photo uploaded successfully', coverPhoto: user.coverPhoto });
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
});

// Send friend request
app.post('/users/:id/friend-request', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const friendToAdd = await User.findById(req.params.id);

    if (!friendToAdd) {
      return res.status(404).send({ message: 'User not found' });
    }

    if (user.friends.includes(friendToAdd._id)) {
      return res.status(400).send({ message: 'Already friends with this user' });
    }

    if (friendToAdd.friendRequests.includes(user._id)) {
      return res.status(400).send({ message: 'Friend request already sent' });
    }

    friendToAdd.friendRequests.push(user._id);
    await friendToAdd.save();

    res.send({ message: 'Friend request sent successfully' });
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
});

// Accept friend request
app.post('/users/:id/accept-friend', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const friendToAccept = await User.findById(req.params.id);

    if (!friendToAccept) {
      return res.status(404).send({ message: 'User not found' });
    }

    if (!user.friendRequests.includes(friendToAccept._id)) {
      return res.status(400).send({ message: 'No friend request from this user' });
    }

    user.friendRequests = user.friendRequests.filter(id => id.toString() !== req.params.id);
    user.friends.push(friendToAccept._id);
    friendToAccept.friends.push(user._id);

    await user.save();
    await friendToAccept.save();

    res.send({ message: 'Friend request accepted' });
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
});

// Reject friend request
app.post('/users/:id/reject-friend', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    user.friendRequests = user.friendRequests.filter(id => id.toString() !== req.params.id);
    await user.save();

    res.send({ message: 'Friend request rejected' });
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
});

// Get friend requests
app.get('/users/friend-requests', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).populate('friendRequests', 'username profilePicture');
    res.send(user.friendRequests);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

// Remove friend
app.delete('/users/:id/friends', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const friendToRemove = await User.findById(req.params.id);

    if (!friendToRemove) {
      return res.status(404).send({ message: 'User not found' });
    }

    user.friends = user.friends.filter(friend => friend.toString() !== req.params.id);
    friendToRemove.friends = friendToRemove.friends.filter(friend => friend.toString() !== req.userId);

    await user.save();
    await friendToRemove.save();

    res.send({ message: 'Friend removed successfully' });
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
});


// Like a post
app.post('/posts/:id/like', auth, async (req, res) => {
  try {
    const post = await BlogPost.findById(req.params.id);
    if (!post) {
      return res.status(404).send({ message: 'Post not found' });
    }

    const userLikeIndex = post.likes.indexOf(req.userId);
    if (userLikeIndex > -1) {
      // User has already liked the post, so unlike it
      post.likes.splice(userLikeIndex, 1);
    } else {
      // User hasn't liked the post, so add the like
      post.likes.push(req.userId);
    }

    await post.save();
    res.send({ likes: post.likes.length, userLiked: userLikeIndex === -1 });
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
});

// Add a comment to a post
app.post('/posts/:id/comments', auth, async (req, res) => {
  try {
    const post = await BlogPost.findById(req.params.id);
    if (!post) {
      return res.status(404).send({ message: 'Post not found' });
    }

    const comment = new Comment({
      content: req.body.content,
      author: req.userId,
      post: post._id
    });

    await comment.save();
    post.comments.push(comment._id);
    await post.save();

    await comment.populate('author', 'username');
    res.status(201).send(comment);
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
});

// Get comments for a post
app.get('/posts/:id/comments', async (req, res) => {
  try {
    const comments = await Comment.find({ post: req.params.id })
      .populate('author', 'username')
      .sort({ createdAt: -1 });
    res.send(comments);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

// Serve static files
app.use('/uploads', express.static('uploads'));

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});