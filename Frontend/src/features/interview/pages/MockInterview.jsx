import React, { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router"
import { useInterview } from "../hooks/useInterview.js"
import { useSpeechRecognition } from "../hooks/useSpeechRecognition.js"
import { evaluateAnswer } from "../services/interview.api.js"
import "../style/mock-interview.scss"

// ── Helpers ───────────────────────────────────────────────────────────────────
const scoreColor = (n) => n >= 7 ? "high" : n >= 5 ? "medium" : "low"

const ScoreBar = ({ label, value }) => (
    <div className="score-bar">
        <div className="score-bar__label">
            <span>{label}</span>
            <span>{value}/10</span>
        </div>
        <div className="score-bar__track">
            <div
                className={`score-bar__fill score-bar__fill--${scoreColor(value)}`}
                style={{ width: `${value * 10}%` }}
            />
        </div>
    </div>
)

// ── Session Summary ───────────────────────────────────────────────────────────
const SessionSummary = ({ results, report, onRestart, onBack }) => {
    const avg = results.length
        ? Math.round(results.reduce((s, r) => s + r.feedback.overallScore, 0) / results.length * 10) / 10
        : 0

    return (
        <div className="summary-page">
            <div className="summary-card">
                <div className="summary-card__trophy">
                    {avg >= 7 ? "🏆" : avg >= 5 ? "🎯" : "💪"}
                </div>
                <h1 className="summary-card__title">Session Complete!</h1>
                <p className="summary-card__sub">
                    You answered {results.length} question{results.length !== 1 ? "s" : ""} for <strong>{report?.title}</strong>
                </p>

                <div className="summary-score">{avg}<span>/10</span></div>
                <p className="summary-label">Average Score</p>

                <div className="summary-breakdown">
                    {results.map((r, i) => (
                        <div key={i} className="summary-breakdown__row">
                            <span className="summary-breakdown__row__q">Q{i + 1}: {r.question}</span>
                            <span className="summary-breakdown__row__score"
                                style={{ color: r.feedback.overallScore >= 7 ? "#3fb950" : r.feedback.overallScore >= 5 ? "#f5a623" : "#ff4d4d" }}>
                                {r.feedback.overallScore}/10
                            </span>
                        </div>
                    ))}
                </div>

                <div className="summary-actions">
                    <button className="btn-secondary" onClick={onBack}>← Back to Report</button>
                    <button className="btn-primary" onClick={onRestart}>🔁 Try Again</button>
                </div>
            </div>
        </div>
    )
}

// ── Main Component ────────────────────────────────────────────────────────────
const MockInterview = () => {
    const { interviewId } = useParams()
    const navigate = useNavigate()
    const { report, getReportById, loading } = useInterview()

    // session state
    const STATES = { INTRO: "intro", QUESTION: "question", EVALUATING: "evaluating", FEEDBACK: "feedback", DONE: "done" }
    const [ sessionState, setSessionState ] = useState(STATES.INTRO)
    const [ currentIndex, setCurrentIndex ] = useState(0)
    const [ feedback, setFeedback ] = useState(null)
    const [ results, setResults ] = useState([])
    const [ typedAnswer, setTypedAnswer ] = useState("")
    const [ inputMode, setInputMode ] = useState("voice") // "voice" | "type"

    const { transcript, interimTranscript, isRecording, isSupported, startRecording, stopRecording, resetTranscript } = useSpeechRecognition()

    useEffect(() => {
        if (interviewId) getReportById(interviewId)
    }, [ interviewId ])

    if (loading || !report) {
        return (
            <div className="mock-page">
                <div className="evaluating-state">
                    <div className="evaluating-state__spinner" />
                    <p>Loading your interview...</p>
                </div>
            </div>
        )
    }

    // Combine all questions with type tag
    const allQuestions = [
        ...report.technicalQuestions.map(q => ({ ...q, type: "technical" })),
        ...report.behavioralQuestions.map(q => ({ ...q, type: "behavioral" })),
    ]

    const current = allQuestions[currentIndex]
    const totalQ = allQuestions.length
    const progress = ((currentIndex) / totalQ) * 100
    const userAnswer = inputMode === "voice" ? transcript : typedAnswer
    const displayText = inputMode === "voice" ? transcript + interimTranscript : typedAnswer

    // ── Handlers ──────────────────────────────────────────────────────────────
    const handleStart = () => {
        setSessionState(STATES.QUESTION)
        setCurrentIndex(0)
        setResults([])
        resetTranscript()
        setTypedAnswer("")
        setFeedback(null)
    }

    const handleMicToggle = () => {
        if (isRecording) {
            stopRecording()
        } else {
            resetTranscript()
            startRecording()
        }
    }

    const handleSubmit = async () => {
        if (!userAnswer.trim()) return
        if (isRecording) stopRecording()

        setSessionState(STATES.EVALUATING)

        try {
            const data = await evaluateAnswer({
                question: current.question,
                userAnswer: userAnswer.trim(),
                expectedAnswer: current.answer,
                questionType: current.type,
                jobTitle: report.title,
            })
            setFeedback(data.feedback)
            setResults(prev => [ ...prev, { question: current.question, feedback: data.feedback } ])
            setSessionState(STATES.FEEDBACK)
        } catch (err) {
            console.error(err)
            setSessionState(STATES.QUESTION)
            alert(err?.response?.data?.message || err?.message || "Failed to evaluate answer. Please try again.")
        }
    }

    const handleNext = () => {
        if (currentIndex + 1 >= totalQ) {
            setSessionState(STATES.DONE)
        } else {
            setCurrentIndex(i => i + 1)
            setFeedback(null)
            resetTranscript()
            setTypedAnswer("")
            setSessionState(STATES.QUESTION)
        }
    }

    // ── Render states ─────────────────────────────────────────────────────────
    if (sessionState === STATES.DONE) {
        return (
            <SessionSummary
                results={results}
                report={report}
                onRestart={handleStart}
                onBack={() => navigate(`/interview/${interviewId}`)}
            />
        )
    }

    if (sessionState === STATES.INTRO) {
        return (
            <div className="mock-page">
                <div className="mock-intro">
                    <div className="mock-intro__icon">🎤</div>
                    <h1 className="mock-intro__title">Mock Interview</h1>
                    <p className="mock-intro__sub">
                        Practice answering questions from your report.<br />
                        Speak or type your answers and get <strong>AI feedback</strong> instantly.
                    </p>
                    <div className="mock-intro__stats">
                        <div className="mock-intro__stat">
                            <strong>{report.technicalQuestions.length}</strong>
                            <span>Technical</span>
                        </div>
                        <div className="mock-intro__stat">
                            <strong>{report.behavioralQuestions.length}</strong>
                            <span>Behavioral</span>
                        </div>
                        <div className="mock-intro__stat">
                            <strong>{totalQ}</strong>
                            <span>Total</span>
                        </div>
                    </div>
                    <button className="mock-intro__start" onClick={handleStart}>
                        Start Interview →
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="mock-page">

            {/* Header */}
            <div className="mock-header">
                <button className="mock-header__back" onClick={() => navigate(`/interview/${interviewId}`)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6" />
                    </svg>
                    Back to Report
                </button>
                <h1 className="mock-header__title">{report.title}</h1>
                <div className="mock-header__meta">
                    <span className={`mock-header__badge mock-header__badge--${current?.type}`}>
                        {current?.type}
                    </span>
                    <span style={{ fontSize: "0.82rem", color: "#7d8590" }}>
                        Question {currentIndex + 1} of {totalQ}
                    </span>
                </div>
            </div>

            {/* Progress */}
            <div className="mock-progress">
                <div className="mock-progress__label">{Math.round(progress)}% complete</div>
                <div className="mock-progress__bar">
                    <div className="mock-progress__fill" style={{ width: `${progress}%` }} />
                </div>
            </div>

            {/* Question card */}
            <div className="mock-card">
                <p className="mock-card__label">Question {currentIndex + 1}</p>
                <p className="mock-card__question">{current?.question}</p>
                <p className="mock-card__intention">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    Interviewer is checking: {current?.intention}
                </p>
            </div>

            {/* Evaluating state */}
            {sessionState === STATES.EVALUATING && (
                <div className="mock-card">
                    <div className="evaluating-state">
                        <div className="evaluating-state__spinner" />
                        <p>AI is evaluating your answer...</p>
                    </div>
                </div>
            )}

            {/* Answer input */}
            {sessionState === STATES.QUESTION && (
                <div className="answer-card">
                    <p className="mock-card__label">Your Answer</p>

                    <textarea
                        className={isRecording ? "live" : ""}
                        placeholder={
                            inputMode === "voice"
                                ? isRecording
                                    ? "🎙 Listening... speak now"
                                    : "Press the mic button and start speaking..."
                                : "Type your answer here..."
                        }
                        value={displayText}
                        onChange={inputMode === "type" ? (e) => setTypedAnswer(e.target.value) : undefined}
                        readOnly={inputMode === "voice"}
                    />

                    <div className="answer-controls">
                        {/* Mic or Type toggle */}
                        {isSupported && (
                            <button
                                className={`answer-controls__mic ${isRecording ? "answer-controls__mic--recording" : ""}`}
                                onClick={inputMode === "voice" ? handleMicToggle : () => { setInputMode("voice"); resetTranscript(); setTypedAnswer("") }}
                            >
                                {inputMode === "voice" && isRecording
                                    ? <><div className="mic-dot" /> Stop Recording</>
                                    : inputMode === "voice"
                                        ? <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></svg> Hold to Speak</>
                                        : "🎙 Switch to Voice"
                                }
                            </button>
                        )}

                        {!isSupported && (
                            <span className="answer-controls__no-support">
                                ⚠ Voice not supported in this browser
                            </span>
                        )}

                        {inputMode === "voice" && (
                            <button
                                className="answer-controls__mic"
                                onClick={() => { setInputMode("type"); if (isRecording) stopRecording(); }}
                            >
                                ⌨ Type Instead
                            </button>
                        )}

                        <button
                            className="answer-controls__submit"
                            onClick={handleSubmit}
                            disabled={!userAnswer.trim()}
                        >
                            Submit Answer →
                        </button>
                    </div>
                </div>
            )}

            {/* Feedback card */}
            {sessionState === STATES.FEEDBACK && feedback && (
                <div className="feedback-card">
                    <div className="feedback-header">
                        <h3>AI Feedback</h3>
                        <div className="feedback-header__score">
                            {feedback.overallScore} <span>/ 10</span>
                        </div>
                    </div>

                    <div className="score-bars">
                        <ScoreBar label="Relevance"    value={feedback.scores.relevance} />
                        <ScoreBar label="Confidence"   value={feedback.scores.confidence} />
                        <ScoreBar label="Depth"        value={feedback.scores.depth} />
                        <ScoreBar label="Completeness" value={feedback.scores.completeness} />
                    </div>

                    {feedback.strengths?.length > 0 && (
                        <div className="feedback-section feedback-section--good">
                            <h4>✅ What you did well</h4>
                            <ul>{feedback.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul>
                        </div>
                    )}

                    {feedback.improvements?.length > 0 && (
                        <div className="feedback-section feedback-section--improve">
                            <h4>⚠ What to improve</h4>
                            <ul>{feedback.improvements.map((s, i) => <li key={i}>{s}</li>)}</ul>
                        </div>
                    )}

                    {feedback.idealAnswerHint && (
                        <div className="feedback-section feedback-section--hint">
                            <h4>💡 Ideal answer covers</h4>
                            <p>{feedback.idealAnswerHint}</p>
                        </div>
                    )}
                </div>
            )}

            {/* Next button */}
            {sessionState === STATES.FEEDBACK && (
                <button className="mock-next-btn" onClick={handleNext}>
                    {currentIndex + 1 >= totalQ ? "View Session Summary 🏆" : "Next Question →"}
                </button>
            )}

        </div>
    )
}

export default MockInterview
