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

export async function getSuggestedAnswerFromApi(question: string, additionalContent: string | null): Promise<string> {
  try {
    const queryParams = new URLSearchParams();
    queryParams.append("question", question);
    if (additionalContent) {
        queryParams.append("additionalContent", additionalContent);
    }

    const response = await fetch("/api/v1/suggested-answer?" + queryParams.toString());

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.answer;
  } catch (error) {
    console.error("Error fetching suggested answer from API:", error);
    throw error;
  }
}
