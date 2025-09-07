import React, { useContext, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Lightbulb, Target, Brain, CheckCircle, FileText } from "lucide-react";
import { ThemeContext } from "./ThemeContext";
import Header from "./layouts/Header";

export default function WordFormation() {
  const { darkMode } = useContext(ThemeContext);
  const [currentQuiz, setCurrentQuiz] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState([]);
  const [showResults, setShowResults] = useState(false);

  const quizQuestions = [
    {
      question: "What is the correct noun form of 'happy'?",
      options: ["happyness", "happiness", "happines", "hapiness"],
      correct: 1,
    },
    {
      question: "Which suffix creates an adjective meaning 'full of'?",
      options: ["-less", "-ful", "-ness", "-ment"],
      correct: 1,
    },
    {
      question: "What is the verb form of 'decision'?",
      options: ["decisionate", "decide", "decisify", "decise"],
      correct: 1,
    },
    {
      question: "Which prefix means 'not' or 'opposite of'?",
      options: ["pre-", "re-", "un-", "over-"],
      correct: 2,
    },
    {
      question: "What is the adjective form of 'care'?",
      options: ["careless", "careful", "caring", "all of the above"],
      correct: 3,
    },
  ];

  const handleAnswerSelect = (answerIndex) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuiz] = answerIndex;
    setSelectedAnswers(newAnswers);
  };

  const nextQuestion = () => {
    if (currentQuiz < quizQuestions.length - 1) {
      setCurrentQuiz(currentQuiz + 1);
    } else {
      setShowResults(true);
    }
  };

  const resetQuiz = () => {
    setCurrentQuiz(0);
    setSelectedAnswers([]);
    setShowResults(false);
  };

  const getScore = () => {
    return selectedAnswers.reduce((score, answer, index) => {
      return score + (answer === quizQuestions[index].correct ? 1 : 0);
    }, 0);
  };

  return (
    <div className={`min-h-screen ${darkMode ? "bg-cyan text-white" : "bg-white text-black"} transition-colors`}>      
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-4xl font-bold text-center text-foreground">English Word Formation</h1>
          <p className="text-center text-muted-foreground mt-2">
            Master the art of creating new words from existing ones
          </p>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Navigation */}
        <nav className="flex flex-wrap justify-center gap-2 mb-8">
          {["Introduction", "Explanation", "Examples", "Tips", "Quiz", "Summary"].map((section) => (
            <Button
              key={section}
              variant="outline"
              size="sm"
              onClick={() => document.getElementById(section.toLowerCase())?.scrollIntoView({ behavior: "smooth" })}
            >
              {section}
            </Button>
          ))}
        </nav>

        {/* Introduction */}
        <Card id="introduction" className="scroll-mt-20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-primary" />
              <CardTitle>Introduction</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-foreground leading-relaxed">
              Word formation is the process of creating new words by adding prefixes, suffixes, or combining existing
              words. It's a fundamental aspect of English that helps expand vocabulary and express ideas more precisely.
            </p>
            <p className="text-foreground leading-relaxed">Understanding word formation patterns will help you:</p>
            <ul className="list-disc list-inside space-y-2 text-foreground ml-4">
              <li>Guess the meaning of unfamiliar words</li>
              <li>Create new words when needed</li>
              <li>Improve your reading comprehension</li>
              <li>Enhance your writing skills</li>
            </ul>
          </CardContent>
        </Card>

        {/* Explanation */}
        <Card id="explanation" className="scroll-mt-20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Target className="h-6 w-6 text-primary" />
              <CardTitle>Detailed Explanation</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-3 text-foreground">Types of Word Formation</h3>

              <div className="space-y-4">
                <div className="border-l-4 border-primary pl-4">
                  <h4 className="font-semibold text-foreground">1. Prefixes</h4>
                  <p className="text-muted-foreground">Added to the beginning of words to change meaning</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge variant="secondary">un- (unhappy)</Badge>
                    <Badge variant="secondary">re- (rewrite)</Badge>
                    <Badge variant="secondary">pre- (preview)</Badge>
                  </div>
                </div>

                <div className="border-l-4 border-accent pl-4">
                  <h4 className="font-semibold text-foreground">2. Suffixes</h4>
                  <p className="text-muted-foreground">Added to the end of words to change part of speech or meaning</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge variant="secondary">-ness (happiness)</Badge>
                    <Badge variant="secondary">-ful (careful)</Badge>
                    <Badge variant="secondary">-ly (quickly)</Badge>
                  </div>
                </div>

                <div className="border-l-4 border-primary pl-4">
                  <h4 className="font-semibold text-foreground">3. Compound Words</h4>
                  <p className="text-muted-foreground">Combining two or more words to create new meaning</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge variant="secondary">bookstore</Badge>
                    <Badge variant="secondary">sunshine</Badge>
                    <Badge variant="secondary">homework</Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Examples */}
        <Card id="examples" className="scroll-mt-20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" />
              <CardTitle>Examples</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3 text-foreground">Common Prefixes</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-2 bg-muted rounded">
                    <span className="font-medium">un-</span>
                    <span className="text-muted-foreground">happy → unhappy</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-muted rounded">
                    <span className="font-medium">dis-</span>
                    <span className="text-muted-foreground">agree → disagree</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-muted rounded">
                    <span className="font-medium">re-</span>
                    <span className="text-muted-foreground">write → rewrite</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-muted rounded">
                    <span className="font-medium">pre-</span>
                    <span className="text-muted-foreground">view → preview</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3 text-foreground">Common Suffixes</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-2 bg-muted rounded">
                    <span className="font-medium">-ness</span>
                    <span className="text-muted-foreground">kind → kindness</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-muted rounded">
                    <span className="font-medium">-ful</span>
                    <span className="text-muted-foreground">care → careful</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-muted rounded">
                    <span className="font-medium">-less</span>
                    <span className="text-muted-foreground">hope → hopeless</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-muted rounded">
                    <span className="font-medium">-ly</span>
                    <span className="text-muted-foreground">quick → quickly</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tips */}
        <Card id="tips" className="scroll-mt-20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lightbulb className="h-6 w-6 text-primary" />
              <CardTitle>Memory Tips</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-accent/10 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                  <div>
                    <h5 className="font-medium text-foreground">Learn Root Words</h5>
                    <p className="text-sm text-muted-foreground">Focus on common root words and their meanings</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-accent/10 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                  <div>
                    <h5 className="font-medium text-foreground">Practice Patterns</h5>
                    <p className="text-sm text-muted-foreground">Notice patterns in how prefixes and suffixes work</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-accent/10 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                  <div>
                    <h5 className="font-medium text-foreground">Use Context Clues</h5>
                    <p className="text-sm text-muted-foreground">Use surrounding words to guess meanings</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-primary/10 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h5 className="font-medium text-foreground">Make Word Families</h5>
                    <p className="text-sm text-muted-foreground">Group words with the same root together</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-primary/10 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h5 className="font-medium text-foreground">Read Extensively</h5>
                    <p className="text-sm text-muted-foreground">Exposure to various texts helps recognition</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-primary/10 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h5 className="font-medium text-foreground">Keep a Word Journal</h5>
                    <p className="text-sm text-muted-foreground">Record new words and their formations</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quiz */}
        <Card id="quiz" className="scroll-mt-20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Brain className="h-6 w-6 text-primary" />
              <CardTitle>Interactive Quiz</CardTitle>
              <CardDescription>Test your understanding of word formation</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {!showResults ? (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Question {currentQuiz + 1} of {quizQuestions.length}
                  </span>
                  <div className="w-32 bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${((currentQuiz + 1) / quizQuestions.length) * 100}%` }}
                    />
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-4 text-foreground">{quizQuestions[currentQuiz].question}</h3>

                  <div className="space-y-2">
                    {quizQuestions[currentQuiz].options.map((option, index) => (
                      <button
                        key={index}
                        onClick={() => handleAnswerSelect(index)}
                        className={`w-full text-left p-3 rounded-lg border transition-colors ${
                          selectedAnswers[currentQuiz] === index
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border hover:border-primary/50 hover:bg-muted/50"
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>

                <Button onClick={nextQuestion} disabled={selectedAnswers[currentQuiz] === undefined} className="w-full">
                  {currentQuiz === quizQuestions.length - 1 ? "Finish Quiz" : "Next Question"}
                </Button>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <div className="text-4xl font-bold text-primary">
                  {getScore()}/{quizQuestions.length}
                </div>
                <p className="text-lg text-foreground">
                  You got {getScore()} out of {quizQuestions.length} questions correct!
                </p>
                <p className="text-muted-foreground">
                  {getScore() === quizQuestions.length
                    ? "Perfect! You've mastered word formation!"
                    : getScore() >= 3
                      ? "Great job! Keep practicing to improve further."
                      : "Good effort! Review the material and try again."}
                </p>
                <Button onClick={resetQuiz} variant="outline">
                  Try Again
                </Button>
              </div>
            )}
          </CardContent>
        </Card>


        {/* Summary */}
        <Card id="summary" className="scroll-mt-20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-primary" />
              <CardTitle>Summary</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-foreground leading-relaxed">
              Word formation is a powerful tool for expanding your English vocabulary. By understanding how prefixes,
              suffixes, and compound words work, you can decode unfamiliar words and create new ones when needed.
            </p>

            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2 text-foreground">Key Takeaways:</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Prefixes change the meaning of words (un-, re-, pre-, dis-)</li>
                <li>• Suffixes often change the part of speech (-ness, -ful, -ly, -ment)</li>
                <li>• Compound words combine meanings (bookstore, sunshine, homework)</li>
                <li>• Context helps you understand new word formations</li>
                <li>• Regular practice improves recognition and usage</li>
              </ul>
            </div>

            <p className="text-foreground leading-relaxed">
              Continue practicing by reading diverse texts, keeping a vocabulary journal, and paying attention to word
              patterns. With time and practice, word formation will become second nature!
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <footer className="border-t bg-card mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-muted-foreground">
          <p>© 2024 English Word Formation Learning Page. Happy Learning!</p>
        </div>
      </footer>
    </div>
  )
}
