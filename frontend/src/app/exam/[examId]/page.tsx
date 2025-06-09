"use client"

import {ExamCarousel} from "@/components/exam/ExamCarousel";
import { getSuggestedAnswerFromApi, getExamById } from "@/lib/api-service";
import { useState, useEffect } from "react";
import { MultipleChoiceQuestion, OpenEndedQuestion } from "../../types";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function ExamPage() {
    const params = useParams();
    const examId = params?.examId as string | undefined;
    const [questions, setQuestions] = useState<(MultipleChoiceQuestion | OpenEndedQuestion)[] | null>(null);
    const [error, setError] = useState<string | null>(null);

    const isLoading = questions === null;

    console.log("ExamPage useEffect triggered with examId:", examId);

    useEffect(() => {
        console.log("ExamPage useEffect triggered with examId:", examId);
        if (!examId) return;
        const data = localStorage.getItem(`examData_${examId}`);
        if (data) {
            try {
                localStorage.removeItem(`examData_${examId}`);
                console.log("Loaded exam data from localStorage:", data);
                const parsed = JSON.parse(data);
                if (parsed.questions && Array.isArray(parsed.questions)) {
                    setQuestions(parsed.questions);
                    return;
                }
            } catch (e) {
                // Ignore parse errors, fallback to fetch
            }
        }
        console.log("Fetching exam data from API for examId:", examId);
        getExamById(examId)
            .then((examJson) => {
                if (examJson?.questions && Array.isArray(examJson.questions)) {
                    console.log("Successfully fetched exam data:", examJson);
                    setQuestions(examJson.questions);
                }
            })
            .catch(() => setError("Could not load exam data."));
    }, []);

    const onAiAnswerRequest = async (question: OpenEndedQuestion) => {
        setQuestions(prevQuestions =>
            prevQuestions ? prevQuestions.map(q =>
                q.question === question.question
                    ? { ...q, isAiSuggestionLoading: true, aiSuggestionError: false }
                    : q
            ) : prevQuestions
        );
        try {
            console.debug("Requesting AI answer for question:", question);
            const answer: string = await getSuggestedAnswerFromApi(question.question, question.supplementalContent);
            console.debug("Successfully received AI answer:", answer);
            setQuestions(prevQuestions =>
                prevQuestions ? prevQuestions.map(q =>
                    q.question === question.question
                        ? { ...q, suggestedAnswer: answer, isAiSuggestionLoading: false, aiSuggestionError: false }
                        : q
                ) : prevQuestions
            );
        } catch (error) {
            console.error("Error getting AI answer:", error);
            setQuestions(prevQuestions =>
                prevQuestions ? prevQuestions.map(q =>
                    q.question === question.question
                        ? { ...q, isAiSuggestionLoading: false, aiSuggestionError: true }
                        : q
                ) : prevQuestions
            );
        }
    };
    

    if (isLoading) return (
        <div className="flex items-center justify-center h-screen w-screen">
            <div className="w-1/2 max-w-md">
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-2 bg-blue-500 animate-pulse w-full" style={{ animationDuration: '1.2s' }} />
                </div>
                <div className="flex justify-center mt-4">
                    <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                </div>
                <div className="text-center text-gray-600 mt-2">Loading exam...</div>
            </div>
        </div>
    );
    if (error) return <div className="flex items-center justify-center h-full text-red-600">{error}</div>;

    return (
        <div className="min-h-screen h-screen w-full flex flex-col items-center justify-center">
            <div className="w-full h-full flex-1 max-w-screen-md px-4 flex items-center justify-center">
                <ExamCarousel
                    props={{
                        questions: questions,
                        onAiAnswerRequest: onAiAnswerRequest,
                    }}
                />
            </div>
        </div>
    )
}
