


// Data Structures
export interface User {
  id: string;
  name: string;
  avatar: string;
  email: string;
  role: 'Student' | 'Professor' | 'Associate Professor' | 'Assistant Professor';
  department: string;
  bio: string;
  course?: string;
  branch?: string;
  section?: string;
  year?: string;
  pendingCourse?: string;
  pendingBranch?: string;
  pendingSection?: string;
  pendingYear?: string;
  isFollowing?: boolean;
  isOnline?: boolean;
  isRestricted?: boolean;
  restrictedAt?: string;
  chatRetentionUntil?: string;
  notifyNss?: boolean;
  notifyNcc?: boolean;
}

export interface Post {
    id: number;
    author: string;
    authorId: string;
    role: string;
    avatar: string;
    time: string;
    content: string;
    image?: string;
    videoUrl?: string;
    imageHint?: string;
    likes: number;
    comments: Comment[];
    isLiked?: boolean;
}

export interface Note {
  id: number;
  title: string;
  description: string;
  author: string;
  authorId: string;
  date: string;
  course: string;
  branch: string;
  section?: string;
  year: string;
  subject: string;
  visibility?: "class_only" | "view_all";
  fileUrl: string;
  fileName: string;
  fileSize: string;
}

export interface Internship {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  url: string;
  uploaderId: string;
  postedAt: string;
}


export interface Comment {
  id: number;
  author: string;
  authorId: string;
  avatar: string;
  text: string;
  likes: number;
  isLiked?: boolean;
}

export interface MediaAttachment {
  type: string;
  url: string;
  fileName?: string;
}

export interface Reaction {
  emoji: string;
  userId: string;
  username: string;
}

export interface Message {
  id: string;
  text: string;
  timestamp: string;
  createdAt?: string;
  senderId: string;
  isStarred?: boolean;
  sharedPost?: Post;
  sharedNote?: Note;
  sharedReel?: Reel;
  media?: MediaAttachment[];
  audioUrl?: string;
  reactions?: Reaction[];
  replyToId?: string;
  isDeleted?: boolean;
  isSystem?: boolean;
}

export interface Chat {
  id: string;
  users: User[];
  messages: Message[];
  unreadCount: number;
  isGroup?: boolean;
  name?: string;
  groupAvatar?: string;
  admins?: string[]; // array of user ids
  isMuted?: boolean;
}

export interface Notice {
  id: number;
  author: string;
  authorId: string;
  avatar: string;
  contentUrl: string;
  contentHint: string;
  contentType?: 'IMAGE' | 'VIDEO';
  caption?: string;
  createdAt?: string;
  expiresAt?: string;
  seen: boolean;
}

export interface AppNotification {
  id: string;
  type:
    | 'post'
    | 'comment'
    | 'message'
    | 'like'
    | 'reel'
    | 'notice'
    | 'schedule'
    | 'note'
    | 'internship';
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  link: string;
  actor: {
    name: string;
    avatar: string;
  };
}

export interface Reel {
    id: number;
    author: string;
    authorId: string;
    avatar: string;
    videoUrl?: string;
    caption: string;
    likes: number;
    isLiked: boolean;
    comments: Comment[];
}


// Mock Data
export const currentUserData: User = {
  id: '337',
  name: 'viswan',
  role: 'Student',
  department: 'Computer Science',
  course: 'bsc',
  branch: 'cs',
  section: 'cs1',
  year: '1-1',
  avatar: 'https://picsum.photos/seed/user-avatar/128/128',
  bio: '',
  email: 'current.user@example.com',
};

export const teacherUserData: User = {
  id: 'T-CS01',
  name: 'Dr. Alan Turing',
  role: 'Professor',
  department: 'Computer Science',
  avatar: 'https://picsum.photos/seed/alan-turing/128/128',
  bio: 'Pioneering computer scientist, mathematician, logician, cryptanalyst, philosopher, and theoretical biologist.',
  email: 'alan.turing@example.com',
};


