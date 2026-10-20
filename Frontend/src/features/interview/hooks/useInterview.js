import { getAllInterviewReports, generateInterviewReport, getInterviewReportById, generateResumeHtml, generateResumePdf, deleteInterviewReport, updateCompletedTasks } from "../services/interview.api"
import { useContext, useEffect } from "react"
import { InterviewContext } from "../interview.context"
import { useParams } from "react-router"


export const useInterview = () => {

    const context = useContext(InterviewContext)
    const { interviewId } = useParams()

    if (!context) {
        throw new Error("useInterview must be used within an InterviewProvider")
    }

    const { loading, setLoading, report, setReport, reports, setReports } = context

    const generateReport = async ({ jobDescription, selfDescription, resumeFile, targetLevel = "mid" }) => {
        setLoading(true)
        let response = null
        try {
            response = await generateInterviewReport({ jobDescription, selfDescription, resumeFile, targetLevel })
            setReport(response.interviewReport)
        } catch (error) {
            console.log(error)
        } finally {
            setLoading(false)
        }

        return response.interviewReport
    }

    const getReportById = async (interviewId) => {
        setLoading(true)
        let response = null
        try {
            response = await getInterviewReportById(interviewId)
            setReport(response.interviewReport)
        } catch (error) {
            console.log(error)
        } finally {
            setLoading(false)
        }
        return response.interviewReport
    }

    const getReports = async () => {
        setLoading(true)
        let response = null
        try {
            response = await getAllInterviewReports()
            setReports(response.interviewReports)
        } catch (error) {
            console.log(error)
        } finally {
            setLoading(false)
        }

        return response.interviewReports
    }

    const getResumeHtml = async (interviewReportId) => {
        try {
            const data = await generateResumeHtml({ interviewReportId })
            return data.html
        } catch (error) {
            console.error("Failed to generate resume preview:", error)
            throw error
        }
    }

    const getResumePdf = async (interviewReportId) => {
        setLoading(true)
        let response = null
        try {
            response = await generateResumePdf({ interviewReportId })
            const url = window.URL.createObjectURL(new Blob([ response ], { type: "application/pdf" }))
            const link = document.createElement("a")
            link.href = url
            link.setAttribute("download", `resume_${interviewReportId}.pdf`)
            document.body.appendChild(link)
            link.click()
        }
        catch (error) {
            console.log(error)
        } finally {
            setLoading(false)
        }
    }

    const deleteReport = async (interviewId) => {
        setLoading(true)
        try {
            await deleteInterviewReport(interviewId)
            // Remove the deleted report from the local state
            setReports(prevReports => prevReports.filter(r => r._id !== interviewId))
            if (report && report._id === interviewId) {
                setReport(null)
            }
        } catch (error) {
            console.log(error)
        } finally {
            setLoading(false)
        }
    }

    const toggleTask = async (taskId) => {
        if (!report) return

        const currentTasks = report.completedTasks || []
        const isCompleted = currentTasks.includes(taskId)
        const updatedTasks = isCompleted
            ? currentTasks.filter(id => id !== taskId)
            : [ ...currentTasks, taskId ]

        // Optimistically update report
        setReport(prev => ({
            ...prev,
            completedTasks: updatedTasks
        }))

        try {
            await updateCompletedTasks(report._id, updatedTasks)
        } catch (error) {
            console.error("Failed to sync completed tasks:", error)
            // Rollback on failure
            setReport(prev => ({
                ...prev,
                completedTasks: currentTasks
            }))
        }
    }

    const toggleDayAllTasks = async (dayNumber, taskIds) => {
        if (!report) return

        const currentTasks = report.completedTasks || []
        const allDayCompleted = taskIds.every(id => currentTasks.includes(id))

        let updatedTasks
        if (allDayCompleted) {
            // Uncheck all for this day
            updatedTasks = currentTasks.filter(id => !taskIds.includes(id))
        } else {
            // Check all for this day
            const set = new Set([ ...currentTasks, ...taskIds ])
            updatedTasks = Array.from(set)
        }

        setReport(prev => ({
            ...prev,
            completedTasks: updatedTasks
        }))

        try {
            await updateCompletedTasks(report._id, updatedTasks)
        } catch (error) {
            console.error("Failed to sync completed tasks:", error)
            setReport(prev => ({
                ...prev,
                completedTasks: currentTasks
            }))
        }
    }

    useEffect(() => {
        if (interviewId) {
            getReportById(interviewId)
        } else {
            getReports()
        }
    }, [ interviewId ])

    return { loading, report, reports, generateReport, getReportById, getReports, getResumeHtml, getResumePdf, deleteReport, toggleTask, toggleDayAllTasks }

}