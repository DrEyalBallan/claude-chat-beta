'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLogin, setIsLogin] = useState(true)
  const [message, setMessage] = useState('')
  const router = useRouter()

const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const endpoint = isLogin ? '/api/login' : '/api/register'
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        localStorage.setItem('token', data.token)
        router.push('/chat')
      } else {
        setMessage(data.error)
      }
    } catch (error) {
      setMessage('Something went wrong')
    }
  }

  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: '0 auto' }}>
      <h1>{isLogin ? 'Login' : 'Sign Up'}</h1>
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '10px' }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: '10px' }}
          />
        </div>
        
        <div style={{ marginBottom: '10px' }}>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '10px' }}
          />
        </div>
        
        <button type="submit" style={{ width: '100%', padding: '10px', backgroundColor: '#007cba', color: 'white' }}>
          {isLogin ? 'Login' : 'Sign Up'}
        </button>
      </form>
      
      <p style={{ textAlign: 'center', marginTop: '10px' }}>
        {isLogin ? "Don't have an account? " : "Already have an account? "}
        <button 
          onClick={() => setIsLogin(!isLogin)}
          style={{ background: 'none', border: 'none', color: '#007cba', textDecoration: 'underline', cursor: 'pointer' }}
        >
          {isLogin ? 'Sign up' : 'Login'}
        </button>
      </p>
      
      {message && <p style={{ color: 'red', textAlign: 'center' }}>{message}</p>}
    </div>
  )
}
