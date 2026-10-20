const express = require("express")
const authMiddleware = require("../middleware/auth.middleware")
const interviewController = require("../controllers/interview.controller")
const upload = require("../middleware/file.middleware")

const interviewRouter = express.Router()



/**
 * @route POST /api/interview/
 * @description generate new interview report on the basis of user self description,resume pdf and job description.
 * @access private
 */
interviewRouter.post("/", authMiddleware.authUser, upload.single("resume"), interviewController.generateInterViewReportController)

/**
 * @route GET /api/interview/report/:interviewId
 * @description get interview report by interviewId.
 * @access private
 */
interviewRouter.get("/report/:interviewId", authMiddleware.authUser, interviewController.getInterviewReportByIdController)


/**
 * @route GET /api/interview/
 * @description get all interview reports of logged in user.
 * @access private
 */
interviewRouter.get("/", authMiddleware.authUser, interviewController.getAllInterviewReportsController)


/**
 * @route POST /api/interview/resume/html/:interviewReportId
 * @description generate resume HTML preview on the basis of user self description, resume content and job description.
 * @access private
 */
interviewRouter.post("/resume/html/:interviewReportId", authMiddleware.authUser, interviewController.generateResumeHtmlController)

/**
 * @route POST /api/interview/resume/pdf/:interviewReportId
 * @description generate resume pdf on the basis of user self description, resume content and job description.
 * @access private
 */
interviewRouter.post("/resume/pdf/:interviewReportId", authMiddleware.authUser, interviewController.generateResumePdfController)

/**
 * @route DELETE /api/interview/report/:interviewId
 * @description delete an interview report by interviewId.
 * @access private
 */
interviewRouter.delete("/report/:interviewId", authMiddleware.authUser, interviewController.deleteInterviewReportController)

/**
 * @route POST /api/interview/mock/feedback
 * @description Evaluate a candidate's mock interview answer using AI and return structured feedback.
 * @body { question, userAnswer, expectedAnswer, questionType, jobTitle }
 * @access private
 */
interviewRouter.post("/mock/feedback", authMiddleware.authUser, interviewController.evaluateAnswerController)

/**
 * @route PATCH /api/interview/report/:interviewId/tasks
 * @description update completed preparation roadmap tasks for a report.
 * @access private
 */
interviewRouter.patch("/report/:interviewId/tasks", authMiddleware.authUser, interviewController.updateCompletedTasksController)

module.exports = interviewRouter