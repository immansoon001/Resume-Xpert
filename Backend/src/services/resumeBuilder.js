/**
 * ATS-Optimized Resume HTML Generator & Fallback Builder
 * Builds high-impact, clean, semantic HTML resumes optimized for ATS parsers and PDF conversion.
 */

function escapeHtml(str) {
    if (!str) return "";
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function parseContactInfo(lines) {
    let email = "";
    let phone = "";
    let linkedin = "";
    let github = "";
    let portfolio = "";
    let location = "";

    // Join top lines and repair hyphenated line-wraps like "mansoon-\npatel-123"
    const headerText = lines.slice(0, 6).join("\n").replace(/-\s*\n\s*/g, "-").replace(/\n/g, " ");

    // Email
    const emailMatch = headerText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (emailMatch) email = emailMatch[0];

    // Phone
    const phoneMatch = headerText.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\+91[-.\s]?\d{10}/);
    if (phoneMatch) phone = phoneMatch[0];

    // LinkedIn
    const linkedinMatch = headerText.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+/i);
    if (linkedinMatch) linkedin = linkedinMatch[0];

    // GitHub
    const githubMatch = headerText.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/[a-zA-Z0-9_-]+/i);
    if (githubMatch) github = githubMatch[0];

    return { email, phone, linkedin, github, portfolio, location };
}

function parseResumeSections(resumeText) {
    const lines = (resumeText || "")
        .split(/\r?\n/)
        .map(l => l.trim())
        .filter(Boolean);

    if (lines.length === 0) {
        return { name: "Professional Candidate", contacts: {}, sections: {} };
    }

    const name = lines[0].replace(/^#+\s*/, "").replace(/[|•].*$/, "").trim();
    const contacts = parseContactInfo(lines);

    const sectionHeaders = [
        "PROFILE",
        "SUMMARY",
        "PROFESSIONAL SUMMARY",
        "EXPERIENCE",
        "WORK EXPERIENCE",
        "EMPLOYMENT HISTORY",
        "EDUCATION",
        "SKILLS",
        "TECHNICAL SKILLS",
        "PROJECTS",
        "KEY PROJECTS",
        "CERTIFICATIONS",
        "ACHIEVEMENTS",
        "PUBLICATIONS",
        "HONORS"
    ];

    const sections = {
        SUMMARY: [],
        EXPERIENCE: [],
        PROJECTS: [],
        SKILLS: [],
        EDUCATION: [],
        CERTIFICATIONS: [],
        ACHIEVEMENTS: []
    };

    let currentSection = null;
    let sectionStarted = false;

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];

        // Clean line to detect section header
        const cleanLine = line.toUpperCase().replace(/[^A-Z\s]/g, "").trim();
        const matched = sectionHeaders.find(h => h === cleanLine);

        if (matched) {
            sectionStarted = true;
            if (matched.includes("SUMMARY") || matched.includes("PROFILE")) {
                currentSection = "SUMMARY";
            } else if (matched.includes("EXPERIENCE") || matched.includes("EMPLOYMENT")) {
                currentSection = "EXPERIENCE";
            } else if (matched.includes("PROJECT")) {
                currentSection = "PROJECTS";
            } else if (matched.includes("SKILL")) {
                currentSection = "SKILLS";
            } else if (matched.includes("EDUCATION")) {
                currentSection = "EDUCATION";
            } else if (matched.includes("CERT")) {
                currentSection = "CERTIFICATIONS";
            } else if (matched.includes("ACHIEVE") || matched.includes("HONOR")) {
                currentSection = "ACHIEVEMENTS";
            }
            continue;
        }

        // Ignore lines before first section header (contact info, address, fragments)
        if (!sectionStarted) {
            continue;
        }

        if (currentSection) {
            sections[currentSection].push(line);
        }
    }

    return { name, contacts, sections };
}

function formatBulletPoints(lines) {
    const bullets = [];
    for (const line of lines) {
        const trimmed = line.replace(/^[•\-\*\u2022\u2023\u25E6]\s*/, "").trim();
        if (trimmed) {
            bullets.push(escapeHtml(trimmed));
        }
    }
    return bullets;
}