export const allUsers: User[] = [
  currentUserData,
  teacherUserData,
  {
    id: 'user2',
    name: 'Alice',
    avatar: 'https://picsum.photos/seed/alice/128/128',
    email: 'alice@example.com',
    role: 'Student',
    department: 'Electronics',
    bio: 'Electronics enthusiast, passionate about circuit design and IoT.',
    isFollowing: true,
  },
  {
    id: 'user3',
    name: 'Bob',
    avatar: 'https://picsum.photos/seed/bob/128/128',
    email: 'bob@example.com',
    role: 'Student',
    department: 'Mechanical',
    bio: 'Mechanical engineering student with a love for robotics.',
  },
  {
    id: 'user4',
    name: 'Charlie',
    avatar: 'https://picsum.photos/seed/charlie/128/128',
    email: 'charlie@example.com',
    role: 'Student',
    department: 'Computer Science',
    bio: 'Loves competitive programming and AI.',
  },
  {
    id: 'user5',
    name: 'David',
    avatar: 'https://picsum.photos/seed/david/128/128',
    email: 'david@example.com',
    role: 'Student',
    department: 'Civil Engineering',
    bio: 'Interested in sustainable infrastructure.',
  },
  {
    id: 'user6',
    name: 'Eve',
    avatar: 'https://picsum.photos/seed/eve/128/128',
    email: 'eve@example.com',
    role: 'Student',
    department: 'Electronics',
    bio: 'Working on embedded systems projects.',
  },
  {
    id: 'user7',
    name: 'Frank',
    avatar: 'https://picsum.photos/seed/frank/128/128',
    email: 'frank@example.com',
    role: 'Student',
    department: 'Mechanical',
    bio: 'Automobile enthusiast and part of the Formula Student team.',
  },
  {
    id: '21CS045',
    name: 'Ravi Kumar',
    avatar: 'https://picsum.photos/seed/ravi-kumar/128/128',
    email: 'ravi.kumar@example.com',
    role: 'Student',
    department: 'Computer Science',
    bio: 'NSS Volunteer.',
  },
  {
    id: '22EE112',
    name: 'Priya Sharma',
    avatar: 'https://picsum.photos/seed/priya-sharma/128/128',
    email: 'priya.sharma@example.com',
    role: 'Student',
    department: 'Electrical Engineering',
    bio: 'Basketball player.',
  },
  {
    id: '20ME087',
    name: 'Amit Singh',
    avatar: 'https://picsum.photos/seed/amit-singh/128/128',
    email: 'amit.singh@example.com',
    role: 'Student',
    department: 'Mechanical Engineering',
    bio: 'NCC Cadet.',
  },
  {
    id: 'T-PHYS01',
    name: 'Dr. Evelyn Reed',
    role: 'Professor',
    department: 'Physics',
    avatar: 'https://picsum.photos/seed/evelyn/128/128',
    bio: 'Exploring the mysteries of the universe, one equation at a time. Quantum mechanics enthusiast and proud cat owner.',
    email: 'e.reed@example.com',
    isFollowing: true,
  },
  {
    id: 'T-BIO01',
    name: 'Dr. Alan Grant',
    role: 'Professor',
    department: 'Biology',
    avatar: 'https://picsum.photos/seed/alan/128/128',
    bio: 'Paleontologist and researcher. Fascinated by the history of life on Earth.',
    email: 'a.grant@example.com',
  },
   {
    id: 'principal',
    name: 'Principal',
    role: 'Professor',
    department: 'Admin',
    avatar: 'https://picsum.photos/seed/principal/128/128',
    bio: 'Leading the institution towards a brighter future.',
    email: 'principal@example.com',
  },
  {
    id: 'admin-office',
    name: 'Admin Office',
    role: 'Professor',
    department: 'Admin',
    avatar: 'https://picsum.photos/seed/events-committee/128/128',
    bio: 'Handling all administrative tasks.',
    email: 'admin@example.com',
  },
  {
    id: 'sports-club',
    name: 'Sports Club',
    role: 'Professor',
    department: 'Activities',
    avatar: 'https://picsum.photos/seed/sports-club/128/128',
    bio: 'Promoting sports and fitness.',
    email: 'sports@example.com',
  },
  {
    id: 'library',
    name: 'Library',
    role: 'Professor',
    department: 'Facilities',
    avatar: 'https://picsum.photos/seed/library/128/128',
    bio: 'The source of all knowledge.',
    email: 'library@example.com',
  },
  {
    id: 'music-club',
    name: 'Music Club',
    role: 'Professor',
    department: 'Activities',
    avatar: 'https://picsum.photos/seed/music-club/128/128',
    bio: 'For the love of music.',
    email: 'music@example.com',
  },
  {
    id: 'cse-dept',
    name: 'CSE Dept',
    role: 'Professor',
    department: 'Computer Science',
    avatar: 'https://picsum.photos/seed/cs-dept/128/128',
    bio: 'The department of Computer Science and Engineering.',
    email: 'cse@example.com',
  }
];


