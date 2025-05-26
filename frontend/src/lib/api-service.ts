export async function uploadFilesToServer(uploadedFiles: File[], prompt: string): Promise<any> {
    const formData = new FormData();
    uploadedFiles.forEach((file) => formData.append("files", file));
    formData.append("prompt", prompt);

    try {
        const response = await fetch("http://100.88.78.35:5000/api/v1/upload", {
            headers: {
                "Content-Type": "multipart/form-data",
            },
            method: "POST",
            body: formData,
        });

        if (!response.ok) {
            throw new Error("Network response was not ok");
        }

        return await response.json();
    } catch (error) {
        console.error("Error processing request:", error);
        throw error;
    }
}