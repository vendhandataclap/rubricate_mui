import type {
  Domain, Subdomain, Question, Expert, Assessment,
  AssessmentResponse, QuestionBank, GradingRun, DashboardStats, Recruiter
} from '../types';

// ── Domains ──
export const mockDomains: Domain[] = [
  { id: 'd1', name: 'Machine Learning', description: 'ML algorithms, model training, evaluation', created_at: '2025-12-01T10:00:00Z' },
  { id: 'd2', name: 'Data Engineering', description: 'Pipelines, ETL, data warehousing', created_at: '2025-12-01T10:00:00Z' },
  { id: 'd3', name: 'NLP', description: 'Natural language processing and LLMs', created_at: '2025-12-05T10:00:00Z' },
  { id: 'd4', name: 'Computer Vision', description: 'Image recognition, object detection', created_at: '2025-12-10T10:00:00Z' },
];

export const mockSubdomains: Subdomain[] = [
  { id: 's1', domain_id: 'd1', name: 'Supervised Learning', description: 'Classification and regression', created_at: '2025-12-01T10:00:00Z' },
  { id: 's2', domain_id: 'd1', name: 'Unsupervised Learning', description: 'Clustering and dimensionality reduction', created_at: '2025-12-01T10:00:00Z' },
  { id: 's3', domain_id: 'd1', name: 'Deep Learning', description: 'Neural network architectures', created_at: '2025-12-02T10:00:00Z' },
  { id: 's4', domain_id: 'd2', name: 'ETL Pipelines', description: 'Extract, transform, load processes', created_at: '2025-12-01T10:00:00Z' },
  { id: 's5', domain_id: 'd2', name: 'Data Warehousing', description: 'Schema design and optimization', created_at: '2025-12-01T10:00:00Z' },
  { id: 's6', domain_id: 'd3', name: 'Text Classification', description: 'Sentiment analysis, topic modeling', created_at: '2025-12-05T10:00:00Z' },
  { id: 's7', domain_id: 'd3', name: 'LLM Engineering', description: 'Prompt engineering, fine-tuning', created_at: '2025-12-05T10:00:00Z' },
  { id: 's8', domain_id: 'd4', name: 'Object Detection', description: 'YOLO, R-CNN architectures', created_at: '2025-12-10T10:00:00Z' },
];

