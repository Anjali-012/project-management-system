export type WorkspaceSection = 'dashboard' | 'projects' | 'tasks' | 'members' | 'calendar' | 'activity' | 'reports' | 'settings'

type Props = {
  activeSection: WorkspaceSection
  onNavigate: (section: WorkspaceSection) => void
}

export const Sidebar = ({
  activeSection,
  onNavigate,
}: Props) => (
  <aside className="sidebar">
    <div className="brand">
      <span className="brand-logo">⌂</span>
      <div>
        <strong>PMS</strong>
        <small>Project Management System</small>
      </div>
    </div>

    <nav className="main-nav" aria-label="Primary">
      {[
        ['dashboard', '⌂', 'Dashboard'],
        ['projects', '□', 'Projects'],
        ['tasks', '☑', 'Tasks'],
        ['members', '♙', 'Members'],
        ['calendar', '▣', 'Calendar'],
        ['activity', '◷', 'Activity'],
        ['reports', '⌁', 'Reports'],
        ['settings', '⚙', 'Settings'],
      ].map(([section, icon, label]) => (
        <button
          key={section}
          type="button"
          className={activeSection === section ? 'active' : ''}
          onClick={() => onNavigate(section as WorkspaceSection)}
        >
          <span>{icon}</span>
          {label}
        </button>
      ))}
    </nav>
  </aside>
)
