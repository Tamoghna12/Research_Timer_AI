import React from 'react'
import Header from './Header'
import Footer from './Footer'

interface AppShellProps {
  children: React.ReactNode
}

const AppShell: React.FC<AppShellProps> = ({ children }) => {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Header />
      <main className="max-w-4xl mx-auto">
        {children}
      </main>
      <Footer />
    </div>
  )
}

export default AppShell