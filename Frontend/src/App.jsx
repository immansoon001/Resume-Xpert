import { RouterProvider } from "react-router"
import { router } from "./app.routes.jsx"
import { AuthProvider } from "./features/auth/auth.context.jsx"
import { InterviewProvider } from "./features/interview/interview.context.jsx"
import { ClerkProvider } from "@clerk/clerk-react"
import { dark } from "@clerk/themes"
import ClerkSyncManager from "./features/auth/components/ClerkSyncManager.jsx"

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
const isClerkEnabled = Boolean(CLERK_PUBLISHABLE_KEY && CLERK_PUBLISHABLE_KEY.startsWith("pk_"))

function AppContent() {
  return (
    <AuthProvider isClerkEnabled={isClerkEnabled}>
      {isClerkEnabled && <ClerkSyncManager />}
      <InterviewProvider>
        <RouterProvider router={router} />
      </InterviewProvider>
    </AuthProvider>
  )
}

function App() {
  if (isClerkEnabled) {
    return (
      <ClerkProvider
        publishableKey={CLERK_PUBLISHABLE_KEY}
        afterSignOutUrl="/"
        appearance={{
          baseTheme: dark,
          variables: {
            colorPrimary: '#00e573',
            colorBackground: '#18191d',
            colorInputBackground: '#121316',
            colorInputText: '#ffffff',
            colorText: '#f8fafc',
            borderRadius: '0.75rem',
          },
          elements: {
            card: {
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.45)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }
          }
        }}
      >
        <AppContent />
      </ClerkProvider>
    )
  }

  return <AppContent />
}

export default App