import { Briefcase, Mail, UserRound, CalendarClock } from 'lucide-react'

export default function RecruiterProfile() {
  return (
    <div>
      <div className="page-header">
        <h1>Recruiter Profile</h1>
        <p>Account information and recruiter review scope</p>
      </div>

      <div className="two-col-equal">
        <div className="card">
          <h3 className="mb-4">Profile Details</h3>
          <div className="flex items-center gap-3 mb-3">
            <UserRound size={18} />
            <div>
              <div className="text-sm text-muted">Name</div>
              <div className="font-semibold">Recruiter User</div>
            </div>
          </div>
          <div className="flex items-center gap-3 mb-3">
            <Mail size={18} />
            <div>
              <div className="text-sm text-muted">Email</div>
              <div className="font-semibold">recruiter@rubricate.ai</div>
            </div>
          </div>
          <div className="flex items-center gap-3 mb-3">
            <Briefcase size={18} />
            <div>
              <div className="text-sm text-muted">Role</div>
              <div className="font-semibold">Recruiter</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <CalendarClock size={18} />
            <div>
              <div className="text-sm text-muted">Last Login</div>
              <div className="font-semibold">Today, 10:24 AM</div>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="mb-4">Review Scope</h3>
          <ul className="strengths-list">
            <li>Review completed assessments and AI recommendations</li>
            <li>Read question-wise answers and AI feedback</li>
            <li>Override per-question scores when needed</li>
            <li>Add internal notes and finalize decisions</li>
            <li>Manually assign assessments to eligible experts</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
