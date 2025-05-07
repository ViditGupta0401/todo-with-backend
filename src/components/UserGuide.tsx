import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCheckCircle, 
  faRepeat, 
  faExclamationCircle, 
  faListAlt, 
  faChartLine, 
  faDumbbell, 
  faChevronRight, 
  faChevronLeft,
  faTimes
} from '@fortawesome/free-solid-svg-icons';

interface UserGuideProps {
  onClose: () => void;
}

export const UserGuide: React.FC<UserGuideProps> = ({ onClose }) => {
  const [currentPage, setCurrentPage] = useState(0);
  
  const pages = [
    {
      title: "Welcome to Doing App",
      content: (
        <div className="space-y-4">
          <p>
            Welcome to <span className="font-semibold text-[#ff4101]">Doing</span> - your personal task management and productivity companion. This guide will help you get started with all the features our app has to offer.
          </p>
          <div className="bg-gray-100 dark:bg-zinc-800 p-4 rounded-xl text-sm">
            <p className="italic">
              "Doing is designed with simplicity and effectiveness in mind, helping you track your daily tasks, monitor your progress, and maintain your health goals."
            </p>
          </div>
          <p>
            Let's explore the key features of the app! Use the navigation buttons below to move through this guide.
          </p>
        </div>
      )
    },
    {
      title: "Adding Tasks",
      content: (
        <div className="space-y-4">
          <p>
            Adding tasks in Doing is simple and intuitive:
          </p>
          <ol className="list-decimal pl-5 space-y-3">
            <li>
              Type your task in the input field at the top of the task list
            </li>
            <li>
              Select a priority level:
              <div className="flex items-center space-x-3 mt-2">
                <span className="px-2 py-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded text-xs">High</span>
                <span className="px-2 py-1 bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 rounded text-xs">Medium</span>
                <span className="px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded text-xs">Low</span>
              </div>
            </li>
            <li>
              Choose if it's a repeating task:
              <div className="flex items-center mt-2">
                <FontAwesomeIcon icon={faRepeat} className="text-[#ff4101] mr-2" />
                <span>Repeating tasks reset every day at 5 AM, while non-repeating tasks are automatically removed at that time</span>
              </div>
            </li>
            <li>
              Press Enter or click the Add button to add your task
            </li>
          </ol>
        </div>
      )
    },
    {
      title: "Managing Tasks",
      content: (
        <div className="space-y-4">
          <p>
            Once you've added tasks, you can:
          </p>
          <ul className="space-y-3">
            <li className="flex items-start">
              <FontAwesomeIcon icon={faCheckCircle} className="text-green-500 mt-1 mr-2" />
              <span>Mark tasks as complete by clicking the circle icon</span>
            </li>
            <li className="flex items-start">
              <div className="w-4 h-4 rounded-full border-2 border-gray-400 mt-1 mr-2"></div>
              <span>Incomplete tasks are shown with empty circles</span>
            </li>
            <li className="flex items-start">
              <FontAwesomeIcon icon={faExclamationCircle} className="text-red-500 mt-1 mr-2" />
              <span>Delete tasks with the delete icon that appears on hover</span>
            </li>
            <li className="flex items-start">
              <FontAwesomeIcon icon={faListAlt} className="text-blue-500 mt-1 mr-2" />
              <span>Filter tasks using the All, Active, and Completed buttons at the top</span>
            </li>
            <li className="flex items-start">
              <i className="mt-1 mr-2">↕️</i>
              <span>Reorder tasks by dragging and dropping them to your preferred order</span>
            </li>
          </ul>
          <div className="bg-gray-100 dark:bg-zinc-800 p-3 rounded-xl text-sm mt-2">
            <p>
              <strong>Pro Tip:</strong> Double-click on a task to edit its text
            </p>
          </div>
        </div>
      )
    },
    {
      title: "Task Reset System",
      content: (
        <div className="space-y-4">
          <p>
            Doing has a smart task reset system that helps you maintain a fresh daily task list:
          </p>
          <div className="bg-gray-100 dark:bg-zinc-800 p-4 rounded-xl space-y-3">
            <div className="flex items-start">
              <div className="min-w-8 mt-1">
                <FontAwesomeIcon icon={faRepeat} className="text-[#ff4101]" />
              </div>
              <div>
                <p className="font-medium">Repeating Tasks</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">Reset to incomplete every day at 5 AM</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">Stay in your list day after day</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="min-w-8 mt-1">
                <FontAwesomeIcon icon={faCheckCircle} className="text-green-500" />
              </div>
              <div>
                <p className="font-medium">Non-repeating Tasks</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">Automatically removed at 5 AM the next day</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">Useful for one-time tasks or daily unique activities</p>
              </div>
            </div>
          </div>
          <p className="text-sm italic">
            This system ensures you start each day with a clean slate while maintaining your recurring responsibilities.
          </p>
        </div>
      )
    },
    {
      title: "Analytics & Tracking",
      content: (
        <div className="space-y-4">
          <p>
            Track your productivity with powerful analytics:
          </p>
          <div className="space-y-3">
            <div className="flex items-start">
              <FontAwesomeIcon icon={faChartLine} className="text-[#ff4101] mt-1 mr-2" />
              <div>
                <p className="font-medium">Streaks & Stats</p>
                <p className="text-sm">Monitor your current streak, longest streak, and completion rate</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="grid grid-cols-3 gap-1 mt-1 mr-2 w-6">
                <div className="w-1.5 h-1.5 bg-green-300 rounded-sm"></div>
                <div className="w-1.5 h-1.5 bg-green-400 rounded-sm"></div>
                <div className="w-1.5 h-1.5 bg-green-500 rounded-sm"></div>
                <div className="w-1.5 h-1.5 bg-green-400 rounded-sm"></div>
                <div className="w-1.5 h-1.5 bg-green-500 rounded-sm"></div>
                <div className="w-1.5 h-1.5 bg-green-600 rounded-sm"></div>
                <div className="w-1.5 h-1.5 bg-green-500 rounded-sm"></div>
                <div className="w-1.5 h-1.5 bg-green-600 rounded-sm"></div>
                <div className="w-1.5 h-1.5 bg-green-700 rounded-sm"></div>
              </div>
              <div>
                <p className="font-medium">Heatmap Calendar</p>
                <p className="text-sm">Visualize your task completion patterns over time</p>
                <p className="text-sm">Click on days to see your task history</p>
              </div>
            </div>
          </div>
          <div className="bg-gray-100 dark:bg-zinc-800 p-3 rounded-xl text-sm">
            <p>
              <strong>Did you know?</strong> Your task history is saved so you can track your progress and productivity patterns over time.
            </p>
          </div>
        </div>
      )
    },
    {
      title: "BMI Calculator",
      content: (
        <div className="space-y-4">
          <p>
            Track your health alongside your tasks with our integrated BMI calculator:
          </p>
          <div className="flex items-start space-x-3 mb-3">
            <FontAwesomeIcon icon={faDumbbell} className="text-[#ff4101] text-xl mt-1" />
            <div>
              <p className="font-medium">Switch to BMI Mode</p>
              <p className="text-sm">Click the dumbbell icon in the analytics section to access the BMI calculator</p>
            </div>
          </div>
          <div className="space-y-2">
            <p className="font-medium">Key Features:</p>
            <ul className="space-y-2 text-sm list-disc pl-5">
              <li>Enter your height and weight to calculate your BMI</li>
              <li>Visual BMI meter shows your health category</li>
              <li>Weight tracking graph with customizable range</li>
              <li>Set target weight goals for each month</li>
              <li>Automatically saves your data for progress tracking</li>
            </ul>
          </div>
          <p className="text-sm italic">
            The BMI calculator helps you maintain awareness of your health goals alongside your productivity targets.
          </p>
        </div>
      )
    },
    {
      title: "Get Started!",
      content: (
        <div className="space-y-4">
          <p>
            You're all set to boost your productivity with <span className="font-semibold text-[#ff4101]">Doing</span>!
          </p>
          <div className="bg-gray-100 dark:bg-zinc-800 p-4 rounded-xl space-y-2">
            <p className="font-medium">Remember these key points:</p>
            <ul className="space-y-1 text-sm list-disc pl-5">
              <li>Add tasks with priorities and set whether they repeat</li>
              <li>Non-repeating tasks are removed at 5 AM the next day</li>
              <li>Track your progress with the analytics dashboard</li>
              <li>Monitor your health goals with the BMI calculator</li>
              <li>Your data is saved locally for privacy</li>
            </ul>
          </div>
          <p className="text-center font-medium mt-4">
            Thanks for using Doing!
          </p>
          <p className="text-center text-sm">
            Click "Close Guide" below to start using the app
          </p>
        </div>
      )
    }
  ];

  const nextPage = () => {
    if (currentPage < pages.length - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-auto">
      <div className="bg-white dark:bg-[#222126] rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
            {pages[currentPage].title}
          </h2>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
            aria-label="Close guide"
          >
            <FontAwesomeIcon icon={faTimes} className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>
        
        <div className="p-5 overflow-auto">
          {pages[currentPage].content}
        </div>
        
        <div className="flex justify-between items-center p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex space-x-1">
            {pages.map((_, index) => (
              <div 
                key={index} 
                className={`w-2.5 h-2.5 rounded-full ${
                  index === currentPage 
                    ? 'bg-[#ff4101]' 
                    : 'bg-gray-300 dark:bg-gray-700'
                }`}
              ></div>
            ))}
          </div>
          <div className="flex space-x-3">
            {currentPage > 0 && (
              <button
                onClick={prevPage}
                className="px-3 py-1.5 text-sm bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-white rounded-md hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors flex items-center"
              >
                <FontAwesomeIcon icon={faChevronLeft} className="h-3 w-3 mr-1" />
                Previous
              </button>
            )}
            
            {currentPage < pages.length - 1 ? (
              <button
                onClick={nextPage}
                className="px-3 py-1.5 text-sm bg-[#ff4101] text-white rounded-md hover:bg-[#e63900] transition-colors flex items-center"
              >
                Next
                <FontAwesomeIcon icon={faChevronRight} className="h-3 w-3 ml-1" />
              </button>
            ) : (
              <button
                onClick={onClose}
                className="px-3 py-1.5 text-sm bg-[#ff4101] text-white rounded-md hover:bg-[#e63900] transition-colors"
              >
                Close Guide
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};