import { useState } from 'react'
import { useAuth } from './hooks/useAuth'
import { useToast } from './hooks/useToast'
import { useWorkspace } from './hooks/useWorkspace'
import { useTasksPage } from './hooks/useTasksPage'
import { getGlobalCapabilities, getProjectCapabilities, canEditTask } from './utils/permissions'

import { AuthScreen } from './components/AuthScreen/AuthScreen'
import { CommentPanel } from './components/CommentPanel/CommentPanel'
import { DashboardOverview } from './components/DashboardOverview/DashboardOverview'
import { EditTaskModal } from './components/EditTaskModal/EditTaskModal'
import { TaskDetailsModal } from './components/TaskDetailsModal/TaskDetailsModal'
import { Sidebar, type WorkspaceSection } from './components/Sidebar/Sidebar'
import { ToastMessage } from './components/ToastMessage/ToastMessage'
import { Topbar } from './components/Topbar/Topbar'
import { ActivityPage, MembersPage, PlaceholderPage, ProjectsPage, TasksPage } from './components/WorkspacePages/WorkspacePages'

import './App.css'

function App() {
  const { toast, showToast } = useToast()

const [activeSection, setActiveSection] = useState<WorkspaceSection>(() => {
  const savedSection = localStorage.getItem('pms-active-section')

  const validSections: WorkspaceSection[] = [
    'dashboard',
    'projects',
    'tasks',
    'members',
    'calendar',
    'activity',
    'reports',
    'settings',
  ]

  return savedSection && validSections.includes(savedSection as WorkspaceSection)
    ? (savedSection as WorkspaceSection)
    : 'dashboard'
})

const handleSectionChange = (section: WorkspaceSection) => {
  setActiveSection(section)
  localStorage.setItem('pms-active-section', section)
}

  const {
    auth, authMode, setAuthMode, authForm, setAuthForm,
    showPassword, setShowPassword, loading: authLoading, handleAuth, logout: logoutAuth,
  } = useAuth(showToast)

  const workspace = useWorkspace(auth, showToast)

  const tasks = useTasksPage(auth, workspace.projects, workspace.socketRef, showToast)

  const taskProjectRole = tasks.taskProjectMembers.find(
    (member) => member._id === auth?.user.id,
  )?.projectRole ?? null

  const taskCapabilities = getProjectCapabilities(
    taskProjectRole,
    auth?.user.role ?? 'member',
  )
  const globalCapabilities = auth
    ? getGlobalCapabilities(auth.user.role)
    : { canCreateProject: false }

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
  const openTasks = () => handleSectionChange('tasks')
const openMembers = () => handleSectionChange('members')

  return (
    <main className="app-shell">
      <Sidebar
       activeSection={activeSection}
  onNavigate={handleSectionChange}
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
              canCreateProject={globalCapabilities.canCreateProject}
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
              capabilities={taskCapabilities}
              onDragStart={tasks.setDraggedTaskId}
              onDrop={tasks.handleDrop}
              onAssign={tasks.assignTaskMember}
              onStatusChange={tasks.updateTaskStatus}
              onEdit={tasks.openTaskEdit}
              onDelete={tasks.deleteTask}
              onOpenComments={tasks.setCommentTask}
              onOpenDetails={tasks.openTaskDetails}
              draggedTaskId={tasks.draggedTaskId}
              pagination={tasks.pagination}
              sortBy={tasks.sortBy}
              sortOrder={tasks.sortOrder}
              onChangePage={tasks.changePage}
              onChangeSort={tasks.changeSort}
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

      {tasks.editTask && tasks.taskProject && canEditTask(
        taskCapabilities,
        tasks.editTask.createdBy?.id || tasks.editTask.createdBy?._id || '',
        auth.user.id,
      ) && (
        <EditTaskModal
          editForm={tasks.editForm}
          setEditForm={tasks.setEditForm}
          members={tasks.taskProjectMembers}
          onSave={tasks.saveTaskEdit}
          onClose={tasks.closeTaskEdit}
        />
      )}

      {tasks.detailTask && (
        <TaskDetailsModal
          task={tasks.detailTask}
          loading={tasks.detailLoading}
          onClose={tasks.closeTaskDetails}
          onEdit={(task) => { tasks.closeTaskDetails(); tasks.openTaskEdit(task) }}
          onOpenComments={(task) => { tasks.closeTaskDetails(); tasks.setCommentTask(task) }}
          canEdit={canEditTask(taskCapabilities, tasks.detailTask.createdBy?.id || tasks.detailTask.createdBy?._id || '', auth.user.id)}
        />
      )}

      {tasks.commentTask && (
        <div className="modal-backdrop" role="presentation" onClick={(e) => { if (e.target === e.currentTarget) tasks.setCommentTask(null) }}>
          <CommentPanel
            task={tasks.commentTask}
            canComment={canEditTask(
              taskCapabilities,
              tasks.commentTask.createdBy?.id || tasks.commentTask.createdBy?._id || '',
              auth.user.id,
            )}
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
