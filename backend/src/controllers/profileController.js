export function getProfile(req, res) {
  const user = req.user || {}
  res.json({
    user: {
      ...user,
      id: user.registrationNumber || user.id,
    },
  })
}