export const initialPosts: Post[] = [
  {
    id: 1,
    author: "Dr. Evelyn Reed",
    authorId: "T-PHYS01",
    role: "Professor of Physics",
    avatar: "https://picsum.photos/seed/evelyn/40/40",
    time: "2h ago",
    content:
      "Reminder: The guest lecture on Quantum Entanglement is scheduled for tomorrow at 10 AM in the main auditorium. Don't miss it!",
    image: "https://picsum.photos/seed/lecture-hall/600/400",
    imageHint: "lecture hall",
    likes: 128,
    comments: [
        { id: 1, author: "Alice", authorId: "user2", avatar: "https://picsum.photos/seed/alice/40/40", text: "Great lecture!", likes: 5, isLiked: false },
        { id: 2, author: "Bob", authorId: "user3", avatar: "https://picsum.photos/seed/bob/40/40", text: "Will this be recorded?", likes: 2, isLiked: true },
    ],
  },
  {
    id: 2,
    author: "Campus Events Committee",
    authorId: "admin-office",
    role: "Admin",
    avatar: "https://picsum.photos/seed/events-committee/40/40",
    time: "1d ago",
    content:
      "Get ready for CodeFest 2024! The annual hackathon is back. Registrations are now open. Form teams and build something amazing. Prizes worth $5000 to be won!",
    image: "https://picsum.photos/seed/hackathon/600/400",
    imageHint: "students coding",
    likes: 256,
    comments: [],
  },
  {
    id: 3,
    author: "John Doe",
    authorId: "user1",
    role: "Student",
    avatar: "https://picsum.photos/seed/user-avatar/40/40",
    time: "3d ago",
    content:
      "Just finished my project on applying machine learning to sentiment analysis. It was a tough but rewarding experience! #cs #ai",
    image: "https://picsum.photos/seed/coding-project/600/400",
    imageHint: "code on screen",
    likes: 50,
    comments: [],
    isLiked: true,
  },
    {
    id: 4,
    author: "Alice",
    authorId: "user2",
    role: "Student",
    avatar: "https://picsum.photos/seed/alice/40/40",
    time: "4d ago",
    content:
      "Our team won the inter-departmental quiz competition! Super proud of everyone's effort. 🏆 #quiz #winning",
    image: "https://picsum.photos/seed/quiz-win/600/400",
    imageHint: "team celebrating",
    likes: 75,
    comments: [],
    isLiked: false,
  },
];


