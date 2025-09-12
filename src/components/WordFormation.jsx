import React, { useContext, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Lightbulb, Target, Brain, CheckCircle, FileText } from "lucide-react";
import { ThemeContext } from "./ThemeContext";


export default function WordFormation() {
  const { darkMode } = useContext(ThemeContext);
  const [currentQuiz, setCurrentQuiz] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const accentBg = darkMode ? "from-cyan-900/40 to-purple-900/40" : "from-indigo-50 to-purple-50";

  const quizQuestions = [
    {
      question: "What is the correct noun form of 'happy'?",
      options: ["happyness", "happiness", "happines", "hapiness"],
      correct: 1,
    },
    {
      question: "What is the correct noun form of 'invent'?",
      options: ["inventor", "inventionist", "inventness", "inventdom"],
      correct: 0,
    },
    {
      question: "What is the correct noun form of 'improve'?",
      options: ["improvment", "improvement", "improvance", "improvity"],
      correct: 1,
    },   
    {
      question: "What is the correct noun form of 'create'?",
      options: ["creativeness", "creation", "creator", "creatdom"],
      correct: 1,
    },
    {
      question: "What is the correct noun form of 'depend'?",
      options: ["dependance", "dependence", "dependment", "dependdom"],
      correct: 1,
    }
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
    <div className={`${darkMode ? "text-white" : "text-black"} transition-colors`}>
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Hero */}
        <div className={`bg-gradient-to-r ${accentBg} border border-border rounded-2xl p-8 text-center shadow-sm`}>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground">English Word Formation</h1>
          <p className="mt-2 text-muted-foreground">Master the art of creating new words from existing ones</p>
        </div>
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
        <Card id="introduction" className={`scroll-mt-20 bg-gradient-to-b ${accentBg} border border-primary/20`}>
          <CardHeader>
            <div className="flex gap-2 text-primary font-bold text-xl">
              <BookOpen className="h-6 w-6 text-primary" />
              <CardTitle>Introduction</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-left">
            <p className="text-foreground leading-relaxed">
            Word formation is the process of creating new words in English. It helps learners expand vocabulary and understand how words are related. 
            It's a fundamental aspect of English that helps expand vocabulary and express ideas more precisely.
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
        <Card id="explanation" className={`scroll-mt-20 bg-gradient-to-b ${accentBg} border border-primary/20`}>
          <CardHeader>
            <div className="flex items-center gap-2 text-primary font-bold text-xl">
              <Target className="h-6 w-6 text-primary" />
              <CardTitle>Detailed Explanation</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 text-left">
            <div>
              <h3 className="text-xl font-semibold mb-3 text-foreground">How to form nouns?</h3>
              <p className="text-foreground leading-relaxed">
                →	Nouns are words that represent <span className="font-bold  text-destructive">people, places, things, or ideas.</span>
                <br /> We often make nouns from other types of words, like verbs or adjectives. When we want to make our language more formal, we can use nouns we've made from <span className="font-bold  text-destructive">verbs or adjectives</span>.

              </p>
              <div className="space-y-4">

                <div className="border-l-4 border-primary pl-4">
                  <h4 className="font-semibold text-foreground">1. VERB → Noun/Person (-er, -or, -ant/-ent, -ist)</h4>
                  <p className="text-muted-foreground">Always refers to a person/entity doing something, not the action or thing itself.</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge variant="default">write → writer</Badge>
                    <Badge variant="default">invent → inventor</Badge>
                    <Badge variant="default">assist → assistant</Badge>
                    <Badge variant="default">tour → tourist</Badge>
                  </div>
                </div>

                <div className="border-l-4 border-secondary pl-4">
                  <h4 className="font-semibold text-foreground">2.VERB → Noun (Action/Result) (-ion, -ment, -ance, -ence)</h4>
                  <p className="text-muted-foreground">Not a person, but an action, event, or state.</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge variant="default">invent → invention</Badge>
                    <Badge variant="default">improve → improvement</Badge>
                    <Badge variant="default">accept → acceptance</Badge>
                    <Badge variant="default">depend → dependence</Badge>
                  </div>
                </div>

                <div className="border-l-4 border-primary pl-4">
                  <h4 className="font-semibold text-foreground">3.ADJECTIVE → Noun (Quality/State) (-ness, -dom, -ity)</h4>
                  <p className="text-muted-foreground">Always describes a quality or state, not a person or action.</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge variant="default">happy → happiness</Badge>
                    <Badge variant="default">official → officialdom</Badge>
                    <Badge variant="default">popular → popularity</Badge>
                  </div>
                </div>


              </div>
            </div>
          </CardContent>
        </Card>

        {/* Examples */}
        <Card id="examples" className="scroll-mt-20 border border-accent/30">
          <CardHeader>
            <div className="flex items-center gap-2 text-primary font-bold text-xl">
              <FileText className="h-6 w-6 text-primary" />
              <CardTitle>Examples</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-semibold mb-3 text-foreground">Common Person/Agent</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-2 bg-muted rounded">
                    <span className="font-medium">-er</span>
                    <span className="text-muted-foreground">teach → teacher</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-muted rounded">
                    <span className="font-medium">-er</span>
                    <span className="text-muted-foreground">write → writer </span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-muted rounded">
                    <span className="font-medium">-or</span>
                    <span className="text-muted-foreground">invent → inventor</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-muted rounded">
                    <span className="font-medium">-or</span>
                    <span className="text-muted-foreground">act → actor</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-muted rounded">
                    <span className="font-medium">-ant</span>
                    <span className="text-muted-foreground">assist → assistant</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-muted rounded">
                    <span className="font-medium">-ist</span>
                    <span className="text-muted-foreground">piano → pianist</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3 text-foreground">Common Action/Result</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-2 bg-muted rounded">
                    <span className="font-medium">-ion</span>
                    <span className="text-muted-foreground">invent → invention</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-muted rounded">
                    <span className="font-medium">-ion</span>
                    <span className="text-muted-foreground">create → creation </span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-muted rounded">
                    <span className="font-medium">-ment</span>
                    <span className="text-sm text-muted-foreground">achive → achievement</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-muted rounded">
                    <span className="font-medium">-ment</span>
                    <span className="text-muted-foreground">pay → payment</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-muted rounded">
                    <span className="font-medium">-ance</span>
                    <span className="text-muted-foreground">attend → attendance</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-muted rounded">
                    <span className="font-medium">-ence</span>
                    <span className="text-sm text-muted-foreground">depend → dependence</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3 text-foreground">Common Quality/State</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-2 bg-muted rounded">
                    <span className="font-medium">-ness</span>
                    <span className="text-muted-foreground">happy → happiness</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-muted rounded">
                    <span className="font-medium">-ness</span>
                    <span className="text-muted-foreground">rich → richness </span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-muted rounded">
                    <span className="font-medium">-ity</span>
                    <span className="text-muted-foreground">popular → popularity</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-muted rounded">
                    <span className="font-medium">-ity</span>
                    <span className="text-muted-foreground">able → ability</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-muted rounded">
                    <span className="font-medium">-dom</span>
                    <span className="text-muted-foreground">free → freedom</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-muted rounded">
                    <span className="font-medium">-dom</span>
                    <span className="text-muted-foreground">official → officialdom</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quiz */}
        <Card id="quiz" className="scroll-mt-20 border border-primary/20">
          <CardHeader>
            <div className="flex items-center gap-2 text-primary font-bold text-xl">
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
                        className={`w-full text-left p-3 rounded-lg border transition-colors ${selectedAnswers[currentQuiz] === index
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:border-primary/50 hover:bg-muted/50"
                          }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>

                <Button onClick={nextQuestion} disabled={selectedAnswers[currentQuiz] === undefined} className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:opacity-90">
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

        {/* Tips */}
        <Card id="tips" className={`scroll-mt-20 bg-gradient-to-b ${accentBg} border border-primary/20`}>
          <CardHeader>
            <div className="flex items-center gap-2 text-primary font-bold text-xl">
              <Lightbulb className="h-6 w-6 text-primary" />
              <CardTitle>Memory Tips</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="text-left">
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

        {/* Summary */}
        <Card id="summary" className={`scroll-mt-20 bg-gradient-to-b ${accentBg} border border-primary/20`}>
          <CardHeader>
            <div className="flex items-center gap-2 text-primary font-bold text-xl">
              <CheckCircle className="h-6 w-6 text-primary" />
              <CardTitle>Summary</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-left">
            <p className="text-foreground leading-relaxed">
              Word formation is a powerful tool for expanding your English vocabulary. By understanding how prefixes,
              suffixes, and compound words work, you can decode unfamiliar words and create new ones when needed.
            </p>

            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2 text-foreground">Key Takeaways:</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• suffix + base word + meaning → word</li>
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

    </div>
  )
}
