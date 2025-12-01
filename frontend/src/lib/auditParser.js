/**
 * auditParser.js: Updated to use backend API for audit parsing
 */

export async function parseAuditPDF(file) {
    const API_URL = import.meta.env.VITE_API_URL || "https://schedule-sculptor-rag-811303121618.us-central1.run.app"; 

    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch(`${API_URL}/parse-audit`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Server error: ${response.status}`);
        }

        const parsedData = await response.json();
        return parsedData;

    } catch (error) {
        console.error("Error parsing audit:", error);
        throw error;
    }
}