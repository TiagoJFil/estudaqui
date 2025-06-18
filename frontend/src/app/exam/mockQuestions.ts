import { MultipleChoiceQuestion, OpenEndedQuestion } from "../../lib/frontend/types";

export const mockQuestions: (MultipleChoiceQuestion | OpenEndedQuestion)[] = [
  // Multiple Choice Questions
  {
    question: "What is the capital of France?",
    supplementalContent: null,
    responses: ["Paris", "Berlin", "Madrid", "Rome"],
    correctResponse: "Paris",
  } as MultipleChoiceQuestion,
  {
    question: "Which language is primarily used for iOS development?",
    supplementalContent: null,
    responses: ["Java", "Swift", "Python", "Kotlin"],
    correctResponse: "Swift",
  } as MultipleChoiceQuestion,
  {
    question: "Who wrote 'Romeo and Juliet'?",
    supplementalContent: null,
    responses: ["William Shakespeare", "Charles Dickens", "Leo Tolstoy", "Mark Twain"],
    correctResponse: "William Shakespeare",
  } as MultipleChoiceQuestion,
  {
    question: "What is the boiling point of water at sea level?",
    supplementalContent: null,
    responses: ["100°C", "90°C", "80°C", "110°C"],
    correctResponse: "100°C",
  } as MultipleChoiceQuestion,
  {
    question: "Which of the following are programming languages?",
    supplementalContent: null,
    responses: ["HTML", "Python", "CSS", "JavaScript"],
    correctResponse: "Python",
  } as MultipleChoiceQuestion,
  {
    question: "Which element has the chemical symbol 'O'?",
    supplementalContent: null,
    responses: ["Oxygen", "Gold", "Osmium", "Silver"],
    correctResponse: "Oxygen",
  } as MultipleChoiceQuestion,
  {
    question: "Which planet is known as the Red Planet?",
    supplementalContent: null,
    responses: ["Mars", "Jupiter", "Venus", "Saturn"],
    correctResponse: "Mars",
  } as MultipleChoiceQuestion,
  {
    question: "What is 15% of 200?",
    supplementalContent: null,
    responses: ["30", "25", "35", "40"],
    correctResponse: "30",
  } as MultipleChoiceQuestion,
  {
    question: "Which continent is the Sahara Desert located in?",
    supplementalContent: null,
    responses: ["Africa", "Asia", "Australia", "South America"],
    correctResponse: "Africa",
  } as MultipleChoiceQuestion,
  {
    question: "What does 'CPU' stand for?",
    supplementalContent: null,
    responses: ["Central Processing Unit", "Computer Processing Unit", "Central Program Unit", "Control Processing Unit"],
    correctResponse: "Central Processing Unit",
  } as MultipleChoiceQuestion,

  // Open Ended Questions
  {
    question: "Explain the theory of relativity.",
    supplementalContent: "Include relevant scientific concepts and key principles.",
    suggestedAnswer: null,
  } as OpenEndedQuestion,
  {
    question: "Describe the process of photosynthesis.",
    supplementalContent: "Mention the role of sunlight, chlorophyll, and carbon dioxide.",
    suggestedAnswer: null,
  } as OpenEndedQuestion,
  {
    question: "Solve for x: 2x + 3 = 7",
    supplementalContent: "Show your work step by step.",
    suggestedAnswer: null,
  } as OpenEndedQuestion,
  {
    question: "Define the term 'ecosystem'.",
    supplementalContent: "Include examples and key components.",
    suggestedAnswer: null,
  } as OpenEndedQuestion,
  {
    question: "Write a brief summary of World War II.",
    supplementalContent: "Include major events, dates, and outcomes.",
    suggestedAnswer: null,
  } as OpenEndedQuestion,
  {
    question: "Explain the concept of supply and demand.",
    supplementalContent: "Provide examples and describe their relationship.",
    suggestedAnswer: null,
  } as OpenEndedQuestion,
  {
    question: "What does 'HTTP' stand for and what is its purpose?",
    supplementalContent: "Explain its role in web communication.",
    suggestedAnswer: null,
  } as OpenEndedQuestion,
  {
    question: "Discuss the impact of climate change.",
    supplementalContent: "Include environmental, economic, and social effects.",
    suggestedAnswer: null,
  } as OpenEndedQuestion,
  {
    question: "Translate: 'Hola, ¿cómo estás?' from Spanish to English.",
    supplementalContent: "Provide a natural translation.",
    suggestedAnswer: null,
  } as OpenEndedQuestion,
  {
    question: "What are the main components of a computer system?",
    supplementalContent: "Include hardware, software, and user interaction components.",
    suggestedAnswer: null,
  } as OpenEndedQuestion,
  {
    question: `Evaluate the integral:

\[
\int_0^1 x^2 \, dx
\]
`,
    supplementalContent: "Show all steps and provide the final answer.",
    suggestedAnswer: null,
  } as OpenEndedQuestion,
  {
    question: `State and explain the Second Law of Thermodynamics.`,
    supplementalContent: "Include an example involving heat engines.",
    suggestedAnswer: null,
  } as OpenEndedQuestion,
  {
    question: `Balance the following chemical equation:

\[
\ce{C2H6 + O2 -> CO2 + H2O}
\]
`,
    supplementalContent: "Provide the balanced equation and explain your reasoning.",
    suggestedAnswer: null,
  } as OpenEndedQuestion,
  {
    question: `Solve the differential equation:

\[
\frac{dy}{dx} + y = e^x
\]
`,
    supplementalContent: "Find the general solution.",
    suggestedAnswer: null,
  } as OpenEndedQuestion,
  {
    question: `What is the pH of a 0.01 M HCl solution?`,
    supplementalContent: "Show your calculation steps.",
    suggestedAnswer: null,
  } as OpenEndedQuestion,
  {
    question: `A projectile is launched at 30^\circ with an initial speed of 20 m/s. Calculate the maximum height reached.`,
    supplementalContent: "Show all relevant equations and steps.",
    suggestedAnswer: null,
  } as OpenEndedQuestion,
  {
    question: `State Heisenberg's Uncertainty Principle and provide a mathematical expression for it.`,
    supplementalContent: "Explain its significance in quantum mechanics.",
    suggestedAnswer: null,
  } as OpenEndedQuestion,
  {
    question: `Find the eigenvalues of the matrix:

\[
\begin{pmatrix} 2 & 1 \\ 1 & 2 \end{pmatrix}
\]
`,
    supplementalContent: "Show all steps in your calculation.",
    suggestedAnswer: null,
  } as OpenEndedQuestion,
  {
    question: `Write the equilibrium constant expression ($K_{eq}$) for the reaction:

\[
\ce{N2(g) + 3H2(g) <=> 2NH3(g)}
\]
`,
    supplementalContent: "Express your answer in terms of concentrations.",
    suggestedAnswer: null,
  } as OpenEndedQuestion,
  {
    question: `A block of mass 5 kg is pulled across a horizontal surface with a force of 20 N. If the coefficient of kinetic friction is 0.2, calculate the acceleration of the block.`,
    supplementalContent: "Show all calculations and formulas used.",
    suggestedAnswer: null,
  } as OpenEndedQuestion,
];
