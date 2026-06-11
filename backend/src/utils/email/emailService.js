const transport = require("./transport");
const { buildTemplate } = require("./templates");

const ENABLED = () => !!(process.env.SMTP_HOST && process.env.SMTP_USER);

/**
 * Sends a typed email. Fire-and-forget — never throws.
 *
 * @param {object} opts
 * @param {"TASK_ASSIGNED"|"TASK_UPDATED"|"TASK_COMPLETED"} opts.type
 * @param {string} opts.to        recipient email
 * @param {object} opts.vars      template variables ({ name, taskTitle, priority, dueDate })
 */
const sendEmail = async ({ type, to, vars }) => {
  if (!ENABLED()) return;

  const template = buildTemplate(type, vars);
  if (!template) {
    console.warn(`[email] No template registered for type: ${type}`);
    return;
  }

  const meta = { type, to, taskTitle: vars.taskTitle };

  console.info(`[email] sending → type: ${type} | to: ${to} | task: "${vars.taskTitle}"`);

  try {
    await transport.sendMail({
      from: `"Project Management" <${process.env.SMTP_USER}>`,
      to,
      subject: template.subject,
      text: template.text,
      html: template.html,
    });
    console.info(`[email] EMAIL_SENT_SUCCESS → type: ${meta.type} | to: ${meta.to} | task: "${meta.taskTitle}"`);
  } catch (err) {
    console.error(`[email] EMAIL_FAILED → type: ${meta.type} | to: ${meta.to} | task: "${meta.taskTitle}" | error: ${err.message}`);
  }
};

module.exports = sendEmail;
