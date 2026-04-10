import { ShieldOff, Mail } from 'lucide-react'

export default function SuspendedPage() {
  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6">
      <div className="bg-white border border-zinc-200 rounded-md shadow-sm w-full max-w-md px-8 py-10 text-center space-y-5">
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center">
            <ShieldOff className="w-5 h-5 text-rose-600" />
          </div>
        </div>

        <div className="space-y-1.5">
          <h1 className="text-base font-semibold text-zinc-900">Your account has been suspended</h1>
          <p className="text-sm text-zinc-500 leading-relaxed">
            Access to keySkillset has been temporarily restricted. This may be due to a policy violation or suspicious activity detected on your account.
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 text-sm text-zinc-600">
          <Mail className="w-4 h-4 text-zinc-400 shrink-0" />
          <span>
            Contact us at{' '}
            <a
              href="mailto:contact@keyskillset.com"
              className="font-medium text-blue-700 hover:underline"
            >
              contact@keyskillset.com
            </a>
          </span>
        </div>

        <p className="text-xs text-zinc-400">
          If you believe this is a mistake, please reach out and our team will review your account.
        </p>
      </div>
    </div>
  )
}
