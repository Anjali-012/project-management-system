import { useAuth } from './hooks/useAuth'
import { useToast } from './hooks/useToast'
import { useWorkspace } from './hooks/useWorkspace'

import { AuthScreen } from './components/AuthScreen'
import { CommentPanel } from './components/CommentPanel'
import { EditTaskModal } from './components/EditTaskModal'
import { Inspector } from './components/Inspector'
import { Sidebar } from './components/Sidebar'
import { TaskBoard } from './components/TaskBoard'
import { TaskComposer } from './components/TaskComposer'
import { TaskFiltersBar } from './components/TaskFiltersBar'
import { ToastMessage } from './components/ToastMessage'
import { Topbar } from './components/Topbar'

import './App.css'

const EMPTY_FILTERS = { search: '', status: '' as const, priority: '' as const, assignedTo: '' }

function App() {
  const { toast, showToast } = useToast()

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

  return (
    <main className="app-shell">
      <Sidebar
        auth={auth}
        projects={workspace.projects}
        selectedProjectId={workspace.selectedProjectId}
        projectForm={workspace.projectForm}
        setProjectForm={workspace.setProjectForm}
        onCreateProject={workspace.createProject}
        onSelectProject={workspace.setSelectedProjectId}
        onLogout={handleLogout}
      />

      <section className="workspace">
        <Topbar
          selectedProject={workspace.selectedProject}
          realtimeStatus={workspace.realtimeStatus}
          memberEmail={workspace.memberEmail}
          setMemberEmail={workspace.setMemberEmail}
          onAddMember={workspace.addMember}
          presence={workspace.presence}
        />

        {workspace.selectedProject && (
          <>
            <TaskComposer
              taskForm={workspace.taskForm}
              setTaskForm={workspace.setTaskForm}
              members={workspace.selectedProjectMembersRaw}
              onCreateTask={workspace.createTask}
            />
            <TaskFiltersBar
              filters={workspace.filters}
              members={workspace.selectedProjectMembersRaw}
              onChange={workspace.setFilters}
              onClear={() => workspace.setFilters(EMPTY_FILTERS)}
            />
          </>
        )}

        {workspace.loading && <p className="empty">Loading workspace...</p>}

        <section className="workspace-grid">
          <TaskBoard
            tasksByStatus={workspace.tasksByStatus}
            members={workspace.selectedProjectMembersRaw}
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

          <Inspector
            notifications={workspace.notifications}
            activities={workspace.activities}
            onMarkNotificationsRead={workspace.markNotificationsRead}
          />
        </section>
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
