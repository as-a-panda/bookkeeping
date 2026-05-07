import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.use(authenticate);

router.get('/csv', async (req: AuthRequest, res: Response) => {
  const { startDate, endDate } = req.query as Record<string, string>;

  const where: any = { userId: req.userId };
  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = new Date(startDate);
    if (endDate) where.date.lte = new Date(endDate);
  }

  const transactions = await prisma.transaction.findMany({
    where,
    include: { account: true, category: true },
    orderBy: { date: 'desc' },
  });

  const headers = '日期,类型,分类,账户,金额,描述,备注\n';
  const rows = transactions
    .map((t) => {
      const date = t.date.toISOString().slice(0, 10);
      const type = t.type === 'INCOME' ? '收入' : t.type === 'EXPENSE' ? '支出' : '转账';
      const category = t.category?.name || '';
      const account = t.account?.name || '';
      const amount = t.type === 'EXPENSE' ? `-${t.amount}` : `${t.amount}`;
      const description = t.description || '';
      const note = t.note || '';
      return `${date},${type},${category},${account},${amount},${description},${note}`;
    })
    .join('\n');

  const csv = '﻿' + headers + rows;

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename=transactions_${new Date().toISOString().slice(0, 10)}.csv`);
  res.send(csv);
});

export default router;
