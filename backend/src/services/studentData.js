const guideExaminerMap = [
  {
    guideName: 'Dr. Neha Sharma',
    externalExaminer: 'Dr. R. K. Meena',
    panel: 'Panel A',
    venue: 'AB1-404',
    slot: '09:30 AM - 11:00 AM',
    date: '2026-02-18',
  },
  {
    guideName: 'Dr. Ashish Gupta',
    externalExaminer: 'Prof. S. Banerjee',
    panel: 'Panel B',
    venue: 'AB1-406',
    slot: '11:30 AM - 01:00 PM',
    date: '2026-02-18',
  },
  {
    guideName: 'Dr. Ajay Verma',
    externalExaminer: 'Dr. P. N. Rao',
    panel: 'Panel C',
    venue: 'AB2-212',
    slot: '02:00 PM - 03:30 PM',
    date: '2026-02-19',
  },
  {
    guideName: 'Dr. Gunjan Pathak',
    externalExaminer: 'Prof. M. Joshi',
    panel: 'Panel D',
    venue: 'AB2-214',
    slot: '03:45 PM - 05:00 PM',
    date: '2026-02-19',
  },
]

const submissions = []

function normalize(text) {
  return String(text || '').trim().toLowerCase()
}

export function findExaminerByGuide(guideName) {
  const query = normalize(guideName)
  if (!query) return null

  return (
    guideExaminerMap.find((entry) => normalize(entry.guideName) === query) ||
    guideExaminerMap.find((entry) => normalize(entry.guideName).includes(query)) ||
    null
  )
}

export function addPblSubmission(payload) {
  const record = {
    ...payload,
    submittedAt: new Date().toISOString(),
  }
  submissions.push(record)
  return record
}

export function getAllSubmissions() {
  return submissions
}
