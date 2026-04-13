import { useState } from 'react'
import { RouterProvider } from 'react-router'
import { PwaUpdatePrompt } from './components/shared/PwaUpdatePrompt'
import { SplashScreen } from './components/shared/SplashScreen'
import { router } from './routes'

function App() {
  const [showSplash, setShowSplash] = useState(true)

  return (
    <>
      {showSplash && <SplashScreen onDone={() => setShowSplash(false)} />}
      <RouterProvider router={router} />
      <PwaUpdatePrompt />
    </>
  )
}

export default App