function buildFallbackResumeHtml({ resume, selfDescription, jobDescription }) {
    const { name, contacts, sections } = parseResumeSections(resume);

    // Build contacts list
    const contactLinks = [];
    if (contacts.phone) contactLinks.push(`<span>📞 ${escapeHtml(contacts.phone)}</span>`);
    if (contacts.email) contactLinks.push(`<span>✉️ <a href="mailto:${escapeHtml(contacts.email)}">${escapeHtml(contacts.email)}</a></span>`);
    if (contacts.linkedin) {
        const cleanUrl = contacts.linkedin.startsWith("http") ? contacts.linkedin : `https://${contacts.linkedin}`;
        contactLinks.push(`<span>💼 <a href="${escapeHtml(cleanUrl)}" target="_blank" rel="noopener">LinkedIn</a></span>`);
    }
    if (contacts.github) {
        const cleanUrl = contacts.github.startsWith("http") ? contacts.github : `https://${contacts.github}`;
        contactLinks.push(`<span>💻 <a href="${escapeHtml(cleanUrl)}" target="_blank" rel="noopener">GitHub</a></span>`);
    }

    // Build Summary
    let summaryText = sections.SUMMARY.join(" ").trim();
    if (!summaryText && selfDescription) {
        summaryText = selfDescription;
    }
    if (!summaryText) {
        summaryText = "Results-driven Software Engineer with extensive experience in architecting, developing, and deploying scalable web applications and distributed systems. Proven track record in collaborating across cross-functional teams to deliver secure, high-impact digital solutions aligned with business goals.";
    }

    // Build Skills Section
    const skillsList = sections.SKILLS;
    const skillsHtml = skillsList.map(item => {
        const parts = item.split(":");
        if (parts.length > 1) {
            return `
                <div class="skills-row">
                    <span class="skills-category">${escapeHtml(parts[0].trim())}:</span>
                    <span class="skills-items">${escapeHtml(parts.slice(1).join(":").trim())}</span>
                </div>
            `;
        }
        return `
            <div class="skills-row">
                <span class="skills-category">Core Competencies:</span>
                <span class="skills-items">${escapeHtml(item.trim())}</span>
            </div>
        `;
    }).join("");

    // Build Experience Section
    const experienceHtml = [];
    let currentExp = null;

    for (const line of sections.EXPERIENCE) {
        const isBullet = /^[•\-\*\u2022\u2023\u25E6]/.test(line);
        if (!isBullet) {
            if (currentExp) experienceHtml.push(currentExp);
            currentExp = { title: line, bullets: [] };
        } else if (currentExp) {
            currentExp.bullets.push(line.replace(/^[•\-\*\u2022\u2023\u25E6]\s*/, ""));
        } else {
            currentExp = { title: "Professional Experience", bullets: [line.replace(/^[•\-\*\u2022\u2023\u25E6]\s*/, "")] };
        }
    }
    if (currentExp) experienceHtml.push(currentExp);

    // Build Projects Section
    const projectsHtml = [];
    let currentProj = null;

    for (const line of sections.PROJECTS) {
        const isBullet = /^[•\-\*\u2022\u2023\u25E6]/.test(line);
        if (!isBullet) {
            if (currentProj) projectsHtml.push(currentProj);
            currentProj = { title: line, bullets: [] };
        } else if (currentProj) {
            currentProj.bullets.push(line.replace(/^[•\-\*\u2022\u2023\u25E6]\s*/, ""));
        } else {
            currentProj = { title: "Featured Project", bullets: [line.replace(/^[•\-\*\u2022\u2023\u25E6]\s*/, "")] };
        }
    }
    if (currentProj) projectsHtml.push(currentProj);

    // Build Education Section
    const educationBullets = formatBulletPoints(sections.EDUCATION);

    // Build Certifications
    const certBullets = formatBulletPoints(sections.CERTIFICATIONS);

    // Build Achievements
    const achieveBullets = formatBulletPoints(sections.ACHIEVEMENTS);

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(name)} - Resume</title>
    <style>
        *, *::before, *::after {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            color: #1e293b;
            background-color: #ffffff;
            line-height: 1.5;
            font-size: 13.5px;
            padding: 32px 36px;
            max-width: 850px;
            margin: 0 auto;
        }

        @page {
            size: A4;
            margin: 12mm 15mm;
        }

        @media print {
            body {
                padding: 0;
                max-width: 100%;
                font-size: 12.5px;
            }
            a {
                text-decoration: none;
                color: inherit;
            }
        }

        /* Header */
        .header {
            text-align: center;
            border-bottom: 2px solid #2563eb;
            padding-bottom: 12px;
            margin-bottom: 16px;
        }

        .header h1 {
            font-size: 26px;
            font-weight: 800;
            letter-spacing: -0.5px;
            color: #0f172a;
            text-transform: uppercase;
            margin-bottom: 6px;
        }

        .header .contacts {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 14px;
            font-size: 12.5px;
            color: #475569;
        }

        .header .contacts a {
            color: #2563eb;
            text-decoration: none;
            font-weight: 500;
        }

        .header .contacts a:hover {
            text-decoration: underline;
        }

        /* Section Styling */
        .section {
            margin-bottom: 16px;
            page-break-inside: avoid;
        }

        .section-header {
            font-size: 13.5px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            color: #0f172a;
            border-bottom: 1.5px solid #cbd5e1;
            padding-bottom: 3px;
            margin-bottom: 8px;
            display: flex;
            align-items: center;
        }

        .section-header::after {
            content: '';
            flex: 1;
            margin-left: 10px;
            height: 1px;
            background: #e2e8f0;
        }

        .summary-text {
            color: #334155;
            text-align: justify;
            line-height: 1.55;
        }

        /* Skills */
        .skills-grid {
            display: flex;
            flex-direction: column;
            gap: 5px;
        }

        .skills-row {
            display: grid;
            grid-template-columns: 140px 1fr;
            align-items: baseline;
            gap: 8px;
            font-size: 13px;
        }

        .skills-category {
            font-weight: 600;
            color: #0f172a;
        }

        .skills-items {
            color: #334155;
        }

        /* Experience & Projects */
        .entry {
            margin-bottom: 10px;
            page-break-inside: avoid;
        }

        .entry-title {
            font-size: 13.5px;
            font-weight: 600;
            color: #0f172a;
            display: flex;
            justify-content: space-between;
            margin-bottom: 3px;
        }

        ul {
            list-style-type: disc;
            margin-left: 18px;
            color: #334155;
        }

        li {
            margin-bottom: 3px;
            line-height: 1.45;
        }

        li strong {
            color: #0f172a;
        }

        /* Subtle ATS badge */
        .ats-pill {
            display: inline-block;
            background: #eff6ff;
            color: #1d4ed8;
            font-size: 10px;
            font-weight: 700;
            padding: 2px 6px;
            border-radius: 4px;
            margin-left: 6px;
            vertical-align: middle;
            text-transform: uppercase;
        }
    </style>
