import db from './database.js';

const posts = [
  {
    authorId: '337',
    role: 'Student',
    avatar: 'https://picsum.photos/seed/user1/128/128',
    time: 'Just now',
    content: 'Hello world! This is my first post.',
    image: null,
    imageHint: null,
    likes: 0,
  },
  {
    authorId: 'T-CS01',
    role: 'Professor',
    avatar: 'https://picsum.photos/seed/user2/128/128',
    time: 'Just now',
    content: 'Welcome to the Computer Science class!',
    image: null,
    imageHint: null,
    likes: 0,
  },
];

const insertPost = db.prepare(`
  INSERT INTO posts (authorId, role, avatar, time, content, image, imageHint, likes)
  VALUES (@authorId, @role, @avatar, @time, @content, @image, @imageHint, @likes)
`);

for (const post of posts) {
  insertPost.run(post);
}

console.log('Posts seeded!');
