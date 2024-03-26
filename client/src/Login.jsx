import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

function Login() {
  const [values, setValues] = useState({
    email: '',
    password: ''
  })
  const [errors, setErrors] = useState([])

  const navigate = useNavigate()

  const handleInput = (event) => {
    setValues(prev => ({...prev, [event.target.name]: event.target.value}))
  }

  axios.defaults.withCredentials = true

  useEffect(() => {
    axios.get('http://localhost:9000')
    .then(res => {
      if (res.data.isLoggedIn) {
        navigate('/')
      } else {
        navigate('/login')
        setErrors([])
      }
    })
    .catch(err => console.log(err))
  }, [])

  const handleSubmit = async (event) => {
    event.preventDefault()

      console.log('post')
      axios.post('http://localhost:9000/login', values)
      .then(res => {
        if (res.data === 'Success') {
        navigate('/')
        } else {
        setErrors(res.data.errors)
        console.log('!!! Login error')
        }
      })
      .catch(err => {
        console.log(err)
      })
  }

  const showError = (property) => {
    const errorItems = errors?.filter(error => error.path === property)
    if (errorItems?.length) {
      return (
        errorItems.map(item => (
          // eslint-disable-next-line react/jsx-key
          <div className='text-danger'>
            {item.msg}
          </div>
        ))
      )
    }
  }

  return (
    <div className='d-flex justify-content-center align-items-center vh-100'>
      <div className='bg-white p-3 rounded w-25'>
        <form action='' onSubmit={(e) => handleSubmit(e)}>
          <div className='mb-3'>
            <label htmlFor='email'>Email</label>
            <input type="email" placeholder='Enter email' className='form-control rounded-0' name="email" onChange={handleInput}/>
            {showError('email')}
          </div>
          <div className='mb-3'>
            <label htmlFor='password'>Password</label>
            <input type="password" placeholder='Enter password' className='form-control rounded-0' name="password" onChange={handleInput} />
            {showError('password')}
          </div>
          <button type="submit" className='btn btn-success w-100'>Login</button>
        </form>
      </div>
    </div>
  )
}

export default Login