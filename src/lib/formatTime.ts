export function formatTime12h(time: string): string {
  const [hoursStr, minutesStr] = time.split(':')
  const hours = Number(hoursStr)
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours % 12 === 0 ? 12 : hours % 12
  return `${displayHours}:${minutesStr.padStart(2, '0')} ${period}`
}
