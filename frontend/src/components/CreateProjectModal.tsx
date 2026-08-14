import type { FormEvent } from 'react'
import styles from './CreateProjectModal/CreateProjectModal.module.css'

type ProjectForm = {
  title: string
  description: string
}

type CreateProjectModalProps = {
  projectForm: ProjectForm
  setProjectForm: (form: ProjectForm) => void
  onCreateProject: (event: FormEvent) => void
  onClose: () => void
}

export const CreateProjectModal = ({
  projectForm,
  setProjectForm,
  onCreateProject,
  onClose,
}: CreateProjectModalProps) => {
  return (
    <div className={styles.overlay} onMouseDown={onClose}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-project-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>

        <div className={styles.header}>
          <p className={styles.eyebrow}>PROJECTS</p>

          <h2 id="create-project-title">
            Create a new project
          </h2>

          <p className={styles.subtitle}>
            Set up a project for your workspace.
          </p>
        </div>

        <form onSubmit={onCreateProject} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="project-title">
              Project title
            </label>

            <input
              id="project-title"
              type="text"
              required
              minLength={3}
              maxLength={80}
              pattern="[A-Za-z0-9][A-Za-z0-9 .,'()/_-]*"
              placeholder="e.g. Website Redesign"
              value={projectForm.title}
              onChange={(event) =>
                setProjectForm({
                  ...projectForm,
                  title: event.target.value,
                })
              }
              autoFocus
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="project-description">
              Description
            </label>

            <textarea
              id="project-description"
              maxLength={300}
              placeholder="What is this project about?"
              value={projectForm.description}
              onChange={(event) =>
                setProjectForm({
                  ...projectForm,
                  description: event.target.value,
                })
              }
            />
          </div>

          <div className={styles.actions}>

            <button
              type="submit"
              className={styles.createButton}
            >
              Create Project
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}