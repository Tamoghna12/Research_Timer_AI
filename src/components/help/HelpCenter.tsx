import React, { useState } from 'react';
import Card, { CardContent, CardHeader } from '../ui/Card';

interface HelpSection {
  id: string;
  title: string;
  icon: string;
  content: React.ReactNode;
}

const HelpCenter: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string>('getting-started');

  const helpSections: HelpSection[] = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: 'play_circle',
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">Welcome to Research Timer Pro! 🎯</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              A sophisticated productivity timer designed specifically for researchers, academics, and deep work enthusiasts.
            </p>
          </div>

          <div>
            <h4 className="font-medium mb-2">Quick Start (2 minutes):</h4>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Choose a research mode (Literature Review, Analysis, Writing, Deep Work, or Break)</li>
              <li>Set your session goal - be specific about what you want to accomplish</li>
              <li>Add relevant tags like <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">#thesis</code> or <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">#data-analysis</code></li>
              <li>Click Start and begin your focused work session</li>
              <li>Review your progress in Analytics after completing sessions</li>
            </ol>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h4 className="font-medium mb-2 text-blue-800 dark:text-blue-200">💡 Pro Tip</h4>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Start with the Literature Review mode (25 min) if you're new to focused work sessions.
              It's the perfect duration to build the habit without feeling overwhelming.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'research-modes',
      title: 'Research Modes',
      icon: 'schedule',
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">Choose the Right Mode for Your Work</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Each mode is optimized for different types of research activities based on productivity research.
            </p>
          </div>

          <div className="grid gap-4">
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <span className="material-icons text-blue-600 mr-2">book</span>
                <h4 className="font-medium">Literature Review (25 min)</h4>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Perfect for reading papers, taking notes, and processing information.
              </p>
              <div className="text-xs text-gray-500">
                <strong>Best for:</strong> Reading papers, note-taking, research planning
              </div>
            </div>

            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <span className="material-icons text-green-600 mr-2">analytics</span>
                <h4 className="font-medium">Analysis (45 min)</h4>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Ideal for data analysis, coding, and problem-solving tasks.
              </p>
              <div className="text-xs text-gray-500">
                <strong>Best for:</strong> Data analysis, coding, statistical work, complex calculations
              </div>
            </div>

            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <span className="material-icons text-purple-600 mr-2">edit</span>
                <h4 className="font-medium">Writing (30 min)</h4>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Optimized for drafting papers, reports, and documentation.
              </p>
              <div className="text-xs text-gray-500">
                <strong>Best for:</strong> Writing papers, drafting reports, editing documents
              </div>
            </div>

            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <span className="material-icons text-orange-600 mr-2">psychology</span>
                <h4 className="font-medium">Deep Work (90 min)</h4>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Extended sessions for complex thinking and intensive research.
              </p>
              <div className="text-xs text-gray-500">
                <strong>Best for:</strong> Complex problem-solving, research planning, thesis work
              </div>
            </div>

            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <span className="material-icons text-red-600 mr-2">free_breakfast</span>
                <h4 className="font-medium">Break (15 min)</h4>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Structured breaks to recharge between focus sessions.
              </p>
              <div className="text-xs text-gray-500">
                <strong>Best for:</strong> Mental rest, light exercise, quick meals
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'ai-setup',
      title: 'AI Features Setup',
      icon: 'smart_toy',
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">Unlock AI-Powered Session Summaries ✨</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Transform your session notes into actionable insights with AI-generated summaries. All processing is secure and your API keys stay local.
            </p>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <h4 className="font-medium mb-2 text-green-800 dark:text-green-200">🔒 Privacy First</h4>
            <p className="text-sm text-green-700 dark:text-green-300">
              Your API keys are stored only in your browser. No data is sent to our servers.
              Only your session notes/goals are sent to the AI service you choose.
            </p>
          </div>

          <div>
            <h4 className="font-medium mb-3">Choose Your AI Provider:</h4>

            <div className="space-y-4">
              <div className="border-l-4 border-blue-500 pl-4">
                <h5 className="font-medium text-blue-800 dark:text-blue-200">OpenAI (Recommended)</h5>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  High-quality summaries with GPT-4 or GPT-3.5. Cost: ~$0.01-0.05 per summary.
                </p>
                <ol className="list-decimal list-inside text-sm space-y-1">
                  <li>Visit <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">OpenAI API Keys</a></li>
                  <li>Create account or sign in</li>
                  <li>Click "Create new secret key" and copy it</li>
                  <li>Go to Settings → AI Features → paste your API key</li>
                  <li>Click "Test Connection" to verify</li>
                </ol>
              </div>

              <div className="border-l-4 border-purple-500 pl-4">
                <h5 className="font-medium text-purple-800 dark:text-purple-200">Anthropic (Claude)</h5>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Excellent alternative with Claude models. Great for detailed analysis.
                </p>
                <ol className="list-decimal list-inside text-sm space-y-1">
                  <li>Visit <a href="https://console.anthropic.com/" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">Anthropic Console</a></li>
                  <li>Sign up for API access</li>
                  <li>Generate new API key in console</li>
                  <li>Settings → AI Features → select Anthropic → add key</li>
                </ol>
              </div>

              <div className="border-l-4 border-red-500 pl-4">
                <h5 className="font-medium text-red-800 dark:text-red-200">Google Gemini</h5>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Free tier available. Good for basic summaries.
                </p>
                <ol className="list-decimal list-inside text-sm space-y-1">
                  <li>Visit <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-red-600 hover:underline">Google AI Studio</a></li>
                  <li>Sign in with Google account</li>
                  <li>Generate API key</li>
                  <li>Settings → AI Features → select Google Gemini → add key</li>
                </ol>
              </div>

              <div className="border-l-4 border-orange-500 pl-4">
                <h5 className="font-medium text-orange-800 dark:text-orange-200">Groq</h5>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Ultra-fast inference with open-source models.
                </p>
                <ol className="list-decimal list-inside text-sm space-y-1">
                  <li>Visit <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:underline">Groq Console</a></li>
                  <li>Sign up for API access</li>
                  <li>Create new API key</li>
                  <li>Settings → AI Features → select Groq → add key</li>
                </ol>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
            <h4 className="font-medium mb-2 text-yellow-800 dark:text-yellow-200">💰 Cost Information</h4>
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              AI features are very affordable. Most sessions cost $0.01-0.05 per summary.
              You only pay for what you use, and you can disable AI anytime.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'music-setup',
      title: 'Focus Music',
      icon: 'music_note',
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">Enhance Focus with Background Music 🎵</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Add YouTube videos, Spotify tracks, or local audio files to maintain concentration during work sessions.
            </p>
          </div>

          <div>
            <h4 className="font-medium mb-3">Getting Started:</h4>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Click "Enable Music" on the home page (appears when music is disabled)</li>
              <li>Choose your preferred music source from the tabs</li>
              <li>Configure your audio and adjust volume settings</li>
              <li>Music preferences are saved automatically</li>
            </ol>
          </div>

          <div>
            <h4 className="font-medium mb-3">Music Sources:</h4>

            <div className="space-y-4">
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <span className="material-icons text-red-600 mr-2">play_circle</span>
                  <h5 className="font-medium">YouTube</h5>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Paste any YouTube video URL for background music with embedded player.
                </p>
                <div className="text-xs text-gray-500">
                  <strong>Best for:</strong> Focus playlists, nature sounds, lo-fi music, ambient tracks
                </div>
              </div>

              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <span className="material-icons text-green-600 mr-2">library_music</span>
                  <h5 className="font-medium">Spotify</h5>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Add playlists and tracks with embedded Spotify player.
                </p>
                <div className="text-xs text-gray-500">
                  <strong>Note:</strong> Requires Spotify Premium for full playback features
                </div>
              </div>

              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <span className="material-icons text-blue-600 mr-2">upload_file</span>
                  <h5 className="font-medium">Local Files</h5>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Upload your own audio files for offline listening with full playback controls.
                </p>
                <div className="text-xs text-gray-500">
                  <strong>Supports:</strong> MP3, WAV, OGG, M4A, and other common audio formats
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h4 className="font-medium mb-2 text-blue-800 dark:text-blue-200">🎧 Music Recommendations</h4>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li>• <strong>Literature Review:</strong> Classical music or ambient soundscapes</li>
              <li>• <strong>Analysis/Coding:</strong> Lo-fi hip hop or instrumental electronic</li>
              <li>• <strong>Writing:</strong> Nature sounds or minimal ambient music</li>
              <li>• <strong>Deep Work:</strong> Binaural beats or focus-specific playlists</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'analytics',
      title: 'Analytics & Reports',
      icon: 'analytics',
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">Track Your Research Progress 📊</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Gain insights into your productivity patterns and research progress with comprehensive analytics.
            </p>
          </div>

          <div>
            <h4 className="font-medium mb-3">Analytics Dashboard Features:</h4>

            <div className="space-y-4">
              <div className="border-l-4 border-blue-500 pl-4">
                <h5 className="font-medium">Focus Time Tracking</h5>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  See exactly how much time you spend on deep work with detailed breakdowns by day, week, and month.
                </p>
              </div>

              <div className="border-l-4 border-green-500 pl-4">
                <h5 className="font-medium">Productivity Heatmap</h5>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Visualize your productivity patterns over time to identify your most productive days and times.
                </p>
              </div>

              <div className="border-l-4 border-purple-500 pl-4">
                <h5 className="font-medium">Session Distribution</h5>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Understand how your time is distributed across different research modes and topics.
                </p>
              </div>

              <div className="border-l-4 border-orange-500 pl-4">
                <h5 className="font-medium">Streak Tracking</h5>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Monitor consecutive days of focused work to build and maintain productive habits.
                </p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-3">Weekly Reports:</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Generate professional reports perfect for advisor meetings or personal review:
            </p>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li>Summary of focus time and sessions completed</li>
              <li>Highlighted sessions with key accomplishments</li>
              <li>Next week planning with extracted TODO items</li>
              <li>Export as PDF, Markdown, or print-friendly format</li>
              <li>Session appendix with detailed logs</li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium mb-3">Data Export Options:</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                <h6 className="font-medium text-sm">CSV Export</h6>
                <p className="text-xs text-gray-600 dark:text-gray-400">Raw session data for external analysis</p>
              </div>
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                <h6 className="font-medium text-sm">Markdown Export</h6>
                <p className="text-xs text-gray-600 dark:text-gray-400">Session logs in markdown format</p>
              </div>
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                <h6 className="font-medium text-sm">JSON Backup</h6>
                <p className="text-xs text-gray-600 dark:text-gray-400">Complete data backup for import/restore</p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <h4 className="font-medium mb-2 text-green-800 dark:text-green-200">📈 Pro Tips for Better Analytics</h4>
            <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
              <li>• Use consistent tags to track projects and research areas</li>
              <li>• Set specific, measurable goals for each session</li>
              <li>• Review weekly reports to identify productivity patterns</li>
              <li>• Export data regularly for backup and external analysis</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'productivity-tips',
      title: 'Productivity Tips',
      icon: 'lightbulb',
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">Maximize Your Research Productivity 🚀</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Research-backed strategies and tips to get the most out of your focused work sessions.
            </p>
          </div>

          <div>
            <h4 className="font-medium mb-3">🎯 Session Planning</h4>
            <div className="space-y-3">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                <p className="text-sm"><strong>Set Specific Goals:</strong> Instead of "work on thesis," try "outline introduction section" or "analyze survey responses for Q1-Q5."</p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                <p className="text-sm"><strong>Use Consistent Tags:</strong> Develop a tagging system like <code className="bg-white dark:bg-gray-800 px-1 rounded">#thesis-ch1</code>, <code className="bg-white dark:bg-gray-800 px-1 rounded">#data-analysis</code>, <code className="bg-white dark:bg-gray-800 px-1 rounded">#literature-review</code></p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                <p className="text-sm"><strong>Prepare Resources:</strong> Gather all papers, data files, and tools before starting your timer.</p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-3">📚 By Research Activity</h4>

            <div className="space-y-4">
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h5 className="font-medium mb-2">Literature Reviews</h5>
                <ul className="text-sm space-y-1">
                  <li>• Use 25-minute sessions to maintain focus on dense material</li>
                  <li>• Take notes directly in session notes for AI summarization</li>
                  <li>• Include paper URLs in the links field for easy reference</li>
                  <li>• Tag papers by methodology, topic, or relevance level</li>
                </ul>
              </div>

              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h5 className="font-medium mb-2">Data Analysis</h5>
                <ul className="text-sm space-y-1">
                  <li>• Use 45-minute sessions for complex statistical work</li>
                  <li>• Document methodology and assumptions in session notes</li>
                  <li>• Include dataset and notebook links for reproducibility</li>
                  <li>• Take breaks between analysis sessions to avoid errors</li>
                </ul>
              </div>

              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h5 className="font-medium mb-2">Academic Writing</h5>
                <ul className="text-sm space-y-1">
                  <li>• Use 30-minute writing sessions to maintain flow state</li>
                  <li>• Track word count progress in session notes</li>
                  <li>• Focus on one section or argument per session</li>
                  <li>• Use AI summaries to track writing accomplishments</li>
                </ul>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-3">⚡ Advanced Techniques</h4>
            <div className="grid gap-3">
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
                <p className="text-sm"><strong>Time Blocking:</strong> Schedule specific research activities for your most productive hours.</p>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                <p className="text-sm"><strong>Distraction Management:</strong> Use floating timer window and focus music to minimize interruptions.</p>
              </div>
              <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-lg">
                <p className="text-sm"><strong>Regular Reviews:</strong> Check weekly reports to identify patterns and adjust your workflow.</p>
              </div>
              <div className="bg-pink-50 dark:bg-pink-900/20 p-3 rounded-lg">
                <p className="text-sm"><strong>Goal Refinement:</strong> Use session outcomes to refine future session goals and estimates.</p>
              </div>
            </div>
          </div>

          <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
            <h4 className="font-medium mb-2 text-orange-800 dark:text-orange-200">🔬 Research-Backed Benefits</h4>
            <ul className="text-sm text-orange-700 dark:text-orange-300 space-y-1">
              <li>• <strong>Improved Focus:</strong> Structured time blocks reduce task-switching costs</li>
              <li>• <strong>Better Estimates:</strong> Tracking actual vs. planned time improves planning</li>
              <li>• <strong>Reduced Procrastination:</strong> Clear goals and time limits overcome analysis paralysis</li>
              <li>• <strong>Enhanced Memory:</strong> Regular breaks and note-taking improve retention</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'keyboard-shortcuts',
      title: 'Keyboard Shortcuts',
      icon: 'keyboard',
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">Keyboard Shortcuts ⌨️</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Work faster with keyboard shortcuts for common actions and navigation.
            </p>
          </div>

          <div className="grid gap-6">
            <div>
              <h4 className="font-medium mb-3">Timer Controls</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center py-2 px-3 bg-gray-50 dark:bg-gray-800 rounded">
                  <span className="text-sm">Start/Pause Timer</span>
                  <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">Space</kbd>
                </div>
                <div className="flex justify-between items-center py-2 px-3 bg-gray-50 dark:bg-gray-800 rounded">
                  <span className="text-sm">Reset Timer</span>
                  <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">R</kbd>
                </div>
                <div className="flex justify-between items-center py-2 px-3 bg-gray-50 dark:bg-gray-800 rounded">
                  <span className="text-sm">Toggle Floating Window</span>
                  <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">F</kbd>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3">Navigation</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center py-2 px-3 bg-gray-50 dark:bg-gray-800 rounded">
                  <span className="text-sm">Open Settings</span>
                  <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">S</kbd>
                </div>
                <div className="flex justify-between items-center py-2 px-3 bg-gray-50 dark:bg-gray-800 rounded">
                  <span className="text-sm">View Analytics</span>
                  <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">A</kbd>
                </div>
                <div className="flex justify-between items-center py-2 px-3 bg-gray-50 dark:bg-gray-800 rounded">
                  <span className="text-sm">View Timeline</span>
                  <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">T</kbd>
                </div>
                <div className="flex justify-between items-center py-2 px-3 bg-gray-50 dark:bg-gray-800 rounded">
                  <span className="text-sm">Weekly Report</span>
                  <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">W</kbd>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3">Session Management</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center py-2 px-3 bg-gray-50 dark:bg-gray-800 rounded">
                  <span className="text-sm">Add Session Notes</span>
                  <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">N</kbd>
                </div>
                <div className="flex justify-between items-center py-2 px-3 bg-gray-50 dark:bg-gray-800 rounded">
                  <span className="text-sm">Focus Goal Input</span>
                  <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">G</kbd>
                </div>
                <div className="flex justify-between items-center py-2 px-3 bg-gray-50 dark:bg-gray-800 rounded">
                  <span className="text-sm">Add Tags</span>
                  <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">#</kbd>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3">General</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center py-2 px-3 bg-gray-50 dark:bg-gray-800 rounded">
                  <span className="text-sm">Toggle Theme</span>
                  <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">Ctrl/Cmd + D</kbd>
                </div>
                <div className="flex justify-between items-center py-2 px-3 bg-gray-50 dark:bg-gray-800 rounded">
                  <span className="text-sm">Help Center</span>
                  <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">?</kbd>
                </div>
                <div className="flex justify-between items-center py-2 px-3 bg-gray-50 dark:bg-gray-800 rounded">
                  <span className="text-sm">Search/Command Palette</span>
                  <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">Ctrl/Cmd + K</kbd>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h4 className="font-medium mb-2 text-blue-800 dark:text-blue-200">💡 Pro Tip</h4>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Keyboard shortcuts work from any page in the app. Use <kbd className="px-1 bg-white dark:bg-gray-800 rounded text-xs">Space</kbd> to quickly start/pause your timer without switching tabs.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'troubleshooting',
      title: 'Troubleshooting',
      icon: 'help',
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">Common Issues & Solutions 🔧</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Quick fixes for common problems and questions.
            </p>
          </div>

          <div className="space-y-4">
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h4 className="font-medium mb-2">Timer Not Starting</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                If the timer doesn't respond to the start button:
              </p>
              <ul className="text-sm space-y-1 list-disc list-inside">
                <li>Check if browser tab is active (inactive tabs may pause timers)</li>
                <li>Ensure JavaScript is enabled in your browser</li>
                <li>Try refreshing the page (Ctrl/Cmd + R)</li>
                <li>Clear browser cache if the problem persists</li>
              </ul>
            </div>

            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h4 className="font-medium mb-2">AI Features Not Working</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                If AI summaries aren't generating:
              </p>
              <ul className="text-sm space-y-1 list-disc list-inside">
                <li>Verify your API key is entered correctly in Settings → AI Features</li>
                <li>Click "Test Connection" to check API connectivity</li>
                <li>Ensure you have API credits available with your provider</li>
                <li>Check that AI features are enabled for your account</li>
                <li>Try a different AI provider if one isn't working</li>
              </ul>
            </div>

            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h4 className="font-medium mb-2">Music Not Playing</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                If focus music isn't working:
              </p>
              <ul className="text-sm space-y-1 list-disc list-inside">
                <li>Ensure music is enabled by clicking "Enable Music" if you see it</li>
                <li>Check volume settings in both the app and your system</li>
                <li>For YouTube: Verify the video URL is correct and publicly accessible</li>
                <li>For Spotify: Ensure you have Premium for full playback features</li>
                <li>For local files: Check that the audio format is supported (MP3, WAV, etc.)</li>
              </ul>
            </div>

            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h4 className="font-medium mb-2">Data Not Saving</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                If your sessions or settings aren't persisting:
              </p>
              <ul className="text-sm space-y-1 list-disc list-inside">
                <li>Check if you're in private/incognito browsing mode</li>
                <li>Ensure your browser allows local storage for this site</li>
                <li>Clear browser data and restart if storage is corrupted</li>
                <li>Export your data regularly as backup (Settings → Data)</li>
              </ul>
            </div>

            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h4 className="font-medium mb-2">Performance Issues</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                If the app is running slowly:
              </p>
              <ul className="text-sm space-y-1 list-disc list-inside">
                <li>Close unnecessary browser tabs and applications</li>
                <li>Use Chrome or Firefox for best performance</li>
                <li>Disable browser extensions that might interfere</li>
                <li>Restart your browser if memory usage is high</li>
                <li>Consider using the floating window for minimal resource usage</li>
              </ul>
            </div>

            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h4 className="font-medium mb-2">Mobile Issues</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                For mobile device problems:
              </p>
              <ul className="text-sm space-y-1 list-disc list-inside">
                <li>Use landscape orientation for better layout on small screens</li>
                <li>Enable "Desktop Site" mode for full feature access</li>
                <li>Ensure your mobile browser supports modern web features</li>
                <li>Keep the browser tab active to prevent timer pausing</li>
              </ul>
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <h4 className="font-medium mb-2 text-green-800 dark:text-green-200">🆘 Still Need Help?</h4>
            <p className="text-sm text-green-700 dark:text-green-300 mb-2">
              If you're still experiencing issues:
            </p>
            <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
              <li>• Check the <a href="https://github.com/Tamoghna12/Research_Timer_AI/issues" target="_blank" rel="noopener noreferrer" className="underline">GitHub Issues</a> page for known problems</li>
              <li>• Report new bugs with detailed steps to reproduce</li>
              <li>• Include browser version and operating system information</li>
              <li>• Export your data before trying major troubleshooting steps</li>
            </ul>
          </div>
        </div>
      )
    }
  ];

  const activeHelpSection = helpSections.find(section => section.id === activeSection);

  return (
    <div className="transition-all duration-300">
      {/* Hero Section */}
      <div className="text-center space-y-4 p-6 pb-8">
        <h1 className="font-display text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent drop-shadow-lg">
          Help Center
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Everything you need to know about Research Timer Pro
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <h2 className="font-medium text-gray-800 dark:text-gray-200">Topics</h2>
              </CardHeader>
              <CardContent className="p-0">
                <nav className="space-y-1">
                  {helpSections.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full text-left px-4 py-3 flex items-center space-x-3 text-sm transition-colors ${
                        activeSection === section.id
                          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-r-2 border-blue-600'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      <span className="material-icons text-lg">{section.icon}</span>
                      <span>{section.title}</span>
                    </button>
                  ))}
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <span className="material-icons text-2xl text-blue-600">
                    {activeHelpSection?.icon}
                  </span>
                  <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
                    {activeHelpSection?.title}
                  </h2>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose dark:prose-invert max-w-none">
                  {activeHelpSection?.content}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpCenter;