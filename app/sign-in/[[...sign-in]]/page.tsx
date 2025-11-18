import { SignIn } from '@clerk/nextjs'

export default function Page() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <SignIn
        appearance={{
          elements: {
            formButtonPrimary: 'bg-green-500 hover:bg-green-400 text-black',
            card: 'bg-gray-900 border border-gray-700',
            headerTitle: 'text-white',
            headerSubtitle: 'text-gray-400',
            socialButtonsBlockButton: 'border-gray-600 hover:bg-gray-800',
            formFieldLabel: 'text-gray-300',
            formFieldInput: 'bg-gray-800 border-gray-600 text-white',
            footerActionLink: 'text-green-400 hover:text-green-300',
          }
        }}
        signUpUrl="/sign-up"
      />
    </div>
  )
}
