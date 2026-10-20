/**
 * Intelligent Fallback Interview Strategy & Report Builder
 * Generates high quality, tailored interview preparation plans, technical & behavioral questions,
 * skill gap analysis, and day-wise roadmap aligned with the candidate's target role.
 */

function extractJobTitle(jobDescription) {
    if (!jobDescription) return "Software Engineer";
    const firstLine = jobDescription.split("\n")[0].trim();
    const titleMatch = firstLine.match(/(?:Hiring for|Looking for|Role:|Position:|Job Title:)?\s*([A-Za-z0-9\s\/\-\.\+]+?(?:Developer|Engineer|Architect|Specialist|Lead|Manager|Scientist|Consultant|Designer))/i);
    if (titleMatch && titleMatch[1]) {
        return titleMatch[1].replace(/^(?:Role|Position|Job Title|Looking for|Hiring for)\s*:?\s*/i, "").trim();
    }
    if (/frontend|react|vue|angular/i.test(jobDescription)) return "Frontend Engineer";
    if (/backend|node|express|python|django|golang|java/i.test(jobDescription)) return "Backend Developer";
    if (/full\s*stack|mern|mean/i.test(jobDescription)) return "Full Stack Developer";
    if (/devops|cloud|aws|kubernetes/i.test(jobDescription)) return "DevOps / Cloud Engineer";
    if (/ai|ml|machine learning|data science/i.test(jobDescription)) return "AI / Machine Learning Engineer";
    return firstLine.slice(0, 40) || "Software Engineer";
}

function analyzeSkills(profileText, jobText) {
    const commonKeywords = [
        "React", "Node.js", "Express", "MongoDB", "TypeScript", "JavaScript",
        "Next.js", "Python", "SQL", "PostgreSQL", "Docker", "AWS", "Git",
        "REST API", "GraphQL", "Redis", "System Design", "Microservices",
        "CI/CD", "Jest", "Tailwind CSS", "Redux", "Data Structures"
    ];

    const pLower = (profileText || "").toLowerCase();
    const jLower = (jobText || "").toLowerCase();

    const matchedSkills = [];
    const missingSkills = [];

    for (const kw of commonKeywords) {
        const inJob = jLower.includes(kw.toLowerCase());
        const inProfile = pLower.includes(kw.toLowerCase());

        if (inJob && inProfile) {
            matchedSkills.push(kw);
        } else if (inJob && !inProfile) {
            missingSkills.push(kw);
        }
    }

    if (missingSkills.length === 0) {
        missingSkills.push("System Design & Scalability", "Performance Optimization", "Advanced Testing (CI/CD)");
    }

    return { matchedSkills, missingSkills };
}

function generateQuestionsForRole(roleTitle, matchedSkills, missingSkills, targetLevel = "mid") {
    const isSenior = ["senior", "lead", "faang"].includes(targetLevel.toLowerCase());

    const technicalQuestions = [
        {
            question: isSenior
                ? `How would you architect a high-throughput, low-latency microservices architecture for a ${roleTitle} role? Discuss data consistency, caching strategies, and failure mitigation.`
                : `Explain the end-to-end request lifecycle in a modern web application stack for a ${roleTitle}. How do you ensure high performance and clean modular separation?`,
            intention: "Assesses architectural understanding, system-level design tradeoffs, and familiarity with real-world production environments.",
            answer: "Structure the answer using an architectural overview: client-side caching (CDN/SWR), API gateway routing, stateless backend workers, distributed database sharding, and background job queues with Redis. Highlight trade-offs like eventual consistency vs immediate consistency."
        },
        {
            question: `How do you handle state management, asynchronous data fetching, and race conditions in complex frontend or backend workflows?`,
            intention: "Tests deep command of JavaScript/TypeScript concurrency, error boundaries, cancellation tokens (AbortController), and resilient client-server sync.",
            answer: "Discuss using AbortController for in-flight request cancellation, optimistic UI updates with rollback, server-state libraries (TanStack Query/RTK), and idempotency keys on write mutations."
        },
        {
            question: `Describe how you approach database optimization, indexing strategies, and diagnosing slow queries in ${matchedSkills[0] || 'SQL/NoSQL'} databases.`,
            intention: "Evaluates ability to monitor, profile, and tune persistent storage layer bottlenecks.",
            answer: "Walk through using EXPLAIN/explain('executionStats'), creating compound and sparse indexes, avoiding unindexed collection scans, leveraging read replicas, and utilizing in-memory caches (Redis) for heavy read paths."
        },
        {
            question: `How do you design and implement secure authentication, token refresh flows, and role-based access control (RBAC)?`,
            intention: "Validates security fundamentals: JWT vs session cookies, CSRF protection, secure HTTP-only cookies, and fine-grained authorization middleware.",
            answer: "Explain dual-token architecture: short-lived Access Tokens (15m) in memory/secure cookies and rotating Refresh Tokens stored securely. Discuss revocation lists, middleware validation, and principle of least privilege."
        },
        {
            question: `What is your strategy for monitoring, logging, and error tracking in a live production environment?`,
            intention: "Tests real-world operational maturity, observability, and debugging capabilities under pressure.",
            answer: "Cover structured logging (Winston/Pino), APM metrics (Datadog/Prometheus), centralized tracing (OpenTelemetry), error alerting (Sentry), and proactive health check endpoints."
        }
    ];

    const behavioralQuestions = [
        {
            question: "Describe a challenging technical disagreement you had with a team member or stakeholder. How did you resolve it and what was the outcome?",
            intention: "Checks emotional intelligence, objective decision-making with data, and constructive teamwork without ego.",
            answer: "Use STAR method: Explain the situation, the competing technical perspectives, how you created a minimal POC or benchmarked metrics to decide objectively, and how the team aligned on the best path forward."
        },
        {
            question: "Tell me about a time when a critical bug or outage occurred in production. How did you diagnose, mitigate, and prevent recurrence?",
            intention: "Assesses poise under pressure, root cause analysis (RCA), and commitment to engineering safeguards.",
            answer: "Describe identifying the issue quickly via logs/metrics, rolling back or hotfixing to restore user service first, conducting a blameless post-mortem, and adding automated regression tests and linting to prevent it permanently."
        },
        {
            question: "How do you prioritize competing deadlines and manage technical debt when business stakeholders demand quick delivery?",
            intention: "Tests pragmatic balance between clean code, business velocity, and transparent communication.",
            answer: "Explain breaking work into incremental milestones, negotiating scope vs quality with product managers, and documenting tech debt with explicit tickets in the backlog to be addressed in dedicated refactor sprints."
        }
    ];

    return { technicalQuestions, behavioralQuestions };
}

