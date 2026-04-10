import './App.css'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import AdminPage from './pages/AdminPage'
import ViewerPage from './pages/ViewerPage'

function App() {
  return (
    <Router>
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* Navigation Bar */}
        <nav style={{ 
          background: '#2c3e50', 
          padding: '12px 24px', 
          display: 'flex', 
          gap: '20px',
          borderBottom: '2px solid #34495e',
          flexShrink: 0
        }}>
          <Link 
            to="/admin" 
            style={{ 
              color: '#fff', 
              textDecoration: 'none', 
              padding: '8px 16px',
              background: '#3498db',
              borderRadius: '4px',
              fontWeight: 'bold'
            }}
          >
            Admin Panel
          </Link>
          <Link 
            to="/viewer" 
            style={{ 
              color: '#fff', 
              textDecoration: 'none', 
              padding: '8px 16px',
              background: '#2ecc71',
              borderRadius: '4px',
              fontWeight: 'bold'
            }}
          >
            Book Viewer
          </Link>
        </nav>

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
  )
}

export default App