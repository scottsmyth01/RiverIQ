import { DeleteObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { afterEach, describe, expect, jest, test } from '@jest/globals';
import { buildHandHistoryRecords, r2 } from '../uploadToR2Middleware.js';

const originalNodeEnv = process.env.NODE_ENV;

afterEach(() => {
  process.env.NODE_ENV = originalNodeEnv;
  jest.restoreAllMocks();
});

describe('uploadToR2Middleware', () => {
  test('cleans up successful hand history uploads when a later R2 upload fails', async () => {
    process.env.NODE_ENV = 'production';
    const firstFile = {
      originalname: 'first hand history.txt',
      buffer: Buffer.from('first'),
      mimetype: 'text/plain',
      size: 5,
    };
    const secondFile = {
      originalname: 'second hand history.txt',
      buffer: Buffer.from('second'),
      mimetype: 'text/plain',
      size: 6,
    };
    const r2SendSpy = jest
      .spyOn(r2, 'send')
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce(new Error('R2 upload failed'))
      .mockResolvedValueOnce({});

    await expect(buildHandHistoryRecords([firstFile, secondFile], 'user-1')).rejects.toThrow(/r2 upload failed/i);

    expect(r2SendSpy).toHaveBeenCalledTimes(3);
    expect(r2SendSpy.mock.calls[0][0]).toBeInstanceOf(PutObjectCommand);
    expect(r2SendSpy.mock.calls[1][0]).toBeInstanceOf(PutObjectCommand);
    expect(r2SendSpy.mock.calls[2][0]).toBeInstanceOf(DeleteObjectCommand);
    expect(r2SendSpy.mock.calls[2][0].input).toMatchObject({
      Bucket: process.env.R2_BUCKET_NAME_HH,
      Key: expect.stringMatching(/first-hand-history\.txt$/),
    });
  });
});
