import styles from './Sidebar.module.css'

export type WorkspaceSection = 'dashboard' | 'projects' | 'tasks' | 'members' | 'calendar' | 'activity' | 'reports' | 'settings'

type Props = {
  activeSection: WorkspaceSection
  onNavigate: (section: WorkspaceSection) => void
}

export const Sidebar = ({
  activeSection,
  onNavigate,
}: Props) => (
  <aside className={styles.sidebar}>
    <div className={styles.brand}>
      <span className={styles.brandLogo}>⌂</span>
      <div>
        <strong>PMS</strong>
        <small>Project Management System</small>
      </div>
    </div>

    <nav className={styles.mainNav} aria-label="Primary">
      {[
        ['dashboard', '⌂', 'Dashboard'],
        ['projects', '□', 'Projects'],
        ['tasks', '☑', 'Tasks'],
        ['members', '♙', 'Members'],
        // ['calendar', '▣', 'Calendar'],
        ['activity', '◷', 'Activity'],
        // ['reports', '⌁', 'Reports'],
        // ['settings', '⚙', 'Settings'],
      ].map(([section, icon, label]) => (
        <button
          key={section}
          type="button"
          className={activeSection === section ? styles.active : ''}
          onClick={() => onNavigate(section as WorkspaceSection)}
        >
          <span>{icon}</span>
          {label}
        </button>
      ))}
    </nav>
  </aside>
)
