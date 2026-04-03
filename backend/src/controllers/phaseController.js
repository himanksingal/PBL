import { PhaseConfig } from '../models/PhaseConfig.js'
import { PhaseSubmission } from '../models/PhaseSubmission.js'
import { PhaseEvaluation } from '../models/PhaseEvaluation.js'
import { UserProfile } from '../models/UserProfile.js'

export const getPhaseConfigs = async (req, res) => {
  try {
    const configs = await PhaseConfig.find().sort({ phaseId: 1 })
    return res.json({ configs })
  } catch (err) {
    return res.status(500).json({ error: 'Failed to get phase configs', details: err.message })
  }
}

export const submitPhase = async (req, res) => {
  try {
    const { phaseId } = req.params
    const { formData } = req.body
    const parsedFormData = formData ? JSON.parse(formData) : {}
    const studentRegistrationNumber = req.user.registrationNumber

    const documents = []
    if (req.files) {
      // multer `.any()` yields `req.files` as an array; `.fields()` yields an object keyed by field name.
      const files = Array.isArray(req.files) ? req.files : Object.values(req.files).flat()
      for (const file of files) {
        if (!file?.filename) continue
        documents.push({
          label: file.fieldname || file.originalname || 'document',
          url: `/uploads/phases/${file.filename}`,
        })
      }
    }

    const config = await PhaseConfig.findOne({ phaseId: Number(phaseId) })
    if (!config || !config.enabled) {
      return res.status(403).json({ error: 'Phase is currently disabled or does not exist.' })
    }

    const prevConfig = await PhaseConfig.findOne({
      phaseId: { $lt: Number(phaseId) },
      isEvaluationPhase: false,
      enabled: true
    }).sort({ phaseId: -1 })

    if (prevConfig) {
      const prevSubmission = await PhaseSubmission.findOne({ 
        studentRegistrationNumber, 
        phaseId: prevConfig.phaseId 
      })
      if (!prevSubmission || prevSubmission.status !== 'Approved') {
        return res.status(403).json({ 
          error: `Phase Locked. You must wait for the preceding phase (${prevConfig.title}) to be Approved.` 
        })
      }
    }

    let submission = await PhaseSubmission.findOne({ studentRegistrationNumber, phaseId: Number(phaseId) })
    if (submission) {
      submission.formData = { ...submission.formData, ...parsedFormData }
      if (documents.length > 0) submission.documents = [...submission.documents, ...documents]
      submission.status = 'Pending' // Resubmission resets status
      await submission.save()
    } else {
      submission = new PhaseSubmission({
        studentRegistrationNumber,
        phaseId: Number(phaseId),
        formData: parsedFormData,
        documents,
      })
      await submission.save()
    }

    return res.json({ message: 'Submitted successfully', submission })
  } catch (err) {
    return res.status(500).json({ error: 'Failed to submit phase', details: err.message })
  }
}

export const getStudentSubmissions = async (req, res) => {
  try {
    const { phaseId } = req.query
    const filter = phaseId ? { phaseId: Number(phaseId) } : {}
    
    if (req.user.role === 'Faculty') {
      const assignedStudents = await UserProfile.find({
        role: 'Student',
        assignedFacultyRegistrationNumber: String(req.user.registrationNumber).trim()
      }).select('registrationNumber')
      const regNums = assignedStudents.map(s => s.registrationNumber)
      filter.studentRegistrationNumber = { $in: regNums }
    }

    const submissions = await PhaseSubmission.find(filter)
    
    // Also fetch evaluations
    const evaluations = await PhaseEvaluation.find(filter)

    return res.json({ submissions, evaluations })
  } catch (err) {
    return res.status(500).json({ error: 'Failed to get submissions', details: err.message })
  }
}

export const reviewSubmission = async (req, res) => {
  try {
    const { submissionId } = req.params
    const { status, feedback, formData } = req.body
    
    if (status === 'Rejected' && !feedback) {
      return res.status(400).json({ error: 'Feedback is required when rejecting a submission.' })
    }

    const submission = await PhaseSubmission.findById(submissionId)
    if (!submission) return res.status(404).json({ error: 'Submission not found' })

    submission.status = status
    submission.feedback = feedback !== undefined ? feedback : submission.feedback
    if (formData) {
      submission.formData = { ...submission.formData, ...formData }
    }
    submission.reviewedBy = req.user.registrationNumber
    await submission.save()

    return res.json({ message: 'Review saved', submission })
  } catch (err) {
    return res.status(500).json({ error: 'Failed to review submission', details: err.message })
  }
}

