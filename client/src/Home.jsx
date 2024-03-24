import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const CHUNK_SIZE = 10 * 1024

function Home() {
  const [name, setName] = useState()
  const [values, setValues] = useState({
    nickname: '',
    age: '',
    patronus: ''
  })
  const [errors, setErrors] = useState([])
  const navigate = useNavigate()

  // Upload file
  const [dropzoneActive, setDropzoneActive] = useState(false)
  const [files, setFiles] = useState([])
  const [currentFileIndex, setCurrentFileIndex] = useState(null)
  const [lastUploadedFileIndex, setLastUploadedFileIndex] = useState(null)
  const [currentChunkIndex, setCurrentChunkIndex] = useState(null)

  axios.defaults.withCredentials = true

  useEffect(() => {
    axios.get('http://localhost:9000')
    .then(res => {
      if (res.data.valid) {
        setName(res.data.username)
      } else {
        navigate('/login')
      }
    })
    .catch(err => console.log(err))
  }, [])

  function logout() {
    axios.get('http://localhost:9000/logout')
      .then(res => {
        if (res.status === 200) {
          navigate('/login')
        }
      })
      .catch(err => console.log(err))
  }

  const handleInput = (event) => {
    setValues(prev => ({...prev, [event.target.name]: event.target.value}))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    axios.post('http://localhost:9000/send_form', values)
    .then(res => {
      if (res.data === 'Success') {
        alert('Form is sended succesfully')
        setValues({'nickname': '',
        'age': '',
        patronus: ''})
        setErrors([])
      } else {
      setErrors(res.data.errors)
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
          <span className='text-danger'>
          {item.msg}, 
        </span>
        ))
      )
    }
  }

  function handleDrop(e) {
    e.preventDefault()
    setFiles([...files, ...e.dataTransfer.files])
  }

  function readAndUploadCurrentChunk() {
    const reader = new FileReader()
    const file = files[currentFileIndex]
    if (!file) {
      return
    }

    const from = currentChunkIndex * CHUNK_SIZE
    const to = from + CHUNK_SIZE
    const blob = file.slice(from, to)
    reader.readAsDataURL(blob)
    reader.onload = e => uploadChunk(e)
    reader.onerror = () => console.log('error while loading file')
  }

  function uploadChunk(readerEvent) {
    const file = files[currentFileIndex]
    const data = readerEvent.target.result
    const params = new URLSearchParams()

    params.set('name', file.name)
    params.set('size', file.size)
    params.set('currentChunkIndex', currentChunkIndex)
    params.set('totalChunks', Math.ceil(file.size / CHUNK_SIZE))

    const headers = {'Content-Type': 'application/octet-stream'}
    const url = 'http://localhost:9000/upload?' + params.toString()

    axios.post(url, data, {headers})
      .then(response => {
        const file = files[currentFileIndex]
        const filesize = files[currentFileIndex].size
        const chunks = Math.ceil(filesize / CHUNK_SIZE) - 1
        const isLastChunk = currentChunkIndex === chunks
        if (isLastChunk) {
          file.finalFilename = response.data.finalFilename
          setLastUploadedFileIndex(currentFileIndex)
          setCurrentChunkIndex(null)
        } else {
          setCurrentChunkIndex(currentChunkIndex + 1)
        }
      })
  }

  useEffect(() => {
    if (lastUploadedFileIndex === null) {
      return
    }
    const isLastFile = lastUploadedFileIndex === files.length - 1
    const nextFileIndex = isLastFile ? null : currentFileIndex + 1
    setCurrentFileIndex(nextFileIndex)
  }, [lastUploadedFileIndex])

  useEffect(() => {
    if (files.length > 0) {
      if (currentFileIndex === null) {
        setCurrentFileIndex(
          lastUploadedFileIndex === null ? 0 : lastUploadedFileIndex + 1
        )
      }
    }
  }, [files.length])

  useEffect(() => {
    if (currentFileIndex !== null) {
      setCurrentChunkIndex(0)
    }
  }, [currentFileIndex])

  useEffect(() => {
    if (currentChunkIndex !== null) {
      readAndUploadCurrentChunk()
    }
  }, [currentChunkIndex])


  return (
    <div className='vh-100'>
      <div style={{ textAlign: 'right', padding: '10px'}}>
        <span className='btn btn-info w-150' onClick={logout}>Logout</span>
      </div>
      <h1 style={{textAlign: 'center', paddingTop: '10px'}}>Welcome, {name}</h1>
      <div style={{margin: '0 auto'}} className='bg-white p-3 rounded w-25'>
        <h3>
          Please fill the form
        </h3>
        <form action='' onSubmit={(e) => handleSubmit(e)}>
          <div className='mb-3'>
            <label htmlFor='nickname'>Nickname</label>
            <input type='text' value={values.nickname} placeholder='Enter nickname' className='form-control rounded-0' name="nickname" onChange={handleInput} />
            {showError('nickname')}
          </div>
          <div className='mb-3'>
            <label htmlFor='age'>Age</label>
            <input type='number' value={values.age}  placeholder='Enter nickname' className='form-control rounded-0' name="age" onChange={handleInput}/>
            {showError('age')}
          </div>
          <div className='mb-3'>
            <label htmlFor='patronus'>Patronus</label>
            <input type='' value={values.patronus}  placeholder='Enter patronus' className='form-control rounded-0' name="patronus" onChange={handleInput}/>
            {showError('patronus')}
          </div>
          <button type="submit" className='btn btn-success w-100'>Send</button>
        </form>
      </div>

      <h2 style={{textAlign: 'center', paddingTop: '10px'}}>Please upload your personal data</h2>

      <div
        onDragOver={e => {setDropzoneActive(true); e.preventDefault()}}
        onDragLeave={e => {setDropzoneActive(false); e.preventDefault()}}
        onDrop={e => handleDrop(e)}
        className={"dropzone" + (dropzoneActive ? " active" : "")}>
        Drop your files here
      </div>
      <div className="files">
        {files.map((file,fileIndex) => {
          let progress = 0
          if (file.finalFilename) {
            progress = 100
          } else {
            const uploading = fileIndex === currentFileIndex
            const chunks = Math.ceil(file.size / CHUNK_SIZE)
            if (uploading) {
              progress = Math.round(currentChunkIndex / chunks * 100)
            } else {
              progress = 0
            }
          }
          return (
            <a className="file" target="_blank" href={ 'http://localhost:9000/uploads/' + file.finalFilename} rel="noreferrer">
              <div className="name">{file.name}</div>
              <div className={"progress " + (progress === 100 ? 'done' : '')} style={{width:progress+'%'}}>{progress}%</div>
            </a>
          )
        })}
      </div>
    </div>
  )
}

export default Home