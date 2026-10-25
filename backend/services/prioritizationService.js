const { Task } = require('../models');

/**
 * Novelty 1: Deterministic, Explainable Smart Task Prioritization Engine
 * Calculates priority score (0-100) with full mathematical and verbal breakdown.
 */
const calculateTaskPriority = (task) => {
  let score = 0;
  const breakdown = {
    basePriorityScore: 0,
    urgencyScore: 0,
    rippleEffectScore: 0,
    quickWinBonus: 0,
    stagnationPenalty: 0,
    totalScore: 0,
    explanation: [],
  };

  // 1. Base Priority Weight
  const baseWeights = {
    Critical: 40,
    High: 30,
    Medium: 20,
    Low: 10,
  };
  const base = baseWeights[task.priority] || 20;
  breakdown.basePriorityScore = base;
  score += base;
  breakdown.explanation.push(`Base priority "${task.priority}" assigns ${base} points.`);

  // 2. Deadline Urgency Factor
  if (task.dueDate) {
    const now = new Date();
    const due = new Date(task.dueDate);
    const diffMs = due.getTime() - now.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (diffDays < 0) {
      // Overdue
      breakdown.urgencyScore = 35;
      score += 35;
      breakdown.explanation.push(`Task is OVERDUE by ${Math.abs(Math.round(diffDays))} days (+35 points urgency).`);
    } else if (diffDays <= 2) {
      breakdown.urgencyScore = 25;
      score += 25;
      breakdown.explanation.push(`Task is due within 48 hours (+25 points urgency).`);
    } else if (diffDays <= 5) {
      breakdown.urgencyScore = 15;
      score += 15;
      breakdown.explanation.push(`Task is due within 5 days (+15 points urgency).`);
    } else if (diffDays <= 14) {
      breakdown.urgencyScore = 5;
      score += 5;
      breakdown.explanation.push(`Task is due within 2 weeks (+5 points urgency).`);
    } else {
      breakdown.explanation.push('Due date is more than 2 weeks out (0 points urgency).');
    }
  } else {
    breakdown.explanation.push('No deadline specified (0 points urgency).');
  }

  // 3. Downstream Dependency Ripple Effect
  // Number of tasks this task blocks (downstream dependents)
  const blockedTasksCount = task.dependencies
    ? task.dependencies.filter((d) => d.type === 'blocks').length
    : 0;
  const ripplePoints = Math.min(25, blockedTasksCount * 8);
  breakdown.rippleEffectScore = ripplePoints;
  score += ripplePoints;
  if (blockedTasksCount > 0) {
    breakdown.explanation.push(
      `This task directly blocks ${blockedTasksCount} downstream task(s) (+${ripplePoints} ripple points).`
    );
  }

  // 4. Effort Quick-Win Boost (Low effort + Urgent = High momentum)
  const effort = Number(task.estimatedEffort) || 4;
  if (effort <= 4 && breakdown.urgencyScore >= 15) {
    breakdown.quickWinBonus = 10;
    score += 10;
    breakdown.explanation.push(`Quick-win boost: Short effort (${effort}h) with pending deadline (+10 bonus points).`);
  }

  // 5. Stagnation Aging Penalty in 'To Do'
  if (task.status === 'To Do' && task.createdAt) {
    const ageDays = (new Date().getTime() - new Date(task.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    const agingPoints = Math.min(10, Math.floor(ageDays / 3));
    if (agingPoints > 0) {
      breakdown.stagnationPenalty = agingPoints;
      score += agingPoints;
      breakdown.explanation.push(
        `Task has remained unstarted for ${Math.floor(ageDays)} days (+${agingPoints} aging points).`
      );
    }
  }

  // Cap total score at 100
  const totalScore = Math.min(100, Math.max(0, score));
  breakdown.totalScore = totalScore;

  let label = 'LOW';
  if (totalScore >= 80) label = 'CRITICAL';
  else if (totalScore >= 60) label = 'HIGH';
  else if (totalScore >= 40) label = 'MEDIUM';

  return {
    score: totalScore,
    category: label,
    breakdown,
  };
};

/**
 * Batch calculate and rank tasks for a project
 */
const getPrioritizedTasks = async (projectId) => {
  const tasks = await Task.find({ project: projectId, status: { $ne: 'Done' } })
    .populate('assignee', 'name email avatar')
    .populate('dependencies.task', 'taskKey title status priority');

  const rankedTasks = tasks.map((task) => {
    const priorityResult = calculateTaskPriority(task);
    return {
      ...task.toObject(),
      priorityScore: priorityResult.score,
      priorityCategory: priorityResult.category,
      scoreBreakdown: priorityResult.breakdown,
    };
  });

  // Sort descending by priority score
  rankedTasks.sort((a, b) => b.priorityScore - a.priorityScore);

  return rankedTasks;
};

module.exports = {
  calculateTaskPriority,
  getPrioritizedTasks,
};
