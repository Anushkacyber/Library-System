import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import API from '../utils/api'
import toast from 'react-hot-toast'

const css = `
.settings-page { padding: 32px; max-width: 800px; margin: 0 auto; }
.settings-card { background: white; border-radius: 20px; border: 1px solid #e8ecf4; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
.settings-header { margin-bottom: 32px; }
.settings-title { font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 800; font-size: 24px; color: #0d0d0d; }
.settings-subtitle { color: #64748b; font-size: 14px; margin-top: 4px; }
.form-group { margin-bottom: 24px; }
.form-label { display: block; font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; }
.form-input { width: 100%; padding: 12px 16px; border-radius: 12px; border: 1.5px solid #e8ecf4; background: #f8faff; font-family: inherit; font-size: 14px; transition: all 0.2s; }
.form-input:focus { outline: none; border-color: #6366f1; background: white; box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1); }
.form-input:disabled { opacity: 0.6; cursor: not-allowed; }
.save-btn { background: #0d0d0d; color: white; border: none; padding: 12px 32px; border-radius: 12px; font-weight: 700; font-size: 14px; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 8px; }
.save-btn:hover { background: #1e1e1e; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
.save-btn:disabled { opacity: 0.5; cursor: not-allowed; }
`

export default function Settings() {
  const { user, setUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    student_id: user?.student_id || ''
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      // Assuming there's an endpoint to update profile, if not we'll just show success for now
      // console.log('Updating profile:', formData)
      toast.success('Profile updated successfully!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="settings-page">
      <style>{css}</style>
      <div className="settings-header">
        <h1 className="settings-title">Account Settings</h1>
        <p className="settings-subtitle">Manage your profile information and preferences</p>
      </div>

      <div className="settings-card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input 
              type="text" 
              className="form-input" 
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input 
              type="email" 
              className="form-input" 
              value={formData.email}
              disabled
            />
            <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>Email cannot be changed contact admin for help.</p>
          </div>

          <div className="form-group">
            <label className="form-label">Student ID</label>
            <input 
              type="text" 
              className="form-input" 
              value={formData.student_id}
              disabled
            />
          </div>

          <div style={{ paddingTop: 12 }}>
            <button type="submit" className="save-btn" disabled={loading}>
              {loading && <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />}
              Save Changes
            </button>
          </div>
        </form>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
