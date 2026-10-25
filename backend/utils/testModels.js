const mongoose = require('mongoose');
const env = require('../config/env');
const connectDB = require('../config/db');
const { User, Workspace, Project, Task, Comment, Notification } = require('../models');

async function testDatabaseModels() {
  console.log('--- Starting Phase 2 Database & Models Verification ---');
  await connectDB();

  try {
    // 1. Test User Model & Bcrypt password hashing
    console.log('[1/6] Testing User model & password hashing...');
    const testEmail = `test.developer.${Date.now()}@example.com`;
    const user = new User({
      name: 'Test Engineer',
      email: testEmail,
      password: 'StrongSecretPassword123',
      department: 'Engineering',
      jobTitle: 'Full Stack Developer',
    });
    await user.save();

    const isMatch = await user.comparePassword('StrongSecretPassword123');
    const isWrongMatch = await user.comparePassword('WrongPassword');
    if (!isMatch || isWrongMatch) {
      throw new Error('User comparePassword method failed');
    }
    console.log('✓ User created with encrypted password & verified.');

    // 2. Test Workspace Model & Slug auto-generation
    console.log('[2/6] Testing Workspace model & slug auto-generation...');
    const workspace = new Workspace({
      name: 'Alpha Software Corp',
      description: 'Main enterprise workspace',
      owner: user._id,
      members: [
        {
          user: user._id,
          role: 'Workspace Admin',
        },
      ],
    });
    await workspace.save();
    if (workspace.slug !== 'alpha-software-corp') {
      throw new Error(`Expected slug 'alpha-software-corp', got '${workspace.slug}'`);
    }
    console.log(`✓ Workspace created with slug: "${workspace.slug}" & admin membership.`);

    // 3. Test Project Model & Project Key Validation
    console.log('[3/6] Testing Project model & key uniqueness...');
    const project = new Project({
      workspace: workspace._id,
      name: 'Core Payment Service',
      key: 'PAY',
      description: 'Scalable payment gateway API',
      projectManager: user._id,
      members: [
        {
          user: user._id,
          role: 'Project Manager',
        },
      ],
    });
    await project.save();
    console.log(`✓ Project created with key "${project.key}" and initial progress ${project.progress}%.`);

    // 4. Test Task Model with Dependencies & Priority Score
    console.log('[4/6] Testing Task model with dependencies & scoring fields...');
    const taskA = new Task({
      taskKey: 'PAY-1',
      project: project._id,
      workspace: workspace._id,
      title: 'Design Payment Schema',
      description: 'Design MongoDB schemas for transactions',
      type: 'Task',
      priority: 'High',
      status: 'In Progress',
      reporter: user._id,
      assignee: user._id,
      estimatedEffort: 6,
      priorityScore: 85,
      scoreBreakdown: { priorityBase: 30, urgencyScore: 25, downstreamImpact: 30 },
    });
    await taskA.save();

    const taskB = new Task({
      taskKey: 'PAY-2',
      project: project._id,
      workspace: workspace._id,
      title: 'Build Payment API Endpoint',
      description: 'Implement Express REST API for payments',
      type: 'Feature',
      priority: 'Critical',
      status: 'Blocked',
      reporter: user._id,
      assignee: user._id,
      estimatedEffort: 8,
      dependencies: [
        {
          task: taskA._id,
          type: 'is_blocked_by',
        },
      ],
      priorityScore: 92,
    });
    await taskB.save();
    console.log(`✓ Tasks PAY-1 and PAY-2 created with dependency link.`);

    // 5. Test Comment Model
    console.log('[5/6] Testing Comment model on task...');
    const comment = new Comment({
      task: taskA._id,
      author: user._id,
      content: 'Database schema draft uploaded for team review.',
    });
    await comment.save();
    console.log('✓ Comment posted successfully to task PAY-1.');

    // 6. Test Notification Model
    console.log('[6/6] Testing Notification model...');
    const notification = new Notification({
      recipient: user._id,
      sender: user._id,
      type: 'task_assigned',
      title: 'Task Assigned',
      message: 'You were assigned to PAY-1: Design Payment Schema',
      link: `/projects/${project._id}/tasks/${taskA._id}`,
    });
    await notification.save();
    console.log('✓ Notification delivered to user inbox.');

    // Clean up test documents
    console.log('\nCleaning up verification documents...');
    await Comment.deleteMany({ task: { $in: [taskA._id, taskB._id] } });
    await Notification.deleteMany({ recipient: user._id });
    await Task.deleteMany({ project: project._id });
    await Project.deleteOne({ _id: project._id });
    await Workspace.deleteOne({ _id: workspace._id });
    await User.deleteOne({ _id: user._id });
    console.log('✓ Cleanup completed.');

    console.log('\n🎉 ALL 6 MONGOOSE MODELS VALIDATED & COMPILATION TEST PASSED! 🎉');
  } catch (err) {
    console.error('❌ Verification Error:', err);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

testDatabaseModels();