// ── Questions ──
export const mockQuestions: Question[] = [
  {
    id: 'q1', domain_id: 'd1', subdomain_id: 's1', question_type: 'open_text', difficulty_tier: 'mid',
    status: 'active', prompt: '<p>Explain the bias-variance tradeoff in machine learning. Provide a concrete example of how you would diagnose and address high variance in a production model.</p>',
    grading_rubric: 'Award 3 points for correct definition of bias and variance. Award 3 points for explanation of the tradeoff. Award 4 points for a concrete, practical example with specific techniques (regularization, more data, feature selection).',
    max_score: 10, time_limit_minutes: 15, min_response_length: 200, tags: ['fundamentals', 'model-evaluation'],
    created_at: '2025-12-15T10:00:00Z', updated_at: '2025-12-15T10:00:00Z'
  },
  {
    id: 'q2', domain_id: 'd1', subdomain_id: 's1', question_type: 'comparison', difficulty_tier: 'senior',
    status: 'active', prompt: '<p>Compare the two model evaluation approaches below. Which is more appropriate for a production recommendation system with severe class imbalance? Justify your choice.</p>',
    context_a: 'Approach A: Use accuracy as the primary metric. Split data 80/20 for train/test. Perform 5-fold cross-validation on the training set. Select the model with highest average accuracy.',
    context_b: 'Approach B: Use PR-AUC as the primary metric. Use stratified time-based splits. Perform nested cross-validation with the outer loop for evaluation and inner loop for hyperparameter tuning.',
    grading_rubric: 'Award 4 points for correctly identifying Approach B as superior. Award 3 points for explaining why accuracy fails with class imbalance. Award 3 points for discussing time-based splits and nested CV benefits.',
    max_score: 10, time_limit_minutes: 20, min_response_length: 250, tags: ['evaluation', 'production'],
    created_at: '2025-12-16T10:00:00Z', updated_at: '2025-12-16T10:00:00Z'
  },
  {
    id: 'q3', domain_id: 'd1', subdomain_id: 's3', question_type: 'error_identification', difficulty_tier: 'mid',
    status: 'active', prompt: '<p>Review the following training pipeline code. Identify the critical error that would cause data leakage and explain how to fix it.</p>',
    context_a: `from sklearn.preprocessing import StandardScaler\nfrom sklearn.model_selection import train_test_split\nfrom sklearn.linear_model import LogisticRegression\n\n# Load data\nX, y = load_data()\n\n# Scale features\nscaler = StandardScaler()\nX_scaled = scaler.fit_transform(X)\n\n# Split data\nX_train, X_test, y_train, y_test = train_test_split(X_scaled, y, test_size=0.2)\n\n# Train model\nmodel = LogisticRegression()\nmodel.fit(X_train, y_train)\nprint(f"Test accuracy: {model.score(X_test, y_test)}")`,
    grading_rubric: 'Award 5 points for identifying the data leakage: scaling before splitting. Award 5 points for explaining the correct approach: fit scaler on training data only, then transform test data.',
    max_score: 10, time_limit_minutes: 10, min_response_length: 150, tags: ['data-leakage', 'pipelines'],
    created_at: '2025-12-17T10:00:00Z', updated_at: '2025-12-17T10:00:00Z'
  },
  {
    id: 'q4', domain_id: 'd2', subdomain_id: 's4', question_type: 'ranking', difficulty_tier: 'junior',
    status: 'active', prompt: '<p>Rank the following data pipeline components in the order they should be executed for a batch ETL job processing raw user events into an analytics-ready table.</p>',
    ranking_items: [
      { id: 'r1', text: 'Apply business logic transformations and aggregations', correct_order: 3 },
      { id: 'r2', text: 'Extract raw events from source database', correct_order: 1 },
      { id: 'r3', text: 'Load transformed data into the analytics warehouse', correct_order: 4 },
      { id: 'r4', text: 'Validate schema and deduplicate records', correct_order: 2 },
    ],
    grading_rubric: 'Award 2.5 points for each item in the correct position. Partial credit: 1 point if item is within one position of correct.',
    max_score: 10, time_limit_minutes: 10, min_response_length: 100, tags: ['etl', 'pipelines'],
    created_at: '2025-12-18T10:00:00Z', updated_at: '2025-12-18T10:00:00Z'
  },
  {
    id: 'q5', domain_id: 'd3', subdomain_id: 's7', question_type: 'multiple_choice', difficulty_tier: 'junior',
    status: 'draft', prompt: '<p>When fine-tuning a large language model for a specific classification task, which approach is most parameter-efficient?</p>',
    choices: [
      { id: 'c1', text: 'Full fine-tuning of all model parameters', is_correct: false },
      { id: 'c2', text: 'LoRA (Low-Rank Adaptation)', is_correct: true },
      { id: 'c3', text: 'Training from scratch with the task-specific dataset', is_correct: false },
      { id: 'c4', text: 'Prompt tuning with a frozen base model', is_correct: false },
    ],
    grading_rubric: 'Award 3 points for selecting LoRA. Award 7 points for explanation quality: must mention parameter efficiency, rank decomposition concept, and practical benefits over full fine-tuning.',
    max_score: 10, time_limit_minutes: 8, min_response_length: 100, tags: ['llm', 'fine-tuning'],
    created_at: '2025-12-19T10:00:00Z', updated_at: '2025-12-19T10:00:00Z'
  },
  {
    id: 'q6', domain_id: 'd1', subdomain_id: 's2', question_type: 'open_text', difficulty_tier: 'senior',
    status: 'active', prompt: '<p>Describe a production-ready approach to anomaly detection in a high-dimensional streaming dataset. Address feature engineering, model selection, and monitoring strategy.</p>',
    grading_rubric: 'Award 3 points for feature engineering approach (PCA, autoencoders). Award 4 points for model selection with justification (Isolation Forest, DBSCAN, autoencoder reconstruction error). Award 3 points for monitoring strategy (drift detection, threshold tuning, alerting).',
    max_score: 10, time_limit_minutes: 20, min_response_length: 300, tags: ['anomaly-detection', 'streaming'],
    created_at: '2025-12-20T10:00:00Z', updated_at: '2025-12-20T10:00:00Z'
  },
  {
    id: 'q7', domain_id: 'd4', subdomain_id: 's8', question_type: 'open_text', difficulty_tier: 'mid',
    status: 'archived', prompt: '<p>Compare YOLO and Faster R-CNN for real-time object detection. When would you choose one over the other?</p>',
    grading_rubric: 'Award 5 points for accurate architecture comparison. Award 5 points for practical use-case recommendations.',
    max_score: 10, time_limit_minutes: 15, min_response_length: 200, tags: ['object-detection', 'architecture'],
    created_at: '2025-11-01T10:00:00Z', updated_at: '2025-12-01T10:00:00Z'
  },
  {
    id: 'q8', domain_id: 'd2', subdomain_id: 's5', question_type: 'open_text', difficulty_tier: 'mid',
    status: 'active', prompt: '<p>Explain the differences between star schema and snowflake schema. When is each more appropriate in a modern data warehouse?</p>',
    grading_rubric: 'Award 4 points for accurate structural differences. Award 3 points for performance implications. Award 3 points for appropriate use-case recommendations.',
    max_score: 10, time_limit_minutes: 12, min_response_length: 200, tags: ['schema-design', 'warehousing'],
    created_at: '2025-12-22T10:00:00Z', updated_at: '2025-12-22T10:00:00Z'
  },
];

