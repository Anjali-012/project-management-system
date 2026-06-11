const transport = require("./transport");
const { buildTemplate } = require("./templates");
const logActivity = require("../logActivity");
const createNotification = require("../createNotification");

const ENABLED = () => !!(process.env.SMTP_HOST && process.env.SMTP_USER);

/**
 * Sends a typed email. Fire-and-forget — never throws.
 * Logs outcome to activity log and notifies the recipient on failure.
 *
 * @param {object} opts
 * @param {"TASK_ASSIGNED"|"TASK_UPDATED"|"TASK_COMPLETED"} opts.type
 * @param {string} opts.to           recipient email
 * @param {object} opts.vars         template variables ({ name, taskTitle, priority, dueDate })
 * @param {string} opts.userId       recipient user _id (for notification + activity)
 * @param {string} opts.projectId    project _id (for activity log)
 */
const sendEmail = async ({ type, to, vars, userId, projectId }) => {
  if (!ENABLED()) return;

  const template = buildTemplate(type, vars);
  if (!template) {
    console.warn(`[email] No template registered for type: ${type}`);
    return;
  }

  try {
    await transport.sendMail({
      from: `"Project Management" <${process.env.SMTP_USER}>`,
      to,
      subject: template.subject,
      text: template.text,
      html: template.html,
    });

    await logActivity({
      project: projectId,
      user: userId,
      action: "EMAIL_SENT",
      metadata: { type, to, taskTitle: vars.taskTitle },
    });
  } catch (err) {
    await logActivity({
      project: projectId,
      user: userId,
      action: "EMAIL_FAILED",
      metadata: { type, to, taskTitle: vars.taskTitle, error: err.message },
    });

    await createNotification({
      user: userId,
      message: `Email notification failed for task: ${vars.taskTitle}`,
      type: "EMAIL_FAILED",
    });
  }
};

module.exports = sendEmail;