</head>
<body>

    <header class="header">
        <h1>${escapeHtml(name)}</h1>
        <div class="contacts">
            ${contactLinks.join(" &bull; ")}
        </div>
    </header>

    <section class="section">
        <h2 class="section-header">Professional Summary</h2>
        <p class="summary-text">${escapeHtml(summaryText)}</p>
    </section>

    ${skillsHtml ? `
    <section class="section">
        <h2 class="section-header">Technical Competencies</h2>
        <div class="skills-grid">
            ${skillsHtml}
        </div>
    </section>` : ""}

    ${experienceHtml.length > 0 ? `
    <section class="section">
        <h2 class="section-header">Professional Experience</h2>
        ${experienceHtml.map(exp => `
            <div class="entry">
                <div class="entry-title">
                    <span>${escapeHtml(exp.title)}</span>
                </div>
                ${exp.bullets.length > 0 ? `
                <ul>
                    ${exp.bullets.map(b => `<li>${escapeHtml(b)}</li>`).join("")}
                </ul>` : ""}
            </div>
        `).join("")}
    </section>` : ""}

    ${projectsHtml.length > 0 ? `
    <section class="section">
        <h2 class="section-header">Featured Projects</h2>
        ${projectsHtml.map(proj => `
            <div class="entry">
                <div class="entry-title">
                    <span style="color: #1d4ed8;">${escapeHtml(proj.title)}</span>
                </div>
                ${proj.bullets.length > 0 ? `
                <ul>
                    ${proj.bullets.map(b => `<li>${escapeHtml(b)}</li>`).join("")}
                </ul>` : ""}
            </div>
        `).join("")}
    </section>` : ""}

    ${educationBullets.length > 0 ? `
    <section class="section">
        <h2 class="section-header">Education</h2>
        <ul>
            ${educationBullets.map(b => `<li>${b}</li>`).join("")}
        </ul>
    </section>` : ""}

    ${certBullets.length > 0 ? `
    <section class="section">
        <h2 class="section-header">Certifications & Training</h2>
        <ul>
            ${certBullets.map(b => `<li>${b}</li>`).join("")}
        </ul>
    </section>` : ""}

    ${achieveBullets.length > 0 ? `
    <section class="section">
        <h2 class="section-header">Achievements & Extracurricular Leadership</h2>
        <ul>
            ${achieveBullets.map(b => `<li>${b}</li>`).join("")}
        </ul>
    </section>` : ""}

</body>
</html>`;
}

module.exports = { buildFallbackResumeHtml };