// ── Question Banks ──
export const mockQuestionBanks: QuestionBank[] = [
  { id: 'qb1', domain_id: 'd1', difficulty_tier: 'mid', name: 'ML Mid-Level Assessment', question_ids: ['q1', 'q3'], is_active: true, created_at: '2025-12-20T10:00:00Z' },
  { id: 'qb2', domain_id: 'd1', difficulty_tier: 'senior', name: 'ML Senior Assessment', question_ids: ['q2', 'q6'], is_active: true, created_at: '2025-12-20T10:00:00Z' },
  { id: 'qb3', domain_id: 'd2', difficulty_tier: 'junior', name: 'DE Junior Assessment', question_ids: ['q4', 'q8'], is_active: true, created_at: '2025-12-21T10:00:00Z' },
];

// ── Experts ──
export const mockExperts: Expert[] = [
  { id: 'e1', full_name: 'Sarah Chen', email: 'sarah.chen@example.com', primary_domain_id: 'd1', seniority_level: 'senior', years_experience: 9, onboarding_status: 'assessment_complete', profile_completed_at: '2026-01-10T08:00:00Z', created_at: '2026-01-08T10:00:00Z' },
  { id: 'e2', full_name: 'James Rodriguez', email: 'james.r@example.com', primary_domain_id: 'd1', seniority_level: 'mid', years_experience: 4, onboarding_status: 'assessment_complete', profile_completed_at: '2026-01-12T09:00:00Z', created_at: '2026-01-10T10:00:00Z' },
  { id: 'e3', full_name: 'Aisha Patel', email: 'aisha.p@example.com', primary_domain_id: 'd2', seniority_level: 'junior', years_experience: 1, onboarding_status: 'assessment_complete', profile_completed_at: '2026-01-14T14:00:00Z', created_at: '2026-01-12T10:00:00Z' },
  { id: 'e4', full_name: 'Michael Thompson', email: 'michael.t@example.com', primary_domain_id: 'd3', seniority_level: null, years_experience: 5, onboarding_status: 'profile_complete', profile_completed_at: '2026-01-15T11:00:00Z', created_at: '2026-01-14T10:00:00Z' },
  { id: 'e5', full_name: 'Elena Volkov', email: 'elena.v@example.com', primary_domain_id: 'd1', seniority_level: 'mid', years_experience: 3, onboarding_status: 'approved', profile_completed_at: '2026-01-05T10:00:00Z', created_at: '2026-01-03T10:00:00Z' },
  { id: 'e6', full_name: 'David Kim', email: 'david.kim@example.com', primary_domain_id: 'd4', seniority_level: 'mid', years_experience: 5, onboarding_status: 'profile_complete', profile_completed_at: '2026-01-16T09:00:00Z', created_at: '2026-01-15T10:00:00Z' },
  { id: 'e7', full_name: 'Priya Sharma', email: 'priya.s@example.com', primary_domain_id: 'd2', seniority_level: 'senior', years_experience: 11, onboarding_status: 'rejected', profile_completed_at: '2026-01-02T08:00:00Z', created_at: '2026-01-01T10:00:00Z' },
];