export const evaluateStudent = async (req, res) => {
  try {
    const { studentRegistrationNumber, phaseId, marks } = req.body
    
    const config = await PhaseConfig.findOne({ phaseId: Number(phaseId) })
    if (!config || !config.enabled || !config.isEvaluationPhase) {
      return res.status(403).json({ error: 'Phase is invalid or closed for evaluation.' })
    }

    let evaluation = await PhaseEvaluation.findOne({ studentRegistrationNumber, phaseId: Number(phaseId) })
    if (evaluation && evaluation.isLocked) {
      return res.status(403).json({ error: 'Evaluations for this phase are locked by coordinator.' })
    }

    let totalScore = 0
    if (marks) {
      for (const score of Object.values(marks)) {
        totalScore += Number(score) || 0
      }
    }

    if (evaluation) {
      evaluation.marks = marks
      evaluation.totalScore = totalScore
      evaluation.evaluatorRegistrationNumber = req.user.registrationNumber
      await evaluation.save()
    } else {
      evaluation = new PhaseEvaluation({
        studentRegistrationNumber,
        phaseId: Number(phaseId),
        marks,
        totalScore,
        evaluatorRegistrationNumber: req.user.registrationNumber
      })
      await evaluation.save()
    }

    return res.json({ message: 'Evaluation saved', evaluation })
  } catch (err) {
    return res.status(500).json({ error: 'Failed to save evaluation', details: err.message })
  }
}

export const lockEvaluations = async (req, res) => {
  try {
    const { phaseId, studentRegistrationNumbers } = req.body
    await PhaseEvaluation.updateMany(
      { phaseId: Number(phaseId), studentRegistrationNumber: { $in: studentRegistrationNumbers } },
      { $set: { isLocked: true } }
    )
    return res.json({ message: 'Evaluations locked successfully' })
  } catch (err) {
    return res.status(500).json({ error: 'Failed to lock evaluations', details: err.message })
  }
}

export const unlockEvaluations = async (req, res) => {
  try {
    const { phaseId, studentRegistrationNumbers } = req.body
    await PhaseEvaluation.updateMany(
      { phaseId: Number(phaseId), studentRegistrationNumber: { $in: studentRegistrationNumbers } },
      { $set: { isLocked: false } }
    )
    return res.json({ message: 'Evaluations unlocked successfully' })
  } catch (err) {
    return res.status(500).json({ error: 'Failed to unlock evaluations', details: err.message })
  }
}

export const updatePhaseConfig = async (req, res) => {
  try {
    const { phaseId } = req.params
    const updateData = req.body
    
    const config = await PhaseConfig.findOneAndUpdate(
      { phaseId: Number(phaseId) },
      updateData,
      { new: true, upsert: true }
    )
    return res.json({ message: 'Phase config updated', config })
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update Phase Config', details: err.message })
  }
}

export const deletePhaseConfig = async (req, res) => {
  try {
    const { phaseId } = req.params
    const pid = Number(phaseId)
    await PhaseConfig.deleteOne({ phaseId: pid })
    await PhaseSubmission.deleteMany({ phaseId: pid })
    await PhaseEvaluation.deleteMany({ phaseId: pid })
    return res.json({ message: `Phase ${pid} and all associated data deleted.` })
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete phase', details: err.message })
  }
}

export const getStudentAllSubmissions = async (req, res) => {
  try {
    const { studentReg } = req.params
    const submissions = await PhaseSubmission.find({ studentRegistrationNumber: studentReg })
    return res.json({ submissions })
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch student submissions', details: err.message })
  }
}

export const editSubmissionForms = async (req, res) => {
  try {
    const { submissionId } = req.params
    const { formData } = req.body
    const submission = await PhaseSubmission.findById(submissionId)
    if (!submission) return res.status(404).json({ error: 'Submission not found' })
    submission.formData = { ...submission.formData, ...formData }
    await submission.save()
    return res.json({ message: 'Submission updated', submission })
  } catch (err) {
    return res.status(500).json({ error: 'Failed to edit submission', details: err.message })
  }
}

export const getMyPhaseSubmission = async (req, res) => {
  try {
    const { phaseId } = req.params
    const studentRegistrationNumber = req.user.registrationNumber
    
    if (!studentRegistrationNumber) {
      return res.status(400).json({ error: 'User registration number is missing.' })
    }

    let isProgressionLocked = false
    let progressionMessage = ''

    const prevConfig = await PhaseConfig.findOne({
      phaseId: { $lt: Number(phaseId) },
      isEvaluationPhase: false,
      enabled: true
    }).sort({ phaseId: -1 })

    if (prevConfig) {
      const prevSubmission = await PhaseSubmission.findOne({ 
        studentRegistrationNumber, 
        phaseId: prevConfig.phaseId 
      })
      if (!prevSubmission || prevSubmission.status !== 'Approved') {
        isProgressionLocked = true
        progressionMessage = `This phase is locked. You must complete the preceding phase (${prevConfig.title}) and wait for it to be Approved before viewing this content.`
      }
    }

    const submission = await PhaseSubmission.findOne({ 
      phaseId: Number(phaseId), 
      studentRegistrationNumber 
    })
    
    return res.json({ submission, isProgressionLocked, progressionMessage })
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch your submission.', details: err.message })
  }
}
