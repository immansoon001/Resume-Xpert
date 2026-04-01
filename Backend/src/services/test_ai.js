require('dotenv').config();
const { generateInterviewReport } = require("./ai.service");
const { resume, selfDescription, jobDescription } = require("./temp");

(async () => {
    try {
        const result = await generateInterviewReport({ resume, selfDescription, jobDescription });
        console.log("Result:", result);
    } catch (err) {
        console.error("Test script error:", err);
    }
})();