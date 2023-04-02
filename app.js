const express = require('express');
const methodOverride = require('method-override');
const path = require('path');
const session = require('express-session');
const mongoose = require('mongoose');

const User = require('./models/user');
const Post = require('./models/post');

const PORT = 3000;

// mongodb setum
mongoose
  .connect('mongodb://127.0.0.1:27017/blog')
  .catch((error) => console(error));

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error'));
db.once('open', () => {
  console.log('Database connected');
});

// express setup
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/views'));
app.use(express.static(__dirname + '/style'))
app.use(session ({
    secret: 'secret_key', 
    resave: false,
    saveUninitialized: true
}));

// route handlers

// get methods
app.get('/', (req, res) => {
    const user = req.session.user;
    res.render('index', { user });
});

app.get('/register_page', (req, res) => {
    const user = req.session.user;
    if (user != null) {
        res.redirect('/blog?status=authorized');
        return;
    }
    res.render('register_page', { user });
});

app.get('/login_page', (req, res) => {
    const user = req.session.user;
    if (user != null) {
        res.redirect('/blog?status=authorized');
        return;
    }
    res.render('login_page', { user });
});

app.get('/blog', (req, res) => {
    if (req.session.user == null) {
        res.redirect('/?error=notAuthorized');
        return;
    }
    const user = req.session.user;
    res.render('blog_page', { user });
});

app.get('/profile', (req, res) => {
    if (req.session.user == null) {
        res.redirect('/login_page?error=notAuthorized');
        return;
    }
    const user = req.session.user;
    res.render('user_page', { user });
});

app.get('/blog/create_post', (req, res) => {
    if (req.session.user == null) {
        res.redirect('/login_page?error=notAuthorized');
        return;
    }
    const user = req.session.user;
    res.render('create_post_page', { user });
});

app.get('/blog/posts', async (req, res) => {
    if (req.session.user == null) {
        res.redirect('/login_page?error=notAuthorized');
        return;
    }
    const posts = await Post.find({});
    const user = req.session.user;
    res.render('posts_page', { user, posts });
});

app.get('/blog/my_posts', async (req, res) => {
    if (req.session.user == null) {
        res.redirect('/login_page?error=notAuthorized');
        return;
    }
    const user = req.session.user;
    const posts = await Post.find({username: user.username});
    res.render('my_posts_page', { user, posts });
});

app.get('/blog/my_posts/:postId', async (req, res) => {
    if (req.session.user == null) {
        res.redirect('/login_page?error=notAuthorized');
        return;
    }
    const postId = req.params.postId;
    const user = req.session.user;
    const post = await Post.findById({_id: postId});
    res.render('my_post_details_page', { user, post });
});

// post methods
app.post('/validate_registration', async (req, res) => {
    const user = new User(req.body.user);
    user.save();
    res.redirect('/login_page');
});

app.post('/validate_login', async (req, res) => {
    const user = await User.findOne({username: req.body.user.username}).exec();
    if (user == null) {
        res.redirect('/login_page?error=userDoesNotExist');
        return;
    }
    const password = req.body.user.password;
    if (user.password != password) {
        res.redirect('/login_page?error=passwordNoMatch');
        return;
    }
    req.session.user = user;
    res.redirect('/blog');
});

app.post('/profile/logout', async (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.log(err);
        } else {
            res.redirect('/login_page');
        }
    });
});

app.post('/blog/add_post', async (req, res) => {
    const post = new Post(req.body.post);
    post.save();
    res.redirect('/blog');
});

app.post('/blog/delete_post', async (req, res) => {
    const postId = req.body.id;
    const post = await Post.findById(postId);
    post.deleteOne();
    res.redirect('/blog/my_posts');
});

app.post('/blog/update_post', async (req, res) => {
    const postId = req.body.id;
    const postFromForm = req.body.post;
    await Post.findByIdAndUpdate(postId, {header: postFromForm.header});
    await Post.findByIdAndUpdate(postId, {text: postFromForm.text});
    res.redirect('/blog/my_posts');
});

// error and server init
app.get('*', (req, res) => {
    res.send('I do not know this path');
});

app.listen(PORT, () => {
    console.log('Server is running and listening');
});