# 🔌 API Endpoints Reference

## New Endpoints Added

### 1. GET /student/pending-quizzes
Get all pending quizzes for the logged-in student.

**Request**:
```bash
curl -H "Authorization: Bearer {token}" \
  http://localhost:5000/api/student/pending-quizzes
```

**Response**:
```json
[
  {
    "id": 1,
    "title": "JavaScript Basics Quiz",
    "courseId": 5,
    "courseName": "JavaScript Fundamentals",
    "totalQuestions": 10
  },
  {
    "id": 2,
    "title": "Python Basics Quiz",
    "courseId": 6,
    "courseName": "Python Programming",
    "totalQuestions": 8
  }
]
```

**Usage**: Dashboard "Pending Quizzes" tab

---

### 2. GET /student/quiz-scores-by-course
Get all quiz scores for the logged-in student, grouped by course.

**Request**:
```bash
curl -H "Authorization: Bearer {token}" \
  http://localhost:5000/api/student/quiz-scores-by-course
```

**Response**:
```json
[
  {
    "id": 1,
    "quizTitle": "JavaScript Basics Quiz",
    "courseName": "JavaScript Fundamentals",
    "score": 8,
    "totalQuestions": 10,
    "percentage": 80,
    "date": "2024-12-29T10:30:00Z"
  },
  {
    "id": 2,
    "quizTitle": "Python Basics Quiz",
    "courseName": "Python Programming",
    "score": 7,
    "totalQuestions": 8,
    "percentage": 88,
    "date": "2024-12-28T15:45:00Z"
  }
]
```

**Usage**: Dashboard "Quiz Scores" tab

---

### 3. POST /student/materials/:materialId/complete
Mark a course material as completed by the student.

**Request**:
```bash
curl -X POST \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  http://localhost:5000/api/student/materials/123/complete
```

**Response**:
```json
{
  "msg": "Material marked as completed",
  "materialId": 123
}
```

**Usage**: Track material viewing progress

---

### 4. GET /student/course/:courseId/materials
Get all course materials for an enrolled course.

**Request**:
```bash
curl -H "Authorization: Bearer {token}" \
  http://localhost:5000/api/student/course/5/materials
```

**Response**:
```json
[
  {
    "id": 1,
    "CourseId": 5,
    "title": "JavaScript Basics Tutorial",
    "type": "video",
    "content": "https://www.youtube.com/embed/W6NZfCO5SIk",
    "createdAt": "2024-12-25T00:00:00Z",
    "updatedAt": "2024-12-25T00:00:00Z"
  },
  {
    "id": 2,
    "CourseId": 5,
    "title": "Functions and Scope",
    "type": "video",
    "content": "https://www.youtube.com/embed/N8ap4k_5Qkw",
    "createdAt": "2024-12-25T00:00:00Z",
    "updatedAt": "2024-12-25T00:00:00Z"
  }
]
```

**Usage**: Fetch materials for display (with enrollment check)

---

### 5. GET /student/quiz/:quizId
Get quiz details with all questions.

**Request**:
```bash
curl -H "Authorization: Bearer {token}" \
  http://localhost:5000/api/student/quiz/1
```

**Response**:
```json
{
  "id": 1,
  "title": "JavaScript Basics Quiz",
  "courseId": 5,
  "questions": [
    {
      "id": 1,
      "question": "What does JS stand for?",
      "options": ["JavaScript", "JScript", "Java"],
      "correctAnswer": 0
    },
    {
      "id": 2,
      "question": "Which is a primitive type?",
      "options": ["string", "object", "array"],
      "correctAnswer": 0
    }
  ],
  "totalQuestions": 2,
  "previousAttempt": true,
  "previousScore": 1,
  "previousPercentage": 50,
  "message": "You already scored 50% on this quiz. You may retake to try again."
}
```

**Usage**: Load quiz for taking/retaking

---

### 6. POST /student/quiz/:quizId/submit
Submit quiz answers and get score.

