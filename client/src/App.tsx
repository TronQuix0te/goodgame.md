import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import Leaderboard from './pages/Leaderboard';
import BuildDetail from './pages/BuildDetail';
import Submit from './pages/Submit';
import Login from './pages/Login';
import AuthCallback from './pages/AuthCallback';
import Profile from './pages/Profile';
import UserProfile from './pages/UserProfile';
import Admin from './pages/Admin';
import Search from './pages/Search';
import Compare from './pages/Compare';
import Quiz from './pages/Quiz';
import ArchetypeDetail from './pages/ArchetypeDetail';
import Blog from './pages/Blog';
import Article from './pages/Article';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<Leaderboard />} />
            <Route path="/build/:name" element={<BuildDetail />} />
            <Route path="/submit" element={<Submit />} />
            <Route path="/login" element={<Login />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/user/:username" element={<UserProfile />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/search" element={<Search />} />
            <Route path="/compare" element={<Compare />} />
            <Route path="/quiz" element={<Quiz />} />
            <Route path="/archetype/:id" element={<ArchetypeDetail />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<Article />} />
          </Routes>
        </Layout>
      </AuthProvider>
    </BrowserRouter>
  );
}
