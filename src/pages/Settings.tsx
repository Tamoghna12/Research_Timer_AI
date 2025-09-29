import React from 'react'
import Card, { CardContent, CardHeader } from '../components/ui/Card'
import ProfileSettings from '../components/settings/ProfileSettings'
import PrivacySettings from '../components/settings/PrivacySettings'
import DataSettings from '../components/settings/DataSettings'
import AiSettings from '../components/settings/AiSettings'
import MusicSettings from '../components/settings/MusicSettings'
import BackgroundSettings from '../components/settings/BackgroundSettings'
import OnboardingSettings from '../components/settings/OnboardingSettings'

const Settings: React.FC = () => {

  return (
    <div className="transition-all duration-300">
      {/* Hero Section */}
      <div className="text-center space-y-4 p-6 pb-8">
        <h1 className="font-display text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent drop-shadow-lg">
          Settings
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Customize your Research Timer Pro experience and manage your data
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 space-y-6">

      {/* Profile */}
      <Card>
        <CardHeader>
          <h2 className="font-display text-xl font-medium bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Profile</h2>
        </CardHeader>
        <CardContent>
          <ProfileSettings />
        </CardContent>
      </Card>

      {/* Privacy */}
      <Card>
        <CardHeader>
          <h2 className="font-display text-xl font-medium bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Privacy</h2>
        </CardHeader>
        <CardContent>
          <PrivacySettings />
        </CardContent>
      </Card>

      {/* Data */}
      <Card>
        <CardHeader>
          <h2 className="font-display text-xl font-medium bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Data</h2>
        </CardHeader>
        <CardContent>
          <DataSettings />
        </CardContent>
      </Card>

      {/* AI Features */}
      <Card>
        <CardHeader>
          <h2 className="font-display text-xl font-medium bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">AI Features</h2>
        </CardHeader>
        <CardContent>
          <AiSettings />
        </CardContent>
      </Card>

      {/* Music Preferences */}
      <Card>
        <CardHeader>
          <h2 className="font-display text-xl font-medium bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Music Preferences</h2>
        </CardHeader>
        <CardContent>
          <MusicSettings />
        </CardContent>
      </Card>

      {/* Background Preferences */}
      <Card>
        <CardHeader>
          <h2 className="font-display text-xl font-medium bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Background Preferences</h2>
        </CardHeader>
        <CardContent>
          <BackgroundSettings />
        </CardContent>
      </Card>

      {/* Onboarding */}
      <Card>
        <CardHeader>
          <h2 className="font-display text-xl font-medium bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Onboarding</h2>
        </CardHeader>
        <CardContent>
          <OnboardingSettings />
        </CardContent>
      </Card>
      </div>
    </div>
  )
}

export default Settings