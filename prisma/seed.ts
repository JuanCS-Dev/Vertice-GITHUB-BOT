import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('🌱 Seeding database with test data...');

  // Clean existing data
  await prisma.jobQueue.deleteMany();
  await prisma.constitutionalComplianceLog.deleteMany();
  await prisma.prAnalysis.deleteMany();
  await prisma.issueAnalysis.deleteMany();
  await prisma.botConfiguration.deleteMany();
  await prisma.webhookDelivery.deleteMany();
  await prisma.repository.deleteMany();

  console.log('✨ Cleaned existing data');

  // Create test repository
  const testRepo = await prisma.repository.create({
    data: {
      owner: 'vertice-collective',
      name: 'test-repository',
      fullName: 'vertice-collective/test-repository',
      htmlUrl: 'https://github.com/vertice-collective/test-repository',
      isActive: true,
      webhookId: 12345,
      configYaml: `
# Vértice Bot Configuration
features:
  issue_triage: true
  pr_review: true
  release_notes: true
  doc_generation: false

constitutional:
  required_crs: 95.0
  max_lei: 1.0
  min_coverage: 90.0

ai:
  model: gemini-1.5-flash
  temperature: 0.7
`,
    },
  });

  console.log(`✅ Created repository: ${testRepo.fullName}`);

  // Create bot configuration
  const config = await prisma.botConfiguration.create({
    data: {
      repositoryId: testRepo.id,
      enableIssueTriage: true,
      enablePRReview: true,
      enableReleaseNotes: true,
      enableDocGen: false,
      enableMergeQueue: false,
      requiredCRS: 95.0,
      maxLEI: 1.0,
      minCoverage: 90.0,
      maxProcessingTime: 300,
      geminiModel: 'gemini-1.5-flash',
      geminiTemperature: 0.7,
      contextWindow: 100000,
    },
  });

  console.log(`✅ Created bot configuration for ${testRepo.fullName}`);

  // Create sample webhook delivery
  const webhook = await prisma.webhookDelivery.create({
    data: {
      gitHubDeliveryId: 'test-delivery-12345',
      eventType: 'issues',
      action: 'opened',
      payload: {
        action: 'opened',
        issue: {
          number: 1,
          title: 'Test issue for constitutional compliance',
          body: 'This is a test issue to verify the bot is working correctly.',
          user: {
            login: 'test-user',
          },
        },
        repository: {
          full_name: testRepo.fullName,
        },
      },
      signature: 'sha256=test-signature-abc123',
      verified: true,
      processedAt: new Date(),
      constitutionalCRS: 98.5,
      lazyExecutionIndex: 0.0,
    },
  });

  console.log(`✅ Created webhook delivery: ${webhook.gitHubDeliveryId}`);

  // Create sample issue analysis
  const issueAnalysis = await prisma.issueAnalysis.create({
    data: {
      repositoryId: testRepo.id,
      issueNumber: 1,
      title: 'Bug: Application crashes on startup',
      body: 'When starting the application with `npm start`, it crashes with a null pointer exception.',
      author: 'test-user',
      classification: 'bug',
      priority: 'high',
      suggestedLabels: ['bug', 'priority:high', 'needs-investigation'],
      summary:
        'Critical bug causing application crash on startup. Requires immediate investigation of null pointer handling in initialization code.',
      analysisLEI: 0.0,
      analysisCRS: 99.0,
      confidence: 0.92,
      processedByModel: 'gemini-1.5-flash',
      processingTimeMs: 2340,
      isProcessed: true,
      processingResult: 'success',
    },
  });

  console.log(`✅ Created issue analysis for issue #${issueAnalysis.issueNumber}`);

  // Create sample PR analysis
  const prAnalysis = await prisma.prAnalysis.create({
    data: {
      repositoryId: testRepo.id,
      prNumber: 42,
      title: 'feat: Add constitutional validation framework',
      body: 'Implements the complete DETER-AGENT framework for constitutional compliance.',
      author: 'developer-1',
      filesChanged: 12,
      additions: 523,
      deletions: 87,
      qualityScore: 87.5,
      securityIssues: [],
      suggestions: [
        'Consider adding more comprehensive error handling in the validation layer',
        'Documentation could be expanded to include more usage examples',
        'Test coverage is excellent at 94%',
      ],
      summary:
        'Well-structured implementation of constitutional framework. Code quality is high with comprehensive test coverage. Minor improvements suggested for error handling and documentation.',
      reviewLEI: 0.0,
      reviewCRS: 96.5,
      confidence: 0.89,
      processedByModel: 'gemini-1.5-pro',
      processingTimeMs: 8750,
      isProcessed: true,
      processingResult: 'success',
      reviewCommentId: 987654321,
    },
  });

  console.log(`✅ Created PR analysis for PR #${prAnalysis.prNumber}`);

  // Create constitutional compliance log
  const complianceLog = await prisma.constitutionalComplianceLog.create({
    data: {
      eventType: 'pr_review',
      resourceType: 'pr',
      resourceId: prAnalysis.id,
      crs: 96.5,
      lei: 0.0,
      fpc: 98.0,
      violations: [],
      layersFailing: [],
      actionTaken: 'All constitutional checks passed. PR approved for quality.',
      humanInterventionRequired: false,
    },
  });

  console.log(`✅ Created constitutional compliance log: ${complianceLog.id}`);

  // Create sample job queue entry
  const job = await prisma.jobQueue.create({
    data: {
      jobType: 'issue_triage',
      data: {
        issueNumber: 2,
        repositoryFullName: testRepo.fullName,
        priority: 'medium',
      },
      priority: 5,
      status: 'queued',
      attempts: 0,
      maxAttempts: 3,
      scheduledFor: new Date(),
    },
  });

  console.log(`✅ Created job queue entry: ${job.jobType} (${job.id})`);

  console.log('\n🎉 Database seeding completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`   - 1 repository (${testRepo.fullName})`);
  console.log(`   - 1 bot configuration`);
  console.log(`   - 1 webhook delivery`);
  console.log(`   - 1 issue analysis`);
  console.log(`   - 1 PR analysis`);
  console.log(`   - 1 constitutional compliance log`);
  console.log(`   - 1 job queue entry`);
  console.log('\n✨ Ready for development and testing!\n');
}

main()
  .catch((error) => {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
