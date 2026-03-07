export type ChatDateContext = {
  todayIso: string;
  currentYear: number;
  currentMonth: number;
  currentMonthName: string;
  timezone: string;
  promptGuidance: string;
};

function formatDateInput(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function getChatDateContext(now = new Date()): ChatDateContext {
  const formatter = new Intl.DateTimeFormat("en-IN", {
    month: "long",
    timeZone: "Asia/Calcutta",
  });

  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const currentMonthName = formatter.format(now);
  const todayIso = formatDateInput(now);

  return {
    todayIso,
    currentYear,
    currentMonth,
    currentMonthName,
    timezone: "Asia/Calcutta",
    promptGuidance: [
      `Today is ${todayIso}.`,
      `The current year is ${currentYear}.`,
      `The current month is ${currentMonthName} ${currentYear}.`,
      "If the user gives month-day dates without a year, prefer the current year unless the question explicitly says another year.",
      "If the question is still ambiguous after using current date context, ask the user to clarify the date instead of guessing a distant year.",
    ].join(" "),
  };
}