// ── Assessments ──
export const mockAssessments: Assessment[] = [
  {
    id: 'a1', expert_id: 'e1', domain_id: 'd1', difficulty_tier: 'senior', status: 'graded',
    max_possible_score: 20, total_score: 17, percentage: 85, ai_recommendation: 'pass',
    ai_summary: 'Strong candidate with deep understanding of machine learning fundamentals and production systems. Demonstrates excellent ability to diagnose model issues and propose practical solutions. Minor gaps in distributed systems knowledge.',
    strengths: ['Exceptional model evaluation methodology', 'Strong production ML experience', 'Clear technical communication'],
    gaps: ['Limited distributed training experience', 'Could improve on streaming ML approaches'],
    recruiter_decision: null, recruiter_id: null, recruiter_notes: null, decided_at: null,
    flag_count: 0, question_count: 2, started_at: '2026-01-11T10:00:00Z', submitted_at: '2026-01-11T10:45:00Z',
    graded_at: '2026-01-11T10:46:00Z', assigned_at: '2026-01-11T08:00:00Z', expires_at: '2026-01-18T08:00:00Z', created_at: '2026-01-11T08:00:00Z',
    expert: { id: 'e1', full_name: 'Sarah Chen', email: 'sarah.chen@example.com', primary_domain_id: 'd1', seniority_level: 'senior', years_experience: 9, onboarding_status: 'assessment_complete', profile_completed_at: '2026-01-10T08:00:00Z', created_at: '2026-01-08T10:00:00Z' },
  },
  {
    id: 'a2', expert_id: 'e2', domain_id: 'd1', difficulty_tier: 'mid', status: 'graded',
    max_possible_score: 20, total_score: 12, percentage: 60, ai_recommendation: 'review',
    ai_summary: 'Candidate demonstrates solid fundamentals but inconsistent depth. Strong on theoretical concepts but weaker on practical implementation details. One response flagged for potential quality concerns.',
    strengths: ['Good theoretical understanding', 'Clear writing style'],
    gaps: ['Lacks production experience detail', 'Weak on implementation specifics', 'Data leakage identification was incomplete'],
    recruiter_decision: null, recruiter_id: null, recruiter_notes: null, decided_at: null,
    flag_count: 1, question_count: 2, started_at: '2026-01-13T14:00:00Z', submitted_at: '2026-01-13T14:50:00Z',
    graded_at: '2026-01-13T14:51:00Z', assigned_at: '2026-01-13T09:00:00Z', expires_at: '2026-01-20T09:00:00Z', created_at: '2026-01-13T09:00:00Z',
    expert: { id: 'e2', full_name: 'James Rodriguez', email: 'james.r@example.com', primary_domain_id: 'd1', seniority_level: 'mid', years_experience: 4, onboarding_status: 'assessment_complete', profile_completed_at: '2026-01-12T09:00:00Z', created_at: '2026-01-10T10:00:00Z' },
  },
  {
    id: 'a3', expert_id: 'e3', domain_id: 'd2', difficulty_tier: 'junior', status: 'graded',
    max_possible_score: 20, total_score: 5, percentage: 25, ai_recommendation: 'fail',
    ai_summary: 'Candidate shows very limited understanding of data engineering concepts. Responses were shallow and contained significant factual errors. Not recommended at this time.',
    strengths: ['Attempted all questions'],
    gaps: ['Fundamental gaps in ETL understanding', 'Schema design knowledge insufficient', 'Responses lacked technical depth'],
    recruiter_decision: null, recruiter_id: null, recruiter_notes: null, decided_at: null,
    flag_count: 0, question_count: 2, started_at: '2026-01-15T10:00:00Z', submitted_at: '2026-01-15T10:30:00Z',
    graded_at: '2026-01-15T10:31:00Z', assigned_at: '2026-01-15T09:00:00Z', expires_at: '2026-01-22T14:00:00Z', created_at: '2026-01-15T14:00:00Z',
    expert: { id: 'e3', full_name: 'Aisha Patel', email: 'aisha.p@example.com', primary_domain_id: 'd2', seniority_level: 'junior', years_experience: 1, onboarding_status: 'assessment_complete', profile_completed_at: '2026-01-14T14:00:00Z', created_at: '2026-01-12T10:00:00Z' },
  },
  {
    id: 'a4', expert_id: 'e5', domain_id: 'd1', difficulty_tier: 'mid', status: 'reviewed',
    max_possible_score: 20, total_score: 16, percentage: 80, ai_recommendation: 'pass',
    ai_summary: 'Excellent candidate with thorough understanding across all tested areas. Clear communication and strong practical examples. Highly recommended.',
    strengths: ['Comprehensive answers', 'Excellent practical examples', 'Strong production mindset'],
    gaps: ['Minor gaps in deep learning theory'],
    recruiter_decision: 'approved', recruiter_id: 'r1', recruiter_notes: 'Strong candidate, approved for expert pool.', decided_at: '2026-01-07T15:00:00Z',
    flag_count: 0, question_count: 2, started_at: '2026-01-06T10:00:00Z', submitted_at: '2026-01-06T10:40:00Z',
    graded_at: '2026-01-06T10:41:00Z', assigned_at: '2026-01-06T09:00:00Z', expires_at: '2026-01-13T10:00:00Z', created_at: '2026-01-06T10:00:00Z',
    expert: { id: 'e5', full_name: 'Elena Volkov', email: 'elena.v@example.com', primary_domain_id: 'd1', seniority_level: 'mid', years_experience: 3, onboarding_status: 'approved', profile_completed_at: '2026-01-05T10:00:00Z', created_at: '2026-01-03T10:00:00Z' },
  },
  {
    id: 'a5', expert_id: 'e7', domain_id: 'd2', difficulty_tier: 'senior', status: 'reviewed',
    max_possible_score: 20, total_score: 7, percentage: 35, ai_recommendation: 'fail',
    ai_summary: 'Despite senior-level experience claim, responses showed fundamental misunderstandings. Multiple factual errors detected.',
    strengths: ['Some awareness of data pipeline concepts'],
    gaps: ['Critical misunderstandings of schema design', 'ETL best practices not followed', 'Inconsistent with claimed experience level'],
    recruiter_decision: 'rejected', recruiter_id: 'r1', recruiter_notes: 'Responses do not align with claimed 11 years of experience. Rejected.', decided_at: '2026-01-04T11:00:00Z',
    flag_count: 2, question_count: 2, started_at: '2026-01-03T09:00:00Z', submitted_at: '2026-01-03T09:25:00Z',
    graded_at: '2026-01-03T09:26:00Z', assigned_at: '2026-01-03T08:00:00Z', expires_at: '2026-01-10T08:00:00Z', created_at: '2026-01-03T08:00:00Z',
    expert: { id: 'e7', full_name: 'Priya Sharma', email: 'priya.s@example.com', primary_domain_id: 'd2', seniority_level: 'senior', years_experience: 11, onboarding_status: 'rejected', profile_completed_at: '2026-01-02T08:00:00Z', created_at: '2026-01-01T10:00:00Z' },
  },
];

