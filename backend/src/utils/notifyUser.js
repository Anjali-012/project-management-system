const createNotification = require("./createNotification");
const sendEmail = require("./email/emailService");

// Notification types that should also trigger an email, and which email type to use.
const EMAIL_EVENTS = {
  TASK_ASSIGNED: "TASK_ASSIGNED",
  TASK_UPDATED: "TASK_UPDATED",
  TASK_COMPLETED: "TASK_COMPLETED",
};

// Human-readable in-app messages per event type.
const IN_APP_MESSAGES = {
  TASK_ASSIGNED: (task) => `You were assigned a task: ${task.title}`,
  TASK_UPDATED: (task) => `A task assigned to you was updated: ${task.title}`,
  TASK_COMPLETED: (task) => `Task marked as done: ${task.title}`,
};

/**
 * Single entry point for all user notifications.
 * Sends an in-app notification and, if configured, an email.
 * Fire-and-forget — never throws.
 *
 * @param {object} opts
 * @param {"TASK_ASSIGNED"|"TASK_UPDATED"|"TASK_COMPLETED"} opts.type
 * @param {{ _id: string, name: string, email: string }} opts.user   recipient
 * @param {{ title: string, priority?: string, dueDate?: Date, project?: string }} opts.task
 */
const notifyUser = async ({ type, user, task }) => {
  try {
    const messageBuilder = IN_APP_MESSAGES[type];
    if (messageBuilder) {
      await createNotification({
        user: user._id,
        message: messageBuilder(task),
        type,
        project: task.project,
      });
    }

    if (EMAIL_EVENTS[type]) {
      sendEmail({
        type: EMAIL_EVENTS[type],
        to: user.email,
        userId: user._id,
        projectId: task.project,
        vars: {
          name: user.name,
          taskTitle: task.title,
          priority: task.priority,
          dueDate: task.dueDate,
        },
      });
    }
  } catch (err) {
    console.error("[notifyUser] dispatch error:", err.message);
  }
};

module.exports = notifyUser;
