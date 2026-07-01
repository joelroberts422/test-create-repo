import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout.tsx'
import Library from './pages/Library.tsx'
import Home from './pages/Home.tsx'
import Test from './pages/Test.tsx'
import Share from './pages/Share.tsx'
import './App.css'

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/test" element={<Test />} />
        <Route path="/library" element={<Library />} />
        <Route path="/share" element={<Share />} />
      </Route>
    </Routes>
  )
}

export default App;