// ── Assessment Responses ──
export const mockAssessmentResponses: AssessmentResponse[] = [
  // Assessment a1 (Sarah Chen - senior ML)
  {
    id: 'ar1', assessment_id: 'a1', question_id: 'q2', order_index: 0,
    response_text: 'Approach B is clearly superior for a production recommendation system with severe class imbalance. Accuracy is a misleading metric when classes are imbalanced — a model could achieve 99% accuracy by simply predicting the majority class. PR-AUC (Precision-Recall Area Under Curve) directly measures performance on the minority class, which is critical for recommendation relevance.\n\nStratified time-based splits are essential because recommendation data has temporal dependencies — using future data to predict past behaviour would cause data leakage. Nested cross-validation properly separates hyperparameter tuning from model evaluation, preventing optimistic bias in performance estimates.\n\nIn my production experience at a major e-commerce platform, switching from accuracy to PR-AUC as our primary metric revealed that our "best" model was actually performing poorly on the items users cared most about.',
    ai_score: 9, override_score: null, ai_feedback: 'Excellent analysis. Correctly identified Approach B with thorough justification covering class imbalance, temporal dependencies, and practical experience.', ai_reasoning: 'Strong comparative reasoning with clear production context.', recruiter_feedback: null, is_flagged: false, flag_reason: null, submitted_at: '2026-01-11T10:20:00Z',
    question: mockQuestions.find(q => q.id === 'q2'),
  },
  {
    id: 'ar2', assessment_id: 'a1', question_id: 'q6', order_index: 1,
    response_text: 'For production anomaly detection in high-dimensional streaming data, I recommend a layered approach:\n\nFeature Engineering: Apply PCA or autoencoder-based dimensionality reduction as a first stage. For streaming data, use incremental PCA variants that update with each batch. Create statistical features (rolling means, standard deviations, percentile ranks) over configurable time windows.\n\nModel Selection: I would use an autoencoder with reconstruction error as the primary anomaly signal. The threshold can be set at the 99th percentile of training reconstruction errors. As a secondary model, Isolation Forest works well for structured features and can provide interpretable anomaly scores. Ensemble the two for robust detection.\n\nMonitoring: Implement concept drift detection using the Page-Hinkley test on the reconstruction error distribution. Set up multi-tier alerting — warning at 2σ, critical at 3σ from baseline. Retrain models monthly or when drift is detected. Track precision of flagged anomalies through human review feedback loops.',
    ai_score: 8, override_score: null, ai_feedback: 'Strong response covering all three areas. Feature engineering section could have mentioned more advanced streaming-specific techniques. Model selection and monitoring strategies are well-thought-out.', ai_reasoning: 'Solid production anomaly detection plan with monitoring considerations.', recruiter_feedback: null, is_flagged: false, flag_reason: null, submitted_at: '2026-01-11T10:45:00Z',
    question: mockQuestions.find(q => q.id === 'q6'),
  },
  // Assessment a2 (James Rodriguez - mid ML)
  {
    id: 'ar3', assessment_id: 'a2', question_id: 'q1', order_index: 0,
    response_text: 'The bias-variance tradeoff is about finding the right model complexity. Bias is when your model is too simple and misses patterns (underfitting), and variance is when your model is too complex and memorizes noise (overfitting).\n\nTo diagnose high variance, I would look at the gap between training and validation performance. If training accuracy is 98% but validation is 75%, that\'s a clear sign of high variance.\n\nTo fix it, you could try regularization like L1/L2, get more training data, or reduce model complexity by removing features.',
    ai_score: 6, override_score: null, ai_feedback: 'Adequate definition of bias and variance. The diagnostic approach is correct but could be more detailed. Fix suggestions are valid but lack depth — no specific example from production experience.', ai_reasoning: 'Correct high-level explanation with limited production depth.', recruiter_feedback: null, is_flagged: false, flag_reason: null, submitted_at: '2026-01-13T14:25:00Z',
    question: mockQuestions.find(q => q.id === 'q1'),
  },
  {
    id: 'ar4', assessment_id: 'a2', question_id: 'q3', order_index: 1,
    response_text: 'The error in the code is that the data is being split incorrectly. The train_test_split should use stratified splitting to maintain class balance. You should add stratify=y to the split function.\n\nAlso, the model should use cross-validation instead of a single train/test split for more reliable results.',
    ai_score: 6, override_score: null, ai_feedback: 'The candidate missed the primary error: StandardScaler is fit on the entire dataset before splitting, causing data leakage. While stratified splitting and cross-validation are valid suggestions, they are not the critical issue in this code.', ai_reasoning: 'Missed the leakage issue and emphasized secondary concerns.', recruiter_feedback: null, is_flagged: true, flag_reason: 'Candidate missed the primary error (data leakage from scaling before splitting). Response focuses on secondary concerns.', submitted_at: '2026-01-13T14:50:00Z',
    question: mockQuestions.find(q => q.id === 'q3'),
  },
  // Assessment a3 (Aisha Patel - junior DE)
  {
    id: 'ar5', assessment_id: 'a3', question_id: 'q4', order_index: 0,
    response_text: 'I think the order should be: extract data, then transform it, then validate, then load it into the warehouse. The extraction comes first because you need the data before you can do anything with it.',
    ai_score: 3, override_score: null, ai_feedback: 'Extraction correctly placed first, but validation should come before transformation, not after. The ordering shows a fundamental misunderstanding of ETL best practices — data quality checks should prevent bad data from being transformed.', ai_reasoning: 'Incorrect ordering of ETL stages.', recruiter_feedback: null, is_flagged: false, flag_reason: null, submitted_at: '2026-01-15T10:15:00Z',
    question: mockQuestions.find(q => q.id === 'q4'),
  },
  {
    id: 'ar6', assessment_id: 'a3', question_id: 'q8', order_index: 1,
    response_text: 'Star schema and snowflake schema are both used in data warehouses. Star schema has a fact table in the middle with dimension tables around it. Snowflake schema is similar but the dimension tables are normalized into sub-tables. Star schema is simpler and faster for queries.',
    ai_score: 2, override_score: null, ai_feedback: 'Very surface-level response. While the basic structural difference is mentioned, there is no discussion of performance implications, storage tradeoffs, or appropriate use cases. Minimum expectations for even a junior-level response were not met.', ai_reasoning: 'Superficial explanation with missing tradeoff discussion.', recruiter_feedback: null, is_flagged: false, flag_reason: null, submitted_at: '2026-01-15T10:30:00Z',
    question: mockQuestions.find(q => q.id === 'q8'),
  },
  // Assessment a4 (Elena Volkov - mid ML - reviewed/approved)
  {
    id: 'ar7', assessment_id: 'a4', question_id: 'q1', order_index: 0,
    response_text: 'The bias-variance tradeoff represents the fundamental tension in model complexity selection. Bias measures systematic error — how far the average model prediction is from the true value. Variance measures sensitivity to training data fluctuations.\n\nHigh variance diagnosis: Compare learning curves between training and validation sets. A large gap that persists even with more data suggests high variance. I diagnosed this in production when our gradient boosted model showed 99.2% train AUC but only 81% on holdout. The fix involved: (1) reducing tree depth from 12 to 6, (2) adding L2 regularization (lambda=0.1), (3) implementing early stopping with patience=10, and (4) adding 20% feature dropout. This brought holdout AUC to 93% while training dropped to 95% — a much healthier gap.',
    ai_score: 9, override_score: null, ai_feedback: 'Excellent response with precise definitions, practical diagnostic methodology, and a detailed production example with specific parameter choices and measurable outcomes.', ai_reasoning: 'Excellent technical explanation with concrete production example.', recruiter_feedback: null, is_flagged: false, flag_reason: null, submitted_at: '2026-01-06T10:20:00Z',
    question: mockQuestions.find(q => q.id === 'q1'),
  },
  {
    id: 'ar8', assessment_id: 'a4', question_id: 'q3', order_index: 1,
    response_text: 'The critical data leakage error is that StandardScaler.fit_transform() is called on the entire dataset X before train_test_split. This means the scaler\'s mean and standard deviation are computed using test data, which leaks information about the test distribution into the training process.\n\nThe correct approach:\n1. First split the data: X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)\n2. Fit the scaler on training data only: scaler.fit(X_train)\n3. Transform both sets: X_train_scaled = scaler.transform(X_train), X_test_scaled = scaler.transform(X_test)\n\nThis ensures the model is evaluated on truly unseen data. In practice, I use sklearn Pipeline objects to encapsulate preprocessing and model steps, which automatically handles this correctly during cross-validation.',
    ai_score: 7, override_score: null, ai_feedback: 'Correctly identified the data leakage issue with a clear explanation of the fix. Bonus for mentioning Pipeline objects as a best practice.', ai_reasoning: 'Correctly identified leakage and proposed proper preprocessing workflow.', recruiter_feedback: null, is_flagged: false, flag_reason: null, submitted_at: '2026-01-06T10:40:00Z',
    question: mockQuestions.find(q => q.id === 'q3'),
  },
];

