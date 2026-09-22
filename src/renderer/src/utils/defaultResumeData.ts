export const DEFAULT_PLACEHOLDER_RESUME = {
  name: '',
  title: '',
  contact: '',
  summary: '',
  skills: [] as Array<{ category: string; items: string }>,
  experience: [] as Array<{ role: string; company: string; period: string; bullets: string[] }>,
  projects: [] as Array<{ title: string; desc: string }>
}
