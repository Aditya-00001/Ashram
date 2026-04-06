// import { useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from './assets/vite.svg'
// import heroImg from './assets/hero.png'
import './App.css'
import Nav from './components/nav.jsx'
import Footer from './components/footer.jsx'
import { BrowserRouter } from 'react-router-dom';
import AdminDashboard from './components/AdminDashboard.jsx';
import ProtectedRoute from './components/ProtectedRoute';
function App() {
  // const [count, setCount] = useState(0)

  return (
    <>
    <BrowserRouter>
      <Nav />
      {/* Your main page content will render here via the Routes in Nav */}
      <Footer />
      {/* <AdminDashboard /> */}
    </BrowserRouter>
    </>
  )
}

export default App