**Request**:
```bash
curl -X POST \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "answers": {
      "1": 0,
      "2": 0
    }
  }' \
  http://localhost:5000/api/student/quiz/1/submit
```

**Response**:
```json
{
  "score": 2,
  "totalQuestions": 2,
  "percentage": 100,
  "passed": true
}
```

**Usage**: Submit quiz and get immediate feedback

---

## Updated Endpoints (Previously Broken)

### GET /student/quiz/:quizId (WAS: /quizzes/:quizId)
**Changed**: Now uses `/student/` prefix for proper routing

### POST /student/quiz/:quizId/submit (WAS: /quizzes/:quizId/submit)
**Changed**: Now uses `/student/` prefix for proper routing

---

## Error Responses

### 403 - Not Enrolled
```json
{
  "msg": "Not enrolled in this course"
}
```

### 404 - Not Found
```json
{
  "msg": "Quiz not found"
}
```

### 500 - Server Error
```json
{
  "msg": "Server error: [error details]"
}
```

---

## Frontend API Functions

Updated in `src/utils/api.js`:

```javascript
// Get pending quizzes for dashboard
apiGetPendingQuizzesData() → GET /student/pending-quizzes

// Get quiz scores by course
apiGetQuizScoresByCourse() → GET /student/quiz-scores-by-course

// Mark material as completed
apiMarkMaterialAsCompleted(materialId) → POST /student/materials/:materialId/complete

// Get quiz for taking
apiGetQuiz(quizId) → GET /student/quiz/:quizId

// Submit quiz answers
apiSubmitQuiz(quizId, answers) → POST /student/quiz/:quizId/submit

// Get course materials
apiGetCourseMaterials(courseId) → GET /student/course/:courseId/materials
```

---

## Security Features

✅ **JWT Token Required**: All endpoints require valid Bearer token
✅ **Role Verification**: `role('student')` middleware on all student endpoints
✅ **Enrollment Check**: Verify student is enrolled before accessing course resources
✅ **Query Filtering**: Only returns data for authenticated user
✅ **Error Messages**: Helpful but secure error messages

---

## Response Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | Success | Quiz loaded successfully |
| 400 | Bad Request | Invalid quiz ID format |
| 403 | Forbidden | Not enrolled in course |
| 404 | Not Found | Quiz does not exist |
| 500 | Server Error | Database connection failed |

---

## Testing with cURL

### Login and Get Token
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}' \
  http://localhost:5000/api/auth/login
```

### Use Token in Requests
```bash
# Store token
TOKEN="your_token_here"

# Get pending quizzes
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/student/pending-quizzes

# Get quiz scores
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/student/quiz-scores-by-course

# Get quiz with questions
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/student/quiz/1

# Submit quiz
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"answers":{"1":0,"2":1}}' \
  http://localhost:5000/api/student/quiz/1/submit
```

---

## Integration Points

### Dashboard Component
- Calls `apiGetPendingQuizzesData()` for Pending Quizzes tab
- Calls `apiGetQuizScoresByCourse()` for Quiz Scores tab

### CourseDetail Component
- Calls `apiGetQuiz()` when taking quiz
- Calls `apiSubmitQuiz()` when submitting answers
- Calls `apiMarkMaterialAsCompleted()` when material viewed

### Enrollment Checks
- All endpoints verify student is enrolled
- Returns 403 if not enrolled
- Frontend shows "Enroll to access" message

---

## Data Flow

```
1. Student clicks "Take Quiz"
   ↓
2. Frontend calls GET /student/quiz/:quizId
   ↓
3. Backend verifies enrollment
   ↓
4. Returns quiz with questions
   ↓
5. Student selects answers
   ↓
6. Frontend calls POST /student/quiz/:quizId/submit
   ↓
7. Backend calculates score
   ↓
8. Updates enrollment progress
   ↓
9. Returns score and percentage
   ↓
10. Student sees results
```

---

*API Reference - Last Updated: December 29, 2024*
