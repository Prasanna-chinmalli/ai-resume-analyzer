const express = require("express");
const cors = require("cors");
const multer = require("multer");
const pdfParse = require("pdf-parse");

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({
    limits: { fileSize: 5 * 1024 * 1024 }
});

const SKILL_PATTERNS = {
    "JavaScript": ["javascript", "js"],
    "TypeScript": ["typescript", "ts"],
    "React": ["react", "react.js", "reactjs"],
    "Node.js": ["node", "nodejs", "node.js"],
    "Express": ["express", "express.js"],
    "MongoDB": ["mongodb", "mongo db"],
    "SQL": ["sql", "mysql", "postgresql", "postgres", "sqlite"],
    "Python": ["python"],
    "Java": ["java"],
    "Git": ["git"],
    "GitHub": ["github"],
    "REST API": ["rest api", "restful api", "api"],
    "Docker": ["docker"],
    "AWS": ["aws", "amazon web services"],

    "Machine Learning": ["machine learning", "ml", "ai/ml"],
    "Artificial Intelligence": ["artificial intelligence", "ai"],
    "Deep Learning": ["deep learning"],
    "NLP": ["nlp", "natural language processing"],
    "Scikit-learn": ["scikit-learn", "sklearn"],
    "PyTorch": ["pytorch"],
    "TensorFlow": ["tensorflow"],
    "Statistics": ["statistics"],
    "Probability": ["probability"],

    "LLM": ["llm", "llms", "large language model", "large language models"],
    "LLM APIs": ["llm api", "llm apis", "openai api", "gpt api", "language model api"],
    "OpenAI": ["openai", "openai api", "chatgpt api", "gpt-4", "gpt4"],
    "LangChain": ["langchain"],
    "LlamaIndex": ["llamaindex", "llama index"],
    "CrewAI": ["crewai", "crew ai"],
    "AutoGen": ["autogen", "auto gen"],
    "RAG": ["rag", "retrieval augmented generation", "retrieval-augmented generation"],
    "Vector Database": ["vector database", "vector db", "pinecone", "weaviate", "faiss", "chroma"],
    "Embeddings": ["embedding", "embeddings"],
    "Prompt Engineering": ["prompt engineering", "prompt design"],

    "Software Engineering": [
        "software engineering",
        "software engineer",
        "software development",
        "software developer"
    ],
    "Real-world Applications": [
        "real world applications",
        "real-world applications",
        "production applications",
        "production systems"
    ],
    "Fast-paced Environment": [
        "fast-paced environment",
        "fast paced environment",
        "high-ownership environment",
        "high ownership environment",
        "fast-changing environment",
        "move fast",
        "learn quickly"
    ]
};

