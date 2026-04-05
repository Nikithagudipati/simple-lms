const { sequelize, Course, CourseMaterial, Quiz, Question } = require('../models');

(async () => {
  try {
    await sequelize.sync();

    // Get all published courses
    const courses = await Course.findAll({
      where: { status: 'published' }
    });

    if (courses.length === 0) {
      console.log('No published courses found. Please create courses first.');
      return;
    }

    console.log(`Found ${courses.length} courses. Adding materials and quizzes...`);

    // Subject-specific materials with real videos and PDFs from public sources
    const getMaterialsForCourse = (courseTitle) => {
      const titleLower = courseTitle.toLowerCase();
      
      if (titleLower.includes('dsa') || titleLower.includes('data structure') || titleLower.includes('algorithm')) {
        return [
          { 
            title: 'Introduction to Data Structures', 
            type: 'video', 
            url: 'https://www.youtube.com/embed/RBSGKlAvoiM',
            content: 'https://www.youtube.com/embed/RBSGKlAvoiM'
          },
          { 
            title: 'Arrays and Linked Lists Explained', 
            type: 'video', 
            url: 'https://www.youtube.com/embed/DuDz6B4cqVc',
            content: 'https://www.youtube.com/embed/DuDz6B4cqVc'
          },
          { 
            title: 'Tree and Graph Data Structures', 
            type: 'video', 
            url: 'https://www.youtube.com/embed/09_LlHjoEiY',
            content: 'https://www.youtube.com/embed/09_LlHjoEiY'
          },
          { 
            title: 'Sorting Algorithms Visualized', 
            type: 'video', 
            url: 'https://www.youtube.com/embed/kPRA0W1kESc',
            content: 'https://www.youtube.com/embed/kPRA0W1kESc'
          },
          {
            title: 'Big-O Notation and Complexity Analysis',
            type: 'video',
            url: 'https://www.youtube.com/embed/D6xkbGLQeq8',
            content: 'https://www.youtube.com/embed/D6xkbGLQeq8'
          }
        ];
      } else if (titleLower.includes('js') || titleLower.includes('javascript')) {
        return [
          { 
            title: 'JavaScript Basics Tutorial', 
            type: 'video', 
            url: 'https://www.youtube.com/embed/W6NZfCO5SIk',
            content: 'https://www.youtube.com/embed/W6NZfCO5SIk'
          },
          { 
            title: 'JavaScript Functions and Scope', 
            type: 'video', 
            url: 'https://www.youtube.com/embed/N8ap4k_5Qkw',
            content: 'https://www.youtube.com/embed/N8ap4k_5Qkw'
          },
          { 
            title: 'JavaScript ES6+ Features', 
            type: 'video', 
            url: 'https://www.youtube.com/embed/NCwa_xi0Uuc',
            content: 'https://www.youtube.com/embed/NCwa_xi0Uuc'
          },
          { 
            title: 'Async/Await and Promises', 
            type: 'video', 
            url: 'https://www.youtube.com/embed/PoRJizFVH94',
            content: 'https://www.youtube.com/embed/PoRJizFVH94'
          },
          { 
            title: 'DOM Manipulation', 
            type: 'video', 
            url: 'https://www.youtube.com/embed/wfoDToM2954',
            content: 'https://www.youtube.com/embed/wfoDToM2954'
          }
        ];
      } else if (titleLower.includes('python')) {
        return [
          { 
            title: 'Python Basics and Syntax', 
            type: 'video', 
            url: 'https://www.youtube.com/embed/rfscVS0vtik',
            content: 'https://www.youtube.com/embed/rfscVS0vtik'
          },
          { 
            title: 'Python Data Types and Variables', 
            type: 'video', 
            url: 'https://www.youtube.com/embed/_AEJHKGk9KI',
            content: 'https://www.youtube.com/embed/_AEJHKGk9KI'
          },
          { 
            title: 'Python Functions and Modules', 
            type: 'video', 
            url: 'https://www.youtube.com/embed/NE97yvKJbdA',
            content: 'https://www.youtube.com/embed/NE97yvKJbdA'
          },
          { 
            title: 'Python Object-Oriented Programming', 
            type: 'video', 
            url: 'https://www.youtube.com/embed/oDsPjUpXT7c',
            content: 'https://www.youtube.com/embed/oDsPjUpXT7c'
          },
          { 
            title: 'Working with Files and Libraries', 
            type: 'video', 
            url: 'https://www.youtube.com/embed/T-TwcmT6Acs',
            content: 'https://www.youtube.com/embed/T-TwcmT6Acs'
          }
        ];
      } else if (titleLower.includes('web') || titleLower.includes('html') || titleLower.includes('css')) {
        return [
          { 
            title: 'HTML Fundamentals', 
            type: 'video', 
            url: 'https://www.youtube.com/embed/UB3IVzvrI2A',
            content: 'https://www.youtube.com/embed/UB3IVzvrI2A'
          },
          { 
            title: 'CSS Styling and Layout', 
            type: 'video', 
            url: 'https://www.youtube.com/embed/OEV8eIPm8NA',
            content: 'https://www.youtube.com/embed/OEV8eIPm8NA'
          },
          { 
            title: 'Responsive Web Design', 
            type: 'video', 
            url: 'https://www.youtube.com/embed/srvUrAsNHVU',
            content: 'https://www.youtube.com/embed/srvUrAsNHVU'
          },
          { 
            title: 'Flexbox and Grid Layouts', 
            type: 'video', 
            url: 'https://www.youtube.com/embed/JJSoEo8JSnc',
            content: 'https://www.youtube.com/embed/JJSoEo8JSnc'
          },
          { 
            title: 'Web Development Best Practices', 
            type: 'video', 
            url: 'https://www.youtube.com/embed/sBzRwzY7G-k',
            content: 'https://www.youtube.com/embed/sBzRwzY7G-k'
          }
        ];
      } else if (titleLower.includes('test') || titleLower.includes('api')) {
        return [
          { 
            title: 'API Testing Fundamentals', 
            type: 'video', 
            url: 'https://www.youtube.com/embed/7YcW25PHnAA',
            content: 'https://www.youtube.com/embed/7YcW25PHnAA'
          },
          { 
            title: 'REST API Best Practices', 
            type: 'video', 
            url: 'https://www.youtube.com/embed/SLwpqD8n3d0',
            content: 'https://www.youtube.com/embed/SLwpqD8n3d0'
          },
          { 
            title: 'Unit Testing and TDD', 
            type: 'video', 
            url: 'https://www.youtube.com/embed/BBBOQp0HEcs',
            content: 'https://www.youtube.com/embed/BBBOQp0HEcs'
          },
          { 
            title: 'API Security and Authentication', 
            type: 'video', 
            url: 'https://www.youtube.com/embed/2Z31XTqVUXc',
            content: 'https://www.youtube.com/embed/2Z31XTqVUXc'
          },
          {
            title: 'API Documentation and Swagger',
            type: 'video',
            url: 'https://www.youtube.com/embed/zzLlvXpYRVQ',
            content: 'https://www.youtube.com/embed/zzLlvXpYRVQ'
          }
        ];
      } else if (titleLower.includes('react')) {
        return [
          { 
            title: 'React Fundamentals', 
            type: 'video', 
            url: 'https://www.youtube.com/embed/jpegXAW4Zig',
            content: 'https://www.youtube.com/embed/jpegXAW4Zig'
          },
          { 
            title: 'Components and Props', 
            type: 'video', 
            url: 'https://www.youtube.com/embed/gT2Z9ymi-kc',
            content: 'https://www.youtube.com/embed/gT2Z9ymi-kc'
          },
          { 
            title: 'State and Lifecycle', 
            type: 'video', 
            url: 'https://www.youtube.com/embed/YgxjqWrzMmE',
            content: 'https://www.youtube.com/embed/YgxjqWrzMmE'
          },
          { 
            title: 'Hooks and Custom Hooks', 
            type: 'video', 
            url: 'https://www.youtube.com/embed/O0cND4c7tE8',
            content: 'https://www.youtube.com/embed/O0cND4c7tE8'
          },
          { 
            title: 'React Router and Navigation', 
            type: 'video', 
            url: 'https://www.youtube.com/embed/Law7YNbSVgY',
            content: 'https://www.youtube.com/embed/Law7YNbSVgY'
          }
        ];
      } else if (titleLower.includes('database') || titleLower.includes('sql')) {
        return [
          { 
            title: 'Database Design Fundamentals', 
            type: 'video', 
            url: 'https://www.youtube.com/embed/qI_g07C_Q5I',
            content: 'https://www.youtube.com/embed/qI_g07C_Q5I'
          },
          { 
            title: 'SQL Basics and Queries', 
            type: 'video', 
            url: 'https://www.youtube.com/embed/9Pzj7Aj25lw',
            content: 'https://www.youtube.com/embed/9Pzj7Aj25lw'
          },
          { 
            title: 'Joins and Complex Queries', 
            type: 'video', 
            url: 'https://www.youtube.com/embed/eMJk4yknwtI',
            content: 'https://www.youtube.com/embed/eMJk4yknwtI'
          },
          { 
            title: 'Database Indexing and Performance', 
            type: 'video', 
            url: 'https://www.youtube.com/embed/C_ysIKx8VWs',
            content: 'https://www.youtube.com/embed/C_ysIKx8VWs'
          },
          { 
            title: 'Transactions and Concurrency', 
            type: 'video', 
            url: 'https://www.youtube.com/embed/IeLCKdj6Ug4',
            content: 'https://www.youtube.com/embed/IeLCKdj6Ug4'
          }
        ];
      } else {
        // Default materials
        return [
          { 
            title: 'Course Introduction Video', 
            type: 'video', 
            url: 'https://www.youtube.com/embed/8mAITcNt710',
            content: 'https://www.youtube.com/embed/8mAITcNt710'
          },
          { 
            title: 'Course Overview and Objectives', 
            type: 'video', 
            url: 'https://www.youtube.com/embed/fNxa3NG3j_M',
            content: 'https://www.youtube.com/embed/fNxa3NG3j_M'
          },
          { 
            title: 'Getting Started Guide', 
            type: 'video', 
            url: 'https://www.youtube.com/embed/DuDz6B4cqVc',
            content: 'https://www.youtube.com/embed/DuDz6B4cqVc'
          },
          { 
            title: 'Common Questions Answered', 
            type: 'video', 
            url: 'https://www.youtube.com/embed/RBSGKlAvoiM',
            content: 'https://www.youtube.com/embed/RBSGKlAvoiM'
          }
        ];
      }
    };

    // Subject-specific quiz questions
    const getQuizQuestionsForCourse = (courseTitle) => {
      const titleLower = courseTitle.toLowerCase();
      
      if (titleLower.includes('dsa') || titleLower.includes('data structure') || titleLower.includes('algorithm')) {
        return [
          {
            question: 'What is the time complexity of accessing an element in an array by index?',
            options: ['O(1)', 'O(n)', 'O(log n)', 'O(n*n)'],
            correctAnswer: '0'
          },
          {
            question: 'Which data structure follows LIFO (Last In First Out) principle?',
            options: ['Queue', 'Stack', 'Tree', 'Graph'],
            correctAnswer: '1'
          },
          {
            question: 'What is the worst-case time complexity of Quick Sort?',
            options: ['O(n log n)', 'O(n*n)', 'O(n)', 'O(log n)'],
            correctAnswer: '1'
          },
          {
            question: 'Which traversal method visits root, left subtree, then right subtree?',
            options: ['Inorder', 'Preorder', 'Postorder', 'Level order'],
            correctAnswer: '1'
          },
          {
            question: 'What is the space complexity of Merge Sort?',
            options: ['O(1)', 'O(n)', 'O(log n)', 'O(n log n)'],
            correctAnswer: '1'
          }
        ];
      } else if (titleLower.includes('js') || titleLower.includes('javascript')) {
        return [
          {
            question: 'What is the output of: console.log(typeof null)?',
            options: ['null', 'object', 'undefined', 'boolean'],
            correctAnswer: '1'
          },
          {
            question: 'Which method is used to add elements to the end of an array?',
            options: ['push()', 'pop()', 'shift()', 'unshift()'],
            correctAnswer: '0'
          },
          {
            question: 'What does the "this" keyword refer to in a regular function?',
            options: ['The function itself', 'The global object', 'The object that called the function', 'undefined'],
            correctAnswer: '2'
          },
          {
            question: 'What is the difference between let and var?',
            options: ['let is block-scoped, var is function-scoped', 'var is block-scoped, let is function-scoped', 'No difference', 'let is deprecated'],
            correctAnswer: '0'
          },
          {
            question: 'What does the spread operator (...) do?',
            options: ['Expands an array or object', 'Combines arrays', 'Copies arrays', 'All of the above'],
            correctAnswer: '3'
          }
        ];
      } else if (titleLower.includes('test') || titleLower.includes('api')) {
        return [
          {
            question: 'What does REST stand for?',
            options: ['Representational State Transfer', 'Remote State Transfer', 'Resource State Transfer', 'Representative State Transfer'],
            correctAnswer: '0'
          },
          {
            question: 'Which HTTP method is used to create a new resource?',
            options: ['GET', 'POST', 'PUT', 'DELETE'],
            correctAnswer: '1'
          },
          {
            question: 'What is the status code for "Not Found"?',
            options: ['200', '400', '404', '500'],
            correctAnswer: '2'
          },
          {
            question: 'What is API endpoint?',
            options: ['A URL where API can be accessed', 'A database table', 'A function name', 'A variable'],
            correctAnswer: '0'
          },
          {
            question: 'Which HTTP method is idempotent?',
            options: ['POST', 'PUT', 'GET', 'Both PUT and GET'],
            correctAnswer: '3'
          }
        ];
      } else {
        // Default questions
        return [
          {
            question: 'What is the main topic of this course?',
            options: ['Introduction', 'Advanced Concepts', 'Basic Fundamentals', 'All of the above'],
            correctAnswer: '3'
          },
          {
            question: 'Which of the following is a key learning objective?',
            options: ['Understanding basics', 'Mastering advanced topics', 'Practical application', 'All of the above'],
            correctAnswer: '3'
          },
          {
            question: 'How many modules does this course contain?',
            options: ['2', '3', '4', '5'],
            correctAnswer: '2'
          }
        ];
      }
    };

    for (const course of courses) {
      // Delete existing materials and quizzes to re-seed
      await CourseMaterial.destroy({ where: { CourseId: course.id } });
      await Quiz.destroy({ where: { CourseId: course.id } });

      // Add materials specific to course
      const materials = getMaterialsForCourse(course.title);
      const selectedMaterials = materials; // Use all materials instead of random
      
      for (const material of selectedMaterials) {
        await CourseMaterial.create({
          CourseId: course.id,
          title: material.title,
          type: material.type,
          url: material.url || material.content
        });
      }

      // Add quiz with subject-specific questions
      const questions = getQuizQuestionsForCourse(course.title);
      const numQuestions = Math.min(questions.length, Math.floor(Math.random() * 4) + 2); // 2-5 questions
      const selectedQuestions = questions.slice(0, numQuestions);

      const quiz = await Quiz.create({
        title: `${course.title} - Assessment Quiz`,
        CourseId: course.id
      });

      for (const q of selectedQuestions) {
        await Question.create({
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          QuizId: quiz.id
        });
      }

      console.log(`Added ${selectedMaterials.length} materials and quiz with ${selectedQuestions.length} questions to course: ${course.title}`);
    }

    console.log('Course materials and quizzes seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding course materials:', error);
    process.exit(1);
  }
})();
