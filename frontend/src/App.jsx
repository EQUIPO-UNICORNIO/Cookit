import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import AccessPage from './pages/Access/AccessPage';
import PantryPage from './pages/Pantry/PantryPage';
import ShoppingPage from './pages/Shopping/ShoppingPage';
import MealsPage from './pages/Meals/MealsPage';
import CookingPage from './pages/Cooking/CookingPage';
import ScannerPage from './pages/Scanner/ScannerPage';
import SubstitutionPage from './pages/Substitution/SubstitutionPage';
import CommunityPage from './pages/Community/CommunityPage';
import ChallengesPage from './pages/Challenges/ChallengesPage';
import ImpactPage from './pages/Impact/ImpactPage';
import ProfilePage from './pages/Profile/ProfilePage';


function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center min-h-screen"><p className="text-lg font-bold">Cargando...</p></div>;
  if (!user) return <Navigate to="/access" replace />;
  return children;
}

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-page">
        <div className="text-center">
          <span className="material-symbols-outlined text-5xl text-primary-600 animate-bounce">restaurant</span>
          <p className="text-lg font-bold mt-4">CookIt</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/access" element={user ? <Navigate to="/" replace /> : <AccessPage />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<MealsPage />} />
        <Route path="pantry" element={<PantryPage />} />
        <Route path="shopping" element={<ShoppingPage />} />
        <Route path="meals" element={<MealsPage />} />
        <Route path="cooking" element={<CookingPage />} />
        <Route path="cooking/:sessionId" element={<CookingPage />} />
        <Route path="scanner" element={<ScannerPage />} />
        <Route path="substitution" element={<SubstitutionPage />} />
        <Route path="community" element={<CommunityPage />} />
        <Route path="challenges" element={<ChallengesPage />} />
        <Route path="impact" element={<ImpactPage />} />
        <Route path="saved" element={<ScannerPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
