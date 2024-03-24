import { BrowserRouter, Routes, Route} from 'react-router-dom'

import Login from "./Login"
import Home from "./Home"

import "bootstrap/dist/css/bootstrap.min.css"

function App() {
  return (
    <BrowserRouter>
    <Routes>
      <Route path='/login' element={<Login />}></Route>
      <Route path='/' element={<Home />}></Route>
    </Routes>
    </BrowserRouter>
  )
}

export default App
