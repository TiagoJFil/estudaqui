import { ExamJSON } from "@/services/examService";


export interface UserI {
    credits: number;
}

export interface PDFInfo {
    filename: string;
    storageRef: string;
    userId: string;
    examInfo?: ExamJSON;
}

//collections
export const COLLECTIONS = {
    USERS: "users",
    FILES: "files",
}
