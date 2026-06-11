// Template layer — content is separated from send logic.
// Each event type returns { subject, html, text }.
// Add a new key here to support a new email event.

const fmt = (date) => new Date(date).toDateString();
const cap = (str) => str.charAt(0).toUpperCase() + str.slice(1);

const EMAIL_TEMPLATES = {
  TASK_ASSIGNED: ({ name, taskTitle, priority, dueDate }) => ({
    subject: "New Task Assigned",
    html: `
      <p>Hi <strong>${name}</strong>,</p>
      <p>A new task has been assigned to you.</p>
      <table>
        <tr><td><strong>Title</strong></td><td>${taskTitle}</td></tr>
        ${priority ? `<tr><td><strong>Priority</strong></td><td>${cap(priority)}</td></tr>` : ""}
        ${dueDate ? `<tr><td><strong>Due Date</strong></td><td>${fmt(dueDate)}</td></tr>` : ""}
      </table>
    `.trim(),
    text: [
      `Hi ${name},`,
      "",
      "A new task has been assigned to you.",
      "",
      `Title: ${taskTitle}`,
      priority ? `Priority: ${cap(priority)}` : null,
      dueDate ? `Due Date: ${fmt(dueDate)}` : null,
    ]
      .filter((l) => l !== null)
      .join("\n"),
  }),

  TASK_UPDATED: ({ name, taskTitle, priority, dueDate }) => ({
    subject: "Task Updated",
    html: `
      <p>Hi <strong>${name}</strong>,</p>
      <p>A task assigned to you has been updated.</p>
      <table>
        <tr><td><strong>Title</strong></td><td>${taskTitle}</td></tr>
        ${priority ? `<tr><td><strong>Priority</strong></td><td>${cap(priority)}</td></tr>` : ""}
        ${dueDate ? `<tr><td><strong>Due Date</strong></td><td>${fmt(dueDate)}</td></tr>` : ""}
      </table>
    `.trim(),
    text: [
      `Hi ${name},`,
      "",
      "A task assigned to you has been updated.",
      "",
      `Title: ${taskTitle}`,
      priority ? `Priority: ${cap(priority)}` : null,
      dueDate ? `Due Date: ${fmt(dueDate)}` : null,
    ]
      .filter((l) => l !== null)
      .join("\n"),
  }),

  TASK_COMPLETED: ({ name, taskTitle }) => ({
    subject: "Task Marked as Done",
    html: `
      <p>Hi <strong>${name}</strong>,</p>
      <p>The following task has been marked as <strong>Done</strong>.</p>
      <p><strong>Title:</strong> ${taskTitle}</p>
    `.trim(),
    text: `Hi ${name},\n\nThe following task has been marked as Done.\n\nTitle: ${taskTitle}`,
  }),
};

/**
 * Returns { subject, html, text } for a given event type and variables.
 * Returns null if the type has no registered template.
 */
const buildTemplate = (type, vars) => {
  const builder = EMAIL_TEMPLATES[type];
  return builder ? builder(vars) : null;
};

module.exports = { buildTemplate };
