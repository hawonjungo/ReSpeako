import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { ThemeContext } from './ThemeContext';
import Header from "./layouts/Header";

const learningTopics = [
  {
    title: "Word Formation",
    description: "Master prefixes, suffixes, and word building techniques",
    icon: "📚",
    href: "/english-learning/word-formation",
    color: {
      light: "from-blue-100 to-blue-300 border-blue-200",
      dark: "from-blue-900 to-blue-800 border-blue-700",
    },
  },
  {
    title: "Grammar Tips",
    description: "Essential grammar rules and common mistakes to avoid",
    icon: "✍️",
    href: "/english-learning/grammar-tips",
    color: {
      light: "from-green-100 to-green-300 border-green-200",
      dark: "from-green-900 to-green-800 border-green-700",
    },
  },
  {
    title: "Academic Writing",
    description: "Improve your formal writing and essay structure",
    icon: "📝",
    href: "/english-learning/academic-writing",
    color: {
      light: "from-purple-100 to-purple-300 border-purple-200",
      dark: "from-purple-900 to-purple-800 border-purple-700",
    },
  },
  {
    title: "Vocabulary",
    description: "Expand your vocabulary with targeted word lists",
    icon: "📖",
    href: "/english-learning/vocabulary",
    color: {
      light: "from-orange-100 to-orange-300 border-orange-200",
      dark: "from-orange-900 to-orange-800 border-orange-700",
    },
  },
  {
    title: "Pronunciation",
    description: "Perfect your pronunciation and listening skills",
    icon: "🎤",
    href: "/english-learning/pronunciation",
    color: {
      light: "from-red-100 to-red-300 border-red-200",
      dark: "from-red-900 to-red-800 border-red-700",
    },
  },
  {
    title: "Quizzes",
    description: "Test your knowledge with interactive practice quizzes",
    icon: "🎯",
    href: "/english-learning/quizzes",
    color: {
      light: "from-indigo-100 to-indigo-300 border-indigo-200",
      dark: "from-indigo-900 to-indigo-800 border-indigo-700",
    },
  },
];

export default function Learning() {
  const { darkMode } = useContext(ThemeContext);

  return (
    <div
      className={`relative min-h-screen pb-20 px-4 flex flex-col items-center justify-start
        ${darkMode ? 'bg-cyan text-white' : 'bg-white text-black'} transition-colors`}
    >
      <p className="italic text-yellow-500 font-semibold text-sm text-center mb-6 max-w-2xl">
        Unlock your English potential with interactive lessons!
      </p>

      <div className="w-full max-w-5xl mx-auto mt-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {learningTopics.map((topic, idx) => (
            <Link
              key={idx}
              to={topic.href}
              className={`group rounded-xl border p-6 flex flex-col items-center justify-center cursor-pointer shadow-md
                bg-gradient-to-b ${darkMode ? topic.color.dark : topic.color.light}
                ${darkMode ? 'text-white' : 'text-black'}
                hover:-translate-y-1 transition duration-200`}
            >
              <span className="text-5xl mb-3">{topic.icon}</span>
              <span className="text-xl font-bold mb-2">{topic.title}</span>
              <span className="text-sm mb-4 text-center opacity-80">{topic.description}</span>
              <button
                className={`px-4 py-2 rounded bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold shadow
                  hover:scale-105 transition duration-200`}
              >
                Start Learning
              </button>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
