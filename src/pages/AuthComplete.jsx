// Email-link completion page. The invited user lands here after clicking the
// link in their invitation email. We finish the Firebase Auth handshake, then
// promote their pendingInvite into a real users/{uid} doc and prompt them to
// pick a password so future logins work with email+password.

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  isInviteLink, rememberedInviteEmail, completeInviteLink, setPasswordOnCurrentUser,
} from '../lib/invites'
import { promotePendingToUser } from '../lib/users'
import { defaultRouteForRole } from '../lib/roles'

export default function AuthComplete() {
  const navigate = useNavigate()
  const { isFirebaseConfigured } = useAuth()
  const [phase, setPhase] = useState('detecting') // detecting | ask-email | verifying | set-password | done | error
  const [email, setEmail] = useState(rememberedInviteEmail())
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [error, setError] = useState(null)
  const [promoted, setPromoted] = useState(null)

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setError('Firebase is not configured on this deployment.')
      setPhase('error')
      return
    }
    if (!isInviteLink()) {
      setError('This link is not a valid sign-in link. Ask your admin to re-send the invite.')
      setPhase('error')
      return
    }
    if (email) {
      void finishSignIn(email)
    } else {
      setPhase('ask-email')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFirebaseConfigured])

  const finishSignIn = async (e) => {
    setPhase('verifying')
    setError(null)
    try {
      const cred = await completeInviteLink(e, window.location.href)
      const invite = await promotePendingToUser(cred.user.uid, cred.user.email || e)
      setPromoted(invite || { email: cred.user.email || e })
      setPhase('set-password')
    } catch (err) {
      console.error('[auth-complete] sign-in failed:', err)
      setError(err.message || String(err))
      setPhase('error')
    }
  }

  const submitPassword = async (ev) => {
    ev.preventDefault()
    setError(null)
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    if (password !== password2) { setError("Passwords don't match."); return }
    try {
      await setPasswordOnCurrentUser(password)
      setPhase('done')
      setTimeout(() => {
        const route = defaultRouteForRole(promoted?.role) || '/portal'
        navigate(route, { replace: true })
      }, 1500)
    } catch (err) {
      console.error('[auth-complete] setPassword failed:', err)
      setError(err.message || String(err))
    }
  }

  return (
    <div className="min-h-screen bg-sidebar flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="text-white font-bold text-3xl">garage <span className="text-brand-light">.\</span> connect</div>
          <div className="text-sidebar-text text-xs uppercase tracking-wider mt-1">MG Fleet Portal</div>
        </div>

        <div className="bg-white rounded-lg shadow-xl p-6 space-y-4">
          {phase === 'detecting' && <div className="text-gray-600 text-sm">Checking invite link…</div>}

          {phase === 'ask-email' && (
            <>
              <h1 className="text-xl font-semibold text-gray-800">Confirm your email</h1>
              <p className="text-sm text-gray-600">
                You're one step from joining the MG Fleet Portal. Please confirm the email address where you received the invite.
              </p>
              <form onSubmit={(e) => { e.preventDefault(); finishSignIn(email) }} className="space-y-3">
                <input
                  type="email"
                  className="input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                />
                <button type="submit" className="btn-primary w-full">Continue</button>
              </form>
            </>
          )}

          {phase === 'verifying' && <div className="text-gray-600 text-sm">Signing you in…</div>}

          {phase === 'set-password' && (
            <>
              <h1 className="text-xl font-semibold text-gray-800">Welcome{promoted?.name ? `, ${promoted.name}` : ''}!</h1>
              <p className="text-sm text-gray-600">
                Create a password so you can log in again later with email + password.
              </p>
              <form onSubmit={submitPassword} className="space-y-3">
                <div>
                  <label className="label">New password</label>
                  <input type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
                </div>
                <div>
                  <label className="label">Confirm password</label>
                  <input type="password" className="input" value={password2} onChange={(e) => setPassword2(e.target.value)} required minLength={6} />
                </div>
                <button type="submit" className="btn-primary w-full">Set password & continue</button>
              </form>
            </>
          )}

          {phase === 'done' && (
            <div className="text-center text-green-700 text-sm">
              You're in. Redirecting to the portal…
            </div>
          )}

          {phase === 'error' && (
            <>
              <h1 className="text-xl font-semibold text-red-700">Couldn't complete sign-in</h1>
              <p className="text-sm text-gray-600">{error}</p>
              <button onClick={() => navigate('/login', { replace: true })} className="btn-secondary w-full">Go to sign-in</button>
            </>
          )}

          {error && phase !== 'error' && <div className="text-sm text-red-600">{error}</div>}
        </div>
      </div>
    </div>
  )
}
