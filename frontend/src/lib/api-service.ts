export async function uploadFilesToServer(uploadedFiles: File[]): Promise<any> {
    const formData = new FormData();
    uploadedFiles.forEach((file) => formData.append("files", file));

    try {
        const response = await fetch("/api/v1/upload", {
            method: "POST",
            body: formData,
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data; // Return the structured exam JSON
    } catch (error) {
        console.error("Error processing request:", error);
        throw error;
    }
}