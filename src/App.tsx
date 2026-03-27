import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Overview from './pages/Overview';
import MaintenancePage from './pages/MaintenancePage';
import AirQualityPage from './pages/AirQualityPage';
import WaterPage from './pages/WaterPage';
import EarthquakePage from './pages/EarthquakePage';

export default function App() {
  return (
    <BrowserRouter>
      <div className="layout">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/maintenance" element={<MaintenancePage />} />
            <Route path="/air-quality" element={<AirQualityPage />} />
            <Route path="/water" element={<WaterPage />} />
            <Route path="/earthquake" element={<EarthquakePage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
