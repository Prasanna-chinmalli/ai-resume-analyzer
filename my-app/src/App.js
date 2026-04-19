import { useMemo, useState } from "react";
import jsPDF from "jspdf";

function App() {
    const [resumeText, setResumeText] = useState("");
    const [jobDescription, setJobDescription] = useState("");
    const [analysis, setAnalysis] = useState(null);
    const [file, setFile] = useState(null);
    const [fileName, setFileName] = useState("");
    const [jdFile, setJdFile] = useState(null);
    const [jdFileName, setJdFileName] = useState("");
    const [loading, setLoading] = useState(false);
    const [uploadMessage, setUploadMessage] = useState("");
    const [jdUploadMessage, setJdUploadMessage] = useState("");
    const [darkMode, setDarkMode] = useState(false);
    const [resumeUploaded, setResumeUploaded] = useState(false);

    const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

    const theme = useMemo(() => {
        return darkMode
            ? {
                pageBg: "linear-gradient(135deg, #0f172a, #1e293b)",
                cardBg: "#111827",
                text: "#f9fafb",
                subText: "#cbd5e1",
                border: "#334155",
                inputBg: "#0f172a",
                inputText: "#f9fafb",
                sectionBg: "#1f2937",
                mutedTagBg: "#374151",
                mutedTagText: "#e5e7eb",
                matchedBg: "#14532d",
                matchedText: "#dcfce7",
                missingBg: "#7f1d1d",
                missingText: "#fee2e2",
                infoBg: "#172554",
                infoText: "#dbeafe",
                successBg: "#052e16",
                successText: "#dcfce7",
                progressBg: "#334155",
                shadow: "0 10px 30px rgba(0,0,0,0.35)",
                warningBg: "#3f2a00",
                warningText: "#fde68a",
                passBg: "#14532d",
                passText: "#dcfce7",
                reviewBg: "#78350f",
                reviewText: "#fde68a",
                rejectBg: "#7f1d1d",
                rejectText: "#fee2e2"
            }
            : {
                pageBg: "linear-gradient(135deg, #eef2ff, #f8fafc)",
                cardBg: "#ffffff",
                text: "#111827",
                subText: "#475569",
                border: "#dbe4ee",
                inputBg: "#ffffff",
                inputText: "#111827",
                sectionBg: "#f8fafc",
                mutedTagBg: "#e5e7eb",
                mutedTagText: "#374151",
                matchedBg: "#dcfce7",
                matchedText: "#166534",
                missingBg: "#fee2e2",
                missingText: "#991b1b",
                infoBg: "#dbeafe",
                infoText: "#1e3a8a",
                successBg: "#dcfce7",
                successText: "#166534",
                progressBg: "#e5e7eb",
                shadow: "0 10px 30px rgba(15,23,42,0.12)",
                warningBg: "#fef3c7",
                warningText: "#92400e",
                passBg: "#dcfce7",
                passText: "#166534",
                reviewBg: "#fef3c7",
                reviewText: "#92400e",
                rejectBg: "#fee2e2",
                rejectText: "#991b1b"
            };
    }, [darkMode]);

    const analyzeResume = async () => {
        if (!resumeText.trim()) {
            setAnalysis({
                role: "Unknown",
                score: 0,
                requiredKeywords: [],
                matchedSkills: [],
                missingSkills: [],
                suggestions: ["Please paste or upload a resume first."],
                aiExplanation: "Resume text is missing.",
                limitedExtraction: true,
                atsDecision: {
                    status: "REVIEW",
                    message: "Resume text missing. ATS prediction unavailable."
                }
            });
            return;
        }

        if (!jobDescription.trim()) {
            setAnalysis(null);
            setUploadMessage("Please paste the job description before analyzing.");
            return;
        }

        setLoading(true);
        setUploadMessage("");

        try {
            const res = await fetch(`${API_BASE_URL}/analyze`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ resumeText, jobDescription })
            });

            const data = await res.json();
            setAnalysis(data);
        } catch (error) {
            setAnalysis({
                role: "Unknown",
                score: 0,
                requiredKeywords: [],
                matchedSkills: [],
                missingSkills: [],
                suggestions: ["Could not connect to backend."],
                aiExplanation: "Could not connect to backend.",
                limitedExtraction: true,
                atsDecision: {
                    status: "REVIEW",
                    message: "Backend connection failed."
                }
            });
        } finally {
            setLoading(false);
        }
    };

    const uploadResume = async () => {
        if (!file) {
            setUploadMessage("❌ Please select a resume PDF first.");
            return;
        }

        setLoading(true);
        setUploadMessage("");
        setAnalysis(null);
        setResumeUploaded(false);

        try {
            const formData = new FormData();
            formData.append("resume", file);

            const res = await fetch(`${API_BASE_URL}/upload`, {
                method: "POST",
                body: formData
            });

            const data = await res.json();

            if (!data.extractedText) {
                setUploadMessage(data.message || "❌ Wrong file. Please upload a RESUME PDF.");
                return;
            }

            setResumeText(data.extractedText);
            setResumeUploaded(true);
            setUploadMessage(
                data.message || "✅ Resume extracted successfully. Now paste the job description below."
            );
        } catch (error) {
            setUploadMessage("❌ Error uploading resume PDF.");
        } finally {
            setLoading(false);
        }
    };

    const uploadJd = async () => {
        if (!jdFile) {
            setJdUploadMessage("❌ Please select a JD PDF first.");
            return;
        }

        setLoading(true);
        setJdUploadMessage("");

        try {
            const formData = new FormData();
            formData.append("jdFile", jdFile);

            const res = await fetch(`${API_BASE_URL}/upload-jd`, {
                method: "POST",
                body: formData
            });

            const data = await res.json();

            if (!data.extractedText) {
                setJdUploadMessage(data.message || "❌ Wrong file. Please upload a JOB DESCRIPTION PDF.");
                return;
            }

            setJobDescription(data.extractedText);
            setJdUploadMessage(data.message || "✅ Job description extracted successfully.");
        } catch (error) {
            setJdUploadMessage("❌ Error uploading JD PDF.");
        } finally {
            setLoading(false);
        }
    };

    const getScoreColor = (score) => {
        if (score >= 75) return "#22c55e";
        if (score >= 50) return "#f59e0b";
        return "#ef4444";
    };

    const getScoreMessage = (score) => {
        if (score >= 80) return "Strong alignment with the job description.";
        if (score >= 60) return "Decent match, but there are gaps to improve.";
        if (score >= 40) return "Partial match. Resume needs better alignment.";
        return "Low match. Important skills are missing or not highlighted.";
    };

    const getAiExplanation = () => {
        if (!analysis) return "";
        if (analysis.aiExplanation) return analysis.aiExplanation;
        return "No explanation available.";
    };

    const getATSBadgeStyle = (status) => {
        if (status === "PASS") {
            return {
                background: theme.passBg,
                color: theme.passText
            };
        }

        if (status === "REJECT") {
            return {
                background: theme.rejectBg,
                color: theme.rejectText
            };
        }

        return {
            background: theme.reviewBg,
            color: theme.reviewText
        };
    };

    const downloadReport = () => {
        if (!analysis) return;

        const doc = new jsPDF("p", "mm", "a4");
        let y = 20;
        const lineHeight = 8;

        const addText = (text) => {
            const safeText = String(text ?? "");
            const splitText = doc.splitTextToSize(safeText, 180);

            if (y + splitText.length * lineHeight > 280) {
                doc.addPage();
                y = 20;
            }

            doc.text(splitText, 10, y);
            y += splitText.length * lineHeight;
        };

        doc.setFontSize(18);
        doc.setTextColor(37, 99, 235);
        doc.text("AI Resume Analyzer Report", 10, y);
        y += 10;

        doc.setTextColor(0, 0, 0);
        doc.setFontSize(12);

        addText(`Role: ${analysis.role || "N/A"}`);
        addText(`Score: ${analysis.score}/100`);
        addText(`ATS Prediction: ${analysis.atsDecision?.status || "N/A"}`);
        addText(`ATS Message: ${analysis.atsDecision?.message || "N/A"}`);
        y += 4;

        doc.setFontSize(14);
        addText("Required Skills:");
        doc.setFontSize(12);
        if (analysis.requiredKeywords?.length) {
            analysis.requiredKeywords.forEach((skill) => addText(`• ${skill}`));
        } else {
            addText("None");
        }

        y += 4;

        doc.setFontSize(14);
        addText("Matched Skills:");
        doc.setFontSize(12);
        if (analysis.matchedSkills?.length) {
            analysis.matchedSkills.forEach((skill) => addText(`• ${skill}`));
        } else {
            addText("None");
        }

        y += 4;

        doc.setFontSize(14);
        addText("Missing Skills:");
        doc.setFontSize(12);
        if (analysis.limitedExtraction) {
            addText("Limited JD requirement extraction. Results may be incomplete.");
        } else if (analysis.missingSkills?.length) {
            analysis.missingSkills.forEach((skill) => addText(`• ${skill}`));
        } else {
            addText("None");
        }

        y += 4;

        doc.setFontSize(14);
        addText("Suggestions:");
        doc.setFontSize(12);
        if (analysis.suggestions?.length) {
            analysis.suggestions.forEach((item) => addText(`• ${item}`));
        } else {
            addText("None");
        }

        y += 4;

        doc.setFontSize(14);
        addText("Explanation:");
        doc.setFontSize(12);
        addText(getAiExplanation());

        doc.save("resume-analysis.pdf");
    };

    const tagStyle = (bg, color) => ({
        display: "inline-block",
        padding: "8px 12px",
        borderRadius: "999px",
        margin: "6px",
        fontSize: "14px",
        fontWeight: "600",
        background: bg,
        color: color,
        border: "1px solid transparent",
        transition: "all 0.2s ease"
    });

    const buttonBase = {
        border: "none",
        borderRadius: "10px",
        padding: "12px 18px",
        cursor: "pointer",
        fontSize: "15px",
        fontWeight: "600",
        transition: "all 0.2s ease"
    };

    const canAnalyze = resumeText.trim() && jobDescription.trim() && !loading;

    return (
        <div
            style={{
                minHeight: "100vh",
                background: theme.pageBg,
                padding: "28px",
                fontFamily: "Inter, Arial, sans-serif",
                color: theme.text
            }}
        >
            <div
                style={{
                    maxWidth: "980px",
                    margin: "0 auto",
                    background: theme.cardBg,
                    borderRadius: "20px",
                    boxShadow: theme.shadow,
                    padding: "28px",
                    border: `1px solid ${theme.border}`
                }}
            >
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "16px",
                        flexWrap: "wrap",
                        marginBottom: "12px"
                    }}
                >
                    <div>
                        <h1 style={{ margin: 0, fontSize: "32px" }}>AI Resume Analyzer</h1>
                        <p style={{ marginTop: "8px", color: theme.subText }}>
                            Upload a PDF or paste your resume, then compare it against any job description.
                        </p>
                    </div>

                    <button
                        onClick={() => setDarkMode((prev) => !prev)}
                        style={{
                            ...buttonBase,
                            background: darkMode ? "#f8fafc" : "#0f172a",
                            color: darkMode ? "#0f172a" : "#f8fafc"
                        }}
                    >
                        {darkMode ? "☀ Light Mode" : "🌙 Dark Mode"}
                    </button>
                </div>

                <div
                    style={{
                        background: theme.sectionBg,
                        borderRadius: "16px",
                        padding: "18px",
                        marginTop: "18px",
                        border: `1px solid ${theme.border}`
                    }}
                >
                    <h3 style={{ marginTop: 0 }}>Upload Resume (PDF)</h3>
                    <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
                        <input
                            type="file"
                            accept=".pdf"
                            onChange={(e) => {
                                setFile(e.target.files[0]);
                                setFileName(e.target.files[0]?.name || "");
                            }}
                            style={{
                                color: theme.text
                            }}
                        />

                        <button
                            onClick={uploadResume}
                            style={{
                                ...buttonBase,
                                background: "#16a34a",
                                color: "#ffffff"
                            }}
                        >
                            {loading ? "Uploading..." : "Upload & Extract"}
                        </button>
                    </div>

                    {fileName && (
                        <p style={{ marginTop: "10px", color: theme.subText }}>
                            Selected file: <strong>{fileName}</strong>
                        </p>
                    )}

                    {uploadMessage && (
                        <div
                            style={{
                                marginTop: "12px",
                                background: uploadMessage.includes("❌") ? theme.warningBg : theme.successBg,
                                color: uploadMessage.includes("❌") ? theme.warningText : theme.successText,
                                borderRadius: "10px",
                                padding: "12px 14px",
                                fontWeight: "600"
                            }}
                        >
                            {uploadMessage}
                        </div>
                    )}
                </div>

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1fr",
                        gap: "18px",
                        marginTop: "18px"
                    }}
                >
                    <div
                        style={{
                            background: theme.sectionBg,
                            borderRadius: "16px",
                            padding: "18px",
                            border: `1px solid ${theme.border}`
                        }}
                    >
                        <h3 style={{ marginTop: 0 }}>Resume</h3>
                        <textarea
                            value={resumeText}
                            onChange={(e) => setResumeText(e.target.value)}
                            placeholder="Resume text will appear here after upload, or paste it manually..."
                            style={{
                                width: "100%",
                                minHeight: "160px",
                                resize: "vertical",
                                borderRadius: "12px",
                                border: `1px solid ${theme.border}`,
                                padding: "14px",
                                fontSize: "14px",
                                lineHeight: 1.5,
                                background: theme.inputBg,
                                color: theme.inputText,
                                outline: "none",
                                boxSizing: "border-box"
                            }}
                        />
                    </div>

                    {(resumeUploaded || resumeText.trim()) ? (
                        <div
                            style={{
                                background: theme.warningBg,
                                color: theme.warningText,
                                borderRadius: "12px",
                                padding: "14px",
                                border: `1px solid ${theme.border}`
                            }}
                        >
                            <strong>Step 2:</strong> Paste the job description below or upload a JD PDF, then click <strong>Analyze Match</strong>.
                        </div>
                    ) : null}

                    <div
                        style={{
                            background: theme.sectionBg,
                            borderRadius: "16px",
                            padding: "18px",
                            border: `1px solid ${theme.border}`
                        }}
                    >
                        <h3 style={{ marginTop: 0 }}>Upload Job Description (PDF)</h3>
                        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
                            <input
                                type="file"
                                accept=".pdf"
                                onChange={(e) => {
                                    setJdFile(e.target.files[0]);
                                    setJdFileName(e.target.files[0]?.name || "");
                                }}
                                style={{ color: theme.text }}
                            />

                            <button
                                onClick={uploadJd}
                                style={{
                                    ...buttonBase,
                                    background: "#0ea5e9",
                                    color: "#ffffff"
                                }}
                            >
                                {loading ? "Uploading..." : "Upload JD PDF"}
                            </button>
                        </div>

                        {jdFileName && (
                            <p style={{ marginTop: "10px", color: theme.subText }}>
                                Selected JD file: <strong>{jdFileName}</strong>
                            </p>
                        )}

                        {jdUploadMessage && (
                            <div
                                style={{
                                    marginTop: "12px",
                                    background: jdUploadMessage.includes("❌") ? theme.warningBg : theme.successBg,
                                    color: jdUploadMessage.includes("❌") ? theme.warningText : theme.successText,
                                    borderRadius: "10px",
                                    padding: "12px 14px",
                                    fontWeight: "600"
                                }}
                            >
                                {jdUploadMessage}
                            </div>
                        )}
                    </div>

                    <div
                        style={{
                            background: theme.sectionBg,
                            borderRadius: "16px",
                            padding: "18px",
                            border: `1px solid ${theme.border}`
                        }}
                    >
                        <h3 style={{ marginTop: 0 }}>Job Description</h3>
                        <textarea
                            value={jobDescription}
                            onChange={(e) => setJobDescription(e.target.value)}
                            placeholder="Paste job description here..."
                            style={{
                                width: "100%",
                                minHeight: "160px",
                                resize: "vertical",
                                borderRadius: "12px",
                                border: `1px solid ${theme.border}`,
                                padding: "14px",
                                fontSize: "14px",
                                lineHeight: 1.5,
                                background: theme.inputBg,
                                color: theme.inputText,
                                outline: "none",
                                boxSizing: "border-box"
                            }}
                        />
                    </div>
                </div>

                <div
                    style={{
                        display: "flex",
                        gap: "12px",
                        flexWrap: "wrap",
                        justifyContent: "center",
                        marginTop: "18px"
                    }}
                >
                    <button
                        onClick={analyzeResume}
                        disabled={!canAnalyze}
                        style={{
                            ...buttonBase,
                            background: canAnalyze ? "#2563eb" : "#94a3b8",
                            color: "#ffffff",
                            minWidth: "160px",
                            cursor: canAnalyze ? "pointer" : "not-allowed"
                        }}
                    >
                        {loading ? "Analyzing..." : "Analyze Match"}
                    </button>

                    <button
                        onClick={downloadReport}
                        disabled={!analysis}
                        style={{
                            ...buttonBase,
                            background: analysis ? "#7c3aed" : "#94a3b8",
                            color: "#ffffff",
                            minWidth: "170px",
                            cursor: analysis ? "pointer" : "not-allowed"
                        }}
                    >
                        Download Report
                    </button>
                </div>

                {analysis && (
                    <div style={{ marginTop: "24px" }}>
                        {analysis.limitedExtraction && (
                            <div
                                style={{
                                    background: theme.warningBg,
                                    color: theme.warningText,
                                    borderRadius: "12px",
                                    padding: "14px",
                                    marginBottom: "16px",
                                    fontWeight: "600"
                                }}
                            >
                                Limited JD requirement extraction. Results may be incomplete.
                            </div>
                        )}

                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                                gap: "16px",
                                marginBottom: "16px"
                            }}
                        >
                            <InfoCard
                                title="Detected Role"
                                value={analysis.role || "Unknown"}
                                theme={theme}
                            />
                            <InfoCard
                                title="Match Quality"
                                value={getScoreMessage(analysis.score)}
                                theme={theme}
                            />
                        </div>

                        <div
                            style={{
                                background: theme.infoBg,
                                color: theme.infoText,
                                borderRadius: "16px",
                                padding: "18px",
                                marginBottom: "16px"
                            }}
                        >
                            <h3 style={{ marginTop: 0 }}>Score: {analysis.score}/100</h3>
                            <div
                                style={{
                                    height: "18px",
                                    background: theme.progressBg,
                                    borderRadius: "999px",
                                    overflow: "hidden",
                                    marginTop: "10px"
                                }}
                            >
                                <div
                                    style={{
                                        width: `${analysis.score}%`,
                                        height: "100%",
                                        background: getScoreColor(analysis.score),
                                        transition: "width 0.8s ease"
                                    }}
                                />
                            </div>
                        </div>

                        {analysis.atsDecision && (
                            <Section title="ATS Rejection Prediction" theme={theme}>
                                <div style={{ width: "100%" }}>
                                    <span
                                        style={{
                                            ...tagStyle(
                                                getATSBadgeStyle(analysis.atsDecision.status).background,
                                                getATSBadgeStyle(analysis.atsDecision.status).color
                                            ),
                                            marginLeft: 0
                                        }}
                                    >
                                        {analysis.atsDecision.status}
                                    </span>
                                    <p
                                        style={{
                                            marginTop: "12px",
                                            marginBottom: 0,
                                            color: theme.subText,
                                            lineHeight: 1.6
                                        }}
                                    >
                                        {analysis.atsDecision.message}
                                    </p>
                                </div>
                            </Section>
                        )}

                        <Section title="Required Keywords from JD" theme={theme}>
                            {analysis.requiredKeywords?.length > 0 ? (
                                analysis.requiredKeywords.map((item, index) => (
                                    <span key={index} style={tagStyle(theme.mutedTagBg, theme.mutedTagText)}>
                                        {item}
                                    </span>
                                ))
                            ) : (
                                <EmptyText text="No job-description keywords extracted." theme={theme} />
                            )}
                        </Section>

                        <Section title="Matched Skills" theme={theme}>
                            {analysis.matchedSkills?.length > 0 ? (
                                analysis.matchedSkills.map((item, index) => (
                                    <span key={index} style={tagStyle(theme.matchedBg, theme.matchedText)}>
                                        {item}
                                    </span>
                                ))
                            ) : (
                                <EmptyText text="No matched skills found." theme={theme} />
                            )}
                        </Section>

                        <Section title="Missing Skills" theme={theme}>
                            {analysis.limitedExtraction ? (
                                <EmptyText
                                    text="Limited JD requirement extraction. Missing skills may be incomplete."
                                    theme={theme}
                                />
                            ) : analysis.missingSkills?.length > 0 ? (
                                analysis.missingSkills.map((item, index) => (
                                    <span key={index} style={tagStyle(theme.missingBg, theme.missingText)}>
                                        {item}
                                    </span>
                                ))
                            ) : (
                                <EmptyText text="No missing skills." theme={theme} />
                            )}
                        </Section>

                        <Section title="AI Explanation" theme={theme}>
                            <p style={{ margin: 0, color: theme.subText, lineHeight: 1.6 }}>
                                {getAiExplanation()}
                            </p>
                        </Section>

                        <Section title="Suggestions to Improve ATS Match" theme={theme}>
                            {analysis.suggestions?.length > 0 ? (
                                <ul style={{ margin: 0, paddingLeft: "20px", color: theme.subText, lineHeight: 1.8 }}>
                                    {analysis.suggestions.map((item, index) => (
                                        <li key={index}>{item}</li>
                                    ))}
                                </ul>
                            ) : (
                                <EmptyText text="No suggestions." theme={theme} />
                            )}
                        </Section>
                    </div>
                )}
            </div>
        </div>
    );
}

function InfoCard({ title, value, theme }) {
    return (
        <div
            style={{
                background: theme.sectionBg,
                border: `1px solid ${theme.border}`,
                borderRadius: "16px",
                padding: "18px"
            }}
        >
            <p style={{ margin: 0, fontSize: "13px", color: theme.subText }}>{title}</p>
            <h3 style={{ margin: "8px 0 0 0" }}>{value}</h3>
        </div>
    );
}

function Section({ title, children, theme }) {
    return (
        <div
            style={{
                background: theme.sectionBg,
                border: `1px solid ${theme.border}`,
                borderRadius: "16px",
                padding: "18px",
                marginBottom: "16px"
            }}
        >
            <h3 style={{ marginTop: 0 }}>{title}</h3>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", width: "100%" }}>
                {children}
            </div>
        </div>
    );
}

function EmptyText({ text, theme }) {
    return <p style={{ margin: 0, color: theme.subText }}>{text}</p>;
}

export default App;