export const initialChatsData: Chat[] = [
  {
    id: 'chat1',
    users: [currentUserData, allUsers.find(u => u.id === 'user2')!],
    messages: [
      { id: 'msg1', text: 'Hey, how are you?', timestamp: '10:30 AM', senderId: 'user2', reactions: [{emoji: '👋', userId: 'user1', username: 'John Doe'}] },
      { id: 'msg2', text: "I'm good, thanks! How about you?", timestamp: '10:31 AM', senderId: 'user1' },
      { id: 'msg3', text: 'Doing great! Ready for the meeting?', timestamp: '10:31 AM', senderId: 'user2' },
      { id: 'msg4', text: 'Almost, just grabbing some coffee.', timestamp: '10:32 AM', senderId: 'user1', replyToId: 'msg3' },
    ],
    unreadCount: 0,
  },
  {
    id: 'group1',
    name: 'CSE Final Year',
    isGroup: true,
    groupAvatar: 'https://picsum.photos/seed/group-cse/128/128',
    users: [currentUserData, allUsers.find(u => u.id === 'user4')!, allUsers.find(u => u.id === 'user5')!],
    admins: ['user1'],
    messages: [
      { id: 'g-msg1', text: 'Hey everyone, project deadline is approaching!', timestamp: '9:00 AM', senderId: 'user1' },
      { id: 'g-msg2', text: 'I have a doubt in module 3, can anyone help?', timestamp: '9:05 AM', senderId: 'user4' },
    ],
    unreadCount: 2,
  },
  {
    id: 'chat2',
    users: [currentUserData, allUsers.find(u => u.id === 'user3')!],
    messages: [
        { id: 'msg5', text: 'Can you send me the report?', timestamp: 'Yesterday', senderId: 'user3' },
    ],
    unreadCount: 1,
  },
  {
    id: 'group2',
    name: 'Photography Club',
    isGroup: true,
    groupAvatar: 'https://picsum.photos/seed/group-photo/128/128',
    users: [currentUserData, allUsers.find(u => u.id === 'user2')!, allUsers.find(u => u.id === 'user6')!],
    admins: ['user2'],
    messages: [
      { id: 'g-msg3', text: 'Photo walk this Sunday at 6 AM. See you all there!', timestamp: 'Wednesday', senderId: 'user2' },
    ],
    unreadCount: 0,
  },
  {
    id: 'chat3',
    users: [currentUserData, allUsers.find(u => u.id === 'user4')!],
    messages: [
      { id: 'msg6', text: 'Happy Birthday!', timestamp: 'Wednesday', senderId: 'user4' },
    ],
    unreadCount: 1,
  },
    {
    id: 'chat4',
    users: [currentUserData, allUsers.find(u => u.id === 'user5')!],
    messages: [
        { id: 'msg7', text: 'See you tomorrow.', timestamp: 'Tuesday', senderId: 'user5' },
    ],
    unreadCount: 0,
  },
    {
    id: 'chat5',
    users: [currentUserData, allUsers.find(u => u.id === 'user6')!],
    messages: [
        { id: 'msg8', text: 'Project deadline is next week!', timestamp: 'Monday', senderId: 'user6' },
    ],
    unreadCount: 3,
  },
   {
    id: 'chat6',
    users: [currentUserData, allUsers.find(u => u.id === 'user7')!],
    messages: [
        { id: 'msg9', text: "Let's catch up later.", timestamp: 'Sunday', senderId: 'user7' },
    ],
    unreadCount: 0,
  },
  {
    id: 'group-nss',
    name: 'NSS Community',
    isGroup: true,
    groupAvatar: 'https://picsum.photos/seed/nss-community/128/128',
    users: [allUsers.find(u => u.id === 'admin-office')!],
    admins: ['admin-office'],
    messages: [
        { id: 'nss-msg1', text: 'Welcome to the NSS Community chat!', timestamp: 'Sunday', senderId: 'admin-office', isSystem: true },
    ],
    unreadCount: 0,
  },
  {
    id: 'group-ncc',
    name: 'NCC Community',
    isGroup: true,
    groupAvatar: 'https://picsum.photos/seed/ncc-community/128/128',
    users: [allUsers.find(u => u.id === 'admin-office')!],
    admins: ['admin-office'],
    messages: [
        { id: 'ncc-msg1', text: 'Welcome to the NCC Community chat!', timestamp: 'Sunday', senderId: 'admin-office', isSystem: true },
    ],
    unreadCount: 0,
  }
];

