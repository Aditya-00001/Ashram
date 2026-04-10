import './App.css'
import Nav from './components/nav.jsx'
import Footer from './components/footer.jsx'
import { BrowserRouter } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop.jsx';

function App() {
  return (
    <>
      <BrowserRouter>
        <ScrollToTop />
        <Nav />
        {/* Main page content renders via the Routes in Nav */}
        <Footer />
      </BrowserRouter>
    </>
  )
}

export default App