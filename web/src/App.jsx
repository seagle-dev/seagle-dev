import './App.css'
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom'
import AdminPage from './pages/AdminPage'
import ViewerPage from './pages/ViewerPage'
import { ToastProvider } from './component/Toast'

function App() {
  return (
    <ToastProvider>
      <Router>
        <div className="app-container">
          {/* Navigation Bar */}
          <header className="app-header">
            <div className="brand-title">
              <span className="brand-logo-icon">🦅</span>
              <span>seagle admin</span>
            </div>
            <nav className="nav-links">
              <NavLink 
                to="/admin" 
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                Admin Panel
              </NavLink>
              <NavLink 
                to="/viewer" 
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                Book Viewer
              </NavLink>
            </nav>
          </header>

          {/* Routes */}
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <Routes>
              <Route path="/" element={<AdminPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/viewer" element={<ViewerPage />} />
            </Routes>
          </div>
        </div>
      </Router>
    </ToastProvider>
  )
}

export default App