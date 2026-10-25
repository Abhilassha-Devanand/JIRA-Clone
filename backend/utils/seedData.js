const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const env = require('../config/env');
const {
  User,
  Workspace,
  Project,
  Task,
  Comment,
  Notification,
} = require('../models');
const { TASK_STATUSES, TASK_PRIORITIES, TASK_TYPES, NOTIFICATION_TYPES } = require('./constants');

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting comprehensive Viva Demonstration Data Seeding...');
    await mongoose.connect(env.MONGO_URI);
    console.log('✅ Connected to MongoDB:', env.MONGO_URI);

    // Clear existing collections
    console.log('🧹 Clearing old collections...');
    await Promise.all([
      User.deleteMany({}),
      Workspace.deleteMany({}),
      Project.deleteMany({}),
      Task.deleteMany({}),
      Comment.deleteMany({}),
      Notification.deleteMany({}),
    ]);

    // 1. Create Users
    console.log('👤 Creating users...');
    const rawPassword = 'Password123!';

    const sarah = await User.create({
      name: 'Sarah Connor',
      email: 'sarah.connor@cyberdyne.io',
      password: rawPassword,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      jobTitle: 'Lead Software Architect',
      department: 'Engineering',
    });

    const miles = await User.create({
      name: 'Miles Dyson',
      email: 'miles.dyson@cyberdyne.io',
      password: rawPassword,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      jobTitle: 'Principal AI Researcher & PM',
      department: 'Research & Development',
    });

    const john = await User.create({
      name: 'John Connor',
      email: 'john.connor@cyberdyne.io',
      password: rawPassword,
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
      jobTitle: 'Senior Systems Engineer',
      department: 'Infrastructure',
    });

    const kyle = await User.create({
      name: 'Kyle Reese',
      email: 'kyle.reese@cyberdyne.io',
      password: rawPassword,
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
      jobTitle: 'QA & Security Specialist',
      department: 'Security Operations',
    });

    console.log('✅ 4 Users created.');


    // 2. Create Workspace
    console.log('🏢 Creating workspace...');
    const { ROLES } = require('./constants');
    const workspace = await Workspace.create({
      name: 'Cyberdyne Tech Solutions',
      slug: 'cyberdyne-tech-solutions',
      description: 'Enterprise Autonomous Systems and Neural Computing Workspace',
      owner: sarah._id,
      members: [
        { user: sarah._id, role: ROLES.WORKSPACE_ADMIN },
        { user: miles._id, role: ROLES.WORKSPACE_ADMIN },
        { user: john._id, role: ROLES.TEAM_MEMBER },
        { user: kyle._id, role: ROLES.TEAM_MEMBER },
      ],
    });

    console.log('✅ Workspace created:', workspace.name);

    // 3. Create Projects
    console.log('📁 Creating projects...');
    const now = new Date();
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const inThreeWeeks = new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000);
    const inSixWeeks = new Date(now.getTime() + 42 * 24 * 60 * 60 * 1000);

    const projectNNC = await Project.create({
      name: 'Neural Network Core',
      key: 'NNC',
      description: 'Next-generation distributed neuromorphic compute backend and inference engine.',
      workspace: workspace._id,
      projectManager: miles._id,
      status: 'Active',
      startDate: twoWeeksAgo,
      dueDate: inThreeWeeks,
      members: [
        { user: sarah._id, role: ROLES.TEAM_MEMBER },
        { user: miles._id, role: ROLES.PROJECT_MANAGER },
        { user: john._id, role: ROLES.TEAM_MEMBER },
        { user: kyle._id, role: ROLES.TEAM_MEMBER },
      ],
      taskCounter: 8,
      progress: 25,
    });

    const projectADG = await Project.create({
      name: 'Autonomous Defense Grid',
      key: 'ADG',
      description: 'Automated perimeter telemetry, threat evaluation, and sensor gateway.',
      workspace: workspace._id,
      projectManager: sarah._id,
      status: 'Planning',
      startDate: now,
      dueDate: inSixWeeks,
      members: [
        { user: sarah._id, role: ROLES.PROJECT_MANAGER },
        { user: john._id, role: ROLES.TEAM_MEMBER },
        { user: kyle._id, role: ROLES.TEAM_MEMBER },
      ],
      taskCounter: 2,
      progress: 0,
    });


    console.log('✅ 2 Projects created (NNC, ADG).');

    // 4. Create Tasks in NNC
    console.log('📋 Creating tasks for NNC with dependencies & bottlenecks...');
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const inTwoDays = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
    const inFiveDays = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
    const inTwelveDays = new Date(now.getTime() + 12 * 24 * 60 * 60 * 1000);

    // Task 1: Done
    const t1 = await Task.create({
      taskKey: 'NNC-1',
      project: projectNNC._id,
      workspace: workspace._id,
      title: 'Setup Distributed Neural Pipeline Architecture',
      description: 'Design the baseline distributed worker pool for tensor evaluation.',
      type: TASK_TYPES.FEATURE,
      priority: TASK_PRIORITIES.HIGH,
      status: TASK_STATUSES.DONE,
      assignee: miles._id,
      reporter: sarah._id,
      dueDate: yesterday,
      estimatedEffort: 8,
      actualEffort: 7,
      labels: ['Architecture', 'Core'],
      order: 0,
    });

    // Task 2: In Progress (Bottleneck: blocks NNC-3)
    const t2 = await Task.create({
      taskKey: 'NNC-2',
      project: projectNNC._id,
      workspace: workspace._id,
      title: 'Implement Real-time Tensor Inference Engine',
      description: 'Build CUDA-accelerated matrix dispatching and model caching.',
      type: TASK_TYPES.FEATURE,
      priority: TASK_PRIORITIES.CRITICAL,
      status: TASK_STATUSES.IN_PROGRESS,
      assignee: john._id,
      reporter: miles._id,
      dueDate: inTwoDays,
      estimatedEffort: 16,
      labels: ['Inference', 'CUDA', 'Performance'],
      order: 0,
    });

    // Task 3: Blocked (Blocked by NNC-2)
    const t3 = await Task.create({
      taskKey: 'NNC-3',
      project: projectNNC._id,
      workspace: workspace._id,
      title: 'API Gateway Rate Limiting & JWT Validation',
      description: 'Secure inference endpoints with token bucket throttling.',
      type: TASK_TYPES.TASK,
      priority: TASK_PRIORITIES.HIGH,
      status: TASK_STATUSES.BLOCKED,
      assignee: john._id,
      reporter: sarah._id,
      dueDate: inFiveDays,
      estimatedEffort: 8,
      labels: ['Security', 'API'],
      order: 0,
      dependencies: [
        { task: t2._id, type: 'is_blocked_by' },
      ],
    });

    // Update t2 with reciprocal dependency
    t2.dependencies.push({ task: t3._id, type: 'blocks' });
    await t2.save();

    // Task 4: To Do (Overdue critical QA regression)
    const t4 = await Task.create({
      taskKey: 'NNC-4',
      project: projectNNC._id,
      workspace: workspace._id,
      title: 'Automated Benchmark & Regression Test Suite',
      description: 'Verify floating-point precision across multi-node configurations.',
      type: TASK_TYPES.BUG,
      priority: TASK_PRIORITIES.CRITICAL,
      status: TASK_STATUSES.TO_DO,
      assignee: kyle._id,
      reporter: miles._id,
      dueDate: yesterday, // Overdue! Demonstrates risk & urgency boost
      estimatedEffort: 12,
      labels: ['Testing', 'Regression'],
      order: 0,
    });

    // Task 5: To Do (Security audit)
    const t5 = await Task.create({
      taskKey: 'NNC-5',
      project: projectNNC._id,
      workspace: workspace._id,
      title: 'Perimeter Threat Modeling & Vulnerability Scan',
      description: 'Run automated SonarQube and OWASP penetration checks.',
      type: TASK_TYPES.TASK,
      priority: TASK_PRIORITIES.HIGH,
      status: TASK_STATUSES.TO_DO,
      assignee: kyle._id,
      reporter: sarah._id,
      dueDate: inFiveDays,
      estimatedEffort: 14,
      labels: ['Security', 'Compliance'],
      order: 1,
    });

    // Task 6: To Do (Quick Win)
    const t6 = await Task.create({
      taskKey: 'NNC-6',
      project: projectNNC._id,
      workspace: workspace._id,
      title: 'Memory Footprint Garbage Collection Optimization',
      description: 'Tune V8 heap buffers to reduce unreferenced tensor handles.',
      type: TASK_TYPES.TASK,
      priority: TASK_PRIORITIES.MEDIUM,
      status: TASK_STATUSES.TO_DO,
      assignee: sarah._id,
      reporter: sarah._id,
      dueDate: inTwoDays,
      estimatedEffort: 3, // Quick win!
      labels: ['Performance'],
      order: 2,
    });

    // Task 7: In Progress (Telemetry)
    const t7 = await Task.create({
      taskKey: 'NNC-7',
      project: projectNNC._id,
      workspace: workspace._id,
      title: 'WebSocket Live Telemetry & Latency Streaming',
      description: 'Stream server FPS and active GPU memory to monitoring dashboard.',
      type: TASK_TYPES.FEATURE,
      priority: TASK_PRIORITIES.MEDIUM,
      status: TASK_STATUSES.IN_PROGRESS,
      assignee: sarah._id,
      reporter: miles._id,
      dueDate: inTwelveDays,
      estimatedEffort: 6,
      labels: ['Telemetry', 'WebSockets'],
      order: 1,
    });

    // Task 8: To Do (Unassigned candidate)
    const t8 = await Task.create({
      taskKey: 'NNC-8',
      project: projectNNC._id,
      workspace: workspace._id,
      title: 'Grafana Dashboard Metrics Integration',
      description: 'Expose Prometheus endpoint on `/metrics` for cluster monitoring.',
      type: TASK_TYPES.TASK,
      priority: TASK_PRIORITIES.LOW,
      status: TASK_STATUSES.TO_DO,
      assignee: null, // Unassigned: ideal for Assignee Recommender testing!
      reporter: miles._id,
      dueDate: inTwelveDays,
      estimatedEffort: 4,
      labels: ['Monitoring', 'DevOps'],
      order: 3,
    });

    // Tasks for ADG Project
    await Task.create({
      taskKey: 'ADG-1',
      project: projectADG._id,
      workspace: workspace._id,
      title: 'Hardware Sensor Gateway Driver Specification',
      description: 'Draft SPI and I2C protocol integration specs.',
      type: TASK_TYPES.TASK,
      priority: TASK_PRIORITIES.HIGH,
      status: TASK_STATUSES.TO_DO,
      assignee: john._id,
      reporter: sarah._id,
      dueDate: inThreeWeeks,
      estimatedEffort: 8,
      labels: ['Embedded', 'IoT'],
      order: 0,
    });

    await Task.create({
      taskKey: 'ADG-2',
      project: projectADG._id,
      workspace: workspace._id,
      title: 'Radar & LiDAR Fusion Filter Prototype',
      description: 'Implement Kalman filter algorithm for multi-sensor point clouds.',
      type: TASK_TYPES.FEATURE,
      priority: TASK_PRIORITIES.CRITICAL,
      status: TASK_STATUSES.TO_DO,
      assignee: sarah._id,
      reporter: sarah._id,
      dueDate: inThreeWeeks,
      estimatedEffort: 16,
      labels: ['Sensors', 'Algorithm'],
      order: 1,
    });

    console.log('✅ Tasks created for NNC and ADG.');

    // 5. Create Comments
    console.log('💬 Creating realistic task comments...');
    await Comment.create({
      task: t2._id,
      author: john._id,
      content: 'Kernel optimizations on CUDA streams are complete. Achieving 120 FPS baseline.',
    });

    await Comment.create({
      task: t2._id,
      author: miles._id,
      content: 'Excellent progress John! Keep an eye on VRAM fragmentation during long batches.',
    });

    await Comment.create({
      task: t3._id,
      author: john._id,
      content: 'I have prepared the token bucket algorithm, currently blocked on NNC-2 inference hooks.',
    });

    await Comment.create({
      task: t4._id,
      author: sarah._id,
      content: 'This test suite is critical before our milestone presentation next week.',
    });

    console.log('✅ Comments created.');

    // 6. Create Notifications
    console.log('🔔 Creating in-app notifications...');
    await Notification.create({
      recipient: sarah._id,
      sender: john._id,
      type: NOTIFICATION_TYPES.COMMENT_ADDED,
      title: 'Comment on NNC-2',
      message: 'John Connor commented: "Kernel optimizations on CUDA streams are complete."',
      link: `/projects/${projectNNC._id}`,
      isRead: false,
    });

    await Notification.create({
      recipient: sarah._id,
      sender: miles._id,
      type: NOTIFICATION_TYPES.TASK_ASSIGNED,
      title: 'Task Assigned: NNC-6',
      message: 'You were assigned to "Memory Footprint Garbage Collection Optimization".',
      link: `/projects/${projectNNC._id}`,
      isRead: false,
    });

    await Notification.create({
      recipient: john._id,
      sender: sarah._id,
      type: NOTIFICATION_TYPES.TASK_ASSIGNED,
      title: 'Task Assigned: NNC-2',
      message: 'You were assigned to "Implement Real-time Tensor Inference Engine".',
      link: `/projects/${projectNNC._id}`,
      isRead: true,
    });

    console.log('✅ Notifications created.');

    console.log('====================================================');
    console.log('🎉 SEEDING COMPLETE! Viva Demo Accounts Ready:');
    console.log('👑 Admin: sarah.connor@cyberdyne.io / Password123!');
    console.log('🎯 PM:    miles.dyson@cyberdyne.io  / Password123!');
    console.log('💻 Dev:   john.connor@cyberdyne.io  / Password123!');
    console.log('🛡️ QA:    kyle.reese@cyberdyne.io   / Password123!');
    console.log('====================================================');

    await mongoose.connection.close();
    console.log('Database connection closed cleanly.');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