function normalizeText(text) {
    return (text || "")
        .toLowerCase()
        .replace(/[\r\n\t]+/g, " ")
        .replace(/[–—]/g, "-")
        .replace(/[^a-z0-9.+#/,\-() ]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function containsAlias(text, alias) {
    const normalizedText = normalizeText(text);
    const normalizedAlias = normalizeText(alias);
    return new RegExp(`\\b${escapeRegex(normalizedAlias)}\\b`, "i").test(normalizedText);
}

function unique(arr) {
    return [...new Set(arr.map((item) => item.toLowerCase()))].map((key) =>
        arr.find((item) => item.toLowerCase() === key)
    );
}

function detectSkills(text) {
    const found = [];

    Object.entries(SKILL_PATTERNS).forEach(([label, aliases]) => {
        if (aliases.some((alias) => containsAlias(text, alias))) {
            found.push(label);
        }
    });

    return unique(found);
}

function extractExperienceYears(text) {
    const normalized = normalizeText(text);

    const rangeMatch = normalized.match(/(\d+)\s*[-–to]+\s*(\d+)\s*years?/i);
    if (rangeMatch) {
        return {
            min: Number(rangeMatch[1]),
            max: Number(rangeMatch[2])
        };
    }

    const singleMatch = normalized.match(/(\d+)\+?\s*years?/i);
    if (singleMatch) {
        return {
            min: Number(singleMatch[1]),
            max: null
        };
    }

    return null;
}

function inferRole(jd) {
    const text = normalizeText(jd);

    if (
        text.includes("llm") ||
        text.includes("langchain") ||
        text.includes("openai") ||
        text.includes("llamaindex")
    ) {
        return "AI / LLM Engineer";
    }

    if (
        text.includes("machine learning") ||
        text.includes("pytorch") ||
        text.includes("scikit-learn")
    ) {
        return "ML Engineer";
    }

    if (text.includes("react") || text.includes("frontend")) {
        return "Frontend Developer";
    }

    if (text.includes("node") || text.includes("backend")) {
        return "Backend Developer";
    }

    if (text.includes("software engineer") || text.includes("software developer")) {
        return "Software Developer";
    }

    return "Software Developer";
}

function cleanPhrase(phrase) {
    return phrase
        .replace(/^[•\-\d.)\s]+/, "")
        .replace(/\(or similar\)/gi, "")
        .replace(/\betc\b\.?/gi, "")
        .trim();
}

function splitCommaSkills(part) {
    return part
        .split(",")
        .map((item) => cleanPhrase(item))
        .filter(Boolean)
        .filter((item) => item.length > 2);
}

function extractDynamicPhrases(jdText) {
    const lines = (jdText || "")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

    const phrases = [];

    lines.forEach((line) => {
        const lower = normalizeText(line);

        if (lower.includes("frameworks like")) {
            const after = line.split(/frameworks like/i)[1] || "";
            splitCommaSkills(after).forEach((item) => phrases.push(item));
        }

        if (lower.includes("tools such as")) {
            const after = line.split(/tools such as/i)[1] || "";
            splitCommaSkills(after).forEach((item) => phrases.push(item));
        }

        if (lower.includes("experience working with")) {
            const after = line.split(/experience working with/i)[1] || "";
            if (after.trim()) {
                splitCommaSkills(after).forEach((item) => phrases.push(item));
            }
        }

        if (
            lower.includes("strong coding skills") ||
            lower.includes("building real world applications") ||
            lower.includes("building real-world applications") ||
            lower.includes("high-ownership") ||
            lower.includes("fast-changing environment") ||
            lower.includes("move fast") ||
            lower.includes("learn quickly")
        ) {
            phrases.push(cleanPhrase(line));
        }
    });

    return unique(
        phrases
            .map((item) => item.replace(/\.$/, "").trim())
            .filter(Boolean)
    );
}

function extractKeywords(jd) {
    const detectedSkills = detectSkills(jd);
    const dynamicPhrases = extractDynamicPhrases(jd);

    const combined = [...detectedSkills];

    dynamicPhrases.forEach((phrase) => {
        const alreadyCovered = combined.some(
            (item) => normalizeText(item) === normalizeText(phrase)
        );
        if (!alreadyCovered) {
            combined.push(phrase);
        }
    });

    return unique(combined);
}

function getResumeEvidence(resumeText) {
    return {
        hasProjects: containsAlias(resumeText, "project"),
        hasInternship: containsAlias(resumeText, "internship"),
        hasGithub: containsAlias(resumeText, "github")
    };
}

function scoreMatch(requiredKeywords, matchedSkills, resumeText, jobDescription) {
    const resume = normalizeText(resumeText);
    const jd = normalizeText(jobDescription);

    if (requiredKeywords.length === 0) return 35;

    let requiredSkills = [];
    let preferredSkills = [];

    requiredKeywords.forEach((skill) => {
        const keyword = normalizeText(skill);

        const isRequired =
            jd.includes("must have") ||
            jd.includes("required") ||
            jd.includes("strong") ||
            jd.includes("looking for") ||
            jd.includes("experience with") ||
            jd.includes("frameworks like") ||
            jd.includes(keyword);

        if (isRequired) {
            requiredSkills.push(skill);
        } else {
            preferredSkills.push(skill);
        }
    });

    const requiredMatched = requiredSkills.filter((s) => matchedSkills.includes(s)).length;
    const preferredMatched = preferredSkills.filter((s) => matchedSkills.includes(s)).length;

    let score = 0;

    if (requiredSkills.length > 0) {
        score += (requiredMatched / requiredSkills.length) * 70;
    }

    if (preferredSkills.length > 0) {
        score += (preferredMatched / preferredSkills.length) * 15;
    }

    const role = inferRole(jobDescription);
    if (
        (role === "AI / LLM Engineer" &&
            (resume.includes("ai") ||
                resume.includes("llm") ||
                resume.includes("machine learning"))) ||
        (role === "ML Engineer" && resume.includes("machine learning")) ||
        (role === "Frontend Developer" && resume.includes("react")) ||
        (role === "Backend Developer" && resume.includes("node")) ||
        (role === "Software Developer" &&
            (resume.includes("software") || resume.includes("developer")))
    ) {
        score += 10;
    }

    const jdExp = extractExperienceYears(jobDescription);
    if (!jdExp) {
        score += 5;
    } else {
        const resumeExpMatch = resume.match(/(\d+)\+?\s*years?/i);
        if (resumeExpMatch) {
            const resumeYears = Number(resumeExpMatch[1]);
            if (resumeYears >= jdExp.min) {
                score += 5;
            } else {
                score += Math.max(0, (resumeYears / jdExp.min) * 5);
            }
        }
    }

    return Math.max(0, Math.min(100, Math.round(score)));
}

function generateSuggestions(missingSkills, resumeText) {
    const resume = normalizeText(resumeText);
    const suggestions = [];

    if (missingSkills.includes("LLM APIs")) {
        suggestions.push("Add a project using OpenAI or other LLM APIs.");
    }
    if (missingSkills.includes("OpenAI")) {
        suggestions.push("Mention OpenAI API usage if you have worked with it.");
    }
    if (missingSkills.includes("LangChain")) {
        suggestions.push("Add LangChain-based chatbot, RAG, or workflow projects.");
    }
    if (missingSkills.includes("LlamaIndex")) {
        suggestions.push("Mention LlamaIndex work if you have built retrieval-based applications.");
    }
    if (missingSkills.includes("CrewAI")) {
        suggestions.push("Highlight multi-agent workflow experience using CrewAI if applicable.");
    }
    if (missingSkills.includes("AutoGen")) {
        suggestions.push("Add AutoGen or agentic AI experimentation if you have used it.");
    }
    if (missingSkills.includes("Real-world Applications")) {
        suggestions.push("Emphasize deployed or real-world applications, not only notebooks.");
    }
    if (missingSkills.includes("Software Engineering")) {
        suggestions.push("Show software engineering practices like APIs, deployment, testing, and version control.");
    }

    if (missingSkills.length > 0 && suggestions.length === 0) {
        suggestions.push(`Add or highlight these missing skills: ${missingSkills.join(", ")}`);
    }

    if (!resume.includes("project")) {
        suggestions.push("Include relevant academic or personal projects.");
    }

    if (!resume.includes("internship")) {
        suggestions.push("Include internship experience if available.");
    }

    if (!resume.includes("github")) {
        suggestions.push("Add your GitHub profile link.");
    }

    if (suggestions.length === 0) {
        suggestions.push("Your resume matches the JD well. Add quantified achievements to improve further.");
    }

    return unique(suggestions);
}

function generateAIExplanation(score, matchedSkills, missingSkills, limitedExtraction) {
    if (limitedExtraction) {
        return `The analysis found only a limited number of JD requirements, so the result may be incomplete. The estimated ATS-like score is ${score}/100. Try using a more detailed JD or improving extraction coverage.`;
    }

    if (missingSkills.length === 0) {
        return `Your resume matches the detected JD requirements well. The estimated ATS-like score is ${score}/100 because the major extracted requirements are already present in the resume.`;
    }

    return `Your resume matches some important JD requirements such as ${matchedSkills.slice(0, 5).join(", ") || "a few detected skills"}, but it is missing key requirements like ${missingSkills.slice(0, 6).join(", ")}. Because ATS-style systems look for direct keyword and skill alignment, these gaps reduce the estimated score to ${score}/100.`;
}

function analyzeText(resumeText, jobDescription = "") {
    const role = inferRole(jobDescription);
    const requiredKeywords = extractKeywords(jobDescription);
    const resumeSkills = detectSkills(resumeText);

    const matchedSkills = requiredKeywords.filter((skill) =>
        resumeSkills.some((resumeSkill) => normalizeText(resumeSkill) === normalizeText(skill)) ||
        containsAlias(resumeText, skill)
    );

    const missingSkills = requiredKeywords.filter((skill) => !matchedSkills.includes(skill));
    const limitedExtraction = requiredKeywords.length < 3;

    const score = scoreMatch(requiredKeywords, matchedSkills, resumeText, jobDescription);
    const suggestions = generateSuggestions(missingSkills, resumeText);
    const aiExplanation = generateAIExplanation(score, matchedSkills, missingSkills, limitedExtraction);

    return {
        role,
        score,
        requiredKeywords,
        matchedSkills,
        missingSkills,
        suggestions,
        aiExplanation,
        limitedExtraction
    };
}

function detectDocumentType(text) {
    const content = normalizeText(text);

    const resumeKeywords = [
        "education",
        "experience",
        "skills",
        "project",
        "internship",
        "github",
        "certification",
        "college",
        "university",
        "objective",
        "summary"
    ];

    const jdKeywords = [
        "responsibilities",
        "requirements",
        "qualifications",
        "we are looking",
        "job description",
        "role",
        "candidate",
        "preferred",
        "must have",
        "what you will do",
        "what we're looking for"
    ];

    let resumeScore = 0;
    let jdScore = 0;

    resumeKeywords.forEach((keyword) => {
        if (content.includes(keyword)) resumeScore++;
    });

    jdKeywords.forEach((keyword) => {
        if (content.includes(keyword)) jdScore++;
    });

    if (resumeScore > jdScore) return "resume";
    if (jdScore > resumeScore) return "jd";
    return "unknown";
}

app.post("/analyze", (req, res) => {
    const { resumeText, jobDescription } = req.body;

    if (!resumeText || !resumeText.trim()) {
        return res.json({
            role: "Unknown",
            score: 0,
            requiredKeywords: [],
            matchedSkills: [],
            missingSkills: [],
            suggestions: ["Please provide resume text."],
            aiExplanation: "Resume text is missing.",
            limitedExtraction: true
        });
    }

    res.json(analyzeText(resumeText, jobDescription || ""));
});

app.post("/upload", upload.single("resume"), async (req, res) => {
    try {
        if (!req.file) {
            return res.json({
                extractedText: "",
                message: "No file uploaded"
            });
        }

        const data = await pdfParse(req.file.buffer);
        const text = data.text || "";
        const type = detectDocumentType(text);

        if (type !== "resume") {
            return res.json({
                extractedText: "",
                message: "❌ Wrong file. Please upload a RESUME PDF."
            });
        }

        res.json({
            extractedText: text,
            message: "✅ Resume extracted successfully"
        });
    } catch (error) {
        console.log("PDF ERROR:", error);
        res.json({
            extractedText: "",
            message: "Error processing resume PDF"
        });
    }
});

app.post("/upload-jd", upload.single("jdFile"), async (req, res) => {
    try {
        if (!req.file) {
            return res.json({
                extractedText: "",
                message: "No JD file uploaded"
            });
        }

        const data = await pdfParse(req.file.buffer);
        const text = data.text || "";
        const type = detectDocumentType(text);

        if (type !== "jd") {
            return res.json({
                extractedText: "",
                message: "❌ Wrong file. Please upload a JOB DESCRIPTION PDF."
            });
        }

        res.json({
            extractedText: text,
            message: "✅ Job description extracted successfully"
        });
    } catch (error) {
        console.log("JD ERROR:", error);
        res.json({
            extractedText: "",
            message: "Error processing JD PDF"
        });
    }
});

app.listen(5000, () => {
    console.log("Server running on port 5000");
});