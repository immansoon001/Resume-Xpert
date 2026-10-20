import { getAllInterviewReports, generateInterviewReport, getInterviewReportById, generateResumeHtml, generateResumePdf, deleteInterviewReport, updateCompletedTasks } from "../services/interview.api"
import { useContext, useEffect, useState } from "react"
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
        try {
            const response = await generateInterviewReport({ jobDescription, selfDescription, resumeFile, targetLevel })
            if (response && response.interviewReport) {
                setReport(response.interviewReport)
                return response.interviewReport
            }
            throw new Error(response?.message || "Failed to generate report")
        } catch (error) {
            console.error("Error generating report:", error)
            throw error
        } finally {
            setLoading(false)
        }
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

    const [downloadingPdf, setDownloadingPdf] = useState(false)

    const getResumePdf = async (interviewReportId) => {
        setDownloadingPdf(true)
        try {
            const response = await generateResumePdf({ interviewReportId })
            
            // Handle if backend returned JSON error inside blob
            if (response instanceof Blob && response.type && response.type.includes("application/json")) {
                const text = await response.text()
                const errObj = JSON.parse(text)
                throw new Error(errObj.message || "Failed to generate PDF")
            }

            const blob = new Blob([ response ], { type: "application/pdf" })
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement("a")
            link.href = url
            link.setAttribute("download", `ATS_Resume_${interviewReportId}.pdf`)
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            setTimeout(() => window.URL.revokeObjectURL(url), 1000)
            return true
        }
        catch (error) {
            console.error("Failed to generate PDF on server:", error)
            // Client-side print fallback: fetch HTML resume and open browser print dialog
            try {
                const html = await getResumeHtml(interviewReportId)
                const printWindow = window.open("", "_blank")
                if (printWindow) {
                    printWindow.document.write(html)
                    printWindow.document.close()
                    printWindow.focus()
                    setTimeout(() => {
                        printWindow.print()
                    }, 500)
                    return true
                }
            } catch (fallbackErr) {
                console.error("Print fallback error:", fallbackErr)
            }
            alert("Could not generate PDF directly. Please open 'Preview Resume' and click 'Print' to save as PDF.")
            return false
        } finally {
            setDownloadingPdf(false)
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

    return { loading, report, reports, generateReport, getReportById, getReports, getResumeHtml, getResumePdf, deleteReport, toggleTask, toggleDayAllTasks, downloadingPdf }

}