// ── Grading Runs ──
export const mockGradingRuns: GradingRun[] = [
  { id: 'gr1', assessment_id: 'a1', question_id: 'q2', run_type: 'per_question', success: true, input_tokens: 1850, output_tokens: 320, estimated_cost: 0.035, error_message: null, created_at: '2026-01-11T10:46:00Z' },
  { id: 'gr2', assessment_id: 'a1', question_id: 'q6', run_type: 'per_question', success: true, input_tokens: 2100, output_tokens: 280, estimated_cost: 0.038, error_message: null, created_at: '2026-01-11T10:46:30Z' },
  { id: 'gr3', assessment_id: 'a1', question_id: null, run_type: 'summary', success: true, input_tokens: 1200, output_tokens: 450, estimated_cost: 0.028, error_message: null, created_at: '2026-01-11T10:47:00Z' },
];

// ── Dashboard Stats ──
export const mockAdminStats: DashboardStats = {
  totalQuestions: mockQuestions.length,
  activeQuestions: mockQuestions.filter(q => q.status === 'active').length,
  totalDomains: mockDomains.length,
  totalAssessments: mockAssessments.length,
  pendingReview: mockAssessments.filter(a => a.status === 'graded').length,
  passRate: 40,
  avgScore: 57,
  flagRate: 12,
};

