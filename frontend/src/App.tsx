import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout.tsx'
import Library from './pages/Library.tsx'
import Home from './pages/Home.tsx'
import './App.css'

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/test" element={<h1>Test</h1>} />
        <Route path="/library" element={<Library />} />
      </Route>
    </Routes>
  )
}

export default App;
