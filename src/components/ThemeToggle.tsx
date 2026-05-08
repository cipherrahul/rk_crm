'use client'

import { useState, useEffect } from 'react'
import { Moon, Sun } from 'lucide-react'

export default function ThemeToggle() {
  const [theme, setTheme] = useState('light')

  useEffect(() => {
    // Avoid synchronous setState in effect body
    const timeout = setTimeout(() => {
      const savedTheme = localStorage.getItem('theme') || 'light'
      setTheme(savedTheme)
      document.documentElement.setAttribute('data-theme', savedTheme)
    }, 0)
    return () => clearTimeout(timeout)
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    document.documentElement.setAttribute('data-theme', newTheme)
    localStorage.setItem('theme', newTheme)
  }

  return (
    <button 
      onClick={toggleTheme}
      className="btn btn-outline"
      style={{ padding: '0.5rem', borderRadius: '50%', width: '40px', height: '40px' }}
      title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
    >
      {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
    </button>
  )
}
