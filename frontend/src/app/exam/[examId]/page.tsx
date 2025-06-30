"use client"


import { useState, useEffect } from "react";
import { MultipleChoiceQuestion, OpenEndedQuestion } from "../../../lib/frontend/types";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { API } from "@/lib/frontend/api-service";
import { ExamCarousel } from "@/components/exam/exam-carousel";
import ExamNotFound from "@/components/exam/exam-not-found";

const Loading = dynamic(() => import("@/app/loading"), { ssr: false });

export default function ExamPage() {
    const params = useParams();
    const examId = params?.examId as string | undefined;
    const [questions, setQuestions] = useState<(MultipleChoiceQuestion | OpenEndedQuestion)[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [notFound, setNotFound] = useState(false);
    const [isFetching, setIsFetching] = useState(false);

    useEffect(() => {
        if (!examId) return;
        if (questions !== null || isFetching) {
            console.warn("Exam questions already loaded, skipping fetch for examId:", examId);
            return;
        }

        const processEffect = async () => {
            setIsFetching(true);
            console.log("Loading exam with ID:", examId);

            const data = localStorage.getItem(`examData_${examId}`);
            if (data) {
                try {
                    localStorage.removeItem(`examData_${examId}`);
                    console.log("Loaded exam data from localStorage:", data);
                    const parsed = JSON.parse(data);
                    if (parsed.questions && Array.isArray(parsed.questions)) {
                        setQuestions(parsed.questions);
                        setIsFetching(false);
                        return;
                    }
                } catch (e) {
                    // Ignore parse errors, fallback to fetch
                }
            }
            console.log("Fetching exam data from API for ID:", examId);
            try {
                const examJson = await API.getExamById(examId);
                if (!examJson || !examJson.questions || !Array.isArray(examJson.questions)) {
                    setNotFound(true);
                    setIsFetching(false);
                    return;
                }
                console.log("Fetched exam data from API:", examJson);
                setQuestions(examJson.questions);
            } catch (e) {
                console.error("Failed to load exam:", e);
                setNotFound(true);
            } finally {
                setIsFetching(false);
            }
        }
        processEffect();
    }, [examId, questions]);

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
            const answer: string = await API.getSuggestedAnswerFromApi(question.question, question.supplementalContent);
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
    

    if (isFetching) return (
        <div className="flex-1 flex flex-col items-center w-full px-0 sm:px-2 md:px-4 py-4">
            <Loading />
        </div>
    );
    if (notFound) return <ExamNotFound />;
    if (error) return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50"><div className="text-red-600 text-lg font-semibold bg-white rounded-lg shadow p-6">{error}</div></div>;
    if (!questions) return null;

    return (
        <div className="w-full h-full flex flex-1 justify-center items-start py-2 px-1 sm:px-4 md:px-8 box-border min-h-[calc(100vh-64px)]">
            <div className="w-full h-full flex flex-col flex-1 min-h-[400px] max-h-[calc(100vh-120px)] p-0">
                <ExamCarousel
                    props={{
                        questions: questions!,
                        onAiAnswerRequest: onAiAnswerRequest,
                    }}
                />
            </div>
        </div>
    )
}
