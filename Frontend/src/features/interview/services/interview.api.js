import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:3000",
    withCredentials: true,
})


/**
 * @description Service to generate interview report based on user self description, resume, job description and target level.
 */
export const generateInterviewReport = async ({ jobDescription, selfDescription, resumeFile, targetLevel = "mid" }) => {

    const formData = new FormData()
    formData.append("jobDescription", jobDescription)
    formData.append("selfDescription", selfDescription)
    formData.append("targetLevel", targetLevel)
    if (resumeFile) {
        formData.append("resume", resumeFile)
    }

    const response = await api.post("/api/interview/", formData, {
        headers: {
            "Content-Type": "multipart/form-data"
        }
    })

    return response.data

}


/**
 * @description Service to get interview report by interviewId.
 */
export const getInterviewReportById = async (interviewId) => {
    const response = await api.get(`/api/interview/report/${interviewId}`)

    return response.data
}


/**
 * @description Service to get all interview reports of logged in user.
 */
export const getAllInterviewReports = async () => {
    const response = await api.get("/api/interview/")

    return response.data
}


/**
 * @description Service to generate resume HTML preview based on user profile and job description.
 */
export const generateResumeHtml = async ({ interviewReportId }) => {
    const response = await api.post(`/api/interview/resume/html/${interviewReportId}`)
    return response.data
}

/**
 * @description Service to generate resume pdf based on user self description, resume content and job description.
 */
export const generateResumePdf = async ({ interviewReportId }) => {
    const response = await api.post(`/api/interview/resume/pdf/${interviewReportId}`, null, {
        responseType: "blob"
    })

    return response.data
}

/**
 * @description Service to delete an interview report.
 */
export const deleteInterviewReport = async (interviewId) => {
    const response = await api.delete(`/api/interview/report/${interviewId}`)
    return response.data
}

export const evaluateAnswer = async ({ question, userAnswer, expectedAnswer, questionType, jobTitle }) => {
    const response = await api.post("/api/interview/mock/feedback", {
        question,
        userAnswer,
        expectedAnswer,
        questionType,
        jobTitle
    })
    return response.data
}

/**
 * @description Service to update completed tasks for a preparation plan.
 */
export const updateCompletedTasks = async (interviewId, completedTasks) => {
    const response = await api.patch(`/api/interview/report/${interviewId}/tasks`, { completedTasks })
    return response.data
}