function buildFallbackInterviewReport({ resume, selfDescription, jobDescription, targetLevel = "mid" }) {
    const profileText = `${resume || ""} ${selfDescription || ""}`;
    const title = extractJobTitle(jobDescription);
    const { matchedSkills, missingSkills } = analyzeSkills(profileText, jobDescription);

    // Compute realistic match score
    const baseScore = Math.min(88, Math.max(62, 55 + (matchedSkills.length * 6)));

    const { technicalQuestions, behavioralQuestions } = generateQuestionsForRole(title, matchedSkills, missingSkills, targetLevel);

    const severities = ["high", "medium", "medium", "low"];
    const skillGaps = missingSkills.slice(0, 4).map((skill, idx) => ({
        skill,
        severity: severities[idx] || "medium"
    }));

    const preparationPlan = [
        {
            day: 1,
            focus: "Core Language & Domain Fundamentals",
            tasks: [
                `Deep dive into core ${title} language fundamentals and execution model`,
                "Review memory management, concurrency, asynchronous patterns, and closures",
                "Complete 3 targeted algorithmic or code comprehension exercises"
            ]
        },
        {
            day: 2,
            focus: "System Architecture & API Design",
            tasks: [
                "Review RESTful best practices, idempotency, and status code standards",
                "Design a scalable real-time notification or authentication service",
                "Practice whiteboarding end-to-end component data flow"
            ]
        },
        {
            day: 3,
            focus: "Database Schema & Query Optimization",
            tasks: [
                "Review indexing techniques (B-Tree, compound indexes) and execution plans",
                "Practice query optimization and schema design for high-concurrency workloads",
                "Understand caching layers with Redis and cache invalidation strategies"
            ]
        },
        {
            day: 4,
            focus: "Skill Gap Remediation & Best Practices",
            tasks: [
                `Study top resources on ${skillGaps[0]?.skill || 'System Scalability'}`,
                "Implement a hands-on proof-of-concept covering the identified gap",
                "Review security considerations: OWASP Top 10, sanitization, and rate limiting"
            ]
        },
        {
            day: 5,
            focus: "Behavioral Preparation & STAR Scenarios",
            tasks: [
                "Draft 4 detailed STAR-format stories (Leadership, Failure, Conflict, Innovation)",
                "Refine answers to: 'Tell me about yourself' and 'Why this company?'",
                "Record a 10-minute self-mock interview and review vocal clarity"
            ]
        },
        {
            day: 6,
            focus: "Live Technical Mock Interview Simulation",
            tasks: [
                "Conduct a timed 45-minute technical coding and architecture drill",
                "Answer technical questions aloud with structured reasoning",
                "Review and refine weaknesses flagged during practice"
            ]
        },
        {
            day: 7,
            focus: "Final Review & Executive Polish",
            tasks: [
                "Review the AI-tailored ATS resume and align talking points",
                "Prepare 3 thoughtful, insightful questions to ask the interviewer",
                "Final checklist check: calm mindset, environment check, and confidence"
            ]
        }
    ];

    return {
        title,
        matchScore: baseScore,
        technicalQuestions,
        behavioralQuestions,
        skillGaps,
        preparationPlan
    };
}

module.exports = { buildFallbackInterviewReport };
