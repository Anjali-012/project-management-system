import { useState } from 'react'
import { useAuth } from './hooks/useAuth'
import { useToast } from './hooks/useToast'
import { useWorkspace } from './hooks/useWorkspace'

import { AuthScreen } from './components/AuthScreen'
import { CommentPanel } from './components/CommentPanel'
import { DashboardOverview } from './components/DashboardOverview'
import { EditTaskModal } from './components/EditTaskModal'
import { Sidebar, type WorkspaceSection } from './components/Sidebar'
import { ToastMessage } from './components/ToastMessage'
import { Topbar } from './components/Topbar'
import { ActivityPage, MembersPage, PlaceholderPage, ProjectsPage, TasksPage } from './components/WorkspacePages'

import './App.css'

function App() {
  const { toast, showToast } = useToast()
  const [activeSection, setActiveSection] = useState<WorkspaceSection>('dashboard')

  const {
    auth, authMode, setAuthMode, authForm, setAuthForm,
    showPassword, setShowPassword, loading: authLoading, handleAuth, logout: logoutAuth,
  } = useAuth(showToast)

  const workspace = useWorkspace(auth, showToast)

  if (!auth) {
    return (
      <>
        <AuthScreen
          authMode={authMode} setAuthMode={setAuthMode}
          authForm={authForm} setAuthForm={setAuthForm}
          showPassword={showPassword} setShowPassword={setShowPassword}
          loading={authLoading} onSubmit={handleAuth}
        />
        {toast && <ToastMessage toast={toast} />}
      </>
    )
  }

  const handleLogout = () => { workspace.logout(); logoutAuth() }
  const focusTaskComposer = () => {
    setActiveSection('tasks')
    window.setTimeout(() => {
      document.querySelector<HTMLInputElement>('.task-composer input[name="task-title"]')?.focus()
    }, 0)
  }
  const openMembers = () => setActiveSection('members')

  return (
    <main className="app-shell">
      <Sidebar
        activeSection={activeSection}
        onNavigate={setActiveSection}
      />

      <section className="workspace">
        <Topbar
          auth={auth}
          realtimeStatus={workspace.realtimeStatus}
          notifications={workspace.notifications}
          filters={workspace.filters}
          onFiltersChange={workspace.setFilters}
          onLogout={handleLogout}
        />

        <div className="workspace-scroll">
          {workspace.loading && <p className="empty">Loading workspace...</p>}

          {activeSection === 'dashboard' && (
            <DashboardOverview
              userName={auth.user.name}
              selectedProject={workspace.selectedProject}
              tasks={workspace.tasks}
              members={workspace.selectedProjectMembersRaw}
              activities={workspace.activities}
              notifications={workspace.notifications}
              onOpenTasks={focusTaskComposer}
              onOpenMembers={openMembers}
            />
          )}

          {activeSection === 'projects' && (
            <ProjectsPage
              projects={workspace.projects}
              selectedProjectId={workspace.selectedProjectId}
              projectForm={workspace.projectForm}
              setProjectForm={workspace.setProjectForm}
              onCreateProject={workspace.createProject}
              onSelectProject={workspace.setSelectedProjectId}
            />
          )}

          {activeSection === 'tasks' && (
            <TasksPage
              projects={workspace.projects}
              selectedProjectId={workspace.selectedProjectId}
              selectedProject={workspace.selectedProject}
              onSelectProject={workspace.setSelectedProjectId}
              taskForm={workspace.taskForm}
              setTaskForm={workspace.setTaskForm}
              members={workspace.selectedProjectMembersRaw}
              onCreateTask={workspace.createTask}
              filters={workspace.filters}
              onFiltersChange={workspace.setFilters}
              tasksByStatus={workspace.tasksByStatus}
              currentUserId={auth.user.id}
              isAdmin={auth.user.role === 'admin'}
              onDragStart={workspace.setDraggedTaskId}
              onDrop={workspace.handleDrop}
              onAssign={workspace.assignTaskMember}
              onStatusChange={workspace.updateTaskStatus}
              onEdit={workspace.openTaskEdit}
              onDelete={workspace.deleteTask}
              onOpenComments={workspace.setCommentTask}
            />
          )}

          {activeSection === 'members' && (
            <MembersPage
              selectedProject={workspace.selectedProject}
              members={workspace.selectedProjectMembersRaw}
              memberEmail={workspace.memberEmail}
              setMemberEmail={workspace.setMemberEmail}
              onAddMember={workspace.addMember}
            />
          )}

          {activeSection === 'activity' && <ActivityPage activities={workspace.activities} />}
          {activeSection === 'calendar' && <PlaceholderPage title="Calendar" />}
          {activeSection === 'reports' && <PlaceholderPage title="Reports" />}
          {activeSection === 'settings' && <PlaceholderPage title="Settings" />}
        </div>
      </section>

      {workspace.editTask && workspace.selectedProject && (
        <EditTaskModal
    
          editForm={workspace.editForm}
          setEditForm={workspace.setEditForm}
          members={workspace.selectedProjectMembersRaw}
          onSave={workspace.saveTaskEdit}
          onClose={workspace.closeTaskEdit}
        />
      )}

      {workspace.commentTask && (
        <div className="modal-backdrop" role="presentation" onClick={(e) => { if (e.target === e.currentTarget) workspace.setCommentTask(null) }}>
          <CommentPanel
            task={workspace.commentTask}
            onAddComment={workspace.addComment}
            onClose={() => workspace.setCommentTask(null)}
          />
        </div>
      )}

      {toast && <ToastMessage toast={toast} />}
    </main>
  )
}

export default App
