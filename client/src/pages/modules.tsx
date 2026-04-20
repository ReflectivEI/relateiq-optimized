import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  BookOpen,
  Search,
  Users,
  FileText,
  Shield,
  CheckCircle,
  Brain,
  Play,
  Target,
  ChevronRight,
  Sparkles,
  ArrowRight,
  RotateCcw,
  X,
} from "lucide-react";
import { coachingModules, eqFrameworks } from "@/lib/data";
import type { CoachingModule } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

const moduleIcons: Record<string, any> = {
  Search,
  Users,
  FileText,
  Shield,
  CheckCircle,
  Brain,
};

const categoryLabels: Record<string, string> = {
  discovery: "Discovery",
  stakeholder: "Stakeholder",
  clinical: "Clinical",
  objection: "Objection Handling",
  closing: "Closing",
  eq: "Emotional Intelligence",
};

type ExerciseContent = {
  title: string;
  instructions: string;
  content: Array<{ question: string; options?: string[]; correctAnswer?: string; explanation: string }>;
};

export default function ModulesPage() {
  const [selectedModule, setSelectedModule] = useState<CoachingModule | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [exerciseData, setExerciseData] = useState<ExerciseContent | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [isExerciseActive, setIsExerciseActive] = useState(false);

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

  const handleStartExercise = (exerciseType: string) => {
    if (!selectedModule) return;
    generateExerciseMutation.mutate({
      moduleTitle: selectedModule.title,
      moduleDescription: selectedModule.description,
      exerciseType: exerciseType as "quiz" | "practice" | "roleplay",
    });
  };

  const handleSubmitAnswer = () => {
    if (!exerciseData) return;
    const currentQuestion = exerciseData.content[currentQuestionIndex];
    if (selectedAnswer === currentQuestion.correctAnswer) {
      setScore(score + 1);
    }
    setShowExplanation(true);
  };

  const handleNextQuestion = () => {
    if (!exerciseData) return;
    if (currentQuestionIndex < exerciseData.content.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer("");
      setShowExplanation(false);
    } else {
      setIsExerciseActive(false);
    }
  };

  const handleRestartExercise = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer("");
    setShowExplanation(false);
    setScore(0);
    setIsExerciseActive(true);
  };

  const filteredModules = activeTab === "all"
    ? coachingModules
    : coachingModules.filter(m => m.category === activeTab);

  const getFrameworkDetails = (frameworkId: string) => {
    return eqFrameworks.find(f => f.id === frameworkId);
  };

  if (selectedModule) {
    const IconComponent = moduleIcons[selectedModule.icon] || BookOpen;

    if (exerciseData && !isExerciseActive) {
      return (
        <div className="h-full overflow-auto">
          <div className="p-6">
            <Button
              variant="ghost"
              className="mb-4"
              onClick={() => {
                setExerciseData(null);
                setIsExerciseActive(false);
              }}
              data-testid="button-back-to-module"
            >
              <ChevronRight className="h-4 w-4 mr-2 rotate-180" />
              Back to Module
            </Button>

            <div className="max-w-2xl mx-auto">
              <Card>
                <CardHeader className="text-center">
                  <div className="h-16 w-16 rounded-full bg-chart-4/10 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="h-8 w-8 text-chart-4" />
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
                        : "Keep learning! Review the module content and try again."}
                    </p>
                  </div>
                  <div className="flex gap-3 justify-center pt-4">
                    <Button variant="outline" onClick={handleRestartExercise} data-testid="button-restart-exercise">
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Try Again
                    </Button>
                    <Button onClick={() => {
                      setExerciseData(null);
                      setIsExerciseActive(false);
                    }} data-testid="button-back-to-module-done">
                      Back to Module
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      );
    }

    if (exerciseData && isExerciseActive) {
      const currentQuestion = exerciseData.content[currentQuestionIndex];
      return (
        <div className="h-full overflow-auto">
          <div className="p-6">
            <Button
              variant="ghost"
              className="mb-4"
              onClick={() => {
                setExerciseData(null);
                setIsExerciseActive(false);
              }}
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
                    <div className="p-4 bg-muted rounded-lg">
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
        <div className="p-6">
          <Button
            variant="ghost"
            className="mb-4"
            onClick={() => setSelectedModule(null)}
            data-testid="button-back-modules"
          >
            <ChevronRight className="h-4 w-4 mr-2 rotate-180" />
            Back to Modules
          </Button>

          <div className="max-w-4xl mx-auto">
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-md bg-primary flex items-center justify-center">
                    <IconComponent className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline">{categoryLabels[selectedModule.category]}</Badge>
                    </div>
                    <CardTitle className="text-2xl" data-testid="text-module-detail-title">
                      {selectedModule.title}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {selectedModule.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-6">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{selectedModule.progress}%</span>
                  </div>
                  <Progress value={selectedModule.progress} className="h-2" />
                </div>

                <div className="flex flex-wrap gap-2">
                  {selectedModule.frameworks.map((fw) => {
                    const framework = getFrameworkDetails(fw);
                    return (
                      <Badge key={fw} variant="secondary">
                        <Brain className="h-3 w-3 mr-1" />
                        {framework?.name || fw}
                      </Badge>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="mb-6 border-primary/20 bg-primary/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  AI-Powered Practice
                </CardTitle>
                <CardDescription>
                  Generate personalized quiz questions to test your understanding of this module
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  className="w-full"
                  onClick={() => handleStartExercise("quiz")}
                  disabled={generateExerciseMutation.isPending}
                  data-testid="button-generate-quiz"
                >
                  {generateExerciseMutation.isPending ? (
                    <Sparkles className="h-4 w-4 mr-2 animate-pulse" />
                  ) : (
                    <Target className="h-4 w-4 mr-2" />
                  )}
                  {generateExerciseMutation.isPending ? "Generating Questions..." : "Start Practice Quiz"}
                </Button>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">Exercises</CardTitle>
                <CardDescription>Complete these exercises to master this module</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {selectedModule.exercises.map((exercise, index) => (
                    <div
                      key={exercise.id}
                      className="flex items-center gap-4 p-4 border rounded-lg hover-elevate cursor-pointer"
                      data-testid={`exercise-${exercise.id}`}
                    >
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                        <span className="text-sm font-medium">{index + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{exercise.title}</h4>
                          <Badge variant="outline" className="text-xs">
                            {exercise.type}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{exercise.description}</p>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartExercise(exercise.type);
                        }}
                        disabled={generateExerciseMutation.isPending}
                        data-testid={`button-start-exercise-${exercise.id}`}
                      >
                        {generateExerciseMutation.isPending ? (
                          <Sparkles className="h-4 w-4 mr-1 animate-pulse" />
                        ) : (
                          <Play className="h-4 w-4 mr-1" />
                        )}
                        Start
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Related EI Frameworks</CardTitle>
                <CardDescription>Understanding these frameworks will help you excel</CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {selectedModule.frameworks.map((fw) => {
                    const framework = getFrameworkDetails(fw);
                    if (!framework) return null;
                    return (
                      <AccordionItem key={fw} value={fw}>
                        <AccordionTrigger className="text-left">
                          <div className="flex items-center gap-2">
                            <Brain className="h-4 w-4 text-primary" />
                            {framework.name}
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <p className="text-muted-foreground mb-4">{framework.description}</p>
                          <div className="space-y-2">
                            <h5 className="font-medium text-sm">Key Principles:</h5>
                            <ul className="space-y-1">
                              {framework.principles.map((p, i) => (
                                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                  <Target className="h-3 w-3 mt-1 flex-shrink-0" />
                                  {p}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <div className="p-6">
        <div className="flex flex-col gap-2 mb-6">
          <h1 className="text-2xl font-bold" data-testid="text-modules-title">Coaching Modules</h1>
          <p className="text-muted-foreground">
            Build your pharma sales mastery with structured learning paths
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="all" data-testid="tab-all">All</TabsTrigger>
            <TabsTrigger value="discovery" data-testid="tab-discovery">Discovery</TabsTrigger>
            <TabsTrigger value="stakeholder" data-testid="tab-stakeholder">Stakeholder</TabsTrigger>
            <TabsTrigger value="clinical" data-testid="tab-clinical">Clinical</TabsTrigger>
            <TabsTrigger value="objection" data-testid="tab-objection">Objection</TabsTrigger>
            <TabsTrigger value="closing" data-testid="tab-closing">Closing</TabsTrigger>
            <TabsTrigger value="eq" data-testid="tab-eq">EI</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredModules.map((module) => {
            const IconComponent = moduleIcons[module.icon] || BookOpen;
            return (
              <Card
                key={module.id}
                className="hover-elevate cursor-pointer"
                onClick={() => setSelectedModule(module)}
                data-testid={`card-module-${module.id}`}
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="h-10 w-10 rounded-md bg-primary flex items-center justify-center flex-shrink-0">
                      <IconComponent className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Badge variant="outline" className="mb-1">{categoryLabels[module.category]}</Badge>
                      <h3 className="font-semibold">{module.title}</h3>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                    {module.description}
                  </p>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{module.progress}%</span>
                    </div>
                    <Progress value={module.progress} className="h-1.5" />
                  </div>

                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1">
                      <Badge variant="secondary" className="text-xs">
                        {module.exercises.length} exercises
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        <Sparkles className="h-3 w-3 mr-1" />
                        AI
                      </Badge>
                    </div>
                    <Button variant="ghost" size="sm">
                      Start
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
