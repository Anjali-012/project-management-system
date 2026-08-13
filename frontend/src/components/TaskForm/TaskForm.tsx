import type { FormEvent } from 'react'
import type { Member, TaskPriority, TaskStatus } from '../../types'
import { getMemberId, getMemberName } from '../../utils/member'
import { STATUS_ORDER, STATUS_LABELS, PRIORITY_ORDER, PRIORITY_LABELS } from '../../constants'
import styles from './TaskForm.module.css'

export type TaskFormValues = {
  title: string
  description: string
  assignedTo: string
  priority: TaskPriority
  dueDate: string
  status?: TaskStatus
}

type Props = {
  values: TaskFormValues
  onChange: (values: TaskFormValues) => void
  members: Array<Member | string>
  showStatus?: boolean
  submitLabel: string
  onSubmit: (e: FormEvent) => void
}

export const TaskForm = ({ values, onChange, members, showStatus = false, submitLabel, onSubmit }: Props) => {
  const set = (patch: Partial<TaskFormValues>) => onChange({ ...values, ...patch })

  return (
    <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <label>
        Title
        <input
          required minLength={3} maxLength={100}
          pattern="[A-Za-z0-9][A-Za-z0-9 .,'()/_-]*"
          value={values.title}
          onChange={(e) => set({ title: e.target.value })}
        />
      </label>

      <label>
        Description
        <textarea
          maxLength={500}
          value={values.description}
          onChange={(e) => set({ description: e.target.value })}
        />
      </label>

      <div className={styles.row}>
        <label>
          Priority
          <select value={values.priority} onChange={(e) => set({ priority: e.target.value as TaskPriority })}>
            {PRIORITY_ORDER.map((p) => (
              <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
            ))}
          </select>
        </label>

        <label>
          Due date
          <input
            type="date"
            value={values.dueDate}
            onChange={(e) => set({ dueDate: e.target.value })}
          />
        </label>
      </div>

      <label>
        Assignee
        <select value={values.assignedTo} onChange={(e) => set({ assignedTo: e.target.value })}>
          <option value="">Unassigned</option>
          {members.map((member) => (
            <option key={getMemberId(member)} value={getMemberId(member)}>
              {getMemberName(member)}
            </option>
          ))}
        </select>
      </label>

      {showStatus && values.status !== undefined && (
        <label>
          Status
          <select value={values.status} onChange={(e) => set({ status: e.target.value as TaskStatus })}>
            {STATUS_ORDER.map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
        </label>
      )}

      <button className={`primary ${styles.submitBtn}`} type="submit">{submitLabel}</button>
    </form>
  )
}
