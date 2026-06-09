import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LocationProvider } from './context/LocationContext';
import Layout from './components/Layout';
import DiscoverPage from './pages/DiscoverPage';
import PlaceDetailPage from './pages/PlaceDetailPage';
import AddPlacePage from './pages/AddPlacePage';
import SavedPage from './pages/SavedPage';
import MyPlacesPage from './pages/MyPlacesPage';
import ProfilePage from './pages/ProfilePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

export default function App() {
  return (
    <AuthProvider>
      <LocationProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            <Route element={<Layout />}>
              <Route index element={<DiscoverPage />} />
              <Route path="place/:id" element={<PlaceDetailPage />} />
              <Route path="add" element={<AddPlacePage />} />
              <Route path="saved" element={<SavedPage />} />
              <Route path="my-places" element={<MyPlacesPage />} />
              <Route path="profile" element={<ProfilePage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </LocationProvider>
    </AuthProvider>
  );
}