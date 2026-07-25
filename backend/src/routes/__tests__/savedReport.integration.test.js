import { describe, expect, test } from '@jest/globals';
import request from 'supertest';
import '../../test/setupDb.js';
import app from '../../app.js';
import SavedReport from '../../models/SavedReport.js';

const makeUser = (prefix) => ({
  username: `${prefix}hero`.slice(0, 15),
  email: `${prefix}@riveriq.test`,
  password: 'Password123',
  passwordConfirm: 'Password123',
});

async function createLoggedInAgent(prefix = 'report') {
  const agent = request.agent(app);
  await agent.post('/api/auth/register').send(makeUser(prefix)).expect(201);
  return agent;
}

const validReport = {
  title: 'Monthly Cash Review',
  description: 'Saved report for cash game sessions',
  reportType: 'session-report',
  dateRange: {
    preset: 'Past 30 Days',
    startDate: '2026-07-01T00:00:00.000Z',
    endDate: '2026-07-31T23:59:59.999Z',
  },
  filters: {
    games: ['NL Holdem'],
    sites: ['PokerStars'],
  },
  appliedFilters: {
    result: 'winning',
  },
  sort: {
    key: 'date',
    direction: 'desc',
  },
  visibleColumnKeys: ['date', 'game', 'stakes', 'profit', 'bb100'],
  rowsPerPage: 25,
  metrics: ['profit', 'bb100', 'hands'],
  summary: {
    hands: 5000,
    profit: 735.6,
  },
  notes: 'Review before Sunday study session.',
};

describe('saved reports API integration', () => {
  test('protects saved report routes from logged-out users', async () => {
    await request(app).get('/api/saved-reports').expect(401);
    await request(app).post('/api/saved-reports').send(validReport).expect(401);
  });

  test('creates, lists, updates, and deletes a saved report for the logged-in user', async () => {
    const agent = await createLoggedInAgent();

    const createResponse = await agent.post('/api/saved-reports').send(validReport).expect(201);
    const savedReport = createResponse.body.savedReport;

    expect(savedReport).toMatchObject({
      title: validReport.title,
      reportType: validReport.reportType,
      rowsPerPage: validReport.rowsPerPage,
      visibleColumnKeys: validReport.visibleColumnKeys,
      metrics: validReport.metrics,
    });
    expect(savedReport.filters).toMatchObject(validReport.filters);
    expect(savedReport.summary).toMatchObject(validReport.summary);

    const listResponse = await agent.get('/api/saved-reports').expect(200);
    expect(listResponse.body.savedReports).toHaveLength(1);
    expect(listResponse.body.savedReports[0]._id).toBe(savedReport._id);

    const updateResponse = await agent
      .put(`/api/saved-reports/${savedReport._id}`)
      .send({
        ...validReport,
        title: 'Updated Cash Review',
        rowsPerPage: 50,
        notes: 'Updated notes',
      })
      .expect(200);

    expect(updateResponse.body.savedReport).toMatchObject({
      title: 'Updated Cash Review',
      rowsPerPage: 50,
      notes: 'Updated notes',
    });

    const deleteResponse = await agent.delete(`/api/saved-reports/${savedReport._id}`).expect(200);
    expect(deleteResponse.body).toMatchObject({
      message: 'Saved report deleted',
      id: savedReport._id,
    });
    expect(await SavedReport.countDocuments()).toBe(0);
  });

  test('validates bad saved report payloads', async () => {
    const agent = await createLoggedInAgent();

    const missingTitleResponse = await agent.post('/api/saved-reports').send({ rowsPerPage: 25 }).expect(500);
    expect(missingTitleResponse.body.message).toMatch(/report title is required/i);

    const invalidRowsResponse = await agent
      .post('/api/saved-reports')
      .send({ ...validReport, rowsPerPage: 101 })
      .expect(500);
    expect(invalidRowsResponse.body.message).toMatch(/more than maximum/i);
  });

  test('keeps saved reports scoped to their owner', async () => {
    const firstAgent = await createLoggedInAgent('firstreport');
    const secondAgent = await createLoggedInAgent('secondreport');

    const createResponse = await firstAgent.post('/api/saved-reports').send(validReport).expect(201);
    const reportId = createResponse.body.savedReport._id;

    const secondListResponse = await secondAgent.get('/api/saved-reports').expect(200);
    expect(secondListResponse.body.savedReports).toHaveLength(0);

    await secondAgent.put(`/api/saved-reports/${reportId}`).send({ ...validReport, title: 'Hijacked' }).expect(404);
    await secondAgent.delete(`/api/saved-reports/${reportId}`).expect(404);

    const firstListResponse = await firstAgent.get('/api/saved-reports').expect(200);
    expect(firstListResponse.body.savedReports).toHaveLength(1);
    expect(firstListResponse.body.savedReports[0].title).toBe(validReport.title);
  });
});
