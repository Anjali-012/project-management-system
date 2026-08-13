import { useState } from 'react'
import { useAuth } from './hooks/useAuth'
import { useToast } from './hooks/useToast'
import { useWorkspace } from './hooks/useWorkspace'
import { useTasksPage } from './hooks/useTasksPage'

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

  const tasks = useTasksPage(auth, workspace.projects, workspace.socketRef, showToast)

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
  const openTasks = () => setActiveSection('tasks')
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
          filters={tasks.filters}
          onFiltersChange={tasks.setFilters}
          onLogout={handleLogout}
        />

        <div className="workspace-scroll">
          {workspace.loading && <p className="empty">Loading workspace...</p>}

          {activeSection === 'dashboard' && (
            <DashboardOverview
              auth={auth}
              projects={workspace.projects}
              notifications={workspace.notifications}
              onOpenTasks={openTasks}
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
              selectedProjectId={tasks.taskProjectId}
              selectedProject={tasks.taskProject}
              onSelectProject={tasks.setTaskProjectId}
              taskForm={tasks.taskForm}
              setTaskForm={tasks.setTaskForm}
              members={tasks.taskProjectMembers}
              onCreateTask={tasks.createTask}
              filters={tasks.filters}
              onFiltersChange={tasks.setFilters}
              tasksByStatus={tasks.tasksByStatus}
              currentUserId={auth.user.id}
              isAdmin={auth.user.role === 'admin'}
              onDragStart={tasks.setDraggedTaskId}
              onDrop={tasks.handleDrop}
              onAssign={tasks.assignTaskMember}
              onStatusChange={tasks.updateTaskStatus}
              onEdit={tasks.openTaskEdit}
              onDelete={tasks.deleteTask}
              onOpenComments={tasks.setCommentTask}
            />
          )}

          {activeSection === 'members' && (
            <MembersPage
              auth={auth}
              projects={workspace.projects}
              selectedProjectId={workspace.selectedProjectId}
              onSelectProject={workspace.setSelectedProjectId}
              projectMembers={workspace.projectMembers}
              memberEmail={workspace.memberEmail}
              memberRole={workspace.memberRole}
              setMemberEmail={workspace.setMemberEmail}
              setMemberRole={workspace.setMemberRole}
              onAddMember={workspace.addMember}
              onChangeMemberRole={workspace.changeMemberRole}
              onRemoveMember={workspace.removeMember}
            />
          )}

          {activeSection === 'activity' && (
            <ActivityPage auth={auth} projects={workspace.projects} />
          )}
          {activeSection === 'calendar' && <PlaceholderPage title="Calendar" />}
          {activeSection === 'reports' && <PlaceholderPage title="Reports" />}
          {activeSection === 'settings' && <PlaceholderPage title="Settings" />}
        </div>
      </section>

      {tasks.editTask && tasks.taskProject && (
        <EditTaskModal
          editForm={tasks.editForm}
          setEditForm={tasks.setEditForm}
          members={tasks.taskProjectMembers}
          onSave={tasks.saveTaskEdit}
          onClose={tasks.closeTaskEdit}
        />
      )}

      {tasks.commentTask && (
        <div className="modal-backdrop" role="presentation" onClick={(e) => { if (e.target === e.currentTarget) tasks.setCommentTask(null) }}>
          <CommentPanel
            task={tasks.commentTask}
            onAddComment={tasks.addComment}
            onClose={() => tasks.setCommentTask(null)}
          />
        </div>
      )}

      {toast && <ToastMessage toast={toast} />}
    </main>
  )
}

export default App
