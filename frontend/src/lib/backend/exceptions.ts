import { ExamJSON } from "./llm/types";

export class InvalidFileTypeError extends Error {
  constructor() {
    super("Invalid file type. Please upload a PDF.");
  }
}

export class EmptyPDFError extends Error {
  constructor() {
    super("The PDF file is empty or could not be processed.");
  }
}

export class ExistingUploadError extends Error {
  public readonly examJson: ExamJSON;
  constructor(examJson: ExamJSON) {
    super("Existing upload");
    this.examJson = examJson;
  }
}

export class InsufficientCreditsError extends Error {
  constructor() {
    super("Insufficient credits. Please purchase more credits to upload files.");
  }
}