export const initialNotices: Notice[] = [
  { id: 1, authorId: 'principal', author: 'Principal', avatar: 'https://picsum.photos/seed/principal/80/80', contentUrl: 'https://picsum.photos/seed/notice1/1080/1920', contentHint: 'official announcement', seen: false },
  { id: 2, authorId: 'T-PHYS01', author: 'Dr. Reed', avatar: 'https://picsum.photos/seed/evelyn/80/80', contentUrl: 'https://picsum.photos/seed/notice2/1080/1920', contentHint: 'academic update', seen: false },
  { id: 3, authorId: 'admin-office', author: 'Admin', avatar: 'https://picsum.photos/seed/events-committee/80/80', contentUrl: 'https://picsum.photos/seed/notice3/1080/1920', contentHint: 'event poster', seen: true },
  { id: 4, authorId: 'sports-club', author: 'Sports Club', avatar: 'https://picsum.photos/seed/sports-club/80/80', contentUrl: 'https://picsum.photos/seed/notice4/1080/1920', contentHint: 'sports event', seen: false },
  { id: 10, authorId: 'sports-club', author: 'Sports Club', avatar: 'https://picsum.photos/seed/sports-club/80/80', contentUrl: 'https://picsum.photos/seed/notice10/1080/1920', contentHint: 'sports results', seen: false },
  { id: 5, authorId: 'library', author: 'Library', avatar: 'https://picsum.photos/seed/library/80/80', contentUrl: 'https://picsum.photos/seed/notice5/1080/1920', contentHint: 'library notice', seen: true },
  { id: 6, authorId: 'music-club', author: 'Music Club', avatar: 'https://picsum.photos/seed/music-club/80/80', contentUrl: 'https://picsum.photos/seed/notice6/1080/1920', contentHint: 'music event', seen: false },
  { id: 7, authorId: 'cse-dept', author: 'CSE Dept', avatar: 'https://picsum.photos/seed/cs-dept/80/80', contentUrl: 'https://picsum.photos/seed/notice7/1080/1920', contentHint: 'department notice', seen: false },
  { id: 8, authorId: 'T-PHYS01', author: 'Dr. Reed', avatar: 'https://picsum.photos/seed/evelyn/80/80', contentUrl: 'https://picsum.photos/seed/notice8/1080/1920', contentHint: 'class cancelled', seen: false },
  { id: 9, authorId: 'T-PHYS01', author: 'Dr. Reed', avatar: 'https://picsum.photos/seed/evelyn/80/80', contentUrl: 'https://picsum.photos/seed/notice9/1080/1920', contentHint: 'exam schedule', seen: false },
];


export const initialNotificationsData: AppNotification[] = [
  {
    id: "noti1",
    type: "comment",
    title: "New Comment",
    description: "Alice commented on your post: 'Quantum Entanglement...'",
    timestamp: "2m ago",
    read: false,
    link: "/home#post-1",
    actor: { name: "Alice", avatar: "https://picsum.photos/seed/alice/40/40" },
  },
  {
    id: "noti2",
    type: "post",
    title: "New Post by Events Committee",
    description: "Get ready for CodeFest 2024! The annual hackathon is back...",
    timestamp: "1h ago",
    read: false,
    link: "/home#post-2",
    actor: { name: "Campus Events", avatar: "https://picsum.photos/seed/events-committee/40/40" },
  },
  {
    id: "noti3",
    type: "message",
    title: "New Message from Bob",
    description: "Can you send me the report?",
    timestamp: "3h ago",
    read: true,
    link: "/chat",
    actor: { name: "Bob", avatar: "https://picsum.photos/seed/bob/40/40" },
  },
];

const DUMMY_PDF_URL = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';

