import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useTranslation } from 'react-i18next';
import Layout from './components/Layout';
import AccessPage from './pages/Access/AccessPage';
import AuthCallbackPage from './pages/Access/AuthCallbackPage';
import ResetPasswordPage from './pages/Access/ResetPasswordPage';
import PantryPage from './pages/Pantry/PantryPage';
import ShoppingPage from './pages/Shopping/ShoppingPage';
import MealsPage from './pages/Meals/MealsPage';
import RecipesPage from './pages/Recipes/RecipesPage';
import CookingPage from './pages/Cooking/CookingPage';
import ScannerPage from './pages/Scanner/ScannerPage';
import SubstitutionPage from './pages/Substitution/SubstitutionPage';
import CommunityPage from './pages/Community/CommunityPage';
import ChallengesPage from './pages/Challenges/ChallengesPage';
import ImpactPage from './pages/Impact/ImpactPage';
import ProfilePage from './pages/Profile/ProfilePage';


function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const { t } = useTranslation();
  if (loading) return <div className="flex items-center justify-center min-h-screen"><p className="text-lg font-bold">{t('common.loading')}</p></div>;
  if (!user) return <Navigate to="/access" replace />;
  return children;
}

function RouteTracker() {
  const location = useLocation();
  useEffect(() => {
    window.dataLayer?.push({
      event: 'gtm.historyChange',
      page: location.pathname + location.search,
      title: document.title
    });
  }, [location]);
  return null;
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
    <>
      <RouteTracker />
      <Routes>
      <Route path="/access" element={user ? <Navigate to="/" replace /> : <AccessPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<MealsPage />} />
        <Route path="pantry" element={<PantryPage />} />
        <Route path="shopping" element={<ShoppingPage />} />
        <Route path="meals" element={<MealsPage />} />
        <Route path="recipes" element={<RecipesPage />} />
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
    </>
  );
}
