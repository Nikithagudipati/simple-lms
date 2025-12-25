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

    // Subject-specific materials with real YouTube videos and PDFs
    const getMaterialsForCourse = (courseTitle) => {
      const titleLower = courseTitle.toLowerCase();
      
      if (titleLower.includes('dsa') || titleLower.includes('data structure') || titleLower.includes('algorithm')) {
        return [
          { title: 'Introduction to Data Structures', type: 'video', url: 'https://www.youtube.com/embed/RBSGKlAvoiM' },
          { title: 'Arrays and Linked Lists Explained', type: 'video', url: 'https://www.youtube.com/embed/DuDz6B4cqVc' },
          { title: 'DSA Fundamentals PDF', type: 'pdf', url: 'https://www.cs.cmu.edu/~15110-s13/Wing06-ct.pdf' },
          { title: 'Tree and Graph Data Structures', type: 'video', url: 'https://www.youtube.com/embed/09_LlHjoEiY' }
        ];
      } else if (titleLower.includes('js') || titleLower.includes('javascript')) {
        return [
          { title: 'JavaScript Basics Tutorial', type: 'video', url: 'https://www.youtube.com/embed/W6NZfCO5SIk' },
          { title: 'JavaScript Functions and Scope', type: 'video', url: 'https://www.youtube.com/embed/N8ap4k_5Qkw' },
          { title: 'JavaScript ES6+ Features', type: 'video', url: 'https://www.youtube.com/embed/NCwa_xi0Uuc' },
          { title: 'JavaScript Reference Guide', type: 'pdf', url: 'https://eloquentjavascript.net/Eloquent_JavaScript.pdf' }
        ];
      } else if (titleLower.includes('test') || titleLower.includes('api')) {
        return [
          { title: 'API Testing Fundamentals', type: 'video', url: 'https://www.youtube.com/embed/videoseries?list=PLhW3qG5bs-L-oT0GenwPLcJAPD_SiFK3C' },
          { title: 'REST API Best Practices', type: 'video', url: 'https://www.youtube.com/embed/7YcW25PHnAA' },
          { title: 'API Documentation Guide', type: 'pdf', url: 'https://www.w3.org/TR/2004/REC-ws-arch-20040211/wsa.pdf' }
        ];
      } else {
        // Default materials
        return [
          { title: 'Course Introduction Video', type: 'video', url: 'https://www.youtube.com/embed/8mAITcNt710' },
          { title: 'Fundamentals Overview', type: 'video', url: 'https://www.youtube.com/embed/fNxa3NG3j_M' },
          { title: 'Course Materials PDF', type: 'pdf', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' }
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
            options: ['O(1)', 'O(n)', 'O(log n)', 'O(n²)'],
            correctAnswer: '0'
          },
          {
            question: 'Which data structure follows LIFO (Last In First Out) principle?',
            options: ['Queue', 'Stack', 'Tree', 'Graph'],
            correctAnswer: '1'
          },
          {
            question: 'What is the worst-case time complexity of Quick Sort?',
            options: ['O(n log n)', 'O(n²)', 'O(n)', 'O(log n)'],
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
      const numMaterials = Math.min(materials.length, Math.floor(Math.random() * 3) + 2); // 2-4 materials
      const selectedMaterials = materials.slice(0, numMaterials);
      
      for (const material of selectedMaterials) {
        await CourseMaterial.create({
          CourseId: course.id,
          title: material.title,
          type: material.type,
          url: material.url
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