export const initialNotes: Note[] = [
  {
    id: 1,
    title: "Thermodynamics - Unit 1",
    description: "Complete notes for the first unit of thermodynamics.",
    author: "Dr. Smith",
    authorId: "T-PHYS01",
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    course: "btech-eng",
    branch: "me",
    year: "2-3",
    subject: "Thermodynamics",
    fileUrl: DUMMY_PDF_URL,
    fileName: "Thermodynamics-Unit-1.pdf",
    fileSize: "1.2 MB",
  },
  {
    id: 2,
    title: "Data Structures & Algorithms",
    description: "Includes concepts on trees, graphs, and sorting algorithms.",
    author: "Prof. Jane",
    authorId: "user2",
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    course: "btech-eng",
    branch: "cse",
    year: "2-3",
    subject: "DSA",
    fileUrl: DUMMY_PDF_URL,
    fileName: "DSA-Notes.pdf",
    fileSize: "3.5 MB",
  },
  {
    id: 3,
    title: "Linear Algebra Cheatsheet",
    description: "A quick reference for all major formulas and theorems.",
    author: "Dr. Davis",
    authorId: currentUserData.id,
    date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
    course: "bsc",
    branch: "cs",
    year: "1-2",
    subject: "Linear Algebra",
    fileUrl: DUMMY_PDF_URL,
    fileName: "Linear-Algebra-Cheatsheet.pdf",
    fileSize: "333 KB",
  },
  {
    id: 4,
    title: "Network Protocols Summary",
    description: "TCP/IP, UDP, and other important protocols explained.",
    author: "Prof. Miller",
    authorId: "user4",
    date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago
    course: "btech-eng",
    branch: "cse",
    year: "3-5",
    subject: "Computer Networks",
    fileUrl: DUMMY_PDF_URL,
    fileName: "Network-Protocols.pdf",
    fileSize: "876 KB",
  },
];


export const initialReels: Reel[] = [
    {
        id: 1,
        author: 'Campus Events',
        authorId: 'admin-office',
        avatar: 'https://picsum.photos/seed/events-committee/128/128',
        videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
        caption: 'Our annual tech fest was a huge success! Check out the highlights. #TechFest2024',
        likes: 1250,
        isLiked: false,
        comments: [],
    },
    {
        id: 2,
        author: 'Alice',
        authorId: 'user2',
        avatar: 'https://picsum.photos/seed/alice/128/128',
        videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        caption: 'A quick tour of the new library! So many books to read. 📚',
        likes: 832,
        isLiked: true,
        comments: [],
    },
    {
        id: 3,
        author: 'Sports Club',
        authorId: 'sports-club',
        avatar: 'https://picsum.photos/seed/sports-club/128/128',
        videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
        caption: 'Glimpses from the final match of the inter-college football tournament. What a nail-biter!',
        likes: 2100,
        isLiked: false,
        comments: [],
    },
    {
        id: 4,
        author: 'viswan',
        authorId: '337',
        avatar: 'https://picsum.photos/seed/user-avatar/128/128',
        videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        caption: 'My drone footage of the campus from above. It looks so green!',
        likes: 540,
        isLiked: true,
        comments: [],
    },
];

export const initialInternships: Internship[] = [
  {
    id: "swe-1",
    title: "Software Engineer Intern",
    company: "Innovate Solutions",
    location: "Remote",
    description: "Work on our flagship product, contributing to both front-end and back-end development. Experience with React and Node.js is a plus.",
    url: "https://example.com/apply/swe",
    uploaderId: 'T-PHYS01',
    postedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
  },
  {
    id: "ds-1",
    title: "Data Science Intern",
    company: "DataDriven Inc.",
    location: "New York, NY",
    description: "Analyze large datasets to extract meaningful insights. Assist our data science team in building predictive models and reports.",
    url: "https://example.com/apply/ds",
    uploaderId: '337', // currentUserData.id
    postedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
  },
  {
    id: "mktg-1",
    title: "Marketing Intern",
    company: "Growth Gurus",
    location: "San Francisco, CA",
    description: "Support our marketing team in campaign creation, social media management, and content writing. A great opportunity to learn about digital marketing.",
    url: "https://example.com/apply/mktg",
    uploaderId: 'T-BIO01',
    postedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days ago
  },
  {
    id: "ux-1",
    title: "UX/UI Design Intern",
    company: "Creative Minds",
    location: "Remote",
    description: "Collaborate with our design team to create intuitive and visually appealing user interfaces for our mobile and web applications.",
    url: "https://example.com/apply/ux",
    uploaderId: 'T-PHYS01',
    postedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
  },
];
