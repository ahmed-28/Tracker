# 💪 Workout Tracker

A modern, cross-device workout tracking app built with React, TypeScript, and Supabase.

## ✨ Features

- **📱 Cross-device sync** - Access your data on phone, laptop, and tablet
- **☁️ Cloud backup** - Your workout data is safely stored in the cloud
- **🔄 Real-time updates** - Changes sync instantly across all devices
- **🏋️‍♂️ Exercise tracking** - Log workouts with reps, weight, and date
- **⚖️ Body weight tracking** - Monitor your weight progress over time
- **📊 Progress charts** - Visualize your fitness journey
- **🎯 Achievement system** - Unlock achievements as you progress
- **🔒 Secure authentication** - Sign in with your Google account

## 🚀 Quick Start

### 1. Clone and Install
```bash
git clone <your-repo-url>
cd workout_tracker
npm install
```

### 2. Set up Supabase
1. Create a [Supabase](https://supabase.com) account and project
2. Follow the detailed setup guide: `SUPABASE_SETUP.md`
3. Copy `.env.example` to `.env` and add your Supabase credentials

### 3. Run the App
```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) and sign in with Google!

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Backend**: Supabase (PostgreSQL + Auth + Real-time)
- **Styling**: Custom CSS with CSS variables
- **Authentication**: Google OAuth via Supabase Auth

## 📁 Project Structure

```
src/
├── components/          # React components
├── contexts/           # React contexts (Auth)
├── services/           # API services (Supabase)
├── hooks/             # Custom React hooks
├── types/             # TypeScript type definitions
├── config/            # Environment configuration
└── utils/             # Utility functions
```

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Environment Variables

```env
VITE_ENVIRONMENT=development
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## 🚀 Deployment

The app can be deployed to any static hosting platform:

- **Vercel** (recommended)
- **Netlify** 
- **GitHub Pages**
- **Custom server with Docker**

See `DEPLOYMENT.md` for detailed deployment instructions.

## 🔄 Data Migration

Existing users with localStorage data will see an automatic migration screen when they first sign in. The migration safely transfers:

- All workout entries
- Body weight records  
- Exercise library
- User preferences

## 🌟 Key Features Explained

### Cross-Device Sync
- Sign in with Google on any device
- Your data syncs automatically via Supabase real-time subscriptions
- Works offline with sync when reconnected

### Real-time Updates
- Multiple devices stay in sync instantly
- Changes appear immediately across all signed-in sessions
- Uses Supabase's WebSocket connections for live updates

### Data Security
- All data is encrypted and stored securely in Supabase
- Row Level Security ensures users can only access their own data
- Google OAuth provides secure, hassle-free authentication

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Built with [Supabase](https://supabase.com) for the backend
- Icons and design inspired by modern fitness apps
- Real-time sync powered by PostgreSQL and WebSockets

---

**Happy tracking! 🏋️‍♂️💪**