// ── Recruiters ──
export const mockRecruiters: Recruiter[] = [
  { id: 'r1', full_name: 'Alice Johnson', email: 'alice.johnson@example.com', phone: '+1-555-0101', company: 'Tech Talent Inc', domain_ids: ['d1', 'd2'], status: 'active', created_at: '2026-01-05T10:00:00Z' },
  { id: 'r2', full_name: 'Bob Smith', email: 'bob.smith@example.com', phone: '+1-555-0102', company: 'AI Hiring Ltd', domain_ids: ['d3', 'd4'], status: 'active', created_at: '2026-01-10T10:00:00Z' },
  { id: 'r3', full_name: 'Carol White', email: 'carol.white@example.com', phone: '+1-555-0103', company: 'DataJobs Plus', domain_ids: ['d1', 'd3'], status: 'active', created_at: '2026-01-12T10:00:00Z' },
  { id: 'r4', full_name: 'Diana Lee', email: 'diana.lee@example.com', phone: '+1-555-0104', company: 'ML Recruiters', domain_ids: ['d2'], status: 'inactive', created_at: '2025-12-20T10:00:00Z' },
];

export const mockRecruiterStats = {
  pendingReview: mockAssessments.filter(a => a.status === 'graded').length,
  completedReviews: mockAssessments.filter(a => a.status === 'reviewed').length,
  totalAssessments: mockAssessments.length,
  passRate: 40,
  avgScore: 57,
  flagRate: 20,
  recentApplications: mockExperts.filter(e => e.onboarding_status === 'profile_complete').length,
};

// Helper to get domain name by ID
export function getDomainName(id: string): string {
  return mockDomains.find(d => d.id === id)?.name ?? 'Unknown';
}

// Helper to get subdomain name by ID
export function getSubdomainName(id: string): string {
  return mockSubdomains.find(s => s.id === id)?.name ?? '';
}

// Helper to get responses for an assessment
export function getAssessmentResponses(assessmentId: string): AssessmentResponse[] {
  return mockAssessmentResponses.filter(r => r.assessment_id === assessmentId);
}
