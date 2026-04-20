import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { 
  Dumbbell, 
  Clock, 
  Target, 
  ChevronRight, 
  PlayCircle, 
  Sparkles,
  ArrowRight,
  RotateCcw,
  CheckCircle,
  X,
} from "lucide-react";
import { coachingModules } from "@/lib/data";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

type QuizQuestion = {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
};

type ExerciseContent = {
  title: string;
  content: QuizQuestion[];
};

const exercises = coachingModules.flatMap(module => 
  module.exercises.map(ex => ({
    ...ex,
    moduleTitle: module.title,
    moduleId: module.id,
    category: module.category,
    moduleDescription: module.description,
  }))
);

const typeColors: Record<string, string> = {
  practice: "bg-blue-500",
  roleplay: "bg-purple-500",
  quiz: "bg-green-500",
};

const typeLabels: Record<string, string> = {
  practice: "Practice",
  roleplay: "Role-Play",
  quiz: "Quiz",
};

export default function ExercisesPage() {
  const [selectedExercise, setSelectedExercise] = useState<typeof exercises[0] | null>(null);
  const [exerciseData, setExerciseData] = useState<ExerciseContent | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [isExerciseActive, setIsExerciseActive] = useState(false);
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set());

  const generateExerciseMutation = useMutation({
    mutationFn: async (data: { moduleTitle: string; moduleDescription: string; exerciseType: string }) => {
      const response = await apiRequest("POST", "/api/modules/exercise", data);
      return response.json();
    },
    onSuccess: (data) => {
      setExerciseData(data);
      setCurrentQuestionIndex(0);
      setSelectedAnswer("");
      setShowExplanation(false);
      setScore(0);
      setIsExerciseActive(true);
    },
  });

  const handleStartExercise = (exercise: typeof exercises[0]) => {
    setSelectedExercise(exercise);
    generateExerciseMutation.mutate({
      moduleTitle: exercise.moduleTitle,
      moduleDescription: exercise.moduleDescription,
      exerciseType: exercise.type,
    });
  };

  const handleSubmitAnswer = () => {
    if (!exerciseData) return;
    const currentQuestion = exerciseData.content[currentQuestionIndex];
    if (selectedAnswer === currentQuestion.correctAnswer) {
      setScore(prev => prev + 1);
    }
    setShowExplanation(true);
  };

  const handleNextQuestion = () => {
    if (!exerciseData) return;
    if (currentQuestionIndex < exerciseData.content.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer("");
      setShowExplanation(false);
    } else {
      setIsExerciseActive(false);
      if (selectedExercise) {
        setCompletedExercises(prev => {
          const newSet = new Set(prev);
          newSet.add(selectedExercise.id);
          return newSet;
        });
      }
    }
  };

  const handleRestartExercise = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer("");
    setShowExplanation(false);
    setScore(0);
    setIsExerciseActive(true);
  };

  const handleExitExercise = () => {
    setSelectedExercise(null);
    setExerciseData(null);
    setIsExerciseActive(false);
    setCurrentQuestionIndex(0);
    setSelectedAnswer("");
    setShowExplanation(false);
    setScore(0);
  };

  if (generateExerciseMutation.isPending) {
    return (
      <div className="h-full overflow-auto">
        <div className="p-6 flex flex-col items-center justify-center min-h-[400px]">
          <Sparkles className="h-12 w-12 text-primary animate-pulse mb-4" />
          <h2 className="text-xl font-semibold mb-2">Generating Exercise</h2>
          <p className="text-muted-foreground">Creating personalized questions...</p>
        </div>
      </div>
    );
  }

  if (exerciseData && selectedExercise) {
    if (!isExerciseActive) {
      return (
        <div className="h-full overflow-auto">
          <div className="p-6">
            <Button
              variant="ghost"
              className="mb-4"
              onClick={handleExitExercise}
              data-testid="button-back-to-exercises"
            >
              <ChevronRight className="h-4 w-4 mr-2 rotate-180" />
              Back to Exercises
            </Button>

            <div className="max-w-2xl mx-auto">
              <Card>
                <CardHeader className="text-center">
                  <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  </div>
                  <CardTitle className="text-2xl">Exercise Complete!</CardTitle>
                  <CardDescription>
                    You scored {score} out of {exerciseData.content.length} questions
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-5xl font-bold text-primary mb-2">
                      {Math.round((score / exerciseData.content.length) * 100)}%
                    </div>
                    <p className="text-muted-foreground">
                      {score === exerciseData.content.length 
                        ? "Perfect score! You've mastered this topic."
                        : score >= exerciseData.content.length / 2
                        ? "Good job! Keep practicing to improve."
                        : "Keep learning! Review the content and try again."}
                    </p>
                  </div>
                  <div className="flex gap-3 justify-center pt-4">
                    <Button variant="outline" onClick={handleRestartExercise} data-testid="button-restart-exercise">
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Try Again
                    </Button>
                    <Button onClick={handleExitExercise} data-testid="button-back-done">
                      Back to Exercises
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      );
    }

    const currentQuestion = exerciseData.content[currentQuestionIndex];
    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;

    return (
      <div className="h-full overflow-auto">
        <div className="p-6">
          <Button
            variant="ghost"
            className="mb-4"
            onClick={handleExitExercise}
            data-testid="button-exit-exercise"
          >
            <ChevronRight className="h-4 w-4 mr-2 rotate-180" />
            Exit Exercise
          </Button>

          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <Badge variant="outline">
                    Question {currentQuestionIndex + 1} of {exerciseData.content.length}
                  </Badge>
                  <Badge variant="secondary">
                    Score: {score}
                  </Badge>
                </div>
                <Progress 
                  value={((currentQuestionIndex + 1) / exerciseData.content.length) * 100} 
                  className="h-2" 
                />
              </CardHeader>
              <CardContent className="space-y-6">
                <h3 className="text-lg font-medium">{currentQuestion.question}</h3>

                {currentQuestion.options && (
                  <RadioGroup
                    value={selectedAnswer}
                    onValueChange={setSelectedAnswer}
                    disabled={showExplanation}
                    className="space-y-3"
                  >
                    {currentQuestion.options.map((option, i) => {
                      const isThisCorrect = option === currentQuestion.correctAnswer;
                      const isThisSelected = option === selectedAnswer;
                      
                      let optionClass = "border";
                      let iconElement = null;
                      
                      if (showExplanation) {
                        if (isThisCorrect) {
                          optionClass = "border-2 border-green-500 bg-green-500/10";
                          iconElement = <CheckCircle className="h-4 w-4 text-green-500 ml-auto flex-shrink-0" />;
                        } else if (isThisSelected) {
                          optionClass = "border-2 border-red-500 bg-red-500/10";
                          iconElement = <X className="h-4 w-4 text-red-500 ml-auto flex-shrink-0" />;
                        } else {
                          optionClass = "border opacity-50";
                        }
                      } else {
                        optionClass = "border hover:bg-muted";
                      }
                      
                      return (
                        <div
                          key={i}
                          className={`flex items-center space-x-3 p-3 rounded-lg ${optionClass}`}
                        >
                          <RadioGroupItem value={option} id={`option-${i}`} />
                          <Label htmlFor={`option-${i}`} className="flex-1 cursor-pointer flex items-center gap-2">
                            <span>{option}</span>
                            {iconElement}
                          </Label>
                        </div>
                      );
                    })}
                  </RadioGroup>
                )}

                {showExplanation && (
                  <div className={`p-4 rounded-lg ${isCorrect ? "bg-green-500/10 border border-green-500/30" : "bg-muted"}`}>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      Explanation
                    </h4>
                    <p className="text-sm text-muted-foreground">{currentQuestion.explanation}</p>
                  </div>
                )}

                <div className="flex justify-end gap-3">
                  {!showExplanation ? (
                    <Button
                      onClick={handleSubmitAnswer}
                      disabled={!selectedAnswer}
                      data-testid="button-submit-answer"
                    >
                      Submit Answer
                    </Button>
                  ) : (
                    <Button onClick={handleNextQuestion} data-testid="button-next-question">
                      {currentQuestionIndex < exerciseData.content.length - 1 ? (
                        <>
                          Next Question
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </>
                      ) : (
                        "See Results"
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <div className="p-6 space-y-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <Dumbbell className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold" data-testid="text-exercises-title">Exercises</h1>
          </div>
          <p className="text-muted-foreground">
            Build your sales skills through hands-on practice exercises
          </p>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Target className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Overall Progress</p>
                  <p className="text-sm text-muted-foreground">{completedExercises.size} of {exercises.length} exercises completed</p>
                </div>
              </div>
              <div className="flex-1 max-w-xs">
                <Progress value={(completedExercises.size / exercises.length) * 100} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {exercises.map((exercise) => (
            <Card 
              key={exercise.id} 
              className={`hover-elevate cursor-pointer ${completedExercises.has(exercise.id) ? "border-green-500/50" : ""}`}
              onClick={() => handleStartExercise(exercise)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge 
                        variant="secondary" 
                        className={`${typeColors[exercise.type]} text-white`}
                      >
                        {typeLabels[exercise.type]}
                      </Badge>
                      {completedExercises.has(exercise.id) && (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                    <CardTitle className="text-base" data-testid={`text-exercise-${exercise.id}`}>
                      {exercise.title}
                    </CardTitle>
                  </div>
                </div>
                <CardDescription>{exercise.description}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>~10 min</span>
                  </div>
                  <Button size="sm" data-testid={`button-start-exercise-${exercise.id}`}>
                    <PlayCircle className="h-4 w-4 mr-1" />
                    {completedExercises.has(exercise.id) ? "Retry" : "Start"}
                  </Button>
                </div>
                <div className="mt-3 pt-3 border-t">
                  <p className="text-xs text-muted-foreground">
                    From: <span className="font-medium">{exercise.moduleTitle}</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
