import Dashboard from './components/Dashboard'
import { ThemeProvider } from './lib/ThemeProvider'
import { LanguageProvider } from './lib/LanguageContext'

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="hotel-theme">
      <LanguageProvider>
        <div className="min-h-screen bg-background transition-colors duration-300">
          <Dashboard />
        </div>
      </LanguageProvider>
    </ThemeProvider>
  )
}

export default App
