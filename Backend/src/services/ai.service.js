const { GoogleGenAI } = require("@google/genai")
const { z } = require("zod")
const { zodToJsonSchema } = require("zod-to-json-schema")
const puppeteer = require("puppeteer")

const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_GENAI_API_KEY
})


const interviewReportSchema = z.object({
    matchScore: z.number().describe("A score between 0 and 100 indicating how well the candidate's profile matches the job describe"),
    technicalQuestions: z.array(z.object({
        question: z.string().describe("The technical question can be asked in the interview"),
        intention: z.string().describe("The intention of interviewer behind asking this question"),
        answer: z.string().describe("How to answer this question, what points to cover, what approach to take etc.")
    })).describe("Technical questions that can be asked in the interview along with their intention and how to answer them"),
    behavioralQuestions: z.array(z.object({
        question: z.string().describe("The technical question can be asked in the interview"),
        intention: z.string().describe("The intention of interviewer behind asking this question"),
        answer: z.string().describe("How to answer this question, what points to cover, what approach to take etc.")
    })).describe("Behavioral questions that can be asked in the interview along with their intention and how to answer them"),
    skillGaps: z.array(z.object({
        skill: z.string().describe("The skill which the candidate is lacking"),
        severity: z.enum(["low", "medium", "high"]).describe("The severity of this skill gap, i.e. how important is this skill for the job and how much it can impact the candidate's chances")
    })).describe("List of skill gaps in the candidate's profile along with their severity"),
    preparationPlan: z.array(z.object({
        day: z.number().describe("The day number in the preparation plan, starting from 1"),
        focus: z.string().describe("The main focus of this day in the preparation plan, e.g. data structures, system design, mock interviews etc."),
        tasks: z.array(z.string()).describe("List of tasks to be done on this day to follow the preparation plan, e.g. read a specific book or article, solve a set of problems, watch a video etc.")
    })).describe("A day-wise preparation plan for the candidate to follow in order to prepare for the interview effectively"),
    title: z.string().describe("The title of the job for which the interview report is generated"),
})

const answerFeedbackSchema = z.object({
    overallScore: z.number().min(0).max(10).describe("Overall quality score of the candidate's answer from 0 to 10"),
    scores: z.object({
        relevance: z.number().min(0).max(10).describe("How relevant the answer is to the question asked"),
        confidence: z.number().min(0).max(10).describe("How confident and fluent the answer sounds"),
        depth: z.number().min(0).max(10).describe("For behavioral: how well STAR format is followed. For technical: depth of explanation"),
        completeness: z.number().min(0).max(10).describe("How complete and thorough the answer covers the key points")
    }),
    strengths: z.array(z.string()).describe("2-3 specific things the candidate did well in their answer"),
    improvements: z.array(z.string()).describe("2-3 specific things the candidate should improve in their answer"),
    idealAnswerHint: z.string().describe("A brief hint of what an ideal answer would cover, without giving the full answer away"),
})

async function generateInterviewReport({ resume, selfDescription, jobDescription, targetLevel = "mid" }) {

    const levelGuidance = {
        junior: "Focus on fundamentals, core concepts, syntax, basic problem-solving, and growth potential.",
        mid: "Focus on best practices, clean code, component/modular design patterns, debugging, and cross-functional team collaboration.",
        senior: "Focus on system design trade-offs, architecture, scalability, deep technical domain mastery, performance optimization, and mentorship.",
        lead: "Focus on large-scale architectural strategy, technical leadership, cross-team roadmapping, risk mitigation, and engineering excellence.",
        faang: "Focus on rigorous data structures & algorithms, distributed systems scalability, low-level optimization, and strict STAR behavioral excellence."
    }[targetLevel.toLowerCase()] || "Focus on practical industry competence and relevant technical mastery."

    const prompt = `Generate an interview report for a candidate targeting a ${targetLevel.toUpperCase()} level role.
${levelGuidance}

Candidate Details:
Resume: ${resume}
Self Description: ${selfDescription}
Job Description: ${jobDescription}
Target Seniority Level: ${targetLevel.toUpperCase()}
`

    const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: zodToJsonSchema(interviewReportSchema),
        }
    })

    return JSON.parse(response.text)
}



async function generatePdfFromHtml(htmlContent) {
    const browser = await puppeteer.launch()
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: "networkidle0" })

    const pdfBuffer = await page.pdf({
        format: "A4", margin: {
            top: "20mm",
            bottom: "20mm",
            left: "15mm",
            right: "15mm"
        }
    })

    await browser.close()

    return pdfBuffer
}

async function generateResumeHtml({ resume, selfDescription, jobDescription }) {
    const resumePdfSchema = z.object({
        html: z.string().describe("The complete HTML content of the resume with modern, clean embedded CSS suitable for rendering in both browser and PDF converter.")
    })

    const prompt = `Generate an ATS-optimized, high-impact resume in HTML format for a candidate with the following details:
Resume / Background: ${resume}
Self Description: ${selfDescription}
Target Job Description: ${jobDescription}

Requirements:
1. The response must be a JSON object with a single field "html" containing full HTML document with embedded CSS (<style>).
2. The design must be clean, modern, executive-level, and ATS-friendly (semantic tags, standard section headings: Summary, Experience, Skills, Projects, Education, Certifications).
3. Tailor the bullet points to directly highlight achievements, quantifiable metrics (e.g. +30% performance, $50k cost reduction), and keywords matching the Job Description.
4. Clean typography with system fonts (system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif), subtle dark accents (#1a202c, #2b6cb0), clear section dividers, and print-ready spacing.
5. Max length: 1-2 pages formatted.
`

    const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: zodToJsonSchema(resumePdfSchema),
        }
    })

    const jsonContent = JSON.parse(response.text)
    return jsonContent.html
}

async function generateResumePdf({ resume, selfDescription, jobDescription }) {
    const html = await generateResumeHtml({ resume, selfDescription, jobDescription })
    const pdfBuffer = await generatePdfFromHtml(html)
    return pdfBuffer
}

async function evaluateAnswer({ question, userAnswer, expectedAnswer, questionType, jobTitle }) {
    const prompt = `You are an experienced interviewer hiring for the role of: ${jobTitle}.

Evaluate the candidate's answer below. Be strict but fair — focus on what a real interviewer would care about.

Question Type: ${questionType}
Question: ${question}
Candidate's Answer: ${userAnswer}
Reference Answer (for your context only — do NOT repeat it in feedback): ${expectedAnswer}

For behavioral questions, check if they followed the STAR format (Situation, Task, Action, Result).
For technical questions, check accuracy, depth, and use of concrete examples.
`

    const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: zodToJsonSchema(answerFeedbackSchema),
        }
    })

    return JSON.parse(response.text)
}

module.exports = { generateInterviewReport, generateResumeHtml, generateResumePdf, evaluateAnswer }