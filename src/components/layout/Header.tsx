import React, { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

const Header: React.FC = () => {
  const [isDark, setIsDark] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const savedTheme = localStorage.getItem('rtp-theme')
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches

    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
      setIsDark(true)
      document.documentElement.classList.add('dark')
    } else {
      setIsDark(false)
      document.documentElement.classList.remove('dark')
    }
  }, [])

  const toggleTheme = () => {
    const newTheme = !isDark
    console.log('🎨 Toggling theme. Current:', isDark, '-> New:', newTheme)
    setIsDark(newTheme)

    if (newTheme) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('rtp-theme', 'dark')
      console.log('🌙 Applied dark theme, classes:', document.documentElement.classList.toString())
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('rtp-theme', 'light')
      console.log('☀️ Applied light theme, classes:', document.documentElement.classList.toString())
    }

    // Force a repaint
    document.body.style.display = 'none'
    void document.body.offsetHeight // trigger reflow
    document.body.style.display = ''
  }

  const navItems = [
    { path: '/', label: 'Timer', icon: 'timer' },
    { path: '/timeline', label: 'Timeline', icon: 'timeline' },
    { path: '/analytics', label: 'Analytics', icon: 'analytics' },
    { path: '/report', label: 'Reports', icon: 'assessment' },
    { path: '/settings', label: 'Settings', icon: 'settings' }
  ]

  return (
    <>
      <header className="flex justify-between items-center mb-10 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-8">
          <h1 className="text-xl font-display font-semibold text-gray-800 dark:text-gray-200">
            Research Timer Pro
          </h1>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-6">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === item.path
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                <span className="material-icons text-sm">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center space-x-2">
          <button
            className="p-2 rounded-full text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            <span className="material-icons">
              {isDark ? 'light_mode' : 'dark_mode'}
            </span>
          </button>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-full text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle mobile menu"
          >
            <span className="material-icons">
              {isMobileMenuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </header>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 shadow-lg">
          <div className="px-4 py-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-display font-semibold text-gray-800 dark:text-gray-200">
                Navigation
              </h2>
              <button
                className="p-2 rounded-full text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span className="material-icons">close</span>
              </button>
            </div>

            <nav className="space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                    location.pathname === item.path
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  <span className="material-icons">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}
    </>
  )
}

export default Header