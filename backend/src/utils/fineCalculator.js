const FINE_PER_DAY = parseFloat(process.env.FINE_PER_DAY) || 5;
const BORROW_DAYS = parseInt(process.env.BORROW_DAYS) || 7;

const calculateFine = (issueDate, returnDate = new Date()) => {
  const due = new Date(issueDate);
  due.setDate(due.getDate() + BORROW_DAYS);
  const now = returnDate instanceof Date ? returnDate : new Date(returnDate);
  if (now <= due) return { fine: 0, daysOverdue: 0, dueDate: due };
  const msPerDay = 24 * 60 * 60 * 1000;
  const daysOverdue = Math.ceil((now - due) / msPerDay);
  return { fine: daysOverdue * FINE_PER_DAY, daysOverdue, dueDate: due };
};

const getDueDateStatus = (issueDate) => {
  const { daysOverdue, dueDate } = calculateFine(issueDate);
  const daysLeft = Math.ceil((dueDate - new Date()) / (24 * 60 * 60 * 1000));
  if (daysOverdue > 0) return { status: 'overdue', daysLeft: -daysOverdue, dueDate };
  if (daysLeft <= 2) return { status: 'due_soon', daysLeft, dueDate };
  return { status: 'ok', daysLeft, dueDate };
};

module.exports = { calculateFine, getDueDateStatus, FINE_PER_DAY, BORROW_DAYS };
