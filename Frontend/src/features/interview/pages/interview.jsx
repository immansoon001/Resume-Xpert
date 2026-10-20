import React, { useState, useEffect, useRef } from 'react'
import '../style/interview.scss'
import { useInterview } from '../hooks/useInterview.js'
import { useNavigate, useParams } from 'react-router'




const NAV_ITEMS = [
    { id: 'technical', label: 'Technical Questions', icon: (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>) },
    { id: 'behavioral', label: 'Behavioral Questions', icon: (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>) },
    { id: 'roadmap', label: 'Road Map', icon: (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11" /></svg>) },
]

// ── Sub-components ────────────────────────────────────────────────────────────
const QuestionCard = ({ item, index }) => {
    const [ open, setOpen ] = useState(false)
    return (
        <div className='q-card'>
            <div className='q-card__header' onClick={() => setOpen(o => !o)}>
                <span className='q-card__index'>Q{index + 1}</span>
                <p className='q-card__question'>{item.question}</p>
                <span className={`q-card__chevron ${open ? 'q-card__chevron--open' : ''}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
                </span>
            </div>
            {open && (
                <div className='q-card__body'>
                    <div className='q-card__section'>
                        <span className='q-card__tag q-card__tag--intention'>Intention</span>
                        <p>{item.intention}</p>
                    </div>
                    <div className='q-card__section'>
                        <span className='q-card__tag q-card__tag--answer'>Model Answer</span>
                        <p>{item.answer}</p>
                    </div>
                </div>
            )}
        </div>
    )
}

const RoadMapDay = ({ day, completedTasks = [], onToggleTask, onToggleDayAllTasks }) => {
    const dayTaskIds = day.tasks.map((_, i) => `day-${day.day}-task-${i}`)
    const completedCount = dayTaskIds.filter(id => completedTasks.includes(id)).length
    const isAllDone = completedCount === day.tasks.length && day.tasks.length > 0
    const isProgress = completedCount > 0 && !isAllDone

    return (
        <div className={`roadmap-day ${isAllDone ? 'roadmap-day--completed' : ''}`}>
            <div className='roadmap-day__header'>
                <div className='roadmap-day__header-left'>
                    <span className='roadmap-day__badge'>Day {day.day}</span>
                    <h3 className='roadmap-day__focus'>{day.focus}</h3>
                </div>
                <div className='roadmap-day__header-right'>
                    <span className={`roadmap-day__status ${isAllDone ? 'roadmap-day__status--done' : isProgress ? 'roadmap-day__status--progress' : 'roadmap-day__status--pending'}`}>
                        {isAllDone ? '✓ Completed' : isProgress ? `${completedCount}/${day.tasks.length} Done` : 'Pending'}
                    </span>
                    <button
                        className='roadmap-day__toggle-all-btn'
                        onClick={() => onToggleDayAllTasks(day.day, dayTaskIds)}
                        title={isAllDone ? 'Mark all as incomplete' : 'Mark all as completed'}
                    >
                        {isAllDone ? 'Reset' : 'Mark All'}
                    </button>
                </div>
            </div>
            <ul className='roadmap-day__tasks'>
                {day.tasks.map((task, i) => {
                    const taskId = `day-${day.day}-task-${i}`
                    const isChecked = completedTasks.includes(taskId)
                    return (
                        <li
                            key={taskId}
                            className={`roadmap-day__task-item ${isChecked ? 'roadmap-day__task-item--checked' : ''}`}
                            onClick={() => onToggleTask(taskId)}
                        >
                            <div className={`roadmap-day__checkbox ${isChecked ? 'roadmap-day__checkbox--checked' : ''}`}>
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                            </div>
                            <span className='roadmap-day__task-text'>{task}</span>
                        </li>
                    )
                })}
            </ul>
        </div>
    )
}

// ── Resume Preview Modal ──────────────────────────────────────────────────────
const ResumePreviewModal = ({ isOpen, onClose, interviewId, onDownloadPdf, getResumeHtml, downloadingPdf }) => {
    const [ html, setHtml ] = useState("")
    const [ loading, setLoading ] = useState(false)
    const [ copied, setCopied ] = useState(false)
    const [ error, setError ] = useState(null)
    const iframeRef = useRef(null)

    useEffect(() => {
        if (isOpen && interviewId) {
            setLoading(true)
            setError(null)
            getResumeHtml(interviewId)
                .then(resHtml => {
                    setHtml(resHtml)
                })
                .catch(err => {
                    console.error(err)
                    setError("Failed to load resume preview.")
                })
                .finally(() => setLoading(false))
        }
    }, [ isOpen, interviewId ])

    if (!isOpen) return null

    const handleCopy = () => {
        if (!html) return
        navigator.clipboard.writeText(html)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handlePrint = () => {
        if (iframeRef.current && iframeRef.current.contentWindow) {
            iframeRef.current.contentWindow.print()
        }
    }

    return (
        <div className='resume-modal-overlay' onClick={onClose}>
            <div className='resume-modal' onClick={(e) => e.stopPropagation()}>
                <div className='resume-modal__header'>
                    <div className='resume-modal__title-group'>
                        <span className='resume-modal__icon'>📄</span>
                        <div>
                            <h3>AI-Tailored ATS Resume</h3>
                            <p>Optimized for target job requirements & ATS parsing</p>
                        </div>
                    </div>
                    <div className='resume-modal__actions'>
                        <button
                            className='resume-modal__btn resume-modal__btn--secondary'
                            onClick={handleCopy}
                            disabled={loading || !html}
                            title="Copy HTML to clipboard"
                        >
                            {copied ? '✓ Copied' : '📋 Copy Code'}
                        </button>
                        <button
                            className='resume-modal__btn resume-modal__btn--secondary'
                            onClick={handlePrint}
                            disabled={loading || !html}
                            title="Print Resume"
                        >
                            🖨️ Print
                        </button>
                        <button
                            className='resume-modal__btn resume-modal__btn--primary'
                            onClick={() => onDownloadPdf(interviewId)}
                            disabled={loading || downloadingPdf}
                        >
                            {downloadingPdf ? '⏳ Generating PDF...' : '📥 Download PDF'}
                        </button>
                        <button
                            className='resume-modal__close'
                            onClick={onClose}
                            title="Close modal"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                <div className='resume-modal__body'>
                    {loading && (
                        <div className='resume-modal__loading'>
                            <div className='resume-modal__spinner' />
                            <p>AI is generating your tailored ATS resume...</p>
                        </div>
                    )}

                    {error && (
                        <div className='resume-modal__error'>
                            <p>⚠️ {error}</p>
                            <button onClick={() => {
                                setLoading(true)
                                setError(null)
                                getResumeHtml(interviewId).then(setHtml).catch(() => setError("Failed to load preview.")).finally(() => setLoading(false))
                            }}>Retry</button>
                        </div>
                    )}

                    {!loading && !error && html && (
                        <div className='resume-modal__paper'>
                            <iframe
                                ref={iframeRef}
                                title="Resume Preview"
                                srcDoc={html}
                                className='resume-modal__iframe'
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

// ── Main Component ────────────────────────────────────────────────────────────
const Interview = () => {
    const [ activeNav, setActiveNav ] = useState('technical')
    const [ isResumeModalOpen, setIsResumeModalOpen ] = useState(false)
    const { report, getReportById, loading, getResumeHtml, getResumePdf, toggleTask, toggleDayAllTasks, downloadingPdf } = useInterview()
    const { interviewId } = useParams()
    const navigate = useNavigate()


    useEffect(() => {
        if (interviewId) {
            getReportById(interviewId)
        }
    }, [ interviewId ])



    if (loading || !report) {
        return (
            <main className='loading-screen'>
                <h1>Loading your interview plan...</h1>
            </main>
        )
    }

    const scoreColor =
        report.matchScore >= 80 ? 'score--high' :
            report.matchScore >= 60 ? 'score--mid' : 'score--low'

    const levelBadges = {
        junior: { label: "Junior / Entry", color: "#38bdf8" },
        mid: { label: "Mid-Level", color: "#a78bfa" },
        senior: { label: "Senior Level", color: "#f5a623" },
        lead: { label: "Staff / Lead", color: "#ff2d78" },
        faang: { label: "FAANG Tier", color: "#3fb950" },
    }
    const currentLevel = levelBadges[report.targetLevel?.toLowerCase()] || levelBadges.mid


    return (
        <div className='interview-page'>
            <div className='interview-layout'>

                {/* ── Left Nav ── */}
                <nav className='interview-nav'>
                    <div className="nav-content">
                        <p className='interview-nav__label'>Sections</p>
                        {NAV_ITEMS.map(item => (
                            <button
                                key={item.id}
                                className={`interview-nav__item ${activeNav === item.id ? 'interview-nav__item--active' : ''}`}
                                onClick={() => setActiveNav(item.id)}
                            >
                                <span className='interview-nav__icon'>{item.icon}</span>
                                {item.label}
                            </button>
                        ))}
                    </div>
                    <div className='interview-nav__action-group'>
                        <button
                            onClick={() => navigate(`/interview/${interviewId}/mock`)}
                            className='button primary-button'
                            style={{ marginBottom: '0.6rem', background: 'linear-gradient(135deg,#ff2d78,#c0166e)' }}
                        >
                            <svg height="0.8rem" style={{ marginRight: "0.6rem" }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                                <line x1="12" y1="19" x2="12" y2="23" />
                                <line x1="8" y1="23" x2="16" y2="23" />
                            </svg>
                            Mock Interview
                        </button>
                        <button
                            onClick={() => setIsResumeModalOpen(true)}
                            className='button primary-button'
                            style={{ marginBottom: '0.6rem', background: 'linear-gradient(135deg,#2563eb,#1d4ed8)' }}
                        >
                            <svg height="0.8rem" style={{ marginRight: "0.6rem" }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                            </svg>
                            Preview Resume
                        </button>
                        <button
                            onClick={() => { getResumePdf(interviewId) }}
                            className='button secondary-button'
                            disabled={downloadingPdf}
                            style={{
                                width: '100%',
                                background: '#1c2230',
                                border: '1px solid #2a3348',
                                color: '#e6edf3',
                                cursor: downloadingPdf ? 'wait' : 'pointer',
                                opacity: downloadingPdf ? 0.7 : 1
                            }}
                        >
                            {downloadingPdf ? (
                                <span>⏳ Generating PDF...</span>
                            ) : (
                                <>
                                    <svg height={"0.8rem"} style={{ marginRight: "0.6rem" }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M10.6144 17.7956 11.492 15.7854C12.2731 13.9966 13.6789 12.5726 15.4325 11.7942L17.8482 10.7219C18.6162 10.381 18.6162 9.26368 17.8482 8.92277L15.5079 7.88394C13.7092 7.08552 12.2782 5.60881 11.5105 3.75894L10.6215 1.61673C10.2916.821765 9.19319.821767 8.8633 1.61673L7.97427 3.75892C7.20657 5.60881 5.77553 7.08552 3.97685 7.88394L1.63658 8.92277C.868537 9.26368.868536 10.381 1.63658 10.7219L4.0523 11.7942C5.80589 12.5726 7.21171 13.9966 7.99275 15.7854L8.8704 17.7956C9.20776 18.5682 10.277 18.5682 10.6144 17.7956ZM19.4014 22.6899 19.6482 22.1242C20.0882 21.1156 20.8807 20.3125 21.8695 19.8732L22.6299 19.5353C23.0412 19.3526 23.0412 18.7549 22.6299 18.5722L21.9121 18.2532C20.8978 17.8026 20.0911 16.9698 19.6586 15.9269L19.4052 15.3156C19.2285 14.8896 18.6395 14.8896 18.4628 15.3156L18.2094 15.9269C17.777 16.9698 16.9703 17.8026 15.956 18.2532L15.2381 18.5722C14.8269 18.7549 14.8269 19.3526 15.2381 19.5353L15.9985 19.8732C16.9874 20.3125 17.7798 21.1156 18.2198 22.1242L18.4667 22.6899C18.6473 23.104 19.2207 23.104 19.4014 22.6899Z"></path></svg>
                                    Download PDF
                                </>
                            )}
                        </button>
                    </div>
                </nav>

                <div className='interview-divider' />

                {/* ── Center Content ── */}
                <main className='interview-content'>
                    {activeNav === 'technical' && (
                        <section>
                            <div className='content-header'>
                                <h2>Technical Questions</h2>
                                <span className='content-header__count'>{report.technicalQuestions.length} questions</span>
                            </div>
                            <div className='q-list'>
                                {report.technicalQuestions.map((q, i) => (
                                    <QuestionCard key={i} item={q} index={i} />
                                ))}
                            </div>
                        </section>
                    )}

                    {activeNav === 'behavioral' && (
                        <section>
                            <div className='content-header'>
                                <h2>Behavioral Questions</h2>
                                <span className='content-header__count'>{report.behavioralQuestions.length} questions</span>
                            </div>
                            <div className='q-list'>
                                {report.behavioralQuestions.map((q, i) => (
                                    <QuestionCard key={i} item={q} index={i} />
                                ))}
                            </div>
                        </section>
                    )}

                    {activeNav === 'roadmap' && (() => {
                        const completedList = report.completedTasks || []
                        const totalTasks = report.preparationPlan.reduce((acc, d) => acc + d.tasks.length, 0)
                        const completedCount = completedList.length
                        const progressPercent = totalTasks > 0 ? Math.min(100, Math.round((completedCount / totalTasks) * 100)) : 0
                        const completedDaysCount = report.preparationPlan.filter(d => d.tasks.length > 0 && d.tasks.every((_, i) => completedList.includes(`day-${d.day}-task-${i}`))).length
                        const isAllComplete = progressPercent === 100

                        return (
                            <section>
                                <div className='content-header'>
                                    <h2>Preparation Road Map</h2>
                                    <span className='content-header__count'>{report.preparationPlan.length}-day plan</span>
                                </div>

                                {/* Progress Tracker Card */}
                                <div className='roadmap-progress-card'>
                                    <div className='roadmap-progress-card__top'>
                                        <div className='roadmap-progress-card__title-group'>
                                            <h3>Your Prep Progress</h3>
                                            <span className='roadmap-progress-card__badge'>{progressPercent}% Complete</span>
                                        </div>
                                        <div className='roadmap-progress-card__stats'>
                                            <span><strong>{completedCount}</strong> / {totalTasks} Tasks Done</span>
                                            <span>•</span>
                                            <span><strong>{completedDaysCount}</strong> / {report.preparationPlan.length} Days Finished</span>
                                        </div>
                                    </div>

                                    <div className='roadmap-progress-card__bar-track'>
                                        <div
                                            className='roadmap-progress-card__bar-fill'
                                            style={{ width: `${progressPercent}%` }}
                                        />
                                    </div>

                                    {isAllComplete && (
                                        <div className='roadmap-progress-card__celebration'>
                                            <span>🎉 Outstanding! You completed all prep tasks. Ready to practice?</span>
                                            <button onClick={() => navigate(`/interview/${interviewId}/mock`)}>
                                                Launch Mock Interview →
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className='roadmap-list'>
                                    {report.preparationPlan.map((day) => (
                                        <RoadMapDay
                                            key={day.day}
                                            day={day}
                                            completedTasks={completedList}
                                            onToggleTask={toggleTask}
                                            onToggleDayAllTasks={toggleDayAllTasks}
                                        />
                                    ))}
                                </div>
                            </section>
                        )
                    })()}
                </main>

                <div className='interview-divider' />

                {/* ── Right Sidebar ── */}
                <aside className='interview-sidebar'>

                    {/* Match Score */}
                    <div className='match-score'>
                        <p className='match-score__label'>Match Score</p>
                        <div className={`match-score__ring ${scoreColor}`}>
                            <span className='match-score__value'>{report.matchScore}</span>
                            <span className='match-score__pct'>%</span>
                        </div>
                        <p className='match-score__sub'>Strong match for this role</p>
                    </div>

                    <div className='sidebar-divider' />

                    {/* Target Seniority Level */}
                    <div className='seniority-badge-card'>
                        <p className='seniority-badge-card__label'>Target Seniority</p>
                        <div className='seniority-badge-card__tag' style={{ borderColor: currentLevel.color, color: currentLevel.color }}>
                            {currentLevel.label}
                        </div>
                    </div>

                    <div className='sidebar-divider' />

                    {/* Skill Gaps */}
                    <div className='skill-gaps'>
                        <p className='skill-gaps__label'>Skill Gaps</p>
                        <div className='skill-gaps__list'>
                            {report.skillGaps.map((gap, i) => (
                                <span key={i} className={`skill-tag skill-tag--${gap.severity}`}>
                                    {gap.skill}
                                </span>
                            ))}
                        </div>
                    </div>

                </aside>
            </div>

            {/* Resume Preview Modal */}
            <ResumePreviewModal
                isOpen={isResumeModalOpen}
                onClose={() => setIsResumeModalOpen(false)}
                interviewId={interviewId}
                onDownloadPdf={getResumePdf}
                getResumeHtml={getResumeHtml}
                downloadingPdf={downloadingPdf}
            />
        </div>
    )
}

export default Interview