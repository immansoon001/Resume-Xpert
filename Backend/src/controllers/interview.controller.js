const pdfParse = require("pdf-parse")
const { generateInterviewReport, generateResumeHtml, generateResumePdf, evaluateAnswer } = require("../services/ai.service")

const interviewReportModel = require("../models/interviewReport.model")




/**
 * @description Controller to generate interview report based on user self description, resume and job description.
 */
async function generateInterViewReportController(req, res) {
    try {
        const { selfDescription = "", jobDescription = "", targetLevel = "mid" } = req.body

        if (!jobDescription || !jobDescription.trim()) {
            return res.status(400).json({
                message: "Target job description is required."
            })
        }

        let resumeText = ""

        if (req.file && req.file.buffer) {
            try {
                const parsed = await (new pdfParse.PDFParse(Uint8Array.from(req.file.buffer))).getText()
                resumeText = parsed.text || ""
            } catch (err) {
                console.warn("Failed to parse PDF binary, reading as string:", err.message)
                resumeText = req.file.buffer.toString("utf-8")
            }
        }

        if (!resumeText.trim() && (!selfDescription || !selfDescription.trim())) {
            return res.status(400).json({
                message: "Please provide either a resume file or a self description."
            })
        }

        // If resume is empty, populate from selfDescription
        if (!resumeText.trim()) {
            resumeText = selfDescription.trim()
        }

        const interViewReportByAi = await generateInterviewReport({
            resume: resumeText,
            selfDescription,
            jobDescription,
            targetLevel
        })

        const interviewReport = await interviewReportModel.create({
            user: req.user.id,
            resume: resumeText,
            selfDescription,
            jobDescription,
            targetLevel: [ "junior", "mid", "senior", "lead", "faang" ].includes(targetLevel) ? targetLevel : "mid",
            ...interViewReportByAi
        })

        return res.status(201).json({
            message: "Interview report generated successfully.",
            interviewReport
        })
    } catch (error) {
        console.error("Error generating interview report:", error)
        return res.status(500).json({
            message: "Failed to generate interview strategy.",
            error: error.message
        })
    }
}

/**
 * @description Controller to get interview report by interviewId.
 */
async function getInterviewReportByIdController(req, res) {

    const { interviewId } = req.params

    const interviewReport = await interviewReportModel.findOne({ _id: interviewId, user: req.user.id })

    if (!interviewReport) {
        return res.status(404).json({
            message: "Interview report not found."
        })
    }

    res.status(200).json({
        message: "Interview report fetched successfully.",
        interviewReport
    })
}


/** 
 * @description Controller to get all interview reports of logged in user.
 */
async function getAllInterviewReportsController(req, res) {
    const interviewReports = await interviewReportModel.find({ user: req.user.id }).sort({ createdAt: -1 }).select("-resume -selfDescription -jobDescription -__v -technicalQuestions -behavioralQuestions -skillGaps -preparationPlan")

    res.status(200).json({
        message: "Interview reports fetched successfully.",
        interviewReports
    })
}


/**
 * @description Controller to generate resume PDF based on user self description, resume and job description.
 */
async function generateResumePdfController(req, res) {
    try {
        const { interviewReportId } = req.params

        const interviewReport = await interviewReportModel.findById(interviewReportId)

        if (!interviewReport) {
            return res.status(404).json({
                message: "Interview report not found."
            })
        }

        const { resume, jobDescription, selfDescription } = interviewReport

        const pdfBuffer = await generateResumePdf({ resume, jobDescription, selfDescription })

        res.set({
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename=resume_${interviewReportId}.pdf`
        })

        res.send(pdfBuffer)
    } catch (error) {
        console.error("Error generating resume PDF:", error)
        return res.status(500).json({
            message: "Failed to generate resume PDF.",
            error: error.message
        })
    }
}
/**
 * @description Controller to delete interview report by interviewId.
 */
async function deleteInterviewReportController(req, res) {
    const { interviewId } = req.params;

    const interviewReport = await interviewReportModel.findOneAndDelete({ _id: interviewId, user: req.user.id });

    if (!interviewReport) {
        return res.status(404).json({
            message: "Interview report not found or you are not authorized to delete it."
        });
    }

    res.status(200).json({
        message: "Interview report deleted successfully.",
        deletedId: interviewId
    });
}

/**
 * @description Controller to evaluate a candidate's mock interview answer using AI.
 */
async function evaluateAnswerController(req, res) {
    try {
        const { question, userAnswer, expectedAnswer, questionType, jobTitle } = req.body

        if (!question || !userAnswer) {
            return res.status(400).json({ error: "question and userAnswer are required" })
        }

        const feedback = await evaluateAnswer({
            question,
            userAnswer: userAnswer.trim(),
            expectedAnswer: expectedAnswer || "",
            questionType: questionType || "technical",
            jobTitle: jobTitle || "Software Engineer"
        })

        return res.status(200).json({ feedback })
    } catch (error) {
        console.error("Error evaluating answer:", error)
        return res.status(500).json({ message: "Failed to evaluate answer.", error: error.message })
    }
}

/**
 * @description Controller to toggle or update completed tasks for an interview preparation roadmap.
 */
async function updateCompletedTasksController(req, res) {
    try {
        const { interviewId } = req.params
        const { completedTasks } = req.body

        if (!Array.isArray(completedTasks)) {
            return res.status(400).json({ message: "completedTasks must be an array" })
        }

        const updatedReport = await interviewReportModel.findOneAndUpdate(
            { _id: interviewId, user: req.user.id },
            { $set: { completedTasks } },
            { new: true }
        )

        if (!updatedReport) {
            return res.status(404).json({ message: "Interview report not found." })
        }

        return res.status(200).json({
            message: "Tasks updated successfully",
            completedTasks: updatedReport.completedTasks
        })
    } catch (error) {
        console.error("Error updating tasks:", error)
        return res.status(500).json({ message: "Failed to update tasks.", error: error.message })
    }
}

/**
 * @description Controller to generate tailored resume HTML based on user self description, resume and job description.
 */
async function generateResumeHtmlController(req, res) {
    try {
        const { interviewReportId } = req.params

        const interviewReport = await interviewReportModel.findById(interviewReportId)

        if (!interviewReport) {
            return res.status(404).json({
                message: "Interview report not found."
            })
        }

        const { resume, jobDescription, selfDescription } = interviewReport

        const html = await generateResumeHtml({ resume, jobDescription, selfDescription })

        return res.status(200).json({
            message: "Resume HTML generated successfully.",
            html
        })
    } catch (error) {
        console.error("Error generating resume HTML:", error)
        return res.status(500).json({ message: "Failed to generate resume preview.", error: error.message })
    }
}

module.exports = {
    generateInterViewReportController,
    getInterviewReportByIdController,
    getAllInterviewReportsController,
    generateResumeHtmlController,
    generateResumePdfController,
    deleteInterviewReportController,
    evaluateAnswerController,
    updateCompletedTasksController
}