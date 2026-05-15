import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { ThemeProvider } from '@/contexts/ThemeContext'
import { AppLayout } from '@/layouts/AppLayout'
import { ChatPage } from '@/pages/ChatPage'
import { LandingPage } from '@/pages/LandingPage'
import { OnboardingPage } from '@/pages/OnboardingPage'
import { ResultsPage } from '@/pages/ResultsPage'

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route path="/session/:sessionId/chat" element={<ChatPage />} />
            <Route path="/session/:sessionId/results" element={<ResultsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}
